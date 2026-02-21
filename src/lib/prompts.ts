import { CompanyProfile, CaseStudy } from "@/types";

// ── Tone descriptions ──

export type ResponseTone = "professional" | "detailed" | "concise";

export const TONE_OPTIONS: { value: ResponseTone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Balanced, formal tone suitable for most RFP sections" },
  { value: "detailed", label: "Detailed", description: "Thorough and comprehensive with technical depth" },
  { value: "concise", label: "Concise", description: "Brief and to the point, focused on key facts" },
];

// ── Length descriptions ──

export type ResponseLength = "brief" | "standard" | "detailed";

export const LENGTH_OPTIONS: { value: ResponseLength; label: string; words: string }[] = [
  { value: "brief", label: "Brief", words: "100–200 words" },
  { value: "standard", label: "Standard", words: "200–400 words" },
  { value: "detailed", label: "Detailed", words: "400–600 words" },
];

const LENGTH_INSTRUCTIONS: Record<ResponseLength, string> = {
  brief: "Keep the response concise: 100–200 words. Focus on the single most important point with supporting evidence.",
  standard: "Write a moderately detailed response: 200–400 words. Include an introduction, 1–2 key points with evidence, and a brief closing.",
  detailed: "Write a thorough, comprehensive response: 400–600 words. Include an introduction, multiple detailed points with specific evidence, data, and a strong closing statement.",
};

const TONE_INSTRUCTIONS: Record<ResponseTone, string> = {
  professional: "Write in a professional, formal tone suitable for government and enterprise RFP submissions. Be confident but not boastful. Use industry-standard terminology.",
  detailed: "Write in a thorough, technical tone. Include specific details, metrics, certifications, and technical specifications. Show deep domain expertise.",
  concise: "Write in a direct, efficient tone. Lead with the answer, support with 1–2 key facts, and close. Eliminate filler and redundancy.",
};

// ── Profile context builder ──

function buildProfileContext(profile: CompanyProfile | null, companyName?: string): string {
  if (!profile) {
    if (companyName) {
      return `\nCOMPANY: ${companyName}\nNote: No detailed company profile is available. Write a strong response that can be customized later. Use "${companyName}" as the company name.\n`;
    }
    return "\nNote: No company profile provided. Write a strong generic response that can be customized later.\n";
  }

  const name = companyName || profile.name || "Our company";
  let ctx = `\nCOMPANY PROFILE:
- Company Name: ${name}
- Industry: ${profile.industry || "Not specified"}
- Size: ${profile.size || "Not specified"}
- Description: ${profile.description || "Not specified"}`;

  if (profile.certifications?.length) {
    ctx += `\n- Certifications: ${profile.certifications.join(", ")}`;
  }
  if (profile.technologies?.length) {
    ctx += `\n- Technologies: ${profile.technologies.join(", ")}`;
  }
  if (profile.caseStudies?.length) {
    ctx += `\n- Past Projects:`;
    profile.caseStudies.forEach((cs: CaseStudy) => {
      ctx += `\n  * ${cs.title} (Client: ${cs.client}): ${cs.description}. Outcome: ${cs.outcome}`;
    });
  }

  return ctx + "\n";
}

// ── Knowledge base context builder ──

interface KBSource {
  title: string;
  content: string;
  similarity?: number;
}

function buildKBContext(sources: KBSource[]): string {
  if (!sources.length) return "";

  return `\nKNOWLEDGE BASE REFERENCES (ordered by relevance — use these to build your response):
${sources
  .map(
    (kb, i) =>
      `[KB-${i + 1}] ${kb.title}${kb.similarity ? ` (${Math.round(kb.similarity * 100)}% relevance)` : ""}:
${kb.content}`
  )
  .join("\n\n")}

IMPORTANT: When referencing information from these knowledge base entries, naturally incorporate the facts, metrics, and specifics. Do NOT say "according to our knowledge base" — instead, state the information as your company's own capabilities and experience.
`;
}

// ── Main prompt builder ──

export interface PromptConfig {
  questionText: string;
  questionCategory: string;
  companyProfile: CompanyProfile | null;
  companyName?: string;
  kbSources: KBSource[];
  tone: ResponseTone;
  length: ResponseLength;
}

export function buildSystemPrompt(config: PromptConfig): string {
  const { companyProfile, companyName, kbSources, tone, length } = config;

  const profileCtx = buildProfileContext(companyProfile, companyName);
  const kbCtx = buildKBContext(kbSources);

  return `You are an expert RFP response writer with 15+ years of experience helping companies win government and enterprise contracts. You write professional, compelling, and technically accurate responses.

${profileCtx}
${kbCtx}

TONE: ${TONE_INSTRUCTIONS[tone]}

LENGTH: ${LENGTH_INSTRUCTIONS[length]}

RESPONSE GUIDELINES:
1. Lead with a direct answer to the question — don't start with "We" or a generic opener every time. Vary your opening.
2. Reference specific capabilities, certifications, metrics, and past projects from the company profile and knowledge base when relevant.
3. Use concrete numbers, percentages, and timeframes rather than vague statements.
4. If the question asks about experience, cite specific project examples with client names and outcomes.
5. For technical questions, demonstrate depth of knowledge with specific technologies, standards, and methodologies.
6. For compliance questions, reference specific certifications, frameworks, and audit results.
7. End with a forward-looking statement or value proposition when appropriate.
8. Never fabricate certifications, client names, or metrics that aren't in the provided context.
9. If you lack sufficient context to answer confidently, still write the best response possible but set the confidence score lower.

CONFIDENCE SCORING:
- 85-100%: Strong match — multiple relevant KB sources, specific company data available
- 60-84%: Moderate match — some relevant context, may need human review for specifics
- 30-59%: Low match — limited context available, response is mostly generic
- 0-29%: Very low — no relevant context, response needs significant human editing

Respond ONLY with valid JSON in this exact format:
{
  "response": "The full response text",
  "tone": "${tone}",
  "confidence": 85,
  "reasoning": "Brief explanation of confidence score (1 sentence)"
}`;
}

export function buildUserMessage(questionText: string, questionCategory: string): string {
  return `RFP Question Category: ${questionCategory}\n\nQuestion: ${questionText}`;
}
