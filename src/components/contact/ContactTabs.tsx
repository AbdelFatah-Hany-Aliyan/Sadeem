"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import StartProjectForm from "./StartProjectForm";
import PitchIdeaForm from "./PitchIdeaForm";
import GeneralContactForm from "./GeneralContactForm";
import { Building2, Rocket, Mail } from "lucide-react";

export type ContactTabType = "project" | "pitch" | "general";

interface ContactTabsProps {
  initialTab?: ContactTabType;
}

export default function ContactTabs({ initialTab = "project" }: ContactTabsProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ContactTabType>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "pitch" || tabParam === "project" || tabParam === "general") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="space-y-10" dir={isRtl ? "rtl" : "ltr"}>
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-center p-1.5 rounded-2xl sm:rounded-full bg-surface-elevated/80 border border-border/80 backdrop-blur-md max-w-xl mx-auto shadow-inner gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("project")}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "project"
              ? "bg-accent text-primary shadow-md font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
          }`}
        >
          <Building2 size={16} />
          <span>{isRtl ? "بدء مشروع تقني" : "Start a Project"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pitch")}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "pitch"
              ? "bg-purple-600 text-white shadow-md font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
          }`}
        >
          <Rocket size={16} />
          <span>{isRtl ? "طرح فكرة ريادية" : "Pitch an Idea"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "general"
              ? "bg-text-primary text-background shadow-md font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
          }`}
        >
          <Mail size={16} />
          <span>{isRtl ? "تواصل عام" : "General"}</span>
        </button>
      </div>

      {/* Tab Header Description */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        {activeTab === "project" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              {isRtl ? "هندسة نظم رقمية متقدمة لأعمالك" : "Engineer Enterprise Digital Systems"}
            </h2>
            <p className="text-text-secondary text-sm">
              {isRtl
                ? "للشركات والمؤسسات التي تبحث عن شريك تكنولوجي متكامل لبناء منصات وتطبيقات عالية الأداء."
                : "For enterprises and businesses seeking an elite engineering partner for mission-critical software."}
            </p>
          </>
        )}

        {activeTab === "pitch" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              {isRtl ? "شاركنا بناء شركتك القادمة" : "Build Your Next Venture With Us"}
            </h2>
            <p className="text-text-secondary text-sm">
              {isRtl
                ? "للمؤسسين والخبراء الذين يملكون معرفة عميقة بالسوق ويبحثون عن شريك تقني مؤسس."
                : "For entrepreneurs and domain experts looking for a technical co-founding studio to co-build."}
            </p>
          </>
        )}

        {activeTab === "general" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              {isRtl ? "استفسارات عامة وشراكات" : "Direct Inquiries & Partnerships"}
            </h2>
            <p className="text-text-secondary text-sm">
              {isRtl
                ? "لأي تواصل صحفي، استفسار تقني عام، أو فرص تعاون لا تندرج تحت المسارين أعلاه."
                : "For media inquiries, general collaboration questions, or direct dialogue."}
            </p>
          </>
        )}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "project" && <StartProjectForm />}
        {activeTab === "pitch" && <PitchIdeaForm />}
        {activeTab === "general" && <GeneralContactForm />}
      </div>
    </div>
  );
}
