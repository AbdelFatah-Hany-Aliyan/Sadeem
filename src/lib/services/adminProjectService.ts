import prisma from "@/lib/prisma";
import { 
  Project, 
  ProjectType, 
  DevelopmentStatus, 
  PublicationStatus, 
  OwnershipType, 
  PartnershipStatus,
  AdminRole 
} from "@prisma/client";
import { recordAuditLog } from "@/lib/auth/audit";

export interface ProjectFormData {
  slug: string;
  type: ProjectType;
  developmentStatus: DevelopmentStatus;
  ownershipType: OwnershipType;
  sadeemRole: string;
  partnershipStatus: PartnershipStatus;
  featured: boolean;
  displayOrder: number;
  year?: number;
  accentColor?: string;
  
  // English Translation
  enTitle: string;
  enTagline?: string;
  enCategory: string;
  enShortDescription: string;
  enFullDescription: string;
  enProblem?: string;
  enSolution?: string;
  enRoleDescription?: string;
  
  // Arabic Translation
  arTitle: string;
  arTagline?: string;
  arCategory: string;
  arShortDescription: string;
  arFullDescription: string;
  arProblem?: string;
  arSolution?: string;
  arRoleDescription?: string;

  // Selected technology slugs
  technologySlugs: string[];
}

export interface PublicationValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates strict publication requirements before setting a project to PUBLISHED.
 */
export function validatePublicationRules(project: Project & {
  translations: { locale: string; title: string; shortDescription: string; fullDescription: string }[];
  technologies: unknown[];
}): PublicationValidationResult {
  const errors: string[] = [];

  if (!project.slug || project.slug.trim().length === 0) {
    errors.push("Project must have a valid URL slug.");
  }

  const enTrans = project.translations.find((t) => t.locale === "en");
  const arTrans = project.translations.find((t) => t.locale === "ar");

  if (!enTrans || !enTrans.title.trim()) {
    errors.push("Missing required English title.");
  }
  if (!enTrans || !enTrans.shortDescription.trim()) {
    errors.push("Missing required English short description.");
  }
  if (!enTrans || !enTrans.fullDescription.trim()) {
    errors.push("Missing required English full description.");
  }

  if (!arTrans || !arTrans.title.trim()) {
    errors.push("Missing required Arabic title.");
  }
  if (!arTrans || !arTrans.shortDescription.trim()) {
    errors.push("Missing required Arabic short description.");
  }
  if (!arTrans || !arTrans.fullDescription.trim()) {
    errors.push("Missing required Arabic full description.");
  }

  if (!project.technologies || project.technologies.length === 0) {
    errors.push("Project must have at least one verified technology associated.");
  }

  // Tabadul factual validation
  if (project.slug === "tabadul") {
    if (project.partnershipStatus !== PartnershipStatus.UNDER_DISCUSSION) {
      errors.push("Tabadul partnershipStatus must remain UNDER_DISCUSSION until formal partnership agreement is verified.");
    }
    if (project.ownershipType === OwnershipType.SADEEM_VENTURE) {
      errors.push("Tabadul cannot be claimed as a 100% Sadeem Venture; it is an independent collaborative initiative.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fetches projects for the administrative dashboard with search and filtering.
 */
export async function getAdminProjects(filters?: {
  search?: string;
  publicationStatus?: PublicationStatus;
  developmentStatus?: DevelopmentStatus;
  type?: ProjectType;
}) {
  const where: any = {};

  if (filters?.publicationStatus) {
    where.publicationStatus = filters.publicationStatus;
  }
  if (filters?.developmentStatus) {
    where.developmentStatus = filters.developmentStatus;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { translations: { some: { title: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return prisma.project.findMany({
    where,
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
      features: true,
    },
  });
}

/**
 * Fetches a single project by ID or Slug with all relations for administrative editing.
 */
export async function getAdminProjectById(idOrSlug: string) {
  return prisma.project.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
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
}

/**
 * Fetches all available technologies catalog for selection in project forms.
 */
export async function getAvailableTechnologies() {
  return prisma.technology.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Creates a new project in a database transaction with audit logging.
 */
export async function createAdminProject(
  data: ProjectFormData,
  actor: { userId: string; role: AdminRole }
) {
  if (actor.role !== AdminRole.SUPER_ADMIN && actor.role !== AdminRole.EDITOR) {
    throw new Error("FORBIDDEN: Insufficient permissions to create projects.");
  }

  // Validate slug uniqueness
  const existingSlug = await prisma.project.findUnique({
    where: { slug: data.slug.toLowerCase().trim() },
  });
  if (existingSlug) {
    throw new Error(`Project slug '${data.slug}' is already in use.`);
  }

  const cleanSlug = data.slug.toLowerCase().trim();

  const createdProject = await prisma.$transaction(async (tx) => {
    // 1. Create Project
    const proj = await tx.project.create({
      data: {
        slug: cleanSlug,
        type: data.type,
        developmentStatus: data.developmentStatus,
        publicationStatus: PublicationStatus.DRAFT, // Always created as DRAFT
        ownershipType: data.ownershipType,
        sadeemRole: data.sadeemRole,
        partnershipStatus: data.partnershipStatus,
        featured: data.featured,
        displayOrder: data.displayOrder,
        year: data.year || 2024,
        accentColor: data.accentColor,
      },
    });

    // 2. Create English Translation
    await tx.projectTranslation.create({
      data: {
        projectId: proj.id,
        locale: "en",
        title: data.enTitle,
        tagline: data.enTagline,
        categoryName: data.enCategory,
        shortDescription: data.enShortDescription,
        fullDescription: data.enFullDescription,
        problem: data.enProblem,
        solution: data.enSolution,
        roleDescription: data.enRoleDescription,
      },
    });

    // 3. Create Arabic Translation
    await tx.projectTranslation.create({
      data: {
        projectId: proj.id,
        locale: "ar",
        title: data.arTitle,
        tagline: data.arTagline,
        categoryName: data.arCategory,
        shortDescription: data.arShortDescription,
        fullDescription: data.arFullDescription,
        problem: data.arProblem,
        solution: data.arSolution,
        roleDescription: data.arRoleDescription,
      },
    });

    // 4. Attach Technologies
    if (data.technologySlugs && data.technologySlugs.length > 0) {
      const techs = await tx.technology.findMany({
        where: { slug: { in: data.technologySlugs } },
      });

      for (let i = 0; i < techs.length; i++) {
        await tx.projectTechnology.create({
          data: {
            projectId: proj.id,
            technologyId: techs[i].id,
            isCore: i === 0,
            displayOrder: i,
          },
        });
      }
    }

    return proj;
  });

  // Record Audit Log
  await recordAuditLog({
    userId: actor.userId,
    action: "PROJECT_CREATE",
    entityType: "Project",
    entityId: createdProject.id,
    details: {
      slug: createdProject.slug,
      type: createdProject.type,
      developmentStatus: createdProject.developmentStatus,
    },
  });

  return createdProject;
}

/**
 * Updates an existing project in a database transaction with audit logging.
 */
export async function updateAdminProject(
  id: string,
  data: ProjectFormData,
  actor: { userId: string; role: AdminRole }
) {
  if (actor.role !== AdminRole.SUPER_ADMIN && actor.role !== AdminRole.EDITOR) {
    throw new Error("FORBIDDEN: Insufficient permissions to edit projects.");
  }

  const existing = await prisma.project.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Project not found.");
  }

  const cleanSlug = data.slug.toLowerCase().trim();

  // If slug changed, verify uniqueness
  if (cleanSlug !== existing.slug) {
    const slugCheck = await prisma.project.findUnique({
      where: { slug: cleanSlug },
    });
    if (slugCheck && slugCheck.id !== id) {
      throw new Error(`Project slug '${cleanSlug}' is already in use by another project.`);
    }
  }

  const updatedProject = await prisma.$transaction(async (tx) => {
    // 1. Update project core attributes
    const proj = await tx.project.update({
      where: { id },
      data: {
        slug: cleanSlug,
        type: data.type,
        developmentStatus: data.developmentStatus,
        ownershipType: data.ownershipType,
        sadeemRole: data.sadeemRole,
        partnershipStatus: data.partnershipStatus,
        featured: data.featured,
        displayOrder: data.displayOrder,
        year: data.year,
        accentColor: data.accentColor,
      },
    });

    // 2. Upsert English Translation
    await tx.projectTranslation.upsert({
      where: { projectId_locale: { projectId: id, locale: "en" } },
      update: {
        title: data.enTitle,
        tagline: data.enTagline,
        categoryName: data.enCategory,
        shortDescription: data.enShortDescription,
        fullDescription: data.enFullDescription,
        problem: data.enProblem,
        solution: data.enSolution,
        roleDescription: data.enRoleDescription,
      },
      create: {
        projectId: id,
        locale: "en",
        title: data.enTitle,
        tagline: data.enTagline,
        categoryName: data.enCategory,
        shortDescription: data.enShortDescription,
        fullDescription: data.enFullDescription,
        problem: data.enProblem,
        solution: data.enSolution,
        roleDescription: data.enRoleDescription,
      },
    });

    // 3. Upsert Arabic Translation
    await tx.projectTranslation.upsert({
      where: { projectId_locale: { projectId: id, locale: "ar" } },
      update: {
        title: data.arTitle,
        tagline: data.arTagline,
        categoryName: data.arCategory,
        shortDescription: data.arShortDescription,
        fullDescription: data.arFullDescription,
        problem: data.arProblem,
        solution: data.arSolution,
        roleDescription: data.arRoleDescription,
      },
      create: {
        projectId: id,
        locale: "ar",
        title: data.arTitle,
        tagline: data.arTagline,
        categoryName: data.arCategory,
        shortDescription: data.arShortDescription,
        fullDescription: data.arFullDescription,
        problem: data.arProblem,
        solution: data.arSolution,
        roleDescription: data.arRoleDescription,
      },
    });

    // 4. Synchronize Technologies
    await tx.projectTechnology.deleteMany({ where: { projectId: id } });
    if (data.technologySlugs && data.technologySlugs.length > 0) {
      const techs = await tx.technology.findMany({
        where: { slug: { in: data.technologySlugs } },
      });

      for (let i = 0; i < techs.length; i++) {
        await tx.projectTechnology.create({
          data: {
            projectId: id,
            technologyId: techs[i].id,
            isCore: i === 0,
            displayOrder: i,
          },
        });
      }
    }

    return proj;
  });

  // Record Audit Log
  await recordAuditLog({
    userId: actor.userId,
    action: "PROJECT_UPDATE",
    entityType: "Project",
    entityId: updatedProject.id,
    details: {
      slug: updatedProject.slug,
      developmentStatus: updatedProject.developmentStatus,
    },
  });

  return updatedProject;
}

/**
 * Toggles a project's publication status with role enforcement and publication validation.
 * ONLY SUPER_ADMIN is permitted to publish/unpublish.
 */
export async function toggleProjectPublication(
  id: string,
  newStatus: PublicationStatus,
  actor: { userId: string; role: AdminRole }
): Promise<{ success: boolean; errors?: string[] }> {
  // STRICT AUTHORIZATION CHECK
  if (actor.role !== AdminRole.SUPER_ADMIN) {
    return {
      success: false,
      errors: ["FORBIDDEN: Only SUPER_ADMIN accounts are authorized to publish or unpublish projects."],
    };
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      translations: true,
      technologies: true,
    },
  });

  if (!project) {
    return { success: false, errors: ["Project not found."] };
  }

  // If attempting to PUBLISH, enforce publication validation rules
  if (newStatus === PublicationStatus.PUBLISHED) {
    const validation = validatePublicationRules(project as any);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      publicationStatus: newStatus,
      publishedAt: newStatus === PublicationStatus.PUBLISHED ? new Date() : project.publishedAt,
    },
  });

  // Record Audit Log
  await recordAuditLog({
    userId: actor.userId,
    action: newStatus === PublicationStatus.PUBLISHED ? "PROJECT_PUBLISH" : "PROJECT_UNPUBLISH",
    entityType: "Project",
    entityId: updated.id,
    details: {
      slug: updated.slug,
      previousStatus: project.publicationStatus,
      newStatus: updated.publicationStatus,
    },
  });

  return { success: true };
}

/**
 * Archives a project. ONLY SUPER_ADMIN is authorized.
 */
export async function archiveAdminProject(
  id: string,
  actor: { userId: string; role: AdminRole }
): Promise<{ success: boolean; errors?: string[] }> {
  if (actor.role !== AdminRole.SUPER_ADMIN) {
    return {
      success: false,
      errors: ["FORBIDDEN: Only SUPER_ADMIN accounts are authorized to archive projects."],
    };
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { publicationStatus: PublicationStatus.ARCHIVED },
  });

  await recordAuditLog({
    userId: actor.userId,
    action: "PROJECT_ARCHIVE",
    entityType: "Project",
    entityId: updated.id,
    details: { slug: updated.slug },
  });

  return { success: true };
}

/**
 * Retrieves real administrative stats (No invented analytics, real DB counts only).
 */
export async function getAdminDashboardStats() {
  const [
    totalProjects,
    draftProjects,
    publishedProjects,
    archivedProjects,
    totalTechnologies,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { publicationStatus: PublicationStatus.DRAFT } }),
    prisma.project.count({ where: { publicationStatus: PublicationStatus.PUBLISHED } }),
    prisma.project.count({ where: { publicationStatus: PublicationStatus.ARCHIVED } }),
    prisma.technology.count(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    }),
  ]);

  return {
    totalProjects,
    draftProjects,
    publishedProjects,
    archivedProjects,
    totalTechnologies,
    recentAuditLogs,
  };
}
