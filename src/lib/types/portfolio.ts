export type ProjectStatus = "LIVE" | "BUILDING" | "MVP" | "CONCEPT";

export interface ProjectMetric {
  en: string;
  ar: string;
}

export interface ProjectPartnershipNote {
  en: string;
  ar: string;
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
