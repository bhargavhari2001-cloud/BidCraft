"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KnowledgeBaseEntry } from "@/types";
import {
  getKnowledgeBaseEntries,
  saveKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  searchKnowledgeBaseSemantic,
  SemanticSearchResult,
} from "@/lib/knowledgeBaseService";
import { showToast } from "@/components/Toast";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit3,
  Save,
  X,
  BookOpen,
  Tag,
  Upload,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Technical",
  "Security & Compliance",
  "Experience & References",
  "Staffing",
  "Methodology",
  "Pricing",
  "General",
];

const categoryColors: Record<string, string> = {
  Technical: "text-violet-400 bg-violet-500/10",
  "Security & Compliance": "text-red-400 bg-red-500/10",
  "Experience & References": "text-cyan-400 bg-cyan-500/10",
  Staffing: "text-amber-400 bg-amber-500/10",
  Methodology: "text-emerald-400 bg-emerald-500/10",
  Pricing: "text-pink-400 bg-pink-500/10",
  General: "text-white/50 bg-white/[0.06]",
};

interface EditingEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editing, setEditing] = useState<EditingEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Semantic search state
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload Past RFP state
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await getKnowledgeBaseEntries();
      setEntries(data);
    } catch {
      showToast("error", "Failed to load knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  // Keyword filtering (local)
  const filtered = entries.filter((e) => {
    const matchCat = activeCategory === "All" || e.category === activeCategory;
    if (!searchQuery || semanticMode) return matchCat;
    const lower = searchQuery.toLowerCase();
    const matchQuery =
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower));
    return matchCat && matchQuery;
  });

  // Semantic search
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchKnowledgeBaseSemantic(
        searchQuery,
        activeCategory === "All" ? undefined : activeCategory
      );
      setSemanticResults(results);
    } catch {
      showToast("error", "Semantic search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Display items: semantic results when in semantic mode, else filtered
  const displayItems = semanticMode && semanticResults.length > 0
    ? semanticResults.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        tags: r.tags,
        similarity: r.similarity,
        createdAt: "",
        updatedAt: "",
      }))
    : filtered;

  const startEdit = (entry: KnowledgeBaseEntry | (SemanticSearchResult & { createdAt: string; updatedAt: string })) => {
    setEditing({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      content: entry.content,
      tags: entry.tags.join(", "),
    });
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      category: "General",
      content: "",
      tags: "",
    });
    setIsAdding(true);
  };

  const saveEntry = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.content.trim()) {
      showToast("error", "Title and content are required");
      return;
    }
    setIsSaving(true);
    try {
      const entry: KnowledgeBaseEntry = {
        id: editing.id,
        title: editing.title.trim(),
        category: editing.category,
        content: editing.content.trim(),
        tags: editing.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        createdAt: isAdding
          ? new Date().toISOString()
          : entries.find((e) => e.id === editing.id)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveKnowledgeBaseEntry(entry);
      await loadEntries();
      setEditing(null);
      setIsAdding(false);
      showToast("success", isAdding ? "Entry added with embedding" : "Entry updated with embedding");
    } catch {
      showToast("error", "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteKnowledgeBaseEntry(id);
      await loadEntries();
      showToast("success", "Entry deleted");
    } catch {
      showToast("error", "Failed to delete entry");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: KnowledgeBaseEntry[] = Array.isArray(data) ? data : [data];
      let count = 0;
      for (const item of items) {
        if (item.title && item.content) {
          await saveKnowledgeBaseEntry({
            id: item.id || crypto.randomUUID(),
            title: item.title,
            category: item.category || "General",
            content: item.content,
            tags: item.tags || [],
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }
      await loadEntries();
      showToast("success", `Imported ${count} entries with embeddings`);
    } catch {
      showToast("error", "Failed to parse file. Must be valid JSON.");
    }
    e.target.value = "";
  };

  const handleUploadPastRFP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-rfp", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse RFP");
      }

      const result = await res.json();
      const questions = result.questions || [];

      if (questions.length === 0) {
        showToast("error", "No questions extracted from the document");
        return;
      }

      // Create KB entries from extracted questions
      let count = 0;
      for (const q of questions) {
        await saveKnowledgeBaseEntry({
          id: crypto.randomUUID(),
          title: q.text.substring(0, 120),
          category: q.category || "General",
          content: q.text,
          tags: [q.section, q.category, q.mandatory ? "mandatory" : "optional"].filter(Boolean),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }

      await loadEntries();
      showToast(
        "success",
        `Extracted ${count} Q&A entries from ${file.name} into the knowledge base`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast("error", `Failed to process RFP: ${msg}`);
    } finally {
      setIsExtracting(false);
    }
    e.target.value = "";
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";

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
          <div className="flex items-center gap-2">
            {/* Upload Past RFP */}
            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                isExtracting
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
              }`}
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isExtracting ? "Extracting..." : "Upload Past RFP"}
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleUploadPastRFP}
                disabled={isExtracting}
              />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.1] transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
            </label>
            <button
              onClick={startAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
          <p className="text-white/40 text-sm">
            {isLoading ? "Loading..." : `${entries.length} entries`} — these inform AI-generated RFP responses
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              className={`${inputClass} pl-10 pr-24`}
              placeholder={
                semanticMode
                  ? "Ask a question to find similar entries..."
                  : "Search entries by title, content, or tags..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && semanticMode) handleSemanticSearch();
              }}
            />
            {semanticMode && (
              <button
                onClick={handleSemanticSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors disabled:opacity-40"
              >
                {isSearching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            )}
          </div>
          {/* Semantic toggle */}
          <button
            onClick={() => {
              setSemanticMode(!semanticMode);
              setSemanticResults([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
              semanticMode
                ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Search
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {CATEGORIES.map((cat) => {
            const count =
              cat === "All"
                ? entries.length
                : entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Edit/Add Modal */}
        {editing && (
          <div className="mb-6 rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {isAdding ? "Add New Entry" : "Edit Entry"}
              </h3>
              <button
                onClick={() => {
                  setEditing(null);
                  setIsAdding(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              className={inputClass}
              placeholder="Entry title"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <select
              className={inputClass}
              value={editing.category}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value })
              }
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c} className="bg-[#0B0F1A]">
                  {c}
                </option>
              ))}
            </select>
            <textarea
              className={`${inputClass} min-h-[150px] resize-y`}
              placeholder="Response content that will be used to inform AI answers..."
              value={editing.content}
              onChange={(e) =>
                setEditing({ ...editing, content: e.target.value })
              }
            />
            <input
              className={inputClass}
              placeholder="Tags (comma-separated): cloud, aws, security"
              value={editing.tags}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/20">
                An embedding will be generated automatically on save
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(null);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] text-sm hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving
                    ? "Saving & embedding..."
                    : isAdding
                    ? "Add"
                    : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/30">Loading knowledge base...</p>
          </div>
        )}

        {/* Semantic search results info */}
        {semanticMode && semanticResults.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-xs text-white/30">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>
              {semanticResults.length} results by semantic similarity
            </span>
            <button
              onClick={() => setSemanticResults([])}
              className="ml-auto text-white/20 hover:text-white/40"
            >
              Clear results
            </button>
          </div>
        )}

        {/* Entries list */}
        {!isLoading && displayItems.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white/30 mb-2">
              {searchQuery
                ? semanticMode
                  ? "No semantic matches found"
                  : "No matching entries"
                : "Knowledge base is empty"}
            </h2>
            <p className="text-sm text-white/20">
              {searchQuery
                ? semanticMode
                  ? "Try a different question or switch to keyword search."
                  : "Try a different search term."
                : "Add entries to help the AI generate better responses."}
            </p>
          </div>
        ) : (
          !isLoading && (
            <div className="space-y-3">
              {displayItems.map((entry) => {
                const sim = "similarity" in entry ? entry.similarity : null;
                return (
                  <div
                    key={entry.id}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 p-5 animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold mb-1">
                          {entry.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                              categoryColors[entry.category] ||
                              categoryColors["General"]
                            }`}
                          >
                            {entry.category}
                          </span>
                          {sim !== null && sim !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-500/10 text-violet-300">
                              <Sparkles className="w-3 h-3" />
                              {Math.round(sim * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(entry as KnowledgeBaseEntry)}
                          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-violet-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={isDeleting === entry.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isDeleting === entry.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-3 mb-3">
                      {entry.content}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-white/15" />
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-xs bg-white/[0.04] text-white/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-white/20">
            &copy; 2026 BidCraft. Built with AI.
          </span>
          <span className="text-xs text-white/20">
            A portfolio project by Bhargav Hari
          </span>
        </div>
      </footer>
    </div>
  );
}
