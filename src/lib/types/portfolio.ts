export type ProjectStatus = "LIVE" | "BUILDING" | "MVP" | "CONCEPT";

export interface ProjectMetric {
  en: string;
  ar: string;
}

export interface ProjectPartnershipNote {
  en: string;
  ar: string;
}

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface ProjectFeatureDTO {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
}

export interface ProjectTechDTO {
  name: string;
  category: string;
  isCore: boolean;
}

export interface ProjectMediaDTO {
  id: string;
  storageKey: string;
  publicUrl?: string | null;
  mediaType: string;
  isCover: boolean;
  displayOrder: number;
  width?: number | null;
  height?: number | null;
  altText: LocalizedString;
  caption?: LocalizedString;
}

export interface RelatedProjectDTO {
  id: string;
  slug: string;
  name: string;
  arabicName: string;
  category: string;
  arabicCategory: string;
  status: ProjectStatus;
  arabicStatus: string;
  statusColor: string;
  accentColor: string;
}

/**
 * Public Presentation Data Transfer Object (DTO)
 * Used by UI components across client and server boundaries.
 * Keeps internal administrative data decoupled from public presentation.
 */
export interface ProjectDTO {
  id: string; // canonical slug used for keys and URLs
  slug: string;
  type: string;
  
  name: string;
  arabicName: string;
  
  tagline: string;
  arabicTagline: string;

  category: string;
  arabicCategory: string;
  
  shortDescription: string;
  arabicShortDescription: string;
  
  longDescription: string;
  arabicLongDescription: string;
  
  status: ProjectStatus;
  arabicStatus: string;
  statusColor: string;
  
  ownership: string;
  arabicOwnership: string;
  
  partnershipStatus: string;
  partnershipNote?: ProjectPartnershipNote;
  
  year: number;
  technologies: string[];
  featured: boolean;
  displayOrder: number;
  
  metric?: ProjectMetric;
  accentColor: string;
}

/**
 * Detailed Case Study Data Transfer Object
 * Used for dynamic project detail pages (/work/[slug] and /work-preview/[slug])
 */
export interface ProjectDetailDTO extends ProjectDTO {
  problem?: LocalizedString;
  solution?: LocalizedString;
  roleDescription?: LocalizedString;
  features: ProjectFeatureDTO[];
  technologiesDetailed: ProjectTechDTO[];
  media: ProjectMediaDTO[];
  relatedProjects: RelatedProjectDTO[];
}
