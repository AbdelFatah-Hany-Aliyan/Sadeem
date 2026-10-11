"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-foreground/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-medium tracking-[-0.04em] leading-[0.95] mb-8 text-foreground text-balance md:text-start">
              {t.hero.line1}<span className="hidden md:inline"><br /></span>
              <span className="text-foreground/40"> {t.hero.line2}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-foreground/50 max-w-2xl mb-12 font-medium leading-relaxed text-balance text-start"
          >
            {t.hero.desc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <a
              href="#contact"
              className="inline-flex h-14 w-full sm:w-auto items-center justify-center bg-foreground text-background px-8 font-medium hover:bg-foreground/90 transition-colors"
            >
              {t.common.startProject}
            </a>
            <a
              href="#work"
              className="inline-flex h-14 w-full sm:w-auto items-center justify-center border border-border bg-transparent text-foreground px-8 font-medium hover:bg-surface-hover transition-colors"
            >
              {t.common.exploreWork}
            </a>
          </motion.div>
        </div>
      </div>
      
      {/* Architectural Concept Visual - Precision & Structure */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        {/* Subtle Grid System */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_10%,transparent_100%)]" />
        
        {/* Precise Crosshairs */}
        <div className="absolute top-[30%] right-[15%] w-8 h-8 opacity-20">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-foreground" />
          <div className="absolute left-1/2 top-0 w-[1px] h-full bg-foreground" />
        </div>
        <div className="absolute bottom-[20%] left-[20%] w-8 h-8 opacity-20">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-foreground" />
          <div className="absolute left-1/2 top-0 w-[1px] h-full bg-foreground" />
        </div>
      </motion.div>
    </section>
  );
}
