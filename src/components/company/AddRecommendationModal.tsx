"use client";

import { useState } from "react";
import { createRecommendationAction } from "@/app/admin/company/actions";
import { Sparkles, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface MemberOption {
  id: string;
  fullNameEn: string;
  fullNameAr: string | null;
  jobTitleEn: string;
}

interface ProjectOption {
  id: string;
  slug: string;
}

interface Props {
  members: MemberOption[];
  projects: ProjectOption[];
}

export default function AddRecommendationModal({ members, projects }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createRecommendationAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create recommendation");
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
        <Sparkles size={14} />
        <span>توجيه إداري جديد / Post Guidance</span>
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
                إرسال توجيه إداري أو ملاحظة أداء
              </h2>
              <p className="text-xs text-muted mt-1">
                توجيه موجه للعضو، ملاحظة أداء، أو إشادة مهنية مع تحديد مستوى الخصوصية
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
                <span>تم إرسال التوجيه الإداري بنجاح!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    العضو المستهدف / Target Member *
                  </label>
                  <select
                    name="targetMemberId"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">اختر العضو</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullNameAr || m.fullNameEn} ({m.jobTitleEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">نوع التوجيه / Type</label>
                  <select
                    name="type"
                    defaultValue="GUIDANCE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="GUIDANCE">توجيه إداري (Guidance)</option>
                    <option value="DIRECTION">توجيه استراتيجي (Direction)</option>
                    <option value="IMPROVEMENT">تطوير وتحسين (Improvement)</option>
                    <option value="PROCESS">إجراءات وعمليات (Process)</option>
                    <option value="TRAINING">تدريب وتمكين (Training)</option>
                    <option value="FOLLOW_UP">متابعة إدارية (Follow-up)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  نص التوجيه / Recommendation Text *
                </label>
                <textarea
                  name="text"
                  required
                  rows={4}
                  placeholder="اكتب التوجيه الإداري أو الملاحظة بوضوح ودقة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <option value="URGENT">عاجلة (Urgent)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">الظهور / Visibility</label>
                  <select
                    name="visibility"
                    defaultValue="SHARED_WITH_MEMBER"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="SHARED_WITH_MEMBER">يظهر للعضو المستهدف (Shared with Member)</option>
                    <option value="PRIVATE_MANAGEMENT">سري للإدارة فقط (Private Management)</option>
                    <option value="TEAM_VISIBLE">معلن لكامل الفريق (Team Visible)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">المشروع ذو الصلة</label>
                  <select
                    name="relatedProjectId"
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
                  {loading ? "جاري الإرسال..." : "إرسال التوجيه / Post Recommendation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
