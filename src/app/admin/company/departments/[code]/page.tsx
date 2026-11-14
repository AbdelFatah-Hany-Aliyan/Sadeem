import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { canAccessDepartment, getLinkedMemberId } from "@/lib/auth/scopeGuard";
import { getTasks } from "@/lib/services/companyTaskService";
import DepartmentWorkspaceView from "@/components/company/DepartmentWorkspaceView";
import { AdminRole, RecommendationVisibility } from "@prisma/client";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface DepartmentPageProps {
  params: {
    code: string;
  };
}

const VALID_DEPARTMENT_CODES = new Set(["ANALYSIS", "DESIGN", "ENGINEERING", "MARKETING"]);

export default async function DepartmentWorkspacePage({ params }: DepartmentPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const code = params.code.toUpperCase();
  if (!VALID_DEPARTMENT_CODES.has(code)) {
    notFound();
  }

  // Scope check
  const scope = await canAccessDepartment(session, code);
  if (!scope.allowed) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-surface border border-rose-500/30 space-y-4 text-center mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          غير مصرح بالوصول لمساحة هذا القسم / Access Restricted
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          {scope.reason || "تتطلب هذه المساحة عضوية نشطة في هذا القسم أو صلاحيات إدارة الشركة."}
        </p>
        <div className="pt-2">
          <Link
            href="/admin/company"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-stone-950 font-bold font-mono text-xs hover:bg-accent/90 transition-colors"
          >
            <ArrowRight size={14} />
            <span>العودة للوحة الشركة / Return to Overview</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch department details
  const department = await prisma.companyTeam.findUnique({
    where: { code, isActive: true },
    include: {
      memberships: {
        where: { member: { status: "ACTIVE" } },
        include: {
          member: true,
        },
        orderBy: [{ teamRole: "asc" }, { isPrimary: "desc" }],
      },
      projects: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const currentMemberId = await getLinkedMemberId(session.userId);

  // Fetch department tasks
  const rawTasks = await getTasks({ teamId: department.id });

  // Map tasks to KanbanTask interface
  const tasks = rawTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    comments: t.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    deliverables: t.deliverables.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    history: t.history.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  }));

  // Fetch department recommendations
  const rawRecommendations = await prisma.administrativeRecommendation.findMany({
    where: {
      targetMember: {
        memberships: { some: { teamId: department.id } },
      },
      visibility: { not: RecommendationVisibility.PRIVATE_MANAGEMENT },
    },
    include: {
      targetMember: { select: { fullNameAr: true, fullNameEn: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const recommendations = rawRecommendations.map((r) => ({
    ...r,
    acknowledgedAt: r.acknowledgedAt?.toISOString() || null,
  }));

  const leadMember = department.memberships.find((m) => m.teamRole === "LEAD");
  const isManager =
    session.role === AdminRole.SUPER_ADMIN ||
    session.role === AdminRole.COMPANY_ADMIN ||
    (currentMemberId && leadMember?.member.id === currentMemberId);

  const canReview = isManager || session.role === AdminRole.QA_REVIEWER;

  return (
    <DepartmentWorkspaceView
      department={{
        ...department,
        responsibilitiesAr: Array.isArray(department.responsibilitiesAr)
          ? (department.responsibilitiesAr as string[])
          : [],
        responsibilitiesEn: Array.isArray(department.responsibilitiesEn)
          ? (department.responsibilitiesEn as string[])
          : [],
      }}
      tasks={tasks}
      recommendations={recommendations}
      currentUserId={session.userId}
      currentMemberId={currentMemberId || undefined}
      isManager={Boolean(isManager)}
      canReview={Boolean(canReview)}
    />
  );
}
