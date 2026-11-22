"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./LanguageProvider";
import { ReactNode } from "react";
import { Language, Content } from "@/content";

interface ProvidersProps {
  children: ReactNode;
  initialContent?: Record<Language, Content>;
}

export function Providers({ children, initialContent }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider initialContent={initialContent}>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
