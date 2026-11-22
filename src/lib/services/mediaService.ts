/**
 * SADEEM STUDIO — MEDIA MANAGEMENT SERVICE
 * 
 * Provides database operations for project media and media library assets.
 * Enforces:
 * 1. Safe association/disassociation: removing media from a project does NOT delete the shared file.
 * 2. Bilingual metadata: all media items maintain localized alternative text and optional captions.
 * 3. Cover management: designated cover image per project with ordering for gallery screenshots.
 * 4. Authorization: Super admin required for permanent deletion.
 * 5. Factual integrity: sample/baseline media is explicitly labeled, never fake mockups.
 */

import prisma from "@/lib/prisma";
import { AdminRole, MediaType, Prisma } from "@prisma/client";
import { CurrentUserSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/auth/audit";
import { deleteFileFromStorage } from "@/lib/storage/storageProvider";

export interface MediaLibraryItemSummary {
  id: string;
  projectId: string | null;
  projectSlug?: string;
  projectName?: string;
  mediaType: MediaType;
  storageKey: string;
  publicUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  displayOrder: number;
  isCover: boolean;
  createdAt: Date;
  altTextEn: string;
  altTextAr: string;
  captionEn?: string;
  captionAr?: string;
}

export interface MediaCreateInput {
  projectId?: string;
  mediaType?: MediaType;
  storageKey: string;
  publicUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  isCover?: boolean;
  displayOrder?: number;
  altTextEn: string;
  altTextAr: string;
  captionEn?: string;
  captionAr?: string;
}

/**
 * Retrieves media assets with project association and localized metadata.
 */
export async function getMediaLibrary(filter?: {
  projectId?: string;
  mediaType?: MediaType;
  unassignedOnly?: boolean;
}): Promise<MediaLibraryItemSummary[]> {
  const where: Prisma.ProjectMediaWhereInput = {};

  if (filter?.projectId) {
    where.projectId = filter.projectId;
  }
  if (filter?.mediaType) {
    where.mediaType = filter.mediaType;
  }
  if (filter?.unassignedOnly) {
    where.projectId = null;
  }

  const items = await prisma.projectMedia.findMany({
    where,
    orderBy: [
      { projectId: "asc" },
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      project: {
        select: {
          id: true,
          slug: true,
          translations: {
            where: { locale: "en" },
            select: { title: true },
          },
        },
      },
      translations: true,
    },
  });

  return items.map((item) => {
    const enTrans = item.translations.find((t) => t.locale === "en");
    const arTrans = item.translations.find((t) => t.locale === "ar");

    return {
      id: item.id,
      projectId: item.projectId,
      projectSlug: item.project?.slug,
      projectName: item.project?.translations[0]?.title || item.project?.slug,
      mediaType: item.mediaType,
      storageKey: item.storageKey,
      publicUrl: item.publicUrl,
      originalFilename: item.originalFilename,
      mimeType: item.mimeType,
      width: item.width,
      height: item.height,
      sizeBytes: item.sizeBytes ? Number(item.sizeBytes) : null,
      displayOrder: item.displayOrder,
      isCover: item.isCover,
      createdAt: item.createdAt,
      altTextEn: enTrans?.altText || item.originalFilename || "Project visual",
      altTextAr: arTrans?.altText || "عنصر بصري للمشروع",
      captionEn: enTrans?.caption || undefined,
      captionAr: arTrans?.caption || undefined,
    };
  });
}

/**
 * Creates a new media record and its bilingual translations.
 */
export async function createMediaRecord(
  data: MediaCreateInput,
  session: CurrentUserSession
): Promise<{ success: boolean; mediaId?: string; errors?: string[] }> {
  try {
    if (!data.storageKey) {
      return { success: false, errors: ["Storage key is required."] };
    }
    if (!data.altTextEn?.trim()) {
      return { success: false, errors: ["English alternative text is required for accessibility."] };
    }
    if (!data.altTextAr?.trim()) {
      return { success: false, errors: ["Arabic alternative text is required for accessibility."] };
    }

    // If this image is marked as cover, unmark existing covers for this project
    if (data.isCover && data.projectId) {
      await prisma.projectMedia.updateMany({
        where: { projectId: data.projectId, isCover: true },
        data: { isCover: false },
      });
    }

    const media = await prisma.projectMedia.create({
      data: {
        projectId: data.projectId || null,
        mediaType: data.mediaType || MediaType.SCREENSHOT,
        storageKey: data.storageKey,
        publicUrl: data.publicUrl || null,
        originalFilename: data.originalFilename || null,
        mimeType: data.mimeType || null,
        width: data.width || null,
        height: data.height || null,
        sizeBytes: data.sizeBytes ? BigInt(data.sizeBytes) : null,
        displayOrder: data.displayOrder ?? 0,
        isCover: Boolean(data.isCover),
        uploadedBy: session.userId,
        translations: {
          create: [
            {
              locale: "en",
              altText: data.altTextEn.trim(),
              caption: data.captionEn?.trim() || null,
            },
            {
              locale: "ar",
              altText: data.altTextAr.trim(),
              caption: data.captionAr?.trim() || null,
            },
          ],
        },
      },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "MEDIA_CREATED",
      entityType: "ProjectMedia",
      entityId: media.id,
      details: {
        storageKey: media.storageKey,
        projectId: media.projectId,
        isCover: media.isCover,
      },
    });

    return { success: true, mediaId: media.id };
  } catch (error: any) {
    console.error("createMediaRecord error:", error);
    return { success: false, errors: [error.message || "Failed to create media record."] };
  }
}

/**
 * Associates an existing media asset with a project without duplicating files.
 */
export async function associateMediaWithProject(
  mediaId: string,
  projectId: string,
  options?: { isCover?: boolean; displayOrder?: number }
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    if (options?.isCover) {
      await prisma.projectMedia.updateMany({
        where: { projectId, isCover: true },
        data: { isCover: false },
      });
    }

    await prisma.projectMedia.update({
      where: { id: mediaId },
      data: {
        projectId,
        isCover: options?.isCover ?? false,
        displayOrder: options?.displayOrder ?? 0,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to associate media."] };
  }
}

/**
 * Removes project association without deleting the asset file from the Media Library.
 */
export async function disassociateMediaFromProject(
  mediaId: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    await prisma.projectMedia.update({
      where: { id: mediaId },
      data: {
        projectId: null,
        isCover: false,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to disassociate media."] };
  }
}

/**
 * Updates bilingual alternative text and captions for a media asset.
 */
export async function updateMediaTranslations(
  mediaId: string,
  data: { altTextEn: string; altTextAr: string; captionEn?: string; captionAr?: string },
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    if (!data.altTextEn?.trim() || !data.altTextAr?.trim()) {
      return { success: false, errors: ["Both English and Arabic alt text are required."] };
    }

    await prisma.projectMediaTranslation.upsert({
      where: { mediaId_locale: { mediaId, locale: "en" } },
      update: { altText: data.altTextEn.trim(), caption: data.captionEn?.trim() || null },
      create: { mediaId, locale: "en", altText: data.altTextEn.trim(), caption: data.captionEn?.trim() || null },
    });

    await prisma.projectMediaTranslation.upsert({
      where: { mediaId_locale: { mediaId, locale: "ar" } },
      update: { altText: data.altTextAr.trim(), caption: data.captionAr?.trim() || null },
      create: { mediaId, locale: "ar", altText: data.altTextAr.trim(), caption: data.captionAr?.trim() || null },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "MEDIA_METADATA_UPDATED",
      entityType: "ProjectMedia",
      entityId: mediaId,
      details: { mediaId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to update media translations."] };
  }
}

/**
 * Updates the display order of gallery media items for a project.
 */
export async function reorderProjectMedia(
  projectId: string,
  orderedMediaIds: string[]
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    await prisma.$transaction(
      orderedMediaIds.map((id, index) =>
        prisma.projectMedia.updateMany({
          where: { id, projectId },
          data: { displayOrder: index },
        })
      )
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to reorder media."] };
  }
}

/**
 * Permanently deletes a media asset and its remote file.
 * Requires: SUPER_ADMIN role.
 */
export async function deleteMediaAsset(
  mediaId: string,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  if (session.role !== AdminRole.SUPER_ADMIN) {
    return { success: false, errors: ["FORBIDDEN: Only SUPER_ADMIN is authorized to delete media assets."] };
  }

  try {
    const item = await prisma.projectMedia.findUnique({
      where: { id: mediaId },
    });

    if (!item) {
      return { success: false, errors: ["Media asset not found."] };
    }

    // Attempt remote file deletion if storage is configured
    await deleteFileFromStorage(item.storageKey);

    // Delete database record (cascade deletes translations)
    await prisma.projectMedia.delete({
      where: { id: mediaId },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "MEDIA_DELETED",
      entityType: "ProjectMedia",
      entityId: mediaId,
      details: { storageKey: item.storageKey, originalFilename: item.originalFilename },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to delete media asset."] };
  }
}

/**
 * Seeds baseline verified media records for the 4 canonical projects.
 * Uses genuine architectural SVG diagrams and system visuals with bilingual alt text.
 */
export async function seedBaselineProjectMedia(): Promise<void> {
  const projects = await prisma.project.findMany({
    select: { id: true, slug: true },
  });

  const baselineMediaItems = [
    {
      slug: "cucu-leaf-scan",
      storageKey: "media/projects/cucu-leaf-scan/architecture-diagram.svg",
      publicUrl: null,
      originalFilename: "cucu-leaf-scan-edge-ai-architecture.svg",
      mimeType: "image/svg+xml",
      mediaType: MediaType.DIAGRAM,
      isCover: true,
      displayOrder: 0,
      altTextEn: "Cucu Leaf Scan Edge Computer Vision Architecture Diagram",
      altTextAr: "مخطط المعمارية التقنية لنموذج الرؤية الحاسوبية على الهاتف لتطبيق كوكو ليف سكان",
      captionEn: "Offline MobileNetV2 pathology classification pipeline and tensor inference flow.",
      captionAr: "مسار تصنيف أمراض الأوراق عبر نموذج MobileNetV2 محلياً دون الحاجة للاتصال بالإنترنت.",
    },
    {
      slug: "wesal",
      storageKey: "media/projects/wesal/system-mesh.svg",
      publicUrl: null,
      originalFilename: "wesal-unified-mesh-architecture.svg",
      mimeType: "image/svg+xml",
      mediaType: MediaType.DIAGRAM,
      isCover: true,
      displayOrder: 0,
      altTextEn: "Wesal Unified Institutional Operations Mesh Architecture",
      altTextAr: "مخطط معمارية شبكة العمليات المؤسسية الموحدة لنظام وصال",
      captionEn: "Decoupled domain messaging and asynchronous multi-tenant data sync protocol.",
      captionAr: "بروتوكول مزامنة البيانات بين النطاقات المختلفة مع بنية تحتية متعددة المستأجرين.",
    },
    {
      slug: "tabadul",
      storageKey: "media/projects/tabadul/exchange-protocol.svg",
      publicUrl: null,
      originalFilename: "tabadul-multi-merchant-protocol.svg",
      mimeType: "image/svg+xml",
      mediaType: MediaType.DIAGRAM,
      isCover: true,
      displayOrder: 0,
      altTextEn: "Tabadul Multi-Merchant Commerce Exchange Topology",
      altTextAr: "طوبولوجيا بروتوكول التبادل التجاري متعدد المتاجر لمنصة تبادل",
      captionEn: "Collaborative ledger and inventory synchronization model.",
      captionAr: "نموذج سجل التبادل ومزامنة المخزون بين المتاجر المشتركة.",
    },
    {
      slug: "lama-school",
      storageKey: "media/projects/lama-school/portal-matrix.svg",
      publicUrl: null,
      originalFilename: "lama-school-portals-matrix.svg",
      mimeType: "image/svg+xml",
      mediaType: MediaType.DIAGRAM,
      isCover: true,
      displayOrder: 0,
      altTextEn: "Lama School 4-Stakeholder Portal Architecture",
      altTextAr: "معمارية بوابات أصحاب المصلحة الأربعة لنظام مدرسة لمى",
      captionEn: "Integrated portals for Administration, Teachers, Students, and Parents.",
      captionAr: "بوابات متكاملة للإدارة المدرسية، المعلمين، الطلاب، وأولياء الأمور.",
    },
  ];

  for (const item of baselineMediaItems) {
    const project = projects.find((p) => p.slug === item.slug);
    if (!project) continue;

    const existing = await prisma.projectMedia.findFirst({
      where: { projectId: project.id, storageKey: item.storageKey },
    });

    if (!existing) {
      await prisma.projectMedia.create({
        data: {
          projectId: project.id,
          storageKey: item.storageKey,
          publicUrl: item.publicUrl,
          originalFilename: item.originalFilename,
          mimeType: item.mimeType,
          mediaType: item.mediaType,
          isCover: item.isCover,
          displayOrder: item.displayOrder,
          translations: {
            create: [
              {
                locale: "en",
                altText: item.altTextEn,
                caption: item.captionEn,
              },
              {
                locale: "ar",
                altText: item.altTextAr,
                caption: item.captionAr,
              },
            ],
          },
        },
      });
    }
  }
}
