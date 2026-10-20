"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function HowWeWork() {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  
  return (
    <section className="py-28 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-steel/30 bg-steel/10 text-xs font-mono text-steel uppercase tracking-widest mb-4">
            {t.howWeWork.label}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {t.howWeWork.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {t.howWeWork.items.map((step, i, arr) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="p-8 rounded-2xl border border-border bg-surface/80 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-accent/40 flex flex-col justify-between group"
            >
              <div>
                {/* Step Circle with Accent Border */}
                <div className="w-12 h-12 rounded-xl border border-border bg-background flex items-center justify-center text-xs font-mono font-bold text-accent mb-8 group-hover:border-accent group-hover:scale-110 transition-all shadow-sm">
                  {step.num}
                </div>

                <h4 className="text-xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                  {step.title}
                </h4>

                <p className="text-muted text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border/50 text-[11px] font-mono text-muted/60 flex items-center justify-between">
                <span>PHASE 0{i + 1}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
