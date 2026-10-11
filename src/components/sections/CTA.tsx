"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function CTA() {
  const { t } = useLanguage();
  
  return (
    <section id="contact" className="py-40 bg-surface border-t border-border relative flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0 flex items-center justify-center">
         <div className="w-[800px] h-[800px] bg-foreground/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            {t.common.readyToBuild}
          </h2>
          <p className="text-xl text-foreground/50 mb-16 max-w-2xl mx-auto text-balance">
            {t.common.readyDesc}
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-12">
            <div className="flex flex-col items-center group">
              <p className="text-muted text-sm mb-4 font-mono uppercase tracking-widest">{t.common.forBusinesses}</p>
              <a
                href="mailto:hello@sadeem.studio?subject=Start%20a%20Project"
                className="inline-flex h-16 w-full md:w-auto min-w-[240px] items-center justify-center bg-foreground text-background px-10 text-lg font-medium hover:bg-foreground/90 transition-colors"
              >
                {t.common.startProject}
              </a>
            </div>

            <div className="flex flex-col items-center group">
              <p className="text-muted text-sm mb-4 font-mono uppercase tracking-widest">{t.common.forFounders}</p>
              <a
                href="mailto:hello@sadeem.studio?subject=Pitch%20an%20Idea"
                className="inline-flex h-16 w-full md:w-auto min-w-[240px] items-center justify-center border border-border bg-transparent text-foreground px-10 text-lg font-medium hover:bg-surface-hover transition-colors"
              >
                {t.common.pitchIdea}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
