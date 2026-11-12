"use server";

import { acceptInvitation, declineInvitation } from "@/lib/services/invitationService";
import { activateMemberAccount } from "@/lib/services/companyMemberService";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Public action: Candidate accepts the invitation.
 */
export async function acceptInvitationAction(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  if (!token) {
    return { success: false, error: "رمز الدعوة مفقود / Missing invitation token" };
  }

  try {
    const result = await acceptInvitation(token);
    revalidatePath(`/join/invitation/${token}`);
    return {
      success: true,
      message: "تم تأكيد رغبتك بالانضمام بنجاح! سيتم إخطار الإدارة للمراجعة والاعتماد.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "فشل تأكيد الدعوة / Failed to accept invitation",
    };
  }
}

/**
 * Public action: Candidate declines the invitation.
 */
export async function declineInvitationAction(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  if (!token) {
    return { success: false, error: "رمز الدعوة مفقود / Missing invitation token" };
  }

  try {
    const result = await declineInvitation(token);
    revalidatePath(`/join/invitation/${token}`);
    return {
      success: true,
      message: "تم تسجيل اعتذارك عن الدعوة. شكراً لاهتمامك بسديم.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "فشل معالجة الطلب / Failed to process decline",
    };
  }
}

/**
 * Public action: Approved candidate sets their password and activates login access.
 */
export async function activateAccountAction(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, error: "رمز التفعيل مفقود / Missing activation token" };
  }

  if (!password || password.length < 8) {
    return {
      success: false,
      error: "كلمة المرور يجب أن لا تقل عن 8 خانات / Password must be at least 8 characters",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "كلمات المرور غير متطابقة / Passwords do not match",
    };
  }

  try {
    const result = await activateMemberAccount(token, password);
    revalidatePath(`/join/activate/${token}`);
    return {
      success: true,
      message: "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول للوحة التحكم.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "فشل تفعيل الحساب / Failed to activate account",
    };
  }
}
