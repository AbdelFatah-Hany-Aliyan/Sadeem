"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Inquiry, 
  InquiryStatus, 
  InquiryType, 
  AdminRole, 
  ContactChannel,
  ProjectCategory,
  VentureStage,
  ExpectedTimeline,
  BudgetRange
} from "@prisma/client";
import { 
  updateInquiryStatusAction, 
  assignInquiryAction, 
  updateInquiryNotesAction,
  archiveInquiryAction 
} from "@/app/admin/actions";
import { 
  ArrowLeft, 
  Building2, 
  Rocket, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Archive, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Loader2
} from "lucide-react";

interface AdminUserOption {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

interface InquiryDetailProps {
  inquiry: Inquiry & {
    assignedTo: { id: string; name: string; email: string; role: AdminRole } | null;
  };
  currentUserRole: AdminRole;
  adminUsers: AdminUserOption[];
}

export function InquiryDetailView({
  inquiry,
  currentUserRole,
  adminUsers,
}: InquiryDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [assignedToId, setAssignedToId] = useState<string>(inquiry.assignedToId || "");
  const [internalNotes, setInternalNotes] = useState<string>(inquiry.internalNotes || "");
  const [followUpDate, setFollowUpDate] = useState<string>(
    inquiry.followUpDate ? new Date(inquiry.followUpDate).toISOString().split("T")[0] : ""
  );

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);

  const canArchive = currentUserRole === AdminRole.SUPER_ADMIN;
  const isArabic = inquiry.locale === "ar";

  // Handlers
  const handleStatusChange = async (newStatus: InquiryStatus) => {
    setStatus(newStatus);
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await updateInquiryStatusAction(inquiry.id, newStatus);
      if (!res.success) {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to update status." });
      } else {
        setFeedbackMsg({ type: "success", text: `Status updated to ${newStatus}.` });
        router.refresh();
      }
    });
  };

  const handleAssigneeChange = async (newUserId: string) => {
    setAssignedToId(newUserId);
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await assignInquiryAction(inquiry.id, newUserId || null);
      if (!res.success) {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to assign inquiry." });
      } else {
        setFeedbackMsg({ type: "success", text: "Team assignment updated successfully." });
        router.refresh();
      }
    });
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setFeedbackMsg(null);
    try {
      const dateObj = followUpDate ? new Date(followUpDate) : null;
      const res = await updateInquiryNotesAction(inquiry.id, internalNotes, dateObj);
      if (!res.success) {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to save internal notes." });
      } else {
        setFeedbackMsg({ type: "success", text: "Internal notes and follow-up date saved." });
        router.refresh();
      }
    } finally {
      setNotesSaving(false);
    }
  };

  const handleArchive = async (permanent: boolean) => {
    if (!canArchive) {
      alert("Only SUPER_ADMIN can perform this action.");
      return;
    }
    const msg = permanent
      ? "PERMANENT DELETION: Are you sure you want to permanently erase this lead? This action cannot be undone."
      : "Are you sure you want to archive this lead?";
    if (!confirm(msg)) return;

    startTransition(async () => {
      const res = await archiveInquiryAction(inquiry.id, permanent);
      if (!res.success) {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to process request." });
      } else {
        router.push("/admin/inquiries");
      }
    });
  };

  const getTypeBadge = (type: InquiryType) => {
    switch (type) {
      case InquiryType.BUSINESS_PROJECT:
      case InquiryType.BUSINESS_SYSTEM:
        return {
          icon: <Building2 size={16} className="text-emerald-400" />,
          label: "Business Project (Start a Project)",
          style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        };
      case InquiryType.VENTURE_PITCH:
      case InquiryType.PARTNERSHIP:
        return {
          icon: <Rocket size={16} className="text-purple-400" />,
          label: "Venture Pitch (Pitch an Idea)",
          style: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        };
      default:
        return {
          icon: <Mail size={16} className="text-blue-400" />,
          label: "General Inquiry",
          style: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        };
    }
  };

  const typeBadge = getTypeBadge(inquiry.inquiryType);

  return (
    <div className="space-y-8 pb-16">
      {/* Back button and title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inquiries"
            className="p-2 rounded-xl bg-surface border border-border hover:border-accent text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft size={14} />
            <span>ALL INQUIRIES</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeBadge.style}`}>
                {typeBadge.icon}
                <span>{typeBadge.label}</span>
              </span>
              <span className="text-xs font-mono text-muted">ID: {inquiry.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
              {inquiry.name} {inquiry.company ? `(${inquiry.company})` : ""}
            </h1>
          </div>
        </div>

        {/* Top Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-secondary">Current Stage:</span>
          <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold text-xs uppercase tracking-wider">
            {status}
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Card */}
          <div className="p-6 rounded-2xl bg-surface border border-border/80 shadow-sm space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-2">
              <User size={15} />
              <span>Contact &amp; Submitter Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">FULL NAME</div>
                <div className="text-text-primary font-semibold text-sm">{inquiry.name}</div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">EMAIL ADDRESS</div>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-accent hover:underline font-semibold text-sm flex items-center gap-1.5"
                >
                  <span>{inquiry.email}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">ORGANIZATION / COMPANY</div>
                <div className="text-text-primary font-medium">{inquiry.company || "Not provided (Independent)"}</div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">PREFERRED CONTACT CHANNEL</div>
                <div className="text-text-primary font-medium uppercase font-mono">
                  {inquiry.contactChannel}
                  {inquiry.phoneOrHandle && ` • ${inquiry.phoneOrHandle}`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">SUBMISSION LOCALE</div>
                <div className="text-text-primary font-mono uppercase">
                  {inquiry.locale === "ar" ? "Arabic (العربية)" : "English (EN)"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                <div className="text-text-secondary font-mono mb-1">RECEIVED TIMESTAMP</div>
                <div className="text-text-primary font-mono">
                  {new Date(inquiry.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Path A Specifics: Start a Project */}
          {(inquiry.inquiryType === InquiryType.BUSINESS_PROJECT || inquiry.inquiryType === InquiryType.BUSINESS_SYSTEM) && (
            <div className="p-6 rounded-2xl bg-surface border border-emerald-500/30 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                  <Building2 size={16} />
                  <span>Business Project Scope &amp; Requirements</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[11px] border border-emerald-500/30">
                  {inquiry.projectCategory || "Custom System"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Problem Statement &amp; Operational Bottleneck:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {inquiry.problemStatement || "No problem statement provided."}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Desired Outcome &amp; Deliverables:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {inquiry.desiredOutcome || "No desired outcome provided."}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                    <div className="text-text-secondary font-mono mb-1">EXPECTED TIMELINE</div>
                    <div className="text-text-primary font-semibold font-mono">
                      {inquiry.expectedTimeline || "FLEXIBLE"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-elevated border border-border/60">
                    <div className="text-text-secondary font-mono mb-1">INDICATIVE BUDGET RANGE</div>
                    <div className="text-emerald-400 font-semibold font-mono">
                      {inquiry.budgetRange || "UNDISCLOSED"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Path B Specifics: Pitch an Idea */}
          {(inquiry.inquiryType === InquiryType.VENTURE_PITCH || inquiry.inquiryType === InquiryType.PARTNERSHIP) && (
            <div className="p-6 rounded-2xl bg-surface border border-purple-500/30 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                  <Rocket size={16} />
                  <span>Venture Pitch Details</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/30">
                  {inquiry.ventureStage || "IDEA_CONCEPT"}
                </span>
              </div>

              <div className="space-y-4">
                {inquiry.ideaName && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-text-secondary mb-1">Idea / Venture Working Title:</h4>
                    <div className="text-lg font-bold text-text-primary">{inquiry.ideaName}</div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Problem Being Addressed:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {inquiry.problemStatement || "No problem statement provided."}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Target Audience / Beneficiary:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed"
                  >
                    {inquiry.targetAudience || "Not specified."}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Founder Background &amp; Domain Expertise:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {inquiry.founderExpertise || "Not specified."}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                    Expected Founder Involvement &amp; Partnership Dynamic:
                  </h4>
                  <div
                    dir={isArabic ? "rtl" : "ltr"}
                    className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {inquiry.expectedInvolvement || "Not specified."}
                  </div>
                </div>

                {inquiry.existingResources && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-text-secondary mb-1.5">
                      Existing Materials / Prototype / Deck:
                    </h4>
                    <div className="p-3 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-xs font-mono break-all">
                      {inquiry.existingResources}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Inquiries */}
          {inquiry.inquiryType === InquiryType.GENERAL && (
            <div className="p-6 rounded-2xl bg-surface border border-blue-500/30 shadow-sm space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Inquiry Message</span>
              </h3>
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className="p-4 rounded-xl bg-surface-elevated border border-border/80 text-text-primary text-sm leading-relaxed whitespace-pre-wrap"
              >
                {inquiry.message || "No message body."}
              </div>
            </div>
          )}

          {/* Audit & Legal Trail */}
          <div className="p-4 rounded-2xl bg-surface border border-border text-xs text-text-secondary space-y-2 font-mono">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <ShieldCheck size={14} className="text-accent" />
              <span>Compliance &amp; Verification Trail</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div>Consent: {inquiry.consentGiven ? "AGREED" : "UNCONFIRMED"} ({inquiry.consentVersion || "v1.0"})</div>
              <div>Source Route: {inquiry.sourceRoute || "/contact"}</div>
              <div>IP Recorded: {inquiry.ipAddress || "ANONYMIZED"}</div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: CRM Pipeline Controls & Notes */}
        <div className="space-y-6">
          {/* Pipeline Stage Management */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span>Pipeline Stage</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-2">STATUS TRANSITION</label>
              <select
                disabled={isPending}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as InquiryStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border focus:border-accent text-text-primary text-xs font-semibold focus:outline-none"
              >
                <option value={InquiryStatus.NEW}>NEW (Initial Intake)</option>
                <option value={InquiryStatus.REVIEWING}>REVIEWING (Under Evaluation)</option>
                <option value={InquiryStatus.QUALIFIED}>QUALIFIED (Viable Lead)</option>
                <option value={InquiryStatus.DISCOVERY}>DISCOVERY (Intro Call Scheduled)</option>
                <option value={InquiryStatus.PROPOSAL}>PROPOSAL (Terms / SOW Sent)</option>
                <option value={InquiryStatus.ACCEPTED}>ACCEPTED (Contract Signed / Co-founding)</option>
                <option value={InquiryStatus.REJECTED}>REJECTED (Not a Fit / Passed)</option>
                <option value={InquiryStatus.CLOSED}>CLOSED (Archived / Inactive)</option>
              </select>
            </div>

            {/* Team Assignment */}
            <div className="pt-2">
              <label className="block text-xs font-mono text-text-secondary mb-2">ASSIGNED TEAM MEMBER</label>
              <select
                disabled={isPending}
                value={assignedToId}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border focus:border-accent text-text-primary text-xs font-medium focus:outline-none"
              >
                <option value="">Unassigned</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-border space-y-1.5 text-[11px] font-mono text-text-secondary">
              <div className="flex justify-between">
                <span>First Reviewed:</span>
                <span className="text-text-primary">
                  {inquiry.reviewedAt ? new Date(inquiry.reviewedAt).toLocaleDateString() : "Never"}
                </span>
              </div>
              {inquiry.closedAt && (
                <div className="flex justify-between">
                  <span>Closed At:</span>
                  <span className="text-text-primary">{new Date(inquiry.closedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Internal CRM Notes & Follow-Up */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
              <Calendar size={16} className="text-accent" />
              <span>Internal CRM Notes &amp; Follow-Up</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-2">TARGET FOLLOW-UP DATE</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border focus:border-accent text-text-primary text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-2">PRIVATE TEAM NOTES</label>
              <textarea
                rows={6}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Log call minutes, founder evaluation, deal terms, or next action items here. (Internal only — never shown to client)"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border focus:border-accent text-text-primary text-xs leading-relaxed focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {notesSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Notes &amp; Date</span>
                </>
              )}
            </button>
          </div>

          {/* Administrative Actions / Danger Zone */}
          {canArchive && (
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Administrative Actions</span>
              </h4>
              <p className="text-[11px] text-text-secondary">
                Archive to remove from the active pipeline, or permanently delete the record.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleArchive(false)}
                  className="w-full py-2 px-3 rounded-lg border border-border hover:border-red-500/50 text-text-secondary hover:text-red-400 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                >
                  <Archive size={13} />
                  <span>Archive Lead</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleArchive(true)}
                  className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Permanently Delete Lead</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
