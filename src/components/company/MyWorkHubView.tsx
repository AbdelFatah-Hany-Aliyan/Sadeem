"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
  RecommendationStatus,
} from "@prisma/client";
import {
  CheckSquare,
  Users,
  Paperclip,
  Clock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import TaskCollaborationModal from "./TaskCollaborationModal";
import { KanbanTask } from "./DepartmentKanbanBoard";
import { acknowledgeRecommendationAction } from "@/app/admin/company/actions";

export interface MyWorkHubViewProps {
  member?: {
    id: string;
    fullNameAr?: string | null;
    fullNameEn: string;
    jobTitleAr?: string | null;
    jobTitleEn: string;
    avatarUrl?: string | null;
  } | null;
  primaryTeam?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    color?: string | null;
  } | null;
  assignedTasks: KanbanTask[];
  collaboratingTasks: KanbanTask[];
  reviewQueue: KanbanTask[];
  myDeliverables: {
    id: string;
    title: string;
    type: DeliverableType;
    status: DeliverableStatus;
    url?: string | null;
    reviewNotes?: string | null;
    createdAt: string;
    task: { id: string; title: string };
  }[];
  recommendations: {
    id: string;
    text: string;
    type: string;
    priority: TaskPriority;
    status: RecommendationStatus;
    createdAt: string;
    author?: { name: string } | null;
  }[];
  projects: { id: string; slug: string; role?: string | null }[];
  currentUserId?: string;
  currentMemberId?: string;
  isManager?: boolean;
  canReview?: boolean;
}

export default function MyWorkHubView({
  member,
  primaryTeam,
  assignedTasks,
  collaboratingTasks,
  reviewQueue,
  myDeliverables,
  recommendations,
  projects,
  currentUserId,
  currentMemberId,
  isManager,
  canReview,
}: MyWorkHubViewProps) {
  const [activeTab, setActiveTab] = useState<
    "assigned" | "collaborating" | "review" | "deliverables" | "recommendations"
  >("assigned");
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const now = new Date();

  // Find overdue tasks
  const allUserTasks = [...assignedTasks, ...collaboratingTasks];
  const overdueTasks = allUserTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl bg-surface border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent text-xs font-mono mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span>مساحة العمل الشخصية / My Work Hub</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            مرحباً {member?.fullNameAr || member?.fullNameEn || "مرحباً بك"}
          </h1>

          <p className="text-xs text-muted">
            {member
              ? `${member.jobTitleAr || member.jobTitleEn} • ${primaryTeam ? primaryTeam.nameAr : "فريق سديم"}`
              : "لوحة المهام الشخصية"}
          </p>
        </div>

        {primaryTeam && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background/50 border border-border shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs"
              style={{
                backgroundColor: `${primaryTeam.color || "#C28E62"}20`,
                color: primaryTeam.color || "#C28E62",
              }}
            >
              {primaryTeam.code}
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                {primaryTeam.nameAr}
              </span>
              <span className="text-[10px] text-muted font-mono">{primaryTeam.nameEn}</span>
            </div>
            <Link
              href={`/admin/company/departments/${primaryTeam.code}`}
              className="text-[10px] font-mono text-accent hover:underline mr-2"
            >
              فتح مساحة القسم →
            </Link>
          </div>
        )}
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-300">
                لديك {overdueTasks.length} مهمة تجاوزت موعد التسليم المحدد! / Overdue Tasks
              </h3>
              <p className="text-[11px] text-muted">
                يرجى تحديث حالة المهام المتأخرة أو تسليم مخرجاتها للمراجعة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
          <span className="text-[10px] font-mono text-muted uppercase">مهامي المسندة</span>
          <p className="text-xl font-bold text-foreground">{assignedTasks.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
          <span className="text-[10px] font-mono text-accent uppercase">مهام متعاون فيها</span>
          <p className="text-xl font-bold text-accent">{collaboratingTasks.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
          <span className="text-[10px] font-mono text-blue-400 uppercase">بانتظار مراجعتي</span>
          <p className="text-xl font-bold text-blue-400">{reviewQueue.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase">مخرجاتي المسلمة</span>
          <p className="text-xl font-bold text-emerald-400">{myDeliverables.length}</p>
        </div>
      </div>

      {/* Interactive Hub Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "assigned"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <CheckSquare size={14} />
          <span>مهامي المسندة ({assignedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("collaborating")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "collaborating"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Users size={14} />
          <span>أتعاون فيها ({collaboratingTasks.length})</span>
        </button>

        {reviewQueue.length > 0 && (
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "review"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <ShieldCheck size={14} />
            <span>بانتظار مراجعتي ({reviewQueue.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("deliverables")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "deliverables"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Paperclip size={14} />
          <span>مخرجاتي ({myDeliverables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "recommendations"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Sparkles size={14} />
          <span>التوجيهات ({recommendations.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. ASSIGNED TASKS */}
      {activeTab === "assigned" && (
        <div className="space-y-3">
          {assignedTasks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-border text-muted text-xs">
              لا توجد مهام مسندة إليك حالياً.
            </div>
          ) : (
            assignedTasks.map((t) => {
              const checklist = t.checklistItems || [];
              const completedCount = checklist.filter((i) => i.isCompleted).length;
              const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE";

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          t.priority === "URGENT"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-background text-muted border-border"
                        }`}
                      >
                        {t.priority}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        {t.status}
                      </span>

                      {t.team && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                          {t.team.nameAr}
                        </span>
                      )}

                      {t.project && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                          {t.project.slug}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground truncate">{t.title}</h3>

                    {checklist.length > 0 && (
                      <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                        <CheckSquare size={12} className="text-accent" />
                        <span>المهام الفرعية: {completedCount}/{checklist.length}</span>
                      </span>
                    )}

                    {t.dueDate && (
                      <span
                        className={`text-[11px] font-mono flex items-center gap-1 ${
                          isOverdue ? "text-rose-400 font-bold" : "text-muted"
                        }`}
                      >
                        <Clock size={11} />
                        <span>موعد التسليم: {new Date(t.dueDate).toLocaleDateString()}</span>
                        {isOverdue && <span>(متأخرة!)</span>}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-accent hover:underline flex items-center gap-1">
                      <span>عرض وتعديل المهمة</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. COLLABORATING TASKS */}
      {activeTab === "collaborating" && (
        <div className="space-y-3">
          {collaboratingTasks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-border text-muted text-xs">
              لا توجد مهام تشارك فيها كمتعاون حالياً.
            </div>
          ) : (
            collaboratingTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {t.status}
                    </span>
                    <span className="text-xs text-muted font-mono">
                      المسؤول: {t.assignedMember?.fullNameAr || t.assignedMember?.fullNameEn}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground truncate">{t.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-accent flex items-center gap-1">
                    <span>فتح التفاصيل</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. REVIEW QUEUE */}
      {activeTab === "review" && (
        <div className="space-y-3">
          {reviewQueue.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-border text-muted text-xs">
              قائمة المراجعة خالية حالياً.
            </div>
          ) : (
            reviewQueue.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      قيد المراجعة
                    </span>
                    <span className="text-xs text-muted font-mono">
                      المنفذ: {t.assignedMember?.fullNameAr || t.assignedMember?.fullNameEn}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold font-mono text-xs">
                    مراجعة واعتماد الآن
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. MY DELIVERABLES */}
      {activeTab === "deliverables" && (
        <div className="space-y-3">
          {myDeliverables.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-border text-muted text-xs">
              لم تقم بتسليم مخرجات بعد.
            </div>
          ) : (
            myDeliverables.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        d.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : d.status === "CHANGES_REQUESTED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="text-xs font-bold text-foreground">{d.title}</span>
                  </div>
                  <p className="text-[11px] text-muted font-mono">
                    ضمن المهمة: {d.task.title} • {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                  {d.reviewNotes && (
                    <p className="text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      ملاحظات المراجع: {d.reviewNotes}
                    </p>
                  )}
                </div>

                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl border border-border bg-background hover:border-accent text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ExternalLink size={12} />
                    <span>فتح المخرج</span>
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. RECOMMENDATIONS */}
      {activeTab === "recommendations" && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-border text-muted text-xs">
              لا توجد توجيهات إدارية جديدة.
            </div>
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-accent font-semibold">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono text-muted">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed max-w-2xl">{rec.text}</p>
                </div>

                <div className="shrink-0">
                  {rec.status === "ACKNOWLEDGED" ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>تم الاطلاع والاعتماد</span>
                    </span>
                  ) : (
                    <form
                      action={async (fd) => {
                        fd.append("recommendationId", rec.id);
                        await acknowledgeRecommendationAction(fd);
                      }}
                    >
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-accent text-stone-950 font-bold font-mono text-xs hover:bg-accent/90 transition-colors"
                      >
                        تأكيد الاطلاع والاستلام
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Task Collaboration Modal */}
      {selectedTask && (
        <TaskCollaborationModal
          task={selectedTask}
          currentUserId={currentUserId}
          currentMemberId={currentMemberId}
          isManager={isManager}
          canReview={canReview}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
