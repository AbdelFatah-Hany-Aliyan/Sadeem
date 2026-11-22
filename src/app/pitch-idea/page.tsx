import { Metadata } from "next";
import Link from "next/link";
import PitchIdeaForm from "@/components/contact/PitchIdeaForm";
import { Rocket, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Pitch an Idea | Sadeem Venture Studio — سديم",
  description: "Pitch your venture concept or market opportunity to Sadeem Studio for technical co-founding and venture building.",
  openGraph: {
    title: "Pitch an Idea to Sadeem Venture Studio",
    description: "Explore technical co-founding with Sadeem Studio.",
  },
};

export default function PitchIdeaPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-background">
      {/* Background glow with venture purple accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/12 rounded-full blur-[170px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Navigation back */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link
            href="/contact?tab=pitch"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-purple-400 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>ALL INTAKE PATHS</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-xs font-mono text-purple-300 uppercase tracking-widest">
            <Rocket size={13} className="text-purple-400" />
            <span>VENTURE STUDIO ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground text-balance">
            Pitch a Venture Idea.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed text-balance">
            We partner with entrepreneurs and domain experts to transform compelling concepts into venture-backed technology companies.
          </p>
        </div>

        {/* Form Container */}
        <PitchIdeaForm />
      </div>
    </div>
  );
}
