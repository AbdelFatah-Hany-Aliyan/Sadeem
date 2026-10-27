import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getMediaLibrary } from "@/lib/services/mediaService";
import { getStorageStatus } from "@/lib/storage/storageProvider";
import MediaLibraryView from "@/components/admin/MediaLibraryView";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [items, storageStatus, dbProjects] = await Promise.all([
    getMediaLibrary(),
    Promise.resolve(getStorageStatus()),
    prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale: "en" },
          select: { title: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const projects = dbProjects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.translations[0]?.title || p.slug,
  }));

  return (
    <div className="container mx-auto px-6 md:px-12 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Studio Media Library
            </h1>
          </div>
          <p className="text-xs font-mono text-muted">
            Manage authenticated project visuals, architectural diagrams, cover images, and localized alternative text.
          </p>
        </div>
      </div>

      <MediaLibraryView
        initialItems={items}
        storageStatus={storageStatus}
        projects={projects}
        userRole={session.role}
      />
    </div>
  );
}
