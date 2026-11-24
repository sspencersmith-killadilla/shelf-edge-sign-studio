import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const wordingSchema = z.object({
  title: z.string().describe("Short section title, 1-4 words"),
  range: z.string().describe("Call number range written for display, e.g. 000 – 299"),
  subRanges: z.array(z.string()).describe("2-5 short topic lines, most useful first"),
  footer: z.string().describe("Optional short helper line, may be empty"),
  titleScale: z.number().describe("0.6-1.6 relative size for the title"),
  rangeScale: z.number().describe("0.6-1.6 relative size for the call number range"),
  bodyScale: z.number().describe("0.6-1.6 relative size for topic lines"),
  rationale: z.string().describe("One or two sentences on why this hierarchy reads well"),
});
export type Wording = z.infer<typeof wordingSchema>;

const INSTRUCTIONS = `You write library shelf end-panel signs. Given a collection, call-number range and intended readers, suggest clear, plain-language wording and a visual hierarchy.
Rules: the most important wayfinding element (usually the call number range for adults/academic, the friendly title for children) gets the largest scale. Keep the title 1-4 words. Topic lines: 2-5 entries, each under 30 characters, using words the intended readers understand (simple words for children and English learners). Keep the call numbers accurate to the given range; never invent a different range. Footer may be empty. Answer in the same language as the collection name.`;

export async function suggestWording(input: { collection: string; range: string; readers: string }, signal?: AbortSignal) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw Object.assign(new Error("AI is not configured."), { status: 401 });
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    messages: [{ role: "user", content: `Collection: ${input.collection}\nCall-number range: ${input.range}\nIntended readers: ${input.readers}` }],
    output: Output.object({ schema: wordingSchema }),
    maxRetries: 0,
    ...(signal ? { abortSignal: signal } : {}),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const out = await result.output;
  const c = (n: number) => Math.min(1.6, Math.max(0.6, Math.round(n * 100) / 100));
  return { ...out, titleScale: c(out.titleScale), rangeScale: c(out.rangeScale), bodyScale: c(out.bodyScale) };
}
