import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";
import SideNav from "@/components/SideNav";
import LogoIntro from "@/components/LogoIntro";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BidCraft — AI-Powered RFP Automation",
  description: "Upload your RFP and let AI extract questions, generate responses, and export winning proposals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before hydration to avoid a flash of the wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "var(--bg,#FAF9F6)", color: "var(--text,#1B1A17)", fontFamily: "'Geist',system-ui,sans-serif" }}>
          <SideNav />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
            {children}
          </div>
        </div>
        <ToastContainer />
        <LogoIntro />
      </body>
    </html>
  );
}
