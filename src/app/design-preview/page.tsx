"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Layers, 
  Cpu, 
  Rocket, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Eye, 
  Palette, 
  Activity, 
  Smartphone, 
  GraduationCap, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "next-themes";

// 4 Real Projects defined according to Phase 4.1 specifications
const previewProjects = [
  {
    id: "cucu-leaf-scan",
    name: "Cucu Leaf Scan",
    arabicName: "كوكو ليف سكان",
    tagline: "AI-powered agricultural diagnostics",
    arabicTagline: "تشخيص زراعي فوري مدعوم بالذكاء الاصطناعي",
    category: "AI & Computer Vision",
    arabicCategory: "الذكاء الاصطناعي والرؤية الحاسوبية",
    status: "MVP",
    arabicStatus: "نسخة أولية MVP",
    statusColor: "#6C8B80", // Muted Sage
    ownership: "Sadeem Ventures",
    arabicOwnership: "سديم للمشاريع",
    desc: "A computer vision mobile platform enabling farmers to detect crop diseases in real-time from simple leaf photos, preventing harvest loss.",
    arabicDesc: "منصة جوال تعتمد على الرؤية الحاسوبية تتيح للمزارعين تشخيص أمراض المحاصيل فورياً من صور الأوراق، مما يحمي المحاصيل من التلف.",
    icon: Smartphone,
    accentColor: "#6C8B80",
    technologies: ["TensorFlow", "React Native", "FastAPI", "Edge AI"],
    metrics: { en: "94.2% Diagnostic Accuracy", ar: "دقة تشخيص 94.2%" }
  },
  {
    id: "wesal",
    name: "Wesal",
    arabicName: "وصال",
    tagline: "AI-powered interactive learning infrastructure",
    arabicTagline: "بنية تعليمية تفاعلية مدعومة بالذكاء الاصطناعي",
    category: "EdTech & Communication",
    arabicCategory: "تكنولوجيا التعليم والتواصل",
    status: "BUILDING",
    arabicStatus: "قيد البناء",
    statusColor: "#C28E62", // Copper
    ownership: "Sadeem Ventures",
    arabicOwnership: "سديم للمشاريع",
    desc: "Replaces fragmented academic channels with a unified, high-security operational system designed for modern learning environments.",
    arabicDesc: "نظام تعليمي موحد يستبدل أدوات التواصل المشتتة ببيئة تشغيلية آمنة مصممة خصيصاً للمؤسسات التعليمية الحديثة.",
    icon: Layers,
    accentColor: "#C28E62",
    technologies: ["Next.js", "WebSockets", "PostgreSQL", "Real-time AI"],
    metrics: { en: "Unified Institutional Mesh", ar: "منظومة مؤسسية موحدة" }
  },
  {
    id: "tabadul",
    name: "Tabadul",
    arabicName: "تبادل",
    tagline: "Collaborative commerce & loyalty network",
    arabicTagline: "منصة تجارة تشاركية وشبكة ولاء موحدة",
    category: "Commerce Ecosystem",
    arabicCategory: "أنظمة التجارة وشبكات الولاء",
    status: "BUILDING",
    arabicStatus: "قيد البناء",
    statusColor: "#C28E62", // Copper
    ownership: "Strategic Venture Partnership",
    arabicOwnership: "شراكة استراتيجية قيد التأسيس",
    desc: "A collaborative retail exchange infrastructure allowing regional merchants to cross-reward customer loyalty and co-distribute products.",
    arabicDesc: "بنية تحتية للتبادل التجاري التشاركي تتيح للتجار مشاركة برامج الولاء وتوزيع المنتجات بكفاءة عالية (شراكة قيد التأسيس).",
    icon: ShoppingBag,
    accentColor: "#527C91",
    technologies: ["Go", "Next.js", "Redis", "Distributed Ledger"],
    metrics: { en: "Multi-Merchant Protocol", ar: "بروتوكول متعدد التجار" }
  },
  {
    id: "lama-school",
    name: "Lama School",
    arabicName: "مدرسة لمى",
    tagline: "Multi-role academic operations management",
    arabicTagline: "إدارة تشغيلية شاملة للمؤسسات المدرسية",
    category: "Enterprise Systems",
    arabicCategory: "أنظمة المؤسسات وإدارة العمليات",
    status: "MVP",
    arabicStatus: "نسخة أولية MVP",
    statusColor: "#6C8B80", // Muted Sage
    ownership: "Sadeem Systems",
    arabicOwnership: "سديم للأنظمة",
    desc: "An all-in-one management suite coordinating administrators, teachers, parents, and students with zero operational friction.",
    arabicDesc: "نظام إداري متكامل يربط الإدارة والمعلمين وأولياء الأمور والطلاب في واجهة واحدة خالية من التعقيد التشغيلي.",
    icon: GraduationCap,
    accentColor: "#C28E62",
    technologies: ["TypeScript", "Next.js", "PostgreSQL", "Tailwind"],
    metrics: { en: "4 Dedicated Stakeholder Roles", ar: "4 واجهات متخصصة للمستخدمين" }
  }
];

export default function DesignPreviewPage() {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCyclePhase, setActiveCyclePhase] = useState<number>(0);
  const [activeProjectTab, setActiveProjectTab] = useState<string>("cucu-leaf-scan");
  const [dualEngineActive, setDualEngineActive] = useState<"engine1" | "engine2" | "synergy">("synergy");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle phases for the Hero signature animation: Idea -> Structure -> System -> Product
  const cyclePhases = [
    {
      id: "idea",
      num: "01",
      titleEn: "Idea & Spark",
      titleAr: "الفكرة والشرارة",
      descEn: "Raw insight, market friction, and exploratory hypothesis.",
      descAr: "رؤية أولية، تحديد التحدي السوقي، وصياغة الفرضية الابتكارية.",
      icon: Sparkles,
      color: "#C28E62"
    },
    {
      id: "structure",
      num: "02",
      titleEn: "Structure & Architecture",
      titleAr: "الهيكلة والمعمارية",
      descEn: "Mathematical geometry, data schemas, and vector blueprints.",
      descAr: "هندسة البيانات، النماذج الرياضية، والمخططات المعمارية الدقيقة.",
      icon: Layers,
      color: "#527C91"
    },
    {
      id: "system",
      num: "03",
      titleEn: "System & Engineering",
      titleAr: "النظام والتطوير",
      descEn: "Robust software engines, distributed protocols, and resilience.",
      descAr: "محركات برمجية عالية الأداء، تكامل الأنظمة، وبنية تشغيلية مستدامة.",
      icon: Cpu,
      color: "#6C8B80"
    },
    {
      id: "product",
      num: "04",
      titleEn: "Product & Venture",
      titleAr: "المنتج والشركة",
      descEn: "Living digital entity, customer adoption, and enterprise scale.",
      descAr: "كيان رقمي حي، نمو حقيقي للمستخدمين، وتأسيس شركة مستقلة.",
      icon: Rocket,
      color: "#C28E62"
    }
  ];

  // Auto-advance the hero cycle every 4 seconds if untouched
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCyclePhase((prev) => (prev + 1) % cyclePhases.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cyclePhases.length]);

  const isRtl = language === "ar";

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isRtl ? "rtl" : "ltr"}`} style={{
      backgroundColor: "var(--preview-bg, #0B1220)",
      color: "var(--preview-fg, #F6F3EB)"
    }}>
      {/* Scope custom preview palette variables */}
      <style jsx global>{`
        :root {
          --preview-navy: #0B1220;
          --preview-copper: #C28E62;
          --preview-copper-glow: rgba(194, 142, 98, 0.25);
          --preview-steel: #527C91;
          --preview-ivory: #F6F3EB;
          --preview-sage: #6C8B80;
          --preview-surface-dark: #111A2E;
          --preview-border-dark: rgba(194, 142, 98, 0.2);
        }
        .dark {
          --preview-bg: #0B1220;
          --preview-fg: #F6F3EB;
          --preview-card: #111A2E;
          --preview-border: rgba(194, 142, 98, 0.2);
          --preview-subtext: #8BA3B3;
          --preview-accent: #C28E62;
        }
        :root:not(.dark) {
          --preview-bg: #F6F3EB;
          --preview-fg: #0B1220;
          --preview-card: #FFFFFF;
          --preview-border: rgba(11, 18, 32, 0.12);
          --preview-subtext: #527C91;
          --preview-accent: #C28E62;
        }
      `}</style>

      {/* Top Banner: Design Review Controller */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-[var(--preview-border)] bg-[var(--preview-bg)]/80 px-6 py-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: "#C28E62" }} />
            <span className="font-bold tracking-tight text-lg">
              Sadeem / <span className="font-arabic font-normal">سديم</span>
            </span>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-mono border border-[var(--preview-accent)] text-[var(--preview-accent)]">
              Phase 4.1 Concept Preview
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Lang switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="text-xs font-mono font-medium px-3 py-1.5 rounded border border-[var(--preview-border)] hover:border-[var(--preview-accent)] transition-colors"
            >
              {language === "en" ? "العربية (RTL)" : "English (LTR)"}
            </button>

            {/* Theme switcher */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded border border-[var(--preview-border)] hover:border-[var(--preview-accent)] transition-colors flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <Link
              href="/"
              className="text-xs font-medium px-3 py-1.5 rounded bg-[var(--preview-accent)] text-[#0B1220] font-bold hover:opacity-90 transition-opacity"
            >
              {language === "en" ? "Back to Homepage" : "العودة للرئيسية"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Interactive Prototype Section */}
      <section className="relative overflow-hidden py-24 px-6 md:px-12 border-b border-[var(--preview-border)]">
        {/* Living Ambient Nebula Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25" style={{ backgroundColor: "#C28E62" }} />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none opacity-20" style={{ backgroundColor: "#527C91" }} />

        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Headline & Mission */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C28E62]/40 bg-[#C28E62]/10 text-xs font-mono mb-6" style={{ color: "#C28E62" }}>
              <Sparkles size={12} />
              <span>{language === "en" ? "TECHNOLOGY & VENTURE STUDIO" : "استوديو التكنولوجيا والمشاريع الناشئة"}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              {language === "en" ? (
                <>
                  We Build <span style={{ color: "#C28E62" }}>Systems.</span><br />
                  We Turn Ideas Into <span className="underline decoration-[#527C91] decoration-wavy decoration-2">Companies.</span>
                </>
              ) : (
                <>
                  نبني <span style={{ color: "#C28E62" }}>الأنظمة.</span><br />
                  نحوّل الأفكار إلى <span className="underline decoration-[#527C91] decoration-wavy decoration-2">شركات رقمية.</span>
                </>
              )}
            </h1>

            <p className="text-lg md:text-xl text-[var(--preview-subtext)] max-w-2xl leading-relaxed mb-8">
              {language === "en" 
                ? "Sadeem creates custom high-performance digital systems for ambitious organizations while validating, engineering, and launching proprietary technology ventures."
                : "تبني سديم أنظمة رقمية مخصصة وعالية الأداء للشركات الطموحة، بينما تبتكر، تطور، وتطلق مشاريعها التكنولوجية الخاصة."}
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                className="px-6 py-3.5 rounded font-medium text-sm transition-all duration-300 shadow-lg flex items-center gap-2 group"
                style={{ backgroundColor: "#C28E62", color: "#0B1220" }}
              >
                <span>{language === "en" ? "Explore Our Portfolio" : "استكشف أعمالنا"}</span>
                {isRtl ? <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <button 
                className="px-6 py-3.5 rounded font-medium text-sm border transition-all duration-300 hover:bg-[#527C91]/10 flex items-center gap-2"
                style={{ borderColor: "var(--preview-border)", color: "var(--preview-fg)" }}
              >
                <span>{language === "en" ? "Studio Capabilities" : "قدرات الاستوديو"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Signature Animated Visual: Idea -> Structure -> System -> Product */}
          <div className="lg:col-span-5">
            <div className="p-6 md:p-8 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] shadow-2xl relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--preview-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C28E62] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--preview-subtext)]">
                    {language === "en" ? "SIGNATURE ENGINE VISUAL" : "المحرّك البصري لسديم"}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#C28E62]">
                  {cyclePhases[activeCyclePhase].num} / 04
                </span>
              </div>

              {/* Central Dynamic Kinetic Visual */}
              <div className="relative aspect-square w-full rounded-xl bg-[#0B1220]/40 border border-[#527C91]/20 flex items-center justify-center overflow-hidden mb-6">
                {/* SVG Coordinate Grid Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="preview-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#527C91" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#preview-grid)" />
                </svg>

                {/* Animated Core Shape depending on active stage */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cyclePhases[activeCyclePhase].id}
                    initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.15, rotate: 20 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Visual 1: Idea (Spark & Wandering Energy) */}
                    {activeCyclePhase === 0 && (
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <motion.div 
                          animate={{ scale: [1, 1.25, 1], rotate: [0, 180, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border border-dashed border-[#C28E62]/40"
                        />
                        <div className="w-16 h-16 rounded-full bg-[#C28E62]/30 blur-xl animate-pulse" />
                        <Sparkles size={48} className="text-[#C28E62] drop-shadow-[0_0_20px_#C28E62]" />
                      </div>
                    )}

                    {/* Visual 2: Structure (Vector Geometry) */}
                    {activeCyclePhase === 1 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <polygon points="50,15 90,85 10,85" fill="none" stroke="#527C91" strokeWidth="1.5" strokeDasharray="3,3" />
                          <circle cx="50" cy="15" r="4" fill="#527C91" />
                          <circle cx="90" cy="85" r="4" fill="#C28E62" />
                          <circle cx="10" cy="85" r="4" fill="#6C8B80" />
                          <line x1="50" y1="15" x2="50" y2="85" stroke="#C28E62" strokeWidth="1" />
                        </svg>
                        <Layers size={36} className="absolute text-[#527C91]" />
                      </div>
                    )}

                    {/* Visual 3: System (Computational Matrix) */}
                    {activeCyclePhase === 2 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                          className="w-36 h-36 border border-[#6C8B80]/40 rounded-xl flex items-center justify-center"
                        >
                          <div className="w-24 h-24 border border-[#C28E62]/60 rounded-lg flex items-center justify-center">
                            <Cpu size={36} className="text-[#6C8B80]" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Visual 4: Product (Tangible Core Venture) */}
                    {activeCyclePhase === 3 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-[#C28E62]/30 to-[#527C91]/30 blur-xl" />
                        <motion.div
                          animate={{ y: [-4, 4, -4] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-28 h-28 rounded-2xl border-2 border-[#C28E62] bg-[#0B1220] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(194,142,98,0.3)]"
                        >
                          <Rocket size={38} className="text-[#C28E62] mb-1" />
                          <span className="text-[10px] font-mono tracking-widest text-[#F6F3EB]">VENTURE</span>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Phase Switcher Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {cyclePhases.map((phase, i) => (
                  <button
                    key={phase.id}
                    onClick={() => setActiveCyclePhase(i)}
                    className={`py-2 px-1 text-center rounded transition-all duration-300 border flex flex-col items-center ${
                      activeCyclePhase === i 
                        ? "border-[#C28E62] bg-[#C28E62]/10" 
                        : "border-[var(--preview-border)] hover:border-[#527C91]/40"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[var(--preview-subtext)]">{phase.num}</span>
                    <span className="text-xs font-semibold truncate w-full text-center">
                      {language === "en" ? phase.titleEn.split(" ")[0] : phase.titleAr.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Phase Description */}
              <div className="mt-4 pt-4 border-t border-[var(--preview-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#C28E62]">
                    {language === "en" ? cyclePhases[activeCyclePhase].titleEn : cyclePhases[activeCyclePhase].titleAr}
                  </span>
                </div>
                <p className="text-xs text-[var(--preview-subtext)] leading-relaxed">
                  {language === "en" ? cyclePhases[activeCyclePhase].descEn : cyclePhases[activeCyclePhase].descAr}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Color System & Tokens Verification */}
      <section className="py-20 px-6 md:px-12 border-b border-[var(--preview-border)]">
        <div className="container mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C28E62] block mb-2">
              01 / COLOR SYSTEM AUDIT & HARMONY
            </span>
            <h2 className="text-3xl font-bold">
              {language === "en" ? "The Sadeem Architectural Palette" : "لوحة ألوان سديم المعمارية"}
            </h2>
            <p className="text-sm text-[var(--preview-subtext)] max-w-2xl mt-2">
              {language === "en"
                ? "Designed to eradicate the cold generic SaaS look by infusing warm metallic copper, deep obsidian navy, and natural sage into an editorial system."
                : "صُممت لتجاوز الطابع الرمادي البارد بإدخال النحاس الدافئ، والكحلي الداكن الفاخر، وأخضر الميرمية المتزن."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Swatch 1: Deep Navy */}
            <div className="rounded-xl border border-[var(--preview-border)] overflow-hidden bg-[var(--preview-card)] p-5">
              <div className="h-24 rounded-lg bg-[#0B1220] border border-white/10 mb-4 flex items-end p-3">
                <span className="text-xs font-mono text-white/70">#0B1220</span>
              </div>
              <h3 className="font-bold text-sm">Deep Navy</h3>
              <p className="text-xs text-[var(--preview-subtext)] mt-1">
                {language === "en" ? "Primary Dark Foundation. Celestial depth replacing flat black." : "الأساس الكحلي الداكن. عمق كوني بديل للأسود المسطح."}
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--preview-border)] text-[10px] font-mono text-[#C28E62]">
                Token: --color-primary
              </div>
            </div>

            {/* Swatch 2: Copper Accent */}
            <div className="rounded-xl border border-[var(--preview-border)] overflow-hidden bg-[var(--preview-card)] p-5">
              <div className="h-24 rounded-lg bg-[#C28E62] mb-4 flex items-end p-3 shadow-[0_0_20px_rgba(194,142,98,0.3)]">
                <span className="text-xs font-mono text-[#0B1220] font-bold">#C28E62</span>
              </div>
              <h3 className="font-bold text-sm">Brand Copper</h3>
              <p className="text-xs text-[var(--preview-subtext)] mt-1">
                {language === "en" ? "Energy & Venture Accent. Spark of creation and tangible craft." : "نحاسي برونزي مميز. يعبّر عن شرارة الابتكار والمنتجات الملموسة."}
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--preview-border)] text-[10px] font-mono text-[#C28E62]">
                Token: --color-accent
              </div>
            </div>

            {/* Swatch 3: Steel Blue */}
            <div className="rounded-xl border border-[var(--preview-border)] overflow-hidden bg-[var(--preview-card)] p-5">
              <div className="h-24 rounded-lg bg-[#527C91] mb-4 flex items-end p-3">
                <span className="text-xs font-mono text-white/90">#527C91</span>
              </div>
              <h3 className="font-bold text-sm">Steel Blue</h3>
              <p className="text-xs text-[var(--preview-subtext)] mt-1">
                {language === "en" ? "Engineering Precision. Schematics, technical lines, and secondary tags." : "الأزرق الفولاذي. يرمز للهندسة الدقيقة والخطوط المعمارية."}
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--preview-border)] text-[10px] font-mono text-[#C28E62]">
                Token: --color-steel
              </div>
            </div>

            {/* Swatch 4: Ivory Paper */}
            <div className="rounded-xl border border-[var(--preview-border)] overflow-hidden bg-[var(--preview-card)] p-5">
              <div className="h-24 rounded-lg bg-[#F6F3EB] border border-black/10 mb-4 flex items-end p-3">
                <span className="text-xs font-mono text-[#0B1220]">#F6F3EB</span>
              </div>
              <h3 className="font-bold text-sm">Ivory Architectural</h3>
              <p className="text-xs text-[var(--preview-subtext)] mt-1">
                {language === "en" ? "Refined Editorial Light Foundation. Warm paper-like surface." : "العاجي المعماري. أرضية وضع الإضاءة الفاخرة الشبيهة بالورق المصقول."}
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--preview-border)] text-[10px] font-mono text-[#C28E62]">
                Token: --color-ivory
              </div>
            </div>

            {/* Swatch 5: Muted Sage */}
            <div className="rounded-xl border border-[var(--preview-border)] overflow-hidden bg-[var(--preview-card)] p-5">
              <div className="h-24 rounded-lg bg-[#6C8B80] mb-4 flex items-end p-3">
                <span className="text-xs font-mono text-white/90">#6C8B80</span>
              </div>
              <h3 className="font-bold text-sm">Muted Sage</h3>
              <p className="text-xs text-[var(--preview-subtext)] mt-1">
                {language === "en" ? "Growth & Live Metrics. Subtle organic balance for active states." : "أخضر الميرمية الهادئ. توازن حيوي ومؤشر للحالات النشطة والنمو."}
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--preview-border)] text-[10px] font-mono text-[#C28E62]">
                Token: --color-sage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The 4 Real Projects — Portfolio 2.0 Redesign Preview */}
      <section className="py-20 px-6 md:px-12 border-b border-[var(--preview-border)]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#C28E62] block mb-2">
                02 / PORTFOLIO REDESIGN — 4 REAL PROJECTS
              </span>
              <h2 className="text-3xl font-bold">
                {language === "en" ? "Proof of Systems & Ventures" : "برهان الإنجاز: الأنظمة والمشاريع"}
              </h2>
            </div>
            <p className="text-xs font-mono text-[var(--preview-subtext)] max-w-sm">
              {language === "en" 
                ? "Demonstrating real technical diversity across AI, EdTech, Commerce, and Enterprise Operations."
                : "تنوع تقني واقعي يغطي الذكاء الاصطناعي، تكنولوجيا التعليم، التجارة، والأنظمة الإدارية."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {previewProjects.map((project) => {
              const IconComp = project.icon;
              return (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-8 relative overflow-hidden group hover:border-[#C28E62]/50 hover:shadow-[0_10px_30px_rgba(194,142,98,0.12)] transition-all flex flex-col justify-between"
                >
                  {/* Subtle top gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C28E62] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Header: Ownership & Status Pill */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <span className="text-xs font-mono tracking-wider text-[var(--preview-subtext)] uppercase">
                        {language === "en" ? project.ownership : project.arabicOwnership}
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--preview-border)] bg-black/10">
                        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: project.statusColor }} />
                        <span className="text-[11px] font-mono font-bold" style={{ color: project.statusColor }}>
                          {language === "en" ? project.status : project.arabicStatus}
                        </span>
                      </div>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl border border-[var(--preview-border)] bg-[#0B1220]/10 text-[#C28E62] group-hover:scale-110 transition-transform">
                        <IconComp size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          <span>{language === "en" ? project.name : project.arabicName}</span>
                          <span className="text-xs font-normal text-[var(--preview-subtext)]">/ {language === "en" ? project.category : project.arabicCategory}</span>
                        </h3>
                        <p className="text-xs text-[#C28E62] font-medium mt-0.5">
                          {language === "en" ? project.tagline : project.arabicTagline}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[var(--preview-subtext)] leading-relaxed mb-6">
                      {language === "en" ? project.desc : project.arabicDesc}
                    </p>
                  </div>

                  <div>
                    {/* Metric Highlight */}
                    <div className="p-3 rounded-lg bg-[var(--preview-bg)] border border-[var(--preview-border)] text-xs font-mono mb-6 flex items-center justify-between">
                      <span className="text-[var(--preview-subtext)]">{language === "en" ? "Engineering Milestone:" : "المؤشر الهندسي:"}</span>
                      <span className="text-[#C28E62] font-semibold">{language === "en" ? project.metrics.en : project.metrics.ar}</span>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--preview-border)]">
                      {project.technologies.map((tech) => (
                        <span 
                          key={tech} 
                          className="text-[11px] font-mono px-2.5 py-1 rounded border border-[var(--preview-border)] bg-[var(--preview-bg)]/50 text-[var(--preview-subtext)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Dual Engine Animated Flow Preview */}
      <section className="py-20 px-6 md:px-12 border-b border-[var(--preview-border)]">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C28E62] block mb-2">
              03 / DUAL ENGINE REINFORCING LOOP
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "en" ? "How Client Systems Fuel Proprietary Ventures" : "كيف تغذي أنظمة العملاء مشاريع سديم الناشئة"}
            </h2>
            <p className="text-sm text-[var(--preview-subtext)] leading-relaxed">
              {language === "en"
                ? "Not two disconnected agencies, but an interconnected software flywheel. Real enterprise engineering creates reusable tech and revenue that de-risks venture incubation."
                : "ليس مجرد مسارين منفصلين، بل محرك برمجي متكامل. مشاريع الأنظمة تولّد حلولاً تقنية قابلة لإعادة الاستخدام وتمويلاً مستداماً يسرّع إطلاق الشركات."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {/* Engine 1: Sadeem Systems */}
            <div className={`p-8 rounded-2xl border transition-all duration-300 ${
              dualEngineActive === "engine1" || dualEngineActive === "synergy"
                ? "border-[#527C91] bg-[var(--preview-card)] shadow-xl"
                : "border-[var(--preview-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono px-3 py-1 rounded bg-[#527C91]/20 text-[#527C91] font-bold">
                  ENGINE 01
                </span>
                <span className="text-xs font-mono text-[var(--preview-subtext)]">{language === "en" ? "For Organizations" : "للشركات والمؤسسات"}</span>
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {language === "en" ? "Sadeem Systems" : "سديم للأنظمة"}
              </h3>
              <p className="text-sm text-[var(--preview-subtext)] leading-relaxed mb-6">
                {language === "en"
                  ? "We engineer bespoke digital systems, operational ERPs, and workflow infrastructure tailored around how your business actually runs."
                  : "نبني أنظمة أعمال مخصصة، وبنى تحتية للعمليات مصممة بالكامل وفق الطريقة التي يعمل بها نشاطك التجاري."}
              </p>

              {/* Animated Cycle Points */}
              <div className="space-y-3">
                {[
                  { en: "Problem Discovery", ar: "استكشاف التحدي التشغيلي" },
                  { en: "System Architecture & Engineering", ar: "المعمارية البرمجية والهندسة" },
                  { en: "Deployment & Reusable Software Assets", ar: "الإطلاق واستخلاص الأصول القابلة لإعادة الاستخدام" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-mono p-2.5 rounded bg-[var(--preview-bg)] border border-[var(--preview-border)]">
                    <span className="text-[#527C91] font-bold">0{idx + 1}</span>
                    <span>{language === "en" ? item.en : item.ar}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engine 2: Sadeem Ventures */}
            <div className={`p-8 rounded-2xl border transition-all duration-300 ${
              dualEngineActive === "engine2" || dualEngineActive === "synergy"
                ? "border-[#C28E62] bg-[var(--preview-card)] shadow-xl"
                : "border-[var(--preview-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono px-3 py-1 rounded bg-[#C28E62]/20 text-[#C28E62] font-bold">
                  ENGINE 02
                </span>
                <span className="text-xs font-mono text-[var(--preview-subtext)]">{language === "en" ? "Proprietary Products" : "منتجات الاستوديو الخاصة"}</span>
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {language === "en" ? "Sadeem Ventures" : "سديم للمشاريع"}
              </h3>
              <p className="text-sm text-[var(--preview-subtext)] leading-relaxed mb-6">
                {language === "en"
                  ? "We ideate, test, build, and scale our own digital products—turning market opportunities into venture-backed standalone companies."
                  : "نبتكر، نختبر، نبني، ونطلق منتجاتنا الرقمية الخاصة—محولين الفرص السوقية الواعدة إلى شركات قائمة بذاتها."}
              </p>

              {/* Animated Venture Points */}
              <div className="space-y-3">
                {[
                  { en: "Hypothesis & Rapid AI Prototyping", ar: "صياغة الفرضية والنمذجة السريعة" },
                  { en: "Product Engineering (Wesal, Cucu, etc.)", ar: "هندسة المنتج (وصال، كوكو، وغيرها)" },
                  { en: "Market Launch, Traction & Equity Spinout", ar: "الإطلاق في السوق وتأسيس الكيان المستقل" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-mono p-2.5 rounded bg-[var(--preview-bg)] border border-[var(--preview-border)]">
                    <span className="text-[#C28E62] font-bold">0{idx + 1}</span>
                    <span>{language === "en" ? item.en : item.ar}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Synergy Connector Graphic */}
          <div className="mt-8 p-6 rounded-xl border border-[#C28E62]/30 bg-[#C28E62]/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="text-[#C28E62]" size={24} />
              <div>
                <h4 className="font-bold text-sm">
                  {language === "en" ? "The Sustainable Flywheel" : "الحلقة المستدامة للتطوير المستمر"}
                </h4>
                <p className="text-xs text-[var(--preview-subtext)]">
                  {language === "en"
                    ? "Systems build cash flow and robust modular technology; Ventures convert that technology into compounding equity and market reputation."
                    : "الأنظمة تولد تدفقاً نقدياً وتقنيات معيارية قوية؛ والمشاريع تحوّل تلك التقنيات إلى أصول ذات قيمة متضاعفة وسمعة سوقية."}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDualEngineActive("engine1")}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${dualEngineActive === "engine1" ? "border-[#527C91] bg-[#527C91]/20" : "border-[var(--preview-border)]"}`}
              >
                Systems
              </button>
              <button
                onClick={() => setDualEngineActive("synergy")}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${dualEngineActive === "synergy" ? "border-[#C28E62] bg-[#C28E62]/20 font-bold" : "border-[var(--preview-border)]"}`}
              >
                Synergy Loop
              </button>
              <button
                onClick={() => setDualEngineActive("engine2")}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${dualEngineActive === "engine2" ? "border-[#C28E62] bg-[#C28E62]/20" : "border-[var(--preview-border)]"}`}
              >
                Ventures
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Design Partner Action Callout */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-transparent to-[#0B1220]/60">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-block p-3 rounded-full bg-[#C28E62]/20 text-[#C28E62] mb-4">
            <Eye size={28} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "en" ? "Stage A Design Direction Ready for Approval" : "المرحلة أ: التوجه البصري جاهز لمراجعة شريك التصميم"}
          </h2>
          <p className="text-sm md:text-base text-[var(--preview-subtext)] leading-relaxed max-w-2xl mx-auto mb-8">
            {language === "en"
              ? "This isolated preview presents the full brand palette, the Idea → Structure → System → Product signature animation, the 4 real projects, and the Dual Engine loop. Once approved by the UI Design Partner, we will proceed to Stage B for the site-wide implementation."
              : "تستعرض هذه المعاينة المعزولة لوحة الألوان المقترحة، المحرك البصري المتحرك (فكرة -> معمارية -> نظام -> منتج)، المشاريع الأربعة الواقعية، ومحرك النمو المزدوج. بعد موافقة شريك التصميم، سننتقل للمرحلة ب لتطبيقها عبر كامل الموقع."}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="px-8 py-3.5 rounded font-bold text-sm bg-[#C28E62] text-[#0B1220] hover:bg-[#C28E62]/90 transition-all shadow-xl"
            >
              {language === "en" ? "Return to Current Site" : "الرجوع للموقع الحالي"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
