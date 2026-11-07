"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { ArrowUpRight } from "lucide-react";

export default function WhatWeBuild() {
  const { t, language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const isRtl = language === "ar";
  
  return (
    <section id="capabilities" className="py-28 bg-background border-t border-border relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-steel/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 md:mb-24 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-steel/30 bg-steel/10 text-xs font-mono text-steel uppercase tracking-widest mb-4">
            {t.whatWeBuild.label}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {t.whatWeBuild.title}
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {t.whatWeBuild.items.map((cap, i) => (
            <motion.div
              key={cap.num}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduceMotion ? {} : { y: -5 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
              className="group p-8 sm:p-10 rounded-2xl border border-border bg-surface/80 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-accent/40 hover:shadow-[0_10px_30px_rgba(194,142,98,0.1)] flex flex-col justify-between"
            >
              {/* Subtle copper top accent line on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded border border-border bg-background/50 text-accent">
                    {cap.num}
                  </span>
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted group-hover:text-accent group-hover:border-accent transition-colors">
                    <ArrowUpRight size={16} className={isRtl ? "rotate-[-90deg]" : ""} />
                  </div>
                </div>

                <h4 className="text-2xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors">
                  {cap.title}
                </h4>

                <p className="text-muted leading-relaxed text-sm md:text-base">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted/80">
                <span className="uppercase tracking-wider">Engineered by Sadeem</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent/60 group-hover:bg-accent group-hover:scale-125 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
