"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

export default function DualEngine() {
  const { t } = useLanguage();
  
  return (
    <section id="studio" className="py-32 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-sm font-medium tracking-widest text-muted uppercase mb-4">{t.dualEngine.label}</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto mb-6">
            {t.dualEngine.title}
          </h3>
          <p className="text-foreground/50 max-w-2xl mx-auto text-balance">
            {t.dualEngine.desc}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-0 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

          {/* Engine 01 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-1/2 lg:pr-6 xl:pr-10 relative z-10 rtl:lg:pr-0 rtl:lg:pl-6 rtl:xl:pl-10"
          >
            <div className="bg-surface border border-border p-10 lg:p-14 h-full relative group hover:border-foreground/10 transition-colors flex flex-col">
              <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 p-6 text-muted font-mono text-sm tracking-widest">{t.dualEngine.engine1.tag}</div>
              <h4 className="text-2xl font-bold text-foreground mb-4">{t.dualEngine.engine1.title}</h4>
              <p className="text-foreground/70 mb-4 font-medium">{t.dualEngine.engine1.subtitle}</p>
              <p className="text-foreground/50 mb-12 text-sm leading-relaxed">
                {t.dualEngine.engine1.desc}
              </p>
              
              <div className="flex flex-wrap gap-y-6 items-center mt-auto">
                {t.dualEngine.engine1.steps.map((step, i, arr) => (
                  <div key={step} className="flex items-center">
                    <div className="group/item flex flex-col">
                      <span className="text-muted font-mono text-[10px] mb-1 group-hover/item:text-foreground/50 transition-colors uppercase tracking-wider">{t.dualEngine.engine1.stepLabel} 0{i + 1}</span>
                      <span className="text-foreground/80 font-medium text-sm md:text-base">{step}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mx-4 text-border rtl:rotate-180">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Engine 02 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-1/2 lg:pl-6 xl:pl-10 relative z-10 mt-8 lg:mt-0 lg:translate-y-12 rtl:lg:pl-0 rtl:lg:pr-6 rtl:xl:pr-10"
          >
            <div className="bg-surface border border-border p-10 lg:p-14 h-full relative group hover:border-foreground/10 transition-colors flex flex-col">
              <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 p-6 text-muted font-mono text-sm tracking-widest">{t.dualEngine.engine2.tag}</div>
              <h4 className="text-2xl font-bold text-foreground mb-4">{t.dualEngine.engine2.title}</h4>
              <p className="text-foreground/70 mb-4 font-medium">{t.dualEngine.engine2.subtitle}</p>
              <p className="text-foreground/50 mb-12 text-sm leading-relaxed">
                {t.dualEngine.engine2.desc}
              </p>
              
              <div className="flex flex-wrap gap-y-6 items-center mt-auto">
                {t.dualEngine.engine2.steps.map((step, i, arr) => (
                  <div key={step} className="flex items-center">
                    <div className="group/item flex flex-col">
                      <span className="text-muted font-mono text-[10px] mb-1 group-hover/item:text-foreground/50 transition-colors uppercase tracking-wider">{t.dualEngine.engine2.stepLabel} 0{i + 1}</span>
                      <span className="text-foreground/80 font-medium text-sm md:text-base">{step}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mx-4 text-border rtl:rotate-180">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
