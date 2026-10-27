"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ProjectType, 
  DevelopmentStatus, 
  OwnershipType, 
  PartnershipStatus,
  Technology 
} from "@prisma/client";
import { createProjectAction, updateProjectAction } from "@/app/admin/actions";
import { ProjectFormData } from "@/lib/services/adminProjectService";
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Languages, 
  Cpu, 
  ShieldAlert,
  Image as ImageIcon,
  Star,
  Layers,
  Unlink,
  ExternalLink 
} from "lucide-react";

interface ProjectFormProps {
  initialData?: any;
  availableTechnologies: Technology[];
  isEditMode?: boolean;
}

export function ProjectForm({
  initialData,
  availableTechnologies,
  isEditMode = false,
}: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "en" | "ar" | "tech" | "media">("general");

  const enTrans = initialData?.translations?.find((t: any) => t.locale === "en");
  const arTrans = initialData?.translations?.find((t: any) => t.locale === "ar");

  // Form State
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [type, setType] = useState<ProjectType>(initialData?.type || ProjectType.WEB_PLATFORM);
  const [developmentStatus, setDevelopmentStatus] = useState<DevelopmentStatus>(
    initialData?.developmentStatus || DevelopmentStatus.BUILDING
  );
  const [ownershipType, setOwnershipType] = useState<OwnershipType>(
    initialData?.ownershipType || OwnershipType.SADEEM_VENTURE
  );
  const [sadeemRole, setSadeemRole] = useState(initialData?.sadeemRole || "");
  const [partnershipStatus, setPartnershipStatus] = useState<PartnershipStatus>(
    initialData?.partnershipStatus || PartnershipStatus.NOT_APPLICABLE
  );
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? true);
  const [displayOrder, setDisplayOrder] = useState<number>(initialData?.displayOrder ?? 1);
  const [year, setYear] = useState<number>(initialData?.year ?? 2024);
  const [accentColor, setAccentColor] = useState(initialData?.accentColor || "#C28E62");

  // English Fields
  const [enTitle, setEnTitle] = useState(enTrans?.title || "");
  const [enTagline, setEnTagline] = useState(enTrans?.tagline || "");
  const [enCategory, setEnCategory] = useState(enTrans?.categoryName || "");
  const [enShortDescription, setEnShortDescription] = useState(enTrans?.shortDescription || "");
  const [enFullDescription, setEnFullDescription] = useState(enTrans?.fullDescription || "");
  const [enProblem, setEnProblem] = useState(enTrans?.problem || "");
  const [enSolution, setEnSolution] = useState(enTrans?.solution || "");
  const [enRoleDescription, setEnRoleDescription] = useState(enTrans?.roleDescription || "");

  // Arabic Fields
  const [arTitle, setArTitle] = useState(arTrans?.title || "");
  const [arTagline, setArTagline] = useState(arTrans?.tagline || "");
  const [arCategory, setArCategory] = useState(arTrans?.categoryName || "");
  const [arShortDescription, setArShortDescription] = useState(arTrans?.shortDescription || "");
  const [arFullDescription, setArFullDescription] = useState(arTrans?.fullDescription || "");
  const [arProblem, setArProblem] = useState(arTrans?.problem || "");
  const [arSolution, setArSolution] = useState(arTrans?.solution || "");
  const [arRoleDescription, setArRoleDescription] = useState(arTrans?.roleDescription || "");

  // Selected Technologies
  const initialTechSlugs = (initialData?.technologies || []).map((t: any) => t.technology.slug);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(initialTechSlugs);

  const toggleTech = (techSlug: string) => {
    setSelectedTechs((prev) =>
      prev.includes(techSlug)
        ? prev.filter((s) => s !== techSlug)
        : [...prev, techSlug]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData: ProjectFormData = {
      slug: slug.trim(),
      type,
      developmentStatus,
      ownershipType,
      sadeemRole: sadeemRole.trim(),
      partnershipStatus,
      featured,
      displayOrder: Number(displayOrder),
      year: Number(year),
      accentColor: accentColor.trim(),

      enTitle: enTitle.trim(),
      enTagline: enTagline.trim() || undefined,
      enCategory: enCategory.trim(),
      enShortDescription: enShortDescription.trim(),
      enFullDescription: enFullDescription.trim(),
      enProblem: enProblem.trim() || undefined,
      enSolution: enSolution.trim() || undefined,
      enRoleDescription: enRoleDescription.trim() || undefined,

      arTitle: arTitle.trim(),
      arTagline: arTagline.trim() || undefined,
      arCategory: arCategory.trim(),
      arShortDescription: arShortDescription.trim(),
      arFullDescription: arFullDescription.trim(),
      arProblem: arProblem.trim() || undefined,
      arSolution: arSolution.trim() || undefined,
      arRoleDescription: arRoleDescription.trim() || undefined,

      technologySlugs: selectedTechs,
    };

    startTransition(async () => {
      let res;
      if (isEditMode) {
        res = await updateProjectAction(initialData.id, formData);
      } else {
        res = await createProjectAction(formData);
      }

      if (!res.success) {
        setErrorMsg(res.error || "An error occurred during submission.");
      } else {
        setSuccessMsg(isEditMode ? "Project successfully updated!" : "Project successfully created!");
        if (!isEditMode) {
          setTimeout(() => {
            router.push("/admin/projects");
          }, 1200);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Feedback Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-border text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors ${
            activeTab === "general"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          General & Architecture
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("en")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "en"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <span>🇬🇧 English Content</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ar")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "ar"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <span>🇸🇦 Arabic Content</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tech")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "tech"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Cpu size={14} />
          <span>Technologies ({selectedTechs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "media"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <ImageIcon size={14} />
          <span>Media & Gallery ({initialData?.media?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface/70 p-8 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Project Canonical Slug (URL) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="e.g. cucu-leaf-scan"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted/60 mt-1 block">Used for routing: /work/[slug]</span>
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Project Classification Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="WEB_PLATFORM">Web Platform</option>
                <option value="MOBILE_APPLICATION">Mobile Application</option>
                <option value="COLLABORATIVE_COMMERCE">Collaborative Commerce</option>
                <option value="ENTERPRISE_SYSTEM">Enterprise System</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Development Status *
              </label>
              <select
                value={developmentStatus}
                onChange={(e) => setDevelopmentStatus(e.target.value as DevelopmentStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="MVP">MVP (Minimal Viable Product)</option>
                <option value="BUILDING">BUILDING (In Engineering)</option>
                <option value="LIVE">LIVE (Operational System)</option>
                <option value="CONCEPT">CONCEPT (Venture Research)</option>
              </select>
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Ownership Model *
              </label>
              <select
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value as OwnershipType)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="SADEEM_VENTURE">Sadeem Venture (Proprietary)</option>
                <option value="SADEEM_SYSTEM">Sadeem System (Internal/Core)</option>
                <option value="COLLABORATIVE_PARTNERSHIP">Collaborative Partnership</option>
                <option value="CLIENT_SYSTEM">Client Solution</option>
              </select>
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Partnership Status *
              </label>
              <select
                value={partnershipStatus}
                onChange={(e) => setPartnershipStatus(e.target.value as PartnershipStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="NOT_APPLICABLE">Not Applicable (Proprietary)</option>
                <option value="UNDER_DISCUSSION">Under Active Discussion (Not Finalized)</option>
                <option value="CONFIRMED">Confirmed / Executed</option>
                <option value="DISSOLVED">Dissolved</option>
              </select>
              {slug === "tabadul" && (
                <div className="mt-2 text-[10px] text-steel flex items-center gap-1">
                  <ShieldAlert size={12} />
                  <span>Tabadul partnership terms must remain UNDER_DISCUSSION until formal execution.</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Sadeem Documented Role / Contribution *
              </label>
              <input
                type="text"
                required
                value={sadeemRole}
                onChange={(e) => setSadeemRole(e.target.value)}
                placeholder="e.g. Design, Product Strategy & AI Engineering"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Display Order (1..N) *
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Establishment Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENGLISH CONTENT */}
      {activeTab === "en" && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface/70 p-8 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                English Title *
              </label>
              <input
                type="text"
                required
                value={enTitle}
                onChange={(e) => setEnTitle(e.target.value)}
                placeholder="e.g. Cucu Leaf Scan"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                English Category Name *
              </label>
              <input
                type="text"
                required
                value={enCategory}
                onChange={(e) => setEnCategory(e.target.value)}
                placeholder="e.g. AI & Computer Vision"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted uppercase tracking-wider mb-2">
              English Tagline
            </label>
            <input
              type="text"
              value={enTagline}
              onChange={(e) => setEnTagline(e.target.value)}
              placeholder="e.g. AI-powered agricultural diagnostics"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-muted uppercase tracking-wider mb-2">
              English Short Description (Card Summary) *
            </label>
            <textarea
              rows={3}
              required
              value={enShortDescription}
              onChange={(e) => setEnShortDescription(e.target.value)}
              placeholder="Concise 1-2 sentence overview for cards..."
              className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-muted uppercase tracking-wider mb-2">
              English Full Description (Case Study Narrative) *
            </label>
            <textarea
              rows={5}
              required
              value={enFullDescription}
              onChange={(e) => setEnFullDescription(e.target.value)}
              placeholder="Detailed case study narrative..."
              className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Problem Statement (Optional)
              </label>
              <textarea
                rows={3}
                value={enProblem}
                onChange={(e) => setEnProblem(e.target.value)}
                placeholder="The operational challenge addressed..."
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                Solution & Approach (Optional)
              </label>
              <textarea
                rows={3}
                value={enSolution}
                onChange={(e) => setEnSolution(e.target.value)}
                placeholder="Sadeem's engineering approach..."
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ARABIC CONTENT */}
      {activeTab === "ar" && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface/70 p-8 text-xs font-mono" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                العنوان بالعربية *
              </label>
              <input
                type="text"
                required
                value={arTitle}
                onChange={(e) => setArTitle(e.target.value)}
                placeholder="مثال: كوكو ليف سكان"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                تصنيف المشروع بالعربية *
              </label>
              <input
                type="text"
                required
                value={arCategory}
                onChange={(e) => setArCategory(e.target.value)}
                placeholder="مثال: الذكاء الاصطناعي والرؤية الحاسوبية"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="text-right">
            <label className="block text-muted uppercase tracking-wider mb-2">
              الشعار المختصر بالعربية
            </label>
            <input
              type="text"
              value={arTagline}
              onChange={(e) => setArTagline(e.target.value)}
              placeholder="مثال: تشخيص زراعي فوري مدعوم بالذكاء الاصطناعي"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="text-right">
            <label className="block text-muted uppercase tracking-wider mb-2">
              الوصف الموجز بالعربية (للبطاقات) *
            </label>
            <textarea
              rows={3}
              required
              value={arShortDescription}
              onChange={(e) => setArShortDescription(e.target.value)}
              placeholder="وصف مختصر من سطرين إلى ثلاثة..."
              className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="text-right">
            <label className="block text-muted uppercase tracking-wider mb-2">
              الوصف التفصيلي بالعربية (لدراسة الحالة) *
            </label>
            <textarea
              rows={5}
              required
              value={arFullDescription}
              onChange={(e) => setArFullDescription(e.target.value)}
              placeholder="السرد الكامل لدراسة الحالة..."
              className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border text-right">
            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                التحدي والمشكلة (اختياري)
              </label>
              <textarea
                rows={3}
                value={arProblem}
                onChange={(e) => setArProblem(e.target.value)}
                placeholder="التحدي الواقعي القائم..."
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted uppercase tracking-wider mb-2">
                الحل والمنهجية الهندسية (اختياري)
              </label>
              <textarea
                rows={3}
                value={arSolution}
                onChange={(e) => setArSolution(e.target.value)}
                placeholder="الحل التقني الذي تم بناؤه..."
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TECHNOLOGIES */}
      {activeTab === "tech" && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface/70 p-8 text-xs font-mono">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">
              Select Verified Technologies
            </h3>
            <p className="text-muted mb-6">
              Only select technologies that have been verified in the project&apos;s actual code and architecture.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableTechnologies.map((tech) => {
                const isSelected = selectedTechs.includes(tech.slug);
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => toggleTech(tech.slug)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 text-accent font-bold"
                        : "border-border bg-background text-muted hover:border-border/80"
                    }`}
                  >
                    <span>{tech.name}</span>
                    <span className="text-[10px] text-muted/60">{tech.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MEDIA & GALLERY */}
      {activeTab === "media" && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface/70 p-8 text-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
                Project Media & Gallery Assets
              </h2>
              <p className="text-muted text-xs">
                Manage cover image and gallery screenshots attached to this project.
              </p>
            </div>

            <Link
              href="/admin/media"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span>Open Media Library</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          {!isEditMode ? (
            <div className="p-8 text-center rounded-xl border border-border bg-background/50 text-muted">
              Please create and save this project draft first before associating media and gallery assets.
            </div>
          ) : !initialData?.media || initialData.media.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-border bg-background/50 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-lg border border-border bg-surface flex items-center justify-center text-muted">
                <ImageIcon size={20} />
              </div>
              <p className="text-muted">No media assets are currently attached to this project.</p>
              <Link
                href="/admin/media"
                className="inline-flex items-center gap-1 text-accent hover:underline font-bold"
              >
                Go to Studio Media Library to link or register media →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initialData.media.map((item: any) => {
                const enAlt = item.translations?.find((t: any) => t.locale === "en")?.altText || item.storageKey;
                const arAlt = item.translations?.find((t: any) => t.locale === "ar")?.altText;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-background/70 space-y-3 relative overflow-hidden"
                  >
                    <div className="aspect-video rounded-lg bg-surface flex items-center justify-center text-muted border border-border/50 relative overflow-hidden">
                      {item.publicUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.publicUrl}
                          alt={enAlt}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Layers size={22} className="text-accent mb-1" />
                          <span className="text-[10px] text-muted/60">{item.storageKey}</span>
                        </div>
                      )}

                      {item.isCover && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Star size={10} /> Cover
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-accent uppercase font-bold">{item.mediaType}</div>
                      <div className="font-bold text-foreground text-xs truncate">{enAlt}</div>
                      {arAlt && (
                        <div className="text-muted/80 text-xs truncate font-arabic" dir="rtl">{arAlt}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/admin/projects"
          className="px-4 py-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground text-xs font-mono transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Projects</span>
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md flex items-center gap-2 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Saving Project...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>{isEditMode ? "Save Changes" : "Create Project"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
