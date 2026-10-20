"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function DualEngine() {
  const { t, language } = useLanguage();
  const [activeEngine, setActiveEngine] = useState<"engine1" | "engine2" | "synergy">("synergy");
  const isRtl = language === "ar";
  
  return (
    <section id="studio" className="py-28 bg-background border-t border-border relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-xs font-mono text-accent uppercase tracking-widest mb-4">
            {t.dualEngine.label}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {t.dualEngine.title}
          </h3>
          <p className="text-muted leading-relaxed text-balance text-sm md:text-base">
            {t.dualEngine.desc}
          </p>

          {/* Interactive Mode Selector */}
          <div className="inline-flex p-1.5 rounded-xl border border-border bg-surface/80 backdrop-blur-md mt-8 shadow-sm">
            <button
              onClick={() => setActiveEngine("engine1")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all duration-300 ${
                activeEngine === "engine1"
                  ? "bg-steel text-white shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.dualEngine.tabSystems || "Systems"}
            </button>
            <button
              onClick={() => setActiveEngine("synergy")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-300 ${
                activeEngine === "synergy"
                  ? "bg-accent text-[#0B1220] shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.dualEngine.tabSynergy || "Synergy Loop"}
            </button>
            <button
              onClick={() => setActiveEngine("engine2")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all duration-300 ${
                activeEngine === "engine2"
                  ? "bg-accent text-[#0B1220] shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.dualEngine.tabVentures || "Ventures"}
            </button>
          </div>
        </div>

        {/* The Two Engines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch relative">
          
          {/* Engine 01 — Sadeem Systems */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border p-8 sm:p-12 flex flex-col justify-between transition-all duration-500 ${
              activeEngine === "engine1" || activeEngine === "synergy"
                ? "border-steel/60 bg-surface shadow-[0_10px_30px_rgba(82,124,145,0.12)]"
                : "border-border bg-surface/60 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-steel/40 bg-steel/10 text-steel">
                  {t.dualEngine.engine1.tag}
                </span>
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  {language === "en" ? "For Organizations" : "للشركات والمؤسسات"}
                </span>
              </div>

              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {t.dualEngine.engine1.title}
              </h4>
              <p className="text-sm font-semibold text-steel mb-4">
                {t.dualEngine.engine1.subtitle}
              </p>
              <p className="text-muted text-sm leading-relaxed mb-10">
                {t.dualEngine.engine1.desc}
              </p>
            </div>
            
            {/* Steps Timeline */}
            <div className="pt-6 border-t border-border/80">
              <div className="flex flex-wrap gap-y-4 items-center">
                {t.dualEngine.engine1.steps.map((step, i, arr) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-steel uppercase tracking-wider">
                        {t.dualEngine.engine1.stepLabel} 0{i + 1}
                      </span>
                      <span className="text-foreground/90 font-medium text-xs sm:text-sm">
                        {step}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mx-3 text-border rtl:rotate-180">
                        {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Engine 02 — Sadeem Ventures */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border p-8 sm:p-12 flex flex-col justify-between transition-all duration-500 ${
              activeEngine === "engine2" || activeEngine === "synergy"
                ? "border-accent/60 bg-surface shadow-[0_10px_30px_rgba(194,142,98,0.12)]"
                : "border-border bg-surface/60 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-accent/40 bg-accent/10 text-accent">
                  {t.dualEngine.engine2.tag}
                </span>
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  {language === "en" ? "Proprietary Products" : "منتجات الاستوديو الخاصة"}
                </span>
              </div>

              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {t.dualEngine.engine2.title}
              </h4>
              <p className="text-sm font-semibold text-accent mb-4">
                {t.dualEngine.engine2.subtitle}
              </p>
              <p className="text-muted text-sm leading-relaxed mb-10">
                {t.dualEngine.engine2.desc}
              </p>
            </div>
            
            {/* Steps Timeline */}
            <div className="pt-6 border-t border-border/80">
              <div className="flex flex-wrap gap-y-4 items-center">
                {t.dualEngine.engine2.steps.map((step, i, arr) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                        {t.dualEngine.engine2.stepLabel} 0{i + 1}
                      </span>
                      <span className="text-foreground/90 font-medium text-xs sm:text-sm">
                        {step}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mx-3 text-border rtl:rotate-180">
                        {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Flywheel Synergy Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 p-6 sm:p-8 rounded-2xl border border-accent/30 bg-accent-muted flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-accent text-[#0B1220] flex-shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <h5 className="font-bold text-base text-foreground mb-1">
                {t.dualEngine.synergyTitle}
              </h5>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-3xl">
                {t.dualEngine.synergyDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest font-bold whitespace-nowrap">
            <span>Continuous Reinforcement</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
