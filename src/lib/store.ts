import { create } from "zustand";
import { CompanyProfile, RFPQuestion, GeneratedResponse, RFPSession } from "@/types";

interface BidCraftState {
  // Company profile
  companyProfile: CompanyProfile | null;
  setCompanyProfile: (profile: CompanyProfile | null) => void;

  // Parsed questions
  parsedQuestions: RFPQuestion[];
  setParsedQuestions: (questions: RFPQuestion[]) => void;

  // Generated responses
  generatedResponses: GeneratedResponse[];
  setGeneratedResponses: (responses: GeneratedResponse[]) => void;
  updateResponse: (questionId: string, updates: Partial<GeneratedResponse>) => void;

  // Active session
  activeSession: RFPSession | null;
  setActiveSession: (session: RFPSession | null) => void;

  // UI state
  selectedQuestionId: string | null;
  setSelectedQuestionId: (id: string | null) => void;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
}

export const useBidCraftStore = create<BidCraftState>((set) => ({
  companyProfile: null,
  setCompanyProfile: (profile) => set({ companyProfile: profile }),

  parsedQuestions: [],
  setParsedQuestions: (questions) => set({ parsedQuestions: questions }),

  generatedResponses: [],
  setGeneratedResponses: (responses) => set({ generatedResponses: responses }),
  updateResponse: (questionId, updates) =>
    set((state) => ({
      generatedResponses: state.generatedResponses.map((r) =>
        r.questionId === questionId ? { ...r, ...updates } : r
      ),
    })),

  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  selectedQuestionId: null,
  setSelectedQuestionId: (id) => set({ selectedQuestionId: id }),
  isGenerating: false,
  setIsGenerating: (loading) => set({ isGenerating: loading }),
}));
