"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { submitVenturePitchAction } from "@/app/admin/actions";
import { VentureStage, ContactChannel } from "@prisma/client";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Rocket, 
  Sparkles,
  ShieldAlert,
  Info
} from "lucide-react";

export default function PitchIdeaForm() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ideaName, setIdeaName] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel>(ContactChannel.EMAIL);
  const [phoneOrHandle, setPhoneOrHandle] = useState("");
  const [ventureStage, setVentureStage] = useState<VentureStage>(VentureStage.IDEA);
  const [problemStatement, setProblemStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [founderExpertise, setFounderExpertise] = useState("");
  const [expectedInvolvement, setExpectedInvolvement] = useState("");
  const [existingResources, setExistingResources] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  // Anti-spam signals
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
      setErrorMsg(isRtl ? "يرجى الإقرار بإشعار الخصوصية والملكية الفكرية للمتابعة." : "Please acknowledge the privacy and intellectual property notice to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitVenturePitchAction({
        name: name.trim(),
        email: email.trim(),
        ideaName: ideaName.trim() || undefined,
        contactChannel,
        phoneOrHandle: phoneOrHandle.trim() || undefined,
        ventureStage,
        problemStatement: problemStatement.trim(),
        targetAudience: targetAudience.trim(),
        founderExpertise: founderExpertise.trim(),
        expectedInvolvement: expectedInvolvement.trim(),
        existingResources: existingResources.trim() || undefined,
        locale: language,
        consentGiven,
        honeypot,
        formLoadedAt,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || res.errors?.[0] || (isRtl ? "تعذر إرسال الطرح، يرجى المحاولة لاحقاً." : "Failed to submit pitch. Please try again."));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl border border-purple-500/40 bg-surface/90 backdrop-blur-md text-center max-w-2xl mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {isRtl ? "تم استلام فكرتك الريادية بنجاح" : "Venture Pitch Received Successfully"}
          </h3>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
            {isRtl
              ? "شكراً لثقتك في استوديو سديم. يراجع فريق بناء المشاريع الأفكار المطروحة بعناية تقنية واستثمارية. سنتواصل معك عبر وسيلة الاتصال المفضلة لديك خلال 3 إلى 5 أيام عمل لمناقشة الخطوة التالية."
              : "Thank you for sharing your venture vision with Sadeem Studio. Our venture building team reviews all submissions for technical viability and market fit. We will reach out via your preferred contact channel within 3 to 5 business days."}
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border/60 transition-all font-medium text-sm"
          >
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all font-medium text-sm"
          >
            {isRtl ? "استكشف أعمالنا" : "Explore Case Studies"}
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </div>
    );
  }

  const stageOptions = [
    { value: VentureStage.IDEA, labelEn: "Concept & Problem Definition", labelAr: "مفهوم أولي وتحديد المشكلة" },
    { value: VentureStage.RESEARCH, labelEn: "Research & Market Validation", labelAr: "أبحاث وتحقق من السوق" },
    { value: VentureStage.PROTOTYPE, labelEn: "Prototype & Architecture", labelAr: "نموذج أولي وتخطيط هيكلي" },
    { value: VentureStage.MVP, labelEn: "Working MVP Built", labelAr: "منتج تجريبي أدنى جاهز (MVP)" },
    { value: VentureStage.EXISTING_PRODUCT, labelEn: "Live Product / Scaling", labelAr: "منتج نشط / في مرحلة النمو" },
  ];

  const channelOptions = [
    { value: ContactChannel.EMAIL, labelEn: "Email", labelAr: "البريد الإلكتروني" },
    { value: ContactChannel.WHATSAPP, labelEn: "WhatsApp", labelAr: "واتساب" },
    { value: ContactChannel.PHONE, labelEn: "Phone Call", labelAr: "اتصال هاتفي" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
      {/* Bot Trap */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_url_check">Leave empty</label>
        <input
          id="website_url_check"
          type="text"
          name="website_url_check"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Header Badge */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
        <Rocket className="shrink-0 text-purple-400" size={24} />
        <div className="text-sm">
          <p className="font-semibold text-text-primary">
            {isRtl ? "محرك استوديو المشاريع — Sadeem Venture Studio" : "Venture Studio Engine — Sadeem"}
          </p>
          <p className="text-text-secondary text-xs sm:text-sm">
            {isRtl 
              ? "نشارك المؤسسين وأصحاب الرؤى بناء شركات رقمية متقدمة من مرحلة الفكرة وحتى الإطلاق والنمو." 
              : "We partner with visionary founders to engineer, launch, and scale proprietary digital ventures."}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Founder & Contact Details */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-surface/60 backdrop-blur-md space-y-6 shadow-lg">
        <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          {isRtl ? "1. معلومات المؤسس وطريقة التواصل" : "1. Founder & Contact Information"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "الاسم الكامل *" : "Full Name *"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRtl ? "مثال: م. فهد السالم" : "e.g. John Doe"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "البريد الإلكتروني *" : "Work / Personal Email *"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@example.com"
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "اسم الفكرة أو المشروع (اختياري)" : "Idea / Venture Name (Optional)"}
            </label>
            <input
              type="text"
              value={ideaName}
              onChange={(e) => setIdeaName(e.target.value)}
              placeholder={isRtl ? "مثال: منصة أفق" : "e.g. Horizon Labs"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "وسيلة التواصل المفضلة" : "Preferred Channel"}
            </label>
            <select
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value as ContactChannel)}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
            >
              {channelOptions.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {isRtl ? ch.labelAr : ch.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {contactChannel !== ContactChannel.EMAIL && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "رقم الهاتف / المعرّف *" : "Phone Number or Handle *"}
            </label>
            <input
              type="text"
              required
              value={phoneOrHandle}
              onChange={(e) => setPhoneOrHandle(e.target.value)}
              placeholder={isRtl ? "+966 5X XXX XXXX أو @username" : "+1 555-0100 or @username"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>
        )}
      </div>

      {/* Idea & Venture Details */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-surface/60 backdrop-blur-md space-y-6 shadow-lg">
        <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Rocket size={18} className="text-purple-400" />
          {isRtl ? "2. تفاصيل الفكرة والجمهور المستهدف" : "2. Venture Vision & Problem Space"}
        </h4>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "المرحلة الحالية للمشروع *" : "Current Venture Stage *"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stageOptions.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setVentureStage(opt.value)}
                className={`p-3 text-start rounded-xl text-xs sm:text-sm border transition-all ${
                  ventureStage === opt.value
                    ? "bg-purple-500/20 border-purple-500/70 text-purple-300 font-semibold shadow-inner"
                    : "bg-surface-elevated/70 border-border/60 hover:border-purple-500/40 text-text-secondary"
                }`}
              >
                {isRtl ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "المشكلة الحقيقية التي تعالجها الفكرة *" : "The Problem Being Addressed *"}
          </label>
          <textarea
            required
            rows={4}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder={
              isRtl
                ? "صف المشكلة أو الفجوة في السوق بدقة: من يعاني منها حالياً، ولماذا الحلول الحالية غير كافية؟"
                : "Describe the specific problem or market gap: who faces it today and why are current alternatives inadequate?"
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "الجمهور أو المستفيد المستهدف *" : "Target Audience / Beneficiary *"}
          </label>
          <input
            type="text"
            required
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder={
              isRtl
                ? "مثال: شركات الخدمات اللوجستية المتوسطة في الخليج العربي"
                : "e.g. Mid-sized supply chain operators in the MENA region"
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>
      </div>

      {/* Founder Background & Partnership Dynamic */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-surface/60 backdrop-blur-md space-y-6 shadow-lg">
        <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Info size={18} className="text-purple-400" />
          {isRtl ? "3. خلفيتك وما تبحث عنه في الشراكة" : "3. Founder Fit & Studio Partnership"}
        </h4>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "خبرتك في هذا المجال أو السوق *" : "Founder / Domain Expertise *"}
          </label>
          <textarea
            required
            rows={3}
            value={founderExpertise}
            onChange={(e) => setFounderExpertise(e.target.value)}
            placeholder={
              isRtl
                ? "ما هي خلفيتك العملية أو الأكاديمية؟ لماذا أنت الشخص المناسب لقيادة هذا المشروع؟"
                : "What is your relevant track record, industry background, or unfair advantage in this domain?"
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "مساهمتك المتوقعة وما تتوقعه من استوديو سديم *" : "Your Expected Role & What You Expect from Sadeem *"}
          </label>
          <textarea
            required
            rows={3}
            value={expectedInvolvement}
            onChange={(e) => setExpectedInvolvement(e.target.value)}
            placeholder={
              isRtl
                ? "مثال: سأتولى إدارة العمليات والعلاقات التجارية بدوام كامل، وأبحث عن سديم كشريك تقني ومؤسس مشارك لتطوير المنصة وهندسة المنتج."
                : "e.g. I will lead operations and commercial partnerships full-time; looking for Sadeem as technical co-founding partner to architect the product and engineering."
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "أي مواد أو روابط حالية (اختياري)" : "Existing Materials or Pitch Deck Link (Optional)"}
          </label>
          <input
            type="text"
            value={existingResources}
            onChange={(e) => setExistingResources(e.target.value)}
            placeholder={
              isRtl
                ? "رابط عرض تقديمي (Pitch Deck)، مستند، أو نموذج أولي"
                : "Link to Figma prototype, pitch deck, or public repo"
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-purple-500 focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>
      </div>

      {/* Mandatory Disclaimer & Confidentiality Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-200">
          <ShieldAlert size={18} className="shrink-0 text-amber-400" />
          <span>{isRtl ? "إشعار قانوني واستكشافي هام" : "Important Legal & Exploratory Notice"}</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 text-xs sm:text-sm">
          {isRtl
            ? "هذا الإرسال يهدف لبدء حوار استكشافي أولي ولا يُعد اتفاقية عدم إفصاح رسمية (NDA) أو تنازلاً عن أي ملكية فكرية. يُرجى عدم إرسال شيفرات برمجية سرية أو كلمات مرور أو أسرار تجارية مسجلة في هذا النموذج."
            : "This submission initiates an exploratory discussion and does not constitute a formal Non-Disclosure Agreement (NDA) or an intellectual property assignment. Please do not submit proprietary source code, access credentials, or sensitive trade secrets."}
        </p>
        <div className="pt-2 flex items-start gap-3">
          <input
            type="checkbox"
            id="pitch-consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-500/50 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <label htmlFor="pitch-consent" className="cursor-pointer text-text-primary text-xs sm:text-sm select-none">
            {isRtl
              ? "أؤكد أنني قرأت وفهمت الإشعار القانوني أعلاه، وأوافق على معالجة معلومات التواصل لأغراض التقييم والاستكشاف المشترك."
              : "I confirm that I have read and agree to the legal notice above, and consent to processing my contact info for exploratory evaluation."}
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-text-secondary text-center sm:text-start">
          {isRtl
            ? "نحترم خصوصية أفكاركم ويتم التعامل مع كل طلب بسرية مهنية عالية."
            : "We treat every inquiry with strict professional discretion and confidentiality."}
        </p>
        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isRtl ? "جاري الإرسال..." : "Submitting..."}</span>
            </>
          ) : (
            <>
              <span>{isRtl ? "إرسال الفكرة للاستكشاف" : "Submit Venture Pitch"}</span>
              {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
