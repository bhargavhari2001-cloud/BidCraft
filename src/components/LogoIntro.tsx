"use client";

import { useEffect, useRef, useState } from "react";
import {
  LOGO_VIEWBOX,
  LOGO_TRANSFORM,
  LOGO_PATH_D,
  LOGO_GRADIENT_FROM,
  LOGO_GRADIENT_TO,
} from "@/lib/logoPath";
import { acquireScrollLock } from "@/lib/scrollLock";

// Phase durations (ms). Compressed from the source reference animation
// (which ran ~4s) since this plays on every load — a shorter version reads
// as the same effect without feeling like a tax on repeat visits.
const DRAW_MS = 900;
const FILL_MS = 600;
const LAND_MS = 700;
const HOLD_MS = 150; // brief pause on the settled mark before landing

type Phase = "draw" | "fill" | "hold" | "land" | "done";

export default function LogoIntro() {
  const [phase, setPhase] = useState<Phase>("draw");
  const [landTransform, setLandTransform] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect the OS-level motion preference: skip straight to the settled
    // state rather than forcing a ~2.3s animation on every load regardless.
    // matchMedia is browser-only and can't be read during SSR, so this can
    // only be decided here, on mount — the documented exception to this rule.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      return;
    }

    const release = acquireScrollLock();

    const t1 = setTimeout(() => setPhase("fill"), DRAW_MS);
    const t2 = setTimeout(() => setPhase("hold"), DRAW_MS + FILL_MS);
    const t3 = setTimeout(() => {
      const anchor = document.getElementById("bidcraft-logo-anchor");
      const box = containerRef.current?.querySelector<HTMLElement>("[data-logo-box]");
      if (anchor && box) {
        const from = box.getBoundingClientRect();
        const to = anchor.getBoundingClientRect();
        const scale = to.width / from.width;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        setLandTransform(`translate(${dx}px, ${dy}px) scale(${scale})`);
      }
      // If the anchor isn't found (shouldn't happen — the sidebar always
      // renders), landTransform stays "" and the overlay just fades out
      // via opacity below instead of landing precisely anywhere.
      setPhase("land");
    }, DRAW_MS + FILL_MS + HOLD_MS);
    const t4 = setTimeout(() => {
      setPhase("done");
      release();
    }, DRAW_MS + FILL_MS + HOLD_MS + LAND_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      release();
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#05070C",
        opacity: phase === "land" ? 0 : 1,
        pointerEvents: "none",
        transition: `opacity ${LAND_MS}ms ease-in`,
      }}
    >
      <div
        data-logo-box
        style={{
          width: 160,
          height: 160,
          transform: phase === "land" ? landTransform : "none",
          transition: phase === "land" ? `transform ${LAND_MS}ms cubic-bezier(0.4,0,0.2,1)` : "none",
          transformOrigin: "center",
        }}
      >
        <svg width="100%" height="100%" viewBox={LOGO_VIEWBOX} fill="none">
          <defs>
            <linearGradient id="logo-intro-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LOGO_GRADIENT_FROM} />
              <stop offset="100%" stopColor={LOGO_GRADIENT_TO} />
            </linearGradient>
          </defs>
          <g transform={LOGO_TRANSFORM}>
            {/* Outline layer: draws on via a normalized (pathLength=1) dash reveal */}
            <path
              d={LOGO_PATH_D}
              fill="none"
              stroke="url(#logo-intro-gradient)"
              strokeWidth={28}
              fillRule="nonzero"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: phase === "draw" ? 1 : 0,
                transition: phase === "draw" ? `stroke-dashoffset ${DRAW_MS}ms ease-out` : "none",
                filter: "drop-shadow(0 0 12px rgba(74,158,255,0.5))",
              }}
            />
            {/* Fill layer: cross-fades in once the outline has drawn */}
            <path
              d={LOGO_PATH_D}
              fill="url(#logo-intro-gradient)"
              fillRule="nonzero"
              style={{
                opacity: phase === "draw" ? 0 : 1,
                transition: phase === "fill" ? `opacity ${FILL_MS}ms ease-in` : "none",
              }}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
