import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPdf = file.name.endsWith(".pdf");

    const prompt = `You are an expert at extracting company information from documents. Analyze the following company document and extract structured information.

Extract and return a JSON object with these fields (use null if not found):
{
  "companyName": string,
  "description": string (1-2 paragraph summary),
  "industry": string,
  "employeeCount": string or number,
  "yearFounded": number,
  "headquarters": string,
  "services": string[] (list of key services/products),
  "certifications": string[] (ISO, SOC2, HIPAA, etc.),
  "differentiators": string[] (unique selling points),
  "clients": string[] (notable clients mentioned),
  "awards": string[] (any awards or recognition),
  "technologies": string[] (technology platforms and tools mentioned),
  "contactInfo": {
    "website": string,
    "email": string,
    "phone": string,
    "address": string
  }
}

Be thorough but only include information explicitly stated in the document. Respond ONLY with valid JSON.`;

    const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] =
      isPdf
        ? [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: buffer.toString("base64"),
              },
            },
            { type: "text", text: prompt },
          ]
        : [
            {
              type: "text",
              text: `${prompt}\n\nHere is the company document:\n\n---\n${buffer.toString("utf-8").substring(0, 30000)}\n---`,
            },
          ];

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...parsed });
  } catch (error: unknown) {
    console.error("Company doc parsing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to parse document", details: errorMessage },
      { status: 500 }
    );
  }
}
