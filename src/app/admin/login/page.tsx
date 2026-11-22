import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/LoginForm";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-steel/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3 text-2xl font-bold tracking-tight text-foreground">
            Sadeem<span className="text-accent">.</span>studio
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <h1 className="text-xs font-mono uppercase tracking-widest text-accent font-bold">
              Administrative Control Center
            </h1>
          </div>
          <p className="text-xs text-muted font-mono">
            Authorized Studio Team Access Only
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/90 backdrop-blur-md p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle top metallic accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Login Form Client Component */}
          <LoginForm />
        </div>

        {/* Back Link & Security Notice */}
        <div className="mt-8 text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Public Homepage
          </Link>

          <p className="text-[11px] font-mono text-muted/60 max-w-xs mx-auto leading-relaxed">
            All administrative operations and authentication attempts are cryptographically timestamped and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
