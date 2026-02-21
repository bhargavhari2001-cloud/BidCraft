"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  RFPQuestion,
  GeneratedResponse,
  ResponseFeedback,
  ReviewStatus,
} from "@/types";
import {
  getLatestRFPSession,
  saveGeneratedResponses,
  getFeedbackForSession,
  saveFeedback,
  updateReviewStatus,
  bulkUpdateReviewStatus,
  getCompanyProfile,
} from "@/lib/storage";
import { showToast } from "@/components/Toast";
import type { RichTextEditorHandle } from "@/components/RichTextEditor";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Save,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  BookOpen,
  Star,
  BarChart3,
  Filter,
  SortAsc,
  CheckSquare,
  RotateCcw,
  Clock,
  FileText,
  Keyboard,
} from "lucide-react";
import ExportModal from "@/components/ExportModal";

// Dynamic import avoids SSR issues with TipTap
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[280px] rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="text-sm text-white/30">Loading editor...</div>
    </div>
  ),
});

// ── Constants ──────────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  Technical: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Security & Compliance": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "Experience & References": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  Staffing: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Methodology: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Pricing: { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  General: { bg: "bg-white/[0.06]", text: "text-white/60", dot: "bg-white/40" },
};

const reviewStatusConfig: Record<
  ReviewStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-white/[0.06]",
    text: "text-white/40",
    border: "border-white/[0.08]",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  complete: {
    label: "Complete",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  "needs-revision": {
    label: "Needs Revision",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
};

const STATUS_ORDER: ReviewStatus[] = ["in-progress", "needs-revision", "pending", "complete"];

// ── Helpers ────────────────────────────────────────────────────────────────

function textToHtml(text: string): string {
  if (!text) return "<p></p>";
  if (text.trimStart().startsWith("<")) return text;
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function htmlToText(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? div.innerText ?? "").trim();
}

function calcEditDistance(original: string, edited: string): number {
  const orig = original.toLowerCase().trim();
  const edit = edited.toLowerCase().trim();
  if (!orig) return 0;
  if (orig === edit) return 0;
  const origWords = orig.split(/\s+/);
  const editWords = edit.split(/\s+/);
  const origSet = new Set(origWords);
  const editSet = new Set(editWords);
  const intersect = [...origSet].filter((w) => editSet.has(w)).length;
  const union = new Set([...origWords, ...editWords]).size;
  if (union === 0) return 0;
  return Math.round((1 - intersect / union) * 100);
}

function confidenceColor(c: number) {
  if (c >= 85) return "text-emerald-400";
  if (c >= 60) return "text-amber-400";
  return "text-red-400";
}

function confidenceBarColor(c: number) {
  if (c >= 85) return "bg-emerald-400";
  if (c >= 60) return "bg-amber-400";
  return "bg-red-400";
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const router = useRouter();

  // ── Core data ──
  const [questions, setQuestions] = useState<RFPQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, GeneratedResponse>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, ResponseFeedback>>({});
  const [sessionId, setSessionId] = useState("");
  const [rfpTitle, setRfpTitle] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [defaultCompanyName, setDefaultCompanyName] = useState("");

  // ── Navigation ──
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // ── Sidebar controls ──
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"number" | "category" | "status" | "confidence">("number");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // ── Editor state ──
  const [editorHtml, setEditorHtml] = useState("");
  const [editorWordCount, setEditorWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  // Track last loaded question to avoid stale save
  const lastLoadedQuestionId = useRef<string | null>(null);

  // ── Inline feedback form state (per selected question) ──
  const [pendingStarRating, setPendingStarRating] = useState<number | null>(null);
  const [pendingHelpful, setPendingHelpful] = useState<boolean | null>(null);
  const [pendingFeedbackText, setPendingFeedbackText] = useState("");

  // ── Load session on mount ──
  useEffect(() => {
    const session = getLatestRFPSession();
    if (!session) return;

    setSessionId(session.id);
    setRfpTitle(session.rfpTitle);
    setIssuingOrg(session.issuingOrganization);
    setDeadline(session.submissionDeadline);
    setQuestions(session.questions);

    const respMap: Record<string, GeneratedResponse> = {};
    session.responses.forEach((r) => { respMap[r.questionId] = r; });
    setResponses(respMap);

    const fb = getFeedbackForSession(session.id);
    setFeedbackMap(fb);

    if (session.questions.length > 0) {
      setSelectedQuestionId(session.questions[0].id);
    }

    const profile = getCompanyProfile();
    if (profile?.name) setDefaultCompanyName(profile.name);
  }, []);

  // ── Load per-question feedback fields when selection changes ──
  useEffect(() => {
    if (!selectedQuestionId) return;
    const fb = feedbackMap[selectedQuestionId];
    setPendingStarRating(fb?.starRating ?? null);
    setPendingHelpful(fb?.helpful ?? null);
    setPendingFeedbackText(fb?.feedbackText ?? "");
  }, [selectedQuestionId, feedbackMap]);

  // ── Derived: displayed question list (filtered + sorted) ──
  const displayedQuestions = useMemo(() => {
    let qs = [...questions];

    if (filterStatus !== "all") {
      qs = qs.filter((q) => {
        const s = feedbackMap[q.id]?.reviewStatus ?? "pending";
        return s === filterStatus;
      });
    }

    switch (sortBy) {
      case "category":
        qs.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "status":
        qs.sort((a, b) => {
          const sa = feedbackMap[a.id]?.reviewStatus ?? "pending";
          const sb = feedbackMap[b.id]?.reviewStatus ?? "pending";
          return STATUS_ORDER.indexOf(sa) - STATUS_ORDER.indexOf(sb);
        });
        break;
      case "confidence":
        qs.sort(
          (a, b) => (responses[b.id]?.confidence ?? 0) - (responses[a.id]?.confidence ?? 0)
        );
        break;
      default:
        // "number" — original order
        break;
    }

    return qs;
  }, [questions, filterStatus, sortBy, feedbackMap, responses]);

  // ── Auto-select first displayed question when filter empties out selection ──
  useEffect(() => {
    if (!selectedQuestionId) return;
    if (!displayedQuestions.find((q) => q.id === selectedQuestionId)) {
      setSelectedQuestionId(displayedQuestions[0]?.id ?? null);
    }
  }, [displayedQuestions, selectedQuestionId]);

  // ── Selected question derived data ──
  const selectedIdx = displayedQuestions.findIndex((q) => q.id === selectedQuestionId);
  const selectedQuestion = displayedQuestions[selectedIdx] ?? null;
  const selectedResponse = selectedQuestion ? responses[selectedQuestion.id] : null;
  const selectedFeedback = selectedQuestion ? feedbackMap[selectedQuestion.id] : null;
  const selectedStatus: ReviewStatus = selectedFeedback?.reviewStatus ?? "pending";

  // ── Stats ──
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, "in-progress": 0, complete: 0, "needs-revision": 0 };
    questions.forEach((q) => {
      const s: ReviewStatus = feedbackMap[q.id]?.reviewStatus ?? "pending";
      counts[s]++;
    });
    return counts;
  }, [questions, feedbackMap]);

  const completionPct =
    questions.length > 0
      ? Math.round((statusCounts.complete / questions.length) * 100)
      : 0;

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; complete: number }> = {};
    questions.forEach((q) => {
      if (!map[q.category]) map[q.category] = { total: 0, complete: 0 };
      map[q.category].total++;
      if ((feedbackMap[q.id]?.reviewStatus ?? "pending") === "complete") {
        map[q.category].complete++;
      }
    });
    return map;
  }, [questions, feedbackMap]);

  // ── Save draft (persists to localStorage + updates feedback) ──
  const saveDraft = useCallback(
    (silent = false) => {
      if (!selectedQuestion || !editorRef.current || !sessionId) return;

      setIsSaving(true);
      const html = editorRef.current.getContent();
      const plain = htmlToText(html);
      const original = selectedResponse?.draft ?? "";
      const dist = calcEditDistance(original, plain);

      const updatedResp: GeneratedResponse = {
        ...(selectedResponse ?? {
          questionId: selectedQuestion.id,
          draft: "",
          tone: "professional",
          status: "edited" as const,
          editedContent: "",
          rating: null,
          confidence: 0,
        }),
        editedContent: plain,
        editedHtml: html,
        status: "edited" as const,
      };

      const newResponses = { ...responses, [selectedQuestion.id]: updatedResp };
      setResponses(newResponses);
      saveGeneratedResponses(sessionId, Object.values(newResponses));

      // Persist feedback
      const fb: ResponseFeedback = {
        questionId: selectedQuestion.id,
        sessionId,
        starRating: pendingStarRating,
        helpful: pendingHelpful,
        feedbackText: pendingFeedbackText,
        editDistance: dist,
        originalResponse: original,
        editedResponse: plain,
        editedHtml: html,
        reviewStatus:
          selectedFeedback?.reviewStatus === "pending" || !selectedFeedback?.reviewStatus
            ? "in-progress"
            : selectedFeedback.reviewStatus,
        updatedAt: new Date().toISOString(),
      };
      saveFeedback(fb);
      setFeedbackMap((prev) => ({ ...prev, [selectedQuestion.id]: fb }));

      setLastSaved(new Date());
      setIsSaving(false);

      if (!silent) showToast("success", "Draft saved");
    },
    [
      selectedQuestion,
      selectedResponse,
      selectedFeedback,
      responses,
      sessionId,
      pendingStarRating,
      pendingHelpful,
      pendingFeedbackText,
    ]
  );

  // ── Mark complete / needs-revision ──
  const setReviewStatus = useCallback(
    (status: ReviewStatus) => {
      if (!selectedQuestion || !sessionId) return;
      saveDraft(true);
      updateReviewStatus(sessionId, selectedQuestion.id, status);
      setFeedbackMap((prev) => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          reviewStatus: status,
          questionId: selectedQuestion.id,
          sessionId,
          starRating: prev[selectedQuestion.id]?.starRating ?? null,
          helpful: prev[selectedQuestion.id]?.helpful ?? null,
          feedbackText: prev[selectedQuestion.id]?.feedbackText ?? "",
          editDistance: prev[selectedQuestion.id]?.editDistance ?? 0,
          originalResponse: prev[selectedQuestion.id]?.originalResponse ?? "",
          editedResponse: prev[selectedQuestion.id]?.editedResponse ?? "",
          editedHtml: prev[selectedQuestion.id]?.editedHtml ?? "",
          updatedAt: new Date().toISOString(),
        },
      }));
      showToast(
        "success",
        status === "complete" ? "Marked as complete" : "Marked as needs revision"
      );
    },
    [selectedQuestion, sessionId, saveDraft]
  );

  // ── Navigation ──
  const navigateTo = useCallback(
    (qId: string) => {
      // Silent-save current before navigating
      if (lastLoadedQuestionId.current && editorRef.current) {
        saveDraft(true);
      }
      lastLoadedQuestionId.current = qId;
      setSelectedQuestionId(qId);
    },
    [saveDraft]
  );

  const goNext = useCallback(() => {
    if (selectedIdx < displayedQuestions.length - 1) {
      navigateTo(displayedQuestions[selectedIdx + 1].id);
    }
  }, [selectedIdx, displayedQuestions, navigateTo]);

  const goPrev = useCallback(() => {
    if (selectedIdx > 0) {
      navigateTo(displayedQuestions[selectedIdx - 1].id);
    }
  }, [selectedIdx, displayedQuestions, navigateTo]);

  // ── Bulk actions ──
  const markAllComplete = () => {
    if (!sessionId) return;
    bulkUpdateReviewStatus(sessionId, questions.map((q) => q.id), "complete");
    const newMap = { ...feedbackMap };
    questions.forEach((q) => {
      newMap[q.id] = {
        questionId: q.id,
        sessionId,
        starRating: newMap[q.id]?.starRating ?? null,
        helpful: newMap[q.id]?.helpful ?? null,
        feedbackText: newMap[q.id]?.feedbackText ?? "",
        editDistance: newMap[q.id]?.editDistance ?? 0,
        originalResponse: newMap[q.id]?.originalResponse ?? "",
        editedResponse: newMap[q.id]?.editedResponse ?? "",
        editedHtml: newMap[q.id]?.editedHtml ?? "",
        reviewStatus: "complete",
        updatedAt: new Date().toISOString(),
      };
    });
    setFeedbackMap(newMap);
    showToast("success", "All questions marked as complete");
  };

  const resetAllStatuses = () => {
    if (!sessionId) return;
    bulkUpdateReviewStatus(sessionId, questions.map((q) => q.id), "pending");
    const newMap = { ...feedbackMap };
    questions.forEach((q) => {
      if (newMap[q.id]) newMap[q.id] = { ...newMap[q.id], reviewStatus: "pending" };
    });
    setFeedbackMap(newMap);
    showToast("success", "All statuses reset to pending");
  };

  // ── Export modal ──
  const [showExportModal, setShowExportModal] = useState(false);

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDraft(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDraft, goNext, goPrev]);

  // ── Editor content derivation ──
  const editorInitialContent = useMemo(() => {
    if (!selectedResponse) return "<p></p>";
    return selectedResponse.editedHtml || textToHtml(selectedResponse.editedContent || selectedResponse.draft || "");
  }, [selectedResponse]);

  // ── Empty state ──
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No RFP Data Found</h2>
          <p className="text-sm text-white/40 mb-6">Upload and parse an RFP first.</p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
          >
            Upload RFP
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col">
      {/* ── Nav ── */}
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/90 backdrop-blur-xl sticky top-0 z-50 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/responses")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Responses
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setShowStatsPanel((v) => !v)}
              className={`p-2 rounded-lg border text-sm transition-colors shrink-0 ${
                showStatsPanel
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70"
              }`}
              title="Category stats"
              aria-label="Toggle category stats"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeyboardHelp((v) => !v)}
              className={`p-2 rounded-lg border text-sm transition-colors shrink-0 ${
                showKeyboardHelp
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70"
              }`}
              title="Keyboard shortcuts"
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors shrink-0"
              aria-label="Export DOCX"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export DOCX</span>
            </button>
            <button
              onClick={() => saveDraft(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
              aria-label="Save draft"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Progress Header ── */}
      <div className="border-b border-white/[0.04] bg-white/[0.01] shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-lg font-semibold truncate">
                Review & Edit — {rfpTitle || "RFP Responses"}
              </h1>
              <p className="text-xs text-white/30 mt-0.5">
                {statusCounts.complete} of {questions.length} complete ({completionPct}%)
              </p>
            </div>

            {lastSaved && (
              <div className="flex items-center gap-1.5 text-xs text-white/30 shrink-0 mt-1">
                <Clock className="w-3 h-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                ["pending", "Pending"],
                ["in-progress", "In Progress"],
                ["complete", "Complete"],
                ["needs-revision", "Needs Revision"],
              ] as [ReviewStatus, string][]
            ).map(([status, label]) => {
              const cfg = reviewStatusConfig[status];
              return (
                <button
                  key={status}
                  onClick={() =>
                    setFilterStatus((prev) => (prev === status ? "all" : status))
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    filterStatus === status
                      ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                      : `${cfg.bg} ${cfg.text} ${cfg.border} hover:ring-1 hover:ring-current`
                  }`}
                  aria-pressed={filterStatus === status}
                >
                  {statusCounts[status]}
                  <span className="opacity-70">{label}</span>
                </button>
              );
            })}
            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-xs text-white/30 hover:text-white/50 px-2 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Panel (collapsible) ── */}
      {showStatsPanel && (
        <div className="border-b border-white/[0.04] bg-white/[0.01] shrink-0 animate-fade-in">
          <div className="max-w-screen-2xl mx-auto px-4 py-4">
            <h3 className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wide">
              Category Completion
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(categoryStats).map(([cat, stat]) => {
                const pct = Math.round((stat.complete / stat.total) * 100);
                const colors = categoryColors[cat] ?? categoryColors["General"];
                return (
                  <div
                    key={cat}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span className="text-xs text-white/50 truncate">{cat}</span>
                    </div>
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-lg font-bold text-white/80">{pct}%</span>
                      <span className="text-xs text-white/30">{stat.complete}/{stat.total}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${colors.dot} opacity-70 transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Keyboard Help (collapsible) ── */}
      {showKeyboardHelp && (
        <div className="border-b border-white/[0.04] bg-white/[0.01] shrink-0 animate-fade-in">
          <div className="max-w-screen-2xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4 text-xs text-white/40">
              {[
                ["Ctrl + S", "Save draft"],
                ["Ctrl + →", "Next question"],
                ["Ctrl + ←", "Previous question"],
                ["Ctrl + B", "Bold"],
                ["Ctrl + I", "Italic"],
                ["Ctrl + U", "Underline"],
                ["Ctrl + Z", "Undo"],
              ].map(([keys, desc]) => (
                <div key={keys} className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-white/60">
                    {keys}
                  </kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
        {/* ── LEFT SIDEBAR: Question List ── */}
        <aside
          className="w-[260px] xl:w-[300px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden hidden md:flex"
          aria-label="Question list"
        >
          {/* Sidebar controls */}
          <div className="p-3 border-b border-white/[0.06] space-y-2 shrink-0">
            {/* Filter + Sort row */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Filter className="w-3 h-3 text-white/30 shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | "all")}
                  className="bg-transparent text-xs text-white/60 flex-1 outline-none cursor-pointer"
                  aria-label="Filter by status"
                >
                  <option value="all">All Questions</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="complete">Complete</option>
                  <option value="needs-revision">Needs Revision</option>
                </select>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
                  title="Sort"
                  aria-label="Sort questions"
                  aria-expanded={showSortMenu}
                >
                  <SortAsc className="w-3.5 h-3.5" />
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/[0.08] bg-[#131827] shadow-2xl z-20 py-1 animate-fade-in">
                    {(
                      [
                        ["number", "Question Number"],
                        ["category", "Category"],
                        ["status", "Review Status"],
                        ["confidence", "Confidence Score"],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => { setSortBy(val); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          sortBy === val
                            ? "text-violet-300 bg-violet-500/10"
                            : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={markAllComplete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/20 transition-all flex-1 justify-center"
                aria-label="Mark all questions as complete"
              >
                <CheckSquare className="w-3 h-3" />
                All Complete
              </button>
              <button
                onClick={resetAllStatuses}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.04] border border-white/[0.06] transition-all flex-1 justify-center"
                aria-label="Reset all question statuses to pending"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto py-1" role="listbox" aria-label="Questions">
            {displayedQuestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/20">
                No questions match the filter.
              </div>
            ) : (
              displayedQuestions.map((q, idx) => {
                const resp = responses[q.id];
                const fb = feedbackMap[q.id];
                const status: ReviewStatus = fb?.reviewStatus ?? "pending";
                const cfg = reviewStatusConfig[status];
                const colors = categoryColors[q.category] ?? categoryColors["General"];
                const isSelected = q.id === selectedQuestionId;

                return (
                  <button
                    key={q.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => navigateTo(q.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-white/[0.04] transition-all ${
                      isSelected
                        ? "bg-violet-500/10 border-l-2 border-l-violet-500"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-white/20 shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 leading-snug line-clamp-2 mb-1.5">
                          {q.text}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                            {q.category}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            {cfg.label}
                          </span>
                          {resp?.confidence ? (
                            <span
                              className={`text-[10px] font-mono ${confidenceColor(resp.confidence)}`}
                            >
                              {resp.confidence}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT: Review Panel ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedQuestion ? (
            <>
              {/* Question navigation bar */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                <button
                  onClick={goPrev}
                  disabled={selectedIdx <= 0}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous question"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-white/30 shrink-0">
                    Q {selectedIdx + 1} of {displayedQuestions.length}
                  </span>
                  <select
                    value={selectedQuestionId ?? ""}
                    onChange={(e) => navigateTo(e.target.value)}
                    className="bg-transparent text-xs text-white/60 outline-none cursor-pointer flex-1 min-w-0"
                    aria-label="Jump to question"
                  >
                    {displayedQuestions.map((q, i) => (
                      <option key={q.id} value={q.id}>
                        {i + 1}. {q.text.slice(0, 60)}{q.text.length > 60 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={goNext}
                  disabled={selectedIdx >= displayedQuestions.length - 1}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next question"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ── 3-Panel content ── */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-4 items-start">

                  {/* ── Panel 1: Question Info ── */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {/* Category */}
                        {(() => {
                          const colors =
                            categoryColors[selectedQuestion.category] ??
                            categoryColors["General"];
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {selectedQuestion.category}
                            </span>
                          );
                        })()}

                        {selectedQuestion.mandatory && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
                            Mandatory
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-white/80 leading-relaxed">
                        {selectedQuestion.text}
                      </p>
                    </div>

                    {/* Confidence */}
                    {selectedResponse && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/30">AI Confidence</span>
                          <span className={`text-base font-bold ${confidenceColor(selectedResponse.confidence)}`}>
                            {selectedResponse.confidence}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${confidenceBarColor(selectedResponse.confidence)}`}
                            style={{ width: `${selectedResponse.confidence}%` }}
                          />
                        </div>
                        {selectedResponse.reasoning && (
                          <p className="text-[10px] text-white/25 mt-2 leading-relaxed">
                            {selectedResponse.reasoning}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Review Status Selector */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-white/30 mb-2">Review Status</p>
                      <div className="space-y-1.5">
                        {(
                          [
                            "pending",
                            "in-progress",
                            "complete",
                            "needs-revision",
                          ] as ReviewStatus[]
                        ).map((s) => {
                          const cfg = reviewStatusConfig[s];
                          return (
                            <button
                              key={s}
                              onClick={() => setReviewStatus(s)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                                selectedStatus === s
                                  ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                                  : "bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.05]"
                              }`}
                              aria-pressed={selectedStatus === s}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Panel 2: Rich Text Editor ── */}
                  <div className="space-y-3">
                    {selectedResponse ? (
                      <>
                        <RichTextEditor
                          key={selectedQuestionId}
                          ref={editorRef}
                          initialContent={editorInitialContent}
                          placeholder="Edit your response here..."
                          autoSaveKey={`bidcraft_editor_${sessionId}_${selectedQuestionId}`}
                          onChange={(html, wc) => {
                            setEditorHtml(html);
                            setEditorWordCount(wc);
                          }}
                          onSave={(html) => {
                            setEditorHtml(html);
                            saveDraft(false);
                          }}
                          minHeight="320px"
                        />

                        <div className="flex items-center justify-between text-xs text-white/30">
                          <span>{editorWordCount} words</span>
                          {lastSaved && (
                            <span>
                              Auto-saved {lastSaved.toLocaleTimeString()}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => saveDraft(false)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                            aria-label="Save draft (Ctrl+S)"
                          >
                            <Save className="w-4 h-4" />
                            Save Draft
                            <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] bg-white/[0.08] font-mono text-white/30">
                              ⌘S
                            </kbd>
                          </button>
                          <button
                            onClick={() => setReviewStatus("complete")}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-sm text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                            aria-label="Mark as complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Complete
                          </button>
                          <button
                            onClick={() => setReviewStatus("needs-revision")}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                            aria-label="Mark as needs revision"
                          >
                            <XCircle className="w-4 h-4" />
                            Needs Revision
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <p className="text-sm text-white/30 mb-4">
                          No AI response generated yet for this question.
                        </p>
                        <button
                          onClick={() => router.push("/responses")}
                          className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
                        >
                          Generate Response
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Panel 3: Sources + Feedback ── */}
                  <div className="space-y-3">
                    {/* KB Sources */}
                    {selectedResponse?.sourcesUsed && selectedResponse.sourcesUsed.length > 0 && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-xs font-medium text-white/50">KB Sources</span>
                        </div>
                        <div className="space-y-1.5">
                          {selectedResponse.sourcesUsed.map((src, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                            >
                              <span className="text-[10px] text-white/40 truncate flex-1 mr-2">
                                {src.title}
                              </span>
                              {src.similarity != null && (
                                <span
                                  className={`text-[10px] font-mono shrink-0 ${
                                    src.similarity >= 70
                                      ? "text-emerald-400"
                                      : src.similarity >= 40
                                      ? "text-amber-400"
                                      : "text-white/30"
                                  }`}
                                >
                                  {src.similarity}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Edit Distance */}
                    {selectedFeedback && selectedFeedback.editDistance > 0 && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/30">Edits from AI draft</span>
                          <span className="text-xs font-mono text-white/50">
                            {selectedFeedback.editDistance}% changed
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              selectedFeedback.editDistance > 50
                                ? "bg-amber-400"
                                : "bg-cyan-400"
                            }`}
                            style={{
                              width: `${Math.min(selectedFeedback.editDistance, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Feedback Collection */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                      <p className="text-xs font-medium text-white/50">Your Feedback</p>

                      {/* 5-Star Rating */}
                      <div>
                        <p className="text-[10px] text-white/30 mb-1.5">
                          Rate this response
                        </p>
                        <div
                          className="flex items-center gap-1"
                          role="radiogroup"
                          aria-label="Star rating"
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarButton
                              key={star}
                              star={star}
                              current={pendingStarRating}
                              onClick={() =>
                                setPendingStarRating((prev) => (prev === star ? null : star))
                              }
                            />
                          ))}
                          {pendingStarRating && (
                            <button
                              onClick={() => setPendingStarRating(null)}
                              className="ml-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                              aria-label="Clear rating"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Helpful / Not Helpful */}
                      <div>
                        <p className="text-[10px] text-white/30 mb-1.5">Was this helpful?</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setPendingHelpful((prev) => (prev === true ? null : true))
                            }
                            aria-pressed={pendingHelpful === true}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                              pendingHelpful === true
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-emerald-500/20 hover:text-emerald-400"
                            }`}
                            aria-label="Mark as helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            Helpful
                          </button>
                          <button
                            onClick={() =>
                              setPendingHelpful((prev) => (prev === false ? null : false))
                            }
                            aria-pressed={pendingHelpful === false}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                              pendingHelpful === false
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-red-500/20 hover:text-red-400"
                            }`}
                            aria-label="Mark as not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            Not helpful
                          </button>
                        </div>
                      </div>

                      {/* Feedback text */}
                      <div>
                        <label
                          htmlFor="feedback-text"
                          className="text-[10px] text-white/30 mb-1.5 block"
                        >
                          What could be improved?
                        </label>
                        <textarea
                          id="feedback-text"
                          value={pendingFeedbackText}
                          onChange={(e) => setPendingFeedbackText(e.target.value)}
                          placeholder="Optional comments..."
                          rows={3}
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                        />
                      </div>

                      <button
                        onClick={() => saveDraft(false)}
                        className="w-full py-2 rounded-lg text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-colors"
                        aria-label="Save feedback"
                      >
                        Save Feedback
                      </button>
                    </div>

                    {/* Tone / word count meta */}
                    {selectedResponse && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                        <div className="flex items-center justify-between text-white/30">
                          <span>Tone</span>
                          <span className="text-white/50 capitalize">
                            {selectedResponse.tone}
                          </span>
                        </div>
                        {selectedResponse.wordCount && (
                          <div className="flex items-center justify-between text-white/30">
                            <span>AI word count</span>
                            <span className="text-white/50">{selectedResponse.wordCount}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-white/30">
                          <span>Your word count</span>
                          <span className="text-white/50">{editorWordCount}</span>
                        </div>
                        {selectedResponse.generatedAt && (
                          <div className="flex items-center justify-between text-white/30">
                            <span>Generated</span>
                            <span className="text-white/50">
                              {new Date(selectedResponse.generatedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Select a question from the list to start reviewing.
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-4 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
          <span className="text-xs text-white/20">&copy; 2026 BidCraft. Built with AI.</span>
          <span className="text-xs text-white/20">A portfolio project by Bhargav Hari</span>
        </div>
      </footer>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          questions={questions}
          responses={responses}
          feedbackMap={feedbackMap}
          rfpTitle={rfpTitle}
          issuingOrg={issuingOrg}
          deadline={deadline}
          defaultCompanyName={defaultCompanyName}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

// ── Star Rating Button ─────────────────────────────────────────────────────

function StarButton({
  star,
  current,
  onClick,
}: {
  star: number;
  current: number | null;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const filled = hovered ? star <= star : star <= (current ?? 0);
  // Simpler: track hover at parent level in the future; for now just compare
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      role="radio"
      aria-checked={current === star}
      aria-label={`${star} star${star !== 1 ? "s" : ""}`}
      className={`text-xl transition-colors leading-none ${
        star <= (current ?? 0) ? "text-amber-400" : "text-white/15 hover:text-amber-400/50"
      }`}
    >
      ★
    </button>
  );
}
