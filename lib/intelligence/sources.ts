import "server-only";
import { load } from "cheerio";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { normalize, sha, type Category } from "./core";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["web.ksei.co.id", "www.idx.co.id", "idx.co.id", "www.ksei.co.id", "ksei.co.id", "www.ojk.go.id", "ojk.go.id", "www.msci.com", "msci.com", "www.lseg.com", "lseg.com", "www.vaneck.com", "vaneck.com"]);
export type DiscoveredDocument = { adapter: string; category: Category; sourceUrl: string; sourceDocumentId: string; title: string; publishedAt: Date | null };
export type AdapterResult = { adapter: string; documents: DiscoveredDocument[]; error: string | null; checkedAt: Date };
export const KSEI_FEEDS: Array<{ name: string; path: string; category: Category }> = [
  { name: "KSEI Rights", path: "/publications/corporate-action-schedules/rights-distribution", category: "RIGHTS_ISSUE" },
  { name: "KSEI Cash Dividend", path: "/publications/corporate-action-schedules/cash-dividend", category: "DIVIDEND" },
  { name: "KSEI Share Dividend", path: "/publications/corporate-action-schedules/share-dividend", category: "DIVIDEND" },
  { name: "KSEI Mixed Dividend", path: "/publications/corporate-action-schedules/mix-dividend", category: "DIVIDEND" },
  { name: "KSEI Share Bonus", path: "/publications/corporate-action-schedules/share-bonus", category: "BONUS_SHARES" },
  { name: "KSEI MASR", path: "/publications/corporate-action-schedules/masr", category: "TENDER_OFFER" },
];

export function allowedSourceUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname) || url.username || url.password) throw new Error("Source host is not allowlisted");
  return url;
}

async function boundedFetch(url: string, timeoutMs = 9000): Promise<Response> {
  allowedSourceUrl(url);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "error",
        headers: { "User-Agent": "IDXStockTerminalResearch/1.0 (+public-disclosure-reader)", Accept: "text/html, application/pdf;q=0.9" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response;
      if (response.status < 500 || attempt) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Source unavailable");
}

export async function discoverKsei(feed: typeof KSEI_FEEDS[number]): Promise<AdapterResult> {
  const checkedAt = new Date();
  try {
    const url = `https://web.ksei.co.id${feed.path}?setLocale=en-US`;
    const html = await (await boundedFetch(url)).text();
    const $ = load(html);
    const documents: DiscoveredDocument[] = [];
    $("table tbody tr").each((_index, row) => {
      const cells = $(row).find("td");
      const href = cells.eq(0).find("a").attr("href");
      const reference = normalize(cells.eq(0).text());
      const title = normalize(cells.eq(1).text());
      const dateValue = normalize(cells.eq(2).text());
      if (!href || !reference || !title) return;
      const sourceUrl = new URL(href, "https://web.ksei.co.id").toString();
      try { allowedSourceUrl(sourceUrl); } catch { return; }
      const publishedAt = dateValue ? new Date(`${dateValue} 12:00:00 GMT+0700`) : null;
      documents.push({
        adapter: feed.name, category: feed.category, sourceUrl,
        sourceDocumentId: `KSEI:${reference}`,
        title, publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      });
    });
    if (!$("table[data-table]").length) throw new Error("Expected KSEI announcement table absent");
    return { adapter: feed.name, documents, error: null, checkedAt };
  } catch (error) {
    return { adapter: feed.name, documents: [], error: error instanceof Error ? error.message : "Unknown source error", checkedAt };
  }
}

export async function fetchSourceDocument(document: DiscoveredDocument): Promise<{ text: string; fingerprint: string }> {
  const response = await boundedFetch(document.sourceUrl, 12000);
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) throw new Error("Document exceeds size limit");
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Document body unavailable");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) { await reader.cancel(); throw new Error("Document exceeds size limit"); }
    chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);
  let text = "";
  if (contentType.includes("pdf") || document.sourceUrl.toLowerCase().endsWith(".pdf")) {
    if (buffer.subarray(0, 4).toString() !== "%PDF") throw new Error("Invalid PDF signature");
    const parsed = await pdfParse(buffer, { max: 12 });
    if (parsed.numpages > 12) throw new Error("PDF exceeds 12-page extraction limit");
    text = parsed.text;
  } else if (contentType.includes("html")) {
    const $ = load(buffer.toString("utf8"));
    $("script, style, nav, footer").remove();
    text = $("main").text() || $("article").text() || $("body").text();
  } else throw new Error(`Unsupported document type: ${contentType || "unknown"}`);
  text = normalize(text);
  if (text.length < 100) throw new Error("No reliable text extracted from document");
  return { text: text.slice(0, 50_000), fingerprint: sha(text) };
}
