"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Project, PublicationStatus, DevelopmentStatus, ProjectType, AdminRole } from "@prisma/client";
import { togglePublicationAction, archiveProjectAction } from "@/app/admin/actions";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Edit3, 
  Globe, 
  FileText, 
  Archive, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

interface AdminProjectItem extends Project {
  translations: { locale: string; title: string; categoryName: string }[];
  technologies: { technology: { name: string } }[];
}

interface ProjectTableProps {
  initialProjects: AdminProjectItem[];
  userRole: AdminRole;
}

export function ProjectTable({ initialProjects, userRole }: ProjectTableProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);

  const canPublish = userRole === AdminRole.SUPER_ADMIN;

  const filteredProjects = projects.filter((p) => {
    const enTrans = p.translations.find((t) => t.locale === "en");
    const arTrans = p.translations.find((t) => t.locale === "ar");

    const matchesSearch =
      searchTerm === "" ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enTrans && enTrans.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (arTrans && arTrans.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || p.publicationStatus === statusFilter;

    const matchesType =
      typeFilter === "ALL" || p.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleTogglePublication = (id: string, currentStatus: PublicationStatus) => {
    if (!canPublish) {
      alert("Only SUPER_ADMIN users can publish or unpublish projects.");
      return;
    }

    const nextStatus =
      currentStatus === PublicationStatus.PUBLISHED
        ? PublicationStatus.DRAFT
        : PublicationStatus.PUBLISHED;

    const confirmMsg =
      nextStatus === PublicationStatus.PUBLISHED
        ? "Are you sure you want to PUBLISH this project to the live public website?"
        : "Are you sure you want to return this project to DRAFT status?";

    if (!confirm(confirmMsg)) return;

    setErrorMsg(null);
    setValidationErrors(null);
    setActiveActionId(id);

    startTransition(async () => {
      const res = await togglePublicationAction(id, nextStatus);
      setActiveActionId(null);

      if (!res.success) {
        if (res.errors) {
          setValidationErrors(res.errors);
        } else {
          setErrorMsg(res.error || "Failed to update publication status.");
        }
      } else {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, publicationStatus: nextStatus } : item
          )
        );
      }
    });
  };

  const handleArchive = (id: string) => {
    if (!canPublish) {
      alert("Only SUPER_ADMIN users can archive projects.");
      return;
    }

    if (!confirm("Are you sure you want to ARCHIVE this project?")) return;

    setErrorMsg(null);
    setValidationErrors(null);
    setActiveActionId(id);

    startTransition(async () => {
      const res = await archiveProjectAction(id);
      setActiveActionId(null);

      if (!res.success) {
        setErrorMsg(res.error || "Failed to archive project.");
      } else {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, publicationStatus: PublicationStatus.ARCHIVED } : item
          )
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Validation / Action Errors Popover */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            <AlertCircle size={16} />
            <span>Publication Validation Failed (Cannot Publish)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-red-300">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-surface/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs font-mono">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name or slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background/80 text-foreground text-xs font-mono placeholder:text-muted/40 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted">
            <Filter size={14} />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-muted">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Types</option>
              <option value="MOBILE_APPLICATION">Mobile App</option>
              <option value="WEB_PLATFORM">Web Platform</option>
              <option value="COLLABORATIVE_COMMERCE">Commerce</option>
              <option value="ENTERPRISE_SYSTEM">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-border bg-surface/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-background/60 text-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Order</th>
                <th className="py-3.5 px-6">Project / Slug</th>
                <th className="py-3.5 px-6">Dev Status</th>
                <th className="py-3.5 px-6">Publication</th>
                <th className="py-3.5 px-6">Technologies</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProjects.map((p) => {
                const en = p.translations.find((t) => t.locale === "en");
                const isWorking = isPending && activeActionId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-4 px-6 text-muted font-bold">
                      0{p.displayOrder}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground text-sm">
                        {en?.title || p.slug}
                      </div>
                      <div className="text-muted text-[11px] font-mono">
                        {p.slug} • {p.type}
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                        style={{
                          borderColor: p.accentColor || "#C28E62",
                          color: p.accentColor || "#C28E62",
                          backgroundColor: `${p.accentColor || "#C28E62"}15`
                        }}
                      >
                        {p.developmentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      {p.publicationStatus === "PUBLISHED" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          PUBLISHED
                        </span>
                      ) : p.publicationStatus === "DRAFT" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          DRAFT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted/20 text-muted border border-border">
                          ARCHIVED
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.technologies.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted">
                            {t.technology.name}
                          </span>
                        ))}
                        {p.technologies.length > 3 && (
                          <span className="text-[10px] text-muted/60">
                            +{p.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* Preview link */}
                        <Link
                          href={`/work-preview/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-accent hover:border-accent transition-colors"
                          title="Internal Preview"
                        >
                          <ExternalLink size={13} />
                        </Link>

                        {/* Edit link */}
                        <Link
                          href={`/admin/projects/${p.id}/edit`}
                          className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:border-accent transition-colors"
                          title="Edit Project"
                        >
                          <Edit3 size={13} />
                        </Link>

                        {/* Publish / Unpublish Toggle (SUPER_ADMIN only) */}
                        {canPublish && (
                          <button
                            onClick={() => handleTogglePublication(p.id, p.publicationStatus)}
                            disabled={isWorking}
                            className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold transition-colors flex items-center gap-1 ${
                              p.publicationStatus === "PUBLISHED"
                                ? "border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                                : "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                            }`}
                            title={p.publicationStatus === "PUBLISHED" ? "Unpublish to Draft" : "Validate & Publish"}
                          >
                            {isWorking ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : p.publicationStatus === "PUBLISHED" ? (
                              "Unpublish"
                            ) : (
                              "Publish"
                            )}
                          </button>
                        )}

                        {/* Archive button */}
                        {canPublish && p.publicationStatus !== "ARCHIVED" && (
                          <button
                            onClick={() => handleArchive(p.id)}
                            disabled={isWorking}
                            className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                            title="Archive Project"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No matching projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
