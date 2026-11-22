import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminInquiryDetail, getActiveAdminUsers } from "@/lib/services/inquiryService";
import { InquiryDetailView } from "@/components/admin/InquiryDetailView";

export const dynamic = "force-dynamic";

interface InquiryPageProps {
  params: {
    id: string;
  };
}

export default async function AdminInquiryDetailPage({ params }: InquiryPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [inquiry, adminUsers] = await Promise.all([
    getAdminInquiryDetail(params.id, session),
    getActiveAdminUsers(),
  ]);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8">
      <InquiryDetailView
        inquiry={inquiry as any}
        currentUserRole={session.role}
        adminUsers={adminUsers}
      />
    </div>
  );
}
