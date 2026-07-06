"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { acquireScrollLock } from "@/lib/scrollLock";

const NAV_SECTIONS = [
  {
    heading: "Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "M3 13h8V3H3zM13 21h8V8h-8zM3 21h8v-6H3zM13 3v3",
      },
      {
        href: "/",
        label: "Upload RFP",
        icon: "M12 3v12M7 8l5-5 5 5M5 21h14",
      },
      {
        href: "/responses",
        label: "Responses",
        icon: "M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01",
        badge: "24",
      },
      {
        href: "/review",
        label: "Review & Edit",
        icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
      },
    ],
  },
  {
    heading: "Library",
    items: [
      {
        href: "/knowledge-base",
        label: "Knowledge Base",
        icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z",
      },
      {
        href: "/profile",
        label: "Company Profile",
        icon: "M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01",
      },
    ],
  },
  {
    heading: "Archive",
    items: [
      {
        href: "/history",
        label: "History",
        icon: "M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8M3 3v5h5M12 7v5l4 2",
      },
    ],
  },
] as const;

export default function SideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation. Adjusted during render (React's
  // recommended pattern for "reset state when a prop changes") rather than
  // an effect, which would cause an extra render pass for the same result.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const release = acquireScrollLock();
    return release;
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="primary-nav"
      >
        <Menu aria-hidden="true" style={{ width: 18, height: 18 }} />
      </button>

      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <nav
        id="primary-nav"
        aria-label="Primary navigation"
        className={`sidenav${mobileOpen ? " mobile-open" : ""}`}
        style={{
          width: 236,
          flexShrink: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          // Only visible in dark theme — light theme's --sb-bg is fully
          // opaque, so backdrop-filter has nothing to blur and no effect.
          // (Tailwind's CSS pipeline drops backdrop-filter from compiled
          // stylesheets in some rule shapes, so this stays inline.)
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/dashboard"
            aria-label="BidCraft — go to dashboard"
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <div
              id="bidcraft-logo-anchor"
              aria-hidden="true"
              style={{
                width: 30, height: 30, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Logo size={26} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em", color: "var(--sb-fg,var(--text,#1B1A17))" }}>
                BidCraft
              </span>
              <span style={{
                fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: "0.14em",
                color: "var(--sb-muted,var(--faint,#8A867D))", textTransform: "uppercase",
              }}>
                Bid Desk
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="mobile-close-btn"
            style={{
              display: "none",
              width: 30, height: 30, borderRadius: 6,
              background: "none", border: "none", cursor: "pointer",
              alignItems: "center", justifyContent: "center",
              color: "var(--sb-muted,var(--muted,#6B6862))",
            }}
          >
            <X aria-hidden="true" style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading}>
              <div style={{
                fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: "0.13em",
                textTransform: "uppercase", color: "var(--sb-muted,var(--placeholder,#9b978d))",
                padding: "14px 10px 6px",
              }}>
                {section.heading}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
                const badge = "badge" in item ? item.badge : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", textAlign: "left",
                      padding: "7px 10px", borderRadius: 7,
                      fontFamily: "'Geist',sans-serif", fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? "var(--sb-active,#FFFFFF)" : "transparent",
                      color: isActive ? "var(--sb-fg,#1B1A17)" : "var(--sb-muted,#7b756a)",
                      textDecoration: "none",
                      transition: "background .12s, color .12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--sb-active,#FFFFFF)";
                        e.currentTarget.style.color = "var(--sb-fg,#1B1A17)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--sb-muted,#7b756a)";
                      }
                    }}
                  >
                    <svg
                      width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, opacity: 0.9 }}
                      aria-hidden="true"
                    >
                      <path d={item.icon} />
                    </svg>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge && (
                      <span style={{
                        fontFamily: "'Geist Mono',monospace", fontSize: 10.5, fontWeight: 500,
                        padding: "1px 6px", borderRadius: 20,
                        background: isActive ? "var(--accent,var(--accent))" : "var(--bd,#E7E5DE)",
                        color: isActive ? "#04130A" : "var(--sb-muted,#8A867D)",
                      }}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Theme toggle + user profile */}
        <div style={{ padding: 12, borderTop: "1px solid var(--sb-border,var(--bd,#E5E3DC))", display: "flex", flexDirection: "column", gap: 6 }}>
          <ThemeToggle />
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8,
            background: "var(--sb-active,#FFFFFF)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#2b3a2f,#557a5f)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 600,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sb-fg,#1B1A17)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                User
              </div>
              <div style={{ fontSize: 10.5, color: "var(--sb-muted,#7b756a)" }}>
                Bid Manager
              </div>
            </div>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pos)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--pos) 18%, transparent)", flexShrink: 0 }} />
          </div>
        </div>
      </nav>
    </>
  );
}
