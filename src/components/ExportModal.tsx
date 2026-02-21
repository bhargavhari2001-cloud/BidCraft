"use client";

import { useState, useMemo } from "react";
import {
  X,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Hash,
  List,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { RFPQuestion, GeneratedResponse, ResponseFeedback } from "@/types";
import { generateResponseDocx } from "@/lib/docxGenerator";
import { showToast } from "@/components/Toast";

export interface ExportModalProps {
  questions: RFPQuestion[];
  responses: Record<string, GeneratedResponse>;
  feedbackMap?: Record<string, ResponseFeedback>;
  rfpTitle: string;
  issuingOrg?: string;
  deadline?: string | null;
  defaultCompanyName?: string;
  onClose: () => void;
}

export default function ExportModal({
  questions,
  responses,
  feedbackMap,
  rfpTitle,
  issuingOrg,
  deadline,
  defaultCompanyName,
  onClose,
}: ExportModalProps) {
  // ── Options state ──
  const [includeOnlyCompleted, setIncludeOnlyCompleted] = useState(false);
  const [includeConfidenceScores, setIncludeConfidenceScores] = useState(false);
  const [includeSourceRefs, setIncludeSourceRefs] = useState(false);
  const [includeToc, setIncludeToc] = useState(true);
  const [companyName, setCompanyName] = useState(defaultCompanyName || "");
  const [rfpRefNumber, setRfpRefNumber] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Preview stats ──
  const stats = useMemo(() => {
    const completedIds = new Set(
      Object.entries(feedbackMap ?? {})
        .filter(([, fb]) => fb.reviewStatus === "complete")
        .map(([id]) => id)
    );

    const total = questions.length;
    const completed = completedIds.size;
    const answered = questions.filter((q) => {
      const r = responses[q.id];
      return r && (r.status === "generated" || r.status === "edited" || r.editedContent || r.draft);
    }).length;

    const willExport = includeOnlyCompleted ? completed : total;
    const categories = [
      ...new Set(
        (includeOnlyCompleted
          ? questions.filter((q) => completedIds.has(q.id))
          : questions
        ).map((q) => q.category)
      ),
    ];

    const confidences = questions
      .map((q) => responses[q.id]?.confidence)
      .filter((c): c is number => typeof c === "number" && c > 0);
    const avgConf =
      confidences.length > 0
        ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
        : 0;

    return { total, completed, answered, willExport, categories, avgConf };
  }, [questions, responses, feedbackMap, includeOnlyCompleted]);

  // ── Generate & download ──
  const handleExport = async () => {
    if (stats.willExport === 0) {
      showToast("error", "No questions to export. Check your filter settings.");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateResponseDocx({
        rfpTitle,
        issuingOrganization: issuingOrg,
        submissionDeadline: deadline,
        questions,
        responses,
        feedbackMap,
        companyName: companyName.trim() || undefined,
        rfpReferenceNumber: rfpRefNumber.trim() || undefined,
        includeTableOfContents: includeToc,
        includeOnlyCompleted,
        includeConfidenceScores,
        includeSourceReferences: includeSourceRefs,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const datePart = new Date().toISOString().split("T")[0];
      const titleSlug = (rfpTitle || "RFP-Responses").replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      a.download = `${titleSlug}_${datePart}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("success", "Document exported successfully");
      onClose();
    } catch (err) {
      console.error("Export error:", err);
      showToast("error", "Failed to generate document. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#131827] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-sm font-semibold">
                Export to Word
              </h2>
              <p className="text-xs text-white/30 mt-0.5 truncate max-w-[260px]">
                {rfpTitle || "RFP Responses"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Document Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide">
              Document Details
            </h3>

            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Company Name
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> RFP Reference Number
                  <span className="text-white/20 font-normal normal-case">(optional)</span>
                </span>
                <input
                  type="text"
                  value={rfpRefNumber}
                  onChange={(e) => setRfpRefNumber(e.target.value)}
                  placeholder="e.g. RFP-2026-001"
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                />
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide">
              Export Options
            </h3>

            <div className="space-y-2">
              <ToggleRow
                icon={<List className="w-3.5 h-3.5" />}
                label="Include only completed questions"
                description={
                  feedbackMap
                    ? `${stats.completed} of ${stats.total} marked complete`
                    : "Requires questions to be reviewed first"
                }
                checked={includeOnlyCompleted}
                onChange={setIncludeOnlyCompleted}
                disabled={!feedbackMap || stats.completed === 0}
              />

              <ToggleRow
                icon={<Eye className="w-3.5 h-3.5" />}
                label="Include AI confidence scores"
                description="Adds confidence % next to each response"
                checked={includeConfidenceScores}
                onChange={setIncludeConfidenceScores}
              />

              <ToggleRow
                icon={<BookOpen className="w-3.5 h-3.5" />}
                label="Include source references"
                description="Lists Knowledge Base entries used per response"
                checked={includeSourceRefs}
                onChange={setIncludeSourceRefs}
              />

              <ToggleRow
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="Include table of contents"
                description="Adds a TOC placeholder (update in Word)"
                checked={includeToc}
                onChange={setIncludeToc}
              />
            </div>
          </div>

          {/* Preview / Stats */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs font-medium text-white/40 mb-3">Export Preview</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Questions"
                value={`${stats.willExport}${includeOnlyCompleted ? ` of ${stats.total}` : ""}`}
                highlight={stats.willExport > 0}
              />
              <Stat label="Answered" value={`${stats.answered} of ${stats.total}`} />
              <Stat label="Sections" value={String(stats.categories.length)} />
              {stats.avgConf > 0 && (
                <Stat
                  label="Avg Confidence"
                  value={`${stats.avgConf}%`}
                  highlight={stats.avgConf >= 70}
                />
              )}
            </div>
            {stats.willExport === 0 && (
              <p className="text-xs text-amber-400 mt-3">
                No questions match the current filter. Disable &ldquo;completed only&rdquo; to export all.
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating || stats.willExport === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate and download Word document"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating document…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate &amp; Download ({stats.willExport} question{stats.willExport !== 1 ? "s" : ""})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed border-white/[0.04] bg-transparent"
          : checked
          ? "border-violet-500/25 bg-violet-500/[0.06] hover:bg-violet-500/[0.09]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${checked && !disabled ? "text-violet-400" : "text-white/30"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-white/80 block">{label}</span>
        <span className="text-[10px] text-white/30 mt-0.5 block">{description}</span>
      </div>
      <div className="shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only"
          aria-label={label}
        />
        <div
          className={`w-8 h-4.5 rounded-full transition-all relative ${
            checked && !disabled ? "bg-violet-500" : "bg-white/[0.12]"
          }`}
          aria-hidden="true"
        >
          <div
            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${
              checked ? "left-4" : "left-0.5"
            }`}
          />
        </div>
      </div>
    </label>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-white/30">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-violet-300" : "text-white/70"}`}>
        {value}
      </span>
    </div>
  );
}
