"use client";

import { motion } from "framer-motion";
import { projects } from "@/data/projects";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Work() {
  const { t, language } = useLanguage();
  
  return (
    <section id="work" className="py-32 bg-background relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div>
            <h2 className="text-sm font-medium tracking-widest text-muted uppercase mb-4">{t.work.label}</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              {t.work.title}
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-32">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col md:flex-row gap-12 md:gap-24"
            >
              {/* Visual Placeholder for Project Image */}
              <div className="w-full md:w-3/5 aspect-[4/3] bg-foreground/[0.02] border border-border relative overflow-hidden group-hover:border-foreground/10 transition-colors duration-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-foreground/10 font-bold text-4xl md:text-7xl tracking-tighter mix-blend-overlay">
                    {project.name.toUpperCase()}
                  </div>
                </div>
                {/* Abstract shape representing the project */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-foreground/5 blur-3xl rounded-full group-hover:bg-foreground/10 transition-colors duration-1000" />
              </div>

              {/* Project Info */}
              <div className="w-full md:w-2/5 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-3 py-1 text-xs font-mono border border-border text-foreground/50 rounded-full">
                    {language === "en" ? project.status : project.arabicStatus}
                  </span>
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    {language === "en" ? project.category : project.arabicCategory}
                  </span>
                </div>
                
                <h4 className="text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-4">
                  {language === "en" ? project.name : (project.arabicName || project.name)}
                </h4>
                
                <p className="text-xl text-foreground/70 mb-8 font-medium">
                  {language === "en" ? project.shortDescription : project.arabicShortDescription}
                </p>
                
                <p className="text-foreground/40 mb-12 leading-relaxed">
                  {language === "en" ? project.longDescription : project.arabicLongDescription}
                </p>
                
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.technologies.map(tech => (
                      <span key={tech} className="text-xs text-foreground/40 bg-foreground/[0.03] px-3 py-1 border border-border">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
