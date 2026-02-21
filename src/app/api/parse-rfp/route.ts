import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type
    if (!["pdf", "docx", "txt", "xlsx", "xls", "csv"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or DOCX." },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const isPdf = ext === "pdf";
    const isDocx = ext === "docx";

    // Extract text from DOCX using mammoth
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

    return NextResponse.json({
      success: true,
      fileName,
      ...parsedResult,
    });
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
