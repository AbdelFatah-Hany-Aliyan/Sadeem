import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  approveMemberAction,
  rejectMemberAction,
  resendInvitationAction,
} from "@/app/admin/company/actions";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const session = await getSession();
  const canApprove = session ? hasPermission(session.role, "invitations:approve") : false;
  const canInvite = session ? hasPermission(session.role, "invitations:create") : false;

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

  const getStatusBadge = (st: InvitationStatus) => {
    switch (st) {
      case InvitationStatus.ACCEPTED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            ACCEPTED — NEEDS APPROVAL
          </span>
        );
      case InvitationStatus.PENDING:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            PENDING CANDIDATE
          </span>
        );
      case InvitationStatus.DECLINED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-500/15 text-muted border border-border">
            DECLINED
          </span>
        );
      case InvitationStatus.EXPIRED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface text-muted border border-border">
            {st}
          </span>
        );
    }
  };

  const getDeliveryBadge = (ds: EmailDeliveryStatus) => {
    switch (ds) {
      case EmailDeliveryStatus.DELIVERED:
        return (
          <span className="text-[10px] font-mono text-emerald-400">DELIVERED</span>
        );
      case EmailDeliveryStatus.BLOCKED_CONFIGURATION:
        return (
          <span className="text-[10px] font-mono text-amber-400" title="Resend API key not configured">
            DEV / UNCONFIGURED
          </span>
        );
      case EmailDeliveryStatus.FAILED:
        return (
          <span className="text-[10px] font-mono text-red-400">FAILED</span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-muted">PENDING</span>
        );
    }
  };

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
                  <th className="py-4 px-6">حالة الدعوة / Status</th>
                  <th className="py-4 px-6">تسليم البريد / Email</th>
                  <th className="py-4 px-6">تاريخ الإرسال</th>
                  <th className="py-4 px-6 text-right">الإجراءات / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invitations.map((inv) => {
                  const member = inv.member;
                  const primaryTeam = member.memberships[0]?.team;

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

                      <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>

                      <td className="py-4 px-6">{getDeliveryBadge(inv.deliveryStatus)}</td>

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

                          {(inv.status === InvitationStatus.PENDING ||
                            inv.status === InvitationStatus.EXPIRED) &&
                            canInvite && (
                              <form action={handleResend} className="inline-flex">
                                <input type="hidden" name="memberId" value={member.id} />
                                <input type="hidden" name="email" value={inv.email} />
                                <button
                                  type="submit"
                                  title="إعادة إرسال الدعوة"
                                  className="p-1.5 rounded-lg border border-border hover:border-accent text-muted hover:text-foreground transition-colors"
                                >
                                  <RotateCw size={12} />
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
