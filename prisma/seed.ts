import { 
  PrismaClient, 
  ProjectType, 
  DevelopmentStatus, 
  PublicationStatus, 
  OwnershipType, 
  PartnershipStatus,
  TechCategory 
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting idempotent database seed for Sadeem...");

  // ---------------------------------------------------------------------------
  // 1. Technologies Catalog
  // ---------------------------------------------------------------------------
  const technologiesData = [
    { slug: "flutter", name: "Flutter", category: TechCategory.MOBILE },
    { slug: "mobilenet-v2", name: "MobileNetV2 (Fine-tuned)", category: TechCategory.AI_ML },
    { slug: "nextjs", name: "Next.js", category: TechCategory.FRONTEND },
    { slug: "react", name: "React.js", category: TechCategory.FRONTEND },
    { slug: "aspnet", name: "ASP.NET", category: TechCategory.BACKEND },
    { slug: "typescript", name: "TypeScript", category: TechCategory.FRONTEND },
    { slug: "postgresql", name: "PostgreSQL", category: TechCategory.DATABASE },
    { slug: "tailwindcss", name: "Tailwind CSS", category: TechCategory.FRONTEND },
    { slug: "websockets", name: "WebSockets", category: TechCategory.INFRASTRUCTURE },
  ];

  const techMap = new Map<string, string>();
  for (const tech of technologiesData) {
    const record = await prisma.technology.upsert({
      where: { slug: tech.slug },
      update: {
        name: tech.name,
        category: tech.category,
      },
      create: {
        slug: tech.slug,
        name: tech.name,
        category: tech.category,
      },
    });
    techMap.set(tech.slug, record.id);
  }
  console.log(`✅ Seeded ${technologiesData.length} technologies`);

  // ---------------------------------------------------------------------------
  // 2. Canonical Real Projects (Seeded strictly as DRAFT, Factual Data Only)
  // ---------------------------------------------------------------------------

  // PROJECT 1: Cucu Leaf Scan
  const cucu = await prisma.project.upsert({
    where: { slug: "cucu-leaf-scan" },
    update: {
      type: ProjectType.MOBILE_APPLICATION,
      developmentStatus: DevelopmentStatus.MVP,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_VENTURE,
      sadeemRole: "Design, Product Strategy & Mobile AI Engineering (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 1,
      accentColor: "#6C8B80",
      year: 2024,
    },
    create: {
      slug: "cucu-leaf-scan",
      type: ProjectType.MOBILE_APPLICATION,
      developmentStatus: DevelopmentStatus.MVP,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_VENTURE,
      sadeemRole: "Design, Product Strategy & Mobile AI Engineering (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 1,
      accentColor: "#6C8B80",
      year: 2024,
    },
  });

  // Project 1 Translations
  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: cucu.id, locale: "en" } },
    update: {
      title: "Cucu Leaf Scan",
      tagline: "AI-powered agricultural diagnostics",
      categoryName: "AI & Computer Vision",
      shortDescription: "A smart mobile application that identifies cucumber leaf diseases from smartphone images.",
      fullDescription: "A smart mobile application that identifies cucumber leaf diseases from smartphone images. It classifies Healthy Leaves, Downy Mildew, and Powdery Mildew. It supports on-device image analysis, scan history, prediction confidence, multilingual UI, and theme customization.",
      problem: "Plant pathology diagnostics are traditionally inaccessible to rural farmers, resulting in preventable crop loss.",
      solution: "On-device computer vision classification delivering immediate offline diagnostic feedback and preventative treatment guidelines.",
      roleDescription: "Sadeem-owned venture initiative; led product definition, computer vision model adaptation, and mobile interface design.",
      seoTitle: "Cucu Leaf Scan | AI Agricultural Diagnostics by Sadeem",
      seoDescription: "Smart mobile application identifying cucumber leaf diseases via edge AI.",
    },
    create: {
      projectId: cucu.id,
      locale: "en",
      title: "Cucu Leaf Scan",
      tagline: "AI-powered agricultural diagnostics",
      categoryName: "AI & Computer Vision",
      shortDescription: "A smart mobile application that identifies cucumber leaf diseases from smartphone images.",
      fullDescription: "A smart mobile application that identifies cucumber leaf diseases from smartphone images. It classifies Healthy Leaves, Downy Mildew, and Powdery Mildew. It supports on-device image analysis, scan history, prediction confidence, multilingual UI, and theme customization.",
      problem: "Plant pathology diagnostics are traditionally inaccessible to rural farmers, resulting in preventable crop loss.",
      solution: "On-device computer vision classification delivering immediate offline diagnostic feedback and preventative treatment guidelines.",
      roleDescription: "Sadeem-owned venture initiative; led product definition, computer vision model adaptation, and mobile interface design.",
      seoTitle: "Cucu Leaf Scan | AI Agricultural Diagnostics by Sadeem",
      seoDescription: "Smart mobile application identifying cucumber leaf diseases via edge AI.",
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: cucu.id, locale: "ar" } },
    update: {
      title: "كوكو ليف سكان",
      tagline: "تشخيص زراعي فوري مدعوم بالذكاء الاصطناعي",
      categoryName: "الذكاء الاصطناعي والرؤية الحاسوبية",
      shortDescription: "تطبيق جوال ذكي لتشخيص أمراض أوراق الخيار فورياً من خلال صور الهواتف الذكية.",
      fullDescription: "تطبيق جوال ذكي يحدد أمراض أوراق الخيار من صور الهاتف الذكي. يصنف الأوراق السليمة، والبياض الزغبي، والبياض الدقيقي. يدعم تحليل الصور على الجهاز دون إنترنت، وسجل الفحوصات، ومستوى الثقة بالتنبؤ، وواجهة متعددة اللغات، وتخصيص المظهر.",
      problem: "صعوبة وصول المزارعين لتشخيص زراعي دقيق وسريع، مما يؤدي إلى تلف المحاصيل دون علاج مبكر.",
      solution: "نماذج رؤية حاسوبية تعمل على الهاتف مباشرة لتشخيص الأمراض وتقديم إرشادات وقائية فورية.",
      roleDescription: "مشروع ناشئ تحت مظلة سديم؛ تضمن العمل هندسة نماذج الذكاء الاصطناعي وتصميم تجربة المستخدم.",
      seoTitle: "كوكو ليف سكان | تشخيص زراعي بالذكاء الاصطناعي من سديم",
      seoDescription: "تطبيق ذكي لتشخيص أمراض النباتات بالرؤية الحاسوبية على الهاتف دون اتصال.",
    },
    create: {
      projectId: cucu.id,
      locale: "ar",
      title: "كوكو ليف سكان",
      tagline: "تشخيص زراعي فوري مدعوم بالذكاء الاصطناعي",
      categoryName: "الذكاء الاصطناعي والرؤية الحاسوبية",
      shortDescription: "تطبيق جوال ذكي لتشخيص أمراض أوراق الخيار فورياً من خلال صور الهواتف الذكية.",
      fullDescription: "تطبيق جوال ذكي يحدد أمراض أوراق الخيار من صور الهاتف الذكي. يصنف الأوراق السليمة، والبياض الزغبي، والبياض الدقيقي. يدعم تحليل الصور على الجهاز دون إنترنت، وسجل الفحوصات، ومستوى الثقة بالتنبؤ، وواجهة متعددة اللغات، وتخصيص المظهر.",
      problem: "صعوبة وصول المزارعين لتشخيص زراعي دقيق وسريع، مما يؤدي إلى تلف المحاصيل دون علاج مبكر.",
      solution: "نماذج رؤية حاسوبية تعمل على الهاتف مباشرة لتشخيص الأمراض وتقديم إرشادات وقائية فورية.",
      roleDescription: "مشروع ناشئ تحت مظلة سديم؛ تضمن العمل هندسة نماذج الذكاء الاصطناعي وتصميم تجربة المستخدم.",
      seoTitle: "كوكو ليف سكان | تشخيص زراعي بالذكاء الاصطناعي من سديم",
      seoDescription: "تطبيق ذكي لتشخيص أمراض النباتات بالرؤية الحاسوبية على الهاتف دون اتصال.",
    },
  });

  // Project 1 Tech Links
  await prisma.projectTechnology.deleteMany({ where: { projectId: cucu.id } });
  const cucuTech = ["flutter", "mobilenet-v2"];
  for (let index = 0; index < cucuTech.length; index++) {
    const slug = cucuTech[index];
    const techId = techMap.get(slug);
    if (techId) {
      await prisma.projectTechnology.create({
        data: { projectId: cucu.id, technologyId: techId, isCore: true, displayOrder: index },
      });
    }
  }

  // PROJECT 2: Wesal
  const wesal = await prisma.project.upsert({
    where: { slug: "wesal" },
    update: {
      type: ProjectType.WEB_PLATFORM,
      developmentStatus: DevelopmentStatus.BUILDING,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_VENTURE,
      sadeemRole: "Product Architecture & Full-Stack Development (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 2,
      accentColor: "#C28E62",
      year: 2024,
    },
    create: {
      slug: "wesal",
      type: ProjectType.WEB_PLATFORM,
      developmentStatus: DevelopmentStatus.BUILDING,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_VENTURE,
      sadeemRole: "Product Architecture & Full-Stack Development (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 2,
      accentColor: "#C28E62",
      year: 2024,
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: wesal.id, locale: "en" } },
    update: {
      title: "Wesal",
      tagline: "AI-powered interactive learning platform",
      categoryName: "EdTech & Interactive Learning",
      shortDescription: "An AI-powered interactive learning platform connecting teachers, students, and parents through engaging educational activities.",
      fullDescription: "An AI-powered interactive learning platform connecting teachers, students, and parents through engaging educational activities. Replaces fragmented academic communication tools with a dedicated, secure institutional system tailored for modern educational and operational environments.",
      problem: "Educational coordination is fragmented across legacy channels, causing administrative friction and disengaged students.",
      solution: "A unified digital platform facilitating synchronous interactive feeds, classroom assignments, and institutional transparency.",
      roleDescription: "Sadeem proprietary venture platform; engineered full-stack web infrastructure and live communication pipeline.",
      seoTitle: "Wesal | Interactive Learning Platform by Sadeem",
      seoDescription: "Next-generation educational platform connecting teachers, students, and parents.",
    },
    create: {
      projectId: wesal.id,
      locale: "en",
      title: "Wesal",
      tagline: "AI-powered interactive learning platform",
      categoryName: "EdTech & Interactive Learning",
      shortDescription: "An AI-powered interactive learning platform connecting teachers, students, and parents through engaging educational activities.",
      fullDescription: "An AI-powered interactive learning platform connecting teachers, students, and parents through engaging educational activities. Replaces fragmented academic communication tools with a dedicated, secure institutional system tailored for modern educational and operational environments.",
      problem: "Educational coordination is fragmented across legacy channels, causing administrative friction and disengaged students.",
      solution: "A unified digital platform facilitating synchronous interactive feeds, classroom assignments, and institutional transparency.",
      roleDescription: "Sadeem proprietary venture platform; engineered full-stack web infrastructure and live communication pipeline.",
      seoTitle: "Wesal | Interactive Learning Platform by Sadeem",
      seoDescription: "Next-generation educational platform connecting teachers, students, and parents.",
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: wesal.id, locale: "ar" } },
    update: {
      title: "وصال",
      tagline: "بنية تعليمية تفاعلية مدعومة بالذكاء الاصطناعي",
      categoryName: "تكنولوجيا التعليم والتواصل التفاعلي",
      shortDescription: "منصة تعليمية تفاعلية مدعومة بالذكاء الاصطناعي تربط المعلمين والطلاب وأولياء الأمور من خلال أنشطة تعليمية جذابة.",
      fullDescription: "منصة تعليمية تفاعلية مدعومة بالذكاء الاصطناعي تربط المعلمين والطلاب وأولياء الأمور من خلال أنشطة تعليمية تفاعلية. تستبدل قنوات التواصل المشتتة بنظام مؤسسي آمن ومخصص للبيئات التعليمية والتشغيلية الحديثة.",
      problem: "تشتت التواصل الأكاديمي وصعوبة متابعة تفاعل الطلاب عبر أدوات مراسلة غير متخصصة.",
      solution: "بيئة تعليمية رقمية موحدة تجمع التنسيق الصفي، والواجبات، ومتابعة أولياء الأمور.",
      roleDescription: "مشروع استوديو سديم؛ تضمن العمل البناء المعماري الكامل والواجهات التفاعلية.",
      seoTitle: "وصال | منصة التعليم التفاعلي من سديم",
      seoDescription: "بنية تعليمية رقمية متكاملة لربط المنظومة المدرسية.",
    },
    create: {
      projectId: wesal.id,
      locale: "ar",
      title: "وصال",
      tagline: "بنية تعليمية تفاعلية مدعومة بالذكاء الاصطناعي",
      categoryName: "تكنولوجيا التعليم والتواصل التفاعلي",
      shortDescription: "منصة تعليمية تفاعلية مدعومة بالذكاء الاصطناعي تربط المعلمين والطلاب وأولياء الأمور من خلال أنشطة تعليمية جذابة.",
      fullDescription: "منصة تعليمية تفاعلية مدعومة بالذكاء الاصطناعي تربط المعلمين والطلاب وأولياء الأمور من خلال أنشطة تعليمية تفاعلية. تستبدل قنوات التواصل المشتتة بنظام مؤسسي آمن ومخصص للبيئات التعليمية والتشغيلية الحديثة.",
      problem: "تشتت التواصل الأكاديمي وصعوبة متابعة تفاعل الطلاب عبر أدوات مراسلة غير متخصصة.",
      solution: "بيئة تعليمية رقمية موحدة تجمع التنسيق الصفي، والواجبات، ومتابعة أولياء الأمور.",
      roleDescription: "مشروع استوديو سديم؛ تضمن العمل البناء المعماري الكامل والواجهات التفاعلية.",
      seoTitle: "وصال | منصة التعليم التفاعلي من سديم",
      seoDescription: "بنية تعليمية رقمية متكاملة لربط المنظومة المدرسية.",
    },
  });

  // Project 2 Tech Links: Factual audited stack (Next.js)
  await prisma.projectTechnology.deleteMany({ where: { projectId: wesal.id } });
  const wesalTech = ["nextjs"];
  for (let index = 0; index < wesalTech.length; index++) {
    const slug = wesalTech[index];
    const techId = techMap.get(slug);
    if (techId) {
      await prisma.projectTechnology.create({
        data: { projectId: wesal.id, technologyId: techId, isCore: true, displayOrder: index },
      });
    }
  }

  // PROJECT 3: Tabadul (Strictly Documented: Collaborative initiative, partnership under discussion)
  const tabadul = await prisma.project.upsert({
    where: { slug: "tabadul" },
    update: {
      type: ProjectType.COLLABORATIVE_COMMERCE,
      developmentStatus: DevelopmentStatus.BUILDING,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.COLLABORATIVE_PARTNERSHIP,
      sadeemRole: "Collaborative system engineering & product architecture (Potential partnership under active discussion, not finalized)",
      partnershipStatus: PartnershipStatus.UNDER_DISCUSSION,
      featured: true,
      displayOrder: 3,
      accentColor: "#527C91",
      year: 2024,
    },
    create: {
      slug: "tabadul",
      type: ProjectType.COLLABORATIVE_COMMERCE,
      developmentStatus: DevelopmentStatus.BUILDING,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.COLLABORATIVE_PARTNERSHIP,
      sadeemRole: "Collaborative system engineering & product architecture (Potential partnership under active discussion, not finalized)",
      partnershipStatus: PartnershipStatus.UNDER_DISCUSSION,
      featured: true,
      displayOrder: 3,
      accentColor: "#527C91",
      year: 2024,
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: tabadul.id, locale: "en" } },
    update: {
      title: "Tabadul",
      tagline: "Collaborative commerce & loyalty platform",
      categoryName: "Commerce Ecosystem",
      shortDescription: "An e-commerce and loyalty platform connecting customers with local merchants.",
      fullDescription: "An e-commerce and loyalty platform connecting customers with local merchants. It supports product discovery, shopping, reward points, and discount redemption. (Collaborative project developed with an independent team; potential Sadeem partnership is currently in discussion and is not finalized).",
      problem: "Independent regional merchants struggle to maintain individual digital customer loyalty and unified product discovery.",
      solution: "A shared collaborative commerce protocol connecting retail inventories with reciprocal loyalty point redemption.",
      roleDescription: "Collaborative technical development with independent team. Strategic partnership currently under discussion.",
      seoTitle: "Tabadul | Collaborative Commerce & Loyalty",
      seoDescription: "Collaborative merchant network and customer loyalty exchange platform.",
    },
    create: {
      projectId: tabadul.id,
      locale: "en",
      title: "Tabadul",
      tagline: "Collaborative commerce & loyalty platform",
      categoryName: "Commerce Ecosystem",
      shortDescription: "An e-commerce and loyalty platform connecting customers with local merchants.",
      fullDescription: "An e-commerce and loyalty platform connecting customers with local merchants. It supports product discovery, shopping, reward points, and discount redemption. (Collaborative project developed with an independent team; potential Sadeem partnership is currently in discussion and is not finalized).",
      problem: "Independent regional merchants struggle to maintain individual digital customer loyalty and unified product discovery.",
      solution: "A shared collaborative commerce protocol connecting retail inventories with reciprocal loyalty point redemption.",
      roleDescription: "Collaborative technical development with independent team. Strategic partnership currently under discussion.",
      seoTitle: "Tabadul | Collaborative Commerce & Loyalty",
      seoDescription: "Collaborative merchant network and customer loyalty exchange platform.",
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: tabadul.id, locale: "ar" } },
    update: {
      title: "تبادل",
      tagline: "منصة تجارة تشاركية وشبكة ولاء موحدة",
      categoryName: "أنظمة التجارة وشبكات الولاء",
      shortDescription: "منصة تجارة إلكترونية وبرنامج ولاء تربط العملاء بالتجار المحليين.",
      fullDescription: "منصة للتجارة الإلكترونية وبرامج الولاء تربط العملاء بالتجار المحليين. تدعم استكشاف المنتجات، والتسوق، ونقاط المكافآت، واستبدال الخصومات. (مشروع تشاركي تم تطويره مع فريق مستقل؛ والشراكة الاستراتيجية المحتملة قيد المناقشة حالياً ولم يتم إبرامها بشكل نهائي).",
      problem: "صعوبة احتفاظ المتاجر المحلية ببرامج ولاء رقمية مجدية بشكل منفرد.",
      solution: "شبكة تجارية تشاركية تتيح للعملاء كسب واستبدال نقاط الولاء لدى شبكة من المتاجر المشاركة.",
      roleDescription: "تطوير تقني مشترك مع فريق مستقل؛ تخضع الشراكة الاستراتيجية للمناقشة والمفاضلة.",
      seoTitle: "تبادل | منصة التجارة التشاركية وشبكات الولاء",
      seoDescription: "منظومة للتجارة التشاركية وربط المتاجر المحلية ببرامج مكافآت مرنة.",
    },
    create: {
      projectId: tabadul.id,
      locale: "ar",
      title: "تبادل",
      tagline: "منصة تجارة تشاركية وشبكة ولاء موحدة",
      categoryName: "أنظمة التجارة وشبكات الولاء",
      shortDescription: "منصة تجارة إلكترونية وبرنامج ولاء تربط العملاء بالتجار المحليين.",
      fullDescription: "منصة للتجارة الإلكترونية وبرامج الولاء تربط العملاء بالتجار المحليين. تدعم استكشاف المنتجات، والتسوق، ونقاط المكافآت، واستبدال الخصومات. (مشروع تشاركي تم تطويره مع فريق مستقل؛ والشراكة الاستراتيجية المحتملة قيد المناقشة حالياً ولم يتم إبرامها بشكل نهائي).",
      problem: "صعوبة احتفاظ المتاجر المحلية ببرامج ولاء رقمية مجدية بشكل منفرد.",
      solution: "شبكة تجارية تشاركية تتيح للعملاء كسب واستبدال نقاط الولاء لدى شبكة من المتاجر المشاركة.",
      roleDescription: "تطوير تقني مشترك مع فريق مستقل؛ تخضع الشراكة الاستراتيجية للمناقشة والمفاضلة.",
      seoTitle: "تبادل | منصة التجارة التشاركية وشبكات الولاء",
      seoDescription: "منظومة للتجارة التشاركية وربط المتاجر المحلية ببرامج مكافآت مرنة.",
    },
  });

  // Project 3 Tech Links: Factual audited stack (ASP.NET, React.js, Flutter)
  await prisma.projectTechnology.deleteMany({ where: { projectId: tabadul.id } });
  const tabadulTech = ["aspnet", "react", "flutter"];
  for (let index = 0; index < tabadulTech.length; index++) {
    const slug = tabadulTech[index];
    const techId = techMap.get(slug);
    if (techId) {
      await prisma.projectTechnology.create({
        data: { projectId: tabadul.id, technologyId: techId, isCore: true, displayOrder: index },
      });
    }
  }

  // PROJECT 4: Lama School
  const lama = await prisma.project.upsert({
    where: { slug: "lama-school" },
    update: {
      type: ProjectType.ENTERPRISE_SYSTEM,
      developmentStatus: DevelopmentStatus.MVP,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_SYSTEM,
      sadeemRole: "Full-Lifecycle System Engineering (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 4,
      accentColor: "#C28E62",
      year: 2024,
    },
    create: {
      slug: "lama-school",
      type: ProjectType.ENTERPRISE_SYSTEM,
      developmentStatus: DevelopmentStatus.MVP,
      publicationStatus: PublicationStatus.DRAFT,
      ownershipType: OwnershipType.SADEEM_SYSTEM,
      sadeemRole: "Full-Lifecycle System Engineering (Sadeem-owned, subject to rights verification)",
      partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
      featured: true,
      displayOrder: 4,
      accentColor: "#C28E62",
      year: 2024,
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: lama.id, locale: "en" } },
    update: {
      title: "Lama School",
      tagline: "Multi-role academic operations management",
      categoryName: "Enterprise Academic Systems",
      shortDescription: "A school management system with dedicated administrator, teacher, student, and parent interfaces.",
      fullDescription: "A school management system with dedicated administrator, teacher, student, and parent interfaces. It supports school administration, lessons, assessments, student evaluation, study materials, and parental visibility into academic performance.",
      problem: "School administration involves cumbersome paperwork and fragmented records across administrative departments.",
      solution: "A unified role-based system consolidating grading, student records, fee tracking, and direct guardian communication.",
      roleDescription: "Sadeem Systems enterprise project; engineered scalable database models and dedicated portals for 4 stakeholder roles.",
      seoTitle: "Lama School | Academic Operations Suite by Sadeem",
      seoDescription: "Integrated role-based school management platform for modern academic institutions.",
    },
    create: {
      projectId: lama.id,
      locale: "en",
      title: "Lama School",
      tagline: "Multi-role academic operations management",
      categoryName: "Enterprise Academic Systems",
      shortDescription: "A school management system with dedicated administrator, teacher, student, and parent interfaces.",
      fullDescription: "A school management system with dedicated administrator, teacher, student, and parent interfaces. It supports school administration, lessons, assessments, student evaluation, study materials, and parental visibility into academic performance.",
      problem: "School administration involves cumbersome paperwork and fragmented records across administrative departments.",
      solution: "A unified role-based system consolidating grading, student records, fee tracking, and direct guardian communication.",
      roleDescription: "Sadeem Systems enterprise project; engineered scalable database models and dedicated portals for 4 stakeholder roles.",
      seoTitle: "Lama School | Academic Operations Suite by Sadeem",
      seoDescription: "Integrated role-based school management platform for modern academic institutions.",
    },
  });

  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: lama.id, locale: "ar" } },
    update: {
      title: "مدرسة لمى",
      tagline: "إدارة تشغيلية شاملة للمؤسسات المدرسية",
      categoryName: "أنظمة المؤسسات التعليمية وإدارة العمليات",
      shortDescription: "نظام إدارة مدرسية بواجهات مخصصة للمدير والمعلم والطالب وولي الأمر.",
      fullDescription: "نظام إدارة مدرسية بواجهات مخصصة لكل من المدير والمعلم والطالب وولي الأمر. يدعم الإدارة المدرسية، والدروس، والتقييمات، وسجلات الطلاب، والمواد الدراسية، واطلاع أولياء الأمور المباشر على الأداء الأكاديمي.",
      problem: "التعقيد الإداري وتراكم السجلات الورقية وصعوبة استخراج التقارير الأكاديمية الدقيقة.",
      solution: "منظومة إدارية موحدة تنظم رصد الدرجات وسجلات الحضور والرسوم والتواصل مع أولياء الأمور.",
      roleDescription: "تطوير نظام مؤسسي بواسطة سديم؛ تضمن هندسة قواعد البيانات وبناء واجهات مخصصة لكل فئة.",
      seoTitle: "مدرسة لمى | نظام الإدارة المدرسية الشامل من سديم",
      seoDescription: "نظام إداري وأكاديمي متكامل يربط أركان العملية التعليمية.",
    },
    create: {
      projectId: lama.id,
      locale: "ar",
      title: "مدرسة لمى",
      tagline: "إدارة تشغيلية شاملة للمؤسسات المدرسية",
      categoryName: "أنظمة المؤسسات التعليمية وإدارة العمليات",
      shortDescription: "نظام إدارة مدرسية بواجهات مخصصة للمدير والمعلم والطالب وولي الأمر.",
      fullDescription: "نظام إدارة مدرسية بواجهات مخصصة لكل من المدير والمعلم والطالب وولي الأمر. يدعم الإدارة المدرسية، والدروس، والتقييمات، وسجلات الطلاب، والمواد الدراسية، واطلاع أولياء الأمور المباشر على الأداء الأكاديمي.",
      problem: "التعقيد الإداري وتراكم السجلات الورقية وصعوبة استخراج التقارير الأكاديمية الدقيقة.",
      solution: "منظومة إدارية موحدة تنظم رصد الدرجات وسجلات الحضور والرسوم والتواصل مع أولياء الأمور.",
      roleDescription: "تطوير نظام مؤسسي بواسطة سديم؛ تضمن هندسة قواعد البيانات وبناء واجهات مخصصة لكل فئة.",
      seoTitle: "مدرسة لمى | نظام الإدارة المدرسية الشامل من سديم",
      seoDescription: "نظام إداري وأكاديمي متكامل يربط أركان العملية التعليمية.",
    },
  });

  // Project 4 Tech Links: Factual audited stack (Next.js, TypeScript)
  await prisma.projectTechnology.deleteMany({ where: { projectId: lama.id } });
  const lamaTech = ["nextjs", "typescript"];
  for (let index = 0; index < lamaTech.length; index++) {
    const slug = lamaTech[index];
    const techId = techMap.get(slug);
    if (techId) {
      await prisma.projectTechnology.create({
        data: { projectId: lama.id, technologyId: techId, isCore: true, displayOrder: index },
      });
    }
  }

  console.log("✅ Seeded 4 canonical projects with bilingual draft translations and tech relations");

  // ---------------------------------------------------------------------------
  // 3. Essential Non-Secret Site Settings
  // ---------------------------------------------------------------------------
  const defaultSettings = [
    { key: "site_name_en", value: "Sadeem", description: "Studio Brand Name (English)" },
    { key: "site_name_ar", value: "سديم", description: "Studio Brand Name (Arabic)" },
    { key: "contact_email", value: "hello@sadeem.studio", description: "Studio Primary Contact Email" },
    { key: "tagline_en", value: "We build systems. We turn ideas into companies.", description: "Brand Tagline (English)" },
    { key: "tagline_ar", value: "نبني الأنظمة. نحوّل الأفكار إلى شركات.", description: "Brand Tagline (Arabic)" },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description, isPublic: true },
    });
  }
  console.log(`✅ Seeded ${defaultSettings.length} site settings`);

  console.log("🚀 Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
