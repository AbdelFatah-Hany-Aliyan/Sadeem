"use client";

import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Footer() {
  const { t, language } = useLanguage();
  
  return (
    <footer className="border-t border-border bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold tracking-tight text-foreground">Sadeem</span>
              <span className="text-foreground/20">/</span>
              <span dir="rtl" lang="ar" className="text-2xl font-bold font-arabic text-foreground">سديم</span>
            </Link>
            <p className="text-foreground/50 text-sm max-w-sm text-balance">
              {t.hero.line1} {t.hero.line2}
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground font-medium mb-6 text-sm tracking-wider uppercase">{t.footer.navigation}</h4>
            <ul className="space-y-4 text-sm text-foreground/50">
              <li><Link href="#work" className="hover:text-foreground transition-colors">{t.nav.work}</Link></li>
              <li><Link href="#capabilities" className="hover:text-foreground transition-colors">{t.nav.capabilities}</Link></li>
              <li><Link href="#studio" className="hover:text-foreground transition-colors">{t.nav.studio}</Link></li>
              <li><Link href="#contact" className="hover:text-foreground transition-colors">{t.nav.contact}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-foreground font-medium mb-6 text-sm tracking-wider uppercase">{t.footer.connect}</h4>
            <ul className="space-y-4 text-sm text-foreground/50">
              <li><a href="mailto:hello@sadeem.studio" className="hover:text-foreground transition-colors">hello@sadeem.studio</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter / X</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border text-xs text-foreground/30">
          <p>&copy; {new Date().getFullYear()} {t.common.sadeem}. {t.footer.allRightsReserved}</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            <span>{t.footer.designedAndBuiltBy}</span>
            <span className="text-foreground/70 font-medium">Sadeem</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
