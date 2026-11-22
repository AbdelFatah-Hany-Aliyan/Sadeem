import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminInquiries } from "@/lib/services/inquiryService";
import { InquiryTable } from "@/components/admin/InquiryTable";
import { Inbox, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { items, countsByStatus, newCount } = await getAdminInquiries({
    limit: 100,
  });

  return (
    <div className="container mx-auto px-6 md:px-12 pt-8 pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <span>CRM &amp; Pipeline</span>
            <span>•</span>
            <span className="text-accent">{items.length} Total Records</span>
            {newCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-bold">{newCount} Unreviewed</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5">
            <Inbox className="text-accent" size={28} />
            <span>Client Inquiries &amp; Venture Pitches</span>
          </h1>
        </div>
      </div>

      {/* Inquiry Management Table */}
      <InquiryTable
        initialInquiries={items as any}
        userRole={session.role}
        countsByStatus={countsByStatus}
        newCount={newCount}
      />
    </div>
  );
}
