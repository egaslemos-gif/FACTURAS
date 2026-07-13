import OpenAI from 'openai';
import { AIProvider, DocumentContext } from "./documentTypes";

export class DocumentAiClient implements AIProvider {
  // Provider sequence based on user preference: Gemini -> OpenRouter -> DeepSeek -> GLM
  
  async generateDocument(context: DocumentContext, prompt: string): Promise<string> {
    const isMockOnly = !process.env.GOOGLE_API_KEY && !process.env.OPENROUTER_API_KEY;
    
    if (isMockOnly) {
      console.warn("[DocumentAiClient] No API Keys provided. Returning mock JSON response.");
      return this.getMockResponse(context);
    }

    const errors: Error[] = [];

    // 1. Try Gemini
    if (process.env.GOOGLE_API_KEY) {
      try {
        console.log("[DocumentAiClient] Attempting Gemini...");
        return await this.callGemini(prompt);
      } catch (err: any) {
        console.error("[DocumentAiClient] Gemini failed:", err.message);
        errors.push(err);
      }
    }

    // 2. Try OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log("[DocumentAiClient] Attempting OpenRouter...");
        return await this.callOpenRouter(prompt);
      } catch (err: any) {
        console.error("[DocumentAiClient] OpenRouter failed:", err.message);
        errors.push(err);
      }
    }

    // 3. Try DeepSeek (NVIDIA)
    if (process.env.NVIDIA_DEEPSEEK_API_KEY) {
      try {
        console.log("[DocumentAiClient] Attempting DeepSeek (NVIDIA)...");
        return await this.callDeepSeek(prompt);
      } catch (err: any) {
        console.error("[DocumentAiClient] DeepSeek failed:", err.message);
        errors.push(err);
      }
    }

    // 4. Try GLM-5.2 (NVIDIA)
    if (process.env.NVIDIA_GLM_API_KEY) {
      try {
        console.log("[DocumentAiClient] Attempting GLM-5.2 (NVIDIA)...");
        return await this.callGLM(prompt);
      } catch (err: any) {
        console.error("[DocumentAiClient] GLM-5.2 failed:", err.message);
        errors.push(err);
      }
    }

    throw new Error(`All AI Providers failed. Errors: ${errors.map(e => e.message).join(" | ")}`);
  }

  async generateSection(context: DocumentContext, sectionDef: any, prompt: string): Promise<string> {
    return this.generateDocument(context, prompt);
  }

  async estimateTokens(prompt: string): Promise<number> {
    return Math.ceil(prompt.split(/\s+/).length * 1.3);
  }

  // --- MOCK FALLBACK ---
  private getMockResponse(context: DocumentContext): string {
    return JSON.stringify({
      executiveSummary: `Temos o prazer de apresentar esta proposta para a **${context.client.name}**. O nosso objetivo é entregar valor imediato focando nos resultados.`,
      proposedSolution: `Com base nas suas necessidades, a nossa solução garantirá eficiência e escalabilidade.`,
      scope: `Os itens selecionados para a execução são vitais para o sucesso:\n${context.items.map(i => `- ${i.description} (${i.quantity}x)`).join('\n')}`,
      timeline: `- **Semana 1:** Setup e kick-off.\n- **Semana 2-3:** Execução e acompanhamento.\n- **Semana 4:** Entrega final.`,
      conditions: `- **Validade:** ${context.validity}\n- **Condições de Pagamento:** ${context.paymentTerms}`
    });
  }

  // --- PROVIDER CALLS ---
  private cleanJson(rawText: string): string {
    return rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return this.cleanJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash", // Good fast default on OpenRouter
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return this.cleanJson(completion.choices[0]?.message?.content || "");
  }

  private async callDeepSeek(prompt: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_DEEPSEEK_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek-ai/deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4000,
      chat_template_kwargs: { "thinking": true, "reasoning_effort": "high" },
      stream: false
    } as any);

    // Content contains the final answer after reasoning
    return this.cleanJson(completion.choices[0]?.message?.content || "");
  }

  private async callGLM(prompt: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_GLM_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "z-ai/glm-5.2",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 1,
      max_tokens: 4000,
    });

    return this.cleanJson(completion.choices[0]?.message?.content || "");
  }
}
