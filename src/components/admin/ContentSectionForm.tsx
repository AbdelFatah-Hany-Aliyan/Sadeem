"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminRole, PublicationStatus } from "@prisma/client";
import { AdminSectionDetail } from "@/lib/services/contentService";
import { 
  saveContentDraftAction, 
  publishContentSectionAction, 
  revertContentDraftAction 
} from "@/app/admin/actions";
import { 
  Save, 
  Send, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Shield,
  Clock
} from "lucide-react";

interface ContentSectionFormProps {
  section: AdminSectionDetail;
  userRole: AdminRole;
}

export default function ContentSectionForm({ section, userRole }: ContentSectionFormProps) {
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");
  const [enContent, setEnContent] = useState<Record<string, any>>({ ...section.enDraft });
  const [arContent, setArContent] = useState<Record<string, any>>({ ...section.arDraft });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canPublish = userRole === AdminRole.SUPER_ADMIN;

  const handleFieldChange = (locale: "en" | "ar", key: string, value: any) => {
    if (locale === "en") {
      setEnContent((prev) => ({ ...prev, [key]: value }));
    } else {
      setArContent((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await saveContentDraftAction(section.sectionKey, {
        en: enContent,
        ar: arContent,
      });

      if (res.success) {
        setFeedback({ type: "success", message: "Draft content saved successfully! Live website remains untouched until published." });
      } else {
        setFeedback({ type: "error", message: res.error || res.errors?.[0] || "Failed to save draft." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this content to the live public website?")) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      // First save draft
      await saveContentDraftAction(section.sectionKey, {
        en: enContent,
        ar: arContent,
      });

      // Then publish
      const res = await publishContentSectionAction(section.sectionKey);
      if (res.success) {
        setFeedback({ type: "success", message: "Content published successfully! Changes are now live on the public website." });
      } else {
        setFeedback({ type: "error", message: res.error || res.errors?.[0] || "Failed to publish content." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!confirm("Discard all uncommitted draft changes and restore the current published version?")) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await revertContentDraftAction(section.sectionKey);
      if (res.success) {
        if (section.enPublished) setEnContent({ ...section.enPublished });
        if (section.arPublished) setArContent({ ...section.arPublished });
        setFeedback({ type: "success", message: "Draft reverted to the approved published baseline." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to revert draft." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  // Helper to render editable string fields
  const renderStringFields = (locale: "en" | "ar", data: Record<string, any>) => {
    const isRtl = locale === "ar";
    return Object.entries(data).map(([key, value]) => {
      // If it's a simple primitive (string, number)
      if (typeof value === "string" || typeof value === "number") {
        const isLongText = String(value).length > 80 || key.toLowerCase().includes("desc") || key.toLowerCase().includes("quote");

        return (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted flex items-center justify-between">
              <span>{key}</span>
              <span className="text-[10px] text-muted/60">{typeof value}</span>
            </label>
            {isLongText ? (
              <textarea
                dir={isRtl ? "rtl" : "ltr"}
                rows={3}
                value={value}
                onChange={(e) => handleFieldChange(locale, key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors resize-y leading-relaxed"
              />
            ) : (
              <input
                type="text"
                dir={isRtl ? "rtl" : "ltr"}
                value={value}
                onChange={(e) => handleFieldChange(locale, key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
              />
            )}
          </div>
        );
      }

      // If array of objects (like kineticPhases or items)
      if (Array.isArray(value)) {
        return (
          <div key={key} className="space-y-3 pt-3 border-t border-border">
            <label className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
              {key} ({value.length} items)
            </label>
            <div className="space-y-3">
              {value.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
                  <div className="text-[11px] font-mono text-muted/60 font-semibold">ITEM 0{index + 1}</div>
                  {typeof item === "object" && item !== null ? (
                    Object.entries(item).map(([subKey, subVal]) => (
                      <div key={subKey} className="space-y-1">
                        <span className="text-[11px] font-mono text-muted">{subKey}:</span>
                        <input
                          type="text"
                          dir={isRtl ? "rtl" : "ltr"}
                          value={subVal as string}
                          onChange={(e) => {
                            const newArr = [...value];
                            newArr[index] = { ...newArr[index], [subKey]: e.target.value };
                            handleFieldChange(locale, key, newArr);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                        />
                      </div>
                    ))
                  ) : (
                    <input
                      type="text"
                      dir={isRtl ? "rtl" : "ltr"}
                      value={item}
                      onChange={(e) => {
                        const newArr = [...value];
                        newArr[index] = e.target.value;
                        handleFieldChange(locale, key, newArr);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="p-2 rounded-lg border border-border hover:border-accent text-muted hover:text-foreground transition-colors"
            title="Back to Content Catalog"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-muted">
                SECTION // {section.sectionKey}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  section.status === "PUBLISHED"
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                    : "bg-muted/15 text-muted border-muted/30"
                }`}
              >
                {section.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-foreground">{section.name}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRevert}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-border bg-surface hover:border-accent text-xs font-mono text-muted hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw size={13} />
            <span>Revert</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:border-accent text-xs font-mono font-bold text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          {canPublish && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Send size={13} />
              <span>Publish to Live Site</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-red-500/10 border-red-500/40 text-red-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Language Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("en")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "en"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          English (LTR)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ar")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "ar"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          العربية (RTL)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-border bg-surface/80 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        {activeTab === "en" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                English Editorial Content
              </span>
              <span className="text-[11px] font-mono text-muted/60">Locale: en</span>
            </div>
            {renderStringFields("en", enContent)}
          </div>
        )}

        {activeTab === "ar" && (
          <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                المحتوى التحريري باللغة العربية
              </span>
              <span className="text-[11px] font-mono text-muted/60">Locale: ar</span>
            </div>
            {renderStringFields("ar", arContent)}
          </div>
        )}
      </div>
    </div>
  );
}
