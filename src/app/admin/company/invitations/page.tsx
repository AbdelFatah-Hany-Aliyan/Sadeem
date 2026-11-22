import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  approveMemberAction,
  rejectMemberAction,
  resendInvitationAction,
} from "@/app/admin/company/actions";
import {
  resolveInvitationLifecycle,
  isEmailConfigured,
  InvitationLifecycleInfo,
} from "@/lib/services/invitationService";
import { InvitationStatus, EmailDeliveryStatus, AdminRole } from "@prisma/client";
import {
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Mail,
  Clock,
  ShieldCheck,
  User,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const session = await getSession();
  const canApprove = session ? hasPermission(session.role, "invitations:approve") : false;
  const canInvite = session ? hasPermission(session.role, "invitations:create") : false;
  const emailConfigured = isEmailConfigured();

  const invitations = await prisma.memberInvitation.findMany({
    include: {
      member: {
        include: {
          memberships: {
            where: { isPrimary: true },
            include: { team: true },
          },
        },
      },
      invitedBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  async function handleApprove(formData: FormData) {
    "use server";
    await approveMemberAction(formData);
  }

  async function handleReject(formData: FormData) {
    "use server";
    await rejectMemberAction(formData);
  }

  async function handleResend(formData: FormData) {
    "use server";
    await resendInvitationAction(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            سجل الدعوات والاعتماد / Invitations & Approvals ({invitations.length})
          </h2>
          <p className="text-xs text-muted">
            تتبع مسار الدعوات، استجابة المرشحين، واعتماد العضوية وتفعيل الحسابات
          </p>
        </div>
      </div>

      {/* Email Configuration Warning Banner if unconfigured */}
      {!emailConfigured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 block">
              مزود البريد الإلكتروني غير مهيأ (Safe Offline Mode: Unconfigured)
            </span>
            <p className="text-muted leading-relaxed">
              لم يتم ضبط بيانات مزود البريد الإلكتروني (سواء <code className="text-foreground font-mono bg-background px-1 py-0.5 rounded">Gmail SMTP</code> أو <code className="text-foreground font-mono bg-background px-1 py-0.5 rounded">Resend API</code>) في بيئة العمل. يتم توليد وتشفير رموز الأمان في قاعدة البيانات محلياً دون إرسال بريد حقيقي للمرشحين. تظهر جميع الدعوات الجديدة بحالة <span className="text-amber-400 font-mono font-bold">BLOCKED CONFIGURATION</span>.
            </p>
          </div>
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
          <Send size={32} className="text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">لا توجد دعوات مسجلة</h3>
          <p className="text-xs text-muted">
            أرسل دعوة جديدة من خلال صفحة إضافة الأعضاء
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border text-[11px] font-mono text-muted uppercase">
                <tr>
                  <th className="py-4 px-6">المرشح / Candidate</th>
                  <th className="py-4 px-6">القسم / Team</th>
                  <th className="py-4 px-6">حالة الدعوة والإرسال / Lifecycle Status</th>
                  <th className="py-4 px-6">تاريخ الإنشاء</th>
                  <th className="py-4 px-6 text-right">الإجراءات / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invitations.map((inv) => {
                  const member = inv.member;
                  const primaryTeam = member.memberships[0]?.team;
                  const lifecycle: InvitationLifecycleInfo = resolveInvitationLifecycle(inv);

                  return (
                    <tr key={inv.id} className="hover:bg-background/40 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          href={`/admin/company/members/${member.id}`}
                          className="font-bold text-foreground hover:text-accent transition-colors block"
                        >
                          {member.fullNameAr || member.fullNameEn}
                        </Link>
                        <span className="font-mono text-muted text-[11px] block">
                          {inv.email}
                        </span>
                        {inv.invitedBy?.name && (
                          <span className="text-[10px] text-muted">
                            دعوة بواسطة: {inv.invitedBy.name}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {primaryTeam ? (
                          <span className="font-medium text-foreground">
                            {primaryTeam.nameAr} ({primaryTeam.code})
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>

                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${lifecycle.dotClass}`} />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${lifecycle.badgeClass}`}>
                            {lifecycle.labelEn}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-tight">
                          {lifecycle.labelAr}
                        </p>
                        {inv.failureReason && (
                          <p className="text-[10px] text-amber-400 font-mono bg-background/50 p-1 rounded border border-border/50 truncate max-w-xs" title={inv.failureReason}>
                            {inv.failureReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-muted text-[11px]">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === InvitationStatus.ACCEPTED && canApprove && (
                            <form action={handleApprove} className="inline-flex gap-1.5">
                              <input type="hidden" name="memberId" value={member.id} />
                              <input type="hidden" name="adminRole" value="TEAM_MEMBER" />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-mono text-[11px] font-bold uppercase transition-colors"
                              >
                                اعتماد
                              </button>
                            </form>
                          )}

                          {inv.status === InvitationStatus.ACCEPTED && canApprove && (
                            <form action={handleReject} className="inline-flex">
                              <input type="hidden" name="memberId" value={member.id} />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg border border-border hover:border-red-500 text-muted hover:text-red-400 font-mono text-[11px] transition-colors"
                              >
                                رفض
                              </button>
                            </form>
                          )}

                          {lifecycle.canRetry && canInvite && (
                            <form action={handleResend} className="inline-flex">
                              <input type="hidden" name="memberId" value={member.id} />
                              <input type="hidden" name="email" value={inv.email} />
                              <button
                                type="submit"
                                title="إعادة إرسال الدعوة (تدوير رمز الأمان)"
                                className="px-2.5 py-1.5 rounded-lg border border-border hover:border-accent text-muted hover:text-foreground text-[11px] font-mono flex items-center gap-1 transition-colors"
                              >
                                <RotateCw size={11} />
                                <span>إعادة المحاولة</span>
                              </button>
                            </form>
                          )}

                          <Link
                            href={`/admin/company/members/${member.id}`}
                            className="p-1.5 rounded-lg border border-border hover:border-accent text-muted hover:text-foreground text-[11px] font-mono"
                          >
                            الملف
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
