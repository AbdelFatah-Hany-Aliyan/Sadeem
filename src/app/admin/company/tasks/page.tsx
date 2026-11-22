import Link from "next/link";
import prisma from "@/lib/prisma";
import AddTaskModal from "@/components/company/AddTaskModal";
import TaskStatusSelector from "@/components/company/TaskStatusSelector";
import { TaskStatus, TaskPriority } from "@prisma/client";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  User,
  Building2,
  FolderKanban,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    status?: string;
    priority?: string;
    assignedMemberId?: string;
    teamId?: string;
  };
}

export default async function TasksPage({ searchParams }: PageProps) {
  const { status, priority, assignedMemberId, teamId } = searchParams;

  const where: any = {};
  if (status && Object.values(TaskStatus).includes(status as any)) {
    where.status = status;
  }
  if (priority && Object.values(TaskPriority).includes(priority as any)) {
    where.priority = priority;
  }
  if (assignedMemberId) {
    where.assignedMemberId = assignedMemberId;
  }
  if (teamId) {
    where.teamId = teamId;
  }

  const [tasks, members, teams, projects, counts] = await Promise.all([
    prisma.companyTask.findMany({
      where,
      include: {
        assignedMember: true,
        reviewerMember: true,
        team: true,
        project: true,
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.companyMember.findMany({
      where: { status: { in: ["ACTIVE", "ACCEPTED"] } },
      select: { id: true, fullNameEn: true, fullNameAr: true, jobTitleEn: true },
      orderBy: { fullNameEn: "asc" },
    }),
    prisma.companyTeam.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameAr: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.companyTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus: Record<string, number> = {};
  counts.forEach((c) => {
    countByStatus[c.status] = c._count._all;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.URGENT:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            URGENT
          </span>
        );
      case TaskPriority.HIGH:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            HIGH
          </span>
        );
      case TaskPriority.MEDIUM:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface text-muted border border-border">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            مهام العمل والتفويض / Tasks & Delegation ({tasks.length})
          </h2>
          <p className="text-xs text-muted">
            إسناد المهام، تحديد الأولويات، تتبع سلسلة المراجعة والاعتماد
          </p>
        </div>

        <AddTaskModal members={members} teams={teams} projects={projects} />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4 text-xs font-mono">
        <Link
          href="/admin/company/tasks"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            !status
              ? "bg-accent text-accent-foreground border-accent font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          All ({Object.values(countByStatus).reduce((a, b) => a + b, 0)})
        </Link>
        <Link
          href="/admin/company/tasks?status=IN_PROGRESS"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "IN_PROGRESS"
              ? "bg-blue-500 text-white border-blue-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          In Progress ({countByStatus[TaskStatus.IN_PROGRESS] || 0})
        </Link>
        <Link
          href="/admin/company/tasks?status=IN_REVIEW"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "IN_REVIEW"
              ? "bg-amber-500 text-stone-950 border-amber-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          In Review ({countByStatus[TaskStatus.IN_REVIEW] || 0})
        </Link>
        <Link
          href="/admin/company/tasks?status=TODO"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "TODO"
              ? "bg-surface text-foreground border-accent font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Todo ({countByStatus[TaskStatus.TODO] || 0})
        </Link>
        <Link
          href="/admin/company/tasks?status=DONE"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "DONE"
              ? "bg-emerald-500 text-stone-950 border-emerald-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Done ({countByStatus[TaskStatus.DONE] || 0})
        </Link>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
          <CheckSquare size={32} className="text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">لا توجد مهام مطابقة</h3>
          <p className="text-xs text-muted">
            أنشئ مهمة جديدة أو قم بتغيير فلاتر العرض
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  {getPriorityBadge(task.priority)}
                  {task.reviewRequired && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                      REVIEW REQUIRED
                    </span>
                  )}
                  {task.isAiAssisted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent/15 text-accent font-semibold flex items-center gap-1">
                      <Sparkles size={10} />
                      AI ASSISTED
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-foreground text-sm">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted font-mono pt-1">
                  {task.assignedMember && (
                    <span className="flex items-center gap-1 text-foreground">
                      <User size={12} className="text-accent" />
                      {task.assignedMember.fullNameAr || task.assignedMember.fullNameEn}
                    </span>
                  )}

                  {task.reviewerMember && (
                    <span className="flex items-center gap-1 text-muted">
                      <span>مراجع:</span>
                      {task.reviewerMember.fullNameAr || task.reviewerMember.fullNameEn}
                    </span>
                  )}

                  {task.team && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-accent" />
                      {task.team.code}
                    </span>
                  )}

                  {task.project && (
                    <span className="flex items-center gap-1">
                      <FolderKanban size={12} className="text-accent" />
                      {task.project.slug}
                    </span>
                  )}

                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-accent" />
                      {new Date(task.dueDate).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Selector & Controls */}
              <div className="shrink-0 flex items-center justify-end">
                <TaskStatusSelector
                  taskId={task.id}
                  currentStatus={task.status}
                  reviewRequired={task.reviewRequired}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
