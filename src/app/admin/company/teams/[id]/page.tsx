import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Layers,
  Users,
  FolderKanban,
  CheckSquare,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const team = await prisma.companyTeam.findUnique({
    where: { id: params.id },
    include: {
      memberships: {
        include: {
          member: true,
        },
        orderBy: [{ isPrimary: "desc" }, { teamRole: "asc" }],
      },
      projects: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
      tasks: {
        include: {
          assignedMember: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!team) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/admin/company/teams"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>العودة لقائمة الفرق / Back to Teams</span>
        </Link>
      </div>

      {/* Team Header */}
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${team.color || "#C28E62"}20`,
                  color: team.color || "#C28E62",
                }}
              >
                {team.code}
              </span>
              <span className="text-xs text-muted font-mono">
                {team.memberships.length} أعضاء مسجلين
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {team.nameAr} — {team.nameEn}
            </h1>
            <p className="text-xs text-muted leading-relaxed mt-2 max-w-3xl">
              {team.descriptionAr}
            </p>
          </div>
        </div>

        {/* Responsibilities */}
        {Array.isArray(team.responsibilitiesAr) && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-semibold text-muted">
              نطاق المسؤوليات والمهام / Department Responsibilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {team.responsibilitiesAr.map((resp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-background border border-border/80 text-xs flex items-center gap-2.5"
                >
                  <CheckCircle2 size={14} className="text-accent shrink-0" />
                  <span className="text-foreground">{resp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Members & Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="bg-surface border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-accent" />
              <h3 className="font-bold text-foreground text-sm">
                أعضاء القسم ({team.memberships.length})
              </h3>
            </div>
            <Link
              href="/admin/company/members"
              className="text-xs font-mono text-accent hover:underline"
            >
              + إضافة عضو
            </Link>
          </div>

          {team.memberships.length === 0 ? (
            <p className="text-xs text-muted p-4 bg-background/50 rounded-xl text-center">
              لا يوجد أعضاء في هذا القسم حالياً
            </p>
          ) : (
            <div className="space-y-2">
              {team.memberships.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/company/members/${m.member.id}`}
                  className="p-3.5 rounded-xl bg-background border border-border/70 hover:border-accent transition-colors flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground group-hover:text-accent">
                        {m.member.fullNameAr || m.member.fullNameEn}
                      </span>
                      {m.teamRole === "LEAD" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/20 text-accent font-mono font-bold">
                          LEAD
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted font-mono mt-0.5">
                      {m.member.jobTitleAr || m.member.jobTitleEn}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted font-mono">
                    {m.member.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Projects */}
        <div className="bg-surface border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-accent" />
              <h3 className="font-bold text-foreground text-sm">
                المشاريع المسندة للقسم ({team.projects.length})
              </h3>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs font-mono text-accent hover:underline"
            >
              جميع المشاريع
            </Link>
          </div>

          {team.projects.length === 0 ? (
            <p className="text-xs text-muted p-4 bg-background/50 rounded-xl text-center">
              لم يتم إسناد مشاريع لهذا القسم حتى الآن
            </p>
          ) : (
            <div className="space-y-2">
              {team.projects.map((tp) => {
                const arTrans = tp.project.translations.find((t) => t.locale === "ar");
                const enTrans = tp.project.translations.find((t) => t.locale === "en");

                return (
                  <Link
                    key={tp.id}
                    href={`/admin/projects/${tp.project.id}`}
                    className="p-3.5 rounded-xl bg-background border border-border/70 hover:border-accent transition-colors flex items-center justify-between text-xs group"
                  >
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-accent">
                        {arTrans?.title || enTrans?.title || tp.project.slug}
                      </h4>
                      <p className="text-[11px] text-muted font-mono">
                        {tp.project.slug}
                      </p>
                    </div>
                    <ExternalLink size={13} className="text-muted group-hover:text-accent" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
