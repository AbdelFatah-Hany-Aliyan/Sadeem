import { verifyInvitationToken } from "@/lib/services/invitationService";
import { acceptInvitationAction, declineInvitationAction } from "@/app/join/actions";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, Building2, User, Briefcase, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    token: string;
  };
}

export default async function InvitationPage({ params }: PageProps) {
  const { token } = params;
  const verification = await verifyInvitationToken(token);
  const invitation = verification.invitation;

  const isAccepted = verification.reason === "ALREADY_ACCEPTED" || invitation?.status === "ACCEPTED";
  const isDeclined = verification.reason === "ALREADY_DECLINED" || invitation?.status === "DECLINED";

  if (!invitation || (!verification.valid && !isAccepted && !isDeclined)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <XCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            دعوة غير صالحة أو منتهية الصلاحية
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            {verification.reason || "رابط الدعوة هذا غير صحيح أو انتهت فترة صلاحيته. يرجى التواصل مع إدارة سديم للحصول على دعوة جديدة."}
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors"
            >
              العودة للرئيسية / Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const member = invitation.member;
  const primaryTeam = member.memberships?.[0]?.team;

  async function handleAccept(formData: FormData) {
    "use server";
    await acceptInvitationAction(formData);
  }

  async function handleDecline(formData: FormData) {
    "use server";
    await declineInvitationAction(formData);
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-surface/90 backdrop-blur-md border border-border rounded-3xl p-8 md:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-medium">
            <Building2 size={13} />
            <span>سديم للتقنية والابتكار — Sadeem Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            دعوة رسمية للانضمام إلى الفريق
          </h1>
          <p className="text-sm text-muted">
            يسرنا دعوتك لتكون جزءاً من فريق سديم لبناء المنتجات الريادية والأنظمة التقنية المتقدمة
          </p>
        </div>

        {/* Member & Role Card */}
        <div className="bg-background/80 border border-border/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4 border-b border-border/60 pb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg">
              {member.fullNameAr ? member.fullNameAr.charAt(0) : member.fullNameEn.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {member.fullNameAr || member.fullNameEn}
              </h2>
              {member.fullNameAr && (
                <p className="text-xs text-muted font-mono">{member.fullNameEn}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2 text-muted">
              <Briefcase size={15} className="text-accent shrink-0" />
              <span>المسمى الوظيفي:</span>
              <span className="font-semibold text-foreground">
                {member.jobTitleAr || member.jobTitleEn}
              </span>
            </div>

            {primaryTeam && (
              <div className="flex items-center gap-2 text-muted">
                <Building2 size={15} className="text-accent shrink-0" />
                <span>الفريق:</span>
                <span className="font-semibold text-foreground">
                  {primaryTeam.nameAr} ({primaryTeam.nameEn})
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted md:col-span-2">
              <Mail size={15} className="text-accent shrink-0" />
              <span>البريد الإلكتروني المعتمد:</span>
              <span className="font-mono text-foreground">{invitation.email}</span>
            </div>
          </div>
        </div>

        {/* Status Handling & Actions */}
        {isAccepted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-emerald-400">
              تم تأكيد رغبتك بالانضمام مسبقاً
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              طلب انضمامك قيد المراجعة والاعتماد من قبل الإدارة. ستصلك رسالة إلكترونية برابط تفعيل الحساب وكلمة المرور بمجرد اعتماد العضوية.
            </p>
          </div>
        ) : isDeclined ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-bold text-amber-400">
              تم تسجيل الاعتذار عن هذه الدعوة
            </h3>
            <p className="text-xs text-muted">
              تم تسجيل اعتذارك مسبقاً. شكراً لاهتمامك بسديم ونتمنى لك دوام التوفيق.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <form action={handleAccept}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>تأكيد وقبول الدعوة / Accept Invitation</span>
              </button>
            </form>

            <form action={handleDecline}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl border border-border hover:border-red-500/40 hover:bg-red-500/5 text-muted hover:text-red-400 text-xs font-mono transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={15} />
                <span>الاعتذار عن الدعوة / Decline</span>
              </button>
            </form>
          </div>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-muted font-mono">
            تنتهي صلاحية هذه الدعوة في: {new Date(invitation.expiresAt).toLocaleDateString("ar-EG")}
          </p>
        </div>
      </div>
    </div>
  );
}
