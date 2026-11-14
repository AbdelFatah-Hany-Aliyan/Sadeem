import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTasks } from "@/lib/services/companyTaskService";
import MyWorkHubView from "@/components/company/MyWorkHubView";
import {
  TaskStatus,
  RecommendationVisibility,
  AdminRole,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Find linked CompanyMember
  const member = await prisma.companyMember.findFirst({
    where: {
      OR: [
        { adminUser: { id: session.id } },
        { email: session.email },
      ],
    },
    include: {
      memberships: {
        include: { team: true },
      },
      projectAssignments: {
        include: {
          project: {
            include: { translations: true },
          },
        },
      },
    },
  });

  const memberId = member?.id;
  const primaryTeam = member?.memberships.find((m) => m.isPrimary)?.team;

  // Query assigned tasks, collaborating tasks, and review queue
  const [rawAssigned, rawCollaborating, rawReview, rawDeliverables, rawRecommendations] =
    await Promise.all([
      memberId ? getTasks({ assignedMemberId: memberId }) : Promise.resolve([]),
      memberId ? getTasks({ collaboratorMemberId: memberId }) : Promise.resolve([]),
      memberId
        ? getTasks({ reviewerMemberId: memberId, status: TaskStatus.IN_REVIEW })
        : Promise.resolve([]),
      memberId
        ? prisma.taskDeliverable.findMany({
            where: { authorMemberId: memberId },
            include: { task: { select: { id: true, title: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
      memberId
        ? prisma.administrativeRecommendation.findMany({
            where: {
              targetMemberId: memberId,
              visibility: { not: RecommendationVisibility.PRIVATE_MANAGEMENT },
            },
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

  const mapTask = (t: any) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    comments: t.comments.map((c: any) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    deliverables: t.deliverables.map((d: any) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    history: t.history.map((h: any) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  });

  const assignedTasks = rawAssigned.map(mapTask);
  const collaboratingTasks = rawCollaborating.map(mapTask);
  const reviewQueue = rawReview.map(mapTask);

  const myDeliverables = rawDeliverables.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  const recommendations = rawRecommendations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const projects = (member?.projectAssignments || []).map((pa) => ({
    id: pa.projectId,
    slug: pa.project.slug,
    role: pa.projectRole,
  }));

  const isManager =
    session.role === AdminRole.SUPER_ADMIN || session.role === AdminRole.COMPANY_ADMIN;
  const canReview = isManager || session.role === AdminRole.QA_REVIEWER || reviewQueue.length > 0;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      <MyWorkHubView
        member={member}
        primaryTeam={primaryTeam}
        assignedTasks={assignedTasks}
        collaboratingTasks={collaboratingTasks}
        reviewQueue={reviewQueue}
        myDeliverables={myDeliverables}
        recommendations={recommendations}
        projects={projects}
        currentUserId={session.userId}
        currentMemberId={memberId}
        isManager={Boolean(isManager)}
        canReview={Boolean(canReview)}
      />
    </div>
  );
}
