import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TaskStatusSelector from "@/components/company/TaskStatusSelector";
import { acknowledgeRecommendationAction } from "@/app/admin/company/actions";
import { TaskStatus, TaskPriority, RecommendationStatus, RecommendationVisibility } from "@prisma/client";
import {
  CheckSquare,
  Sparkles,
  Layers,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Find linked CompanyMember
  const member = await prisma.companyMember.findFirst({
    where: {
      OR: [
        { adminUser: { id: session.id } },
        { email: session.email },
      ],
    },
    include: {
      memberships: {
        include: { team: true },
      },
      projectAssignments: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
      assignedTasks: {
        include: {
          project: true,
          team: true,
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      },
      reviewedTasks: {
        where: {
          status: TaskStatus.IN_REVIEW,
        },
        include: {
          assignedMember: true,
          project: true,
        },
      },
      receivedRecommendations: {
        where: {
          visibility: { not: RecommendationVisibility.PRIVATE_MANAGEMENT },
        },
        include: {
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const primaryTeam = member?.memberships.find((m) => m.isPrimary)?.team;

  async function handleAcknowledge(formData: FormData) {
    "use server";
    await acknowledgeRecommendationAction(formData);
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-mono mb-1">
            <UserCheck size={14} />
            <span>مساحة العمل الشخصية / My Work Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            مرحباً {member?.fullNameAr || member?.fullNameEn || session.name}
          </h1>
          <p className="text-xs text-muted mt-1">
            {member
              ? `${member.jobTitleAr || member.jobTitleEn} • ${primaryTeam ? primaryTeam.nameAr : "فريق سديم"}`
              : `الحساب الإداري: ${session.role}`}
          </p>
        </div>

        {primaryTeam && (
          <div className="p-3 rounded-2xl bg-surface border border-border flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs"
              style={{
                backgroundColor: `${primaryTeam.color || "#C28E62"}20`,
                color: primaryTeam.color || "#C28E62",
              }}
            >
              {primaryTeam.code}
            </div>
            <div className="text-xs">
              <span className="font-bold text-foreground block">
                {primaryTeam.nameAr}
              </span>
              <span className="text-muted font-mono">{primaryTeam.nameEn}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Tasks Waiting for Review & High Priority */}
      {member && member.reviewedTasks.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300">
              مهام قيد المراجعة بانتظار اعتمادك ({member.reviewedTasks.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {member.reviewedTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-foreground text-xs">{task.title}</h3>
                  <p className="text-[11px] text-muted font-mono mt-1">
                    المنفذ: {task.assignedMember?.fullNameAr || task.assignedMember?.fullNameEn || "غير محدد"}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">
                    IN REVIEW
                  </span>
                  <TaskStatusSelector
                    taskId={task.id}
                    currentStatus={task.status}
                    reviewRequired={task.reviewRequired}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Assigned Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-accent" />
              <h2 className="text-base font-bold text-foreground">
                مهامي المسندة / My Assigned Tasks ({member?.assignedTasks.length || 0})
              </h2>
            </div>
          </div>

          {!member || member.assignedTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface border border-border text-center text-xs text-muted">
              لا توجد مهام مسندة إليك حالياً. استمتع بيوم عمل مثمر!
            </div>
          ) : (
            <div className="space-y-3">
              {member.assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent">
                        {task.priority}
                      </span>
                      {task.project && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-border text-muted">
                          {task.project.slug}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-sm">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <p className="text-[11px] font-mono text-muted flex items-center gap-1">
                        <Clock size={11} />
                        <span>موعد التسليم: {new Date(task.dueDate).toLocaleDateString("en-GB")}</span>
                      </p>
                    )}
                  </div>

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

        {/* Right 1 Column: Recommendations & Projects */}
        <div className="space-y-6">
          {/* Recommendations Box */}
          <div className="bg-surface border border-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h2 className="text-sm font-bold text-foreground">
                التوجيهات الإدارية / Guidance
              </h2>
            </div>

            {!member || member.receivedRecommendations.length === 0 ? (
              <p className="text-xs text-muted text-center p-4 bg-background/50 rounded-xl">
                لا توجد توجيهات جديدة
              </p>
            ) : (
              <div className="space-y-3">
                {member.receivedRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-background border border-border/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-accent/10 text-accent font-semibold">
                        {rec.type}
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        {new Date(rec.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    <p className="text-foreground leading-relaxed">{rec.text}</p>

                    {rec.status === "PROPOSED" ? (
                      <form action={handleAcknowledge} className="pt-2 border-t border-border/40">
                        <input type="hidden" name="recommendationId" value={rec.id} />
                        <input type="hidden" name="memberId" value={member.id} />
                        <button
                          type="submit"
                          className="w-full py-1.5 rounded-lg bg-accent/20 hover:bg-accent text-accent hover:text-accent-foreground font-mono text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          <span>تأكيد الاطلاع والاستلام / Acknowledge</span>
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1">
                        <CheckCircle2 size={11} />
                        <span>تم الاطلاع والاعتماد</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Assignments */}
          {member && member.projectAssignments.length > 0 && (
            <div className="bg-surface border border-border rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-accent" />
                <h2 className="text-sm font-bold text-foreground">
                  مشاريعي النشطة / My Projects
                </h2>
              </div>

              <div className="space-y-2">
                {member.projectAssignments.map((pa: any) => (
                  <div
                    key={pa.id}
                    className="p-3 rounded-xl bg-background border border-border/70 text-xs"
                  >
                    <span className="font-bold text-foreground block">
                      {pa.project.slug}
                    </span>
                    {pa.projectRole && (
                      <span className="text-[11px] text-muted font-mono">
                        الدور: {pa.projectRole}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
