import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Users,
  Layers,
  CheckSquare,
  Sparkles,
  Send,
  Bell,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const navLinks = [
    { label: "Overview", href: "/admin/company", icon: LayoutDashboard },
    { label: "Org Chart", href: "/admin/company/organization", icon: Network },
    { label: "Members", href: "/admin/company/members", icon: Users },
    { label: "Teams", href: "/admin/company/teams", icon: Layers },
    { label: "Tasks", href: "/admin/company/tasks", icon: CheckSquare },
    { label: "Recommendations", href: "/admin/company/recommendations", icon: Sparkles },
    { label: "Invitations", href: "/admin/company/invitations", icon: Send },
    { label: "Notifications", href: "/admin/company/notifications", icon: Bell },
  ];

  return (
    <div className="container mx-auto px-6 md:px-12 py-8 space-y-8">
      {/* Company Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-mono mb-1">
            <Building2 size={14} />
            <span>سديم للتقنية والابتكار — Sadeem Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Company Management
          </h1>
          <p className="text-xs text-muted mt-1">
            إدارة فرق العمل، الأعضاء، المهام، التوجيهات الإدارية، وسلسلة الاعتماد
          </p>
        </div>

        {/* Sub-nav horizontal pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1.5 rounded-xl border border-border">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Company Module Content */}
      <div>{children}</div>
    </div>
  );
}
