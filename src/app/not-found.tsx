import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] bg-steel/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 p-8 rounded-2xl border border-border bg-surface/80 backdrop-blur-md shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl border border-border bg-background/80 flex items-center justify-center text-accent shadow-md">
          <Compass size={32} />
        </div>

        <span className="inline-block px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-xs font-mono text-accent uppercase tracking-widest mb-4">
          404 // NOT FOUND
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Page or Case Study Not Found
        </h1>

        <p className="text-sm text-muted mb-2 leading-relaxed">
          The requested project or page does not exist, has been archived, or has not been published yet.
        </p>
        <p className="text-xs text-muted/80 font-mono mb-8" dir="rtl">
          الصفحة أو دراسة الحالة المطلوبة غير متوفرة أو لم تُنشر بعد في الوقت الحالي.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md"
        >
          <ArrowLeft size={14} />
          Return to Homepage / العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
