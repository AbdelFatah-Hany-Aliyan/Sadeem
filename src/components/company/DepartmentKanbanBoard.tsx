"use client";

import React, { useState } from "react";
import {
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
} from "@prisma/client";
import {
  Search,
  Filter,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle,
  ShieldCheck,
  Users,
  ChevronRight,
  Plus,
  Sparkles,
} from "lucide-react";
import TaskCollaborationModal from "./TaskCollaborationModal";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | Date | null;
  reviewRequired: boolean;
  teamId?: string | null;
  projectId?: string | null;
  team?: { id: string; code: string; nameAr: string; nameEn: string } | null;
  project?: { id: string; slug: string } | null;
  assignedMember?: { id: string; fullNameEn: string; fullNameAr?: string | null; avatarUrl?: string | null } | null;
  reviewerMember?: { id: string; fullNameEn: string; fullNameAr?: string | null } | null;
  collaborators?: { id: string; member: { id: string; fullNameEn: string; fullNameAr?: string | null } }[];
  checklistItems?: { id: string; title: string; isCompleted: boolean; order: number }[];
  comments?: {
    id: string;
    content: string;
    isEdited: boolean;
    createdAt: string | Date;
    authorAdmin?: { id: string; name: string; email: string } | null;
    authorMember?: { id: string; fullNameEn: string; fullNameAr?: string | null; avatarUrl?: string | null } | null;
  }[];
  deliverables?: {
    id: string;
    title: string;
    type: DeliverableType;
    url?: string | null;
    storageKey?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    status: DeliverableStatus;
    reviewNotes?: string | null;
    createdAt: string | Date;
    authorMember?: { fullNameEn: string } | null;
    authorAdmin?: { name: string } | null;
  }[];
  history?: {
    id: string;
    action: string;
    fromStatus?: TaskStatus | null;
    toStatus?: TaskStatus | null;
    createdAt: string | Date;
  }[];
}

export interface DepartmentKanbanBoardProps {
  tasks: KanbanTask[];
  currentUserId?: string;
  currentMemberId?: string;
  isManager?: boolean;
  canReview?: boolean;
  eligibleMembers?: { id: string; fullNameEn: string; fullNameAr?: string | null; email: string }[];
  projects?: { id: string; slug: string }[];
  onAddTaskClick?: () => void;
}

const COLUMNS: {
  id: TaskStatus;
  titleAr: string;
  titleEn: string;
  color: string;
  dotColor: string;
}[] = [
  { id: "TODO", titleAr: "قيد الانتظار", titleEn: "To Do", color: "border-stone-500/30", dotColor: "bg-stone-400" },
  { id: "IN_PROGRESS", titleAr: "جاري التنفيذ", titleEn: "In Progress", color: "border-accent/40", dotColor: "bg-accent" },
  { id: "IN_REVIEW", titleAr: "قيد المراجعة", titleEn: "In Review", color: "border-blue-500/40", dotColor: "bg-blue-400" },
  { id: "BLOCKED", titleAr: "معلق", titleEn: "Blocked", color: "border-rose-500/40", dotColor: "bg-rose-400" },
  { id: "DONE", titleAr: "مكتمل", titleEn: "Done", color: "border-emerald-500/40", dotColor: "bg-emerald-400" },
];

export default function DepartmentKanbanBoard({
  tasks,
  currentUserId,
  currentMemberId,
  isManager,
  canReview,
  eligibleMembers = [],
  projects = [],
  onAddTaskClick,
}: DepartmentKanbanBoardProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (memberFilter !== "ALL") {
      const isOwner = t.assignedMember?.id === memberFilter;
      const isCollab = t.collaborators?.some((c) => c.member.id === memberFilter);
      if (!isOwner && !isCollab) return false;
    }
    if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
    return true;
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في مهام القسم... / Search tasks..."
            className="w-full text-xs bg-background border border-border rounded-xl pl-9 pr-3.5 py-2 text-foreground placeholder:text-muted focus:border-accent outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground hover:border-accent transition-colors"
          >
            <option value="ALL">كل الأولويات / All Priorities</option>
            <option value="URGENT">طوارئ / URGENT</option>
            <option value="HIGH">مرتفعة / HIGH</option>
            <option value="MEDIUM">متوسطة / MEDIUM</option>
            <option value="LOW">منخفضة / LOW</option>
          </select>

          {/* Member Filter */}
          {eligibleMembers.length > 0 && (
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground hover:border-accent transition-colors"
            >
              <option value="ALL">كل الأعضاء / All Members</option>
              {eligibleMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullNameAr || m.fullNameEn}
                </option>
              ))}
            </select>
          )}

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground hover:border-accent transition-colors"
            >
              <option value="ALL">كل المشاريع / All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.slug}
                </option>
              ))}
            </select>
          )}

          {onAddTaskClick && (
            <button
              onClick={onAddTaskClick}
              className="px-3.5 py-2 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>مهمة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-surface/60 border border-border rounded-2xl p-4 min-w-[260px] max-h-[800px] overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="font-bold text-xs text-foreground">{col.titleAr}</span>
                  <span className="text-[10px] font-mono text-muted uppercase">({col.titleEn})</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-background border border-border text-foreground">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-muted text-xs font-mono border border-dashed border-border/60 rounded-xl">
                    لا توجد مهام
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const checklist = task.checklistItems || [];
                    const completedCount = checklist.filter((i) => i.isCompleted).length;
                    const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
                    const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== "DONE";

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3.5 rounded-xl border bg-surface hover:bg-surface/90 transition-all cursor-pointer space-y-2.5 shadow-sm hover:shadow-md hover:border-accent/50 ${
                          isOverdue ? "border-rose-500/40 bg-rose-500/5" : "border-border"
                        }`}
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                          <span
                            className={`font-bold uppercase px-2 py-0.5 rounded-full border ${
                              task.priority === "URGENT"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : task.priority === "HIGH"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-background text-muted border-border"
                            }`}
                          >
                            {task.priority}
                          </span>

                          {task.reviewRequired && (
                            <span className="text-blue-400 flex items-center gap-0.5" title="Review Required">
                              <ShieldCheck size={12} />
                              <span>مراجعة</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Subtasks Progress Bar (if any) */}
                        {checklist.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                              <span className="flex items-center gap-1">
                                <CheckSquare size={11} />
                                <span>{completedCount}/{checklist.length}</span>
                              </span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Card Footer: Metadata & Assignees */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] font-mono text-muted">
                          {/* Owner & Collaborators */}
                          <div className="flex items-center gap-1">
                            {task.assignedMember ? (
                              <span className="font-medium text-foreground truncate max-w-[100px]">
                                {task.assignedMember.fullNameAr || task.assignedMember.fullNameEn}
                              </span>
                            ) : (
                              <span className="text-muted italic">غير مسند</span>
                            )}
                            {task.collaborators && task.collaborators.length > 0 && (
                              <span className="px-1 py-0.5 rounded bg-background border border-border text-accent">
                                +{task.collaborators.length}
                              </span>
                            )}
                          </div>

                          {/* Indicators */}
                          <div className="flex items-center gap-2">
                            {task.deliverables && task.deliverables.length > 0 && (
                              <span className="flex items-center gap-0.5 text-accent" title="Deliverables Attached">
                                <Paperclip size={11} />
                                <span>{task.deliverables.length}</span>
                              </span>
                            )}
                            {task.comments && task.comments.length > 0 && (
                              <span className="flex items-center gap-0.5 text-muted" title="Comments">
                                <MessageSquare size={11} />
                                <span>{task.comments.length}</span>
                              </span>
                            )}
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-0.5 ${
                                  isOverdue ? "text-rose-400 font-bold" : "text-muted"
                                }`}
                                title="Due Date"
                              >
                                <Clock size={11} />
                                <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Collaboration Modal */}
      {selectedTask && (
        <TaskCollaborationModal
          task={selectedTask}
          currentUserId={currentUserId}
          currentMemberId={currentMemberId}
          isManager={isManager}
          canReview={canReview}
          eligibleMembers={eligibleMembers}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
