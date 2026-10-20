"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Layers, Cpu, Rocket, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Hero() {
  const { t, language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [activePhase, setActivePhase] = useState<number>(0);
  const isRtl = language === "ar";

  // Auto-advance through the 4 kinetic stages every 4.5 seconds
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const phases = t.hero.kineticPhases || [
    { num: "01", title: "Idea & Spark", desc: "Raw insight, operational challenge, and exploratory hypothesis." },
    { num: "02", title: "Structure & Architecture", desc: "Mathematical geometry, data schemas, and vector blueprints." },
    { num: "03", title: "System & Engineering", desc: "Robust software engines, distributed protocols, and resilience." },
    { num: "04", title: "Product & Venture", desc: "Living digital entity, customer adoption, and enterprise scale." },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden">
      {/* Dynamic Ambient Nebula Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 transition-opacity duration-1000"
          style={{ backgroundColor: "#C28E62" }} 
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-[130px] opacity-15 transition-opacity duration-1000"
          style={{ backgroundColor: "#527C91" }} 
        />
        {/* Subtle Architectural Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(194,142,98,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(82,124,145,0.04)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,black_30%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Main Content (Left in LTR, Right in RTL) */}
          <div className="lg:col-span-7">
            {/* Tagline Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent-muted text-xs font-mono font-medium mb-6 text-accent"
            >
              <Sparkles size={13} className="text-accent animate-pulse" />
              <span>{t.hero.tagline || "TECHNOLOGY & VENTURE STUDIO"}</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-[-0.035em] leading-[1.02] mb-6 text-foreground text-balance">
                {language === "en" ? (
                  <>
                    We Build <span className="text-accent underline decoration-steel/40 decoration-2 underline-offset-8">Systems.</span><br />
                    We Turn Ideas Into <span className="text-foreground">Companies.</span>
                  </>
                ) : (
                  <>
                    نبني <span className="text-accent underline decoration-steel/40 decoration-2 underline-offset-8">الأنظمة.</span><br />
                    نحوّل الأفكار إلى <span className="text-foreground">شركات رقمية.</span>
                  </>
                )}
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-muted max-w-2xl mb-10 font-normal leading-relaxed text-balance"
            >
              {t.hero.desc}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <a
                href="#work"
                className="inline-flex h-14 items-center justify-center bg-accent text-[#0B1220] px-8 font-bold text-sm tracking-wide rounded-lg hover:bg-accent-hover transition-all duration-300 shadow-[0_4px_20px_rgba(194,142,98,0.25)] group"
              >
                <span>{t.common.exploreWork}</span>
                {isRtl ? (
                  <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                )}
              </a>
              <a
                href="#contact"
                className="inline-flex h-14 items-center justify-center border border-border bg-surface/60 backdrop-blur-md text-foreground px-8 font-medium text-sm rounded-lg hover:border-accent hover:bg-surface-hover transition-all duration-300"
              >
                {t.common.startProject}
              </a>
            </motion.div>
          </div>

          {/* Kinetic Signature Visual: Idea -> Structure -> System -> Product */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative">
              {/* Header: Label + Phase Tracker */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-muted">
                    {t.hero.signatureLabel || "SIGNATURE ENGINE VISUAL"}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-accent">
                  {phases[activePhase].num} / 04
                </span>
              </div>

              {/* Central Kinetic Visual Area */}
              <div className="relative aspect-square w-full rounded-xl bg-background/50 border border-border flex items-center justify-center overflow-hidden mb-6">
                {/* SVG Coordinate Grid Background */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#527C91" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>

                {/* Animated Core Shape */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, scale: 0.85, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.1, rotate: 15 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Stage 01: Idea & Spark */}
                    {activePhase === 0 && (
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <motion.div 
                          animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border border-dashed border-accent/40"
                        />
                        <div className="w-16 h-16 rounded-full bg-accent/25 blur-xl animate-pulse" />
                        <Sparkles size={46} className="text-accent drop-shadow-[0_0_18px_#C28E62]" />
                      </div>
                    )}

                    {/* Stage 02: Structure & Architecture */}
                    {activePhase === 1 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <polygon points="50,15 88,82 12,82" fill="none" stroke="#527C91" strokeWidth="1.5" strokeDasharray="3,3" />
                          <circle cx="50" cy="15" r="4" fill="#527C91" />
                          <circle cx="88" cy="82" r="4" fill="#C28E62" />
                          <circle cx="12" cy="82" r="4" fill="#6C8B80" />
                          <line x1="50" y1="15" x2="50" y2="82" stroke="#C28E62" strokeWidth="1.2" />
                        </svg>
                        <Layers size={36} className="absolute text-steel" />
                      </div>
                    )}

                    {/* Stage 03: System & Engineering */}
                    {activePhase === 2 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <motion.div 
                          animate={shouldReduceMotion ? {} : { rotate: 360 }}
                          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                          className="w-36 h-36 border border-sage/40 rounded-xl flex items-center justify-center"
                        >
                          <div className="w-24 h-24 border border-accent/60 rounded-lg flex items-center justify-center">
                            <Cpu size={36} className="text-sage" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Stage 04: Product & Venture */}
                    {activePhase === 3 && (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-accent/25 to-steel/25 blur-xl" />
                        <motion.div
                          animate={shouldReduceMotion ? {} : { y: [-3, 3, -3] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-28 h-28 rounded-2xl border-2 border-accent bg-background flex flex-col items-center justify-center shadow-[0_0_30px_rgba(194,142,98,0.25)]"
                        >
                          <Rocket size={36} className="text-accent mb-1" />
                          <span className="text-[10px] font-mono tracking-widest text-foreground font-bold">VENTURE</span>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Interactive Phase Selector */}
              <div className="grid grid-cols-4 gap-2">
                {phases.map((phase: { num: string; title: string; desc: string }, i: number) => (
                  <button
                    key={phase.num}
                    onClick={() => setActivePhase(i)}
                    className={`py-2 px-1 text-center rounded-lg transition-all duration-300 border flex flex-col items-center ${
                      activePhase === i 
                        ? "border-accent bg-accent/10 shadow-sm" 
                        : "border-border hover:border-steel/50"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-muted">{phase.num}</span>
                    <span className="text-xs font-semibold truncate w-full text-center">
                      {phase.title.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Phase Description */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm font-bold text-accent mb-1">
                  {phases[activePhase].title}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {phases[activePhase].desc}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
