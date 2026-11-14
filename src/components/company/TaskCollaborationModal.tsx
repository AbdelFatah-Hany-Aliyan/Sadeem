"use client";

import React, { useState, useTransition } from "react";
import {
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
} from "@prisma/client";
import {
  X,
  CheckSquare,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Clock,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  AlertTriangle,
  UserPlus,
  Users,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import {
  addTaskCommentAction,
  editTaskCommentAction,
  deleteTaskCommentAction,
  addChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
  addDeliverableLinkAction,
  uploadDeliverableFileAction,
  submitTaskForReviewAction,
  approveTaskReviewAction,
  requestTaskChangesAction,
  addTaskCollaboratorAction,
  removeTaskCollaboratorAction,
  updateTaskStatusAction,
} from "@/app/admin/company/actions";

export interface TaskModalProps {
  task: {
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
  };
  currentUserId?: string;
  currentMemberId?: string;
  isManager?: boolean;
  canReview?: boolean;
  eligibleMembers?: { id: string; fullNameEn: string; fullNameAr?: string | null; email: string }[];
  onClose: () => void;
}

export default function TaskCollaborationModal({
  task,
  currentUserId,
  currentMemberId,
  isManager,
  canReview,
  eligibleMembers = [],
  onClose,
}: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "deliverables" | "review">("subtasks");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Subtask form state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Comment form state
  const [commentContent, setCommentContent] = useState("");

  // Deliverable link form state
  const [delivTitle, setDelivTitle] = useState("");
  const [delivType, setDelivType] = useState<DeliverableType>(DeliverableType.FIGMA_LINK);
  const [delivUrl, setDelivUrl] = useState("");

  // Review notes state
  const [reviewNotes, setReviewNotes] = useState("");

  // Calculate subtasks progress
  const checklist = task.checklistItems || [];
  const completedCount = checklist.filter((i) => i.isCompleted).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Add subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("title", newSubtaskTitle.trim());
      const res = await addChecklistItemAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to add subtask");
      } else {
        setNewSubtaskTitle("");
      }
    });
  };

  // Toggle subtask
  const handleToggleSubtask = (itemId: string, currentStatus: boolean) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("itemId", itemId);
      fd.append("isCompleted", (!currentStatus).toString());
      const res = await toggleChecklistItemAction(fd);
      if (!res.success) setActionError(res.error || "Failed to toggle subtask");
    });
  };

  // Delete subtask
  const handleDeleteSubtask = (itemId: string) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("itemId", itemId);
      const res = await deleteChecklistItemAction(fd);
      if (!res.success) setActionError(res.error || "Failed to delete subtask");
    });
  };

  // Post comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("content", commentContent.trim());
      const res = await addTaskCommentAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to post comment");
      } else {
        setCommentContent("");
      }
    });
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("commentId", commentId);
      const res = await deleteTaskCommentAction(fd);
      if (!res.success) setActionError(res.error || "Failed to delete comment");
    });
  };

  // Add deliverable link
  const handleAddDeliverableLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivTitle.trim() || !delivUrl.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("title", delivTitle.trim());
      fd.append("type", delivType);
      fd.append("url", delivUrl.trim());
      const res = await addDeliverableLinkAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to attach deliverable");
      } else {
        setDelivTitle("");
        setDelivUrl("");
      }
    });
  };

  // Upload deliverable file
  const handleUploadDeliverableFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("title", file.name);
      fd.append("file", file);
      const res = await uploadDeliverableFileAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to upload deliverable file");
      }
    });
  };

  // Submit task for review
  const handleSubmitForReview = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("notes", reviewNotes.trim());
      const res = await submitTaskForReviewAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to submit for review");
      } else {
        setReviewNotes("");
      }
    });
  };

  // Approve review
  const handleApproveReview = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("notes", reviewNotes.trim());
      const res = await approveTaskReviewAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to approve review");
      } else {
        setReviewNotes("");
      }
    });
  };

  // Request changes
  const handleRequestChanges = () => {
    if (!reviewNotes.trim()) {
      setActionError("Feedback notes are required when requesting changes.");
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("feedbackNotes", reviewNotes.trim());
      const res = await requestTaskChangesAction(fd);
      if (!res.success) {
        setActionError(res.error || "Failed to request changes");
      } else {
        setReviewNotes("");
      }
    });
  };

  // Add collaborator
  const handleAddCollaborator = (memberId: string) => {
    if (!memberId) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("memberId", memberId);
      const res = await addTaskCollaboratorAction(fd);
      if (!res.success) setActionError(res.error || "Failed to add collaborator");
    });
  };

  // Remove collaborator
  const handleRemoveCollaborator = (memberId: string) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("memberId", memberId);
      const res = await removeTaskCollaboratorAction(fd);
      if (!res.success) setActionError(res.error || "Failed to remove collaborator");
    });
  };

  // Quick move status (accessible non-drag selector)
  const handleQuickStatusChange = (newStatus: TaskStatus) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("status", newStatus);
      const res = await updateTaskStatusAction(fd);
      if (!res.success) setActionError(res.error || "Status update failed");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-surface/50">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  task.priority === "URGENT"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : task.priority === "HIGH"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-surface text-muted border-border"
                }`}
              >
                {task.priority}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {task.status}
              </span>

              {task.team && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                  {task.team.nameAr} / {task.team.nameEn}
                </span>
              )}

              {task.reviewRequired && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>يتطلب اعتماد المراجعة</span>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground truncate">
              {task.title}
            </h2>

            {task.description && (
              <p className="text-xs text-muted line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Accessible Quick Status Selector */}
            <select
              value={task.status}
              onChange={(e) => handleQuickStatusChange(e.target.value as TaskStatus)}
              disabled={isPending}
              className="text-xs font-mono bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground hover:border-accent transition-colors"
            >
              <option value="TODO">TODO / قيد الانتظار</option>
              <option value="IN_PROGRESS">IN_PROGRESS / جاري العمل</option>
              <option value="IN_REVIEW">IN_REVIEW / قيد المراجعة</option>
              <option value="BLOCKED">BLOCKED / معلق</option>
              <option value="DONE">DONE / منجز ومكتمل</option>
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-background/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 px-6">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border bg-background/50 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("subtasks")}
            className={`py-3 px-4 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "subtasks"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <CheckSquare size={13} />
            <span>المهام الفرعية / Subtasks ({checklist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`py-3 px-4 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "comments"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <MessageSquare size={13} />
            <span>النقاش والتعليقات / Discussion ({task.comments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("deliverables")}
            className={`py-3 px-4 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "deliverables"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Paperclip size={13} />
            <span>المخرجات والمرفقات / Deliverables ({task.deliverables?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`py-3 px-4 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "review"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <ShieldCheck size={13} />
            <span>المراجعة والاعتماد / Review Workflow</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: SUBTASKS & COLLABORATORS */}
          {activeTab === "subtasks" && (
            <div className="space-y-6">
              {/* Progress Bar */}
              {checklist.length > 0 && (
                <div className="p-4 rounded-2xl bg-background/50 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted">
                    <span>نسبة إنجاز المهام الفرعية / Subtask Progress</span>
                    <span className="font-bold text-accent">{progressPercent}% ({completedCount}/{checklist.length})</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  قائمة الخطوات والمهام الفرعية / Checklist Items
                </h3>

                {checklist.length === 0 ? (
                  <p className="text-xs text-muted p-4 rounded-2xl bg-background/30 border border-border text-center">
                    لا توجد مهام فرعية مسجلة. أضف خطوات العمل لتتبع نسبة الإنجاز بدقة.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          item.isCompleted
                            ? "bg-surface/30 border-border opacity-70"
                            : "bg-surface border-border hover:border-accent/40"
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleSubtask(item.id, item.isCompleted)}
                            disabled={isPending}
                            className="rounded border-border text-accent focus:ring-accent"
                          />
                          <span
                            className={`text-xs text-foreground truncate ${
                              item.isCompleted ? "line-through text-muted" : "font-medium"
                            }`}
                          >
                            {item.title}
                          </span>
                        </label>

                        <button
                          onClick={() => handleDeleteSubtask(item.id)}
                          disabled={isPending}
                          className="p-1 rounded text-muted hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Form */}
                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="إضافة خطوة عمل جديدة... / Add a checklist item..."
                    className="flex-1 text-xs bg-background border border-border rounded-xl px-3.5 py-2 text-foreground placeholder:text-muted focus:border-accent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !newSubtaskTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    <span>إضافة</span>
                  </button>
                </form>
              </div>

              {/* Collaborators Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users size={14} className="text-accent" />
                    <span>فريق العمل والمتعاونون / Assigned Owner & Collaborators</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Accountable Owner */}
                  <div className="p-3 rounded-xl bg-surface border border-accent/30 space-y-1">
                    <span className="text-[10px] font-mono text-accent uppercase font-bold">
                      المسؤول الأساسي / Accountable Owner
                    </span>
                    <p className="text-xs font-bold text-foreground">
                      {task.assignedMember?.fullNameAr || task.assignedMember?.fullNameEn || "غير مسند / Unassigned"}
                    </p>
                  </div>

                  {/* Collaborators */}
                  <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
                    <span className="text-[10px] font-mono text-muted uppercase">
                      المتعاونون / Collaborators ({task.collaborators?.length || 0})
                    </span>

                    {task.collaborators && task.collaborators.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {task.collaborators.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-background border border-border text-foreground"
                          >
                            <span>{c.member.fullNameAr || c.member.fullNameEn}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.member.id)}
                              className="text-muted hover:text-rose-400"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted">لا يوجد متعاونون إضافيون</p>
                    )}
                  </div>
                </div>

                {/* Add Collaborator Dropdown */}
                {eligibleMembers.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      onChange={(e) => {
                        handleAddCollaborator(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground hover:border-accent transition-colors"
                    >
                      <option value="" disabled>
                        + إضافة متعاون للمهمة... / Add a collaborator...
                      </option>
                      {eligibleMembers
                        .filter(
                          (m) =>
                            m.id !== task.assignedMember?.id &&
                            !task.collaborators?.some((c) => c.member.id === m.id)
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullNameAr || m.fullNameEn} ({m.email})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TASK DISCUSSIONS & COMMENTS */}
          {activeTab === "comments" && (
            <div className="space-y-6">
              {/* Mentions Guide */}
              <div className="p-3 rounded-xl bg-background/50 border border-border flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <Sparkles size={13} className="text-accent" />
                  <span>يمكنك استخدام @ للإشارة لزملائك (أو @all لجميع أعضاء الفريق)</span>
                </span>
                {eligibleMembers.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {eligibleMembers.slice(0, 3).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCommentContent((prev) => `${prev} @${m.fullNameEn.split(" ")[0]} `)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border hover:border-accent text-accent"
                      >
                        @{m.fullNameEn.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Thread */}
              <div className="space-y-3">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="p-8 text-center rounded-2xl bg-background/30 border border-border text-muted text-xs">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    <span>لا توجد تعليقات أو نقاشات مسجلة بعد. ابدأ المحادثة الآن.</span>
                  </div>
                ) : (
                  task.comments.map((c) => {
                    const isAuthor =
                      (currentUserId && c.authorAdmin?.id === currentUserId) ||
                      (currentMemberId && c.authorMember?.id === currentMemberId);

                    return (
                      <div
                        key={c.id}
                        id={`comment-${c.id}`}
                        className="p-4 rounded-2xl bg-surface border border-border space-y-2 transition-all hover:border-border/80"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-mono text-[10px] font-bold flex items-center justify-center">
                              {(c.authorMember?.fullNameEn || c.authorAdmin?.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {c.authorMember?.fullNameAr || c.authorMember?.fullNameEn || c.authorAdmin?.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted">
                              {new Date(c.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {c.isEdited && (
                              <span className="text-[10px] font-mono text-muted italic">
                                (معدّل / edited)
                              </span>
                            )}
                          </div>

                          {(isAuthor || isManager) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-muted hover:text-rose-400 text-xs p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="space-y-3 pt-2">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="اكتب ملاحظة أو تعليقاً على المهمة... / Add a comment or discussion note..."
                  rows={3}
                  className="w-full text-xs bg-background border border-border rounded-2xl p-3.5 text-foreground placeholder:text-muted focus:border-accent outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending || !commentContent.trim()}
                    className="px-5 py-2.5 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={13} />
                    <span>إرسال التعليق / Post Comment</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DELIVERABLES & ATTACHMENTS */}
          {activeTab === "deliverables" && (
            <div className="space-y-6">
              {/* Deliverables List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  المخرجات والمرفقات المسلمة / Submitted Deliverables
                </h3>

                {(!task.deliverables || task.deliverables.length === 0) ? (
                  <p className="text-xs text-muted p-4 rounded-2xl bg-background/30 border border-border text-center">
                    لم يتم إرفاق مخرجات أو روابط تسليم حتى الآن.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {task.deliverables.map((d) => (
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

                          <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                            <span>{d.type}</span>
                            <span>•</span>
                            <span>{d.authorMember?.fullNameEn || d.authorAdmin?.name || "Member"}</span>
                            <span>•</span>
                            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>

                          {d.reviewNotes && (
                            <p className="text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 mt-1">
                              ملاحظات المراجع: {d.reviewNotes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:border-accent text-foreground text-xs font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink size={12} />
                              <span>فتح الرابط</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Deliverable Form */}
              <div className="p-5 rounded-2xl bg-background/50 border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                  <Plus size={14} className="text-accent" />
                  <span>تسليم مخرج عمل جديد / Submit New Deliverable</span>
                </h4>

                <form onSubmit={handleAddDeliverableLink} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={delivTitle}
                      onChange={(e) => setDelivTitle(e.target.value)}
                      placeholder="عنوان المخرج (e.g. Figma UI Mockup)..."
                      className="text-xs bg-surface border border-border rounded-xl px-3 py-2 text-foreground focus:border-accent outline-none"
                    />

                    <select
                      value={delivType}
                      onChange={(e) => setDelivType(e.target.value as DeliverableType)}
                      className="text-xs bg-surface border border-border rounded-xl px-3 py-2 text-foreground focus:border-accent outline-none"
                    >
                      <option value="FIGMA_LINK">رابط فيغما / Figma Link</option>
                      <option value="GITHUB_LINK">رابط مستودع أو PR / GitHub Link</option>
                      <option value="DOCUMENT_LINK">وثيقة أو PRD / Document Link</option>
                      <option value="OTHER">رابط آخر / Other Link</option>
                    </select>

                    <input
                      type="url"
                      value={delivUrl}
                      onChange={(e) => setDelivUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-xs bg-surface border border-border rounded-xl px-3 py-2 text-foreground focus:border-accent outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {/* File Upload Option */}
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface hover:border-accent text-xs font-mono text-muted hover:text-foreground cursor-pointer transition-colors">
                      <Upload size={13} className="text-accent" />
                      <span>أو رفع ملف مباشرة (PDF, Docs, Images)...</span>
                      <input
                        type="file"
                        onChange={handleUploadDeliverableFile}
                        disabled={isPending}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isPending || !delivTitle.trim() || !delivUrl.trim()}
                      className="px-4 py-2 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <LinkIcon size={13} />
                      <span>حفظ المخرج / Attach Link</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEW & APPROVAL WORKFLOW */}
          {activeTab === "review" && (
            <div className="space-y-6">
              {/* Review Requirements Info Card */}
              <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-accent" />
                  <h3 className="text-sm font-bold text-foreground">
                    مسار المراجعة والاعتماد / Formal Review Gateway
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {task.reviewRequired
                    ? "تتطلب هذه المهمة اعتماداً رسمياً من قائد الفريق أو المراجع المعين قبل الانتقال إلى حالة الإنجاز الكامل (DONE)."
                    : "هذه المهمة لا تتطلب مراجعة إلزامية، ولكن يمكنك طلب تدقيق ومراجعة الزملاء في أي وقت."}
                </p>
                <div className="text-xs font-mono text-muted pt-1 flex items-center gap-4">
                  <span>المراجع المعين: {task.reviewerMember?.fullNameAr || task.reviewerMember?.fullNameEn || "قائد الفريق / Team Lead"}</span>
                  <span>الحالة الحالية: <strong className="text-foreground">{task.status}</strong></span>
                </div>
              </div>

              {/* Reviewer Action Box (If Authorized Reviewer) */}
              {canReview && task.status === "IN_REVIEW" && (
                <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3">
                  <h4 className="text-xs font-bold text-accent font-mono uppercase tracking-wider">
                    إجراءات الاعتماد والمراجعة / Reviewer Actions
                  </h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="ملاحظات المراجعة أو التوجيهات للمنفذ... / Review feedback notes..."
                    rows={2}
                    className="w-full text-xs bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted focus:border-accent outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleApproveReview}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 font-bold text-xs font-mono hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>اعتماد المهمة / Approve & Mark Done</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestChanges}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-bold text-xs font-mono transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle size={14} />
                      <span>طلب تعديلات / Request Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit for Review Box (For Assignees/Collaborators) */}
              {task.status !== "DONE" && task.status !== "IN_REVIEW" && (
                <div className="p-5 rounded-2xl bg-background/50 border border-border space-y-3">
                  <h4 className="text-xs font-bold text-foreground font-mono">
                    تسليم العمل للمراجعة / Submit Work for Review
                  </h4>
                  <p className="text-xs text-muted">
                    عند الانتهاء من العمل وتجهيز المخرجات، يمكنك تسليم المهمة لتغيير حالتها إلى IN_REVIEW وإشعار المراجع.
                  </p>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="ملاحظات التسليم للمراجع (اختياري)..."
                    rows={2}
                    className="w-full text-xs bg-surface border border-border rounded-xl p-3 text-foreground placeholder:text-muted focus:border-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>تسليم للمراجعة / Submit for Review</span>
                  </button>
                </div>
              )}

              {/* Activity Audit Timeline */}
              {task.history && task.history.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
                    سجل التعديلات والنشاطات / Audit Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-border ml-2 pl-4">
                    {task.history.slice(0, 8).map((h) => (
                      <div key={h.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent text-[11px]">{h.action}</span>
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {h.fromStatus && h.toStatus && (
                          <p className="text-[11px] text-muted font-mono">
                            {h.fromStatus} → {h.toStatus}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
