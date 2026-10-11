"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function WhySadeem() {
  const { t } = useLanguage();
  
  return (
    <section className="py-32 bg-background border-t border-border relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-24">
          <h2 className="text-sm font-medium tracking-widest text-muted uppercase mb-4">{t.whySadeem.label}</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-2xl">
            {t.whySadeem.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12 border-l rtl:border-l-0 rtl:border-r border-border pl-6 md:pl-12 rtl:pl-0 rtl:pr-6 rtl:md:pr-12">
          {t.whySadeem.items.map((reason, i) => (
            <motion.div
              key={reason.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -left-6 md:-left-12 rtl:left-auto rtl:-right-6 rtl:md:-right-12 top-0 w-2 h-[1px] bg-foreground/20 mt-3" />
              <div className="text-xs font-mono text-muted mb-4">{reason.num}</div>
              <h4 className="text-lg font-bold text-foreground mb-2">{reason.title}</h4>
              <p className="text-foreground/50 text-sm leading-relaxed max-w-sm">
                {reason.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
