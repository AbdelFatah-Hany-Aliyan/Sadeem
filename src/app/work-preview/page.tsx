import Work from "@/components/sections/Work";
import { getPreviewProjects } from "@/lib/services/projectService";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, ShieldCheck, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkPreviewPage() {
  // CRITICAL PRODUCTION GUARD:
  // Strictly prevent draft preview routes from leaking in production deployments
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DRAFT_PREVIEW !== "true") {
    notFound();
  }

  const previewProjects = await getPreviewProjects();

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16">
      {/* Internal Development Notice Banner */}
      <div className="container mx-auto px-6 md:px-12 mb-8">
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    PostgreSQL Database-Driven Portfolio Preview
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-steel/20 text-steel border border-steel/30">
                    STAGE B PREVIEW (DEV ONLY)
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Rendering {previewProjects.length} projects loaded directly from PostgreSQL (`sadeem_dev`). Click any card to preview its dynamic case study.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Live Homepage
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Draft Publication Safety: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Database size={14} className="text-accent" />
              <span>Query Layer: Prisma Server Component</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <AlertCircle size={14} className="text-amber-500" />
              <span>Production Guard: 404 in Production</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render the Dynamic Work Section using Live PostgreSQL Data with preview link routing */}
      <Work initialProjects={previewProjects} hrefPrefix="/work-preview" />
    </div>
  );
}
