"use client";

import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Footer() {
  const { t, language } = useLanguage();
  
  return (
    <footer className="border-t border-border bg-background pt-24 pb-12 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#C28E62]" />
              <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                Sadeem
              </span>
              <span className="text-muted/30">/</span>
              <span dir="rtl" lang="ar" className="text-2xl font-bold font-arabic text-foreground group-hover:text-accent transition-colors">
                سديم
              </span>
            </Link>
            <p className="text-muted text-sm max-w-sm leading-relaxed text-balance">
              {t.hero.desc}
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-6 text-xs font-mono tracking-widest uppercase text-accent">
              {t.footer.navigation}
            </h4>
            <ul className="space-y-3.5 text-sm text-muted">
              <li><Link href="/#work" className="hover:text-accent transition-colors">{t.nav.work}</Link></li>
              <li><Link href="/#capabilities" className="hover:text-accent transition-colors">{t.nav.capabilities}</Link></li>
              <li><Link href="/#studio" className="hover:text-accent transition-colors">{t.nav.studio}</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">{t.nav.contact}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-6 text-xs font-mono tracking-widest uppercase text-steel">
              {t.footer.connect}
            </h4>
            <ul className="space-y-3.5 text-sm text-muted">
              <li><a href="mailto:hello@sadeem.studio" className="hover:text-accent transition-colors">hello@sadeem.studio</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Twitter / X</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border text-xs font-mono text-muted/70">
          <p>&copy; {new Date().getFullYear()} {t.common.sadeem}. {t.footer.allRightsReserved}</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            <span>{t.footer.designedAndBuiltBy}</span>
            <span className="text-accent font-semibold">Sadeem Studio</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
