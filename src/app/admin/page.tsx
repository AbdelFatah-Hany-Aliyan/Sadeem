import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/lib/services/adminProjectService";
import { 
  FolderKanban, 
  FileCheck2, 
  FileEdit, 
  Cpu, 
  History, 
  PlusCircle, 
  Eye, 
  ShieldCheck, 
  ArrowRight,
  Database
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardOverviewPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const stats = await getAdminDashboardStats();

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8 space-y-10">
      
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <span>Sadeem Management Console</span>
            <span>•</span>
            <span className="text-accent">PostgreSQL sadeem_dev</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {session.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>New Project</span>
          </Link>

          <Link
            href="/work-preview"
            target="_blank"
            className="px-4 py-2 rounded-xl border border-border bg-surface font-mono text-xs font-bold text-muted hover:text-foreground hover:border-accent transition-colors flex items-center gap-2"
          >
            <Eye size={15} />
            <span>Draft Previews</span>
          </Link>
        </div>
      </div>

      {/* Real Operational Stats Grid (Factual database counts only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl border border-border bg-surface/70 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-4">
            <span className="text-xs font-mono uppercase tracking-wider">Total Projects</span>
            <FolderKanban size={18} className="text-accent" />
          </div>
          <div className="text-3xl font-bold text-foreground font-mono">
            {stats.totalProjects}
          </div>
          <div className="text-xs text-muted font-mono mt-2">
            Catalogued systems in PostgreSQL
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-surface/70 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-4">
            <span className="text-xs font-mono uppercase tracking-wider">Published</span>
            <FileCheck2 size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-500 font-mono">
            {stats.publishedProjects}
          </div>
          <div className="text-xs text-muted font-mono mt-2">
            Live on public website
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-amber-500/30 bg-surface/70 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-4">
            <span className="text-xs font-mono uppercase tracking-wider">Draft Systems</span>
            <FileEdit size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500 font-mono">
            {stats.draftProjects}
          </div>
          <div className="text-xs text-muted font-mono mt-2">
            Under active stage review
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-surface/70 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-4">
            <span className="text-xs font-mono uppercase tracking-wider">Tech Catalog</span>
            <Cpu size={18} className="text-steel" />
          </div>
          <div className="text-3xl font-bold text-foreground font-mono">
            {stats.totalTechnologies}
          </div>
          <div className="text-xs text-muted font-mono mt-2">
            Verified stack technologies
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/projects"
          className="group p-6 rounded-2xl border border-border bg-surface/60 hover:border-accent/40 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-2">
              <span>Manage Portfolio Projects</span>
              <ArrowRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs text-muted font-mono">
              Edit bilingual copy, verify technological stacks, and manage publication states.
            </p>
          </div>
        </Link>

        <Link
          href="/work-preview"
          className="group p-6 rounded-2xl border border-border bg-surface/60 hover:border-steel/50 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground group-hover:text-steel transition-colors flex items-center gap-2">
              <span>Internal Case Study Previews</span>
              <ArrowRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs text-muted font-mono">
              Directly preview how all 4 canonical draft systems render before publishing.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity / Audit Log Table */}
      <div className="rounded-2xl border border-border bg-surface/70 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-accent" />
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
              Recent Administrative Audit Trail
            </h3>
          </div>
          <span className="text-xs font-mono text-muted">
            Immutable Activity Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-background/60 text-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Administrator</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Entity</th>
                <th className="py-3 px-6">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stats.recentAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-3 px-6 text-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-foreground font-semibold whitespace-nowrap">
                    {log.user ? `${log.user.name} (${log.user.role})` : "System / CLI"}
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-muted whitespace-nowrap">
                    {log.entityType} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                  </td>
                  <td className="py-3 px-6 text-muted/80 max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : "—"}
                  </td>
                </tr>
              ))}

              {stats.recentAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No administrative audit activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
