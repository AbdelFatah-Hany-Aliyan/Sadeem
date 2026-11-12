import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  approveMemberAction,
  rejectMemberAction,
  suspendMemberAction,
  reactivateMemberAction,
  resendInvitationAction,
} from "@/app/admin/company/actions";
import { MemberStatus, AdminRole } from "@prisma/client";
import {
  Users,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  FolderKanban,
  CheckSquare,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const session = await getSession();
  const canApprove = session ? hasPermission(session.role, "invitations:approve") : false;
  const canSuspend = session ? hasPermission(session.role, "members:suspend") : false;
  const canInvite = session ? hasPermission(session.role, "invitations:create") : false;

  const member = await prisma.companyMember.findUnique({
    where: { id: params.id },
    include: {
      adminUser: true,
      memberships: {
        include: { team: true },
        orderBy: { isPrimary: "desc" },
      },
      projectAssignments: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      assignedTasks: {
        include: { project: true, team: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      receivedRecommendations: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!member) {
    notFound();
  }

  const primaryTeam = member.memberships.find((m) => m.isPrimary)?.team;

  async function handleApprove(formData: FormData) {
    "use server";
    await approveMemberAction(formData);
  }

  async function handleReject(formData: FormData) {
    "use server";
    await rejectMemberAction(formData);
  }

  async function handleSuspend(formData: FormData) {
    "use server";
    await suspendMemberAction(formData);
  }

  async function handleReactivate(formData: FormData) {
    "use server";
    await reactivateMemberAction(formData);
  }

  async function handleResend(formData: FormData) {
    "use server";
    await resendInvitationAction(formData);
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/admin/company/members"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>العودة لقائمة الأعضاء / Back to Members</span>
        </Link>
      </div>

      {/* Member Hero Profile Card */}
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center font-bold text-accent text-2xl shadow-inner">
              {member.fullNameAr
                ? member.fullNameAr.charAt(0)
                : member.fullNameEn.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {member.fullNameAr || member.fullNameEn}
                </h1>
                {member.status === MemberStatus.ACTIVE && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ACTIVE
                  </span>
                )}
                {member.status === MemberStatus.ACCEPTED && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    ACCEPTED — NEEDS APPROVAL
                  </span>
                )}
                {member.status === MemberStatus.INVITED && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    INVITED
                  </span>
                )}
                {member.status === MemberStatus.SUSPENDED && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    SUSPENDED
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono">{member.fullNameEn}</p>
              <p className="text-xs text-foreground font-semibold mt-1">
                {member.jobTitleAr || member.jobTitleEn}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* If ACCEPTED -> Approval Form */}
            {member.status === MemberStatus.ACCEPTED && canApprove && (
              <form action={handleApprove} className="flex items-center gap-2">
                <input type="hidden" name="memberId" value={member.id} />
                <select
                  name="adminRole"
                  defaultValue="TEAM_MEMBER"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono"
                >
                  <option value="TEAM_MEMBER">Role: TEAM_MEMBER</option>
                  <option value="TEAM_LEAD">Role: TEAM_LEAD</option>
                  <option value="PROJECT_MANAGER">Role: PROJECT_MANAGER</option>
                  <option value="QA_REVIEWER">Role: QA_REVIEWER</option>
                  <option value="COMPANY_ADMIN">Role: COMPANY_ADMIN</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>اعتماد وتفعيل / Approve</span>
                </button>
              </form>
            )}

            {/* If ACCEPTED -> Reject Button */}
            {member.status === MemberStatus.ACCEPTED && canApprove && (
              <form action={handleReject}>
                <input type="hidden" name="memberId" value={member.id} />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl border border-border hover:border-red-500/40 text-muted hover:text-red-400 text-xs font-mono transition-colors"
                >
                  رفض الطلب / Reject
                </button>
              </form>
            )}

            {/* If ACTIVE -> Suspend Button */}
            {member.status === MemberStatus.ACTIVE && canSuspend && (
              <form action={handleSuspend}>
                <input type="hidden" name="memberId" value={member.id} />
                <input
                  type="hidden"
                  name="reason"
                  value="Suspended by administrator via management portal"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/10 text-muted hover:text-red-400 text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert size={14} />
                  <span>تعليق العضوية / Suspend</span>
                </button>
              </form>
            )}

            {/* If SUSPENDED -> Reactivate Button */}
            {member.status === MemberStatus.SUSPENDED && canSuspend && (
              <form action={handleReactivate}>
                <input type="hidden" name="memberId" value={member.id} />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <RotateCw size={14} />
                  <span>إلغاء التعليق / Reactivate</span>
                </button>
              </form>
            )}

            {/* If INVITED -> Resend Invite */}
            {member.status === MemberStatus.INVITED && canInvite && (
              <form action={handleResend}>
                <input type="hidden" name="memberId" value={member.id} />
                <input type="hidden" name="email" value={member.email} />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl border border-border bg-background hover:border-accent text-foreground text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <RotateCw size={14} />
                  <span>إعادة إرسال الدعوة / Resend</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background border border-border/70 space-y-1">
            <span className="text-muted flex items-center gap-1.5">
              <Mail size={13} className="text-accent" />
              البريد الإلكتروني
            </span>
            <span className="font-mono text-foreground block truncate">{member.email}</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/70 space-y-1">
            <span className="text-muted flex items-center gap-1.5">
              <Phone size={13} className="text-accent" />
              الهاتف
            </span>
            <span className="font-mono text-foreground block">
              {member.phone || "غير محدد"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/70 space-y-1">
            <span className="text-muted flex items-center gap-1.5">
              <Building2 size={13} className="text-accent" />
              القسم الأساسي
            </span>
            <span className="font-semibold text-foreground block">
              {primaryTeam ? `${primaryTeam.nameAr} (${primaryTeam.code})` : "غير مسند"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/70 space-y-1">
            <span className="text-muted flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-accent" />
              حساب لوحة التحكم
            </span>
            <span className="font-mono text-foreground block">
              {member.adminUser
                ? `${member.adminUser.role} (${member.adminUser.isActive ? "نشط" : "معطل"})`
                : "لا يوجد حساب دخول"}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Tasks & Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className="bg-surface border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-accent" />
              <h2 className="font-bold text-foreground text-sm">
                المهام المسندة ({member.assignedTasks.length})
              </h2>
            </div>
            <Link
              href={`/admin/company/tasks?assignedMemberId=${member.id}`}
              className="text-xs font-mono text-accent hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          {member.assignedTasks.length === 0 ? (
            <p className="text-xs text-muted p-4 bg-background/50 rounded-xl text-center">
              لا توجد مهام مسندة لهذا العضو حالياً
            </p>
          ) : (
            <div className="space-y-2">
              {member.assignedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-background border border-border/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted font-mono mt-0.5">
                      <span>{t.priority}</span>
                      {t.project && <span>• {t.project.slug}</span>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guidance / Recommendations */}
        <div className="bg-surface border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h2 className="font-bold text-foreground text-sm">
                التوجيهات والملاحظات الإدارية ({member.receivedRecommendations.length})
              </h2>
            </div>
          </div>

          {member.receivedRecommendations.length === 0 ? (
            <p className="text-xs text-muted p-4 bg-background/50 rounded-xl text-center">
              لا توجد توجيهات مسجلة لهذا العضو
            </p>
          ) : (
            <div className="space-y-2">
              {member.receivedRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent/10 text-accent font-semibold">
                      {rec.type}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {rec.status}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
