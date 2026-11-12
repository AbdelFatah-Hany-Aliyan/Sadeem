"use client";

import { useState } from "react";
import { createTaskAction } from "@/app/admin/company/actions";
import { PlusCircle, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface MemberOption {
  id: string;
  fullNameEn: string;
  fullNameAr: string | null;
  jobTitleEn: string;
}

interface TeamOption {
  id: string;
  code: string;
  nameAr: string;
}

interface ProjectOption {
  id: string;
  slug: string;
}

interface Props {
  members: MemberOption[];
  teams: TeamOption[];
  projects: ProjectOption[];
}

export default function AddTaskModal({ members, teams, projects }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createTaskAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create task");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1000);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <PlusCircle size={14} />
        <span>مهمة جديدة / New Task</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-muted hover:text-foreground hover:bg-background/80 transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                إنشاء مهمة عمل جديدة
              </h2>
              <p className="text-xs text-muted mt-1">
                تحديد نطاق المهمة، إسنادها لعضو أو قسم، وتحديد اشتراط المراجعة
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>تم إنشاء المهمة بنجاح!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  عنوان المهمة / Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="مثال: تحليل متطلبات نظام المدفوعات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  الوصف والتفاصيل / Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="اكتب تفاصيل ومخرجات المهمة المتوقعة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">الأولوية / Priority</label>
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="LOW">منخفضة (Low)</option>
                    <option value="MEDIUM">متوسطة (Medium)</option>
                    <option value="HIGH">عالية (High)</option>
                    <option value="URGENT">حرجة وعاجلة (Urgent)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">تاريخ التسليم / Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">إسناد إلى عضو / Assignee</label>
                  <select
                    name="assignedMemberId"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">غير مسند لعضو محدد</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullNameAr || m.fullNameEn} ({m.jobTitleEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">مراجع الجودة / Reviewer</label>
                  <select
                    name="reviewerMemberId"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">بدون مراجع محدد</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullNameAr || m.fullNameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">القسم / Team</label>
                  <select
                    name="teamId"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">بدون قسم محدد</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameAr} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">المشروع المرتبط / Project</label>
                  <select
                    name="projectId"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
                  >
                    <option value="">بدون مشروع محدد</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/60 border border-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="reviewRequired"
                    value="true"
                    defaultChecked
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-foreground font-medium">
                    تتطلب اعتماد مراجعة رسمية قبل الإغلاق (Review Required)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAiAssisted"
                    value="true"
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-foreground">
                    مهمة بمساعدة الذكاء الاصطناعي (AI Assisted)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground text-xs font-mono transition-colors"
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? "جاري الإنشاء..." : "إنشاء المهمة / Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
