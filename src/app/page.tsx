"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveRFPSession } from "@/lib/storage";
import { RFPQuestion, QuestionStatus } from "@/types";
import {
  Building2,
  MessageSquare,
  Sparkles,
  Clock,
  BookOpen,
  LayoutDashboard,
  Search,
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Filter,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import OnboardingTour from "@/components/OnboardingTour";

const STORAGE_KEY = "bidcraft_current_project";

interface ParseResult {
  rfp_title: string;
  issuing_organization: string;
  submission_deadline: string | null;
  total_questions: number;
  questions: RFPQuestion[];
  fileName: string;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  Technical: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Security & Compliance": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "Experience & References": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  Staffing: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Methodology: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Pricing: { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  General: { bg: "bg-white/[0.06]", text: "text-white/60", dot: "bg-white/40" },
};

const statusColors: Record<QuestionStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-white/[0.06]", text: "text-white/40", label: "Pending" },
  "in-progress": { bg: "bg-amber-500/10", text: "text-amber-400", label: "In Progress" },
  complete: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Complete" },
};

const ALL_CATEGORIES = [
  "Technical",
  "Security & Compliance",
  "Experience & References",
  "Staffing",
  "Methodology",
  "Pricing",
  "General",
];

function NavBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: typeof Building2; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);

  // Question management
  const [questions, setQuestions] = useState<RFPQuestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Add/Edit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RFPQuestion | null>(null);
  const [modalText, setModalText] = useState("");
  const [modalCategory, setModalCategory] = useState("General");
  const [modalMandatory, setModalMandatory] = useState(false);
  const [modalSection, setModalSection] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Load persisted project on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setParseResult(data.parseResult);
        setQuestions(data.questions || data.parseResult?.questions || []);
        setUploadStatus("success");
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Persist questions whenever they change
  useEffect(() => {
    if (parseResult && uploadStatus === "success") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ parseResult, questions })
      );
    }
  }, [questions, parseResult, uploadStatus]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFile = async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".docx", ".txt", ".xlsx", ".xls", ".csv"].includes(ext)) {
      showToast("error", "Unsupported file type. Please upload PDF, DOCX, XLSX, or TXT.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File too large. Maximum size is 10MB.");
      return;
    }

    setUploadedFile(file);
    setUploadStatus("uploading");
    setErrorMessage("");
    setProgress(0);

    // Simulate progress
    let p = 0;
    progressInterval.current = setInterval(() => {
      p += Math.random() * 8;
      if (p > 90) p = 90;
      setProgress(Math.round(p));
    }, 400);

    try {
      setProcessingStep("Uploading document...");
      const formData = new FormData();
      formData.append("file", file);

      setProcessingStep("AI is analyzing your RFP...");
      const response = await fetch("/api/parse-rfp", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to parse RFP");
      }

      const result = await response.json();
      setProcessingStep("Extracting questions...");
      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(100);

      await new Promise((r) => setTimeout(r, 400));

      // Add status and order to questions
      const enrichedQuestions: RFPQuestion[] = (result.questions || []).map(
        (q: Omit<RFPQuestion, "status" | "order">, i: number) => ({
          ...q,
          status: "pending" as QuestionStatus,
          order: i,
        })
      );

      setParseResult(result);
      setQuestions(enrichedQuestions);
      setUploadStatus("success");
      showToast("success", `Extracted ${enrichedQuestions.length} questions from ${file.name}`);
    } catch (err: unknown) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
      setUploadStatus("error");
      showToast("error", msg.includes("fetch") ? "Network error. Check your connection." : msg);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus("idle");
    setParseResult(null);
    setQuestions([]);
    setErrorMessage("");
    setActiveCategory("All");
    setActiveStatus("All");
    setSearchQuery("");
    setProgress(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // ── Filtering ──
  const filteredQuestions = questions
    .filter((q) => activeCategory === "All" || q.category === activeCategory)
    .filter((q) => activeStatus === "All" || q.status === activeStatus)
    .filter(
      (q) =>
        !searchQuery ||
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.section?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  const categories = ["All", ...Array.from(new Set(questions.map((q) => q.category)))];
  const getCategoryCount = (cat: string) =>
    cat === "All" ? questions.length : questions.filter((q) => q.category === cat).length;

  // ── Status cycling ──
  const cycleStatus = (id: string) => {
    const order: QuestionStatus[] = ["pending", "in-progress", "complete"];
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const idx = order.indexOf(q.status);
        return { ...q, status: order[(idx + 1) % order.length] };
      })
    );
  };

  // ── Reorder ──
  const moveQuestion = (id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const temp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: temp };
      return sorted;
    });
  };

  // ── Add / Edit ──
  const openAddModal = () => {
    setEditingQuestion(null);
    setModalText("");
    setModalCategory("General");
    setModalMandatory(false);
    setModalSection("");
    setShowAddModal(true);
  };

  const openEditModal = (q: RFPQuestion) => {
    setEditingQuestion(q);
    setModalText(q.text);
    setModalCategory(q.category);
    setModalMandatory(q.mandatory);
    setModalSection(q.section);
    setShowAddModal(true);
  };

  const saveQuestion = () => {
    if (!modalText.trim()) {
      showToast("error", "Question text is required.");
      return;
    }

    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? { ...q, text: modalText.trim(), category: modalCategory, mandatory: modalMandatory, section: modalSection.trim() }
            : q
        )
      );
      showToast("success", "Question updated.");
    } else {
      const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order)) : -1;
      const newQ: RFPQuestion = {
        id: `MAN-${Date.now().toString(36).toUpperCase()}`,
        text: modalText.trim(),
        category: modalCategory,
        mandatory: modalMandatory,
        confidence: 100,
        section: modalSection.trim(),
        status: "pending",
        order: maxOrder + 1,
      };
      setQuestions((prev) => [...prev, newQ]);
      showToast("success", "Question added.");
    }
    setShowAddModal(false);
  };

  // ── Delete ──
  const confirmDelete = (id: string) => setDeleteId(id);
  const executeDelete = () => {
    if (!deleteId) return;
    setQuestions((prev) => prev.filter((q) => q.id !== deleteId));
    setDeleteId(null);
    showToast("success", "Question removed.");
  };

  // ── Generate Responses ──
  const handleGenerateResponses = () => {
    if (!parseResult) return;
    const session = {
      id: crypto.randomUUID(),
      fileName: parseResult.fileName,
      rfpTitle: parseResult.rfp_title,
      issuingOrganization: parseResult.issuing_organization,
      submissionDeadline: parseResult.submission_deadline,
      questions,
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRFPSession(session);
    router.push("/responses");
  };

  // ── Stats ──
  const pendingCount = questions.filter((q) => q.status === "pending").length;
  const inProgressCount = questions.filter((q) => q.status === "in-progress").length;
  const completeCount = questions.filter((q) => q.status === "complete").length;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <OnboardingTour />

      {/* Navigation */}
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetUpload}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M9 15l3-3 3 3" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Bid<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Craft</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NavBtn onClick={() => router.push("/profile")} icon={Building2} label="Profile" />
            <NavBtn onClick={() => router.push("/responses")} icon={MessageSquare} label="Responses" />
            <NavBtn onClick={() => router.push("/knowledge-base")} icon={BookOpen} label="Knowledge Base" />
            <NavBtn onClick={() => router.push("/history")} icon={Clock} label="History" />
            <NavBtn onClick={() => router.push("/dashboard")} icon={LayoutDashboard} label="Dashboard" />
            {parseResult && (
              <button onClick={resetUpload} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                ← New Upload
              </button>
            )}
            <div className="h-8 px-3 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/50">Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════ LANDING / UPLOAD VIEW ══════════════ */}
      {uploadStatus !== "success" && (
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-xs font-medium text-violet-300 tracking-wide">POWERED BY AI</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Win more bids.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400">In less time.</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed max-w-xl mx-auto">
              Upload your RFP and let AI extract every question, match it against your best past responses, and generate winning draft answers.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 max-w-2xl mx-auto mb-16 divide-x divide-white/[0.06]">
            {[
              { value: "70%", label: "Faster Response" },
              { value: "85%", label: "Auto-Answered" },
              { value: "2.4×", label: "Win Rate Lift" },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-4">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{stat.value}</div>
                <div className="text-xs text-white/30 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Upload Area */}
          <div className="max-w-2xl mx-auto">
            {uploadStatus === "idle" && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ease-out
                  ${isDragging ? "border-violet-400 bg-violet-500/10 scale-[1.02]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"}`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
                  style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
                />
                <div className="relative p-12 sm:p-16 flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                    ${isDragging ? "bg-violet-500/20 scale-110" : "bg-white/[0.04] group-hover:bg-white/[0.06]"}`}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`transition-colors duration-300 ${isDragging ? "stroke-violet-400" : "stroke-white/30 group-hover:stroke-white/50"}`}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragging ? <span className="text-violet-300">Drop your RFP here</span> : "Drop your RFP document here"}
                  </h3>
                  <p className="text-sm text-white/30 mb-6">
                    or <span className="text-violet-400 underline underline-offset-2 decoration-violet-400/30">browse files</span> to upload
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/20">
                    <span>PDF</span>
                    <span>DOCX</span>
                    <span>XLSX</span>
                    <span className="text-white/10">|</span>
                    <span>Max 10MB</span>
                  </div>
                </div>
                <input id="file-input" type="file" className="hidden" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt" onChange={handleFileInput} />
              </div>
            )}

            {/* Processing State */}
            {uploadStatus === "uploading" && uploadedFile && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{processingStep}</span>
                    <span className="text-violet-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <svg className="animate-spin w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    This usually takes 15-30 seconds...
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {uploadStatus === "error" && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-sm text-red-300 font-medium mb-2">Failed to process document</p>
                <p className="text-xs text-white/30 mb-4">{errorMessage}</p>
                <button onClick={resetUpload} className="px-4 py-2 rounded-lg bg-white/[0.06] text-sm hover:bg-white/[0.1] transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* How it works */}
          {uploadStatus === "idle" && (
            <div className="max-w-4xl mx-auto mt-24 mb-16">
              <h2 className="text-center text-sm font-medium text-white/20 tracking-widest uppercase mb-12">How BidCraft Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    step: "01",
                    title: "Upload RFP",
                    desc: "Drop your RFP document in any format. Our AI parses and extracts every question.",
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    ),
                  },
                  {
                    step: "02",
                    title: "AI Matches & Drafts",
                    desc: "Questions are matched against your knowledge base. AI generates tailored responses.",
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                      </svg>
                    ),
                  },
                  {
                    step: "03",
                    title: "Review & Export",
                    desc: "Review AI drafts, edit as needed, and export a polished response document.",
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-mono font-bold text-violet-400/60">{item.step}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4 text-white/30 group-hover:text-violet-400 transition-colors">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ RESULTS VIEW ══════════════ */}
      {uploadStatus === "success" && parseResult && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">{parseResult.rfp_title}</h1>
                <p className="text-sm text-white/40">
                  {parseResult.issuing_organization}
                  {parseResult.submission_deadline && <> &middot; Due: {parseResult.submission_deadline}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={resetUpload} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors">
                  Upload New RFP
                </button>
                <button
                  onClick={handleGenerateResponses}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-sm font-medium transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Responses
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total", value: questions.length, color: "from-violet-500 to-violet-600" },
                { label: "Pending", value: pendingCount, color: "from-white/60 to-white/30" },
                { label: "In Progress", value: inProgressCount, color: "from-amber-500 to-amber-600" },
                { label: "Complete", value: completeCount, color: "from-emerald-500 to-emerald-600" },
                { label: "Mandatory", value: questions.filter((q) => q.mandatory).length, color: "from-red-500 to-red-600" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-white/30 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Search + Filters + Add */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  showFilters ? "bg-violet-500/10 border-violet-500/30 text-violet-300" : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {/* Filter Panels */}
            {showFilters && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-4 space-y-3">
                <div>
                  <label className="text-xs text-white/30 mb-2 block">Category</label>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeCategory === cat
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
                        }`}
                      >
                        {cat} ({getCategoryCount(cat)})
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/30 mb-2 block">Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["All", "pending", "in-progress", "complete"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveStatus(s)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeStatus === s
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
                        }`}
                      >
                        {s === "All" ? "All" : statusColors[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredQuestions.map((question) => {
              const colors = categoryColors[question.category] || categoryColors["General"];
              const sColors = statusColors[question.status];
              return (
                <div
                  key={question.id}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 text-xs font-mono font-bold text-white/30">
                      {question.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed mb-3">{question.text}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {question.category}
                        </span>
                        <button
                          onClick={() => cycleStatus(question.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${sColors.bg} ${sColors.text}`}
                          title="Click to cycle status"
                        >
                          {sColors.label}
                        </button>
                        {question.mandatory && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400">Mandatory</span>
                        )}
                        {question.section && <span className="text-xs text-white/20">{question.section}</span>}
                        <span className="ml-auto text-xs text-white/20">{question.confidence}% confidence</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => moveQuestion(question.id, "up")} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50" title="Move up">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveQuestion(question.id, "down")} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50" title="Move down">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(question)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirmDelete(question.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <p className="text-sm">No questions match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ ADD / EDIT MODAL ══════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#12182B] shadow-2xl overflow-hidden" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div className="h-1.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editingQuestion ? "Edit Question" : "Add Question"}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Question Text *</label>
                  <textarea
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 resize-none"
                    placeholder="Enter the question or requirement..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Category</label>
                    <select
                      value={modalCategory}
                      onChange={(e) => setModalCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-violet-500/40"
                    >
                      {ALL_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#12182B]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Section</label>
                    <input
                      type="text"
                      value={modalSection}
                      onChange={(e) => setModalSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                      placeholder="e.g. Technical Requirements"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalMandatory}
                    onChange={(e) => setModalMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-violet-500"
                  />
                  <span className="text-sm text-white/50">Mandatory question</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveQuestion}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {editingQuestion ? "Save Changes" : "Add Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE CONFIRMATION ══════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#12182B] shadow-2xl p-6" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <h3 className="text-lg font-bold mb-2">Delete Question?</h3>
            <p className="text-sm text-white/40 mb-6">This action cannot be undone. The question will be permanently removed.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors">
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-white/20">&copy; 2026 BidCraft. Built with AI.</span>
          <span className="text-xs text-white/20">A portfolio project by Bhargav Hari</span>
        </div>
      </footer>
    </div>
  );
}
