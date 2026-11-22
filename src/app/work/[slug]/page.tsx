import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProjectDetailBySlug } from "@/lib/services/projectService";
import CaseStudyView from "@/components/work/CaseStudyView";

interface PageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60; // Incremental Static Regeneration

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProjectDetailBySlug(params.slug);
  
  if (!project) {
    return {
      title: "Project Not Found | Sadeem — سديم",
      description: "The requested project case study could not be found or has not been published yet.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${project.name} — Case Study | Sadeem`,
    description: project.shortDescription || project.tagline,
    openGraph: {
      title: `${project.name} | Sadeem Studio`,
      description: project.shortDescription || project.tagline,
      type: "article",
    },
    alternates: {
      canonical: `/work/${project.slug}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  // STRICT PUBLICATION SAFETY:
  // getProjectDetailBySlug ONLY returns projects where publicationStatus === 'PUBLISHED'.
  // All DRAFT and ARCHIVED projects return null, triggering notFound().
  const project = await getProjectDetailBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <CaseStudyView project={project} isPreview={false} />;
}
