export type ProjectStatus = "LIVE" | "BUILDING" | "CONCEPT";

export interface Project {
  id: string;
  name: string;
  arabicName?: string;
  
  category: string;
  arabicCategory: string;
  
  shortDescription: string;
  arabicShortDescription: string;
  
  longDescription: string;
  arabicLongDescription: string;
  
  status: ProjectStatus;
  arabicStatus: string;
  
  year: number;
  technologies: string[];
  coverImage?: string;
  featured: boolean;
  ownership: "Client" | "Sadeem" | "Startup Studio";
  externalLink?: string;
}

export const projects: Project[] = [
  {
    id: "wesal",
    name: "Wesal",
    arabicName: "وصال",
    category: "Digital Education Product",
    arabicCategory: "منتج تعليمي رقمي",
    shortDescription: "A specialized digital education and communication infrastructure built by Sadeem.",
    arabicShortDescription: "بنية تحتية رقمية متخصصة للتعليم والتواصل، تم بناؤها بواسطة سديم.",
    longDescription: "Wesal replaces fragmented communication tools with a dedicated, secure system designed specifically for the rigorous demands of educational and operational environments.",
    arabicLongDescription: "تستبدل 'وصال' أدوات التواصل المشتتة بنظام آمن ومخصص، تم تصميمه خصيصاً لتلبية المتطلبات الصارمة للبيئات التعليمية والتشغيلية.",
    status: "BUILDING",
    arabicStatus: "قيد البناء",
    year: 2024,
    technologies: ["Next.js", "WebSockets", "PostgreSQL", "React Native"],
    featured: true,
    ownership: "Sadeem",
  },
  {
    id: "jari",
    name: "Jari",
    arabicName: "جاري",
    category: "Financial Technology",
    arabicCategory: "تكنولوجيا مالية",
    shortDescription: "Streamlined financial operations and tracking designed for small-to-medium businesses.",
    arabicShortDescription: "تسهيل العمليات المالية والتتبع، مصمم للشركات الصغيرة والمتوسطة.",
    longDescription: "A studio concept designed to simplify complex financial workflows into an intuitive interface, allowing business owners to monitor cash flow with clarity.",
    arabicLongDescription: "مفهوم يستكشفه استوديو سديم لتبسيط مسارات العمل المالية المعقدة في واجهة بديهية، مما يتيح لأصحاب الأعمال مراقبة التدفق النقدي بوضوح.",
    status: "CONCEPT",
    arabicStatus: "مفهوم أولي",
    year: 2024,
    technologies: ["Next.js", "Tailwind CSS", "Prisma"],
    featured: true,
    ownership: "Startup Studio",
  }
];
