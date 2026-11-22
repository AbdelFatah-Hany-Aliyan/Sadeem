import { Metadata } from "next";
import { Suspense } from "react";
import ContactTabs from "@/components/contact/ContactTabs";
import { Sparkles, Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Intake | Sadeem — سديم",
  description: "Start a custom software project or pitch an ambitious venture idea to Sadeem Studio.",
  openGraph: {
    title: "Contact Sadeem Studio",
    description: "Start a software project or explore venture co-founding with Sadeem.",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-background">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-xs font-mono text-accent uppercase tracking-widest">
            <Sparkles size={13} className="text-accent" />
            <span>CONNECT WITH SADEEM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground text-balance">
            Let&apos;s Build Something Significant.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed text-balance">
            Whether you need mission-critical digital systems engineered for your business or seek a technical co-founding partner for a new venture, choose your path below.
          </p>
        </div>

        {/* Interactive Tabs Intake Hub */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
              <Loader2 className="animate-spin text-accent" size={32} />
              <p className="text-sm text-text-secondary">Loading intake hub...</p>
            </div>
          }
        >
          <ContactTabs initialTab="project" />
        </Suspense>
      </div>
    </div>
  );
}
