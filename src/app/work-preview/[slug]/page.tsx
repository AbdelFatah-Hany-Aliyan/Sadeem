import { notFound } from "next/navigation";
import { getPreviewProjectDetailBySlug } from "@/lib/services/projectService";
import CaseStudyView from "@/components/work/CaseStudyView";

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export default async function PreviewProjectDetailPage({ params }: PageProps) {
  // CRITICAL PRODUCTION GUARD:
  // Strictly prevent draft preview routes from leaking in production deployments
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DRAFT_PREVIEW !== "true") {
    notFound();
  }

  const project = await getPreviewProjectDetailBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <CaseStudyView project={project} isPreview={true} />;
}
