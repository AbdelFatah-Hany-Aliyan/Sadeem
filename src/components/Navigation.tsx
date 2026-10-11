"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t.nav.work, href: "#work" },
    { label: t.nav.capabilities, href: "#capabilities" },
    { label: t.nav.studio, href: "#studio" },
    { label: t.nav.contact, href: "#contact" },
  ];

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const toggleMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "py-4 bg-background/80 backdrop-blur-md border-b border-border" : "py-6 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center relative z-50">
          <Link href="/" className="group flex items-center gap-2" onClick={closeMenu}>
            <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
              Sadeem
            </span>
            <span className="text-foreground/20">/</span>
            <span dir="rtl" lang="ar" className="text-xl font-bold font-arabic text-foreground group-hover:text-foreground/80 transition-colors">
              سديم
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8 text-sm font-medium text-foreground/70">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center gap-4 border-l rtl:border-l-0 rtl:border-r border-border pl-8 rtl:pl-0 rtl:pr-8">
              <button
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                aria-label="Toggle language"
                className="text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
              >
                {language === "en" ? "عربي" : "EN"}
              </button>
              
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                  className="text-foreground hover:text-foreground/70 transition-colors flex items-center justify-center"
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden text-foreground p-2 -mr-2 relative z-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/50"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span
                className={`w-full h-[2px] bg-foreground transition-all duration-300 origin-left ${
                  mobileMenuOpen ? "rotate-45 translate-x-[2px] -translate-y-[1px]" : ""
                }`}
              />
              <span
                className={`w-full h-[2px] bg-foreground transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-full h-[2px] bg-foreground transition-all duration-300 origin-left ${
                  mobileMenuOpen ? "-rotate-45 translate-x-[2px] translate-y-[1px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col justify-center items-center md:hidden"
          >
            <nav className="flex flex-col items-center gap-8 mb-12">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="text-3xl font-bold tracking-tight text-foreground hover:text-foreground/70 transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-8"
            >
              <button
                onClick={() => {
                  setLanguage(language === "en" ? "ar" : "en");
                }}
                className="text-lg font-medium text-foreground hover:text-foreground/70 transition-colors"
              >
                {language === "en" ? "عربي" : "EN"}
              </button>
              
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                  className="text-foreground hover:text-foreground/70 transition-colors flex items-center justify-center p-2 border border-border rounded-full"
                >
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute bottom-12 flex items-center gap-2"
            >
              <span className="text-sm font-bold tracking-tight text-foreground/50">
                Sadeem
              </span>
              <span className="text-foreground/10">/</span>
              <span dir="rtl" lang="ar" className="text-sm font-bold font-arabic text-foreground/50">
                سديم
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
