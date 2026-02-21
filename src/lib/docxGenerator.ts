import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
  LevelFormat,
} from "docx";
import { RFPQuestion, GeneratedResponse, ResponseFeedback } from "@/types";

// ── Document constants ─────────────────────────────────────────────────────

const FONT = "Arial";
const MARGIN = 1440; // 1 inch in twips

/** half-points (2 half-pt = 1 pt) */
const sz = {
  h1: 36,    // 18 pt — section heading
  h2: 28,    // 14 pt — question heading
  body: 22,  // 11 pt
  meta: 18,  // 9 pt
  footer: 16, // 8 pt
};

const COLOR = {
  black: "1F1F1F",
  gray: "888888",
  lightGray: "BBBBBB",
  violet: "7C3AED",
  red: "CC0000",
  border: "E0E0E0",
};

// ── Export options ─────────────────────────────────────────────────────────

export interface ExportOptions {
  rfpTitle: string;
  issuingOrganization?: string;
  submissionDeadline?: string | null;
  questions: RFPQuestion[];
  responses: Record<string, GeneratedResponse>;
  feedbackMap?: Record<string, ResponseFeedback>;
  companyName?: string;
  rfpReferenceNumber?: string;
  includeTableOfContents?: boolean;
  includeOnlyCompleted?: boolean;
  includeConfidenceScores?: boolean;
  includeSourceReferences?: boolean;
}

// ── Numbering configuration (bullet + ordered lists) ──────────────────────

const NUMBERING_CONFIG = [
  {
    reference: "bullet-list",
    levels: [
      {
        level: 0,
        format: LevelFormat.BULLET,
        text: "\u2022",
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 720, hanging: 360 } },
          run: { font: FONT, size: sz.body },
        },
      },
    ],
  },
  {
    reference: "ordered-list",
    levels: [
      {
        level: 0,
        format: LevelFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 720, hanging: 360 } },
          run: { font: FONT, size: sz.body },
        },
      },
    ],
  },
];

// ── HTML → docx paragraph parser ──────────────────────────────────────────

interface RunStyle {
  font: string;
  size: number;
  bold?: boolean;
  italics?: boolean;
  underline?: object;
  color?: string;
}

/**
 * Recursively converts a DOM node's inline content into TextRun[].
 * Handles <strong>, <b>, <em>, <i>, <u>, <br>.
 */
function buildRuns(node: Node, style: RunStyle): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) return [];
    return [new TextRun({ ...style, text })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return [new TextRun({ ...style, break: 1 })];

  const s: RunStyle = { ...style };
  if (tag === "strong" || tag === "b") s.bold = true;
  if (tag === "em" || tag === "i") s.italics = true;
  if (tag === "u") s.underline = {};
  if (tag === "code") {
    s.font = "Courier New";
    s.color = COLOR.violet;
  }

  // Inline elements — recurse
  const inline = ["span", "a", "strong", "b", "em", "i", "u", "code", "s", "del", "mark"];
  if (inline.includes(tag)) {
    return [...el.childNodes].flatMap((c) => buildRuns(c, s));
  }

  // Fallback for unexpected block elements embedded inline
  const text = el.textContent ?? "";
  return text ? [new TextRun({ ...s, text })] : [];
}

/**
 * Parses an HTML string (from TipTap) into an array of docx Paragraphs.
 * Falls back to plain-text parsing if DOMParser is unavailable (SSR).
 */
function htmlToDocxParagraphs(html: string, base: RunStyle): Paragraph[] {
  if (!html?.trim()) return [];

  // ── SSR / non-browser fallback ──
  if (typeof window === "undefined" || !("DOMParser" in window)) {
    const plain = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
    return plainTextToDocxParagraphs(plain, base);
  }

  // ── Plain text (no tags) ──
  if (!html.includes("<")) {
    return plainTextToDocxParagraphs(html, base);
  }

  // ── Full HTML parse ──
  const dom = new DOMParser().parseFromString(html, "text/html");
  const paras: Paragraph[] = [];

  function process(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text) {
        paras.push(new Paragraph({ children: [new TextRun({ ...base, text })], spacing: { after: 120 } }));
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case "p": {
        const runs = [...el.childNodes].flatMap((c) => buildRuns(c, base));
        paras.push(
          new Paragraph({
            children: runs.length ? runs : [new TextRun({ ...base, text: "" })],
            spacing: { after: 120 },
          })
        );
        break;
      }

      case "h1":
        paras.push(
          new Paragraph({
            children: [new TextRun({ ...base, text: el.textContent ?? "", bold: true, size: sz.h1 })],
            spacing: { before: 280, after: 140 },
          })
        );
        break;

      case "h2":
      case "h3":
        paras.push(
          new Paragraph({
            children: [new TextRun({ ...base, text: el.textContent ?? "", bold: true, size: sz.h2 })],
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case "ul":
        [...el.querySelectorAll(":scope > li")].forEach((li) => {
          const runs = [...li.childNodes].flatMap((c) => buildRuns(c, base));
          paras.push(
            new Paragraph({
              children: runs.length ? runs : [new TextRun({ ...base, text: li.textContent ?? "" })],
              numbering: { reference: "bullet-list", level: 0 },
              spacing: { after: 80 },
            })
          );
        });
        break;

      case "ol":
        [...el.querySelectorAll(":scope > li")].forEach((li) => {
          const runs = [...li.childNodes].flatMap((c) => buildRuns(c, base));
          paras.push(
            new Paragraph({
              children: runs.length ? runs : [new TextRun({ ...base, text: li.textContent ?? "" })],
              numbering: { reference: "ordered-list", level: 0 },
              spacing: { after: 80 },
            })
          );
        });
        break;

      case "blockquote": {
        const runs = [...el.childNodes].flatMap((c) =>
          buildRuns(c, { ...base, italics: true, color: COLOR.gray })
        );
        paras.push(
          new Paragraph({ children: runs, indent: { left: 720 }, spacing: { after: 120 } })
        );
        break;
      }

      case "hr":
        paras.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.border } },
            spacing: { after: 200 },
          })
        );
        break;

      // Skip head/script/style
      case "head":
      case "script":
      case "style":
        break;

      default:
        [...el.childNodes].forEach(process);
    }
  }

  [...dom.body.childNodes].forEach(process);

  return paras.length > 0 ? paras : [new Paragraph({ children: [new TextRun({ ...base, text: "" })] })];
}

/** Converts plain text (newline-delimited) to Paragraph[]. */
function plainTextToDocxParagraphs(text: string, base: RunStyle): Paragraph[] {
  if (!text.trim()) return [];
  const blocks = text.split(/\n\n+/);
  return blocks.flatMap((block) => {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length === 0) return [];
    const runs: TextRun[] = lines.flatMap((line, i) => [
      ...(i > 0 ? [new TextRun({ ...base, break: 1 })] : []),
      new TextRun({ ...base, text: line }),
    ]);
    return [new Paragraph({ children: runs, spacing: { after: 120 } })];
  });
}

/** Gets the best available response text (HTML preferred, then plain text). */
function getResponseContent(response: GeneratedResponse | undefined): {
  html: string | null;
  plain: string;
} {
  if (!response) return { html: null, plain: "" };
  const plain = response.editedContent || response.draft || "";
  const html = response.editedHtml || null;
  return { html, plain };
}

// ── Page footer ────────────────────────────────────────────────────────────

function createPageFooter(companyName: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "CONFIDENTIAL", size: sz.footer, font: FONT, color: COLOR.red, bold: true }),
          new TextRun({ text: "   \u2022   ", size: sz.footer, font: FONT, color: COLOR.lightGray }),
          new TextRun({ text: "Page ", size: sz.footer, font: FONT, color: COLOR.gray }),
          new TextRun({ children: [PageNumber.CURRENT], size: sz.footer, font: FONT, color: COLOR.gray }),
          new TextRun({ text: " of ", size: sz.footer, font: FONT, color: COLOR.gray }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: sz.footer, font: FONT, color: COLOR.gray }),
          ...(companyName
            ? [
                new TextRun({ text: "   \u2022   ", size: sz.footer, font: FONT, color: COLOR.lightGray }),
                new TextRun({ text: companyName, size: sz.footer, font: FONT, color: COLOR.gray }),
              ]
            : []),
        ],
      }),
    ],
  });
}

// ── Divider helper ─────────────────────────────────────────────────────────

function divider(color = COLOR.border, after = 240): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color } },
    spacing: { after },
  });
}

function spacer(before = 0, after = 200): Paragraph {
  return new Paragraph({ spacing: { before, after } });
}

// ── Cover page ─────────────────────────────────────────────────────────────

function buildCoverPage(opts: ExportOptions, company: string): Paragraph[] {
  const paras: Paragraph[] = [];

  // Top spacer
  paras.push(spacer(0, 600));

  // CONFIDENTIAL badge
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "CONFIDENTIAL",
          font: FONT,
          size: 20,
          bold: true,
          color: COLOR.red,
        }),
      ],
      spacing: { after: 600 },
    })
  );

  // Company name
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: company, font: FONT, bold: true, size: 40, color: COLOR.violet }),
      ],
      spacing: { after: 120 },
    })
  );

  // "Response to"
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Response to", font: FONT, size: 22, italics: true, color: COLOR.gray })],
      spacing: { after: 100 },
    })
  );

  // RFP Title
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: opts.rfpTitle || "Request for Proposal", font: FONT, bold: true, size: 44 }),
      ],
      spacing: { after: 200 },
    })
  );

  // Metadata rows
  const metaPairs: [string, string][] = [
    ...(opts.issuingOrganization ? [["Issued by", opts.issuingOrganization] as [string, string]] : []),
    ...(opts.rfpReferenceNumber ? [["Reference", opts.rfpReferenceNumber] as [string, string]] : []),
    ...(opts.submissionDeadline ? [["Submission Deadline", opts.submissionDeadline] as [string, string]] : []),
    [
      "Date Prepared",
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    ],
  ];

  metaPairs.forEach(([label, value]) => {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${label}: `, font: FONT, size: sz.body, color: COLOR.gray }),
          new TextRun({ text: value, font: FONT, size: sz.body, bold: true }),
        ],
        spacing: { after: 100 },
      })
    );
  });

  // Divider
  paras.push(spacer(200, 0), divider("AAAAAA", 400));

  // Confidential notice
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:
            "This document contains confidential and proprietary information of " +
            company +
            ". It is intended solely for the named recipient for the purpose of evaluating " +
            "the referenced Request for Proposal. Any reproduction, disclosure, or distribution " +
            "without the express written consent of " +
            company +
            " is strictly prohibited.",
          font: FONT,
          size: sz.meta,
          italics: true,
          color: COLOR.gray,
        }),
      ],
      spacing: { before: 0, after: 200 },
    })
  );

  // BidCraft attribution
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Generated by BidCraft — AI-Powered RFP Automation",
          font: FONT,
          size: sz.meta,
          italics: true,
          color: COLOR.lightGray,
        }),
      ],
      spacing: { before: 800 },
    })
  );

  return paras;
}

// ── Table of Contents placeholder ──────────────────────────────────────────

function buildTocPlaceholder(): Paragraph[] {
  return [
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "[ To generate the Table of Contents: open this document in Microsoft Word, " +
            "right-click this text, and select \u201cUpdate Field\u201d. " +
            "Alternatively, use the References tab \u2192 Table of Contents. ]",
          font: FONT,
          size: sz.meta,
          italics: true,
          color: COLOR.gray,
        }),
      ],
      spacing: { after: 120 },
    }),
    divider(COLOR.border, 400),
  ];
}

// ── Executive Summary ──────────────────────────────────────────────────────

function buildExecutiveSummary(
  opts: ExportOptions,
  filteredQuestions: RFPQuestion[],
  company: string
): Paragraph[] {
  const { rfpTitle, issuingOrganization, responses } = opts;

  const answered = filteredQuestions.filter((q) => {
    const r = responses[q.id];
    return r && (r.status === "generated" || r.status === "edited" || r.editedContent || r.draft);
  }).length;

  const categories = [...new Set(filteredQuestions.map((q) => q.category))];

  const confidences = filteredQuestions
    .map((q) => responses[q.id]?.confidence)
    .filter((c): c is number => typeof c === "number" && c > 0);
  const avgConf =
    confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  const paras: Paragraph[] = [
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
    }),

    // Overview paragraph
    new Paragraph({
      children: [
        new TextRun({
          text:
            `${company} is pleased to submit this comprehensive response to the Request for Proposal titled `,
          font: FONT,
          size: sz.body,
        }),
        new TextRun({ text: rfpTitle || "the referenced RFP", font: FONT, size: sz.body, bold: true }),
        ...(issuingOrganization
          ? [
              new TextRun({ text: ", issued by ", font: FONT, size: sz.body }),
              new TextRun({ text: issuingOrganization, font: FONT, size: sz.body, bold: true }),
            ]
          : []),
        new TextRun({
          text:
            `. This response document addresses ${answered} of ${filteredQuestions.length} ` +
            `questions across ${categories.length} categor${categories.length !== 1 ? "ies" : "y"}.`,
          font: FONT,
          size: sz.body,
        }),
      ],
      spacing: { after: 200 },
    }),

    // Stats
    new Paragraph({
      children: [new TextRun({ text: "Response Summary", font: FONT, size: sz.body, bold: true })],
      spacing: { after: 100 },
    }),
  ];

  // Stat bullet rows
  const stats: [string, string][] = [
    ["Total Questions", String(filteredQuestions.length)],
    ["Questions Addressed", `${answered} (${filteredQuestions.length > 0 ? Math.round((answered / filteredQuestions.length) * 100) : 0}%)`],
    ["Categories Covered", categories.join(", ") || "N/A"],
    ...(avgConf > 0 ? [["Average AI Confidence", `${avgConf}%`] as [string, string]] : []),
  ];

  stats.forEach(([label, value]) => {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, font: FONT, size: sz.body, bold: true }),
          new TextRun({ text: value, font: FONT, size: sz.body }),
        ],
        bullet: { level: 0 },
        spacing: { after: 60 },
      })
    );
  });

  paras.push(divider(COLOR.border, 400));

  return paras;
}

// ── Category sections ──────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  "Technical",
  "Security & Compliance",
  "Experience & References",
  "Staffing",
  "Methodology",
  "Pricing",
  "General",
];

function buildCategorySection(
  category: string,
  sectionNumber: number,
  questions: RFPQuestion[],
  responses: Record<string, GeneratedResponse>,
  opts: ExportOptions
): Paragraph[] {
  const { includeConfidenceScores, includeSourceReferences } = opts;
  const base: RunStyle = { font: FONT, size: sz.body };
  const paras: Paragraph[] = [];

  // Category heading (H1) with page break before each section
  paras.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: sectionNumber > 1, // page break before 2nd+ sections
      spacing: { before: sectionNumber > 1 ? 0 : 0, after: 200 },
      children: [
        new TextRun({
          text: `${sectionNumber}. ${category}`,
          font: FONT,
          bold: true,
          size: sz.h1,
        }),
      ],
    })
  );

  questions.forEach((q) => {
    const response = responses[q.id];
    const { html, plain } = getResponseContent(response);

    // Question heading (H2)
    paras.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [
          new TextRun({
            text: `${q.id}. ${q.text}`,
            font: FONT,
            bold: true,
            size: sz.h2,
          }),
        ],
      })
    );

    // Metadata row (mandatory + confidence)
    if (includeConfidenceScores || q.mandatory) {
      const metaParts: TextRun[] = [];

      if (q.mandatory) {
        metaParts.push(
          new TextRun({ text: "Mandatory", font: FONT, size: sz.meta, bold: true, color: COLOR.red })
        );
      } else {
        metaParts.push(
          new TextRun({ text: "Optional", font: FONT, size: sz.meta, italics: true, color: COLOR.gray })
        );
      }

      if (includeConfidenceScores && response?.confidence) {
        metaParts.push(
          new TextRun({ text: "   |   ", font: FONT, size: sz.meta, color: COLOR.lightGray }),
          new TextRun({
            text: `AI Confidence: ${response.confidence}%`,
            font: FONT,
            size: sz.meta,
            italics: true,
            color: response.confidence >= 85 ? "16A34A" : response.confidence >= 60 ? "D97706" : COLOR.red,
          })
        );
      }

      if (response?.tone) {
        metaParts.push(
          new TextRun({ text: "   |   ", font: FONT, size: sz.meta, color: COLOR.lightGray }),
          new TextRun({
            text: `Tone: ${response.tone}`,
            font: FONT,
            size: sz.meta,
            italics: true,
            color: COLOR.gray,
          })
        );
      }

      paras.push(new Paragraph({ children: metaParts, spacing: { after: 120 } }));
    }

    // Response body
    if (html) {
      paras.push(...htmlToDocxParagraphs(html, base));
    } else if (plain) {
      paras.push(...plainTextToDocxParagraphs(plain, base));
    } else {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "[Response pending — to be completed before submission]",
              font: FONT,
              size: sz.body,
              italics: true,
              color: COLOR.gray,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    // Source references (optional)
    if (includeSourceReferences && response?.sourcesUsed && response.sourcesUsed.length > 0) {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Knowledge Base Sources: ${response.sourcesUsed.map((s) => s.title).join(", ")}`,
              font: FONT,
              size: sz.meta,
              italics: true,
              color: COLOR.gray,
            }),
          ],
          spacing: { before: 80, after: 80 },
        })
      );
    }

    // Question divider
    paras.push(divider(COLOR.border, 200));
  });

  return paras;
}

// ── Appendix ───────────────────────────────────────────────────────────────

function buildAppendix(): Paragraph[] {
  const base: RunStyle = { font: FONT, size: sz.body, color: COLOR.gray, italics: true };

  const sections: [string, string][] = [
    [
      "A. About the Respondent",
      "This section is a placeholder for additional company information, team bios, organizational structure, and relevant background.",
    ],
    [
      "B. Supporting Documentation",
      "This section is a placeholder for supplementary materials, technical specifications, case studies, or reference letters.",
    ],
    [
      "C. Certifications & Compliance",
      "This section is a placeholder for certificates of compliance, relevant licenses, accreditations, and regulatory approvals.",
    ],
  ];

  const paras: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: "Appendix", font: FONT, bold: true, size: sz.h1 })],
    }),
  ];

  sections.forEach(([title, body]) => {
    paras.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: title, font: FONT, bold: true, size: sz.h2 })],
      }),
      new Paragraph({
        children: [new TextRun({ ...base, text: body })],
        spacing: { after: 200 },
      })
    );
  });

  return paras;
}

// ── Category grouping helpers ──────────────────────────────────────────────

function groupByCategory(questions: RFPQuestion[]): Map<string, RFPQuestion[]> {
  const map = new Map<string, RFPQuestion[]>();
  for (const q of questions) {
    const cat = q.category || "General";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(q);
  }
  return map;
}

function sortCategories(grouped: Map<string, RFPQuestion[]>): string[] {
  return [...grouped.keys()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// ── Main export function ───────────────────────────────────────────────────

export async function generateResponseDocx(opts: ExportOptions): Promise<Blob> {
  const {
    questions,
    responses,
    feedbackMap,
    includeTableOfContents = true,
    includeOnlyCompleted = false,
  } = opts;

  const company = opts.companyName || "Respondent Organization";

  // ── Filter questions ──
  let filteredQuestions = questions;
  if (includeOnlyCompleted && feedbackMap) {
    filteredQuestions = questions.filter(
      (q) => feedbackMap[q.id]?.reviewStatus === "complete"
    );
  }

  // ── Cover page ──
  const coverChildren = buildCoverPage(opts, company);

  // ── Main content ──
  const mainChildren: Paragraph[] = [];

  if (includeTableOfContents) {
    mainChildren.push(...buildTocPlaceholder());
  }

  mainChildren.push(...buildExecutiveSummary(opts, filteredQuestions, company));

  const grouped = groupByCategory(filteredQuestions);
  const sortedCats = sortCategories(grouped);

  sortedCats.forEach((cat, idx) => {
    mainChildren.push(
      ...buildCategorySection(cat, idx + 1, grouped.get(cat)!, responses, opts)
    );
  });

  mainChildren.push(...buildAppendix());

  // ── Assemble document ──
  const doc = new Document({
    numbering: { config: NUMBERING_CONFIG },
    sections: [
      // Section 1: Cover page — no footer
      {
        properties: {
          page: { margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
        },
        children: coverChildren,
      },
      // Section 2: Main content — footer with page numbers
      {
        properties: {
          page: { margin: { top: MARGIN, right: MARGIN, bottom: MARGIN + 360, left: MARGIN } },
        },
        footers: { default: createPageFooter(company) },
        children: mainChildren,
      },
    ],
  });

  return Packer.toBlob(doc);
}
