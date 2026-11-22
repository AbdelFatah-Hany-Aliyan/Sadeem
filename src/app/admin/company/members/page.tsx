import Link from "next/link";
import prisma from "@/lib/prisma";
import AddMemberModal from "@/components/company/AddMemberModal";
import { MemberStatus, MembershipType } from "@prisma/client";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Clock,
  ShieldAlert,
  ChevronRight,
  Mail,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    status?: string;
    teamId?: string;
    search?: string;
  };
}

export default async function MembersListPage({ searchParams }: PageProps) {
  const { status, teamId, search } = searchParams;

  const where: any = {};
  if (status && Object.values(MemberStatus).includes(status as any)) {
    where.status = status;
  }
  if (teamId) {
    where.memberships = { some: { teamId } };
  }
  if (search) {
    where.OR = [
      { fullNameEn: { contains: search, mode: "insensitive" } },
      { fullNameAr: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { jobTitleEn: { contains: search, mode: "insensitive" } },
    ];
  }

  const [members, teams, statusCounts] = await Promise.all([
    prisma.companyMember.findMany({
      where,
      include: {
        adminUser: {
          select: { id: true, role: true, isActive: true },
        },
        memberships: {
          include: { team: true },
        },
        _count: {
          select: { assignedTasks: true, receivedRecommendations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.companyTeam.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameEn: true, nameAr: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.companyMember.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus: Record<string, number> = {};
  statusCounts.forEach((s) => {
    countByStatus[s.status] = s._count._all;
  });

  const getStatusBadge = (st: MemberStatus) => {
    switch (st) {
      case MemberStatus.ACTIVE:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ACTIVE
          </span>
        );
      case MemberStatus.ACCEPTED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            NEEDS APPROVAL
          </span>
        );
      case MemberStatus.INVITED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            INVITED
          </span>
        );
      case MemberStatus.SUSPENDED:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            SUSPENDED
          </span>
        );
      case MemberStatus.PENDING_INVITATION:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-500/15 text-muted border border-border">
            PENDING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface text-muted border border-border">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            أعضاء الفريق / Company Members ({members.length})
          </h2>
          <p className="text-xs text-muted">
            إدارة كافة أعضاء استوديو سديم، أدوارهم، الفرق التابعة لهم، وحالة العضوية
          </p>
        </div>

        <AddMemberModal teams={teams} />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4 text-xs font-mono">
        <Link
          href="/admin/company/members"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            !status
              ? "bg-accent text-accent-foreground border-accent font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          All ({Object.values(countByStatus).reduce((a, b) => a + b, 0)})
        </Link>
        <Link
          href="/admin/company/members?status=ACTIVE"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "ACTIVE"
              ? "bg-emerald-500 text-stone-950 border-emerald-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Active ({countByStatus[MemberStatus.ACTIVE] || 0})
        </Link>
        <Link
          href="/admin/company/members?status=ACCEPTED"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "ACCEPTED"
              ? "bg-amber-500 text-stone-950 border-amber-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Needs Approval ({countByStatus[MemberStatus.ACCEPTED] || 0})
        </Link>
        <Link
          href="/admin/company/members?status=INVITED"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "INVITED"
              ? "bg-blue-500 text-white border-blue-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Invited ({countByStatus[MemberStatus.INVITED] || 0})
        </Link>
        <Link
          href="/admin/company/members?status=SUSPENDED"
          className={`px-3 py-1.5 rounded-xl border transition-colors ${
            status === "SUSPENDED"
              ? "bg-red-500 text-white border-red-500 font-semibold"
              : "border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Suspended ({countByStatus[MemberStatus.SUSPENDED] || 0})
        </Link>
      </div>

      {/* Members Grid / Cards */}
      {members.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
          <Users size={32} className="text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">لا يوجد أعضاء مطابقين للبحث</h3>
          <p className="text-xs text-muted">
            جرّب تغيير فلاتر البحث أو أضف عضواً جديداً إلى سديم
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const primaryTeam = member.memberships.find((m) => m.isPrimary)?.team;

            return (
              <Link
                key={member.id}
                href={`/admin/company/members/${member.id}`}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all hover:shadow-lg group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(member.status)}
                    {member.adminUser && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-accent/10 text-accent font-semibold">
                        {member.adminUser.role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center font-bold text-accent text-base group-hover:border-accent">
                      {member.fullNameAr
                        ? member.fullNameAr.charAt(0)
                        : member.fullNameEn.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                        {member.fullNameAr || member.fullNameEn}
                      </h3>
                      {member.fullNameAr && (
                        <p className="text-xs text-muted font-mono">{member.fullNameEn}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="text-foreground font-medium">
                      {member.jobTitleAr || member.jobTitleEn}
                    </div>

                    <div className="flex items-center gap-1.5 text-muted font-mono text-[11px] truncate">
                      <Mail size={12} className="shrink-0 text-accent" />
                      <span>{member.email}</span>
                    </div>

                    {primaryTeam && (
                      <div className="flex items-center gap-1.5 text-muted text-[11px]">
                        <Building2 size={12} className="shrink-0 text-accent" />
                        <span>{primaryTeam.nameAr} ({primaryTeam.code})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>{member._count.assignedTasks} مهام</span>
                  <span>{member._count.receivedRecommendations} توجيهات</span>
                  <ChevronRight size={14} className="text-muted group-hover:text-accent" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
