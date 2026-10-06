import "server-only";
import OpenAI from "openai";
import { CATEGORIES, type Category, type Direction, type Verification } from "./core";
import { parseResearchResponse } from "./validation";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ticker: { type: "string" },
    category: { type: "string", enum: [...CATEGORIES] },
    title: { type: "string" },
    status: { type: "string", enum: ["CONFIRMED", "PRELIMINARY", "UNCONFIRMED"] },
    phase: { type: "string", enum: ["PROPOSED", "APPROVED", "EFFECTIVE", "COMPLETED", "SUSPENDED", "RESUMED", "UNKNOWN"] },
    direction: { type: "string", enum: ["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL", "UNCERTAIN"] },
    summary: { type: "string" },
    whatChanged: { type: "string" },
    materiality: { type: "string" },
    issuerImpact: { type: "string" },
    marketImpact: { type: "string" },
    uncertainty: { type: "string" },
    dilution: { type: "string" },
    liquidity: { type: "string" },
    debt: { type: "string" },
    ownership: { type: "string" },
    monitorNext: { type: "string" },
    announcementDate: { type: ["string", "null"] },
    effectiveDate: { type: ["string", "null"] },
    transactionIdr: { type: ["number", "null"] },
    newShares: { type: ["number", "null"] },
    existingShares: { type: ["number", "null"] },
    exercisePriceIdr: { type: ["number", "null"] },
    changesControl: { type: "boolean" },
    leverageConcern: { type: "boolean" },
    indexRebalance: { type: "boolean" },
    governanceConcern: { type: "boolean" },
    evidence: { type: "array", items: { type: "object", additionalProperties: false, properties: { claim: { type: "string" }, exactQuote: { type: "string" } }, required: ["claim", "exactQuote"] } },
  },
  required: ["ticker", "category", "title", "status", "phase", "direction", "summary", "whatChanged", "materiality", "issuerImpact", "marketImpact", "uncertainty", "dilution", "liquidity", "debt", "ownership", "monitorNext", "announcementDate", "effectiveDate", "transactionIdr", "newShares", "existingShares", "exercisePriceIdr", "changesControl", "leverageConcern", "indexRebalance", "governanceConcern", "evidence"],
} as const;

export type ExtractedResearch = {
  ticker: string; category: Category; title: string; status: Verification; phase: "PROPOSED" | "APPROVED" | "EFFECTIVE" | "COMPLETED" | "SUSPENDED" | "RESUMED" | "UNKNOWN"; direction: Direction;
  summary: string; whatChanged: string; materiality: string; issuerImpact: string; marketImpact: string;
  uncertainty: string; dilution: string; liquidity: string; debt: string; ownership: string; monitorNext: string;
  announcementDate: string | null; effectiveDate: string | null; transactionIdr: number | null;
  newShares: number | null; existingShares: number | null; exercisePriceIdr: number | null;
  changesControl: boolean; leverageConcern: boolean; indexRebalance: boolean; governanceConcern: boolean;
  evidence: Array<{ claim: string; exactQuote: string }>;
};

export async function analyzeDocument(input: { text: string; ticker: string; category: Category; sourceUrl: string; previousSummary?: string }): Promise<{ research: ExtractedResearch; inputTokens: number; outputTokens: number }> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!key || !model) throw new Error("OpenAI unavailable: OPENAI_API_KEY or OPENAI_MODEL missing");
  const client = new OpenAI({ apiKey: key, timeout: 25_000, maxRetries: 1 });
  const response = await client.responses.create({
    model,
    store: false,
    ...(model === "gpt-6-luna" ? { reasoning: { effort: "none" as const } } : {}),
    max_output_tokens: 2500,
    input: [
      { role: "system", content: "You extract and explain ONLY facts explicitly present in the supplied official disclosure. Write Indonesian. Do not invent source, price, date, transaction value, share count, index flow, approval, or market direction. If unknown use null or N/D. A CONFIRMED label means only the cited facts in the official document are confirmed, not that a proposal was completed. Use exactQuote copied verbatim from source text for every material claim. Distinguish proposed, approved and completed phases, and cite phase in evidence. Impact direction is uncertain unless strong source-grounded reason. Never interpret a schedule as proof of ETF flow." },
      { role: "user", content: `Ticker: ${input.ticker}\nCategory: ${input.category}\nSource: ${input.sourceUrl}\nPrevious summary: ${input.previousSummary ?? "none"}\n\nSOURCE DOCUMENT EXCERPT:\n${input.text.slice(0, 18_000)}` },
    ],
    text: { format: { type: "json_schema", name: "idx_research", strict: true, schema } },
  });
  const output = response.output.filter((item) => item.type === "message").flatMap((item) => item.content).filter((part) => part.type === "output_text").map((part) => part.text).join("");
  return { research: parseResearchResponse(output, input.text, input.ticker, input.category), inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 };
}
