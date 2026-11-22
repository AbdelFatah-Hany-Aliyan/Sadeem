import Work from "@/components/sections/Work";
import { getPreviewProjects } from "@/lib/services/projectService";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, ShieldCheck, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkPreviewPage() {
  // CRITICAL SECURITY GUARD:
  // Unpublished draft previews STRICTLY require an active, authenticated administrator session.
  // Anonymous visitors and unprivileged accounts receive a 404 response.
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "EDITOR")) {
    notFound();
  }

  const previewProjects = await getPreviewProjects();

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16">
      {/* Authenticated Internal Development Notice Banner */}
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
                    PostgreSQL Portfolio Preview
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-steel/20 text-steel border border-steel/30">
                    AUTHENTICATED PREVIEW
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Logged in as <strong className="text-foreground">{session.name}</strong> ({session.role}). Viewing {previewProjects.length} draft projects directly from PostgreSQL.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 bg-accent/10 text-xs font-mono text-accent hover:bg-accent/20 transition-colors"
              >
                Admin Projects
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-muted hover:text-foreground hover:border-accent transition-colors"
              >
                <ArrowLeft size={14} />
                Live Homepage
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Draft Security: AUTHENTICATION ENFORCED</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <UserCheck size={14} className="text-accent" />
              <span>Active Identity: {session.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Database size={14} className="text-steel" />
              <span>Access Level: {session.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Dynamic Work Section with preview link routing */}
      <Work initialProjects={previewProjects} hrefPrefix="/work-preview" />
    </div>
  );
}
