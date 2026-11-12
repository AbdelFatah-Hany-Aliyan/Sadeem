"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  Layers,
  FolderKanban,
  ExternalLink,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface TeamWithData {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  responsibilitiesEn: any;
  responsibilitiesAr: any;
  color: string | null;
  memberships: {
    id: string;
    teamRole: string;
    isPrimary: boolean;
    member: {
      id: string;
      fullNameEn: string;
      fullNameAr: string | null;
      email: string;
      jobTitleEn: string;
      jobTitleAr: string | null;
      status: string;
    };
  }[];
  projects: {
    id: string;
    project: {
      id: string;
      slug: string;
      translations: {
        locale: string;
        title: string;
      }[];
    };
  }[];
}

interface ExecutiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrgChartProps {
  teams: TeamWithData[];
  executives: ExecutiveUser[];
}

export default function OrgChartViewer({ teams, executives }: OrgChartProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  return (
    <div className="space-y-8">
      {/* Executive Management Tier */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-medium">
          <Shield size={13} />
          <span>Executive Leadership & Company Management</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {executives.map((exec) => (
            <div
              key={exec.id}
              className="p-4 rounded-2xl bg-surface border border-accent/30 shadow-md min-w-[240px] text-center space-y-2 hover:border-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold font-mono mx-auto flex items-center justify-center">
                {exec.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">{exec.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent uppercase font-semibold">
                  {exec.role}
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono">{exec.email}</p>
            </div>
          ))}
        </div>

        {/* Tree Connector Line */}
        <div className="w-0.5 h-8 bg-border mx-auto" />
      </div>

      {/* Core Teams Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">
            الأقسام الأربعة الدائمة / The Four Core Permanent Departments
          </h2>
          <p className="text-xs text-muted">
            انقر على أي قسم لاستعراض الأعضاء، المسؤوليات، والمشاريع المسندة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team) => {
            const isSelected = team.id === selectedTeamId;
            const leads = team.memberships.filter((m) => m.teamRole === "LEAD");
            const membersCount = team.memberships.length;

            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-surface border-accent shadow-lg shadow-accent/10 ring-1 ring-accent"
                    : "bg-surface/60 border-border hover:border-accent/40 hover:bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${team.color || "#C28E62"}20`,
                        color: team.color || "#C28E62",
                      }}
                    >
                      {team.code}
                    </span>
                    <span className="text-xs text-muted font-mono">
                      {membersCount} {membersCount === 1 ? "عضو" : "أعضاء"}
                    </span>
                  </div>

                  <h3 className="font-bold text-foreground text-base">
                    {team.nameAr}
                  </h3>
                  <p className="text-xs text-muted font-mono">{team.nameEn}</p>
                </div>

                <div className="pt-3 border-t border-border/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px]">قائد الفريق:</span>
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {leads[0]
                        ? leads[0].member.fullNameAr || leads[0].member.fullNameEn
                        : "غير محدد"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px]">مشاريع نشطة:</span>
                    <span className="font-mono text-foreground">
                      {team.projects.length}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Team Detail View */}
      {activeTeam && (
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${activeTeam.color || "#C28E62"}20`,
                    color: activeTeam.color || "#C28E62",
                  }}
                >
                  {activeTeam.code}
                </span>
                <span className="text-xs text-muted font-mono">
                  {activeTeam.memberships.length} مسجلين
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {activeTeam.nameAr} — {activeTeam.nameEn}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
                {activeTeam.descriptionAr}
              </p>
            </div>

            <Link
              href={`/admin/company/teams/${activeTeam.id}`}
              className="px-4 py-2 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold uppercase tracking-wider hover:border-accent transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>عرض تفاصيل القسم / Team Page</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Department Responsibilities */}
          {Array.isArray(activeTeam.responsibilitiesAr) && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-semibold text-muted">
                المسؤوليات ونطاق العمل / Key Responsibilities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeTeam.responsibilitiesAr.map((resp: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-background border border-border/80 text-xs flex items-center gap-2.5"
                  >
                    <CheckCircle2 size={14} className="text-accent shrink-0" />
                    <span className="text-foreground">{resp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase font-semibold text-muted">
                أعضاء الفريق / Team Members
              </h4>
              <Link
                href="/admin/company/members"
                className="text-xs font-mono text-accent hover:underline"
              >
                + إضافة عضو جديد
              </Link>
            </div>

            {activeTeam.memberships.length === 0 ? (
              <div className="p-6 rounded-2xl bg-background/50 border border-border/60 text-center text-xs text-muted">
                لا يوجد أعضاء مسجلين في هذا الفريق حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTeam.memberships.map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/company/members/${m.member.id}`}
                    className="p-3.5 rounded-xl bg-background border border-border hover:border-accent/50 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-accent text-sm group-hover:border-accent">
                      {m.member.fullNameAr
                        ? m.member.fullNameAr.charAt(0)
                        : m.member.fullNameEn.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate group-hover:text-accent">
                          {m.member.fullNameAr || m.member.fullNameEn}
                        </span>
                        {m.teamRole === "LEAD" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/20 text-accent font-mono font-bold">
                            LEAD
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted truncate">
                        {m.member.jobTitleAr || m.member.jobTitleEn}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
