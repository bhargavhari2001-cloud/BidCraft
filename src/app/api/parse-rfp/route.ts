import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { workbookToText } from "@/lib/xlsxParser";
import { notifySlack } from "@/lib/notify";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt", "xlsx", "xls", "csv"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // Rate limit: 10 parses per minute per IP (expensive operation)
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 10);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, TXT, or spreadsheet." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const isPdf = ext === "pdf";
    const isDocx = ext === "docx";
    const isSheet = ext === "xlsx" || ext === "xls" || ext === "csv";

    let docxText = "";
    if (isDocx) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        docxText = result.value;
        if (!docxText.trim()) {
          return NextResponse.json(
            { error: "Could not extract text from DOCX file. The document may be empty or image-only." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Failed to read DOCX file. It may be corrupted." },
          { status: 400 }
        );
      }
    }

    let sheetText = "";
    if (isSheet) {
      try {
        sheetText = workbookToText(buffer);
        if (!sheetText.trim()) {
          return NextResponse.json(
            { error: "Could not extract data from the spreadsheet. It may be empty." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Failed to read spreadsheet. It may be corrupted or password-protected." },
          { status: 400 }
        );
      }
    }

    const prompt = `You are an expert RFP analyst. Analyze the following RFP document and extract ALL questions and requirements that a vendor would need to respond to.

For each question/requirement found, provide:
1. The question ID (if present in the document, like "Q1", "Q2", or generate one like "REQ-1", "REQ-2")
2. The exact question or requirement text
3. A category (one of: "Technical", "Security & Compliance", "Experience & References", "Staffing", "Methodology", "Pricing", "General")
4. Whether it appears mandatory or optional
5. A confidence score (0-100) indicating how confident you are this is an actual question/requirement vs. informational text

Respond ONLY with valid JSON in this exact format, no other text:
{
  "rfp_title": "Title of the RFP",
  "issuing_organization": "Name of the organization",
  "submission_deadline": "Deadline if found, or null",
  "total_questions": 0,
  "questions": [
    {
      "id": "Q1",
      "text": "The full question text",
      "category": "Technical",
      "mandatory": true,
      "confidence": 95,
      "section": "Section name where this was found"
    }
  ]
}`;

    let userContent: Anthropic.MessageCreateParams["messages"][0]["content"];

    if (isPdf) {
      userContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: buffer.toString("base64"),
          },
        },
        { type: "text", text: prompt },
      ];
    } else if (isDocx) {
      userContent = [
        {
          type: "text",
          text: `${prompt}\n\nHere is the RFP document text extracted from a Word document:\n\n---\n${docxText.substring(0, 30000)}\n---`,
        },
      ];
    } else if (isSheet) {
      userContent = [
        {
          type: "text",
          text: `${prompt}\n\nHere is the RFP content extracted from a spreadsheet (one CSV block per sheet):\n\n---\n${sheetText}\n---`,
        },
      ];
    } else {
      userContent = [
        {
          type: "text",
          text: `${prompt}\n\nHere is the RFP document text:\n\n---\n${buffer.toString("utf-8").substring(0, 30000)}\n---`,
        },
      ];
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsedResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: responseText },
        { status: 500 }
      );
    }

    notifySlack(
      `📄 New RFP parsed: *${parsedResult.rfp_title || fileName}* — ${
        parsedResult.total_questions ?? (parsedResult.questions?.length || 0)
      } questions extracted.`
    );

    return NextResponse.json({ success: true, fileName, ...parsedResult });
  } catch (error: unknown) {
    console.error("RFP parsing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to parse RFP", details: errorMessage },
      { status: 500 }
    );
  }
}
