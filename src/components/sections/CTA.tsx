"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export default function CTA() {
  const { t, language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const isRtl = language === "ar";

  return (
    <section id="contact" className="py-32 bg-surface/90 border-t border-border relative flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Dynamic Ambient Glows */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.12, 0.20, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="w-[600px] h-[600px] bg-accent/15 rounded-full blur-[160px]"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1.08, 1, 1.08], opacity: [0.10, 0.18, 0.10] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="w-[450px] h-[450px] bg-steel/15 rounded-full blur-[140px]"
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/40 bg-accent-muted text-xs font-mono text-accent uppercase tracking-widest mb-6">
            <Sparkles size={12} className="text-accent" />
            <span>START THE CONVERSATION</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            {t.common.readyToBuild}
          </h2>

          <p className="text-lg md:text-xl text-muted mb-16 max-w-2xl mx-auto text-balance leading-relaxed">
            {t.common.readyDesc}
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 sm:gap-8">
            {/* For Businesses */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -5 }}
              className="flex flex-col items-center p-8 rounded-2xl border border-border bg-background/60 backdrop-blur-md w-full md:w-80 hover:border-accent transition-all duration-300 group shadow-lg"
            >
              <span className="text-accent text-xs mb-4 font-mono font-bold uppercase tracking-wider">
                {t.common.forBusinesses}
              </span>
              <Link
                href="/start-project"
                className="inline-flex h-14 w-full items-center justify-center bg-accent text-[#0B1220] px-6 text-sm font-bold rounded-lg hover:bg-accent-hover transition-all duration-300 shadow-[0_4px_20px_rgba(194,142,98,0.25)] gap-2 group-hover:scale-[1.02]"
              >
                <span>{t.common.startProject}</span>
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </motion.div>

            {/* For Founders */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -5 }}
              className="flex flex-col items-center p-8 rounded-2xl border border-border bg-background/60 backdrop-blur-md w-full md:w-80 hover:border-steel transition-all duration-300 group shadow-lg"
            >
              <span className="text-steel text-xs mb-4 font-mono font-bold uppercase tracking-wider">
                {t.common.forFounders}
              </span>
              <Link
                href="/pitch-idea"
                className="inline-flex h-14 w-full items-center justify-center border border-border bg-surface text-foreground px-6 text-sm font-bold rounded-lg hover:border-steel hover:bg-surface-hover transition-all duration-300 gap-2 group-hover:scale-[1.02]"
              >
                <span>{t.common.pitchIdea}</span>
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
