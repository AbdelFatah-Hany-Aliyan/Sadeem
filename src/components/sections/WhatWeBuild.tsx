"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function WhatWeBuild() {
  const { t } = useLanguage();
  
  return (
    <section id="capabilities" className="py-32 bg-background border-t border-border relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-20 md:mb-32">
          <h2 className="text-sm font-medium tracking-widest text-muted uppercase mb-4">{t.whatWeBuild.label}</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-2xl">
            {t.whatWeBuild.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
          {t.whatWeBuild.items.map((cap, i) => (
            <motion.div
              key={cap.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-sm font-mono text-muted">{cap.num}</span>
                <h4 className="text-2xl font-semibold text-foreground tracking-tight">{cap.title}</h4>
              </div>
              <p className="text-foreground/60 leading-relaxed max-w-md ml-9 rtl:ml-0 rtl:mr-9">
                {cap.desc}
              </p>
              
              <div className="h-[1px] w-full bg-border mt-10 group-hover:bg-foreground/20 transition-colors duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
