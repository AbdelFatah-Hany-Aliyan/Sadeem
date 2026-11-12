import Link from "next/link";
import prisma from "@/lib/prisma";
import { MemberStatus, TaskStatus, InvitationStatus } from "@prisma/client";
import {
  Users,
  Layers,
  CheckSquare,
  Sparkles,
  ArrowRight,
  UserPlus,
  Clock,
  ShieldCheck,
  AlertCircle,
  FolderKanban,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyOverviewPage() {
  // Aggregate KPIs
  const [
    totalMembers,
    activeMembers,
    pendingApprovalMembers,
    invitedMembers,
    teams,
    tasksTotal,
    tasksInProgress,
    tasksInReview,
    tasksCompleted,
    recommendationsCount,
  ] = await Promise.all([
    prisma.companyMember.count(),
    prisma.companyMember.count({ where: { status: MemberStatus.ACTIVE } }),
    prisma.companyMember.count({ where: { status: MemberStatus.ACCEPTED } }),
    prisma.companyMember.count({ where: { status: MemberStatus.INVITED } }),
    prisma.companyTeam.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { memberships: true, projects: true, tasks: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.companyTask.count(),
    prisma.companyTask.count({ where: { status: TaskStatus.IN_PROGRESS } }),
    prisma.companyTask.count({ where: { status: TaskStatus.IN_REVIEW } }),
    prisma.companyTask.count({ where: { status: TaskStatus.DONE } }),
    prisma.administrativeRecommendation.count(),
  ]);

  // Fetch pending approval candidates if any
  const candidatesNeedingApproval = await prisma.companyMember.findMany({
    where: { status: MemberStatus.ACCEPTED },
    include: {
      memberships: {
        where: { isPrimary: true },
        include: { team: true },
      },
    },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Pending Approval Alert Banner */}
      {pendingApprovalMembers > 0 && (
        <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-300">
                {pendingApprovalMembers} مرشح بانتظار الاعتماد وتفعيل الحساب / Candidates Awaiting Approval
              </h2>
              <p className="text-xs text-muted">
                أكد المرشحون قبول الدعوة وهم بانتظار مراجعة الإدارة لإصدار رابط تفعيل الحساب
              </p>
            </div>
          </div>
          <Link
            href="/admin/company/invitations"
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors shrink-0"
          >
            مراجعة الطلبات / Review Now
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Members</span>
            <Users size={16} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-mono">{totalMembers}</span>
            <span className="text-xs text-emerald-400 font-mono font-medium">
              {activeMembers} Active
            </span>
          </div>
          <div className="text-[11px] text-muted flex gap-2">
            <span>{invitedMembers} Invited</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{pendingApprovalMembers} Need Approval</span>
          </div>
        </div>

        {/* Teams */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Teams</span>
            <Layers size={16} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-mono">{teams.length}</span>
            <span className="text-xs text-muted font-mono">4 Core Units</span>
          </div>
          <div className="text-[11px] text-muted truncate">
            {teams.map((t) => t.code).join(", ")}
          </div>
        </div>

        {/* Tasks */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Tasks</span>
            <CheckSquare size={16} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-mono">{tasksTotal}</span>
            <span className="text-xs text-blue-400 font-mono font-medium">
              {tasksInProgress} Active
            </span>
          </div>
          <div className="text-[11px] text-muted flex gap-2">
            <span className="text-amber-400 font-semibold">{tasksInReview} In Review</span>
            <span>•</span>
            <span className="text-emerald-400">{tasksCompleted} Done</span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Guidance</span>
            <Sparkles size={16} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-mono">{recommendationsCount}</span>
            <span className="text-xs text-muted font-mono">Steering Notes</span>
          </div>
          <div className="text-[11px] text-muted">
            Direct leadership & performance guidance
          </div>
        </div>
      </div>

      {/* Core Departments Quick Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            الفرق والأقسام الرئيسية / Core Departments
          </h2>
          <Link
            href="/admin/company/organization"
            className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
          >
            <span>الهيكل التنظيمي الكامل / Full Org Chart</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/admin/company/teams/${team.id}`}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all hover:shadow-lg group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${team.color || "#C28E62"}20`,
                      color: team.color || "#C28E62",
                    }}
                  >
                    {team.code}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    {team._count.memberships} أعضاء
                  </span>
                </div>
                <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                  {team.nameAr}
                </h3>
                <p className="text-xs text-muted font-mono">{team.nameEn}</p>
                <p className="text-xs text-muted/80 line-clamp-2 mt-2 leading-relaxed">
                  {team.descriptionAr}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted">
                <span>{team._count.projects} مشاريع</span>
                <span>{team._count.tasks} مهام</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-6 rounded-2xl bg-surface/50 border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">إجراءات سريعة / Quick Actions</h3>
          <p className="text-xs text-muted">إضافة أعضاء جدد، تفويض مهام، أو إرسال توجيهات إدارية</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/company/members"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus size={14} />
            <span>إضافة عضو / Add Member</span>
          </Link>
          <Link
            href="/admin/company/tasks"
            className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground font-mono text-xs font-bold uppercase tracking-wider hover:border-accent transition-colors flex items-center gap-1.5"
          >
            <CheckSquare size={14} />
            <span>مهمة جديدة / New Task</span>
          </Link>
          <Link
            href="/admin/company/recommendations"
            className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground font-mono text-xs font-bold uppercase tracking-wider hover:border-accent transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>توجيه إداري / Post Guidance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
