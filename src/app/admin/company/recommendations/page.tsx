import Link from "next/link";
import prisma from "@/lib/prisma";
import AddRecommendationModal from "@/components/company/AddRecommendationModal";
import { RecommendationType, RecommendationStatus, TaskPriority, RecommendationVisibility } from "@prisma/client";
import {
  Sparkles,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  Eye,
  FolderKanban,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    status?: string;
    type?: string;
    targetMemberId?: string;
  };
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  const { status, type, targetMemberId } = searchParams;

  const where: any = {};
  if (status && Object.values(RecommendationStatus).includes(status as any)) {
    where.status = status;
  }
  if (type && Object.values(RecommendationType).includes(type as any)) {
    where.type = type;
  }
  if (targetMemberId) {
    where.targetMemberId = targetMemberId;
  }

  const [recommendations, members, projects] = await Promise.all([
    prisma.administrativeRecommendation.findMany({
      where,
      include: {
        targetMember: true,
        author: {
          select: { name: true, role: true },
        },
        relatedProject: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.companyMember.findMany({
      where: { status: { in: ["ACTIVE", "ACCEPTED"] } },
      select: { id: true, fullNameEn: true, fullNameAr: true, jobTitleEn: true },
      orderBy: { fullNameEn: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, slug: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  const getTypeBadge = (t: RecommendationType) => {
    switch (t) {
      case RecommendationType.DIRECTION:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            DIRECTION
          </span>
        );
      case RecommendationType.IMPROVEMENT:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            IMPROVEMENT
          </span>
        );
      case RecommendationType.TRAINING:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            TRAINING
          </span>
        );
      case RecommendationType.PROCESS:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-500/15 text-muted border border-border">
            PROCESS
          </span>
        );
      case RecommendationType.FOLLOW_UP:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            FOLLOW UP
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
            GUIDANCE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            التوجيهات والملاحظات الإدارية / Administrative Guidance ({recommendations.length})
          </h2>
          <p className="text-xs text-muted">
            إرسال الملاحظات، توجيه فرق العمل، تقييم الأداء، وتوثيق استلام التوجيهات
          </p>
        </div>

        <AddRecommendationModal members={members} projects={projects} />
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
          <Sparkles size={32} className="text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">لا توجد توجيهات مسجلة</h3>
          <p className="text-xs text-muted">
            أرسل توجيهاً جديداً لأحد الأعضاء أو عدّل خيارات التصفية
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-6 rounded-2xl bg-surface border border-border space-y-4 hover:border-accent/40 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  {getTypeBadge(rec.type)}
                  {rec.visibility === RecommendationVisibility.PRIVATE_MANAGEMENT ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                      <Lock size={10} />
                      سري للإدارة
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface text-muted border border-border flex items-center gap-1">
                      <Eye size={10} />
                      مرئي للعضو
                    </span>
                  )}
                  {rec.relatedProject && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface text-muted border border-border">
                      {rec.relatedProject.slug}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {rec.status === "ACKNOWLEDGED" ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={13} />
                      تم الاطلاع والاعتماد ({rec.acknowledgedAt ? new Date(rec.acknowledgedAt).toLocaleDateString("en-GB") : ""})
                    </span>
                  ) : (
                    <span className="text-muted text-[11px]">بانتظار اطلاع العضو</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {rec.text}
              </p>

              <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <User size={12} className="text-accent" />
                    المستهدف: {rec.targetMember.fullNameAr || rec.targetMember.fullNameEn}
                  </span>
                  {rec.author && (
                    <span>بواسطة: {rec.author.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(rec.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
