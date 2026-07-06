"use client";

import { useId } from "react";
import {
  LOGO_VIEWBOX,
  LOGO_TRANSFORM,
  LOGO_PATH_D,
  LOGO_GRADIENT_FROM,
  LOGO_GRADIENT_TO,
} from "@/lib/logoPath";

export interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 28, className }: LogoProps) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_VIEWBOX}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LOGO_GRADIENT_FROM} />
          <stop offset="100%" stopColor={LOGO_GRADIENT_TO} />
        </linearGradient>
      </defs>
      <g transform={LOGO_TRANSFORM}>
        <path d={LOGO_PATH_D} fill={`url(#${gradientId})`} fillRule="nonzero" />
      </g>
    </svg>
  );
}
