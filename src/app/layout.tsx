import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Providers } from "@/providers/Providers";
import { getCachedPublishedWebsiteContent } from "@/lib/services/contentService";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const arabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sadeem | سديم - Technology Startup Studio",
  description: "We Build Systems. We Turn Ideas Into Companies. Sadeem builds custom business systems, digital products, and new ventures from idea to launch.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load published content from Next.js Data Cache (with static baseline fallback)
  const [publishedEn, publishedAr] = await Promise.all([
    getCachedPublishedWebsiteContent("en"),
    getCachedPublishedWebsiteContent("ar"),
  ]);

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${arabic.variable} antialiased bg-background text-foreground min-h-screen flex flex-col font-sans`}>
        <Providers initialContent={{ en: publishedEn, ar: publishedAr }}>
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
