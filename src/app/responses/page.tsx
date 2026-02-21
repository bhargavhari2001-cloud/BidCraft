"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RFPQuestion, GeneratedResponse, CompanyProfile, ResponseSource } from "@/types";
import {
  getLatestRFPSession,
  getCompanyProfile,
  saveGeneratedResponses,
} from "@/lib/storage";
import ExportModal from "@/components/ExportModal";
import { saveResponseToSupabase } from "@/lib/responseService";
import {
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  ResponseTone,
  ResponseLength,
} from "@/lib/prompts";
import { showToast } from "@/components/Toast";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Download,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  BookOpen,
  X,
  Settings2,
  Building2,
  PenLine,
} from "lucide-react";

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  Technical: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Security & Compliance": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "Experience & References": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  Staffing: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Methodology: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Pricing: { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  General: { bg: "bg-white/[0.06]", text: "text-white/60", dot: "bg-white/40" },
};

function confidenceColor(c: number): string {
  if (c >= 85) return "text-emerald-400";
  if (c >= 60) return "text-amber-400";
  return "text-red-400";
}

function confidenceBg(c: number): string {
  if (c >= 85) return "bg-emerald-500/10";
  if (c >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export default function ResponsesPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<RFPQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, GeneratedResponse>>({});
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [rfpTitle, setRfpTitle] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // New controls state
  const [tone, setTone] = useState<ResponseTone>("professional");
  const [length, setLength] = useState<ResponseLength>("standard");
  const [companyName, setCompanyName] = useState("");
  const [showControls, setShowControls] = useState(false);

  // Batch generation state
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const cancelBatchRef = useRef(false);

  // Sources expansion per question
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    const session = getLatestRFPSession();
    if (session) {
      setSessionId(session.id);
      setQuestions(session.questions);
      setRfpTitle(session.rfpTitle);
      setIssuingOrg(session.issuingOrganization);
      setDeadline(session.submissionDeadline);
      const responseMap: Record<string, GeneratedResponse> = {};
      session.responses.forEach((r) => {
        responseMap[r.questionId] = r;
      });
      setResponses(responseMap);
      if (session.questions.length > 0) {
        setExpandedIds(new Set([session.questions[0].id]));
      }
    }
    const profile = getCompanyProfile();
    setCompanyProfile(profile);
    if (profile?.name) setCompanyName(profile.name);
  }, []);

  const persistResponses = useCallback(
    (updated: Record<string, GeneratedResponse>) => {
      if (sessionId) {
        saveGeneratedResponses(sessionId, Object.values(updated));
      }
    },
    [sessionId]
  );

  const generateResponse = async (question: RFPQuestion) => {
    setGeneratingIds((prev) => new Set(prev).add(question.id));
    setExpandedIds((prev) => new Set(prev).add(question.id));

    try {
      const res = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.text,
          questionCategory: question.category,
          companyProfile,
          companyName: companyName || companyProfile?.name || undefined,
          tone,
          length,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate response");
      }

      const data = await res.json();
      const newResponse: GeneratedResponse = {
        questionId: question.id,
        draft: data.draft,
        tone: data.tone,
        status: "generated",
        editedContent: data.draft,
        rating: null,
        confidence: data.confidence,
        reasoning: data.reasoning || undefined,
        wordCount: data.wordCount || undefined,
        sourcesUsed: data.sourcesUsed || [],
        generatedAt: new Date().toISOString(),
      };

      setResponses((prev) => {
        const updated = { ...prev, [question.id]: newResponse };
        persistResponses(updated);
        return updated;
      });

      // Best-effort Supabase persistence
      if (sessionId) {
        saveResponseToSupabase(sessionId, newResponse).catch(() => {});
      }
    } catch (err) {
      console.error("Generation error:", err);
      showToast("error", `Failed to generate response for Q${question.id}`);
      const errorResponse: GeneratedResponse = {
        questionId: question.id,
        draft: "Failed to generate response. Please try again.",
        tone: "error",
        status: "pending",
        editedContent: "",
        rating: null,
        confidence: 0,
      };
      setResponses((prev) => ({ ...prev, [question.id]: errorResponse }));
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(question.id);
        return next;
      });
    }
  };

  const generateAll = async () => {
    cancelBatchRef.current = false;
    const unanswered = questions.filter(
      (q) => !responses[q.id] || responses[q.id].status === "pending"
    );
    if (unanswered.length === 0) {
      showToast("success", "All questions already have responses!");
      return;
    }

    setBatchProgress({ current: 0, total: unanswered.length });

    for (let i = 0; i < unanswered.length; i++) {
      if (cancelBatchRef.current) {
        showToast("success", `Batch cancelled after ${i} of ${unanswered.length} responses`);
        break;
      }
      setBatchProgress({ current: i + 1, total: unanswered.length });
      await generateResponse(unanswered[i]);
    }

    if (!cancelBatchRef.current) {
      showToast("success", "All responses generated!");
    }
    setBatchProgress(null);
  };

  const cancelBatch = () => {
    cancelBatchRef.current = true;
  };

  const updateEditedContent = (questionId: string, content: string) => {
    setResponses((prev) => {
      const updated = {
        ...prev,
        [questionId]: { ...prev[questionId], editedContent: content, status: "edited" as const },
      };
      persistResponses(updated);
      return updated;
    });
  };

  const rateResponse = (questionId: string, rating: "up" | "down") => {
    setResponses((prev) => {
      const current = prev[questionId];
      const newRating = current.rating === rating ? null : rating;
      const updated = {
        ...prev,
        [questionId]: { ...current, rating: newRating },
      };
      persistResponses(updated);
      return updated;
    });
  };

  const copyToClipboard = async (questionId: string) => {
    const response = responses[questionId];
    if (response) {
      await navigator.clipboard.writeText(response.editedContent || response.draft);
      setCopiedId(questionId);
      setTimeout(() => setCopiedId(null), 1500);
      showToast("success", "Copied to clipboard");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSourceExpand = (id: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [showExportModal, setShowExportModal] = useState(false);

  const answeredCount = Object.values(responses).filter(
    (r) => r.status === "generated" || r.status === "edited"
  ).length;

  const editedCount = Object.values(responses).filter((r) => r.status === "edited").length;

  const avgConfidence =
    answeredCount > 0
      ? Math.round(
          Object.values(responses)
            .filter((r) => r.status === "generated" || r.status === "edited")
            .reduce((sum, r) => sum + r.confidence, 0) / answeredCount
        )
      : 0;

  const lowConfidenceCount = Object.values(responses).filter(
    (r) => (r.status === "generated" || r.status === "edited") && r.confidence < confidenceThreshold
  ).length;

  const displayedQuestions = questions.filter((q) => {
    if (!showLowConfidenceOnly) return true;
    const resp = responses[q.id];
    if (!resp || resp.status === "pending") return true;
    return resp.confidence < confidenceThreshold;
  });

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No RFP Data Found</h2>
          <p className="text-sm text-white/40 mb-6">
            Upload and parse an RFP document first to generate responses.
          </p>
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

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowControls((v) => !v)}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                showControls
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70"
              }`}
              title="Response controls"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowStats((v) => !v)}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                showStats
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70"
              }`}
              title="Toggle stats"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/review")}
              disabled={answeredCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Review & edit generated responses"
            >
              <PenLine className="w-4 h-4" />
              Review & Edit
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={answeredCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export DOCX
            </button>
            {batchProgress ? (
              <button
                onClick={cancelBatch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium transition-colors hover:bg-red-500/30"
              >
                <X className="w-4 h-4" />
                Cancel ({batchProgress.current}/{batchProgress.total})
              </button>
            ) : (
              <button
                onClick={generateAll}
                disabled={answeredCount === questions.length}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Generate All
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{rfpTitle || "RFP Responses"}</h1>
          <p className="text-sm text-white/40">
            {answeredCount} of {questions.length} questions answered
            {editedCount > 0 && ` · ${editedCount} edited`}
            {avgConfidence > 0 && ` · Avg confidence: ${avgConfidence}%`}
            {!companyProfile && (
              <span className="ml-2 text-amber-400">
                &middot;{" "}
                <button
                  onClick={() => router.push("/profile")}
                  className="underline underline-offset-2 hover:text-amber-300"
                >
                  Add company profile
                </button>{" "}
                for better responses
              </span>
            )}
          </p>

          {/* Overall progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
              style={{
                width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Batch progress bar */}
          {batchProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                <span>
                  Generating response {batchProgress.current} of {batchProgress.total}...
                </span>
                <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Response Controls Panel */}
        {showControls && (
          <div className="mb-6 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-medium">Response Controls</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tone selector */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">Tone</label>
                <div className="space-y-1.5">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTone(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        tone === opt.value
                          ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="font-medium text-xs">{opt.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length selector */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">Length</label>
                <div className="space-y-1.5">
                  {LENGTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLength(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        length === opt.value
                          ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="font-medium text-xs">{opt.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{opt.words}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company name */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-2">
                  This name will be used in all generated responses instead of the profile company name.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-in">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-violet-400 to-violet-600">
                {questions.length}
              </div>
              <div className="text-xs text-white/30 mt-1">Total Questions</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600">
                {answeredCount}
              </div>
              <div className="text-xs text-white/30 mt-1">Answered</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className={`text-2xl font-bold ${confidenceColor(avgConfidence)}`}>
                {avgConfidence}%
              </div>
              <div className="text-xs text-white/30 mt-1">Avg Confidence</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600">
                {new Set(questions.map((q) => q.category)).size}
              </div>
              <div className="text-xs text-white/30 mt-1">Categories</div>
            </div>
          </div>
        )}

        {/* Confidence Filter */}
        {answeredCount > 0 && (
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <Filter className="w-4 h-4 text-white/30 shrink-0" />
            <div className="flex-1 flex items-center gap-3">
              <label className="text-xs text-white/40 shrink-0">Confidence threshold:</label>
              <input
                type="range"
                min={0}
                max={100}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-xs text-white/50 w-10 text-right">{confidenceThreshold}%</span>
            </div>
            <button
              onClick={() => setShowLowConfidenceOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                showLowConfidenceOnly
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Needs Review ({lowConfidenceCount})
            </button>
          </div>
        )}

        {/* Questions & Responses */}
        <div className="space-y-3">
          {displayedQuestions.map((question) => {
            const response = responses[question.id];
            const isGenerating = generatingIds.has(question.id);
            const isExpanded = expandedIds.has(question.id);
            const colors = categoryColors[question.category] || categoryColors["General"];
            const hasResponse = response && (response.status === "generated" || response.status === "edited");
            const isLowConfidence = hasResponse && response.confidence < confidenceThreshold;
            const sourcesExpanded = expandedSources.has(question.id);

            return (
              <div
                key={question.id}
                className={`rounded-xl border bg-white/[0.02] hover:border-white/[0.1] transition-all duration-200 overflow-hidden ${
                  isLowConfidence ? "border-amber-500/30" : "border-white/[0.06]"
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleExpand(question.id)}
                  className="w-full p-5 flex items-start gap-4 text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                      isLowConfidence
                        ? "bg-amber-500/10 text-amber-400"
                        : hasResponse
                        ? `${confidenceBg(response.confidence)} ${confidenceColor(response.confidence)}`
                        : "bg-white/[0.04] text-white/30"
                    }`}
                  >
                    {hasResponse ? `${response.confidence}%` : question.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed mb-2">{question.text}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {question.category}
                      </span>
                      {question.mandatory && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
                          Mandatory
                        </span>
                      )}
                      {hasResponse && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          Answered
                        </span>
                      )}
                      {hasResponse && response.wordCount && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/[0.04] text-white/40">
                          {response.wordCount} words
                        </span>
                      )}
                      {isLowConfidence && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Low confidence
                        </span>
                      )}
                      {isGenerating && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating
                        </span>
                      )}
                      {response?.status === "edited" && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-500/10 text-cyan-400">
                          Edited
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-white/20">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Response Area — side-by-side layout */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/[0.04] animate-fade-in">
                    {isGenerating && (
                      <div className="py-8 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                        <p className="text-sm text-white/40">
                          Generating response with AI + Knowledge Base...
                        </p>
                      </div>
                    )}

                    {!isGenerating && hasResponse && (
                      <div className="pt-4">
                        {/* Side-by-side: Question context | Response */}
                        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
                          {/* Left: Question info + metadata */}
                          <div className="space-y-3">
                            {/* Confidence badge */}
                            <div className={`p-3 rounded-lg ${confidenceBg(response.confidence)}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/40">Confidence</span>
                                <span className={`text-lg font-bold ${confidenceColor(response.confidence)}`}>
                                  {response.confidence}%
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    response.confidence >= 85
                                      ? "bg-emerald-400"
                                      : response.confidence >= 60
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{ width: `${response.confidence}%` }}
                                />
                              </div>
                              {response.reasoning && (
                                <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                                  {response.reasoning}
                                </p>
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between text-white/30">
                                <span>Tone</span>
                                <span className="text-white/50 capitalize">{response.tone}</span>
                              </div>
                              {response.wordCount && (
                                <div className="flex items-center justify-between text-white/30">
                                  <span>Words</span>
                                  <span className="text-white/50">{response.wordCount}</span>
                                </div>
                              )}
                              {response.generatedAt && (
                                <div className="flex items-center justify-between text-white/30">
                                  <span>Generated</span>
                                  <span className="text-white/50">
                                    {new Date(response.generatedAt).toLocaleTimeString()}
                                  </span>
                                </div>
                              )}
                              {response.status === "edited" && response.editedContent !== response.draft && (
                                <div className="flex items-center justify-between text-cyan-400/60">
                                  <span>Status</span>
                                  <span className="text-cyan-400">Modified</span>
                                </div>
                              )}
                            </div>

                            {/* Sources expandable */}
                            {response.sourcesUsed && response.sourcesUsed.length > 0 && (
                              <div>
                                <button
                                  onClick={() => toggleSourceExpand(question.id)}
                                  className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors w-full"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>View Sources ({response.sourcesUsed.length})</span>
                                  {sourcesExpanded ? (
                                    <ChevronUp className="w-3 h-3 ml-auto" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 ml-auto" />
                                  )}
                                </button>
                                {sourcesExpanded && (
                                  <div className="mt-2 space-y-1.5 animate-fade-in">
                                    {response.sourcesUsed.map((src: ResponseSource, i: number) => (
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
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                onClick={() => generateResponse(question)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 text-xs transition-colors"
                                title="Regenerate"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => rateResponse(question.id, "up")}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  response.rating === "up"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "hover:bg-white/[0.06] text-white/30"
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => rateResponse(question.id, "down")}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  response.rating === "down"
                                    ? "bg-red-500/20 text-red-400"
                                    : "hover:bg-white/[0.06] text-white/30"
                                }`}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => copyToClipboard(question.id)}
                                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 transition-colors"
                              >
                                {copiedId === question.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Right: Editable response */}
                          <div className="space-y-2">
                            <textarea
                              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 leading-relaxed min-h-[200px] resize-y focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                              value={response.editedContent || response.draft}
                              onChange={(e) => updateEditedContent(question.id, e.target.value)}
                            />
                            {response.status === "edited" && response.editedContent !== response.draft && (
                              <button
                                onClick={() => updateEditedContent(question.id, response.draft)}
                                className="text-xs text-white/30 hover:text-white/50 transition-colors"
                              >
                                Reset to original
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!isGenerating && !hasResponse && (
                      <div className="py-6 flex flex-col items-center gap-3">
                        <p className="text-sm text-white/30">No response generated yet</p>
                        <button
                          onClick={() => generateResponse(question)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Response
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {displayedQuestions.length === 0 && showLowConfidenceOnly && (
          <div className="text-center py-12 text-white/30">
            <Check className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
            <p className="text-sm">All responses are above the confidence threshold!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-white/20">&copy; 2026 BidCraft. Built with AI.</span>
          <span className="text-xs text-white/20">A portfolio project by Bhargav Hari</span>
        </div>
      </footer>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          questions={questions}
          responses={responses}
          rfpTitle={rfpTitle}
          issuingOrg={issuingOrg}
          deadline={deadline}
          defaultCompanyName={companyName || companyProfile?.name}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
