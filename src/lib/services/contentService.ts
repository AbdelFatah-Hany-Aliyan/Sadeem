/**
 * SADEEM STUDIO — CONTENT MANAGEMENT SERVICE
 * 
 * Provides database-backed content retrieval and administrative editorial operations.
 * Enforces:
 * 1. Public safety: public website reads ONLY published content.
 * 2. Fallback resilience: static dictionaries (en.ts / ar.ts) provide 100% reliable fallback.
 * 3. Draft isolation: saving a draft does NOT alter published content until explicit publication.
 * 4. Authorization: Editors can save drafts; only SUPER_ADMIN can publish.
 * 5. Audit trail: all draft saves and publications are logged.
 */

import prisma from "@/lib/prisma";
import { AdminRole, PublicationStatus } from "@prisma/client";
import { en } from "@/content/en";
import { ar } from "@/content/ar";
import { Content } from "@/content";
import { CurrentUserSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/auth/audit";

export interface AdminContentSectionSummary {
  id: string;
  sectionKey: string;
  name: string;
  description?: string;
  status: PublicationStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  isDraftModified: boolean;
  hasEnTranslation: boolean;
  hasArTranslation: boolean;
  lastUpdatedBy?: string;
}

export interface AdminSectionDetail {
  id: string;
  sectionKey: string;
  name: string;
  description?: string;
  status: PublicationStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  enDraft: Record<string, unknown>;
  arDraft: Record<string, unknown>;
  enPublished: Record<string, unknown> | null;
  arPublished: Record<string, unknown> | null;
  isModified: boolean;
}

/**
 * Public Data Access:
 * Retrieves published content merged with static fallback dictionaries.
 * Zero risk of blank screens or broken layout if database is unseeded or section is in DRAFT.
 */
export async function getPublishedWebsiteContent(locale: "en" | "ar"): Promise<Content> {
  const baseline = locale === "en" ? en : ar;

  try {
    const publishedSections = await prisma.contentSection.findMany({
      where: { status: PublicationStatus.PUBLISHED },
      include: {
        translations: {
          where: { locale, status: PublicationStatus.PUBLISHED },
        },
      },
    });

    if (!publishedSections || publishedSections.length === 0) {
      return baseline;
    }

    // Deep copy baseline
    const merged: Content = JSON.parse(JSON.stringify(baseline));

    for (const sec of publishedSections) {
      const trans = sec.translations[0];
      if (!trans || !trans.publishedContent || typeof trans.publishedContent !== "object") {
        continue;
      }

      const publishedData = trans.publishedContent as Record<string, any>;

      switch (sec.sectionKey) {
        case "hero":
          if (publishedData.tagline) merged.hero.tagline = publishedData.tagline;
          if (publishedData.line1) merged.hero.line1 = publishedData.line1;
          if (publishedData.line2) merged.hero.line2 = publishedData.line2;
          if (publishedData.desc) merged.hero.desc = publishedData.desc;
          if (publishedData.signatureLabel) merged.hero.signatureLabel = publishedData.signatureLabel;
          if (Array.isArray(publishedData.kineticPhases) && publishedData.kineticPhases.length > 0) {
            merged.hero.kineticPhases = publishedData.kineticPhases;
          }
          break;

        case "whatWeBuild":
          if (publishedData.label) merged.whatWeBuild.label = publishedData.label;
          if (publishedData.title) merged.whatWeBuild.title = publishedData.title;
          if (Array.isArray(publishedData.items) && publishedData.items.length > 0) {
            merged.whatWeBuild.items = publishedData.items;
          }
          break;

        case "dualEngine":
          if (publishedData.label) merged.dualEngine.label = publishedData.label;
          if (publishedData.title) merged.dualEngine.title = publishedData.title;
          if (publishedData.desc) merged.dualEngine.desc = publishedData.desc;
          if (publishedData.synergyTitle) merged.dualEngine.synergyTitle = publishedData.synergyTitle;
          if (publishedData.synergyDesc) merged.dualEngine.synergyDesc = publishedData.synergyDesc;
          if (publishedData.tabSystems) merged.dualEngine.tabSystems = publishedData.tabSystems;
          if (publishedData.tabSynergy) merged.dualEngine.tabSynergy = publishedData.tabSynergy;
          if (publishedData.tabVentures) merged.dualEngine.tabVentures = publishedData.tabVentures;
          if (publishedData.engine1) merged.dualEngine.engine1 = publishedData.engine1;
          if (publishedData.engine2) merged.dualEngine.engine2 = publishedData.engine2;
          break;

        case "whySadeem":
          if (publishedData.label) merged.whySadeem.label = publishedData.label;
          if (publishedData.title) merged.whySadeem.title = publishedData.title;
          if (Array.isArray(publishedData.items) && publishedData.items.length > 0) {
            merged.whySadeem.items = publishedData.items;
          }
          break;

        case "howWeWork":
          if (publishedData.label) merged.howWeWork.label = publishedData.label;
          if (publishedData.title) merged.howWeWork.title = publishedData.title;
          if (Array.isArray(publishedData.items) && publishedData.items.length > 0) {
            merged.howWeWork.items = publishedData.items;
          }
          break;

        case "about":
          if (publishedData.quote1) merged.about.quote1 = publishedData.quote1;
          if (publishedData.quote2) merged.about.quote2 = publishedData.quote2;
          if (publishedData.brandStatement) merged.about.brandStatement = publishedData.brandStatement;
          if (publishedData.visionTitle) merged.common.visionTitle = publishedData.visionTitle;
          if (publishedData.visionDesc) merged.about.visionDesc = publishedData.visionDesc;
          if (publishedData.missionTitle) merged.common.missionTitle = publishedData.missionTitle;
          if (publishedData.missionDesc) merged.about.missionDesc = publishedData.missionDesc;
          break;

        case "cta":
          if (publishedData.readyToBuild) merged.common.readyToBuild = publishedData.readyToBuild;
          if (publishedData.readyDesc) merged.common.readyDesc = publishedData.readyDesc;
          if (publishedData.startProject) merged.common.startProject = publishedData.startProject;
          if (publishedData.pitchIdea) merged.common.pitchIdea = publishedData.pitchIdea;
          break;

        case "footer":
          if (publishedData.navigation) merged.footer.navigation = publishedData.navigation;
          if (publishedData.connect) merged.footer.connect = publishedData.connect;
          if (publishedData.allRightsReserved) merged.footer.allRightsReserved = publishedData.allRightsReserved;
          if (publishedData.designedAndBuiltBy) merged.footer.designedAndBuiltBy = publishedData.designedAndBuiltBy;
          break;
      }
    }

    return merged;
  } catch (error) {
    console.error(`Error loading published content for ${locale}:`, error);
    return baseline;
  }
}

/**
 * Administrative Overview:
 * Returns the list of all editable sections with status, draft indicator, and timestamps.
 */
export async function getAdminContentCatalog(): Promise<AdminContentSectionSummary[]> {
  const sections = await prisma.contentSection.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      translations: true,
    },
  });

  return sections.map((sec) => {
    const enTrans = sec.translations.find((t) => t.locale === "en");
    const arTrans = sec.translations.find((t) => t.locale === "ar");

    const isEnModified = enTrans
      ? JSON.stringify(enTrans.draftContent) !== JSON.stringify(enTrans.publishedContent)
      : false;
    const isArModified = arTrans
      ? JSON.stringify(arTrans.draftContent) !== JSON.stringify(arTrans.publishedContent)
      : false;

    return {
      id: sec.id,
      sectionKey: sec.sectionKey,
      name: sec.name || sec.sectionKey,
      description: sec.description || undefined,
      status: sec.status,
      publishedAt: sec.publishedAt,
      updatedAt: sec.updatedAt,
      isDraftModified: isEnModified || isArModified,
      hasEnTranslation: Boolean(enTrans),
      hasArTranslation: Boolean(arTrans),
      lastUpdatedBy: enTrans?.updatedBy || arTrans?.updatedBy || undefined,
    };
  });
}

/**
 * Administrative Section Detail:
 * Retrieves draft and published content for both English and Arabic.
 */
export async function getAdminSectionDetail(sectionKey: string): Promise<AdminSectionDetail | null> {
  const section = await prisma.contentSection.findUnique({
    where: { sectionKey },
    include: { translations: true },
  });

  if (!section) return null;

  const enTrans = section.translations.find((t) => t.locale === "en");
  const arTrans = section.translations.find((t) => t.locale === "ar");

  const enDraft = (enTrans?.draftContent as Record<string, unknown>) || {};
  const arDraft = (arTrans?.draftContent as Record<string, unknown>) || {};
  const enPublished = (enTrans?.publishedContent as Record<string, unknown>) || null;
  const arPublished = (arTrans?.publishedContent as Record<string, unknown>) || null;

  const isModified =
    JSON.stringify(enDraft) !== JSON.stringify(enPublished) ||
    JSON.stringify(arDraft) !== JSON.stringify(arPublished);

  return {
    id: section.id,
    sectionKey: section.sectionKey,
    name: section.name || section.sectionKey,
    description: section.description || undefined,
    status: section.status,
    publishedAt: section.publishedAt,
    updatedAt: section.updatedAt,
    enDraft,
    arDraft,
    enPublished,
    arPublished,
    isModified,
  };
}

/**
 * Saves draft content for a section.
 * Important: Only updates `draftContent`. `publishedContent` is NEVER modified.
 */
export async function saveAdminSectionDraft(
  sectionKey: string,
  data: { en: Record<string, unknown>; ar: Record<string, unknown> },
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  const section = await prisma.contentSection.findUnique({
    where: { sectionKey },
    include: { translations: true },
  });

  if (!section) {
    return { success: false, errors: [`Section '${sectionKey}' does not exist.`] };
  }

  // Update English draft
  await prisma.contentTranslation.upsert({
    where: {
      sectionId_locale: {
        sectionId: section.id,
        locale: "en",
      },
    },
    update: {
      draftContent: data.en as any,
      updatedBy: session.userId,
    },
    create: {
      sectionId: section.id,
      locale: "en",
      draftContent: data.en as any,
      status: PublicationStatus.DRAFT,
      updatedBy: session.userId,
    },
  });

  // Update Arabic draft
  await prisma.contentTranslation.upsert({
    where: {
      sectionId_locale: {
        sectionId: section.id,
        locale: "ar",
      },
    },
    update: {
      draftContent: data.ar as any,
      updatedBy: session.userId,
    },
    create: {
      sectionId: section.id,
      locale: "ar",
      draftContent: data.ar as any,
      status: PublicationStatus.DRAFT,
      updatedBy: session.userId,
    },
  });

  await prisma.contentSection.update({
    where: { id: section.id },
    data: { updatedAt: new Date() },
  });

  await recordAuditLog({
    userId: session.userId,
    action: "CONTENT_DRAFT_UPDATED",
    entityType: "ContentSection",
    entityId: section.id,
    details: { sectionKey, updatedBy: session.email },
  });

  return { success: true };
}

/**
 * Publishes draft content.
 * Enforces: SUPER_ADMIN role only.
 * Validates bilingual completeness. Copies `draftContent` into `publishedContent`.
 */
export async function publishAdminSection(
  sectionKey: string,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  if (session.role !== AdminRole.SUPER_ADMIN) {
    return {
      success: false,
      errors: ["FORBIDDEN: Only SUPER_ADMIN is authorized to publish website content."],
    };
  }

  const section = await prisma.contentSection.findUnique({
    where: { sectionKey },
    include: { translations: true },
  });

  if (!section) {
    return { success: false, errors: [`Section '${sectionKey}' not found.`] };
  }

  const enTrans = section.translations.find((t) => t.locale === "en");
  const arTrans = section.translations.find((t) => t.locale === "ar");

  if (!enTrans || !enTrans.draftContent || Object.keys(enTrans.draftContent).length === 0) {
    return { success: false, errors: ["Cannot publish: English draft content is missing or empty."] };
  }

  if (!arTrans || !arTrans.draftContent || Object.keys(arTrans.draftContent).length === 0) {
    return { success: false, errors: ["Cannot publish: Arabic draft content is missing or empty."] };
  }

  const now = new Date();

  // Commit English
  await prisma.contentTranslation.update({
    where: { id: enTrans.id },
    data: {
      publishedContent: enTrans.draftContent as any,
      status: PublicationStatus.PUBLISHED,
      publishedAt: now,
      publishedBy: session.userId,
    },
  });

  // Commit Arabic
  await prisma.contentTranslation.update({
    where: { id: arTrans.id },
    data: {
      publishedContent: arTrans.draftContent as any,
      status: PublicationStatus.PUBLISHED,
      publishedAt: now,
      publishedBy: session.userId,
    },
  });

  // Update Section status
  await prisma.contentSection.update({
    where: { id: section.id },
    data: {
      status: PublicationStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  await recordAuditLog({
    userId: session.userId,
    action: "CONTENT_SECTION_PUBLISHED",
    entityType: "ContentSection",
    entityId: section.id,
    details: { sectionKey, publishedBy: session.email },
  });

  return { success: true };
}

/**
 * Reverts draft content back to the current published content.
 */
export async function revertAdminSectionDraft(
  sectionKey: string,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  const section = await prisma.contentSection.findUnique({
    where: { sectionKey },
    include: { translations: true },
  });

  if (!section) return { success: false, errors: ["Section not found."] };

  const enTrans = section.translations.find((t) => t.locale === "en");
  const arTrans = section.translations.find((t) => t.locale === "ar");

  if (enTrans?.publishedContent) {
    await prisma.contentTranslation.update({
      where: { id: enTrans.id },
      data: { draftContent: enTrans.publishedContent as any },
    });
  }

  if (arTrans?.publishedContent) {
    await prisma.contentTranslation.update({
      where: { id: arTrans.id },
      data: { draftContent: arTrans.publishedContent as any },
    });
  }

  await recordAuditLog({
    userId: session.userId,
    action: "CONTENT_DRAFT_REVERTED",
    entityType: "ContentSection",
    entityId: section.id,
    details: { sectionKey, revertedBy: session.email },
  });

  return { success: true };
}
