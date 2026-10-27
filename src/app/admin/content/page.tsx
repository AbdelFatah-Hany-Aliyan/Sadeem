import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminContentCatalog } from "@/lib/services/contentService";
import { FileText, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContentCatalogPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const sections = await getAdminContentCatalog();

  return (
    <div className="container mx-auto px-6 md:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Website Content Management
            </h1>
          </div>
          <p className="text-xs font-mono text-muted">
            Manage approved editorial copy and bilingual homepage messaging without modifying source code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            <span>Live Website</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Role Notice */}
      <div className="mb-8 p-4 rounded-xl border border-border bg-surface/60 backdrop-blur-sm flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-accent" />
          <span>
            Logged in as <strong className="text-foreground">{session.name}</strong> ({session.role}).
            {session.role === "SUPER_ADMIN"
              ? " You have full authority to save drafts and publish changes directly to the public website."
              : " As an Editor, you can prepare and update drafts. Publication to the live website requires Super Admin review."}
          </span>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec) => (
          <div
            key={sec.sectionKey}
            className="rounded-2xl border border-border bg-surface/80 p-6 flex flex-col justify-between hover:border-accent/50 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
                  KEY // {sec.sectionKey}
                </span>
                <div className="flex items-center gap-1.5">
                  {sec.isDraftModified && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      Draft Pending
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      sec.status === "PUBLISHED"
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        : "bg-muted/15 text-muted border-muted/30"
                    }`}
                  >
                    {sec.status}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                {sec.name}
              </h2>

              <p className="text-xs text-muted mb-4 leading-relaxed">
                {sec.description || "Homepage editorial section"}
              </p>

              {/* Translation Badges */}
              <div className="flex items-center gap-3 text-xs font-mono text-muted mb-6">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  EN Complete
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  AR Complete
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted/60 text-[11px] flex items-center gap-1">
                <Clock size={11} />
                {sec.publishedAt ? new Date(sec.publishedAt).toLocaleDateString() : "Draft"}
              </span>

              <Link
                href={`/admin/content/${sec.sectionKey}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span>Edit Section</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
