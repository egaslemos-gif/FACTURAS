import { NextResponse } from "next/server";
import { DocumentContextResolver } from "@/lib/commercialDocuments/documentContextResolver";
import { DocumentPromptBuilder } from "@/lib/commercialDocuments/documentPromptBuilder";
import { DocumentAiClient } from "@/lib/commercialDocuments/documentAiClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Resolve Context
    const context = DocumentContextResolver.resolve(body);

    // 2. Build Prompt
    const prompt = DocumentPromptBuilder.buildPrompt(context);

    // 3. Call AI
    const aiClient = new DocumentAiClient();
    const generatedContent = await aiClient.generateDocument(context, prompt);

    return NextResponse.json({
      success: true,
      content: generatedContent,
    });
  } catch (error: any) {
    console.error("[Proposal Generate API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
