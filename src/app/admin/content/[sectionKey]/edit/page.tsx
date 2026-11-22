import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminSectionDetail } from "@/lib/services/contentService";
import ContentSectionForm from "@/components/admin/ContentSectionForm";

export const dynamic = "force-dynamic";

interface EditSectionPageProps {
  params: {
    sectionKey: string;
  };
}

export default async function AdminEditContentSectionPage({ params }: EditSectionPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const section = await getAdminSectionDetail(params.sectionKey);
  if (!section) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-10">
      <ContentSectionForm section={section} userRole={session.role} />
    </div>
  );
}
