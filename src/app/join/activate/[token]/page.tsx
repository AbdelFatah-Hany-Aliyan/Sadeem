import { hashToken } from "@/lib/services/invitationService";
import { activateAccountAction } from "@/app/join/actions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { KeyRound, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    token: string;
  };
}

export default async function ActivationPage({ params }: PageProps) {
  const { token } = params;
  const tokenHash = hashToken(token);

  const activationToken = await prisma.accountActivationToken.findUnique({
    where: { tokenHash },
    include: {
      member: {
        include: {
          adminUser: true,
          memberships: {
            where: { isPrimary: true },
            include: { team: true },
          },
        },
      },
    },
  });

  const now = new Date();
  const isExpired = activationToken ? activationToken.expiresAt < now : false;
  const isConsumed = activationToken ? activationToken.consumedAt !== null : false;

  if (!activationToken || isExpired) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <XCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            رابط التفعيل غير صالح أو منتهي الصلاحية
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            {isExpired
              ? "انتهت فترة صلاحية رابط التفعيل. يرجى التواصل مع إدارة سديم لإعادة إرسال رابط تفعيل جديد."
              : "رمز التفعيل المقدم غير صحيح. تأكد من استخدام الرابط المرسل إلى بريدك الإلكتروني بدقة."}
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors"
            >
              العودة للرئيسية / Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isConsumed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            تم تفعيل الحساب مسبقاً
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            تم تفعيل حسابك وإنشاء كلمة المرور مسبقاً. يمكنك تسجيل الدخول مباشرة إلى لوحة التحكم.
          </p>
          <div className="pt-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors"
            >
              <span>تسجيل الدخول / Log In</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const member = activationToken.member;

  async function handleActivate(formData: FormData) {
    "use server";
    await activateAccountAction(formData);
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-surface/90 backdrop-blur-md border border-border rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            تفعيل حساب العضوية
          </h1>
          <p className="text-xs text-muted">
            مرحباً بك في سديم! قم بتعيين كلمة مرور آمنة لتفعيل حسابك والبدء في استخدام المنصة
          </p>
        </div>

        {/* Member badge */}
        <div className="bg-background/80 border border-border/80 rounded-xl p-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">العضو:</span>
            <span className="font-semibold text-foreground">
              {member.fullNameAr || member.fullNameEn}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">المسمى:</span>
            <span className="font-mono text-foreground">
              {member.jobTitleAr || member.jobTitleEn}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">البريد الإلكتروني:</span>
            <span className="font-mono text-foreground">{member.email}</span>
          </div>
        </div>

        {/* Password Form */}
        <form action={handleActivate} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">
              كلمة المرور الجديدة / New Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-[10px] text-muted font-mono">
              8 أحرف كحد أدنى / Minimum 8 characters
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">
              تأكيد كلمة المرور / Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            <span>تعيين كلمة المرور وتفعيل الحساب</span>
          </button>
        </form>

        <p className="text-center text-[10px] text-muted font-mono">
          سديم للتقنية والابتكار • Sadeem Technology Studio
        </p>
      </div>
    </div>
  );
}
