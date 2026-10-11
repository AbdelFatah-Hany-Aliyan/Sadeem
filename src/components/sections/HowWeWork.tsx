"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function HowWeWork() {
  const { t } = useLanguage();
  
  return (
    <section className="py-32 bg-accent border-t border-border relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-24">
          <h2 className="text-sm font-medium tracking-widest text-muted uppercase mb-4">{t.howWeWork.label}</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {t.howWeWork.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {t.howWeWork.items.map((step, i, arr) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative pr-8 rtl:pr-0 rtl:pl-8"
            >
              {/* Connector line for desktop */}
              {i < arr.length - 1 && (
                <div className="hidden md:block absolute top-6 right-0 rtl:right-auto rtl:left-0 w-[calc(100%-2rem)] h-[1px] bg-foreground/10 translate-x-[2rem] rtl:-translate-x-[2rem]" />
              )}
              
              <div className="text-xs font-mono text-muted mb-8 w-12 h-12 rounded-full border border-border flex items-center justify-center bg-background relative z-10">
                {step.num}
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">{step.title}</h4>
              <p className="text-foreground/50 text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
