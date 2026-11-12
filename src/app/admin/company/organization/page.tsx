import prisma from "@/lib/prisma";
import OrgChartViewer from "@/components/company/OrgChartViewer";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const [teams, executives] = await Promise.all([
    prisma.companyTeam.findMany({
      where: { isActive: true },
      include: {
        memberships: {
          include: {
            member: true,
          },
        },
        projects: {
          include: {
            project: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.adminUser.findMany({
      where: {
        isActive: true,
        role: { in: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
  ]);

  return <OrgChartViewer teams={teams as any} executives={executives} />;
}
