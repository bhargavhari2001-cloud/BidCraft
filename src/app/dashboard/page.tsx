"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RFPSession } from "@/types";
import { getRFPSessions, getCompanyProfile } from "@/lib/storage";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";

interface CategoryStat {
  category: string;
  count: number;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<RFPSession[]>([]);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setSessions(getRFPSessions());
    setHasProfile(!!getCompanyProfile());
  }, []);

  // Compute stats
  const totalRFPs = sessions.length;
  const totalQuestions = sessions.reduce((sum, s) => sum + s.questions.length, 0);
  const totalAnswered = sessions.reduce(
    (sum, s) =>
      sum + s.responses.filter((r) => r.status === "generated" || r.status === "edited").length,
    0
  );
  const totalEdited = sessions.reduce(
    (sum, s) => sum + s.responses.filter((r) => r.status === "edited").length,
    0
  );

  const allResponses = sessions.flatMap((s) => s.responses).filter((r) => r.status === "generated" || r.status === "edited");
  const avgConfidence =
    allResponses.length > 0
      ? Math.round(allResponses.reduce((sum, r) => sum + r.confidence, 0) / allResponses.length)
      : 0;

  const timeSavedMinutes = totalAnswered * 5;
  const timeSavedDisplay =
    timeSavedMinutes >= 60
      ? `${(timeSavedMinutes / 60).toFixed(1)} hrs`
      : `${timeSavedMinutes} min`;

  // Category breakdown
  const catCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    s.questions.forEach((q) => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    });
  });

  const catColors: Record<string, string> = {
    Technical: "bg-violet-500",
    "Security & Compliance": "bg-red-500",
    "Experience & References": "bg-cyan-500",
    Staffing: "bg-amber-500",
    Methodology: "bg-emerald-500",
    Pricing: "bg-pink-500",
    General: "bg-white/40",
  };

  const categoryStats: CategoryStat[] = Object.entries(catCounts)
    .map(([category, count]) => ({
      category,
      count,
      color: catColors[category] || "bg-white/20",
    }))
    .sort((a, b) => b.count - a.count);

  const maxCatCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to BidCraft
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-white/40 text-sm">
            Overview of your RFP automation activity
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: "RFPs Processed", value: totalRFPs, icon: FileText, gradient: "from-violet-400 to-violet-600" },
            { label: "Questions Analyzed", value: totalQuestions, icon: MessageSquare, gradient: "from-cyan-400 to-cyan-600" },
            { label: "Responses Generated", value: totalAnswered, icon: Zap, gradient: "from-emerald-400 to-emerald-600" },
            { label: "Manually Edited", value: totalEdited, icon: Target, gradient: "from-amber-400 to-amber-600" },
            { label: "Avg Confidence", value: `${avgConfidence}%`, icon: TrendingUp, gradient: "from-pink-400 to-pink-600" },
            { label: "Time Saved", value: timeSavedDisplay, icon: Clock, gradient: "from-indigo-400 to-indigo-600" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors"
            >
              <metric.icon className="w-4 h-4 text-white/20 mb-3" />
              <div
                className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b ${metric.gradient}`}
              >
                {metric.value}
              </div>
              <div className="text-xs text-white/30 mt-1">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-white/30" />
              <h2 className="text-sm font-semibold">Questions by Category</h2>
            </div>
            {categoryStats.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-8">
                No data yet. Upload an RFP to see analytics.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((stat) => (
                  <div key={stat.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/50">{stat.category}</span>
                      <span className="text-white/30">{stat.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stat.color} transition-all duration-500`}
                        style={{ width: `${(stat.count / maxCatCount) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-white/30" />
              <h2 className="text-sm font-semibold">Recent Activity</h2>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-white/20 mb-4">No activity yet</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-xs font-medium transition-colors"
                >
                  Upload Your First RFP
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => {
                  const answered = session.responses.filter(
                    (r) => r.status === "generated" || r.status === "edited"
                  ).length;
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => router.push("/history")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {session.rfpTitle || session.fileName}
                        </p>
                        <p className="text-xs text-white/20">
                          {answered}/{session.questions.length} answered &middot;{" "}
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold mb-4 text-white/50">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left"
            >
              <FileText className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-sm font-medium">Upload RFP</p>
                <p className="text-xs text-white/30">Parse a new document</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left"
            >
              <Target className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-medium">
                  {hasProfile ? "Edit Profile" : "Set Up Profile"}
                </p>
                <p className="text-xs text-white/30">Company information</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/knowledge-base")}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium">Knowledge Base</p>
                <p className="text-xs text-white/30">Manage response library</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/[0.04] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-white/20">&copy; 2026 BidCraft. Built with AI.</span>
          <span className="text-xs text-white/20">A portfolio project by Bhargav Hari</span>
        </div>
      </footer>
    </div>
  );
}
