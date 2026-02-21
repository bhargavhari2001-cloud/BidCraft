"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: "sm" | "md" | "lg";
  progress?: number;
}

export default function LoadingSpinner({
  message = "Processing...",
  subMessage,
  size = "md",
  progress,
}: LoadingSpinnerProps) {
  const sizeMap = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <Loader2 className={`${sizeMap[size]} text-violet-400 animate-spin`} />
        <div className="absolute inset-0 rounded-full bg-violet-400/10 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white/70 font-medium">{message}</p>
        {subMessage && (
          <p className="text-xs text-white/30 mt-1">{subMessage}</p>
        )}
      </div>
      {progress !== undefined && (
        <div className="w-48">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-white/20 text-center mt-1.5">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}
