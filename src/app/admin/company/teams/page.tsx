import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Layers,
  Users,
  FolderKanban,
  CheckSquare,
  ChevronRight,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsListPage() {
  const teams = await prisma.companyTeam.findMany({
    include: {
      memberships: {
        include: {
          member: true,
        },
      },
      projects: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
      tasks: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { memberships: true, projects: true, tasks: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            فرق العمل والأقسام / Company Teams
          </h2>
          <p className="text-xs text-muted">
            الأقسام الأربعة الدائمة لاستوديو سديم: التحليل، التصميم، البناء، والتسويق
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => {
          const leads = team.memberships.filter((m) => m.teamRole === "LEAD");

          return (
            <div
              key={team.id}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between hover:border-accent/40 transition-all shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                    {team._count.memberships} أعضاء
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">{team.nameAr}</h3>
                  <p className="text-xs text-muted font-mono">{team.nameEn}</p>
                  <p className="text-xs text-muted leading-relaxed mt-2 line-clamp-3">
                    {team.descriptionAr}
                  </p>
                </div>

                {/* Team Lead */}
                <div className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between text-xs">
                  <span className="text-muted">قائد الفريق / Team Lead:</span>
                  <span className="font-semibold text-foreground">
                    {leads[0]
                      ? leads[0].member.fullNameAr || leads[0].member.fullNameEn
                      : "لم يتم التعيين"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-mono text-muted">
                  <span className="flex items-center gap-1">
                    <FolderKanban size={13} className="text-accent" />
                    {team._count.projects} مشاريع
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare size={13} className="text-accent" />
                    {team._count.tasks} مهام
                  </span>
                </div>

                <Link
                  href={`/admin/company/teams/${team.id}`}
                  className="px-4 py-2 rounded-xl bg-background hover:bg-surface border border-border text-foreground font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>عرض التفاصيل</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
