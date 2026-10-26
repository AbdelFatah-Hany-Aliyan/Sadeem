import prisma from "@/lib/prisma";
import { 
  Project as DbProject, 
  ProjectTranslation, 
  Technology, 
  ProjectTechnology,
  DevelopmentStatus,
  OwnershipType,
  PartnershipStatus,
  PublicationStatus
} from "@prisma/client";
import { ProjectDTO, ProjectMetric, ProjectPartnershipNote, ProjectStatus } from "@/lib/types/portfolio";

// Architectural descriptors for the canonical projects (non-statistical, factual)
const ARCHITECTURAL_METRICS: Record<string, ProjectMetric> = {
  "cucu-leaf-scan": {
    en: "Offline Computer Vision Model",
    ar: "نموذج رؤية حاسوبية يعمل دون إنترنت",
  },
  "wesal": {
    en: "Unified Institutional Mesh",
    ar: "منظومة تواصل مؤسسية موحدة",
  },
  "tabadul": {
    en: "Multi-Merchant Exchange Protocol",
    ar: "بروتوكول تبادل تجاري متعدد الأطراف",
  },
  "lama-school": {
    en: "4 Dedicated Stakeholder Portals",
    ar: "4 بوابات مخصصة لأطراف العملية التعليمية",
  },
};

// Partnership notes for collaborative/under-discussion projects
const PARTNERSHIP_NOTES: Record<string, ProjectPartnershipNote> = {
  "tabadul": {
    en: "Note: Collaborative ecosystem initiative. Strategic partnership terms are currently in active discussion.",
    ar: "ملاحظة: مبادرة تجارية تشاركية. شروط الشراكة الاستراتيجية قيد المناقشة والمفاضلة حالياً.",
  },
};

type DbProjectWithRelations = DbProject & {
  translations: ProjectTranslation[];
  technologies: (ProjectTechnology & {
    technology: Technology;
  })[];
};

/**
 * Maps database development status to public DTO status and color.
 */
function mapDevelopmentStatus(status: DevelopmentStatus): {
  status: ProjectStatus;
  arabicStatus: string;
  statusColor: string;
} {
  switch (status) {
    case DevelopmentStatus.MVP:
      return {
        status: "MVP",
        arabicStatus: "نسخة أولية MVP",
        statusColor: "#6C8B80", // Muted Sage
      };
    case DevelopmentStatus.BUILDING:
      return {
        status: "BUILDING",
        arabicStatus: "قيد البناء",
        statusColor: "#C28E62", // Brand Copper
      };
    case DevelopmentStatus.LIVE:
      return {
        status: "LIVE",
        arabicStatus: "مباشر",
        statusColor: "#6C8B80",
      };
    case DevelopmentStatus.CONCEPT:
    case DevelopmentStatus.MAINTENANCE:
    default:
      return {
        status: "CONCEPT",
        arabicStatus: "فكرة تصورية",
        statusColor: "#527C91",
      };
  }
}

/**
 * Maps database ownership type to localized strings.
 */
function mapOwnershipType(ownership: OwnershipType): {
  en: string;
  ar: string;
} {
  switch (ownership) {
    case OwnershipType.SADEEM_VENTURE:
      return {
        en: "Sadeem Ventures",
        ar: "سديم للمشاريع",
      };
    case OwnershipType.SADEEM_SYSTEM:
      return {
        en: "Sadeem Systems",
        ar: "سديم للأنظمة",
      };
    case OwnershipType.COLLABORATIVE_PARTNERSHIP:
      return {
        en: "Strategic Venture Partnership (In Discussion)",
        ar: "شراكة استراتيجية (قيد المناقشة)",
      };
    case OwnershipType.CLIENT_SYSTEM:
      return {
        en: "Client Solution",
        ar: "حلول العملاء",
      };
    default:
      return {
        en: "Sadeem Initiative",
        ar: "مبادرة سديم",
      };
  }
}

/**
 * Converts a raw database Project model with relations into a safe, client-ready ProjectDTO.
 * Decouples database internals (passwords, admin audit, raw IDs) from public UI presentation.
 */
export function mapProjectToDTO(dbProject: DbProjectWithRelations): ProjectDTO {
  const enTrans = dbProject.translations.find((t) => t.locale === "en");
  const arTrans = dbProject.translations.find((t) => t.locale === "ar");

  const { status, arabicStatus, statusColor } = mapDevelopmentStatus(dbProject.developmentStatus);
  const ownership = mapOwnershipType(dbProject.ownershipType);

  const technologies = dbProject.technologies
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((pt) => pt.technology.name);

  // Partnership note mapping
  let partnershipNote = PARTNERSHIP_NOTES[dbProject.slug];
  if (!partnershipNote && dbProject.partnershipStatus === PartnershipStatus.UNDER_DISCUSSION) {
    partnershipNote = {
      en: "Note: Collaborative initiative. Strategic partnership terms are currently in active discussion.",
      ar: "ملاحظة: مبادرة تشاركية. شروط الشراكة الاستراتيجية قيد المناقشة حالياً.",
    };
  }

  return {
    id: dbProject.slug,
    slug: dbProject.slug,
    type: dbProject.type,
    
    name: enTrans?.title || dbProject.slug,
    arabicName: arTrans?.title || enTrans?.title || dbProject.slug,
    
    tagline: enTrans?.tagline || "",
    arabicTagline: arTrans?.tagline || "",
    
    category: enTrans?.categoryName || "Technology",
    arabicCategory: arTrans?.categoryName || "تكنولوجيا",
    
    shortDescription: enTrans?.shortDescription || "",
    arabicShortDescription: arTrans?.shortDescription || "",
    
    longDescription: enTrans?.fullDescription || "",
    arabicLongDescription: arTrans?.fullDescription || "",
    
    status,
    arabicStatus,
    statusColor,
    
    ownership: ownership.en,
    arabicOwnership: ownership.ar,
    
    partnershipStatus: dbProject.partnershipStatus,
    partnershipNote,
    
    year: dbProject.year ?? 2024,
    technologies,
    featured: dbProject.featured,
    displayOrder: dbProject.displayOrder,
    
    metric: ARCHITECTURAL_METRICS[dbProject.slug],
    accentColor: dbProject.accentColor || statusColor,
  };
}

/**
 * Public Query Layer: Fetch only PUBLISHED projects.
 * DRAFT records are strictly filtered out and never returned.
 * Safe for public page rendering.
 */
export async function getPublishedProjects(): Promise<ProjectDTO[]> {
  try {
    const projects = await prisma.project.findMany({
      where: {
        publicationStatus: PublicationStatus.PUBLISHED,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        translations: true,
        technologies: {
          include: { technology: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return projects.map(mapProjectToDTO);
  } catch (error) {
    console.error("Database query failed in getPublishedProjects():", error);
    // Graceful degradation: return empty array rather than crashing the page
    return [];
  }
}

/**
 * Development & Preview Query Layer: Fetch all projects regardless of publication status.
 * Intended for internal verification and /work-preview route.
 */
export async function getPreviewProjects(): Promise<ProjectDTO[]> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        translations: true,
        technologies: {
          include: { technology: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return projects.map(mapProjectToDTO);
  } catch (error) {
    console.error("Database query failed in getPreviewProjects():", error);
    return [];
  }
}

/**
 * Single project query by slug. Public: only returns if PUBLISHED.
 */
export async function getProjectBySlug(slug: string): Promise<ProjectDTO | null> {
  try {
    const project = await prisma.project.findUnique({
      where: {
        slug,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
      include: {
        translations: true,
        technologies: {
          include: { technology: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!project) return null;
    return mapProjectToDTO(project);
  } catch (error) {
    console.error(`Database query failed in getProjectBySlug(${slug}):`, error);
    return null;
  }
}

/**
 * Preview single project query by slug (returns draft as well).
 */
export async function getPreviewProjectBySlug(slug: string): Promise<ProjectDTO | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        translations: true,
        technologies: {
          include: { technology: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!project) return null;
    return mapProjectToDTO(project);
  } catch (error) {
    console.error(`Database query failed in getPreviewProjectBySlug(${slug}):`, error);
    return null;
  }
}
