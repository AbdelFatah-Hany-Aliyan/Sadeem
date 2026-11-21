"use client";

import { useState } from "react";
import { createMemberAction } from "@/app/admin/company/actions";
import { UserPlus, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface TeamOption {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
}

export default function AddMemberModal({ teams }: { teams: TeamOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "warning";
    title: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(e.currentTarget);
    const res = await createMemberAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create member");
    } else {
      const data = res.data;
      if (data?.sendInvite && data?.deliveryStatus === "BLOCKED_CONFIGURATION") {
        setNotice({
          type: "warning",
          title: "تم إنشاء العضو — إرسال البريد محظور",
          message:
            "تم حفظ بيانات العضو وإنشاء رمز الدعوة بنجاح. تنبيه: تم حظر إرسال البريد الحقيقي لأن مزود البريد (Resend) غير مهيأ في بيئة العمل.",
        });
      } else if (data?.sendInvite && data?.deliveryStatus === "FAILED") {
        setNotice({
          type: "warning",
          title: "تم إنشاء العضو — تعذر إرسال البريد",
          message: `تم حفظ بيانات العضو، ولكن فشل إرسال بريد الدعوة: ${data?.error || "خطأ غير متوقع من المزود"}. يمكنك إعادة المحاولة لاحقاً.`,
        });
      } else if (data?.sendInvite) {
        setNotice({
          type: "success",
          title: "تم إنشاء العضو وإرسال الدعوة",
          message: "تم إنشاء العضو بنجاح وجاري إرسال الدعوة عبر مزود البريد المعتمد.",
        });
      } else {
        setNotice({
          type: "success",
          title: "تم إنشاء العضو بنجاح",
          message: "تم حفظ بيانات العضو وتعيينه في الفريق دون إرسال دعوة.",
        });
      }
      setTimeout(() => {
        setIsOpen(false);
        setNotice(null);
      }, 3000);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <UserPlus size={14} />
        <span>إضافة عضو جديد / Add Member</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-muted hover:text-foreground hover:bg-background/80 transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                إضافة عضو جديد إلى سديم
              </h2>
              <p className="text-xs text-muted mt-1">
                تسجيل بيانات العضو وتحديد الفريق والدور، مع إمكانية إرسال دعوة الانضمام فوراً
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1 border ${
                  notice.type === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {notice.type === "warning" ? (
                    <AlertCircle size={15} className="shrink-0 text-amber-400" />
                  ) : (
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  )}
                  <span>{notice.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted font-normal pr-6">
                  {notice.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    الاسم الكامل (بالعربية)
                  </label>
                  <input
                    type="text"
                    name="fullNameAr"
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    name="fullNameEn"
                    required
                    placeholder="e.g. Ahmed Ali"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    البريد الإلكتروني المعتمد *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@sadeem.studio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    رقم الهاتف / Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+966 50 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    المسمى الوظيفي (العربية)
                  </label>
                  <input
                    type="text"
                    name="jobTitleAr"
                    placeholder="مهندس نظم أول"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Job Title (English) *
                  </label>
                  <input
                    type="text"
                    name="jobTitleEn"
                    required
                    placeholder="Senior Systems Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">نوع العضوية</label>
                  <select
                    name="membershipType"
                    defaultValue="EMPLOYEE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="EMPLOYEE">موظف (Employee)</option>
                    <option value="CONTRACTOR">متعاقد (Contractor)</option>
                    <option value="CONSULTANT">مستشار (Consultant)</option>
                    <option value="FOUNDER">مؤسس (Founder)</option>
                    <option value="ADVISOR">مرشد (Advisor)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">القسم الأساسي</label>
                  <select
                    name="primaryTeamId"
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
                  <label className="font-medium text-foreground">الدور في الفريق</label>
                  <select
                    name="teamRole"
                    defaultValue="MEMBER"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="MEMBER">عضو (Member)</option>
                    <option value="LEAD">قائد فريق (Lead)</option>
                    <option value="REVIEWER">مراجع (Reviewer)</option>
                  </select>
                </div>
              </div>

              {/* Dashboard Access Role */}
              <div className="p-4 rounded-2xl bg-background/60 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">
                      صلاحية الدخول للوحة التحكم / Admin Role
                    </span>
                    <p className="text-[11px] text-muted">
                      تحديد الصلاحية في حال رغبتك بإتاحة وصول العضو للوحة تحكم سديم
                    </p>
                  </div>
                </div>

                <select
                  name="adminRole"
                  defaultValue="TEAM_MEMBER"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
                >
                  <option value="TEAM_MEMBER">TEAM_MEMBER (عضو فريق - مساحة العمل والمهام فقط)</option>
                  <option value="TEAM_LEAD">TEAM_LEAD (قائد فريق - إدارة مهام الفريق والمراجعة)</option>
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER (مدير مشاريع)</option>
                  <option value="QA_REVIEWER">QA_REVIEWER (مراجع جودة واختبارات)</option>
                  <option value="COMPANY_ADMIN">COMPANY_ADMIN (مدير إداري كامل الصلاحيات)</option>
                </select>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name="sendInvite"
                    value="true"
                    defaultChecked
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-foreground">
                    إرسال دعوة الانضمام عبر البريد الإلكتروني فوراً
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
                  {loading ? "جاري الحفظ..." : "حفظ وإرسال / Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
