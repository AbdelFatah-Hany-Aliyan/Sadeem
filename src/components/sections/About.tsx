"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function About() {
  const { t } = useLanguage();
  
  return (
    <section className="py-32 bg-background border-t border-border relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground mb-8 leading-tight">
              &quot;{t.about.quote1} <br className="hidden md:block" />
              <span className="text-foreground/40">{t.about.quote2}&quot;</span>
            </h2>
            <p className="text-lg text-foreground/50 max-w-2xl mx-auto">
              {t.about.brandStatement}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 max-w-5xl mx-auto">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-sm font-medium tracking-widest text-muted uppercase mb-6">{t.common.visionTitle}</h3>
            <p className="text-foreground/80 leading-relaxed mb-6">
              {t.about.visionDesc}
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-sm font-medium tracking-widest text-muted uppercase mb-6">{t.common.missionTitle}</h3>
            <p className="text-foreground/80 leading-relaxed mb-6">
              {t.about.missionDesc}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
