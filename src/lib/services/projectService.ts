import prisma from "@/lib/prisma";
import { 
  Project as DbProject, 
  ProjectTranslation, 
  Technology, 
  ProjectTechnology,
  ProjectFeature,
  ProjectFeatureTranslation,
  ProjectMedia,
  ProjectMediaTranslation,
  DevelopmentStatus,
  OwnershipType,
  PartnershipStatus,
  PublicationStatus
} from "@prisma/client";
import { 
  ProjectDTO, 
  ProjectDetailDTO, 
  ProjectFeatureDTO, 
  ProjectTechDTO, 
  ProjectMediaDTO, 
  RelatedProjectDTO,
  ProjectMetric, 
  ProjectPartnershipNote, 
  ProjectStatus 
} from "@/lib/types/portfolio";

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

type DbProjectWithAllRelations = DbProjectWithRelations & {
  features: (ProjectFeature & {
    translations: ProjectFeatureTranslation[];
  })[];
  media: (ProjectMedia & {
    translations: ProjectMediaTranslation[];
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
 * Decouples database internals from public UI presentation.
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
 * Maps a database project with all deep relations into a complete ProjectDetailDTO.
 */
export function mapProjectToDetailDTO(
  dbProject: DbProjectWithAllRelations,
  relatedProjects: RelatedProjectDTO[] = []
): ProjectDetailDTO {
  const baseDTO = mapProjectToDTO(dbProject);
  const enTrans = dbProject.translations.find((t) => t.locale === "en");
  const arTrans = dbProject.translations.find((t) => t.locale === "ar");

  // Optional Problem Statement (only if verified)
  let problem: { en: string; ar: string } | undefined;
  if (enTrans?.problem && arTrans?.problem) {
    problem = {
      en: enTrans.problem,
      ar: arTrans.problem,
    };
  }

  // Optional Solution Statement (only if verified)
  let solution: { en: string; ar: string } | undefined;
  if (enTrans?.solution && arTrans?.solution) {
    solution = {
      en: enTrans.solution,
      ar: arTrans.solution,
    };
  }

  // Optional Role Description (only if verified)
  let roleDescription: { en: string; ar: string } | undefined;
  if (enTrans?.roleDescription && arTrans?.roleDescription) {
    roleDescription = {
      en: enTrans.roleDescription,
      ar: arTrans.roleDescription,
    };
  }

  // Features mapping
  const features: ProjectFeatureDTO[] = dbProject.features
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((f) => {
      const enF = f.translations.find((t) => t.locale === "en");
      const arF = f.translations.find((t) => t.locale === "ar");
      return {
        id: f.id,
        title: {
          en: enF?.title || "Feature",
          ar: arF?.title || enF?.title || "خاصية",
        },
        description: enF?.description && arF?.description ? {
          en: enF.description,
          ar: arF.description,
        } : undefined,
      };
    });

  // Technologies Detailed
  const technologiesDetailed: ProjectTechDTO[] = dbProject.technologies
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((pt) => ({
      name: pt.technology.name,
      category: pt.technology.category,
      isCore: pt.isCore,
    }));

  // Media mapping
  const media: ProjectMediaDTO[] = dbProject.media
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((m) => {
      const enM = m.translations.find((t) => t.locale === "en");
      const arM = m.translations.find((t) => t.locale === "ar");
      return {
        id: m.id,
        storageKey: m.storageKey,
        mediaType: m.mediaType,
        altText: {
          en: enM?.altText || baseDTO.name,
          ar: arM?.altText || baseDTO.arabicName,
        },
        caption: enM?.caption && arM?.caption ? {
          en: enM.caption,
          ar: arM.caption,
        } : undefined,
      };
    });

  return {
    ...baseDTO,
    problem,
    solution,
    roleDescription,
    features,
    technologiesDetailed,
    media,
    relatedProjects,
  };
}

/**
 * Public Query Layer: Fetch only PUBLISHED projects.
 * DRAFT records are strictly filtered out and never returned.
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
    return [];
  }
}

/**
 * Development & Preview Query Layer: Fetch all projects regardless of publication status.
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
    const project = await prisma.project.findFirst({
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

/**
 * Single Project Detail Case Study query. Public: ONLY returns if PUBLISHED.
 * DRAFT, ARCHIVED, or non-existent projects return null (triggering notFound()).
 */
export async function getProjectDetailBySlug(slug: string): Promise<ProjectDetailDTO | null> {
  try {
    const project = await prisma.project.findFirst({
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
        features: {
          include: { translations: true },
          orderBy: { displayOrder: "asc" },
        },
        media: {
          include: { translations: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!project) return null;

    // Fetch related published projects
    const relatedDb = await prisma.project.findMany({
      where: {
        publicationStatus: PublicationStatus.PUBLISHED,
        slug: { not: slug },
      },
      take: 2,
      include: {
        translations: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    const relatedProjects: RelatedProjectDTO[] = relatedDb.map((rp) => {
      const en = rp.translations.find((t) => t.locale === "en");
      const ar = rp.translations.find((t) => t.locale === "ar");
      const { status, arabicStatus, statusColor } = mapDevelopmentStatus(rp.developmentStatus);
      return {
        id: rp.slug,
        slug: rp.slug,
        name: en?.title || rp.slug,
        arabicName: ar?.title || en?.title || rp.slug,
        category: en?.categoryName || "Technology",
        arabicCategory: ar?.categoryName || "تكنولوجيا",
        status,
        arabicStatus,
        statusColor,
        accentColor: rp.accentColor || statusColor,
      };
    });

    return mapProjectToDetailDTO(project, relatedProjects);
  } catch (error) {
    console.error(`Database query failed in getProjectDetailBySlug(${slug}):`, error);
    return null;
  }
}

/**
 * Preview Single Project Detail Case Study query.
 * Returns draft projects for internal audit in /work-preview/[slug].
 */
export async function getPreviewProjectDetailBySlug(slug: string): Promise<ProjectDetailDTO | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        translations: true,
        technologies: {
          include: { technology: true },
          orderBy: { displayOrder: "asc" },
        },
        features: {
          include: { translations: true },
          orderBy: { displayOrder: "asc" },
        },
        media: {
          include: { translations: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!project) return null;

    // In preview mode, load other projects for related preview verification
    const relatedDb = await prisma.project.findMany({
      where: {
        slug: { not: slug },
      },
      take: 2,
      include: {
        translations: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    const relatedProjects: RelatedProjectDTO[] = relatedDb.map((rp) => {
      const en = rp.translations.find((t) => t.locale === "en");
      const ar = rp.translations.find((t) => t.locale === "ar");
      const { status, arabicStatus, statusColor } = mapDevelopmentStatus(rp.developmentStatus);
      return {
        id: rp.slug,
        slug: rp.slug,
        name: en?.title || rp.slug,
        arabicName: ar?.title || en?.title || rp.slug,
        category: en?.categoryName || "Technology",
        arabicCategory: ar?.categoryName || "تكنولوجيا",
        status,
        arabicStatus,
        statusColor,
        accentColor: rp.accentColor || statusColor,
      };
    });

    return mapProjectToDetailDTO(project, relatedProjects);
  } catch (error) {
    console.error(`Database query failed in getPreviewProjectDetailBySlug(${slug}):`, error);
    return null;
  }
}
