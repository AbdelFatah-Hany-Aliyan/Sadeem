/**
 * SADEEM — COMPANY MANAGEMENT SYSTEM SETUP SERVICE
 * 
 * Idempotent initialization of core departments, permanent organizational structures,
 * and baseline system metadata.
 */

import prisma from "@/lib/prisma";

export interface CoreDepartmentDefinition {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  responsibilitiesEn: string[];
  responsibilitiesAr: string[];
  color: string;
  icon: string;
  displayOrder: number;
}

export const CORE_DEPARTMENTS: CoreDepartmentDefinition[] = [
  {
    code: "ANALYSIS",
    nameEn: "Analysis & Product Strategy",
    nameAr: "فريق التحليل",
    descriptionEn: "Requirements engineering, business process modeling, user story decomposition, and product feasibility.",
    descriptionAr: "هندسة المتطلبات، تحليل العمليات والنماذج التجارية، صياغة قصص المستخدم، ودراسات الجدوى التقنية للمنتجات.",
    responsibilitiesEn: [
      "Requirements analysis",
      "Business process analysis",
      "Product research",
      "Feasibility assessment",
      "User stories & acceptance criteria",
      "Product specifications",
      "Risk assessment & mitigation",
    ],
    responsibilitiesAr: [
      "تحليل المتطلبات وهندستها",
      "تحليل وتوثيق العمليات التشغيلية",
      "أبحاث المنتجات والسوق",
      "دراسات الجدوى التقنية",
      "صياغة قصص المستخدم ومعايير القبول",
      "كتابة وتحديث مواصفات المنتجات",
      "تقييم المخاطر وخطط الحد منها",
    ],
    color: "#527C91", // Steel Blue
    icon: "Compass",
    displayOrder: 1,
  },
  {
    code: "DESIGN",
    nameEn: "Product Design & UX",
    nameAr: "فريق التصميم",
    descriptionEn: "User experience research, wireframing, high-fidelity UI design, visual systems, and accessibility.",
    descriptionAr: "أبحاث تجربة المستخدم، المخططات الهيكلية، تصميم الواجهات المتقدمة، بناء نظم التصميم، وضمان إمكانية الوصول.",
    responsibilitiesEn: [
      "UX research & usability testing",
      "User flows & information architecture",
      "Wireframes & interactive prototypes",
      "UI design & design systems",
      "Visual branding & typography",
      "Digital accessibility (WCAG AA)",
      "Responsive & multi-platform layouts",
    ],
    responsibilitiesAr: [
      "أبحاث تجربة المستخدم واختبارات الاستخدام",
      "مخططات تدفق المستخدم وهندسة المعلومات",
      "المخططات الهيكلية والنماذج التفاعلية",
      "تصميم الواجهات وبناء وتطوير نظم التصميم",
      "الهوية البصرية والخطوط والرموز",
      "إمكانية الوصول الرقمي ومعايير WCAG",
      "تصميم الواجهات المتجاوبة لمختلف الشاشات",
    ],
    color: "#C28E62", // Copper
    icon: "Palette",
    displayOrder: 2,
  },
  {
    code: "ENGINEERING",
    nameEn: "Engineering & Delivery",
    nameAr: "فريق البناء",
    descriptionEn: "Full-stack development, database architecture, systems integration, automated testing, security, and cloud deployment.",
    descriptionAr: "التطوير البرمجي الكامل، هندسة قواعد البيانات، تكامل الأنظمة والواجهات، الاختبارات المؤتمتة، الأمان، والنشر السحابي.",
    responsibilitiesEn: [
      "Frontend development & responsive web",
      "Backend architecture & microservices",
      "Database schema & performance optimization",
      "API integrations & webhook pipelines",
      "Automated unit, integration & E2E testing",
      "Runtime performance & telemetry",
      "Security hardening & encryption",
      "CI/CD deployment & infrastructure",
    ],
    responsibilitiesAr: [
      "تطوير واجهات المستخدم التفاعلية والويب المتجاوب",
      "هندسة الخوادم والخدمات الخلفية",
      "هندسة قواعد البيانات وتحسين الأداء",
      "تكامل الواجهات البرمجية وتدفقات البيانات",
      "أتمتة الاختبارات الشاملة وضمان الجودة",
      "تحسين الأداء التشغيلي والمراقبة",
      "الأمان السيبراني والتشفير",
      "مسارات النشر المستمر والبنية التحتية السحابية",
    ],
    color: "#6C8B80", // Sage
    icon: "Code",
    displayOrder: 3,
  },
  {
    code: "MARKETING",
    nameEn: "Marketing & Growth",
    nameAr: "فريق التسويق",
    descriptionEn: "Brand storytelling, content creation, audience acquisition campaigns, positioning, and product launches.",
    descriptionAr: "إدارة الهوية التسويقية، صناعة المحتوى الإبداعي، حملات استقطاب العملاء، التموضع السوقي، وإطلاق المنتجات الرقمية.",
    responsibilitiesEn: [
      "Brand management & positioning",
      "Editorial & technical content creation",
      "Digital campaigns & performance marketing",
      "Lead generation & client acquisition",
      "Market positioning & competitor analysis",
      "Product launch orchestration",
      "Growth metrics & analytics",
    ],
    responsibilitiesAr: [
      "إدارة الهوية والتسويق المؤسسي",
      "صناعة المحتوى التحريري والتقني",
      "إدارة الحملات الرقمية والتسويق القائم على الأداء",
      "جذب واستقطاب العملاء المحتملين",
      "التموضع السوقي ودراسة المنافسين",
      "تخطيط وتنفيذ حملات إطلاق المنتجات",
      "تحليل مؤشرات النمو والبيانات التسويقية",
    ],
    color: "#C28E62", // Copper / Accent
    icon: "Megaphone",
    displayOrder: 4,
  },
];

/**
 * Idempotently initializes or updates the 4 core Sadeem departments.
 * Guaranteed safe to run multiple times without duplicating records or wiping existing links.
 */
export async function ensureCoreDepartments() {
  const results = [];

  for (const dept of CORE_DEPARTMENTS) {
    const team = await prisma.companyTeam.upsert({
      where: { code: dept.code },
      update: {
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        descriptionEn: dept.descriptionEn,
        descriptionAr: dept.descriptionAr,
        responsibilitiesEn: dept.responsibilitiesEn,
        responsibilitiesAr: dept.responsibilitiesAr,
        color: dept.color,
        icon: dept.icon,
        displayOrder: dept.displayOrder,
        isActive: true,
      },
      create: {
        code: dept.code,
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        descriptionEn: dept.descriptionEn,
        descriptionAr: dept.descriptionAr,
        responsibilitiesEn: dept.responsibilitiesEn,
        responsibilitiesAr: dept.responsibilitiesAr,
        color: dept.color,
        icon: dept.icon,
        displayOrder: dept.displayOrder,
        isActive: true,
      },
    });
    results.push(team);
  }

  return results;
}
