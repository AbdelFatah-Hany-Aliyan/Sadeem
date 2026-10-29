"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  InquiryType, 
  InquiryStatus, 
  AdminRole, 
  ContactChannel 
} from "@prisma/client";
import { updateInquiryStatusAction, archiveInquiryAction } from "@/app/admin/actions";
import { 
  Search, 
  Filter, 
  Clock, 
  Building2, 
  Rocket, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ArrowRight,
  User,
  Archive,
  Loader2
} from "lucide-react";

export interface AdminInquiryItem {
  id: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string;
  company: string | null;
  contactChannel: ContactChannel;
  phoneOrHandle: string | null;
  locale: string;
  createdAt: Date | string;
  reviewedAt: Date | string | null;
  ideaName: string | null;
  projectCategory?: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface InquiryTableProps {
  initialInquiries: AdminInquiryItem[];
  userRole: AdminRole;
  countsByStatus: Record<string, number>;
  newCount: number;
}

export function InquiryTable({
  initialInquiries,
  userRole,
  countsByStatus,
  newCount,
}: InquiryTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canArchive = userRole === AdminRole.SUPER_ADMIN;

  const filteredInquiries = initialInquiries.filter((inq) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      q === "" ||
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.company && inq.company.toLowerCase().includes(q)) ||
      (inq.ideaName && inq.ideaName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter;
    const matchesType = typeFilter === "ALL" || inq.inquiryType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = (id: string, newStatus: InquiryStatus) => {
    setErrorMsg(null);
    setActiveActionId(id);

    startTransition(async () => {
      const res = await updateInquiryStatusAction(id, newStatus);
      setActiveActionId(null);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update status.");
      } else {
        router.refresh();
      }
    });
  };

  const handleArchive = (id: string) => {
    if (!canArchive) {
      alert("Only SUPER_ADMIN can archive inquiries.");
      return;
    }

    if (!confirm("Are you sure you want to archive this inquiry?")) return;

    setErrorMsg(null);
    setActiveActionId(id);

    startTransition(async () => {
      const res = await archiveInquiryAction(id, false);
      setActiveActionId(null);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to archive inquiry.");
      } else {
        router.refresh();
      }
    });
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case InquiryStatus.NEW:
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case InquiryStatus.REVIEWING:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case InquiryStatus.QUALIFIED:
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case InquiryStatus.DISCOVERY:
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case InquiryStatus.PROPOSAL:
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case InquiryStatus.ACCEPTED:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case InquiryStatus.REJECTED:
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case InquiryStatus.CLOSED:
      case InquiryStatus.ARCHIVED:
        return "bg-surface-elevated text-text-secondary border-border/80";
      default:
        return "bg-surface text-text-secondary border-border";
    }
  };

  const getTypeBadge = (type: InquiryType) => {
    switch (type) {
      case InquiryType.BUSINESS_PROJECT:
      case InquiryType.BUSINESS_SYSTEM:
        return {
          icon: <Building2 size={13} className="text-emerald-400" />,
          label: "Business Project",
          style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        };
      case InquiryType.VENTURE_PITCH:
      case InquiryType.PARTNERSHIP:
        return {
          icon: <Rocket size={13} className="text-purple-400" />,
          label: "Venture Pitch",
          style: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        };
      default:
        return {
          icon: <Mail size={13} className="text-blue-400" />,
          label: "General Inquiry",
          style: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        };
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="text-xs font-mono text-text-secondary">TOTAL LEADS</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{initialInquiries.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>NEW INTAKE</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{newCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="text-xs font-mono text-purple-400">QUALIFIED &amp; DISCOVERY</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {(countsByStatus[InquiryStatus.QUALIFIED] || 0) +
              (countsByStatus[InquiryStatus.DISCOVERY] || 0) +
              (countsByStatus[InquiryStatus.PROPOSAL] || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="text-xs font-mono text-emerald-400">ACCEPTED CLIENTS</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {countsByStatus[InquiryStatus.ACCEPTED] || 0}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-surface border border-border/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search leads by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-elevated border border-border focus:border-accent focus:outline-none text-text-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-border focus:border-accent focus:outline-none text-text-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value={InquiryStatus.NEW}>New Leads ({countsByStatus[InquiryStatus.NEW] || 0})</option>
            <option value={InquiryStatus.REVIEWING}>Reviewing</option>
            <option value={InquiryStatus.QUALIFIED}>Qualified</option>
            <option value={InquiryStatus.DISCOVERY}>Discovery</option>
            <option value={InquiryStatus.PROPOSAL}>Proposal</option>
            <option value={InquiryStatus.ACCEPTED}>Accepted</option>
            <option value={InquiryStatus.REJECTED}>Rejected</option>
            <option value={InquiryStatus.CLOSED}>Closed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-border focus:border-accent focus:outline-none text-text-primary"
          >
            <option value="ALL">All Intake Paths</option>
            <option value={InquiryType.BUSINESS_PROJECT}>Business Projects</option>
            <option value={InquiryType.VENTURE_PITCH}>Venture Pitches</option>
            <option value={InquiryType.GENERAL}>General Inquiries</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-text-secondary uppercase font-mono tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Contact &amp; Entity</th>
                <th className="py-3.5 px-4 font-semibold">Intake Path</th>
                <th className="py-3.5 px-4 font-semibold">Pipeline Status</th>
                <th className="py-3.5 px-4 font-semibold">Channel</th>
                <th className="py-3.5 px-4 font-semibold">Assigned To</th>
                <th className="py-3.5 px-4 font-semibold">Received</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    No inquiries found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => {
                  const typeBadge = getTypeBadge(inq.inquiryType);
                  const isActionLoading = activeActionId === inq.id && isPending;

                  return (
                    <tr
                      key={inq.id}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      {/* Contact */}
                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/inquiries/${inq.id}`}
                          className="font-semibold text-text-primary hover:text-accent transition-colors block text-sm"
                        >
                          {inq.name}
                        </Link>
                        <div className="text-text-secondary text-xs">{inq.email}</div>
                        {(inq.company || inq.ideaName) && (
                          <div className="text-[11px] font-mono text-muted mt-0.5">
                            {inq.company || inq.ideaName}
                          </div>
                        )}
                      </td>

                      {/* Path */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${typeBadge.style}`}
                        >
                          {typeBadge.icon}
                          <span>{typeBadge.label}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <select
                          disabled={isActionLoading}
                          value={inq.status}
                          onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none transition-all ${getStatusBadge(
                            inq.status
                          )}`}
                        >
                          <option value={InquiryStatus.NEW}>NEW</option>
                          <option value={InquiryStatus.REVIEWING}>REVIEWING</option>
                          <option value={InquiryStatus.QUALIFIED}>QUALIFIED</option>
                          <option value={InquiryStatus.DISCOVERY}>DISCOVERY</option>
                          <option value={InquiryStatus.PROPOSAL}>PROPOSAL</option>
                          <option value={InquiryStatus.ACCEPTED}>ACCEPTED</option>
                          <option value={InquiryStatus.REJECTED}>REJECTED</option>
                          <option value={InquiryStatus.CLOSED}>CLOSED</option>
                        </select>
                      </td>

                      {/* Contact Channel */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-[11px] text-text-secondary uppercase">
                          {inq.contactChannel}
                        </div>
                        {inq.phoneOrHandle && (
                          <div className="text-[11px] text-text-primary mt-0.5 font-mono">
                            {inq.phoneOrHandle}
                          </div>
                        )}
                      </td>

                      {/* Assignment */}
                      <td className="py-4 px-4">
                        {inq.assignedTo ? (
                          <span className="inline-flex items-center gap-1.5 text-text-primary font-medium">
                            <User size={13} className="text-accent" />
                            <span>{inq.assignedTo.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-text-secondary text-[11px] font-mono">
                        {new Date(inq.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/inquiries/${inq.id}`}
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border transition-colors text-xs font-medium inline-flex items-center gap-1"
                            title="View Detail"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={13} />
                          </Link>

                          {canArchive && inq.status !== InquiryStatus.ARCHIVED && (
                            <button
                              type="button"
                              onClick={() => handleArchive(inq.id)}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-surface-elevated border border-transparent hover:border-border transition-colors"
                              title="Archive Inquiry"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
