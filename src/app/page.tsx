"use client";

import {
  useState, useCallback, useEffect, useRef,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { saveRFPSession } from "@/lib/storage";
import { RFPQuestion, QuestionStatus } from "@/types";
import {
  Sparkles, Search, Plus, Trash2, Pencil,
  ChevronUp, ChevronDown, X, Check, Filter,
  FileText, ChevronDown as Expand, AlertCircle,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import OnboardingTour from "@/components/OnboardingTour";

const STORAGE_KEY = "bidcraft_current_project";

/* ── Types ────────────────────────────────────────────────── */
interface ParseResult {
  rfp_title: string;
  issuing_organization: string;
  submission_deadline: string | null;
  total_questions: number;
  questions: RFPQuestion[];
  fileName: string;
}

/* ── Design tokens (category + status) ───────────────────── */
const CAT: Record<string, { border: string; badgeBg: string; badgeText: string; dot: string }> = {
  "Technical":               { border:"#146C43", badgeBg:"rgba(20,108,67,.10)", badgeText:"#146C43", dot:"#146C43" },
  "Security & Compliance":   { border:"#EF4444", badgeBg:"rgba(239,68,68,.12)",  badgeText:"#FCA5A5", dot:"#EF4444" },
  "Experience & References": { border:"#06B6D4", badgeBg:"rgba(6,182,212,.12)",  badgeText:"#67E8F9", dot:"#06B6D4" },
  "Staffing":                { border:"#F59E0B", badgeBg:"rgba(245,158,11,.12)", badgeText:"#FCD34D", dot:"#F59E0B" },
  "Methodology":             { border:"#10B981", badgeBg:"rgba(16,185,129,.12)", badgeText:"#6EE7B7", dot:"#10B981" },
  "Pricing":                 { border:"#EC4899", badgeBg:"rgba(236,72,153,.12)", badgeText:"#F9A8D4", dot:"#EC4899" },
  "General":                 { border:"#E5E3DC", badgeBg:"#F6F4EF", badgeText:"#6B6862", dot:"#9b978d" },
};
const getCat = (c: string) => CAT[c] ?? CAT["General"];

const STATUS: Record<QuestionStatus, { bg: string; text: string; label: string }> = {
  "pending":     { bg:"#F6F4EF", text:"#8A867D", label:"Pending"     },
  "in-progress": { bg:"rgba(245,158,11,.12)", text:"#FCD34D",               label:"In Progress" },
  "complete":    { bg:"rgba(16,185,129,.12)", text:"#6EE7B7",               label:"Complete"    },
};

const ALL_CATEGORIES = [
  "Technical","Security & Compliance","Experience & References",
  "Staffing","Methodology","Pricing","General",
];

/* ── Skeleton card ────────────────────────────────────────── */
function QuestionSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="rounded-xl border"
      style={{ background:"var(--bg-surface-1)", borderColor:"var(--border-subtle)", padding:20 }}
    >
      <div style={{ display:"flex", gap:16 }}>
        <div className="skeleton" style={{ width:40, height:40, borderRadius:8, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton" style={{ height:14, width:"70%", marginBottom:10 }} />
          <div className="skeleton" style={{ height:12, width:"90%", marginBottom:6 }} />
          <div className="skeleton" style={{ height:12, width:"55%", marginBottom:14 }} />
          <div style={{ display:"flex", gap:8 }}>
            <div className="skeleton" style={{ height:20, width:80, borderRadius:4 }} />
            <div className="skeleton" style={{ height:20, width:64, borderRadius:4 }} />
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── Badge ────────────────────────────────────────────────── */
function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display:"inline-flex", alignItems:"center", gap:5,
        padding:"2px 8px", borderRadius:4, fontSize:11,
        fontWeight:500, background:bg, color:text, whiteSpace:"nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ── Question card ────────────────────────────────────────── */
function QuestionCard({
  question, onEdit, onDelete, onMoveUp, onMoveDown, onCycleStatus,
}: {
  question: RFPQuestion;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCycleStatus: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCat(question.category);
  const stat = STATUS[question.status];
  const isLong = question.text.length > 140;
  const displayText = isLong && !expanded ? question.text.slice(0, 140) + "…" : question.text;

  return (
    <article
      className="rounded-xl border transition-all duration-150"
      style={{
        background: "var(--bg-surface-1)",
        borderColor: "var(--border-subtle)",
        borderLeft: `3px solid ${cat.border}`,
        padding: "16px 16px 16px 18px",
      }}
      aria-label={`Question ${question.id}: ${question.text.slice(0, 60)}`}
    >
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        {/* ID chip */}
        <div
          aria-label={`Question ID: ${question.id}`}
          style={{
            width:40, height:40, borderRadius:8, flexShrink:0,
            background:"var(--bg-surface-2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:500,
            color:"var(--text-muted)", lineHeight:1.1, textAlign:"center",
          }}
        >
          {question.id.slice(0, 8)}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {/* Badges row */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            <Badge bg={cat.badgeBg} text={cat.badgeText}>
              <span
                aria-hidden="true"
                style={{ width:5, height:5, borderRadius:"50%", background:cat.dot, flexShrink:0 }}
              />
              {question.category}
            </Badge>

            <button
              type="button"
              onClick={onCycleStatus}
              aria-label={`Status: ${stat.label}. Click to cycle status.`}
              style={{
                display:"inline-flex", alignItems:"center",
                padding:"2px 8px", borderRadius:4, fontSize:11,
                fontWeight:500, background:stat.bg, color:stat.text,
                border:"none", cursor:"pointer", fontFamily:"inherit",
              }}
            >
              {stat.label}
            </button>

            {question.mandatory && (
              <Badge bg="rgba(239,68,68,.12)" text="#FCA5A5">
                <AlertCircle aria-hidden="true" style={{ width:9, height:9 }} />
                Mandatory
              </Badge>
            )}
            {question.section && (
              <span style={{ fontSize:11, color:"var(--text-muted)", alignSelf:"center" }}>
                {question.section}
              </span>
            )}
            <span
              aria-label={`AI confidence: ${question.confidence}%`}
              style={{
                marginLeft:"auto", fontSize:11, fontWeight:500,
                fontFamily:'"JetBrains Mono",monospace',
                color:"var(--text-muted)",
              }}
            >
              {question.confidence}%
            </span>
          </div>

          {/* Question text */}
          <p
            id={`q-text-${question.id}`}
            style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, margin:"0 0 8px" }}
          >
            {displayText}
          </p>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-controls={`q-text-${question.id}`}
              style={{
                display:"inline-flex", alignItems:"center", gap:4,
                fontSize:12, color:"#146C43", background:"none",
                border:"none", cursor:"pointer", padding:"0 0 8px",
                fontFamily:"inherit",
              }}
            >
              <Expand
                aria-hidden="true"
                style={{
                  width:12, height:12,
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition:"transform 0.15s",
                }}
              />
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div
          role="group"
          aria-label={`Actions for question ${question.id}`}
          style={{ display:"flex", gap:2, flexShrink:0 }}
        >
          {[
            { Icon: ChevronUp,   label: "Move up",   onClick: onMoveUp,   danger: false },
            { Icon: ChevronDown, label: "Move down", onClick: onMoveDown, danger: false },
            { Icon: Pencil,      label: "Edit",      onClick: onEdit,     danger: false },
            { Icon: Trash2,      label: "Delete",    onClick: onDelete,   danger: true  },
          ].map(({ Icon, label, onClick, danger }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              title={label}
              style={{
                width:30, height:30, borderRadius:6,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:"none", border:"none", cursor:"pointer",
                color: danger ? "rgba(239,68,68,.5)" : "var(--text-muted)",
                transition:"all 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = danger ? "rgba(239,68,68,.1)" : "var(--bg-surface-2)";
                e.currentTarget.style.color = danger ? "#F87171" : "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = danger ? "rgba(239,68,68,.5)" : "var(--text-muted)";
              }}
            >
              <Icon aria-hidden="true" style={{ width:13, height:13 }} />
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle"|"uploading"|"success"|"error">("idle");
  const [parseResult, setParseResult]   = useState<ParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress]           = useState(0);

  /* Question management */
  const [questions, setQuestions]       = useState<RFPQuestion[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus]     = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");
  const [showFilters, setShowFilters]       = useState(false);

  /* Add/Edit modal */
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RFPQuestion | null>(null);
  const [modalText, setModalText]           = useState("");
  const [modalCategory, setModalCategory]   = useState("General");
  const [modalMandatory, setModalMandatory] = useState(false);
  const [modalSection, setModalSection]     = useState("");

  /* Delete modal */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const addDialogRef    = useRef<HTMLDialogElement>(null);
  const delDialogRef    = useRef<HTMLDialogElement>(null);
  const addTriggerRef   = useRef<HTMLButtonElement>(null);
  const deleteTriggerMap = useRef<Map<string, HTMLButtonElement>>(new Map());

  /* ── Persist / restore ──────────────────────────────────── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setParseResult(data.parseResult);
        setQuestions(data.questions || data.parseResult?.questions || []);
        setUploadStatus("success");
      }
    } catch { /* corrupt data – ignore */ }
  }, []);

  useEffect(() => {
    if (parseResult && uploadStatus === "success") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ parseResult, questions }));
    }
  }, [questions, parseResult, uploadStatus]);

  /* ── Modal helpers ──────────────────────────────────────── */
  const openAddModal = (q?: RFPQuestion) => {
    setEditingQuestion(q ?? null);
    setModalText(q?.text ?? "");
    setModalCategory(q?.category ?? "General");
    setModalMandatory(q?.mandatory ?? false);
    setModalSection(q?.section ?? "");
    setShowAddModal(true);
    requestAnimationFrame(() => addDialogRef.current?.showModal());
  };

  const closeAddModal = () => {
    addDialogRef.current?.close();
    setShowAddModal(false);
    addTriggerRef.current?.focus();
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    requestAnimationFrame(() => delDialogRef.current?.showModal());
  };

  const closeDeleteModal = () => {
    delDialogRef.current?.close();
    const btn = deleteId ? deleteTriggerMap.current.get(deleteId) : null;
    setDeleteId(null);
    btn?.focus();
  };

  /* Close on Escape (dialog handles it natively, but sync React state) */
  useEffect(() => {
    const add = addDialogRef.current;
    const del = delDialogRef.current;
    const onClose = () => { setShowAddModal(false); setDeleteId(null); };
    add?.addEventListener("close", onClose);
    del?.addEventListener("close", onClose);
    return () => { add?.removeEventListener("close", onClose); del?.removeEventListener("close", onClose); };
  }, []);

  /* ── Drag & drop ────────────────────────────────────────── */
  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      document.getElementById("file-input")?.click();
    }
  };

  /* ── Upload / parse ─────────────────────────────────────── */
  const processFile = async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".docx", ".txt", ".xlsx", ".xls", ".csv"].includes(ext)) {
      showToast("error", "Unsupported file type. Please upload PDF, DOCX, XLSX, or TXT.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File too large. Maximum size is 10 MB.");
      return;
    }
    setUploadedFile(file);
    setUploadStatus("uploading");
    setErrorMessage("");
    setProgress(0);

    let p = 0;
    progressInterval.current = setInterval(() => {
      p += Math.random() * 7;
      if (p > 90) p = 90;
      setProgress(Math.round(p));
    }, 400);

    try {
      setProcessingStep("Uploading document…");
      const form = new FormData();
      form.append("file", file);
      setProcessingStep("AI is analysing your RFP…");
      const res = await fetch("/api/parse-rfp", { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to parse RFP"); }
      const result = await res.json();
      setProcessingStep("Extracting questions…");
      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));

      const enriched: RFPQuestion[] = (result.questions || []).map(
        (q: Omit<RFPQuestion, "status" | "order">, i: number) => ({
          ...q, status: "pending" as QuestionStatus, order: i,
        })
      );
      setParseResult(result);
      setQuestions(enriched);
      setUploadStatus("success");
      showToast("success", `Extracted ${enriched.length} questions from ${file.name}`);
    } catch (err: unknown) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
      setUploadStatus("error");
      showToast("error", msg.includes("fetch") ? "Network error. Check your connection." : msg);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null); setUploadStatus("idle"); setParseResult(null);
    setQuestions([]); setErrorMessage(""); setActiveCategory("All");
    setActiveStatus("All"); setSearchQuery(""); setProgress(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fmt = (b: number) =>
    b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  /* ── Filtering ──────────────────────────────────────────── */
  const filtered = questions
    .filter((q) => activeCategory === "All" || q.category === activeCategory)
    .filter((q) => activeStatus === "All" || q.status === activeStatus)
    .filter((q) =>
      !searchQuery ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.section?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  const cats = ["All", ...Array.from(new Set(questions.map((q) => q.category)))];
  const catCount = (c: string) => c === "All" ? questions.length : questions.filter((q) => q.category === c).length;

  /* ── Question mutations ─────────────────────────────────── */
  const cycleStatus = (id: string) => {
    const cycle: QuestionStatus[] = ["pending", "in-progress", "complete"];
    setQuestions((prev) =>
      prev.map((q) =>
        q.id !== id ? q : { ...q, status: cycle[(cycle.indexOf(q.status) + 1) % cycle.length] }
      )
    );
  };

  const moveQuestion = (id: string, dir: "up" | "down") => {
    setQuestions((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= sorted.length) return prev;
      const temp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swap].order };
      sorted[swap] = { ...sorted[swap], order: temp };
      return sorted;
    });
  };

  const saveQuestion = () => {
    if (!modalText.trim()) { showToast("error", "Question text is required."); return; }
    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id !== editingQuestion.id ? q :
          { ...q, text: modalText.trim(), category: modalCategory, mandatory: modalMandatory, section: modalSection.trim() }
        )
      );
      showToast("success", "Question updated.");
    } else {
      const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order)) : -1;
      setQuestions((prev) => [
        ...prev,
        {
          id: `MAN-${Date.now().toString(36).toUpperCase()}`,
          text: modalText.trim(), category: modalCategory,
          mandatory: modalMandatory, confidence: 100,
          section: modalSection.trim(), status: "pending",
          order: maxOrder + 1,
        },
      ]);
      showToast("success", "Question added.");
    }
    closeAddModal();
  };

  const executeDelete = () => {
    if (!deleteId) return;
    setQuestions((prev) => prev.filter((q) => q.id !== deleteId));
    closeDeleteModal();
    showToast("success", "Question removed.");
  };

  const handleGenerateResponses = () => {
    if (!parseResult) return;
    saveRFPSession({
      id: crypto.randomUUID(),
      fileName: parseResult.fileName,
      rfpTitle: parseResult.rfp_title,
      issuingOrganization: parseResult.issuing_organization,
      submissionDeadline: parseResult.submission_deadline,
      questions, responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    router.push("/responses");
  };

  /* ── Summary counts ─────────────────────────────────────── */
  const pendingCount    = questions.filter((q) => q.status === "pending").length;
  const inProgressCount = questions.filter((q) => q.status === "in-progress").length;
  const completeCount   = questions.filter((q) => q.status === "complete").length;
  const mandatoryCount  = questions.filter((q) => q.mandatory).length;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <OnboardingTour />

      {/* ── Page wrapper ──────────────────────────────────── */}
      <div className="page-content" style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflowY:"auto" }}>

        {/* ── UPLOAD / HERO VIEW ────────────────────────── */}
        {uploadStatus !== "success" && (
          <main
            id="main-content"
            aria-label="Upload RFP"
            tabIndex={-1}
            className="hero-main"
            style={{ flex:1, maxWidth:1120, width:"100%", margin:"0 auto", padding:"64px 32px 48px" }}
          >
            {/* Hero */}
            <header style={{ textAlign:"center", maxWidth:640, margin:"0 auto 56px" }}>
              <div
                aria-hidden="true"
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"6px 16px", borderRadius:99,
                  background:"#EAF1EC", border:"1px solid rgba(20,108,67,.25)",
                  marginBottom:24,
                }}
              >
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#146C43" }} />
                <span style={{ fontSize:11, fontWeight:600, color:"#146C43", letterSpacing:"0.1em" }}>
                  POWERED BY AI
                </span>
              </div>

              <h1
                style={{
                  fontSize:"clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight:800, lineHeight:1.1,
                  letterSpacing:"-0.03em", margin:"0 0 20px",
                  color:"var(--text-primary)",
                }}
              >
                Win more bids.{" "}
                <span
                  aria-label="In less time."
                  style={{
                    backgroundImage:"linear-gradient(135deg,#146C43 0%,#17A95D 100%)",
                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                    backgroundClip:"text",
                  }}
                >
                  In less time.
                </span>
              </h1>

              <p style={{ fontSize:16, color:"var(--text-muted)", lineHeight:1.7, margin:0 }}>
                Upload your RFP and let AI extract every question, search your knowledge base, and generate winning draft responses — ready for review in minutes.
              </p>
            </header>

            {/* Stats */}
            <section aria-label="Product statistics" style={{ maxWidth:540, margin:"0 auto 56px" }}>
              <dl
                className="stats-strip"
                style={{
                  display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                  gap:0, border:"1px solid var(--border-subtle)",
                  borderRadius:14, overflow:"hidden",
                  background:"var(--bg-surface-1)",
                }}
              >
                {[
                  { dt:"70%",  dd:"Faster Responses" },
                  { dt:"85%",  dd:"Auto-Answered"    },
                  { dt:"2.4×", dd:"Win Rate Lift"    },
                ].map((s, i) => (
                  <div
                    key={s.dd}
                    style={{
                      textAlign:"center", padding:"24px 16px",
                      borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <dt
                      style={{
                        fontSize:28, fontWeight:800,
                        fontFamily:'"JetBrains Mono",monospace',
                        backgroundImage:"linear-gradient(180deg,rgba(250,249,246,.97),rgba(250,249,246,.5))",
                        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                        backgroundClip:"text",
                      }}
                    >
                      {s.dt}
                    </dt>
                    <dd style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>
                      {s.dd}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Upload zone */}
            <section
              aria-label="File upload"
              style={{ maxWidth:600, margin:"0 auto" }}
            >
              {uploadStatus === "idle" && (
                <>
                  {/* Glow blob */}
                  <div
                    aria-hidden="true"
                    style={{
                      position:"relative", width:"100%",
                    }}
                  >
                    <div
                      style={{
                        position:"absolute", inset:"-40px -60px",
                        background:"radial-gradient(ellipse at center,rgba(20,108,67,.06) 0%,transparent 70%)",
                        pointerEvents:"none",
                      }}
                    />
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload RFP document. Accepts PDF, DOCX, XLSX. Maximum 10 MB."
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                    onKeyDown={handleUploadKeyDown}
                    style={{
                      position:"relative",
                      border: isDragging
                        ? "2px dashed #146C43"
                        : "2px dashed #E5E3DC",
                      borderRadius:20, cursor:"pointer",
                      background: isDragging
                        ? "rgba(20,108,67,.05)"
                        : "transparent",
                      transition:"all 0.25s ease-out",
                      transform: isDragging ? "scale(1.01)" : "scale(1)",
                      boxShadow: isDragging ? "0 0 32px rgba(20,108,67,.12)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display:"flex", flexDirection:"column",
                        alignItems:"center", textAlign:"center",
                        padding:"56px 32px",
                      }}
                    >
                      {/* Icon */}
                      <div
                        aria-hidden="true"
                        style={{
                          width:64, height:64, borderRadius:16,
                          background: isDragging
                            ? "rgba(20,108,67,.12)"
                            : "var(--soft,#F6F4EF)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          marginBottom:24,
                          transition:"all 0.25s",
                          boxShadow: isDragging ? "0 0 20px rgba(20,108,67,.2)" : "none",
                        }}
                      >
                        <svg
                          width="28" height="28" viewBox="0 0 24 24" fill="none"
                          stroke={isDragging ? "#146C43" : "#a8a499"}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>

                      <p style={{ fontSize:17, fontWeight:600, margin:"0 0 8px", color:"var(--text-primary)" }}>
                        {isDragging ? "Release to upload" : "Drop your RFP here"}
                      </p>
                      <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 24px" }}>
                        or{" "}
                        <span style={{ color:"#146C43", textDecoration:"underline", textDecorationColor:"rgba(20,108,67,.35)", textUnderlineOffset:3 }}>
                          browse files
                        </span>{" "}
                        to upload
                      </p>

                      {/* Format badges */}
                      <div
                        role="list"
                        aria-label="Accepted file formats"
                        style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}
                      >
                        {["PDF", "DOCX", "XLSX"].map((fmt) => (
                          <span
                            key={fmt}
                            role="listitem"
                            style={{
                              display:"inline-flex", alignItems:"center", gap:5,
                              padding:"4px 10px", borderRadius:6,
                              border:"1px solid var(--border-subtle)",
                              background:"var(--bg-surface-2)",
                              fontSize:11, fontWeight:600,
                              color:"var(--text-muted)", letterSpacing:"0.05em",
                            }}
                          >
                            <FileText aria-hidden="true" style={{ width:10, height:10 }} />
                            {fmt}
                          </span>
                        ))}
                        <span
                          style={{
                            padding:"4px 10px", borderRadius:6,
                            border:"1px solid var(--border-subtle)",
                            background:"var(--bg-surface-2)",
                            fontSize:11, color:"var(--text-muted)",
                          }}
                        >
                          Max 10 MB
                        </span>
                      </div>
                    </div>

                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
                      onChange={handleFileInput}
                      aria-label="Choose RFP file"
                      style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }}
                    />
                  </div>
                </>
              )}

              {/* Uploading state */}
              {uploadStatus === "uploading" && uploadedFile && (
                <div
                  role="status"
                  aria-label={`${processingStep} ${progress}% complete`}
                  aria-live="polite"
                  style={{
                    borderRadius:20, border:"1px solid var(--border-subtle)",
                    background:"var(--bg-surface-1)", padding:28,
                  }}
                >
                  <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        width:44, height:44, borderRadius:10, flexShrink:0,
                        background:"#EAF1EC",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}
                    >
                      <FileText style={{ width:20, height:20, color:"#146C43" }} aria-hidden="true" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:500, color:"var(--text-primary)", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {uploadedFile.name}
                      </p>
                      <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>
                        {fmt(uploadedFile.size)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:"var(--text-muted)" }}>{processingStep}</span>
                    <span
                      style={{
                        fontSize:13, fontWeight:500,
                        fontFamily:'"JetBrains Mono",monospace',
                        color:"#146C43",
                      }}
                    >
                      {progress}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Upload progress: ${progress}%`}
                    style={{ height:4, borderRadius:99, background:"var(--track,#EFEDE6)", overflow:"hidden" }}
                  >
                    <div
                      style={{
                        height:"100%", borderRadius:99,
                        background:"linear-gradient(90deg,#146C43,#17A95D)",
                        width:`${progress}%`,
                        transition:"width 0.3s ease-out",
                      }}
                    />
                  </div>

                  <p
                    aria-live="polite"
                    style={{ fontSize:12, color:"var(--text-muted)", marginTop:10 }}
                  >
                    This usually takes 15–30 seconds…
                  </p>
                </div>
              )}

              {/* Error state */}
              {uploadStatus === "error" && (
                <div
                  role="alert"
                  style={{
                    borderRadius:20, border:"1px solid rgba(239,68,68,.2)",
                    background:"rgba(239,68,68,.04)", padding:28, textAlign:"center",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width:48, height:48, borderRadius:12,
                      background:"rgba(239,68,68,.1)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 14px",
                    }}
                  >
                    <X style={{ width:22, height:22, color:"#F87171" }} aria-hidden="true" />
                  </div>
                  <p style={{ fontSize:15, fontWeight:600, color:"#FCA5A5", margin:"0 0 6px" }}>
                    Failed to process document
                  </p>
                  <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px" }}>
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={resetUpload}
                    style={{
                      padding:"8px 20px", borderRadius:8,
                      background:"var(--bg-surface-2)", border:"1px solid var(--border-default)",
                      color:"var(--text-secondary)", fontSize:14, cursor:"pointer",
                      fontFamily:"inherit",
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </section>

            {/* How it works */}
            {uploadStatus === "idle" && (
              <section
                aria-labelledby="how-it-works-heading"
                style={{ maxWidth:760, margin:"80px auto 0" }}
              >
                <h2
                  id="how-it-works-heading"
                  style={{
                    textAlign:"center", fontSize:11, fontWeight:600,
                    letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"var(--text-muted)", marginBottom:40,
                  }}
                >
                  How BidCraft Works
                </h2>

                <ol
                  role="list"
                  style={{
                    display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
                    gap:16, listStyle:"none", padding:0, margin:0,
                  }}
                >
                  {[
                    {
                      n:"01", title:"Upload RFP",
                      desc:"Drop your RFP in any format. AI parses and extracts every question — structured automatically.",
                      icon:(
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      ),
                    },
                    {
                      n:"02", title:"AI Matches & Drafts",
                      desc:"Questions are matched against your knowledge base. Claude drafts tailored, confidence-scored responses.",
                      icon:(
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      ),
                    },
                    {
                      n:"03", title:"Review & Export",
                      desc:"Edit responses in a rich text editor, mark as complete, then export a polished DOCX proposal.",
                      icon:(
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      ),
                    },
                  ].map((step) => (
                    <li
                      key={step.n}
                      style={{
                        borderRadius:14, border:"1px solid var(--border-subtle)",
                        background:"var(--bg-surface-1)", padding:24,
                        transition:"border-color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = "var(--border-default)";
                        el.style.background = "var(--bg-surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = "var(--border-subtle)";
                        el.style.background = "var(--bg-surface-1)";
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                        <span
                          style={{
                            fontFamily:'"JetBrains Mono",monospace', fontSize:11,
                            fontWeight:700, color:"rgba(20,108,67,.6)",
                          }}
                        >
                          {step.n}
                        </span>
                        <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(130,140,132,.12),transparent)" }} />
                      </div>
                      <div
                        aria-hidden="true"
                        style={{
                          width:40, height:40, borderRadius:10,
                          background:"var(--soft,#F6F4EF)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          color:"var(--faint2,#a8a499)", marginBottom:14,
                        }}
                      >
                        {step.icon}
                      </div>
                      <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 8px", color:"var(--text-primary)" }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6, margin:0 }}>
                        {step.desc}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </main>
        )}

        {/* ── RESULTS VIEW ────────────────────────────────── */}
        {uploadStatus === "success" && parseResult && (
          <main
            id="main-content"
            aria-label={`RFP: ${parseResult.rfp_title}`}
            tabIndex={-1}
            className="page-main"
            style={{ flex:1, maxWidth:1120, width:"100%", margin:"0 auto", padding:"32px 32px 48px" }}
          >
            {/* RFP header */}
            <header
              className="rfp-header"
              style={{
                display:"flex", alignItems:"flex-start",
                justifyContent:"space-between", gap:16,
                marginBottom:28,
                padding:"24px 28px",
                borderRadius:16, border:"1px solid var(--border-subtle)",
                background:"var(--bg-surface-1)",
                borderLeft:"3px solid #146C43",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize:22, fontWeight:700,
                    letterSpacing:"-0.02em",
                    color:"var(--text-primary)", margin:"0 0 6px",
                  }}
                >
                  {parseResult.rfp_title}
                </h1>
                <p style={{ fontSize:14, color:"var(--text-muted)", margin:0 }}>
                  <span>{parseResult.issuing_organization}</span>
                  {parseResult.submission_deadline && (
                    <>
                      {" · "}
                      <time
                        dateTime={parseResult.submission_deadline}
                        aria-label={`Deadline: ${parseResult.submission_deadline}`}
                        style={{ color:"#FCD34D" }}
                      >
                        Due {parseResult.submission_deadline}
                      </time>
                    </>
                  )}
                </p>
              </div>

              <div className="rfp-header-actions" style={{ display:"flex", gap:10, flexShrink:0 }}>
                <button
                  type="button"
                  onClick={resetUpload}
                  style={{
                    padding:"9px 16px", borderRadius:8,
                    background:"var(--bg-surface-2)", border:"1px solid var(--border-default)",
                    color:"var(--text-secondary)", fontSize:13, cursor:"pointer",
                    fontFamily:"inherit", fontWeight:500,
                  }}
                >
                  New Upload
                </button>
                <button
                  type="button"
                  onClick={handleGenerateResponses}
                  style={{
                    display:"flex", alignItems:"center", gap:7,
                    padding:"9px 20px", borderRadius:8,
                    background:"linear-gradient(135deg,#146C43,#17A95D)",
                    border:"none", color:"white", fontSize:13,
                    fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                    boxShadow:"0 4px 12px rgba(20,108,67,.2)",
                  }}
                >
                  <Sparkles aria-hidden="true" style={{ width:14, height:14 }} />
                  Generate Responses
                </button>
              </div>
            </header>

            {/* KPI summary cards */}
            <section aria-label="RFP summary" style={{ marginBottom:28 }}>
              <dl
                className="kpi-grid"
                style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(5,1fr)",
                  gap:12,
                }}
              >
                {[
                  { dt:questions.length, dd:"Total",       color:"#146C43", bg:"rgba(20,108,67,.08)" },
                  { dt:pendingCount,     dd:"Pending",     color:"#8A867D", bg:"var(--soft,#F6F4EF)" },
                  { dt:inProgressCount,  dd:"In Progress", color:"#F59E0B", bg:"rgba(245,158,11,.08)" },
                  { dt:completeCount,    dd:"Complete",    color:"#10B981", bg:"rgba(16,185,129,.08)"  },
                  { dt:mandatoryCount,   dd:"Mandatory",   color:"#EF4444", bg:"rgba(239,68,68,.08)"   },
                ].map((card) => (
                  <div
                    key={card.dd}
                    style={{
                      borderRadius:12, border:"1px solid var(--border-subtle)",
                      background:"var(--bg-surface-1)", padding:"16px 18px",
                    }}
                  >
                    <dt
                      style={{
                        fontSize:28, fontWeight:800,
                        fontFamily:'"JetBrains Mono",monospace',
                        color:card.color, lineHeight:1, marginBottom:4,
                      }}
                    >
                      {card.dt}
                    </dt>
                    <dd style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>
                      {card.dd}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Toolbar */}
            <div className="toolbar-row" style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <Search
                  aria-hidden="true"
                  style={{
                    position:"absolute", left:12, top:"50%",
                    transform:"translateY(-50%)",
                    width:15, height:15, color:"var(--text-muted)",
                  }}
                />
                <input
                  type="search"
                  placeholder="Search questions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search questions"
                  style={{
                    width:"100%", paddingLeft:36, paddingRight:14,
                    paddingTop:9, paddingBottom:9,
                    borderRadius:8, border:"1px solid var(--border-subtle)",
                    background:"var(--bg-surface-1)", color:"var(--text-primary)",
                    fontSize:14, fontFamily:"inherit",
                    outline:"none",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((f) => !f)}
                aria-pressed={showFilters}
                aria-controls="filter-panel"
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"9px 14px", borderRadius:8, fontSize:13,
                  fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                  border: showFilters ? "1px solid rgba(20,108,67,.4)" : "1px solid var(--border-subtle)",
                  background: showFilters ? "rgba(20,108,67,.08)" : "var(--bg-surface-1)",
                  color: showFilters ? "#146C43" : "var(--text-muted)",
                  transition:"all 0.15s",
                }}
              >
                <Filter aria-hidden="true" style={{ width:14, height:14 }} />
                Filters
              </button>

              <button
                ref={addTriggerRef}
                type="button"
                onClick={() => openAddModal()}
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"9px 14px", borderRadius:8, fontSize:13,
                  fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                  border:"1px solid rgba(20,108,67,.3)",
                  background:"#EAF1EC",
                  color:"#146C43",
                  transition:"all 0.15s",
                }}
              >
                <Plus aria-hidden="true" style={{ width:14, height:14 }} />
                Add Question
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div
                id="filter-panel"
                role="group"
                aria-label="Filter questions"
                style={{
                  borderRadius:10, border:"1px solid var(--border-subtle)",
                  background:"var(--bg-surface-1)", padding:16, marginBottom:16,
                }}
              >
                <fieldset style={{ border:"none", margin:"0 0 12px", padding:0 }}>
                  <legend style={{ fontSize:11, color:"var(--text-muted)", fontWeight:500, marginBottom:8 }}>
                    Category
                  </legend>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {cats.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        aria-pressed={activeCategory === cat}
                        style={{
                          padding:"5px 12px", borderRadius:6, fontSize:12,
                          fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                          transition:"all 0.15s",
                          background: activeCategory === cat ? "rgba(20,108,67,.1)" : "var(--bg-surface-2)",
                          border: activeCategory === cat ? "1px solid rgba(20,108,67,.3)" : "1px solid var(--border-subtle)",
                          color: activeCategory === cat ? "#146C43" : "var(--text-muted)",
                        }}
                      >
                        {cat} ({catCount(cat)})
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset style={{ border:"none", margin:0, padding:0 }}>
                  <legend style={{ fontSize:11, color:"var(--text-muted)", fontWeight:500, marginBottom:8 }}>
                    Status
                  </legend>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {(["All", "pending", "in-progress", "complete"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActiveStatus(s)}
                        aria-pressed={activeStatus === s}
                        style={{
                          padding:"5px 12px", borderRadius:6, fontSize:12,
                          fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                          transition:"all 0.15s",
                          background: activeStatus === s ? "rgba(20,108,67,.1)" : "var(--bg-surface-2)",
                          border: activeStatus === s ? "1px solid rgba(20,108,67,.3)" : "1px solid var(--border-subtle)",
                          color: activeStatus === s ? "#146C43" : "var(--text-muted)",
                        }}
                      >
                        {s === "All" ? "All" : STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Question list */}
            <section aria-label={`${filtered.length} questions`}>
              {filtered.length > 0 ? (
                <ul role="list" style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                  {filtered.map((q) => (
                    <li key={q.id}>
                      <QuestionCard
                        question={q}
                        onEdit={() => openAddModal(q)}
                        onDelete={() => {
                          openDeleteModal(q.id);
                        }}
                        onMoveUp={() => moveQuestion(q.id, "up")}
                        onMoveDown={() => moveQuestion(q.id, "down")}
                        onCycleStatus={() => cycleStatus(q.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    textAlign:"center", padding:"60px 24px",
                    borderRadius:16, border:"1px dashed var(--border-subtle)",
                    background:"var(--bg-surface-1)",
                  }}
                >
                  <Search
                    aria-hidden="true"
                    style={{ width:36, height:36, color:"var(--text-muted)", margin:"0 auto 14px" }}
                  />
                  <p style={{ fontSize:15, fontWeight:500, color:"var(--text-secondary)", margin:"0 0 6px" }}>
                    No questions match your filters
                  </p>
                  <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>
                    Try adjusting the category or status filter, or clear your search.
                  </p>
                </div>
              )}
            </section>
          </main>
        )}

        {/* ── Footer ────────────────────────────────────── */}
        <footer
          style={{
            borderTop:"1px solid var(--border-subtle)",
            padding:"20px 32px",
          }}
        >
          <div
            style={{
              maxWidth:1120, margin:"0 auto",
              display:"flex", justifyContent:"space-between",
              fontSize:12, color:"var(--text-muted)",
            }}
          >
            <span>© 2026 BidCraft. Built with AI.</span>
            <span>A portfolio project by Bhargav Hari</span>
          </div>
        </footer>
      </div>

      {/* ── Add / Edit dialog ──────────────────────────── */}
      <dialog
        ref={addDialogRef}
        aria-labelledby="add-dialog-title"
        aria-modal="true"
        style={{ width:"100%", maxWidth:480 }}
        onClose={closeAddModal}
      >
        {/* Gradient accent bar */}
        <div style={{ height:3, background:"linear-gradient(90deg,#146C43,#17A95D)" }} />
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 id="add-dialog-title" style={{ fontSize:17, fontWeight:700, margin:0, color:"var(--text-primary)" }}>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </h2>
            <button
              type="button"
              onClick={closeAddModal}
              aria-label="Close dialog"
              style={{
                width:30, height:30, borderRadius:6, border:"none",
                background:"none", cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center",
                color:"var(--text-muted)",
              }}
            >
              <X aria-hidden="true" style={{ width:15, height:15 }} />
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label
                htmlFor="modal-text"
                style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:6, fontWeight:500 }}
              >
                Question text <span aria-label="required">*</span>
              </label>
              <textarea
                id="modal-text"
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                rows={3}
                required
                aria-required="true"
                placeholder="Enter the question or requirement…"
                style={{
                  width:"100%", padding:"10px 12px", borderRadius:8,
                  border:"1px solid var(--border-subtle)", background:"var(--bg-surface-2)",
                  color:"var(--text-primary)", fontSize:14, fontFamily:"inherit",
                  resize:"vertical", outline:"none", lineHeight:1.6,
                }}
              />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label htmlFor="modal-category" style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:6, fontWeight:500 }}>
                  Category
                </label>
                <select
                  id="modal-category"
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  style={{
                    width:"100%", padding:"9px 12px", borderRadius:8,
                    border:"1px solid var(--border-subtle)", background:"var(--bg-surface-2)",
                    color:"var(--text-primary)", fontSize:14, fontFamily:"inherit",
                    outline:"none",
                  }}
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background:"#12182B" }}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-section" style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:6, fontWeight:500 }}>
                  Section
                </label>
                <input
                  id="modal-section"
                  type="text"
                  value={modalSection}
                  onChange={(e) => setModalSection(e.target.value)}
                  placeholder="e.g. Technical Requirements"
                  style={{
                    width:"100%", padding:"9px 12px", borderRadius:8,
                    border:"1px solid var(--border-subtle)", background:"var(--bg-surface-2)",
                    color:"var(--text-primary)", fontSize:14, fontFamily:"inherit",
                    outline:"none",
                  }}
                />
              </div>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <input
                type="checkbox"
                checked={modalMandatory}
                onChange={(e) => setModalMandatory(e.target.checked)}
                aria-label="Mark as mandatory question"
                style={{ width:16, height:16, accentColor:"#146C43" }}
              />
              <span style={{ fontSize:14, color:"var(--text-secondary)" }}>
                Mandatory question
              </span>
            </label>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:22 }}>
            <button
              type="button"
              onClick={closeAddModal}
              style={{
                padding:"9px 16px", borderRadius:8,
                background:"var(--bg-surface-2)", border:"1px solid var(--border-default)",
                color:"var(--text-secondary)", fontSize:13,
                cursor:"pointer", fontFamily:"inherit", fontWeight:500,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveQuestion}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"9px 18px", borderRadius:8,
                background:"#146C43", border:"none",
                color:"white", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              <Check aria-hidden="true" style={{ width:14, height:14 }} />
              {editingQuestion ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </div>
      </dialog>

      {/* ── Delete confirmation dialog ─────────────────── */}
      <dialog
        ref={delDialogRef}
        aria-labelledby="del-dialog-title"
        aria-describedby="del-dialog-desc"
        aria-modal="true"
        style={{ width:"100%", maxWidth:380 }}
        onClose={closeDeleteModal}
      >
        <div style={{ padding:24 }}>
          <h2 id="del-dialog-title" style={{ fontSize:17, fontWeight:700, margin:"0 0 8px", color:"var(--text-primary)" }}>
            Delete question?
          </h2>
          <p id="del-dialog-desc" style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 22px", lineHeight:1.6 }}>
            This action cannot be undone. The question will be permanently removed from this RFP session.
          </p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
            <button
              type="button"
              onClick={closeDeleteModal}
              style={{
                padding:"9px 16px", borderRadius:8,
                background:"var(--bg-surface-2)", border:"1px solid var(--border-default)",
                color:"var(--text-secondary)", fontSize:13,
                cursor:"pointer", fontFamily:"inherit", fontWeight:500,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDelete}
              style={{
                padding:"9px 18px", borderRadius:8,
                background:"#EF4444", border:"none",
                color:"white", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
