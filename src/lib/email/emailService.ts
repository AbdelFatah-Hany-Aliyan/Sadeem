/**
 * SADEEM — TRANSACTIONAL EMAIL SERVICE & OUTBOX
 * 
 * Vendor-agnostic transactional email service with Resend adapter, durable database outbox tracking,
 * and fail-safe unconfigured degradation.
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { EmailDeliveryStatus } from "@prisma/client";
import { renderInvitationEmailHtml, renderInvitationEmailText, InvitationEmailProps } from "./templates/invitationEmail";
import { renderActivationEmailHtml, renderActivationEmailText, ActivationEmailProps } from "./templates/activationEmail";

export interface SendEmailResult {
  success: boolean;
  deliveryStatus: EmailDeliveryStatus;
  outboxId?: string;
  providerId?: string;
  error?: string;
}

/**
 * Returns the configured base URL for building absolute email links.
 * Strictly uses server-side configuration, rejecting untrusted Host headers.
 */
export function getAppBaseUrl(): string {
  const envUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

/**
 * Checks whether transactional email sending is configured with verified credentials.
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
}

/**
 * Core transactional email sender with durable Outbox logging.
 */
export async function sendTransactionalEmail(options: {
  recipientEmail: string;
  subject: string;
  template: string;
  html: string;
  text: string;
  payload: Record<string, unknown>;
}): Promise<SendEmailResult> {
  const { recipientEmail, subject, template, html, text, payload } = options;

  // 1. Durably record in EmailOutbox
  const outbox = await prisma.emailOutbox.create({
    data: {
      recipientEmail,
      subject,
      template,
      payload: payload as any,
      status: EmailDeliveryStatus.PENDING,
      attempts: 1,
      lastAttemptAt: new Date(),
    },
  });

  // 2. Check if provider is configured
  if (!isEmailConfigured()) {
    console.warn(
      `[EMAIL_SERVICE] RESEND_API_KEY is not configured. Email to '${recipientEmail}' marked as BLOCKED_CONFIGURATION.`
    );

    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: EmailDeliveryStatus.BLOCKED_CONFIGURATION,
        error: "RESEND_API_KEY is missing from environment. Real email delivery safely blocked.",
      },
    });

    return {
      success: false,
      deliveryStatus: EmailDeliveryStatus.BLOCKED_CONFIGURATION,
      outboxId: outbox.id,
      error: "EMAIL_PROVIDER_UNCONFIGURED: RESEND_API_KEY not configured.",
    };
  }

  // 3. Dispatch to Resend via native fetch
  try {
    const fromAddress = process.env.EMAIL_FROM || "Sadeem <onboarding@sadeem.studio>";
    const replyTo = process.env.EMAIL_REPLY_TO || undefined;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipientEmail,
        reply_to: replyTo,
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.message || `HTTP ${res.status} from Resend API`;
      console.error(`[EMAIL_SERVICE] Resend API error: ${errMsg}`);

      await prisma.emailOutbox.update({
        where: { id: outbox.id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          error: errMsg,
        },
      });

      return {
        success: false,
        deliveryStatus: EmailDeliveryStatus.FAILED,
        outboxId: outbox.id,
        error: errMsg,
      };
    }

    // Success confirmed by provider
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: EmailDeliveryStatus.DELIVERED,
        providerId: data.id,
      },
    });

    return {
      success: true,
      deliveryStatus: EmailDeliveryStatus.DELIVERED,
      outboxId: outbox.id,
      providerId: data.id,
    };
  } catch (err: any) {
    const errMsg = err?.message || "Network exception during email dispatch";
    console.error(`[EMAIL_SERVICE] Exception during dispatch: ${errMsg}`);

    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: EmailDeliveryStatus.FAILED,
        error: errMsg,
      },
    });

    return {
      success: false,
      deliveryStatus: EmailDeliveryStatus.FAILED,
      outboxId: outbox.id,
      error: errMsg,
    };
  }
}

/**
 * High-level helper: Sends Member Invitation email.
 */
export async function sendMemberInvitationEmail(
  recipientEmail: string,
  token: string,
  details: {
    memberName: string;
    jobTitle: string;
    teamNameAr: string;
    teamNameEn: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = getAppBaseUrl();
  const invitationUrl = `${baseUrl}/join/invitation/${token}`;

  const props: InvitationEmailProps = {
    memberName: details.memberName,
    jobTitle: details.jobTitle,
    teamNameAr: details.teamNameAr,
    teamNameEn: details.teamNameEn,
    invitationUrl,
    expiresInDays: 7,
  };

  const subject = `مبارك! تمت دعوتك للانضمام إلى فريق ${details.teamNameAr} في شركة سديم`;

  return await sendTransactionalEmail({
    recipientEmail,
    subject,
    template: "member_invitation",
    html: renderInvitationEmailHtml(props),
    text: renderInvitationEmailText(props),
    payload: {
      memberName: details.memberName,
      jobTitle: details.jobTitle,
      teamNameAr: details.teamNameAr,
      // Raw token is strictly not persisted; only SHA-256 hash stored for audit correlation
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    },
  });
}

/**
 * High-level helper: Sends Account Setup / Activation email.
 */
export async function sendAccountActivationEmail(
  recipientEmail: string,
  token: string,
  memberName: string
): Promise<SendEmailResult> {
  const baseUrl = getAppBaseUrl();
  const activationUrl = `${baseUrl}/join/activate/${token}`;

  const props: ActivationEmailProps = {
    memberName,
    activationUrl,
    expiresInHours: 24,
  };

  const subject = "تفعيل حسابك الإداري في منصة سديم";

  return await sendTransactionalEmail({
    recipientEmail,
    subject,
    template: "account_activation",
    html: renderActivationEmailHtml(props),
    text: renderActivationEmailText(props),
    payload: {
      memberName,
      // Raw token is strictly not persisted; only SHA-256 hash stored for audit correlation
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    },
  });
}
