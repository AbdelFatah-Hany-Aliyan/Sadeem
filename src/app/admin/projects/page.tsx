import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getAdminProjects } from "@/lib/services/adminProjectService";
import { ProjectTable } from "@/components/admin/ProjectTable";
import { PlusCircle, FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const projects = await getAdminProjects();

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <span>Portfolio Management</span>
            <span>•</span>
            <span className="text-accent">{projects.length} Total Systems</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Projects Catalog
          </h1>
        </div>

        <Link
          href="/admin/projects/new"
          className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle size={15} />
          <span>New Project</span>
        </Link>
      </div>

      {/* Projects Table with Search & Filtering */}
      <ProjectTable initialProjects={projects as any} userRole={session.role} />
    </div>
  );
}
