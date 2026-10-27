"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { ProjectDetailDTO } from "@/lib/types/portfolio";
import { 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldAlert, 
  Smartphone, 
  Layers, 
  ShoppingBag, 
  GraduationCap, 
  Cpu, 
  Database,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";

interface CaseStudyViewProps {
  project: ProjectDetailDTO;
  isPreview?: boolean;
}

function resolveProjectIcon(type: string, id: string): React.ElementType {
  if (type === "MOBILE_APPLICATION" || id === "cucu-leaf-scan") return Smartphone;
  if (type === "COLLABORATIVE_COMMERCE" || id === "tabadul") return ShoppingBag;
  if (type === "ENTERPRISE_SYSTEM" || id === "lama-school") return GraduationCap;
  if (type === "WEB_PLATFORM" || id === "wesal") return Layers;
  return Cpu;
}

export default function CaseStudyView({ project, isPreview = false }: CaseStudyViewProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const IconComponent = resolveProjectIcon(project.type, project.id);
  const statusColor = project.statusColor || "#C28E62";

  // Localized values
  const title = language === "en" ? project.name : (project.arabicName || project.name);
  const tagline = language === "en" ? project.tagline : project.arabicTagline;
  const category = language === "en" ? project.category : project.arabicCategory;
  const ownership = language === "en" ? project.ownership : project.arabicOwnership;
  const statusLabel = language === "en" ? project.status : project.arabicStatus;
  const longDescription = language === "en" ? project.longDescription : project.arabicLongDescription;
  const metricText = project.metric ? (language === "en" ? project.metric.en : project.metric.ar) : null;
  const problemText = project.problem ? (language === "en" ? project.problem.en : project.problem.ar) : null;
  const solutionText = project.solution ? (language === "en" ? project.solution.en : project.solution.ar) : null;
  const roleText = project.roleDescription ? (language === "en" ? project.roleDescription.en : project.roleDescription.ar) : null;
  const partnershipNoteText = project.partnershipNote ? (language === "en" ? project.partnershipNote.en : project.partnershipNote.ar) : null;

  const backUrl = isPreview ? "/work-preview" : "/#work";

  return (
    <article className="min-h-screen bg-background text-foreground pt-28 pb-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-2/3 left-0 w-[500px] h-[500px] bg-steel/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        {/* INTERNAL PREVIEW BANNER */}
        {isPreview && (
          <div className="mb-10 p-4 rounded-xl border border-accent/40 bg-accent/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <span className="font-bold text-accent">INTERNAL AUDIT PREVIEW:</span> Case study rendered directly from PostgreSQL (`sadeem_dev`). Status: <strong className="text-foreground">DRAFT</strong>.
              </div>
            </div>
            <Link 
              href="/work-preview" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface hover:border-accent text-foreground transition-colors"
            >
              <ArrowLeft size={13} className={isRtl ? "rotate-180" : ""} />
              {isRtl ? "العودة لقائمة المعاينة" : "Back to Preview List"}
            </Link>
          </div>
        )}

        {/* BREADCRUMBS & BACK NAVIGATION */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center justify-between text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-accent transition-colors">
              {isRtl ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className={isRtl ? "rotate-180 text-muted/50" : "text-muted/50"} />
            <Link href={backUrl} className="hover:text-accent transition-colors">
              {isRtl ? "المشاريع" : "Work"}
            </Link>
            <ChevronRight size={12} className={isRtl ? "rotate-180 text-muted/50" : "text-muted/50"} />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
              {title}
            </span>
          </div>

          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface/60 hover:border-accent/40 hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft size={14} className={isRtl ? "rotate-180" : ""} />
            <span>{isRtl ? "العودة للمشاريع" : "Back to Portfolio"}</span>
          </Link>
        </nav>

        {/* SECTION A: PROJECT HERO */}
        <header className="mb-16">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Ownership Pill */}
            <span className="text-xs font-mono font-medium tracking-wider text-muted uppercase px-3 py-1 rounded-full border border-border bg-surface">
              {ownership}
            </span>

            {/* Development Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/80">
              <span 
                className="w-2 h-2 rounded-full animate-ping" 
                style={{ backgroundColor: statusColor }} 
              />
              <span 
                className="text-[11px] font-mono font-bold" 
                style={{ color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>

            {/* Category Pill */}
            <span className="text-xs font-mono text-muted/80 px-3 py-1 rounded-full border border-border/60 bg-background/40">
              {category}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            {title}
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-accent mb-8 max-w-3xl leading-snug">
            {tagline}
          </p>

          {/* Architectural Branded Graphic Composition */}
          <div className="relative aspect-[21/9] min-h-[260px] w-full rounded-2xl bg-surface/80 border border-border flex items-center justify-center overflow-hidden mb-8 shadow-xl">
            {/* Coordinate Pattern Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(194,142,98,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(82,124,145,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
            
            {/* Metallic Accent Top Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

            {/* Center Core Visual */}
            <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border bg-background/90 flex items-center justify-center text-accent mb-4 shadow-lg backdrop-blur-sm"
                style={{ color: statusColor }}
              >
                <IconComponent size={44} />
              </div>
              <span className="text-xs font-mono tracking-widest uppercase text-muted">
                {category} • SYS-ID: {project.slug}
              </span>
            </div>

            {/* Coordinate Badges */}
            <div className="absolute top-4 left-4 text-xs font-mono text-muted/60">
              SPEC-ARCH // 0{project.displayOrder}
            </div>
            <div className="absolute bottom-4 right-4 text-xs font-mono text-muted/60">
              EST. {project.year}
            </div>
          </div>

          {/* Quick Meta Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-xs font-mono">
            <div>
              <div className="text-muted mb-1">{isRtl ? "سنة التأسيس" : "Year"}</div>
              <div className="text-foreground font-semibold">{project.year}</div>
            </div>
            <div>
              <div className="text-muted mb-1">{isRtl ? "حالة التطوير" : "Dev Status"}</div>
              <div className="font-semibold" style={{ color: statusColor }}>{statusLabel}</div>
            </div>
            <div>
              <div className="text-muted mb-1">{isRtl ? "طبيعة المشروع" : "Classification"}</div>
              <div className="text-foreground font-semibold truncate">{ownership}</div>
            </div>
            <div>
              <div className="text-muted mb-1">{isRtl ? "الميزة المعمارية" : "Architecture"}</div>
              <div className="text-accent font-semibold truncate">{metricText || "Custom"}</div>
            </div>
          </div>
        </header>

        {/* SECTION B: OVERVIEW */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
            01 // {isRtl ? "نظرة عامة على النظام" : "System Overview"}
          </h2>
          <div className="rounded-2xl border border-border bg-surface/70 p-8 sm:p-10 backdrop-blur-sm">
            <p className="text-base sm:text-lg text-foreground/90 leading-relaxed max-w-4xl">
              {longDescription}
            </p>

            {metricText && (
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs font-mono">
                <span className="text-muted">{isRtl ? "المؤشر المعماري الأساسي:" : "Architectural Descriptor:"}</span>
                <span className="px-3 py-1 rounded bg-accent/10 border border-accent/30 text-accent font-bold">
                  {metricText}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION C & D: PROBLEM & SOLUTION (Optional - displayed only when verified) */}
        {(problemText || solutionText) && (
          <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {problemText && (
              <div className="rounded-2xl border border-steel/30 bg-surface/70 p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-steel mb-3 flex items-center gap-2">
                    <Info size={14} />
                    02 // {isRtl ? "التحدي وسياق المشكلة" : "The Challenge & Context"}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {isRtl ? "المشكلة القائمة" : "Problem Statement"}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {problemText}
                  </p>
                </div>
              </div>
            )}

            {solutionText && (
              <div className="rounded-2xl border border-accent/40 bg-surface/70 p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    03 // {isRtl ? "الحل والمنهجية الهندسية" : "Engineering Approach"}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {isRtl ? "الحل التقني" : "The Solution"}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {solutionText}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION E: VERIFIED FEATURES (Optional - displayed only when features exist) */}
        {project.features && project.features.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
              04 // {isRtl ? "أبرز الخصائص والقدرات" : "Key Features & Capabilities"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.features.map((feature, idx) => {
                const featTitle = language === "en" ? feature.title.en : feature.title.ar;
                const featDesc = feature.description 
                  ? (language === "en" ? feature.description.en : feature.description.ar) 
                  : null;

                return (
                  <div 
                    key={feature.id} 
                    className="rounded-xl border border-border bg-surface/70 p-6 flex flex-col justify-between hover:border-accent/40 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-mono text-muted/60 mb-2">
                        FEAT // 0{idx + 1}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-2">
                        {featTitle}
                      </h3>
                      {featDesc && (
                        <p className="text-xs leading-relaxed text-muted">
                          {featDesc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION F: TECHNOLOGY STACK */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
            05 // {isRtl ? "التقنيات والهندسة المعمارية" : "Technology Stack"}
          </h2>
          <div className="rounded-2xl border border-border bg-surface/70 p-8">
            <p className="text-xs font-mono text-muted mb-6">
              {isRtl 
                ? "تقنيات ومكتبات برمجية تم التحقق من اعتمادها في هذا المشروع:" 
                : "Verified technologies and architectural foundations powering this project:"}
            </p>
            <div className="flex flex-wrap gap-3">
              {project.technologies.map((tech) => (
                <div 
                  key={tech}
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-xs font-mono text-foreground font-semibold flex items-center gap-2 hover:border-accent/50 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION G: SADEEM ROLE & PARTNERSHIP NOTE */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
            06 // {isRtl ? "طبيعة المشروع ودور سديم" : "Studio Role & Collaboration"}
          </h2>
          <div className="rounded-2xl border border-border bg-surface/70 p-8 sm:p-10 space-y-6">
            <div>
              <div className="text-xs font-mono text-muted mb-1">{isRtl ? "تصنيف الملكية:" : "Ownership Model:"}</div>
              <div className="text-lg font-bold text-foreground">{ownership}</div>
            </div>

            {roleText && (
              <div>
                <div className="text-xs font-mono text-muted mb-1">{isRtl ? "مساهمة سديم الهندسية:" : "Sadeem's Contribution:"}</div>
                <p className="text-sm text-muted leading-relaxed max-w-3xl">
                  {roleText}
                </p>
              </div>
            )}

            {/* Tabadul Collaborative Disclaimer Note */}
            {partnershipNoteText && (
              <div className="p-4 rounded-xl border border-steel/40 bg-steel/10 flex items-start gap-3">
                <ShieldAlert size={18} className="text-steel shrink-0 mt-0.5" />
                <div className="text-xs font-mono text-steel leading-relaxed">
                  <strong>{isRtl ? "تنويه رسمي:" : "Official Note:"}</strong> {partnershipNoteText}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION H: GALLERY (Shown ONLY if media exists) */}
        {project.media && project.media.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
              07 // {isRtl ? "معرض الوسائط والمعمارية" : "Project Media & Architecture"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.media.map((item) => {
                const alt = language === "en" ? item.altText.en : item.altText.ar;
                const cap = item.caption ? (language === "en" ? item.caption.en : item.caption.ar) : null;
                const imgSrc = item.publicUrl || (item.storageKey?.startsWith("http") ? item.storageKey : null);

                return (
                  <div key={item.id} className="rounded-xl border border-border bg-surface/80 overflow-hidden shadow-sm hover:border-accent/40 transition-colors">
                    {imgSrc ? (
                      <div className="aspect-video relative overflow-hidden bg-background/90 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgSrc}
                          alt={alt}
                          className="w-full h-full object-contain p-4"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-background/60 p-6 flex flex-col items-center justify-center text-center border-b border-border/50">
                        <div className="w-12 h-12 rounded-xl border border-border bg-surface flex items-center justify-center text-accent mb-3">
                          <Layers size={24} />
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground mb-1">{alt}</span>
                        <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest">
                          {item.mediaType} • {item.storageKey}
                        </span>
                      </div>
                    )}
                    {cap && (
                      <div className="p-4 text-xs font-mono text-muted leading-relaxed border-t border-border bg-surface/40">
                        {cap}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION J: RELATED PROJECTS (Filtered published/preview projects) */}
        {project.relatedProjects && project.relatedProjects.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
              08 // {isRtl ? "مشاريع ذات صلة" : "Related Projects"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.relatedProjects.map((rel) => {
                const relTitle = language === "en" ? rel.name : (rel.arabicName || rel.name);
                const relCategory = language === "en" ? rel.category : rel.arabicCategory;
                const relStatus = language === "en" ? rel.status : rel.arabicStatus;
                const relUrl = isPreview ? `/work-preview/${rel.slug}` : `/work/${rel.slug}`;

                return (
                  <Link
                    key={rel.id}
                    href={relUrl}
                    className="group block p-6 rounded-2xl border border-border bg-surface/70 hover:border-accent/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-muted">{relCategory}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: rel.statusColor }}>
                        {relStatus}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors flex items-center justify-between">
                      <span>{relTitle}</span>
                      <ArrowUpRight size={18} className="text-muted group-hover:text-accent transition-colors" />
                    </h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION K: FINAL STUDIO CTA */}
        <section className="rounded-2xl border border-accent/40 bg-surface/80 p-10 sm:p-14 text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
            {isRtl ? "لديك فكرة طموحة أو ترغب في بناء نظام متقدم؟" : "Have an Ambitious Idea or Need Enterprise Systems?"}
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            {isRtl 
              ? "سديم شريك تكنولوجي واستوديو مشاريع يبني البرمجيات الحقيقية من المفهوم وحتى الإطلاق المؤسسي."
              : "Sadeem is a technology studio that transforms technical challenges into scalable digital systems and high-impact ventures."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/#cta"
              className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md"
            >
              {isRtl ? "ابدأ المحادثة معنا" : "Start a Conversation"}
            </Link>
            <a
              href="mailto:hello@sadeem.studio"
              className="px-6 py-3 rounded-xl border border-border bg-surface font-mono text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              hello@sadeem.studio
            </a>
          </div>
        </section>

      </div>
    </article>
  );
}
