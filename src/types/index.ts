export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  size: string;
  description: string;
  certifications: string[];
  technologies: string[];
  caseStudies: CaseStudy[];
  updatedAt: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  description: string;
  outcome: string;
}

export type QuestionStatus = "pending" | "in-progress" | "complete";

export interface RFPQuestion {
  id: string;
  text: string;
  category: string;
  mandatory: boolean;
  confidence: number;
  section: string;
  status: QuestionStatus;
  order: number;
}

export interface RFPProject {
  id: string;
  name: string;
  uploadDate: string;
  fileName: string;
  questions: RFPQuestion[];
  status: "parsing" | "review" | "responding" | "complete";
}

export interface ResponseSource {
  title: string;
  similarity?: number | null;
}

export interface GeneratedResponse {
  questionId: string;
  draft: string;
  tone: string;
  status: "pending" | "generating" | "generated" | "edited";
  editedContent: string;
  editedHtml?: string; // Rich text HTML from TipTap editor
  rating: "up" | "down" | null;
  confidence: number;
  reasoning?: string;
  wordCount?: number;
  sourcesUsed?: ResponseSource[];
  generatedAt?: string;
}

// ── Review / Feedback types ──

export type ReviewStatus = "pending" | "in-progress" | "complete" | "needs-revision";

export interface ResponseFeedback {
  questionId: string;
  sessionId: string;
  starRating: number | null; // 1–5
  helpful: boolean | null;
  feedbackText: string;
  editDistance: number; // 0–100 % of text that changed
  originalResponse: string; // the original AI draft (plain text)
  editedResponse: string; // the saved edited content (plain text)
  editedHtml: string; // the saved edited content (HTML from TipTap)
  reviewStatus: ReviewStatus;
  updatedAt: string;
}

export interface RFPSession {
  id: string;
  fileName: string;
  rfpTitle: string;
  issuingOrganization: string;
  submissionDeadline: string | null;
  questions: RFPQuestion[];
  responses: GeneratedResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  embedding?: number[] | null;
  similarity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}
