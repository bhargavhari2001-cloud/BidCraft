"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RFPSession } from "@/types";
import { getRFPSessions, deleteRFPSession, clearAllSessions, saveRFPSession } from "@/lib/storage";
import { showToast } from "@/components/Toast";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Eye,
  Clock,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<RFPSession[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setSessions(getRFPSessions());
  }, []);

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      deleteRFPSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
      showToast("success", "RFP session deleted");
    } else {
      setDeletingId(id);
    }
  };

  const handleClearAll = () => {
    if (confirmClearAll) {
      clearAllSessions();
      setSessions([]);
      setConfirmClearAll(false);
      showToast("success", "All history cleared");
    } else {
      setConfirmClearAll(true);
    }
  };

  const handleViewResponses = (session: RFPSession) => {
    // Make sure it's the latest session so responses page picks it up
    saveRFPSession(session);
    router.push("/responses");
  };

  const categoryColors: Record<string, string> = {
    Technical: "text-violet-400",
    "Security & Compliance": "text-red-400",
    "Experience & References": "text-cyan-400",
    Staffing: "text-amber-400",
    Methodology: "text-emerald-400",
    Pricing: "text-pink-400",
    General: "text-white/40",
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to BidCraft
          </button>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                confirmClearAll
                  ? "bg-red-500/20 border border-red-500/30 text-red-300"
                  : "bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white/70"
              }`}
            >
              {confirmClearAll ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Confirm Clear All
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </>
              )}
            </button>
          )}
        </div>
      </nav>

      {confirmClearAll && (
        <button
          onClick={() => setConfirmClearAll(false)}
          className="fixed inset-0 z-40"
          aria-label="Cancel"
        />
      )}

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">RFP History</h1>
          <p className="text-white/40 text-sm">
            {sessions.length} {sessions.length === 1 ? "analysis" : "analyses"} saved
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white/30 mb-2">No history yet</h2>
            <p className="text-sm text-white/20 mb-6">
              Upload and parse an RFP to see it here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
            >
              Upload RFP
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const answeredCount = session.responses.filter(
                (r) => r.status === "generated" || r.status === "edited"
              ).length;
              const categories = [...new Set(session.questions.map((q) => q.category))];
              const isDeleting = deletingId === session.id;

              return (
                <div
                  key={session.id}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 p-5 animate-fade-in"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {session.rfpTitle || session.fileName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                            </span>
                            <span>{session.fileName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleViewResponses(session)}
                            className="p-2 rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-colors"
                            title="View responses"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDeleting
                                ? "bg-red-500/20 text-red-400"
                                : "hover:bg-red-500/10 text-white/30 hover:text-red-400"
                            }`}
                            title={isDeleting ? "Click again to confirm" : "Delete"}
                          >
                            {isDeleting ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] text-xs text-white/50">
                          <Eye className="w-3 h-3" />
                          {session.questions.length} questions
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] text-xs text-white/50">
                          <MessageSquare className="w-3 h-3" />
                          {answeredCount}/{session.questions.length} answered
                        </div>
                        {session.issuingOrganization && (
                          <span className="text-xs text-white/20">
                            {session.issuingOrganization}
                          </span>
                        )}
                      </div>

                      {/* Category tags */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {categories.slice(0, 4).map((cat) => (
                          <span
                            key={cat}
                            className={`text-xs ${categoryColors[cat] || "text-white/30"}`}
                          >
                            {cat}
                          </span>
                        ))}
                        {categories.length > 4 && (
                          <span className="text-xs text-white/20">
                            +{categories.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-white/20">&copy; 2026 BidCraft. Built with AI.</span>
          <span className="text-xs text-white/20">A portfolio project by Bhargav Hari</span>
        </div>
      </footer>
    </div>
  );
}
