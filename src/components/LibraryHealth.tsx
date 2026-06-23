"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Copy, Clock, X } from "lucide-react";

interface DuplicatePair {
  id_a: string;
  title_a: string;
  id_b: string;
  title_b: string;
  similarity: number;
}
interface StaleEntry {
  id: string;
  title: string;
  category: string;
  updated_at: string;
  days_stale: number;
}

/**
 * Library Health — duplicate + stale content report for the knowledge base.
 * Mirrors the "library maintenance" feature of enterprise RFP tools, using
 * the embeddings BidCraft already stores (zero extra cost).
 */
export default function LibraryHealth() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupes, setDupes] = useState<DuplicatePair[]>([]);
  const [stale, setStale] = useState<StaleEntry[]>([]);
  const [checked, setChecked] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kb-hygiene");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Health check failed");
      setDupes(data.duplicates || []);
      setStale(data.stale || []);
      setChecked(true);
      setOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Health check failed");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={runCheck}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/90 transition-colors disabled:opacity-50"
        aria-label="Run library health check"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Library health check
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80">
              Library health {checked && !error && <span className="text-white/40 font-normal">— {dupes.length} possible duplicates · {stale.length} stale entries</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70" aria-label="Close report">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          {!error && checked && dupes.length === 0 && stale.length === 0 && (
            <p className="text-sm text-emerald-400">All clear — no near-duplicates and nothing stale. 🎉</p>
          )}

          {dupes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                <Copy className="w-3.5 h-3.5" /> Possible duplicates (≥92% similar)
              </div>
              <ul className="space-y-1.5">
                {dupes.slice(0, 10).map((d) => (
                  <li key={`${d.id_a}-${d.id_b}`} className="text-sm text-white/60">
                    <span className="text-white/85">{d.title_a}</span>
                    {" ↔ "}
                    <span className="text-white/85">{d.title_b}</span>
                    <span className="text-white/35"> · {(d.similarity * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stale.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" /> Stale (90+ days without update)
              </div>
              <ul className="space-y-1.5">
                {stale.slice(0, 10).map((s) => (
                  <li key={s.id} className="text-sm text-white/60">
                    <span className="text-white/85">{s.title}</span>
                    <span className="text-white/35"> · {s.category} · {s.days_stale} days</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
