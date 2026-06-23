declare module "@/types" {
  export interface RFPQuestion {
    id: string;
    text: string;
    category: string;
    mandatory?: boolean;
    confidence?: number;
    section?: string;
    [k: string]: unknown;
  }
  export interface GeneratedResponse {
    questionId?: string;
    status?: string;
    draft?: string;
    editedContent?: string;
    editedHtml?: string | null;
    confidence?: number;
    sourcesUsed?: { title: string }[];
    tone?: string;
  }
  export interface ResponseFeedback {
    rating?: number;
    [k: string]: unknown;
  }
  export interface KnowledgeBaseEntry {
    id: string;
    title: string;
    category: string;
    content: string;
    tags: string[];
    [k: string]: unknown;
  }
  export interface RFPSession { [k: string]: unknown }
  export interface CompanyProfile { [k: string]: unknown }
}
