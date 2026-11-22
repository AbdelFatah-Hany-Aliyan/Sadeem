import { Metadata } from "next";
import Link from "next/link";
import StartProjectForm from "@/components/contact/StartProjectForm";
import { Building2, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Start a Project | Sadeem — سديم",
  description: "Commission custom business systems, enterprise platforms, or digital products engineered by Sadeem Studio.",
  openGraph: {
    title: "Start a Project with Sadeem",
    description: "Commission custom business systems or enterprise platforms.",
  },
};

export default function StartProjectPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-background">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/12 rounded-full blur-[170px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Navigation back */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-accent transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>ALL INTAKE PATHS</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-xs font-mono text-accent uppercase tracking-widest">
            <Building2 size={13} className="text-accent" />
            <span>BUSINESS SYSTEMS &amp; PRODUCTS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground text-balance">
            Start a Project.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed text-balance">
            Tell us about the business challenge, operational bottleneck, or digital product you need engineered. We build reliable, maintainable systems designed to scale.
          </p>
        </div>

        {/* Form Container */}
        <StartProjectForm />
      </div>
    </div>
  );
}
