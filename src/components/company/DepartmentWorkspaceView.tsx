"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
  RecommendationStatus,
} from "@prisma/client";
import {
  Layers,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  AlertCircle,
  ShieldCheck,
  Send,
  Plus,
  ExternalLink,
  Sparkles,
  Megaphone,
  FileText,
  Figma,
  Github,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import DepartmentKanbanBoard, { KanbanTask } from "./DepartmentKanbanBoard";
import {
  broadcastDepartmentAnnouncementAction,
  acknowledgeRecommendationAction,
} from "@/app/admin/company/actions";

export interface DepartmentWorkspaceProps {
  department: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    responsibilitiesAr: string[];
    responsibilitiesEn: string[];
    color?: string | null;
    icon?: string | null;
    memberships: {
      id: string;
      teamRole: string;
      isPrimary: boolean;
      member: {
        id: string;
        fullNameAr?: string | null;
        fullNameEn: string;
        email: string;
        phone?: string | null;
        jobTitleAr?: string | null;
        jobTitleEn: string;
        avatarUrl?: string | null;
      };
    }[];
    projects: {
      id: string;
      project: {
        id: string;
        slug: string;
        developmentStatus: string;
        ownershipType: string;
        translations: { locale: string; title: string }[];
      };
    }[];
  };
  tasks: KanbanTask[];
  recommendations?: {
    id: string;
    text: string;
    type: string;
    priority: TaskPriority;
    status: RecommendationStatus;
    acknowledgedAt?: string | Date | null;
    targetMember: { fullNameAr?: string | null; fullNameEn: string };
    author?: { name: string } | null;
  }[];
  currentUserId?: string;
  currentMemberId?: string;
  isManager?: boolean;
  canReview?: boolean;
}

export default function DepartmentWorkspaceView({
  department,
  tasks,
  recommendations = [],
  currentUserId,
  currentMemberId,
  isManager,
  canReview,
}: DepartmentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "board" | "operational" | "roster" | "projects" | "announcements"
  >("board");

  const [isPending, startTransition] = useTransition();
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  // Announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Metrics
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReviewCount = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  ).length;
  const upcomingCount = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= sevenDaysFromNow &&
      t.status !== "DONE"
  ).length;

  const leadMembership = department.memberships.find((m) => m.teamRole === "LEAD");
  const regularMemberships = department.memberships.filter((m) => m.teamRole !== "LEAD");

  const eligibleMembers = department.memberships.map((m) => ({
    id: m.member.id,
    fullNameEn: m.member.fullNameEn,
    fullNameAr: m.member.fullNameAr,
    email: m.member.email,
  }));

  const departmentProjects = department.projects.map((p) => ({
    id: p.project.id,
    slug: p.project.slug,
  }));

  // Handle broadcast announcement
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    setAnnouncementSuccess(null);
    setAnnouncementError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("teamId", department.id);
      fd.append("title", annTitle.trim());
      fd.append("message", annMessage.trim());
      const res = await broadcastDepartmentAnnouncementAction(fd);
      if (!res.success) {
        setAnnouncementError(res.error || "Failed to broadcast announcement");
      } else {
        setAnnouncementSuccess("تم إرسال التعميم لجميع أعضاء القسم بنجاح!");
        setAnnTitle("");
        setAnnMessage("");
      }
    });
  };

  // Handle acknowledge recommendation
  const handleAcknowledge = (recId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("recommendationId", recId);
      await acknowledgeRecommendationAction(fd);
    });
  };

  return (
    <div className="space-y-8">
      {/* Department Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface border border-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>مساحة العمل التشغيلية للقسم / Department Workspace</span>
              <span>•</span>
              <span className="uppercase font-bold">{department.code}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {department.nameAr} / {department.nameEn}
            </h1>

            <p className="text-xs text-muted max-w-3xl leading-relaxed">
              {department.descriptionAr}
            </p>
          </div>

          {/* Team Lead Indicator */}
          {leadMembership && (
            <div className="p-3.5 rounded-2xl bg-background/60 border border-border flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent font-mono font-bold flex items-center justify-center">
                {leadMembership.member.fullNameEn.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent font-bold uppercase block">
                  قائد القسم / Team Lead
                </span>
                <span className="text-xs font-bold text-foreground">
                  {leadMembership.member.fullNameAr || leadMembership.member.fullNameEn}
                </span>
                <span className="text-[10px] text-muted block">
                  {leadMembership.member.jobTitleAr || leadMembership.member.jobTitleEn}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-muted uppercase">إجمالي المهام</span>
            <p className="text-lg font-bold text-foreground">{totalTasks}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-accent uppercase">جاري العمل</span>
            <p className="text-lg font-bold text-accent">{inProgressCount}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-blue-400 uppercase">قيد المراجعة</span>
            <p className="text-lg font-bold text-blue-400">{inReviewCount}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">المنجزة</span>
            <p className="text-lg font-bold text-emerald-400">{doneCount}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-rose-400 uppercase">متأخرة / Overdue</span>
            <p className="text-lg font-bold text-rose-400">{overdueCount}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/50 border border-border space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase">مواعيد قادمة</span>
            <p className="text-lg font-bold text-amber-400">{upcomingCount}</p>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "board"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <FolderKanban size={14} />
          <span>لوحة المهام وكانبان / Kanban Board</span>
        </button>

        <button
          onClick={() => setActiveTab("operational")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "operational"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Sparkles size={14} />
          <span>
            {department.code === "MARKETING"
              ? "الخطة التسويقية والمخرجات / Marketing Ops"
              : department.code === "ENGINEERING"
              ? "مستودعات التطوير والـ PRs / Dev Ops"
              : department.code === "DESIGN"
              ? "ملفات التصميم وفيغما / Design Ops"
              : "تحليل المتطلبات والـ PRD / Analysis Ops"}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "roster"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Users size={14} />
          <span>فريق العمل / Members ({department.memberships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "projects"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Layers size={14} />
          <span>المشاريع المسندة / Projects ({department.projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-3 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "announcements"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Megaphone size={14} />
          <span>التعميمات والتوجيهات / Announcements & Guidance</span>
        </button>
      </div>

      {/* TAB 1: KANBAN TASK BOARD */}
      {activeTab === "board" && (
        <DepartmentKanbanBoard
          tasks={tasks}
          currentUserId={currentUserId}
          currentMemberId={currentMemberId}
          isManager={isManager}
          canReview={canReview}
          eligibleMembers={eligibleMembers}
          projects={departmentProjects}
        />
      )}

      {/* TAB 2: DEPARTMENT-SPECIFIC OPERATIONAL FOCUS */}
      {activeTab === "operational" && (
        <div className="space-y-6">
          {/* MARKETING DEPARTMENT FOCUS */}
          {department.code === "MARKETING" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-accent/30 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Megaphone size={18} />
                  <h3 className="text-base font-bold text-foreground">
                    المركز التشغيلي للتسويق وإطلاق المشاريع / Marketing Operations Hub
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  إدارة الحملات الترويجية، مراجعة واعتماد المحتوى الإبداعي، جدولة المنشورات، ومتابعة مخرجات الحملات عبر مشاريع سديم.
                </p>
              </div>

              {/* Marketing Deliverables & Campaign Queue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Campaign Tasks */}
                <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                      <Calendar size={14} className="text-accent" />
                      <span>مهام المحتوى والحملات / Content & Campaigns</span>
                    </h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                      {tasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {tasks.slice(0, 6).map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-background/50 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate block">
                            {t.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                            <span className="text-accent">{t.status}</span>
                            <span>•</span>
                            <span>{t.assignedMember?.fullNameAr || t.assignedMember?.fullNameEn || "Unassigned"}</span>
                          </div>
                        </div>

                        {t.deliverables && t.deliverables.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 shrink-0">
                            {t.deliverables.length} مخرج
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submitted Marketing Collateral & Deliverables */}
                <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    <span>المخرجات الإبداعية المعتمدة / Creative Deliverables</span>
                  </h4>

                  {tasks.flatMap((t) => t.deliverables || []).length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted rounded-2xl bg-background/30 border border-border">
                      لا توجد مخرجات مسوقين معتمدة حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tasks
                        .flatMap((t) => (t.deliverables || []).map((d) => ({ ...d, taskTitle: t.title })))
                        .slice(0, 6)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="p-3 rounded-xl bg-background/50 border border-border flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-xs font-bold text-foreground truncate block">
                                {d.title}
                              </span>
                              <span className="text-[10px] font-mono text-muted truncate block">
                                ضمن: {d.taskTitle}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                                d.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ENGINEERING DEPARTMENT FOCUS */}
          {department.code === "ENGINEERING" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-accent/30 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Github size={18} />
                  <h3 className="text-base font-bold text-foreground">
                    مستودعات التطوير ومراجعة الأكواد / Engineering Repositories & PRs
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  ربط مهام التطوير بمستودعات GitHub، تتبع طلبات السحب (Pull Requests)، قوائم فحص النشر والاختبارات.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  روابط الـ PRs ومخرجات البرمجة المرتبطة
                </h4>
                <div className="space-y-2.5">
                  {tasks
                    .flatMap((t) =>
                      (t.deliverables || [])
                        .filter((d) => d.type === "GITHUB_LINK")
                        .map((d) => ({ ...d, taskTitle: t.title }))
                    )
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-background/50 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-foreground">{d.title}</span>
                          <span className="text-[10px] text-muted font-mono block">
                            المهمة: {d.taskTitle}
                          </span>
                        </div>
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-border bg-background hover:border-accent text-xs font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>عرض المستودع</span>
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* DESIGN DEPARTMENT FOCUS */}
          {department.code === "DESIGN" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-accent/30 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Figma size={18} />
                  <h3 className="text-base font-bold text-foreground">
                    ملفات التصميم وفيغما / Design System & Figma Deliverables
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  متابعة نماذج UI/UX الأولية، روابط فيغما، ومراجعات تجربة المستخدم للمشاريع.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  نماذج ومخططات Figma المسلمة
                </h4>
                <div className="space-y-2.5">
                  {tasks
                    .flatMap((t) =>
                      (t.deliverables || [])
                        .filter((d) => d.type === "FIGMA_LINK")
                        .map((d) => ({ ...d, taskTitle: t.title }))
                    )
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-background/50 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-foreground">{d.title}</span>
                          <span className="text-[10px] text-muted font-mono block">
                            المهمة: {d.taskTitle}
                          </span>
                        </div>
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-border bg-background hover:border-accent text-xs font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>فتح فيغما</span>
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYSIS DEPARTMENT FOCUS */}
          {department.code === "ANALYSIS" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-accent/30 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <FileText size={18} />
                  <h3 className="text-base font-bold text-foreground">
                    تحليل النظم والمنتجات / PRD & Business Requirements
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  إعداد وثائق متطلبات المنتجات (PRD)، أبحاث السوق ودراسات الجدوى للمشاريع الريادية.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  وثائق الـ PRD والأبحاث
                </h4>
                <div className="space-y-2.5">
                  {tasks
                    .flatMap((t) =>
                      (t.deliverables || [])
                        .filter((d) => d.type === "DOCUMENT_LINK" || d.type === "FILE_UPLOAD")
                        .map((d) => ({ ...d, taskTitle: t.title }))
                    )
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-background/50 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-foreground">{d.title}</span>
                          <span className="text-[10px] text-muted font-mono block">
                            المهمة: {d.taskTitle}
                          </span>
                        </div>
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-border bg-background hover:border-accent text-xs font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>عرض الوثيقة</span>
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {department.memberships.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-surface border border-border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent font-mono font-bold flex items-center justify-center text-sm">
                      {m.member.fullNameEn.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {m.member.fullNameAr || m.member.fullNameEn}
                      </h4>
                      <p className="text-xs text-muted">
                        {m.member.jobTitleAr || m.member.jobTitleEn}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      m.teamRole === "LEAD"
                        ? "bg-accent/20 text-accent border-accent/30 font-bold"
                        : "bg-background text-muted border-border"
                    }`}
                  >
                    {m.teamRole}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/50 text-[11px] font-mono text-muted space-y-1">
                  <div>البريد: {m.member.email}</div>
                  {m.member.phone && <div>الهاتف: {m.member.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ALLOCATED VENTURES / PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {department.projects.map((p) => {
              const arTranslation = p.project.translations.find((t) => t.locale === "ar");
              const enTranslation = p.project.translations.find((t) => t.locale === "en");

              return (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl bg-surface border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-accent uppercase font-bold">
                      {p.project.ownershipType}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                      {p.project.developmentStatus}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-foreground">
                    {arTranslation?.title || enTranslation?.title || p.project.slug}
                  </h4>

                  <div className="pt-2">
                    <Link
                      href={`/admin/projects/${p.project.id}`}
                      className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                    >
                      <span>عرض تفاصيل المشروع</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS & RECOMMENDATIONS */}
      {activeTab === "announcements" && (
        <div className="space-y-8">
          {/* Broadcast Announcement Form (For Leads and Admins) */}
          {(isManager || leadMembership?.member.id === currentMemberId) && (
            <div className="p-6 rounded-3xl bg-surface border border-accent/30 space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <Megaphone size={18} />
                <h3 className="text-sm font-bold text-foreground">
                  بث تعميم رسمي لأعضاء القسم / Broadcast Department Announcement
                </h3>
              </div>

              {announcementSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  {announcementSuccess}
                </div>
              )}

              {announcementError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {announcementError}
                </div>
              )}

              <form onSubmit={handleBroadcast} className="space-y-3">
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="عنوان التعميم (e.g. تحديث سياسات تسليم المتطلبات)..."
                  className="w-full text-xs bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-accent outline-none"
                />

                <textarea
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="نص التعميم والتعليمات الموجهة لجميع أعضاء الفريق..."
                  rows={3}
                  className="w-full text-xs bg-background border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted focus:border-accent outline-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending || !annTitle.trim() || !annMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-accent text-stone-950 font-bold text-xs font-mono hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={13} />
                    <span>إرسال التعميم الفوري / Broadcast to All</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Department Administrative Recommendations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span>التوجيهات الإدارية الموجهة لأعضاء القسم / Recommendations</span>
            </h3>

            {recommendations.length === 0 ? (
              <p className="text-xs text-muted p-6 rounded-2xl bg-surface border border-border text-center">
                لا توجد توجيهات إدارية مفتوحة حالياً.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-accent">
                          {rec.type}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          إلى: {rec.targetMember.fullNameAr || rec.targetMember.fullNameEn}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed max-w-2xl">{rec.text}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rec.status === "ACKNOWLEDGED" ? (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>تم التأكيد والاستلام</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(rec.id)}
                          className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-stone-950 text-xs font-mono transition-colors"
                        >
                          تأكيد الاستلام
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
