export interface Database {
  public: {
    Tables: {
      knowledge_base: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          tags: string[];
          source_rfp: string | null;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string;
          content: string;
          tags?: string[];
          source_rfp?: string | null;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          content?: string;
          tags?: string[];
          source_rfp?: string | null;
          embedding?: number[] | null;
          updated_at?: string;
        };
      };
      rfp_projects: {
        Row: {
          id: string;
          name: string;
          file_name: string | null;
          rfp_title: string | null;
          issuing_organization: string | null;
          submission_deadline: string | null;
          questions: unknown;
          status: string;
          question_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_name?: string | null;
          rfp_title?: string | null;
          issuing_organization?: string | null;
          submission_deadline?: string | null;
          questions?: unknown;
          status?: string;
          question_count?: number;
        };
        Update: {
          name?: string;
          file_name?: string | null;
          rfp_title?: string | null;
          issuing_organization?: string | null;
          submission_deadline?: string | null;
          questions?: unknown;
          status?: string;
          question_count?: number;
          updated_at?: string;
        };
      };
      generated_responses: {
        Row: {
          id: string;
          project_id: string | null;
          question_id: string;
          draft: string | null;
          tone: string;
          status: string;
          edited_content: string | null;
          rating: string | null;
          confidence: number;
          sources_used: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          question_id: string;
          draft?: string | null;
          tone?: string;
          status?: string;
          edited_content?: string | null;
          rating?: string | null;
          confidence?: number;
          sources_used?: unknown;
        };
        Update: {
          draft?: string | null;
          tone?: string;
          status?: string;
          edited_content?: string | null;
          rating?: string | null;
          confidence?: number;
          sources_used?: unknown;
          updated_at?: string;
        };
      };
    };
    Functions: {
      match_knowledge_base: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          filter_category?: string | null;
        };
        Returns: {
          id: string;
          title: string;
          category: string;
          content: string;
          tags: string[];
          similarity: number;
        }[];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
  };
}
