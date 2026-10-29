"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { submitBusinessProjectAction } from "@/app/admin/actions";
import { 
  ProjectCategory, 
  ExpectedTimeline, 
  BudgetRange, 
  ContactChannel 
} from "@prisma/client";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function StartProjectForm() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel>(ContactChannel.EMAIL);
  const [phoneOrHandle, setPhoneOrHandle] = useState("");
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>(ProjectCategory.ENTERPRISE_SYSTEM);
  const [problemStatement, setProblemStatement] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [expectedTimeline, setExpectedTimeline] = useState<ExpectedTimeline>(ExpectedTimeline.ONE_TO_THREE_MONTHS);
  const [budgetRange, setBudgetRange] = useState<BudgetRange>(BudgetRange.UNDISCLOSED);
  const [consentGiven, setConsentGiven] = useState(false);

  // Spam prevention
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormLoadedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consentGiven) {
      setErrorMsg(isRtl ? "يرجى الموافقة على إشعار الخصوصية للمتابعة." : "Please agree to the privacy notice to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitBusinessProjectAction({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        contactChannel,
        phoneOrHandle: phoneOrHandle.trim() || undefined,
        projectCategory,
        problemStatement: problemStatement.trim(),
        desiredOutcome: desiredOutcome.trim(),
        expectedTimeline,
        budgetRange,
        locale: language,
        consentGiven,
        honeypot,
        formLoadedAt,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || res.errors?.[0] || (isRtl ? "تعذر إرسال الطلب، يرجى المحاولة لاحقاً." : "Failed to submit request. Please try again."));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl border border-accent/40 bg-surface/90 backdrop-blur-md text-center max-w-2xl mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRtl ? "تم استلام تفاصيل مشروعكم بنجاح" : "Project Inquiry Received"}
        </h3>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          {isRtl 
            ? "شكراً لتواصلكم مع سديم. يقوم الفريق الهندسي بمراجعة متطلبات نظامكم التشغيلي وسنتواصل معكم عبر وسيلة الاتصال المفضلة خلال 24-48 ساعة عمل."
            : "Thank you for reaching out to Sadeem. Our engineering team will review your business requirements and contact you via your preferred channel within 24-48 business hours."}
        </p>
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md"
          >
            {isRtl ? "العودة للرئيسية" : "Return to Homepage"}
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName("");
              setEmail("");
              setProblemStatement("");
              setDesiredOutcome("");
              setConsentGiven(false);
            }}
            className="px-6 py-3 rounded-xl border border-border bg-surface text-muted hover:text-foreground transition-colors"
          >
            {isRtl ? "إرسال طلب مشروع آخر" : "Submit Another Inquiry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto text-left" dir={isRtl ? "rtl" : "ltr"}>
      {/* Honeypot field - visually hidden from human users */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website_url_check">Leave this field blank</label>
        <input
          type="text"
          id="website_url_check"
          name="website_url_check"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Group 1: Submitter Info */}
      <div className="space-y-4 p-6 sm:p-8 rounded-2xl border border-border bg-surface/70 backdrop-blur-sm">
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-bold flex items-center gap-2">
          <Building2 size={14} />
          {isRtl ? "01 // معلومات الاتصال والمؤسسة" : "01 // Contact & Organization"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "الاسم الكامل *" : "Full Name *"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRtl ? "مثال: عبدالله الهاشمي" : "e.g. Sarah Jenkins"}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "البريد الإلكتروني للعمل *" : "Work Email *"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "اسم الشركة أو المنظمة (اختياري)" : "Company / Organization (Optional)"}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={isRtl ? "اسم شركتك" : "Your organization"}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "قناة التواصل المفضلة" : "Preferred Contact Channel"}
            </label>
            <select
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value as ContactChannel)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            >
              <option value={ContactChannel.EMAIL}>{isRtl ? "البريد الإلكتروني (Email)" : "Email"}</option>
              <option value={ContactChannel.WHATSAPP}>{isRtl ? "واتساب (WhatsApp)" : "WhatsApp"}</option>
              <option value={ContactChannel.PHONE}>{isRtl ? "اتصال هاتفي (Phone Call)" : "Phone Call"}</option>
            </select>
          </div>
        </div>

        {contactChannel !== ContactChannel.EMAIL && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp Number *"}
            </label>
            <input
              type="text"
              required
              value={phoneOrHandle}
              onChange={(e) => setPhoneOrHandle(e.target.value)}
              placeholder="+966 5x xxx xxxx"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* Group 2: Project Specifications */}
      <div className="space-y-4 p-6 sm:p-8 rounded-2xl border border-border bg-surface/70 backdrop-blur-sm">
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-bold flex items-center gap-2">
          <Sparkles size={14} />
          {isRtl ? "02 // متطلبات وطبيعة النظام المطلوب" : "02 // System & Project Scope"}
        </h3>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted">
            {isRtl ? "تصنيف النظام المطلوب *" : "Project Category *"}
          </label>
          <select
            value={projectCategory}
            onChange={(e) => setProjectCategory(e.target.value as ProjectCategory)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
          >
            <option value={ProjectCategory.ENTERPRISE_SYSTEM}>
              {isRtl ? "نظام أعمال مؤسسي داخلي (Custom Enterprise Business System)" : "Custom Enterprise Business System"}
            </option>
            <option value={ProjectCategory.WEB_PLATFORM}>
              {isRtl ? "منصة ويب مخصصة أو بوابة عملاء (Web Platform / Client Portal)" : "Web Platform / Client Portal"}
            </option>
            <option value={ProjectCategory.MOBILE_APPLICATION}>
              {isRtl ? "تطبيق هاتف ذكي (Mobile Application iOS / Android)" : "Mobile Application (iOS / Android)"}
            </option>
            <option value={ProjectCategory.ECOSYSTEM_INTEGRATION}>
              {isRtl ? "تكامل أنظمة وأتمتة مسارات عمل (System Integration & Automation)" : "System Integration & Workflow Automation"}
            </option>
            <option value={ProjectCategory.OTHER}>
              {isRtl ? "حل تقني مخصص آخر (Other Custom Solution)" : "Other Custom Engineering Solution"}
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted">
            {isRtl ? "التحدي التشغيلي أو المشكلة المطلوب حلها برمجياً *" : "The Business Problem to Solve *"}
          </label>
          <textarea
            rows={3}
            required
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder={isRtl 
              ? "اشرح باختصار التحدي التشغيلي الحالي أو العمليات اليدوية التي ترغب في أتمتتها وتطويرها..."
              : "Describe the operational bottleneck, manual workflows, or challenge you want to solve..."}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors resize-y leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted">
            {isRtl ? "النتيجة المرجوة أو الأثر المستهدف بعد الإطلاق *" : "Desired Outcome & Target Impact *"}
          </label>
          <textarea
            rows={2}
            required
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            placeholder={isRtl 
              ? "ما هو الأثر الذي تحتاجه؟ (مثلاً: تقليل وقت إنجاز الطلبات بنسبة 50%، توحيد بيانات الفروع...)"
              : "What does success look like? (e.g. 50% reduced processing time, unified inventory across branches...)"}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors resize-y leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "الإطار الزمني المتوقع *" : "Expected Timeline *"}
            </label>
            <select
              value={expectedTimeline}
              onChange={(e) => setExpectedTimeline(e.target.value as ExpectedTimeline)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            >
              <option value={ExpectedTimeline.IMMEDIATE}>{isRtl ? "فوري (خلال شهر واحد)" : "Immediate (< 1 month)"}</option>
              <option value={ExpectedTimeline.ONE_TO_THREE_MONTHS}>{isRtl ? "1 إلى 3 أشهر" : "1 to 3 months"}</option>
              <option value={ExpectedTimeline.THREE_TO_SIX_MONTHS}>{isRtl ? "3 إلى 6 أشهر" : "3 to 6 months"}</option>
              <option value={ExpectedTimeline.FLEXIBLE}>{isRtl ? "مرن حسب المخطط الهندسي" : "Flexible / To be defined"}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted">
              {isRtl ? "الميزانية الاستثمارية التقريبية (اختياري)" : "Approximate Budget Range (Optional)"}
            </label>
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
            >
              <option value={BudgetRange.UNDISCLOSED}>{isRtl ? "غير محدد حالياً / مناقشة لاحقة" : "Undisclosed / Discuss later"}</option>
              <option value={BudgetRange.LESS_THAN_10K}>&lt; $10,000</option>
              <option value={BudgetRange.TEN_TO_25K}>$10,000 - $25,000</option>
              <option value={BudgetRange.TWENTY_FIVE_TO_50K}>$25,000 - $50,000</option>
              <option value={BudgetRange.FIFTY_K_PLUS}>$50,000+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Consent Checkbox */}
      <div className="p-4 rounded-xl border border-border bg-background/50 flex items-start gap-3 text-xs font-mono">
        <input
          type="checkbox"
          id="projectConsent"
          required
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-0.5 rounded border-border text-accent focus:ring-accent"
        />
        <label htmlFor="projectConsent" className="text-muted leading-relaxed cursor-pointer">
          {isRtl ? (
            <>
              أوافق على قيام استوديو سديم بمعالجة البيانات المقدمة لغرض التواصل ودراسة متطلبات النظام وفقاً لـ{" "}
              <span className="text-foreground font-semibold">إشعار الخصوصية المعتمد</span>. لا يُطلب منكم تقديم أي كلمات مرور أو وثائق مالية حساسة.
            </>
          ) : (
            <>
              I consent to Sadeem processing this submitted information for discovery and system evaluation purposes in accordance with the published{" "}
              <span className="text-foreground font-semibold">Privacy Policy</span>. We do not require or request sensitive credentials or confidential documents.
            </>
          )}
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-accent text-[#0B1220] font-bold text-sm uppercase tracking-wider hover:bg-accent-hover transition-all duration-300 shadow-[0_4px_25px_rgba(194,142,98,0.25)] flex items-center justify-center gap-2 group disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>{isRtl ? "جاري الإرسال والتسجيل..." : "Submitting Inquiry..."}</span>
          </>
        ) : (
          <>
            <span>{isRtl ? "إرسال طلب استكشاف المشروع" : "Submit Project Inquiry"}</span>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </>
        )}
      </button>
    </form>
  );
}
