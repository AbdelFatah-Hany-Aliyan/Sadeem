import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getAvailableTechnologies } from "@/lib/services/adminProjectService";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { ArrowLeft, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNewProjectPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const technologies = await getAvailableTechnologies();

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Back to Projects List
        </Link>
        <div className="flex items-center gap-2">
          <PlusCircle size={20} className="text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Create New Portfolio Project
          </h1>
        </div>
        <p className="text-xs text-muted font-mono mt-1">
          Add a new engineering system or venture to Sadeem&apos;s catalog (created as DRAFT).
        </p>
      </div>

      {/* Form Component */}
      <ProjectForm availableTechnologies={technologies} isEditMode={false} />
    </div>
  );
}
