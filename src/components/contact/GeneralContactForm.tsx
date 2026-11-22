"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { submitGeneralInquiryAction } from "@/app/admin/actions";
import { ContactChannel } from "@prisma/client";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Send,
  ShieldCheck
} from "lucide-react";

export default function GeneralContactForm() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel>(ContactChannel.EMAIL);
  const [phoneOrHandle, setPhoneOrHandle] = useState("");
  const [message, setMessage] = useState("");
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
      setErrorMsg(isRtl ? "يرجى الموافقة على إشعار الخصوصية للمتابعة." : "Please agree to the privacy notice to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitGeneralInquiryAction({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        contactChannel,
        phoneOrHandle: phoneOrHandle.trim() || undefined,
        message: message.trim(),
        locale: language,
        consentGiven,
        honeypot,
        formLoadedAt,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || res.errors?.[0] || (isRtl ? "تعذر إرسال الرسالة، يرجى المحاولة لاحقاً." : "Failed to send message. Please try again."));
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
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {isRtl ? "تم إرسال رسالتك بنجاح" : "Message Received Successfully"}
          </h3>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
            {isRtl
              ? "شكراً لتواصلك مع استوديو سديم. سيقوم فريقنا بمراجعة رسالتك والرد عليك خلال 24 إلى 48 ساعة عمل."
              : "Thank you for getting in touch with Sadeem Studio. Our team will review your inquiry and respond within 24 to 48 business hours."}
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border/60 transition-all font-medium text-sm"
          >
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  const channelOptions = [
    { value: ContactChannel.EMAIL, labelEn: "Email", labelAr: "البريد الإلكتروني" },
    { value: ContactChannel.WHATSAPP, labelEn: "WhatsApp", labelAr: "واتساب" },
    { value: ContactChannel.PHONE, labelEn: "Phone Call", labelAr: "اتصال هاتفي" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
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

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-surface/60 backdrop-blur-md space-y-6 shadow-lg">
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
              placeholder={isRtl ? "مثال: سارة العتيبي" : "e.g. Sarah Connor"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "البريد الإلكتروني *" : "Email Address *"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@domain.com"
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "الشركة أو المنظمة (اختياري)" : "Company / Organization (Optional)"}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={isRtl ? "اسم جهة العمل" : "Company name"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              {isRtl ? "وسيلة الرد المفضلة" : "Preferred Channel"}
            </label>
            <select
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value as ContactChannel)}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
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
              placeholder={isRtl ? "+966 5X XXX XXXX أو @handle" : "+1 555-0100 or @handle"}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            {isRtl ? "نص الرسالة *" : "Message *"}
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isRtl
                ? "اكتب استفسارك، فكرة الشراكة، أو أي سؤال تود طرحه على فريق سديم..."
                : "Describe your inquiry, partnership proposition, or question for the Sadeem team..."
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border/80 focus:border-accent focus:outline-none text-text-primary text-sm transition-all"
          />
        </div>

        <div className="pt-2 flex items-start gap-3">
          <input
            type="checkbox"
            id="general-consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
          />
          <label htmlFor="general-consent" className="cursor-pointer text-text-secondary text-xs sm:text-sm select-none">
            {isRtl
              ? "أوافق على قيام استوديو سديم بمعالجة وتخزين بيانات الاتصال لأغراض الرد على استفساري وفق سياسة الخصوصية."
              : "I consent to Sadeem Studio processing my contact details to reply to my inquiry in accordance with the privacy policy."}
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary font-semibold text-sm transition-all shadow-lg shadow-accent/20 active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isRtl ? "جاري الإرسال..." : "Sending..."}</span>
            </>
          ) : (
            <>
              <span>{isRtl ? "إرسال الرسالة" : "Send Message"}</span>
              <Send size={16} className={isRtl ? "rotate-180" : ""} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
