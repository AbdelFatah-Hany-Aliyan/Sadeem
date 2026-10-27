"use client";

import { useState } from "react";
import { AdminRole, MediaType } from "@prisma/client";
import { MediaLibraryItemSummary } from "@/lib/services/mediaService";
import { StorageStatus } from "@/lib/storage/storageProvider";
import { 
  uploadMediaAction, 
  createMediaRecordAction,
  associateMediaAction, 
  disassociateMediaAction, 
  deleteMediaAction,
  updateMediaTranslationsAction
} from "@/app/admin/actions";
import { 
  Upload, 
  Image as ImageIcon, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Link as LinkIcon, 
  Unlink, 
  Layers, 
  Star,
  Info,
  Plus
} from "lucide-react";

interface MediaLibraryViewProps {
  initialItems: MediaLibraryItemSummary[];
  storageStatus: StorageStatus;
  projects: { id: string; slug: string; name: string }[];
  userRole: AdminRole;
}

export default function MediaLibraryView({
  initialItems,
  storageStatus,
  projects,
  userRole,
}: MediaLibraryViewProps) {
  const [items, setItems] = useState<MediaLibraryItemSummary[]>(initialItems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states for manual registration / seeded assets
  const [newStorageKey, setNewStorageKey] = useState("");
  const [newPublicUrl, setNewPublicUrl] = useState("");
  const [newAltTextEn, setNewAltTextEn] = useState("");
  const [newAltTextAr, setNewAltTextAr] = useState("");
  const [newCaptionEn, setNewCaptionEn] = useState("");
  const [newCaptionAr, setNewCaptionAr] = useState("");
  const [newMediaType, setNewMediaType] = useState<MediaType>(MediaType.DIAGRAM);
  const [newProjectId, setNewProjectId] = useState<string>("");
  const [newIsCover, setNewIsCover] = useState(false);

  const canDelete = userRole === AdminRole.SUPER_ADMIN;

  const handleAssociate = async (mediaId: string, projectId: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await associateMediaAction(mediaId, projectId);
      if (res.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === mediaId
              ? {
                  ...item,
                  projectId,
                  projectName: projects.find((p) => p.id === projectId)?.name || projectId,
                }
              : item
          )
        );
        setFeedback({ type: "success", message: "Media associated with project." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to associate media." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisassociate = async (mediaId: string, projectId?: string | null) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await disassociateMediaAction(mediaId, projectId || undefined);
      if (res.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === mediaId
              ? { ...item, projectId: null, projectName: undefined, isCover: false }
              : item
          )
        );
        setFeedback({ type: "success", message: "Asset disassociated from project (preserved in library)." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to disassociate media." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Permanently delete this media asset from database and storage?")) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await deleteMediaAction(mediaId);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== mediaId));
        setFeedback({ type: "success", message: "Media asset deleted." });
      } else {
        setFeedback({ type: "error", message: res.error || res.errors?.[0] || "Failed to delete media." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await createMediaRecordAction({
        storageKey: newStorageKey.trim(),
        publicUrl: newPublicUrl.trim() || undefined,
        altTextEn: newAltTextEn.trim(),
        altTextAr: newAltTextAr.trim(),
        captionEn: newCaptionEn.trim() || undefined,
        captionAr: newCaptionAr.trim() || undefined,
        mediaType: newMediaType,
        projectId: newProjectId || undefined,
        isCover: newIsCover,
      });

      if (res.success) {
        setFeedback({ type: "success", message: "Media asset registered successfully." });
        setShowAddModal(false);
        // Reset form
        setNewStorageKey("");
        setNewPublicUrl("");
        setNewAltTextEn("");
        setNewAltTextAr("");
        // Reload or append item
        window.location.reload();
      } else {
        setFeedback({ type: "error", message: res.error || res.errors?.[0] || "Failed to register asset." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* STORAGE PROVIDER STATUS BANNER */}
      {!storageStatus.configured ? (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="text-sm font-mono font-bold text-amber-500 uppercase tracking-wider mb-1">
                  Object Storage: Unconfigured (Direct Uploads Blocked)
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  External S3/Cloudflare R2 credentials are not set in <code className="text-foreground">.env</code>. 
                  Direct binary file uploads are safely blocked. You can still manage existing assets, diagrams, and project gallery associations.
                </p>
                <div className="mt-2 text-[11px] font-mono text-muted/80">
                  Required for production S3/R2 uploads:{" "}
                  <span className="text-amber-400 font-bold">
                    STORAGE_PROVIDER, STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus size={14} />
              <span>Link Media Asset</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={16} />
            <span>
              External Object Storage Active: <strong>{storageStatus.provider}</strong> (Bucket: {storageStatus.bucket})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-bold hover:bg-accent-hover transition-colors"
          >
            Upload / Add Asset
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-red-500/10 border-red-500/40 text-red-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Media Assets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted">
            Media Library Catalog ({items.length} assets)
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-border bg-surface/50 text-muted font-mono text-xs">
            No media assets registered in the library yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-surface/80 p-5 flex flex-col justify-between hover:border-accent/40 transition-colors shadow-sm"
              >
                <div>
                  {/* Thumbnail / Visual Box */}
                  <div className="aspect-video rounded-xl bg-background border border-border/80 flex flex-col items-center justify-center p-4 text-center mb-4 relative overflow-hidden">
                    {item.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.publicUrl}
                        alt={item.altTextEn}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-lg border border-border bg-surface flex items-center justify-center text-accent mb-2">
                          <Layers size={20} />
                        </div>
                        <span className="text-[11px] font-mono text-muted/60">{item.originalFilename || item.storageKey}</span>
                      </div>
                    )}

                    {item.isCover && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Star size={10} /> Cover
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-accent uppercase tracking-wider font-bold">{item.mediaType}</span>
                      <span className="text-muted/60">{item.mimeType || "image"}</span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground truncate" title={item.altTextEn}>
                      {item.altTextEn}
                    </h3>
                    <p className="text-xs text-muted/80 truncate font-arabic" dir="rtl" title={item.altTextAr}>
                      {item.altTextAr}
                    </p>
                  </div>

                  {/* Project Association Status */}
                  <div className="p-3 rounded-xl border border-border bg-background/50 text-xs font-mono space-y-2 mb-4">
                    <div className="text-muted text-[11px]">Associated Project:</div>
                    {item.projectId ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground font-semibold truncate">
                          {item.projectName || item.projectSlug}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDisassociate(item.id, item.projectId)}
                          disabled={loading}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                          title="Remove from project without deleting asset"
                        >
                          <Unlink size={11} />
                          <span>Detach</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="text-muted/60 italic text-[11px]">Unassigned (Library only)</span>
                        <select
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs focus:border-accent focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value) handleAssociate(item.id, e.target.value);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to project...</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span className="text-muted/50 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors"
                      title="Delete asset permanently"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / LINK MEDIA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ImageIcon size={18} className="text-accent" />
                Register / Link Media Asset
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-muted uppercase">Storage Key / Relative Path *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. media/projects/cucu/architecture.svg"
                  value={newStorageKey}
                  onChange={(e) => setNewStorageKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted uppercase">Public CDN / Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newPublicUrl}
                  onChange={(e) => setNewPublicUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted uppercase">Media Type</label>
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as MediaType)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                  >
                    <option value={MediaType.DIAGRAM}>DIAGRAM</option>
                    <option value={MediaType.SCREENSHOT}>SCREENSHOT</option>
                    <option value={MediaType.COVER_IMAGE}>COVER_IMAGE</option>
                    <option value={MediaType.LOGO}>LOGO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-muted uppercase">Assign Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                  >
                    <option value="">Unassigned (Library Only)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted uppercase">English Alt Text (Accessibility) *</label>
                <input
                  type="text"
                  required
                  placeholder="Describe image in English..."
                  value={newAltTextEn}
                  onChange={(e) => setNewAltTextEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1" dir="rtl">
                <label className="text-muted uppercase">النص البديل بالعربية (لإمكانية الوصول) *</label>
                <input
                  type="text"
                  required
                  placeholder="وصف العنصر البصري بالعربية..."
                  value={newAltTextAr}
                  onChange={(e) => setNewAltTextAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newIsCover"
                  checked={newIsCover}
                  onChange={(e) => setNewIsCover(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="newIsCover" className="text-muted">
                  Set as project cover image
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-background transition-colors text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-accent text-accent-foreground font-bold hover:bg-accent-hover transition-colors shadow-md disabled:opacity-50"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
