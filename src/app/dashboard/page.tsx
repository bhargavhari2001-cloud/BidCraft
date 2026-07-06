"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRFPSessions } from "@/lib/storage";
import { RFPSession } from "@/types";

const ACCENT = "var(--accent)";

// Design-file static data for fields not in the current data model
// (monetary values, win rate, deadlines, activity feed)
const STATIC_BIDS = [
  { name: "Municipal Cloud Migration",     client: "City of Westbrook",     value: "$1.2M", pct: "67%", pctColor: "var(--pos)", due: "Jul 3",  dueNote: "4 days",    dueColor: "var(--neg)" },
  { name: "Data Platform Modernization",   client: "Coastal Health Network", value: "$880K", pct: "41%", pctColor: "var(--accent)", due: "Jul 9",  dueNote: "10 days",   dueColor: "#1B1A17" },
  { name: "Managed Security Services",     client: "Atlas Logistics",        value: "$520K", pct: "88%", pctColor: "var(--pos)", due: "Jul 2",  dueNote: "3 days",    dueColor: "var(--neg)" },
  { name: "DevOps Transformation",         client: "Pinnacle Retail Group",  value: "$1.05M",pct: "100%",pctColor: "var(--pos)", due: "Jun 24", dueNote: "awaiting",  dueColor: "#1B1A17" },
];

const deadlines = [
  { mon: "Jul", day: "02", title: "Atlas Logistics — final review",    note: "3 days · 88% complete",   color: "var(--neg)" },
  { mon: "Jul", day: "03", title: "City of Westbrook — submission",    note: "4 days · 8 questions left", color: "var(--warn)" },
  { mon: "Jul", day: "09", title: "Coastal Health — draft due",        note: "10 days · on track",       color: "var(--pos)" },
];

const activity = [
  { text: "Claude drafted 3 responses for City of Westbrook",    who: "AI assistant", time: "12 min ago", iconBg: "var(--accent-soft)", iconFg: ACCENT },
  { text: 'Ravi marked "Security certifications" as complete',  who: "Ravi Kapoor",  time: "48 min ago", iconBg: "var(--accent-soft)", iconFg: "var(--pos)" },
  { text: "New RFP uploaded — Coastal Health Network",           who: "User",  time: "2 hr ago",   iconBg: "color-mix(in srgb, var(--info) 15%, var(--surface))", iconFg: "var(--info)" },
  { text: 'Knowledge base entry "SLA commitments" updated',     who: "Ravi Kapoor",  time: "5 hr ago",   iconBg: "color-mix(in srgb, var(--purp) 15%, var(--surface))", iconFg: "var(--purp)" },
];

const trendPts = [38,40,37,42,41,44,43,46,45,44,47,47];
const W = 240, H = 56, MAX = 52, MIN = 34;
const trendLine = trendPts.map((v,i) =>
  `${(i/(trendPts.length-1)*W).toFixed(1)},${(H-((v-MIN)/(MAX-MIN))*(H-8)-4).toFixed(1)}`
).join(" ");
const trendArea = `0,${H} ${trendLine} ${W},${H}`;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function sessionPct(s: RFPSession) {
  if (s.questions.length === 0) return 0;
  const answered = s.responses.filter(r => r.status === "generated" || r.status === "edited").length;
  return Math.round((answered / s.questions.length) * 100);
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<RFPSession[]>([]);

  useEffect(() => {
    // Reads client-only storage (localStorage-backed) after mount — the
    // documented exception to this rule for syncing with an external source.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(getRFPSessions());
  }, []);

  const totalRFPs = sessions.length;
  const totalQuestions = sessions.reduce((sum, s) => sum + s.questions.length, 0);
  const totalAnswered = sessions.reduce(
    (sum, s) => sum + s.responses.filter(r => r.status === "generated" || r.status === "edited").length,
    0
  );
  const unanswered = Math.max(0, totalQuestions - totalAnswered);
  const avgMinPerQ = totalAnswered > 0 ? (totalAnswered * 5 / totalAnswered).toFixed(1) : "—";

  // Live bids table: real sessions if any, otherwise show design-file placeholders
  const bidsRows = totalRFPs > 0
    ? sessions.map(s => {
        const pct = sessionPct(s);
        const pctStr = `${pct}%`;
        const pctColor = pct >= 80 ? "var(--pos)" : pct >= 40 ? "var(--accent)" : "var(--warn)";
        const deadline = s.submissionDeadline
          ? new Date(s.submissionDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—";
        return { name: s.rfpTitle || s.fileName, client: s.issuingOrganization || "—", value: "—", pct: pctStr, pctColor, due: deadline, dueNote: "", dueColor: "#1B1A17" };
      })
    : STATIC_BIDS;

  const kpis = [
    { label: "Active bids",         value: totalRFPs > 0 ? String(totalRFPs) : "6",   unit: "",      delta: "+2",        deltaColor: "var(--pos)", barPct: totalRFPs > 0 ? `${Math.min(totalRFPs * 10, 100)}%` : "60%" },
    { label: "Open value",          value: "$5.0",                                      unit: "M",     delta: "+$1.2M",    deltaColor: "var(--pos)", barPct: "74%" },
    { label: "Questions to answer", value: totalRFPs > 0 ? String(unanswered) : "31",  unit: "left",  delta: "−12 today", deltaColor: "#8A867D", barPct: totalRFPs > 0 && totalQuestions > 0 ? `${Math.round((unanswered / totalQuestions) * 100)}%` : "44%" },
    { label: "Avg draft time",      value: totalRFPs > 0 ? avgMinPerQ : "2.1",         unit: "min/Q", delta: "−68%",      deltaColor: "var(--pos)", barPct: "30%" },
  ];

  const bidsSubtitle = totalRFPs > 0
    ? `${totalRFPs} in progress · sorted by deadline`
    : "6 in progress · sorted by deadline";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Topbar */}
      <header style={{
        flexShrink: 0, height: 62,
        display: "flex", alignItems: "center", gap: 18, padding: "0 28px",
        background: "color-mix(in srgb, var(--bg) 85%, transparent)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--bd,#E5E3DC)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.01em", color: "var(--text,#1B1A17)", whiteSpace: "nowrap" }}>
            Dashboard
          </h1>
          <span style={{ fontSize: 11.5, color: "var(--faint,#8A867D)", whiteSpace: "nowrap" }}>
            {greeting()}, User — {totalRFPs > 0 ? totalRFPs : 6} bids in flight
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 420, padding: "7px 12px", background: "var(--surface,#fff)", border: "1px solid var(--bd,#E5E3DC)", borderRadius: 9, cursor: "text" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint2,#a8a499)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }} aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <input
              type="search"
              placeholder="Search questions, answers, bids…"
              style={{
                flex: 1, border: "none", background: "transparent", outline: "none",
                fontSize: 13, color: "var(--text,#1B1A17)", fontFamily: "'Geist',sans-serif",
              }}
            />
            <span style={{ flexShrink: 0, fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "var(--faint3,#bdb9ae)", border: "1px solid var(--bd,#E5E3DC)", borderRadius: 4, padding: "1px 5px" }}>⌘K</span>
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px",
              borderRadius: 9, border: `1px solid ${ACCENT}`, background: ACCENT,
              color: "#fff", fontFamily: "'Geist',sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 1px 2px color-mix(in srgb, var(--accent) 25%, transparent)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Upload RFP
          </button>
        </div>
      </header>

      {/* Scroll area */}
      <div id="main-content" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "28px 28px 60px", maxWidth: 1180, margin: "0 auto" }}>

          {/* KPI row */}
          <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            {kpis.map((k) => (
              <div key={k.label} className="glass-card" style={{ borderRadius: 12, padding: "16px 17px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint,#8A867D)" }}>{k.label}</span>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, fontWeight: 500, color: k.deltaColor }}>{k.delta}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text,#1B1A17)", lineHeight: 1 }}>{k.value}</span>
                  <span style={{ fontSize: 13, color: "var(--faint,#8A867D)" }}>{k.unit}</span>
                </div>
                <div style={{ height: 3, borderRadius: 3, background: "var(--track,#EFEDE6)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: k.barPct, background: ACCENT, borderRadius: 3, transformOrigin: "left", animation: "barGrow .6s ease-out" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }}>

            {/* Active bids table */}
            <section className="glass-card" style={{ borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--bd2,#EEECE5)" }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Newsreader',serif", fontSize: 17, fontWeight: 500, color: "var(--text,#1B1A17)" }}>Active bids</h2>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--faint,#8A867D)" }}>{bidsSubtitle}</p>
                </div>
                <button onClick={() => router.push("/history")} style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>VIEW ALL →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 58px 92px 56px", gap: 8, padding: "9px 18px", borderBottom: "1px solid var(--bd2,#EEECE5)", fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint2,#a8a499)" }}>
                <span>Bid / Client</span><span>Value</span><span>Progress</span><span style={{ textAlign: "right" }}>Due</span>
              </div>
              {bidsRows.map((b, i) => (
                <div
                  key={i}
                  onClick={() => router.push("/responses")}
                  style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 58px 92px 56px", gap: 8, padding: "13px 18px", borderBottom: "1px solid var(--bd3,#F2F0E9)", alignItems: "center", cursor: "pointer", transition: "background .12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--elev,#FBFAF7)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text,#1B1A17)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint,#8A867D)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.client}</div>
                  </div>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12.5, color: "var(--text2,#3a382f)" }}>{b.value}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 4, background: "var(--track,#EFEDE6)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: b.pct, background: b.pctColor, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--faint,#8A867D)" }}>{b.pct}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: b.dueColor }}>{b.due}</div>
                    <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "var(--faint2,#a8a499)" }}>{b.dueNote}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Win rate dark card */}
              <section style={{ background: "#0A130E", border: "1px solid #1B3325", borderRadius: 12, padding: 18, color: "#EDEDE7", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9aa39c" }}>Win rate · last 12 mo</span>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#7fd1a3" }}>▲ 8 pts</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>47%</span>
                  <span style={{ fontSize: 13, color: "#9aa39c", marginBottom: 5 }}>22 of 47 won</span>
                </div>
                <svg viewBox="0 0 240 56" preserveAspectRatio="none" style={{ width: "100%", height: 48, display: "block" }}>
                  <polyline points={trendArea} fill="rgba(127,209,163,.14)" stroke="none" />
                  <polyline points={trendLine} fill="none" stroke="#7fd1a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </section>

              {/* Deadlines */}
              <section className="glass-card" style={{ borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--bd2,#EEECE5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0, fontFamily: "'Newsreader',serif", fontSize: 15, fontWeight: 500, color: "var(--text,#1B1A17)" }}>Upcoming deadlines</h2>
                </div>
                {deadlines.map((d) => (
                  <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: "1px solid var(--bd3,#F2F0E9)" }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint2,#a8a499)" }}>{d.mon}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text,#1B1A17)", lineHeight: 1.1 }}>{d.day}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text,#1B1A17)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                      <div style={{ fontSize: 11.5, color: d.color, marginTop: 1 }}>{d.note}</div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Activity feed */}
              <section className="glass-card" style={{ borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--bd2,#EEECE5)" }}>
                  <h2 style={{ margin: 0, fontFamily: "'Newsreader',serif", fontSize: 15, fontWeight: 500, color: "var(--text,#1B1A17)" }}>Recent activity</h2>
                </div>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, padding: "11px 18px", borderBottom: "1px solid var(--bd3,#F2F0E9)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: a.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.iconFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "var(--text,#1B1A17)", lineHeight: 1.45 }}>{a.text}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--faint,#8A867D)" }}>{a.who}</span>
                        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--faint2,#a8a499)" }}>· {a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
