"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { Compass, Target } from "lucide-react";

export default function About() {
  const { t, language } = useLanguage();
  
  return (
    <section id="about" className="py-28 bg-background border-t border-border relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        {/* Core Statement Quote */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-8 leading-[1.15]">
              &quot;{t.about.quote1} <br className="hidden md:block" />
              <span className="text-accent">&quot;{t.about.quote2}</span>
            </h2>
            <p className="text-base md:text-xl text-muted max-w-2xl mx-auto leading-relaxed font-normal">
              {t.about.brandStatement}
            </p>
          </motion.div>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 sm:p-10 rounded-2xl border border-border bg-surface/80 backdrop-blur-md relative overflow-hidden hover:border-steel/50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl border border-steel/30 bg-steel/10 text-steel">
                <Compass size={20} />
              </div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-steel uppercase">
                {t.common.visionTitle}
              </h3>
            </div>
            <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
              {t.about.visionDesc}
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 sm:p-10 rounded-2xl border border-border bg-surface/80 backdrop-blur-md relative overflow-hidden hover:border-accent/50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl border border-accent/30 bg-accent/10 text-accent">
                <Target size={20} />
              </div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-accent uppercase">
                {t.common.missionTitle}
              </h3>
            </div>
            <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
              {t.about.missionDesc}
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
