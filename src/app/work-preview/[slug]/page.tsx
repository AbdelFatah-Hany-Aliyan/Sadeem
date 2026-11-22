import { notFound } from "next/navigation";
import { getPreviewProjectDetailBySlug } from "@/lib/services/projectService";
import { getSession } from "@/lib/auth/session";
import CaseStudyView from "@/components/work/CaseStudyView";

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export default async function PreviewProjectDetailPage({ params }: PageProps) {
  // CRITICAL SECURITY GUARD:
  // Unpublished draft previews STRICTLY require an active, authenticated administrator session.
  // Anonymous visitors and unprivileged accounts receive a 404 response.
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "EDITOR")) {
    notFound();
  }

  const project = await getPreviewProjectDetailBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <CaseStudyView project={project} isPreview={true} />;
}
