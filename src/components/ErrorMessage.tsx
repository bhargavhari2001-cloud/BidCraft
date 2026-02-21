"use client";

import { AlertCircle, WifiOff, FileWarning, RefreshCw } from "lucide-react";

type ErrorType = "api" | "network" | "file" | "generic";

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: ErrorType;
  onRetry?: () => void;
  supportedFormats?: string[];
  maxSize?: string;
}

const errorConfig: Record<ErrorType, { icon: typeof AlertCircle; color: string }> = {
  api: { icon: AlertCircle, color: "red" },
  network: { icon: WifiOff, color: "amber" },
  file: { icon: FileWarning, color: "orange" },
  generic: { icon: AlertCircle, color: "red" },
};

export default function ErrorMessage({
  title,
  message,
  type = "generic",
  onRetry,
  supportedFormats,
  maxSize,
}: ErrorMessageProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const defaultTitles: Record<ErrorType, string> = {
    api: "Something went wrong",
    network: "Connection error",
    file: "Invalid file",
    generic: "Error",
  };

  return (
    <div className={`rounded-2xl border border-${config.color}-500/20 bg-${config.color}-500/[0.04] p-8 text-center`}>
      <div className={`w-12 h-12 rounded-xl bg-${config.color}-500/10 flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-5 h-5 text-${config.color}-400`} />
      </div>
      <p className={`text-sm text-${config.color}-300 font-medium mb-2`}>
        {title || defaultTitles[type]}
      </p>
      <p className="text-xs text-white/30 mb-1">{message}</p>
      {supportedFormats && (
        <p className="text-xs text-white/20 mb-1">
          Supported formats: {supportedFormats.join(", ")}
        </p>
      )}
      {maxSize && (
        <p className="text-xs text-white/20 mb-1">Maximum size: {maxSize}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
