import { CompanyProfile, RFPSession, GeneratedResponse, KnowledgeBaseEntry, ResponseFeedback, ReviewStatus } from "@/types";
import sampleKBData from "@/data/sampleKnowledgeBase.json";

const KEYS = {
  COMPANY_PROFILE: "bidcraft_company_profile",
  RFP_SESSIONS: "bidcraft_rfp_sessions",
  KNOWLEDGE_BASE: "bidcraft_knowledge_base",
  KB_INITIALIZED: "bidcraft_kb_initialized",
  REVIEW_FEEDBACK: "bidcraft_review_feedback",
} as const;

export function saveCompanyProfile(profile: CompanyProfile): void {
  localStorage.setItem(KEYS.COMPANY_PROFILE, JSON.stringify(profile));
}

export function getCompanyProfile(): CompanyProfile | null {
  const data = localStorage.getItem(KEYS.COMPANY_PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveRFPSession(session: RFPSession): void {
  const sessions = getRFPSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(KEYS.RFP_SESSIONS, JSON.stringify(sessions));
}

export function getRFPSessions(): RFPSession[] {
  const data = localStorage.getItem(KEYS.RFP_SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function getLatestRFPSession(): RFPSession | null {
  const sessions = getRFPSessions();
  return sessions.length > 0 ? sessions[0] : null;
}

export function saveGeneratedResponses(
  sessionId: string,
  responses: GeneratedResponse[]
): void {
  const sessions = getRFPSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.responses = responses;
    session.updatedAt = new Date().toISOString();
    localStorage.setItem(KEYS.RFP_SESSIONS, JSON.stringify(sessions));
  }
}

export function getGeneratedResponses(
  sessionId: string
): GeneratedResponse[] {
  const sessions = getRFPSessions();
  const session = sessions.find((s) => s.id === sessionId);
  return session?.responses || [];
}

export function deleteRFPSession(sessionId: string): void {
  const sessions = getRFPSessions().filter((s) => s.id !== sessionId);
  localStorage.setItem(KEYS.RFP_SESSIONS, JSON.stringify(sessions));
}

export function clearAllSessions(): void {
  localStorage.setItem(KEYS.RFP_SESSIONS, JSON.stringify([]));
}

export function getRFPSessionById(sessionId: string): RFPSession | null {
  const sessions = getRFPSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

// Knowledge Base
function initKBIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.KB_INITIALIZED)) {
    localStorage.setItem(KEYS.KNOWLEDGE_BASE, JSON.stringify(sampleKBData));
    localStorage.setItem(KEYS.KB_INITIALIZED, "true");
  }
}

export function getKnowledgeBase(): KnowledgeBaseEntry[] {
  initKBIfNeeded();
  const data = localStorage.getItem(KEYS.KNOWLEDGE_BASE);
  return data ? JSON.parse(data) : [];
}

export function saveKnowledgeBaseEntry(entry: KnowledgeBaseEntry): void {
  const entries = getKnowledgeBase();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    entries.push(entry);
  }
  localStorage.setItem(KEYS.KNOWLEDGE_BASE, JSON.stringify(entries));
}

export function deleteKnowledgeBaseEntry(id: string): void {
  const entries = getKnowledgeBase().filter((e) => e.id !== id);
  localStorage.setItem(KEYS.KNOWLEDGE_BASE, JSON.stringify(entries));
}

export function searchKnowledgeBase(query: string, category?: string): KnowledgeBaseEntry[] {
  const entries = getKnowledgeBase();
  const lower = query.toLowerCase();
  return entries.filter((e) => {
    const matchesCategory = !category || category === "All" || e.category === category;
    const matchesQuery =
      !query ||
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower));
    return matchesCategory && matchesQuery;
  });
}

// ── Review Feedback ──

/** All feedback across all sessions. Key format: "${sessionId}:${questionId}" */
function getAllFeedbackRaw(): Record<string, ResponseFeedback> {
  const data = localStorage.getItem(KEYS.REVIEW_FEEDBACK);
  return data ? JSON.parse(data) : {};
}

/** Save or update feedback for a single question. */
export function saveFeedback(feedback: ResponseFeedback): void {
  const all = getAllFeedbackRaw();
  const key = `${feedback.sessionId}:${feedback.questionId}`;
  all[key] = { ...feedback, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.REVIEW_FEEDBACK, JSON.stringify(all));
}

/**
 * Get all feedback for a session.
 * Returns a map of questionId → ResponseFeedback.
 */
export function getFeedbackForSession(sessionId: string): Record<string, ResponseFeedback> {
  const all = getAllFeedbackRaw();
  const result: Record<string, ResponseFeedback> = {};
  for (const [key, fb] of Object.entries(all)) {
    if (key.startsWith(`${sessionId}:`)) {
      const questionId = key.slice(sessionId.length + 1);
      result[questionId] = fb;
    }
  }
  return result;
}

/** Get feedback for a single question. */
export function getFeedbackItem(sessionId: string, questionId: string): ResponseFeedback | null {
  const all = getAllFeedbackRaw();
  return all[`${sessionId}:${questionId}`] ?? null;
}

const BLANK_FEEDBACK = (sessionId: string, questionId: string): ResponseFeedback => ({
  questionId,
  sessionId,
  starRating: null,
  helpful: null,
  feedbackText: "",
  editDistance: 0,
  originalResponse: "",
  editedResponse: "",
  editedHtml: "",
  reviewStatus: "pending",
  updatedAt: new Date().toISOString(),
});

/** Update only the review status for a question (upserts if no feedback exists yet). */
export function updateReviewStatus(
  sessionId: string,
  questionId: string,
  status: ReviewStatus
): void {
  const all = getAllFeedbackRaw();
  const key = `${sessionId}:${questionId}`;
  all[key] = {
    ...BLANK_FEEDBACK(sessionId, questionId),
    ...(all[key] ?? {}),
    reviewStatus: status,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.REVIEW_FEEDBACK, JSON.stringify(all));
}

/** Bulk-update review status for all questions in a session. */
export function bulkUpdateReviewStatus(
  sessionId: string,
  questionIds: string[],
  status: ReviewStatus
): void {
  const all = getAllFeedbackRaw();
  for (const questionId of questionIds) {
    const key = `${sessionId}:${questionId}`;
    all[key] = {
      ...BLANK_FEEDBACK(sessionId, questionId),
      ...(all[key] ?? {}),
      reviewStatus: status,
      updatedAt: new Date().toISOString(),
    };
  }
  localStorage.setItem(KEYS.REVIEW_FEEDBACK, JSON.stringify(all));
}
