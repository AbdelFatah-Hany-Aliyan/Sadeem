"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { CheckCircle2 } from "lucide-react";

export default function WhySadeem() {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  
  return (
    <section className="py-28 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-steel/30 bg-steel/10 text-xs font-mono text-steel uppercase tracking-widest mb-4">
            {t.whySadeem.label}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {t.whySadeem.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.whySadeem.items.map((reason, i) => (
            <motion.div
              key={reason.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="p-8 rounded-2xl border border-border bg-surface/80 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-accent/40 hover:shadow-lg flex flex-col justify-between group"
            >
              {/* Subtle top indicator */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded border border-border bg-background/50 text-accent">
                    {reason.num}
                  </span>
                  <CheckCircle2 size={16} className="text-steel/50 group-hover:text-accent transition-colors" />
                </div>

                <h4 className="text-xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                  {reason.title}
                </h4>

                <p className="text-muted text-sm leading-relaxed">
                  {reason.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-mono text-muted/60 flex items-center justify-between">
                <span>ADVANTAGE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-steel/40 group-hover:bg-accent transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
