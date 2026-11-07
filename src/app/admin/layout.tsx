import Link from "next/link";
import { getSession, CurrentUserSession } from "@/lib/auth/session";
import { logoutAction } from "@/app/admin/actions";
import { 
  LayoutDashboard, 
  FolderKanban, 
  PlusCircle, 
  Eye, 
  LogOut, 
  Shield, 
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: CurrentUserSession | null = null;
  try {
    session = await getSession();
  } catch (error: any) {
    if (error?.isInfrastructureError || error?.name === "AuthInfrastructureError") {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-surface/90 backdrop-blur-md text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-bold text-foreground">Authentication Dependency Unavailable</h2>
            <p className="text-xs text-muted leading-relaxed">
              The database connection timed out or is temporarily unreachable while validating your session. Your credentials and session remain safe.
            </p>
            <div className="pt-2">
              <a
                href="/admin"
                className="inline-block px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-sm"
              >
                Retry Connection
              </a>
            </div>
          </div>
        </div>
      );
    }
    throw error;
  }

  // If user is on the login page or unauthenticated, let child pages handle login view
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Admin Navigation Bar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-foreground">
                Sadeem<span className="text-accent">.</span>studio
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30 uppercase tracking-widest">
                ADMIN
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard size={14} />
                Overview
              </Link>
              <Link
                href="/admin/projects"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <FolderKanban size={14} />
                Projects
              </Link>
              <Link
                href="/admin/content"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <FileText size={14} />
                Content
              </Link>
              <Link
                href="/admin/media"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <ImageIcon size={14} />
                Media
              </Link>
              <Link
                href="/admin/inquiries"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <Inbox size={14} />
                Inquiries
              </Link>
              <Link
                href="/admin/projects/new"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition-colors flex items-center gap-1.5"
              >
                <PlusCircle size={14} />
                New Project
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Direct preview links */}
            <Link
              href="/work-preview"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-muted hover:text-accent transition-colors"
              title="Preview all draft case studies"
            >
              <Eye size={14} />
              <span>Draft Previews</span>
              <ExternalLink size={11} className="text-muted/60" />
            </Link>

            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            {/* Current Admin User Identity */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-foreground font-semibold leading-none">{session.name}</span>
                <span className="text-[10px] text-muted leading-tight">{session.role}</span>
              </div>
            </div>

            {/* Logout Action */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-lg border border-border bg-surface hover:border-red-500/40 hover:text-red-400 text-muted transition-colors"
                title="Log Out"
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
