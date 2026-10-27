/**
 * SADEEM STUDIO — CONTENT BASELINE SEED SCRIPT
 * 
 * Safely extracts approved editorial content from static dictionaries (`en.ts` and `ar.ts`)
 * and migrates them into PostgreSQL `ContentSection` and `ContentTranslation` records.
 * 
 * Sets both `draftContent` and `publishedContent` to the approved baseline and sets `status` to `PUBLISHED`.
 * Fully non-destructive and idempotent.
 */

import prisma from "../src/lib/prisma";
import { en } from "../src/content/en";
import { ar } from "../src/content/ar";
import { PublicationStatus } from "@prisma/client";

interface SectionSeedDefinition {
  sectionKey: string;
  name: string;
  description: string;
  getContent: (dict: typeof en) => Record<string, unknown>;
}

const SECTIONS_TO_SEED: SectionSeedDefinition[] = [
  {
    sectionKey: "hero",
    name: "Hero Section",
    description: "Main value proposition, kinetic phases, and signature engine visual copy",
    getContent: (d) => ({
      tagline: d.hero.tagline,
      line1: d.hero.line1,
      line2: d.hero.line2,
      desc: d.hero.desc,
      signatureLabel: d.hero.signatureLabel,
      kineticPhases: d.hero.kineticPhases,
    }),
  },
  {
    sectionKey: "whatWeBuild",
    name: "What We Build (Capabilities)",
    description: "Capabilities catalog and service offerings",
    getContent: (d) => ({
      label: d.whatWeBuild.label,
      title: d.whatWeBuild.title,
      items: d.whatWeBuild.items,
    }),
  },
  {
    sectionKey: "dualEngine",
    name: "The Dual Engine",
    description: "Systems vs Ventures dual engine business model, tabs, and flywheel copy",
    getContent: (d) => ({
      label: d.dualEngine.label,
      title: d.dualEngine.title,
      desc: d.dualEngine.desc,
      synergyTitle: d.dualEngine.synergyTitle,
      synergyDesc: d.dualEngine.synergyDesc,
      tabSystems: d.dualEngine.tabSystems,
      tabSynergy: d.dualEngine.tabSynergy,
      tabVentures: d.dualEngine.tabVentures,
      engine1: d.dualEngine.engine1,
      engine2: d.dualEngine.engine2,
    }),
  },
  {
    sectionKey: "whySadeem",
    name: "Why Sadeem (Advantage)",
    description: "Studio core advantages and differentiating principles",
    getContent: (d) => ({
      label: d.whySadeem.label,
      title: d.whySadeem.title,
      items: d.whySadeem.items,
    }),
  },
  {
    sectionKey: "howWeWork",
    name: "How We Work (Process)",
    description: "Four-step operational process: Discover, Design, Build, Launch",
    getContent: (d) => ({
      label: d.howWeWork.label,
      title: d.howWeWork.title,
      items: d.howWeWork.items,
    }),
  },
  {
    sectionKey: "about",
    name: "About & Vision / Mission",
    description: "Studio quotes, brand statement, vision, and mission",
    getContent: (d) => ({
      quote1: d.about.quote1,
      quote2: d.about.quote2,
      brandStatement: d.about.brandStatement,
      visionTitle: d.common.visionTitle,
      visionDesc: d.about.visionDesc,
      missionTitle: d.common.missionTitle,
      missionDesc: d.about.missionDesc,
    }),
  },
  {
    sectionKey: "cta",
    name: "Final Call to Action (CTA)",
    description: "Bottom homepage conversion banner and action button labels",
    getContent: (d) => ({
      readyToBuild: d.common.readyToBuild,
      readyDesc: d.common.readyDesc,
      startProject: d.common.startProject,
      pitchIdea: d.common.pitchIdea,
      forBusinesses: d.common.forBusinesses,
      forFounders: d.common.forFounders,
    }),
  },
  {
    sectionKey: "footer",
    name: "Footer Content",
    description: "Footer navigation columns, copyright, and brand credit",
    getContent: (d) => ({
      navigation: d.footer.navigation,
      connect: d.footer.connect,
      allRightsReserved: d.footer.allRightsReserved,
      designedAndBuiltBy: d.footer.designedAndBuiltBy,
    }),
  },
];

async function seedContentBaseline() {
  console.log("==================================================");
  console.log("🌱 SADEEM PHASE 4.6 — SEEDING CONTENT BASELINE");
  console.log("==================================================");

  for (const def of SECTIONS_TO_SEED) {
    console.log(`Processing section: [${def.sectionKey}] - ${def.name}...`);

    const section = await prisma.contentSection.upsert({
      where: { sectionKey: def.sectionKey },
      update: {
        name: def.name,
        description: def.description,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        sectionKey: def.sectionKey,
        name: def.name,
        description: def.description,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    const enContent = def.getContent(en);
    const arContent = def.getContent(ar);

    // English translation
    await prisma.contentTranslation.upsert({
      where: {
        sectionId_locale: {
          sectionId: section.id,
          locale: "en",
        },
      },
      update: {
        draftContent: enContent as any,
        publishedContent: enContent as any,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        sectionId: section.id,
        locale: "en",
        draftContent: enContent as any,
        publishedContent: enContent as any,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Arabic translation
    await prisma.contentTranslation.upsert({
      where: {
        sectionId_locale: {
          sectionId: section.id,
          locale: "ar",
        },
      },
      update: {
        draftContent: arContent as any,
        publishedContent: arContent as any,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        sectionId: section.id,
        locale: "ar",
        draftContent: arContent as any,
        publishedContent: arContent as any,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    console.log(`  ✅ Section [${def.sectionKey}] seeded bilingually as PUBLISHED`);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL 8 CONTENT SECTIONS SUCCESSFULLY SEEDED!");
  console.log("==================================================");
}

seedContentBaseline()
  .catch((e) => {
    console.error("Content seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
