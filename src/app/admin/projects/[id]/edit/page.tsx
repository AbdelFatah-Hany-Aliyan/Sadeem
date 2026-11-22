import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getAdminProjectById, getAvailableTechnologies } from "@/lib/services/adminProjectService";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { ArrowLeft, Edit3, ExternalLink } from "lucide-react";

interface EditPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AdminEditProjectPage({ params }: EditPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [project, technologies] = await Promise.all([
    getAdminProjectById(params.id),
    getAvailableTechnologies(),
  ]);

  if (!project) {
    notFound();
  }

  const enTrans = project.translations.find((t) => t.locale === "en");

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Projects List
          </Link>
          <div className="flex items-center gap-2">
            <Edit3 size={20} className="text-accent" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Edit Project: {enTrans?.title || project.slug}
            </h1>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            System ID: {project.id} • Slug: {project.slug} • Status: {project.publicationStatus}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/work-preview/${project.slug}`}
            target="_blank"
            className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-mono text-muted hover:text-foreground hover:border-accent transition-colors flex items-center gap-2"
          >
            <span>Preview Draft</span>
            <ExternalLink size={13} />
          </Link>

          {project.publicationStatus === "PUBLISHED" && (
            <Link
              href={`/work/${project.slug}`}
              target="_blank"
              className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
            >
              <span>View Public</span>
              <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Form Component */}
      <ProjectForm
        initialData={project}
        availableTechnologies={technologies}
        isEditMode={true}
      />
    </div>
  );
}
