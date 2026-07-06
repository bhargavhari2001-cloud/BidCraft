"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  // The inline anti-flash script already set data-theme on <html> before
  // hydration; read it back rather than re-deciding, so server and client
  // markup agree (avoids a hydration mismatch on first paint).
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Deliberate exception to react-hooks/set-state-in-effect: this reads a
    // client-only source (localStorage) after mount so server and first-paint
    // client markup agree (both render the "dark" default); this effect then
    // corrects to the real stored preference, exactly the pattern React docs
    // recommend for avoiding a hydration mismatch on client-only state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "7px 10px", borderRadius: 7,
        fontFamily: "'Geist',sans-serif", fontSize: 13, fontWeight: 500,
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--sb-muted,#7b756a)",
        transition: "background .12s, color .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--sb-active,#FFFFFF)";
        e.currentTarget.style.color = "var(--sb-fg,#1B1A17)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--sb-muted,#7b756a)";
      }}
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" style={{ width: 15, height: 15, flexShrink: 0 }} />
      ) : (
        <Moon aria-hidden="true" style={{ width: 15, height: 15, flexShrink: 0 }} />
      )}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
