export type ProjectStatus = "LIVE" | "BUILDING" | "MVP" | "CONCEPT";

export interface ProjectMetric {
  en: string;
  ar: string;
}

export interface ProjectPartnershipNote {
  en: string;
  ar: string;
}

export interface Project {
  id: string;
  slug?: string;
  type?: string;
  name: string;
  arabicName?: string;
  
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
  statusColor?: string;
  
  year: number;
  technologies: string[];
  coverImage?: string;
  featured: boolean;
  ownership: string;
  arabicOwnership: string;
  partnershipStatus?: string;
  partnershipNote?: ProjectPartnershipNote;
  externalLink?: string;
  
  metric?: ProjectMetric;
  accentColor?: string;
}

export const projects: Project[] = [
  {
    id: "cucu-leaf-scan",
    name: "Cucu Leaf Scan",
    arabicName: "كوكو ليف سكان",
    tagline: "AI-powered agricultural diagnostics",
    arabicTagline: "تشخيص زراعي فوري مدعوم بالذكاء الاصطناعي",
    category: "AI & Computer Vision",
    arabicCategory: "الذكاء الاصطناعي والرؤية الحاسوبية",
    shortDescription: "Mobile platform enabling farmers to detect crop diseases in real-time through on-device computer vision.",
    arabicShortDescription: "منصة جوال تتيح للمزارعين تشخيص أمراض المحاصيل فورياً عبر الرؤية الحاسوبية على الجهاز مباشرة.",
    longDescription: "Cucu Leaf Scan brings deep-learning pathology models directly to smallholder farmers. By analyzing leaf textures and coloration offline, it provides rapid disease diagnosis and preventative spray recommendations to safeguard yields.",
    arabicLongDescription: "يوفّر 'كوكو ليف سكان' نماذج تعلم عميق لتشخيص أمراض النباتات للمزارعين مباشرة. عبر تحليل أنسجة الأوراق وتدرجات الألوان دون الحاجة لإنترنت دائم، يقدّم تشخيصاً فورياً وإرشادات وقائية لحماية المحاصيل.",
    status: "MVP",
    arabicStatus: "نسخة أولية MVP",
    statusColor: "#6C8B80", // Muted Sage
    accentColor: "#6C8B80",
    year: 2024,
    technologies: ["Flutter", "MobileNetV2 (Fine-tuned)"],
    featured: true,
    ownership: "Sadeem Ventures",
    arabicOwnership: "سديم للمشاريع",
    metric: {
      en: "Offline Computer Vision Model",
      ar: "نموذج رؤية حاسوبية يعمل دون إنترنت"
    }
  },
  {
    id: "wesal",
    name: "Wesal",
    arabicName: "وصال",
    tagline: "AI-powered interactive learning infrastructure",
    arabicTagline: "بنية تعليمية تفاعلية مدعومة بالذكاء الاصطناعي",
    category: "EdTech & Interactive Learning",
    arabicCategory: "تكنولوجيا التعليم والتواصل التفاعلي",
    shortDescription: "A specialized digital education and communication infrastructure engineered by Sadeem.",
    arabicShortDescription: "بنية تحتية رقمية متخصصة للتعليم والتواصل التفاعلي تم بناؤها بواسطة استوديو سديم.",
    longDescription: "Wesal replaces fragmented messaging and legacy portals with a high-security institutional network. It synchronizes academic coordination, interactive student feeds, and administrative workflows into a unified platform.",
    arabicLongDescription: "تستبدل 'وصال' أدوات المراسلة المشتتة والبوابات التقليدية بشبكة مؤسسية موحدة وعالية الأمان، مما يدمج التنسيق الأكاديمي ومسارات التواصل الإداري في نظام واحد متكامل.",
    status: "BUILDING",
    arabicStatus: "قيد البناء",
    statusColor: "#C28E62", // Brand Copper
    accentColor: "#C28E62",
    year: 2024,
    technologies: ["Next.js"],
    featured: true,
    ownership: "Sadeem Ventures",
    arabicOwnership: "سديم للمشاريع",
    metric: {
      en: "Unified Institutional Mesh",
      ar: "منظومة تواصل مؤسسية موحدة"
    }
  },
  {
    id: "tabadul",
    name: "Tabadul",
    arabicName: "تبادل",
    tagline: "Collaborative commerce & shared loyalty network",
    arabicTagline: "منصة تجارة تشاركية وشبكة ولاء موحدة",
    category: "Commerce Ecosystem",
    arabicCategory: "أنظمة التجارة وشبكات الولاء",
    shortDescription: "Collaborative retail protocol allowing independent merchants to cross-reward customer loyalty.",
    arabicShortDescription: "بنية تحتية للتبادل التجاري التشاركي تتيح للتجار المستقلين مشاركة برامج ولاء موحدة وتوزيع السلع بكفاءة.",
    longDescription: "A decentralized commerce mesh where regional retailers share customer rewards and cross-promotional inventory. Built as an open collaborative initiative with regional retail partners (potential strategic partnership currently under discussion).",
    arabicLongDescription: "شبكة تجارية تشاركية تتيح لتجار التجزئة المستقلين مشاركة نقاط الولاء والعروض الترويجية المشتركة. تم بناؤها كمبادرة تشاركية مع شركاء تجاريين (شراكة استراتيجية قيد المناقشة).",
    status: "BUILDING",
    arabicStatus: "قيد البناء",
    statusColor: "#C28E62", // Brand Copper
    accentColor: "#527C91",
    year: 2024,
    technologies: ["ASP.NET", "React.js", "Flutter"],
    featured: true,
    ownership: "Strategic Venture Partnership (In Discussion)",
    arabicOwnership: "شراكة استراتيجية (قيد المناقشة)",
    partnershipStatus: "UNDER_DISCUSSION",
    partnershipNote: {
      en: "Note: Collaborative ecosystem initiative. Strategic partnership terms are currently in active discussion.",
      ar: "ملاحظة: مبادرة تجارية تشاركية. شروط الشراكة الاستراتيجية قيد المناقشة والمفاضلة حالياً."
    },
    metric: {
      en: "Multi-Merchant Exchange Protocol",
      ar: "بروتوكول تبادل تجاري متعدد الأطراف"
    }
  },
  {
    id: "lama-school",
    name: "Lama School",
    arabicName: "مدرسة لمى",
    tagline: "Multi-role academic operations management",
    arabicTagline: "إدارة تشغيلية شاملة للمؤسسات المدرسية",
    category: "Enterprise Academic Systems",
    arabicCategory: "أنظمة المؤسسات التعليمية وإدارة العمليات",
    shortDescription: "Integrated school management system coordinating administration, teachers, parents, and students.",
    arabicShortDescription: "نظام إداري متكامل للمؤسسات التعليمية يربط الإدارة والمعلمين والطلاب وأولياء الأمور بانسيابية.",
    longDescription: "Designed to remove administrative overhead from schools, Lama School unifies student grading, attendance tracking, tuition management, and guardian alerts in an intuitive multi-role interface with zero operational clutter.",
    arabicLongDescription: "صُمم نظام 'مدرسة لمى' لتقليص الأعباء الإدارية والورقية، حيث يوحّد رصد الدرجات، وسجلات الحضور، والرسوم، وإشعارات أولياء الأمور ضمن واجهات مخصصة لكل فئة دون أي تعقيد تشغيلي.",
    status: "MVP",
    arabicStatus: "نسخة أولية MVP",
    statusColor: "#6C8B80", // Muted Sage
    accentColor: "#C28E62",
    year: 2024,
    technologies: ["Next.js", "TypeScript"],
    featured: true,
    ownership: "Sadeem Systems",
    arabicOwnership: "سديم للأنظمة",
    metric: {
      en: "4 Dedicated Stakeholder Portals",
      ar: "4 بوابات مخصصة لأطراف العملية التعليمية"
    }
  }
];
