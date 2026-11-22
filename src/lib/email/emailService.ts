/**
 * SADEEM — TRANSACTIONAL EMAIL SERVICE & OUTBOX
 * 
 * Configurable multi-provider transactional email service supporting:
 * 1. Gmail SMTP (Nodemailer, port 465 SSL, zero-paid service)
 * 2. Resend API (HTTP-based)
 * 3. Mock Transport (Offline testing & audit)
 * 4. Safe unconfigured fail-closed degradation (BLOCKED_CONFIGURATION)
 * 
 * Strict security invariants:
 * - Credentials kept strictly server-side (never exposed to browser or client bundles)
 * - Strict TLS certificate validation (rejectUnauthorized: true, TLSv1.2+)
 * - Credentials and raw secret tokens never emitted into logs
 * - Strict recipient fidelity: zero silent recipient rewriting
 * - Durable audit tracking via EmailOutbox model
 */

import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { EmailDeliveryStatus } from "@prisma/client";
import { renderInvitationEmailHtml, renderInvitationEmailText, InvitationEmailProps } from "./templates/invitationEmail";
import { renderActivationEmailHtml, renderActivationEmailText, ActivationEmailProps } from "./templates/activationEmail";

export type EmailProviderType = "gmail_smtp" | "resend" | "mock" | "none";

export interface SendEmailResult {
  success: boolean;
  deliveryStatus: EmailDeliveryStatus;
  outboxId?: string;
  providerId?: string;
  error?: string;
  providerUsed?: EmailProviderType;
}

/**
 * Resolves the active email provider based on configuration.
 */
export function getActiveEmailProvider(): EmailProviderType {
  const envProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
  if (envProvider === "gmail_smtp" || envProvider === "smtp") return "gmail_smtp";
  if (envProvider === "resend") return "resend";
  if (envProvider === "mock") return "mock";

  // Automatic heuristic detection
  if (process.env.SMTP_USER?.trim() && process.env.SMTP_PASSWORD?.trim()) {
    return "gmail_smtp";
  }
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    return "resend";
  }

  return "none";
}

/**
 * Checks whether transactional email sending is configured with verified credentials.
 */
export function isEmailConfigured(): boolean {
  const provider = getActiveEmailProvider();
  if (provider === "gmail_smtp") {
    return !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASSWORD?.trim());
  }
  if (provider === "resend") {
    return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
  }
  if (provider === "mock") {
    return true;
  }
  return false;
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
 * Dispatches an email via Gmail SMTP using Nodemailer.
 * Enforces strict TLS validation, authorized from-address matching, and credential redaction.
 */
async function sendViaGmailSmtp(options: {
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; providerId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "false" ? false : port === 465;
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASSWORD?.trim() || "";

  if (!user || !pass) {
    return {
      success: false,
      error: "SMTP_USER or SMTP_PASSWORD is not configured in environment.",
    };
  }

  // Ensure 'from' header matches the authorized Gmail user account
  const configuredFrom = process.env.EMAIL_FROM?.trim();
  let fromAddress: string;
  if (configuredFrom) {
    if (configuredFrom.includes("<") && configuredFrom.includes(">")) {
      const match = configuredFrom.match(/<([^>]+)>/);
      const specifiedEmail = match ? match[1].trim().toLowerCase() : "";
      if (specifiedEmail && specifiedEmail !== user.toLowerCase()) {
        const displayName = configuredFrom.replace(/<[^>]+>/, "").trim();
        fromAddress = displayName ? `"${displayName}" <${user}>` : user;
      } else {
        fromAddress = configuredFrom;
      }
    } else if (configuredFrom.toLowerCase() !== user.toLowerCase()) {
      fromAddress = `"${configuredFrom}" <${user}>`;
    } else {
      fromAddress = configuredFrom;
    }
  } else {
    fromAddress = `"Sadeem Studio" <${user}>`;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true, // Strict certificate validation
      minVersion: "TLSv1.2",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.recipientEmail,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return {
      success: true,
      providerId: info.messageId,
    };
  } catch (err: any) {
    // Sanitize error: strictly strip credentials from logs and audit entries
    const rawMsg = err?.message || "Unknown SMTP error occurred";
    const sanitizedError = pass ? rawMsg.replace(new RegExp(pass, "gi"), "[REDACTED]") : rawMsg;
    console.error(`[EMAIL_SERVICE] Gmail SMTP error: ${sanitizedError}`);
    return {
      success: false,
      error: sanitizedError,
    };
  }
}

/**
 * Dispatches an email via Resend API.
 */
async function sendViaResend(options: {
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; providerId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const fromAddress = process.env.EMAIL_FROM || "Sadeem <onboarding@sadeem.studio>";
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: options.recipientEmail,
        reply_to: replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.message || `HTTP ${res.status} from Resend API`;
      return { success: false, error: errMsg };
    }
    return { success: true, providerId: data.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network exception during Resend API call" };
  }
}

/**
 * Dispatches an email via Mock transport for isolated staging tests.
 */
async function sendViaMock(options: {
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; providerId?: string; error?: string }> {
  const mockId = `mock_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  return {
    success: true,
    providerId: mockId,
  };
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
  const normalizedRecipient = recipientEmail.trim().toLowerCase();

  // Guard against malformed or missing recipient email
  if (!normalizedRecipient || !normalizedRecipient.includes("@")) {
    throw new Error(`INVALID_RECIPIENT: Recipient '${recipientEmail}' is malformed.`);
  }

  // 1. Durably record in EmailOutbox
  const outbox = await prisma.emailOutbox.create({
    data: {
      recipientEmail: normalizedRecipient,
      subject,
      template,
      payload: payload as any,
      status: EmailDeliveryStatus.PENDING,
      attempts: 1,
      lastAttemptAt: new Date(),
    },
  });

  const provider = getActiveEmailProvider();

  // 2. Safe unconfigured fail-closed degradation
  if (!isEmailConfigured()) {
    const errorMsg =
      "No transactional email provider is configured. Safe offline degradation: real email blocked.";
    console.warn(`[EMAIL_SERVICE] Email to '${normalizedRecipient}' marked as BLOCKED_CONFIGURATION.`);

    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: EmailDeliveryStatus.BLOCKED_CONFIGURATION,
        error: errorMsg,
      },
    });

    return {
      success: false,
      deliveryStatus: EmailDeliveryStatus.BLOCKED_CONFIGURATION,
      outboxId: outbox.id,
      error: errorMsg,
      providerUsed: "none",
    };
  }

  // 3. Dispatch through configured provider
  let dispatchResult: { success: boolean; providerId?: string; error?: string };

  if (provider === "gmail_smtp") {
    dispatchResult = await sendViaGmailSmtp({
      recipientEmail: normalizedRecipient,
      subject,
      html,
      text,
    });
  } else if (provider === "resend") {
    dispatchResult = await sendViaResend({
      recipientEmail: normalizedRecipient,
      subject,
      html,
      text,
    });
  } else if (provider === "mock") {
    dispatchResult = await sendViaMock({
      recipientEmail: normalizedRecipient,
      subject,
      html,
      text,
    });
  } else {
    dispatchResult = {
      success: false,
      error: "Unknown email provider configuration.",
    };
  }

  // 4. Update durable Outbox record with provider outcome
  if (!dispatchResult.success) {
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: EmailDeliveryStatus.FAILED,
        error: dispatchResult.error || "Email delivery failed",
      },
    });

    return {
      success: false,
      deliveryStatus: EmailDeliveryStatus.FAILED,
      outboxId: outbox.id,
      error: dispatchResult.error,
      providerUsed: provider,
    };
  }

  await prisma.emailOutbox.update({
    where: { id: outbox.id },
    data: {
      status: EmailDeliveryStatus.DELIVERED,
      providerId: dispatchResult.providerId,
    },
  });

  return {
    success: true,
    deliveryStatus: EmailDeliveryStatus.DELIVERED,
    outboxId: outbox.id,
    providerId: dispatchResult.providerId,
    providerUsed: provider,
  };
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
  const normalizedRecipient = recipientEmail.trim().toLowerCase();
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
    recipientEmail: normalizedRecipient,
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
  const normalizedRecipient = recipientEmail.trim().toLowerCase();
  const baseUrl = getAppBaseUrl();
  const activationUrl = `${baseUrl}/join/activate/${token}`;

  const props: ActivationEmailProps = {
    memberName,
    activationUrl,
    expiresInHours: 24,
  };

  const subject = "تفعيل حسابك الإداري في منصة سديم";

  return await sendTransactionalEmail({
    recipientEmail: normalizedRecipient,
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
