"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { projects as staticProjects, Project } from "@/data/projects";
import { ProjectDTO } from "@/lib/types/portfolio";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  Smartphone, 
  Layers, 
  ShoppingBag, 
  GraduationCap, 
  ArrowUpRight,
  Cpu
} from "lucide-react";

interface WorkProps {
  initialProjects?: (ProjectDTO | Project)[];
  hrefPrefix?: string;
}

/**
 * Resolves semantic icon based on project type or domain characteristics
 */
function resolveProjectIcon(project: ProjectDTO | Project): React.ElementType {
  if (project.type === "MOBILE_APPLICATION" || project.id === "cucu-leaf-scan") return Smartphone;
  if (project.type === "COLLABORATIVE_COMMERCE" || project.id === "tabadul") return ShoppingBag;
  if (project.type === "ENTERPRISE_SYSTEM" || project.id === "lama-school") return GraduationCap;
  if (project.type === "WEB_PLATFORM" || project.id === "wesal") return Layers;
  return Cpu;
}

export default function Work({ initialProjects, hrefPrefix = "/work" }: WorkProps) {
  const { t, language } = useLanguage();
  
  // Use server-provided database projects if available, otherwise safely fallback to static baseline
  const displayProjects = initialProjects && initialProjects.length > 0 ? initialProjects : staticProjects;

  return (
    <section id="work" className="py-28 bg-background border-t border-border relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-xs font-mono text-accent uppercase tracking-widest mb-4">
              {t.work.label}
            </div>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              {t.work.title}
            </h3>
            <p className="text-muted text-sm md:text-base leading-relaxed">
              {t.work.subtitle || "Real systems and proprietary ventures developed by Sadeem."}
            </p>
          </div>
        </div>

        {/* Dynamic Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {displayProjects.map((project, idx) => {
            const IconComponent = resolveProjectIcon(project);
            const statusColor = project.statusColor || (project.status === "MVP" ? "#6C8B80" : "#C28E62");

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="group rounded-2xl border border-border bg-surface/90 backdrop-blur-md p-8 sm:p-10 relative overflow-hidden transition-all duration-300 hover:border-accent/50 hover:shadow-[0_15px_35px_rgba(194,142,98,0.12)] flex flex-col justify-between"
              >
                {/* Subtle top metallic accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div>
                  {/* Top Bar: Ownership & Live Status Pill */}
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <span className="text-xs font-mono font-medium tracking-wider text-muted uppercase">
                      {language === "en" ? project.ownership : project.arabicOwnership}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/60">
                      <span 
                        className="w-2 h-2 rounded-full animate-ping" 
                        style={{ backgroundColor: statusColor }} 
                      />
                      <span 
                        className="text-[11px] font-mono font-bold" 
                        style={{ color: statusColor }}
                      >
                        {language === "en" ? project.status : project.arabicStatus}
                      </span>
                    </div>
                  </div>

                  {/* Illustrative Branded Abstract Graphic Header */}
                  <div className="relative aspect-[16/9] w-full rounded-xl bg-background/60 border border-border flex items-center justify-center overflow-hidden mb-8 group-hover:border-accent/30 transition-colors">
                    {/* Architectural Coordinate Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(194,142,98,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(82,124,145,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    
                    {/* Glowing Core Visual Icon */}
                    <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
                      <div 
                        className="w-16 h-16 rounded-2xl border border-border bg-surface flex items-center justify-center text-accent mb-3 shadow-md group-hover:scale-110 transition-transform duration-500"
                        style={{ color: statusColor }}
                      >
                        <IconComponent size={32} />
                      </div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted">
                        {language === "en" ? project.category : project.arabicCategory}
                      </div>
                    </div>

                    {/* Corner Coordinate Badges */}
                    <div className="absolute top-3 left-3 text-[10px] font-mono text-muted/50">
                      0{idx + 1} • SYS-ARCH
                    </div>
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-muted/50">
                      EST. {project.year}
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div className="mb-4">
                    <Link href={`${hrefPrefix}/${project.slug || project.id}`} className="block group/link">
                      <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 group-hover/link:text-accent transition-colors flex items-center justify-between">
                        <span>{language === "en" ? project.name : (project.arabicName || project.name)}</span>
                        <ArrowUpRight size={20} className="text-muted group-hover/link:text-accent transition-colors" />
                      </h4>
                    </Link>
                    <p className="text-xs sm:text-sm font-medium text-accent">
                      {language === "en" ? project.tagline : project.arabicTagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-muted text-sm leading-relaxed mb-6">
                    {language === "en" ? project.longDescription : project.arabicLongDescription}
                  </p>

                  {/* Partnership Clarification Note (Domain-driven, not hardcoded by project ID) */}
                  {project.partnershipNote && (
                    <div className="mb-6 p-3 rounded-lg border border-steel/30 bg-steel/10 text-xs font-mono text-steel">
                      {language === "en" ? project.partnershipNote.en : project.partnershipNote.ar}
                    </div>
                  )}
                </div>

                <div>
                  {/* Milestone Indicator */}
                  {project.metric && (
                    <div className="p-3.5 rounded-lg bg-background/50 border border-border text-xs font-mono mb-6 flex items-center justify-between">
                      <span className="text-muted">{t.work.metricLabel || "Milestone"}:</span>
                      <span className="text-accent font-semibold">
                        {language === "en" ? project.metric.en : project.metric.ar}
                      </span>
                    </div>
                  )}

                  {/* Technology Pills */}
                  <div className="pt-4 border-t border-border/80 flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span 
                        key={tech} 
                        className="text-xs font-mono px-2.5 py-1 rounded border border-border bg-background/40 text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
