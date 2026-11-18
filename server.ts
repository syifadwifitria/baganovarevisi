/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA Full-Stack Server
 * - POST /api/timo-chat : TIMO AI Assistant via OpenRouter.ai (NVIDIA Nemotron 3.5 Super VL free)
 * - GET  /api/bagan-articles : Real up-to-date Indonesian articles about Bagan & Fish Catches
 * - Vite dev middleware in development / static dist serving in production
 */

import "dotenv/config";
import dns from "node:dns";
import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// Prefer IPv4 first so container Node fetch avoids hanging on unreachable IPv6 AAAA records
dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT =
  process.env.NODE_ENV !== "production" ||
  (process.env.NGINX_PORT && process.env.NGINX_PORT === process.env.PORT)
    ? Number(process.env.DEFAULT_APP_PORT) || 3000
    : Number(process.env.PORT) || 3000;

async function fetchWithRetry(
  url: string,
  options?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<globalThis.Response> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 400;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "BAGANOVA-MarineServer/1.0",
        },
      });
      if (
        !response.ok &&
        (response.status === 429 || response.status >= 500) &&
        attempt < retries
      ) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr ?? new Error(`Fetch failed for ${url}`);
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_PRIMARY_MODEL = "nvidia/nemotron-3.5-super-vl:free";
const OPENROUTER_FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning:free";

interface ChatHistoryItem {
  role: "user" | "model";
  text: string;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BaganArticle {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  topicTag: string;
  imageUrl?: string;
}

interface CachedArticlesEntry {
  fetchedAt: string;
  expiresAt: number;
  overview: string;
  articles: BaganArticle[];
}

const ARTICLE_CACHE_TTL_MS = 60 * 60 * 1000;
const articlesCache = new Map<string, CachedArticlesEntry>();

class OpenRouterApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey === "MY_OPENROUTER_API_KEY" ||
    apiKey === "YOUR_OPENROUTER_API_KEY"
  ) {
    throw new OpenRouterApiError(
      503,
      "OPENROUTER_API_KEY belum tersedia di server. Tambahkan OPENROUTER_API_KEY dari openrouter.ai pada menu Settings > Secrets (atau file .env)."
    );
  }
  return apiKey;
}

function extractOpenRouterText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const msg = (choices[0] as { message?: unknown })?.message;
  if (!msg || typeof msg !== "object") return "";
  const content = (msg as { content?: unknown }).content;
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const t = (part as { text?: unknown }).text;
          return typeof t === "string" ? t : "";
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

async function callOpenRouterChat(
  messages: OpenRouterMessage[],
  options?: { referer?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  const candidateModels = [OPENROUTER_PRIMARY_MODEL, OPENROUTER_FALLBACK_MODEL];
  let lastErr: unknown = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": options?.referer || "https://baganova.app",
          "X-Title": "BAGANOVA - Smart Automated Bagan System",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.6,
          max_tokens: options?.maxTokens ?? 1400,
        }),
      });

      const rawText = await response.text();
      let json: Record<string, unknown> = {};
      try {
        json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
      } catch {
        json = {};
      }

      if (!response.ok) {
        const providerMsg =
          (json?.error as { message?: string } | undefined)?.message ||
          rawText ||
          `HTTP ${response.status}`;

        const isTransient =
          response.status === 429 || response.status === 502 || response.status === 503;

        if (isTransient && i < candidateModels.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 650));
          continue;
        }

        throw new OpenRouterApiError(response.status, providerMsg);
      }

      const replyText = extractOpenRouterText(json);
      if (replyText) {
        return replyText;
      }

      if (i < candidateModels.length - 1) {
        continue;
      }
      throw new OpenRouterApiError(
        502,
        "Model OpenRouter tidak mengembalikan teks jawaban."
      );
    } catch (err) {
      lastErr = err;
      if (err instanceof OpenRouterApiError) {
        const isTransient =
          err.status === 429 || err.status === 502 || err.status === 503;
        if (isTransient && i < candidateModels.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 650));
          continue;
        }
        throw err;
      }
      if (i < candidateModels.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr ?? new OpenRouterApiError(502, "Gagal menghubungi OpenRouter.");
}

function parseOpenRouterError(err: unknown): { status: number; message: string } {
  const status = err instanceof OpenRouterApiError ? err.status : 500;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes("openrouter_api_key belum tersedia")) {
    return { status: 503, message: rawMessage };
  }
  if (status === 401 || status === 403 || lower.includes("invalid") || lower.includes("unauthorized")) {
    return {
      status: 403,
      message:
        "Akses OpenRouter API ditolak atau OPENROUTER_API_KEY belum valid. Periksa pengaturan API key pada Settings > Secrets.",
    };
  }
  if (status === 402 || lower.includes("credit") || lower.includes("insufficient")) {
    return {
      status: 402,
      message:
        "Batas penggunaan akun OpenRouter tercapai. Pastikan memilih model gratis atau periksa status akun OpenRouter Anda.",
    };
  }
  if (status === 404 || lower.includes("no endpoints found") || lower.includes("not found")) {
    return {
      status: 404,
      message:
        "Model nvidia/nemotron-3.5-super-vl:free sedang tidak tersedia di endpoint OpenRouter saat ini.",
    };
  }
  if (status === 429 || lower.includes("rate limit") || lower.includes("429")) {
    return {
      status: 429,
      message:
        "Kuota permintaan gratis OpenRouter sedang padat sementara. Tunggu beberapa detik lalu coba kirim ulang.",
    };
  }
  if (lower.includes("abort") || lower.includes("timeout")) {
    return {
      status: 504,
      message: "Koneksi ke OpenRouter melebihi batas waktu. Silakan coba kirim ulang pertanyaan.",
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: "Terjadi gangguan saat menghubungi layanan OpenRouter AI. Silakan coba kembali.",
  };
}

const TIMO_SYSTEM_INSTRUCTION = `Kamu adalah TIMO AI, asisten virtual resmi BAGANOVA (Smart Automated Bagan System) yang berbentuk maskot maritim ramah dan cerdas dari Program Studi Sistem Informasi Kelautan (SIK), Universitas Pendidikan Indonesia (UPI) Kampus Serang.

Pengetahuan inti tentang BAGANOVA:
- BAGANOVA adalah website dan sistem pemantauan beban serta pengangkatan jaring bagan tancap otomatis berbasis IoT.
- Komponen utama: Sensor Load Cell yang terhubung ke modul HX711 untuk membaca tarikan beban jaring, mikrokontroler ESP32 dengan filter digital untuk meredam goyangan ombak, motor penggerak pengangkat jaring, sakelar batas atas (limit switch) untuk menghentikan motor saat jaring sudah di puncak, serta tombol darurat Emergency Stop (E-STOP).
- Keselamatan kerja: Pengangkatan jaring berjalan otomatis ketika target beban yang sudah diatur nelayan tercapai. Penurunan jaring dilakukan dengan memeriksa kondisi sekitar jaring agar bebas dari perahu atau hambatan sebelum dioperasikan kembali.
- Konektivitas di laut: ESP32 dapat beroperasi sebagai jaringan lokal (Access Point) sehingga nelayan tetap bisa memantau kondisi dari smartphone dalam jangkauan sinyal bagan, dan limit switch tetap bekerja menghentikan motor secara langsung.
- Pendaftaran & Dukungan: Nelayan baru dapat mendaftar lewat halaman Daftar ("Daftar Bagan"), dan kontak tim pengembang tersedia melalui email baganova@gmail.com.
- Tangkapan bagan: Hasil tangkapan bagan di perairan Indonesia meliputi beragam ikan pelagis kecil, cumi-cumi, tembang, selar, kembung, dan hasil laut lain yang tertarik cahaya lampu bagan di malam hari.

Gaya menjawab (SANGAT PENTING):
- Gunakan bahasa Indonesia yang sangat sederhana, santai, hangat, dan mudah dipahami oleh nelayan (hindari istilah teknik yang rumit bila tidak ditanyakan).
- Jika harus menyebut istilah alat (seperti load cell atau limit switch), jelaskan langsung artinya dengan bahasa sehari-hari.
- Jawab singkat dan jelas dalam 1–3 paragraf pendek atau poin rapi (maksimal sekitar 160 kata).`;

const TOPIC_CONFIG: Record<string, { label: string; rssQuery: string; bingQuery: string }> = {
  semua: {
    label: "Semua Topik Bagan",
    rssQuery: "nelayan bagan tancap OR bagan apung hasil tangkapan ikan",
    bingQuery: "nelayan bagan tancap",
  },
  tangkapan: {
    label: "Hasil Tangkapan Bagan",
    rssQuery: "hasil tangkapan ikan bagan nelayan perairan",
    bingQuery: "hasil tangkapan ikan bagan nelayan",
  },
  teri: {
    label: "Ikan Pelagis & Pesisir",
    rssQuery: "ikan pelagis tangkapan nelayan bagan OR hasil laut pesisir",
    bingQuery: "ikan pelagis tangkapan nelayan bagan",
  },
  teknologi: {
    label: "Teknologi & Lampu Bagan",
    rssQuery: "lampu bagan tancap OR teknologi alat tangkap bagan nelayan",
    bingQuery: "lampu bagan tancap nelayan",
  },
};

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlTags(html: string): string {
  return decodeXmlEntities(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

function formatIndonesianDate(pubDateRaw: string): string {
  const date = new Date(pubDateRaw);
  if (Number.isNaN(date.getTime())) return pubDateRaw;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isLikelyArticlePhotoUrl(rawUrl: string): boolean {
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) return false;
  const lower = rawUrl.toLowerCase();
  if (
    lower.endsWith(".svg") ||
    lower.includes(".svg?") ||
    lower.includes("default_image") ||
    lower.includes("no-image") ||
    lower.includes("placeholder") ||
    lower.includes("rsslogo") ||
    lower.includes("google_news") ||
    lower.includes("favicon") ||
    lower.includes("sprite") ||
    lower.includes("1x1")
  ) {
    return false;
  }
  return true;
}

function normalizeImageUrl(rawUrl: string, baseUrl?: string): string | undefined {
  const cleaned = decodeXmlEntities(rawUrl).trim();
  if (!cleaned || cleaned.startsWith("data:")) return undefined;

  let resolved = cleaned;
  try {
    if (cleaned.startsWith("//")) {
      resolved = `https:${cleaned}`;
    } else if (baseUrl && !/^https?:\/\//i.test(cleaned)) {
      resolved = new URL(cleaned, baseUrl).toString();
    }
  } catch {
    return undefined;
  }

  if (resolved.startsWith("http://")) {
    resolved = `https://${resolved.slice("http://".length)}`;
  }

  return isLikelyArticlePhotoUrl(resolved) ? resolved : undefined;
}

function extractPublisherUrlFromBingLink(rawLink: string): string {
  try {
    const parsed = new URL(rawLink);
    const targetUrl = parsed.searchParams.get("url");
    if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
      return targetUrl;
    }
  } catch {
    // Keep original link when URL parsing fails
  }
  return rawLink;
}

function extractMetaImageFromHtml(html: string, pageUrl: string): string | undefined {
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image:secure_url|og:image|twitter:image:src|twitter:image)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image:secure_url|og:image|twitter:image:src|twitter:image)["']/i,
  ];
  for (const regex of patterns) {
    const match = html.match(regex);
    if (match?.[1]) {
      const normalized = normalizeImageUrl(match[1], pageUrl);
      if (normalized) return normalized;
    }
  }
  return undefined;
}

async function fetchArticleOgImage(articleUrl: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(articleUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return undefined;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) return undefined;

    const html = await response.text();
    return extractMetaImageFromHtml(html.slice(0, 120000), response.url || articleUrl);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRealBingNewsArticles(
  topicLabel: string,
  bingQuery: string
): Promise<BaganArticle[]> {
  const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(
    bingQuery
  )}&format=rss&mkt=id-ID&setlang=id`;

  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil umpan berita Bing (HTTP ${response.status}).`);
  }

  const xml = await response.text();
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
  const itemsWithTs: Array<BaganArticle & { ts: number }> = [];

  for (const itemXml of itemMatches) {
    const rawTitle = stripHtmlTags(extractTag(itemXml, "title"));
    const rawLink = decodeXmlEntities(extractTag(itemXml, "link"));
    const rawPubDate = decodeXmlEntities(extractTag(itemXml, "pubDate"));
    const rawSource = stripHtmlTags(extractTag(itemXml, "News:Source"));
    const rawDesc = stripHtmlTags(extractTag(itemXml, "description"));
    const rawNewsImage = decodeXmlEntities(extractTag(itemXml, "News:Image"));

    if (!rawTitle || !rawLink) continue;

    const directUrl = extractPublisherUrlFromBingLink(rawLink);
    let sourceName = rawSource;
    if (!sourceName) {
      try {
        sourceName = new URL(directUrl).hostname.replace(/^www\./, "");
      } catch {
        sourceName = "Berita Perikanan";
      }
    }

    const publishedAt = rawPubDate ? formatIndonesianDate(rawPubDate) : "Terbaru";
    const parsedTs = rawPubDate ? new Date(rawPubDate).getTime() : 0;

    let cleanSummary = rawDesc.replace(/^[:\-\s]+/, "").trim();
    if (!cleanSummary || cleanSummary.length < 30) {
      cleanSummary = `Publikasi ${sourceName} (${publishedAt}) membahas topik ${topicLabel.toLowerCase()} dan perkembangan aktivitas nelayan bagan di Indonesia.`;
    } else if (cleanSummary.length > 220) {
      cleanSummary = `${cleanSummary.slice(0, 220)}...`;
    }

    let bingImageUrl = normalizeImageUrl(rawNewsImage);
    if (bingImageUrl && bingImageUrl.includes("bing.com/th") && !bingImageUrl.includes("&w=")) {
      bingImageUrl = `${bingImageUrl}&w=800&h=450&c=7`;
    }

    itemsWithTs.push({
      title: rawTitle,
      summary: cleanSummary,
      url: directUrl,
      sourceName,
      publishedAt,
      topicTag: topicLabel,
      imageUrl: bingImageUrl,
      ts: Number.isNaN(parsedTs) ? 0 : parsedTs,
    });
  }

  itemsWithTs.sort((a, b) => b.ts - a.ts);
  const topSix = itemsWithTs.slice(0, 6);

  const enrichedWithImages = await Promise.all(
    topSix.map(async ({ ts: _ts, ...article }) => {
      if (article.imageUrl) {
        return article;
      }
      const ogImageUrl = await fetchArticleOgImage(article.url);
      return ogImageUrl ? { ...article, imageUrl: ogImageUrl } : article;
    })
  );

  return enrichedWithImages;
}

async function fetchRealGoogleNewsArticles(
  _topicKey: string,
  topicLabel: string,
  rssQuery: string
): Promise<BaganArticle[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    rssQuery
  )}&hl=id&gl=ID&ceid=ID:id`;

  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BAGANOVA-NewsReader/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil umpan berita (HTTP ${response.status}).`);
  }

  const xml = await response.text();
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
  const itemsWithTs: Array<BaganArticle & { ts: number }> = [];

  for (const itemXml of itemMatches) {
    const rawTitle = decodeXmlEntities(extractTag(itemXml, "title"));
    const rawLink = decodeXmlEntities(extractTag(itemXml, "link"));
    const rawPubDate = decodeXmlEntities(extractTag(itemXml, "pubDate"));
    const rawSource = decodeXmlEntities(extractTag(itemXml, "source"));
    const rawDesc = stripHtmlTags(extractTag(itemXml, "description"));

    if (!rawTitle || !rawLink) continue;

    // Clean publisher suffix from Google News title ("Judul Berita - Media")
    let cleanTitle = rawTitle;
    let sourceName = rawSource || "Berita Perikanan";
    if (rawSource && rawTitle.endsWith(` - ${rawSource}`)) {
      cleanTitle = rawTitle.slice(0, rawTitle.length - ` - ${rawSource}`.length).trim();
    } else if (rawTitle.includes(" - ")) {
      const idx = rawTitle.lastIndexOf(" - ");
      const maybeSource = rawTitle.slice(idx + 3).trim();
      if (maybeSource.length > 1 && maybeSource.length < 40) {
        sourceName = maybeSource;
        cleanTitle = rawTitle.slice(0, idx).trim();
      }
    }

    const publishedAt = rawPubDate ? formatIndonesianDate(rawPubDate) : "Terbaru";
    const parsedTs = rawPubDate ? new Date(rawPubDate).getTime() : 0;
    const isRepetitiveDesc =
      !rawDesc ||
      rawDesc.toLowerCase().startsWith(cleanTitle.slice(0, 28).toLowerCase()) ||
      rawDesc.length <= cleanTitle.length + sourceName.length + 12;

    const cleanSummary = isRepetitiveDesc
      ? `Publikasi ${sourceName} (${publishedAt}) membahas topik ${topicLabel.toLowerCase()} dan perkembangan aktivitas nelayan bagan di Indonesia.`
      : rawDesc.slice(0, 220) + (rawDesc.length > 220 ? "..." : "");

    itemsWithTs.push({
      title: cleanTitle,
      summary: cleanSummary,
      url: rawLink,
      sourceName,
      publishedAt,
      topicTag: topicLabel,
      ts: Number.isNaN(parsedTs) ? 0 : parsedTs,
    });
  }

  // Sort newest first and take top 6
  itemsWithTs.sort((a, b) => b.ts - a.ts);
  return itemsWithTs.slice(0, 6).map(({ ts: _ts, ...article }) => article);
}

async function enrichArticlesWithOpenRouter(
  topicLabel: string,
  articles: BaganArticle[]
): Promise<{ overview: string | null; summaries: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY" || apiKey === "YOUR_OPENROUTER_API_KEY") {
    return { overview: null, summaries: [] };
  }
  try {
    const titlesList = articles
      .map((a, i) => `${i + 1}. ${a.title} (${a.sourceName}, ${a.publishedAt})`)
      .join("\n");

    const text = await callOpenRouterChat(
      [
        {
          role: "user",
          content: `Berdasarkan daftar berita nyata tentang "${topicLabel}" di bawah ini:
${titlesList}

Tulis jawaban persis dengan format baris ini (Bahasa Indonesia ringkas, informatif, jangan mengarang fakta di luar judul/konteks wajar):
RINGKASAN: <2 kalimat ringkasan tren terkini dari artikel-artikel tersebut untuk nelayan bagan>
ITEM 1: <1 kalimat deskripsi singkat topik artikel 1>
ITEM 2: <1 kalimat deskripsi singkat topik artikel 2>
...dan seterusnya hingga ITEM ${articles.length}.`,
        },
      ],
      { temperature: 0.35, maxTokens: 900 }
    );

    if (!text) return { overview: null, summaries: [] };

    let overview: string | null = null;
    const summaries: string[] = new Array(articles.length).fill("");
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (line.toUpperCase().startsWith("RINGKASAN:")) {
        overview = line.replace(/^RINGKASAN:\s*/i, "").trim();
        continue;
      }
      const m = line.match(/^ITEM\s*(\d+)\s*:\s*(.+)$/i);
      if (m) {
        const idx = Number(m[1]) - 1;
        if (idx >= 0 && idx < articles.length) {
          summaries[idx] = m[2].trim();
        }
      }
    }
    return { overview, summaries };
  } catch {
    return { overview: null, summaries: [] };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "6mb" }));

  // 0. Gemini Vision Marine Catch Status & Analyzer (Server-Side @google/genai)
  const hasValidGeminiKey = (): boolean => {
    const k = process.env.GEMINI_API_KEY?.trim() || "";
    return Boolean(k && k !== "MY_GEMINI_API_KEY" && k !== "YOUR_GEMINI_API_KEY");
  };

  app.get("/api/ai-vision-status", (_req: Request, res: Response) => {
    res.json({ aiConfigured: hasValidGeminiKey() });
  });

  let cachedGeminiClient: { key: string; client: GoogleGenAI } | null = null;
  const getGeminiClient = (apiKey: string): GoogleGenAI => {
    if (!cachedGeminiClient || cachedGeminiClient.key !== apiKey) {
      cachedGeminiClient = {
        key: apiKey,
        client: new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        }),
      };
    }
    return cachedGeminiClient.client;
  };

  app.post("/api/measure-fish", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!hasValidGeminiKey() || !apiKey) {
        res.status(503).json({
          error:
            "Layanan AI pengenalan biota laut belum aktif di server. Anda tetap dapat mengukur langsung dengan menggeser titik ukur (1 & 2) di layar.",
        });
        return;
      }

      const body = req.body as {
        imageBase64?: unknown;
        mimeType?: unknown;
        referenceLabel?: unknown;
        referenceCm?: unknown;
        imageWidth?: unknown;
        imageHeight?: unknown;
      };

      const rawBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";
      const mimeType =
        typeof body?.mimeType === "string" && /^image\/(jpeg|jpg|png|webp)$/i.test(body.mimeType)
          ? body.mimeType
          : "image/jpeg";
      const referenceLabel =
        typeof body?.referenceLabel === "string" ? body.referenceLabel.trim() : "";
      const explicitRefCm =
        typeof body?.referenceCm === "number" && body.referenceCm > 0 ? body.referenceCm : 0;
      const imgW =
        typeof body?.imageWidth === "number" && body.imageWidth > 0 ? body.imageWidth : 512;
      const imgH =
        typeof body?.imageHeight === "number" && body.imageHeight > 0 ? body.imageHeight : 288;

      if (!rawBase64) {
        res.status(400).json({ error: "Data foto tidak ditemukan." });
        return;
      }

      const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const ai = getGeminiClient(apiKey);

      const promptText = `Deteksi hasil tangkapan laut Indonesia pada gambar${
        referenceLabel ? ` (pembanding pengguna: ${referenceLabel})` : ""
      }.
Aturan ketat:
1. HANYA deteksi biota tangkapan laut NYATA jenis APAPUN (ikan laut, teri, udang/rebon, cumi, sotong, gurita, kepiting/rajungan, lobster, kerang — termasuk foto biota laut di layar HP).
2. JANGAN pernah deteksi wajah manusia, kulit/tangan kosong, bantal, selimut, pakaian, dinding, atau garis/kotak/teks angka cm UI aplikasi. Jika objek utama hanya wajah/orang/ruangan tanpa biota laut nyata, WAJIB fishDetected=false, catches=[], referenceDetected=false, noteForFisherman="Belum terlihat hasil tangkapan laut.".
3. Jika ada beberapa biota berdekatan, tandai tiap individu paling jelas secara terpisah (maks 4 objek di catches[]). Koordinat 0..1000 (X kiri->kanan, Y atas->bawah): boxXMin..boxYMax membungkus ketat tubuh satu individu; headX,headY dan tailX,tailY tepat di ujung kepala/moncong ke ujung ekor/tentakel.
4. set referenceDetected=true HANYA jika terlihat benda pembanding fisik nyata (kartu KTP/ATM 8.56cm, korek gas 8.0cm, penggaris fisik, koin Rp500 2.7cm / Rp1000 2.4cm, uang kertas ~14.5cm), isi referenceName, referenceLengthCm, refAX..refBY tepat di dua ujungnya. Tanpa pembanding fisik, set referenceDetected=false dan perkirakan ukuran nyata dari petunjuk sekitar (telapak tangan ~8.5cm, layar HP ~7cm, anatomi spesies).
5. Isi label dengan nama Indonesia yang rapi (mis. "Ikan Teri Nasi", "Ikan Selar", "Udang Rebon", "Cumi-cumi") dan speciesId dari [teri_nasi,teri_jengki,rebon,tembang,cumi,selar,lainnya].`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          fishDetected: { type: Type.BOOLEAN },
          speciesId: { type: Type.STRING },
          speciesNameId: { type: Type.STRING },
          estimatedLengthCm: { type: Type.NUMBER },
          estimatedWeightG: { type: Type.NUMBER },
          referenceDetected: { type: Type.BOOLEAN },
          referenceName: { type: Type.STRING },
          referenceLengthCm: { type: Type.NUMBER },
          refAX: {
            type: Type.NUMBER,
            description: "X (0=left..1000=right) reference start",
          },
          refAY: {
            type: Type.NUMBER,
            description: "Y (0=top..1000=bottom) reference start",
          },
          refBX: {
            type: Type.NUMBER,
            description: "X (0=left..1000=right) reference end",
          },
          refBY: {
            type: Type.NUMBER,
            description: "Y (0=top..1000=bottom) reference end",
          },
          noteForFisherman: {
            type: Type.STRING,
            description: "Short 1-sentence note in Indonesian",
          },
          catches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                speciesId: { type: Type.STRING },
                boxXMin: { type: Type.NUMBER, description: "Left X 0..1000" },
                boxYMin: { type: Type.NUMBER, description: "Top Y 0..1000" },
                boxXMax: { type: Type.NUMBER, description: "Right X 0..1000" },
                boxYMax: { type: Type.NUMBER, description: "Bottom Y 0..1000" },
                headX: { type: Type.NUMBER, description: "Snout/head X 0..1000" },
                headY: { type: Type.NUMBER, description: "Snout/head Y 0..1000" },
                tailX: { type: Type.NUMBER, description: "Tail tip X 0..1000" },
                tailY: { type: Type.NUMBER, description: "Tail tip Y 0..1000" },
                estimatedLengthCm: { type: Type.NUMBER },
                estimatedWeightG: { type: Type.NUMBER },
              },
              required: [
                "label",
                "speciesId",
                "boxXMin",
                "boxYMin",
                "boxXMax",
                "boxYMax",
                "headX",
                "headY",
                "tailX",
                "tailY",
                "estimatedLengthCm",
                "estimatedWeightG",
              ],
            },
          },
        },
        required: [
          "fishDetected",
          "speciesId",
          "speciesNameId",
          "estimatedLengthCm",
          "estimatedWeightG",
          "noteForFisherman",
          "catches",
        ],
      };

      const contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      };

      let response;
      try {
        // Primary: ultra-fast lightweight flash-lite model with MINIMAL thinking for low latency
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: contentsPayload,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: "application/json",
            responseSchema,
          },
        });
      } catch (primaryErr) {
        const msg = primaryErr instanceof Error ? primaryErr.message.toLowerCase() : "";
        if (msg.includes("permission_denied") || msg.includes("api_key_invalid") || msg.includes("403")) {
          throw primaryErr;
        }
        console.warn("[/api/measure-fish] primary model fallback:", msg.slice(0, 140));
        // Fallback to gemini-4-hydrogen
        response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: contentsPayload,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema,
          },
        });
      }

      const rawText = (response.text ?? "{}")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(rawText) as {
        fishDetected?: boolean;
        speciesId?: string;
        speciesNameId?: string;
        estimatedLengthCm?: number;
        estimatedWeightG?: number;
        referenceDetected?: boolean;
        referenceName?: string;
        referenceLengthCm?: number;
        refAX?: number;
        refAY?: number;
        refBX?: number;
        refBY?: number;
        noteForFisherman?: string;
        catches?: Array<{
          label?: string;
          speciesId?: string;
          boxXMin?: number;
          boxYMin?: number;
          boxXMax?: number;
          boxYMax?: number;
          headX?: number;
          headY?: number;
          tailX?: number;
          tailY?: number;
          estimatedLengthCm?: number;
          estimatedWeightG?: number;
        }>;
      };

      const resolvedRefCm =
        explicitRefCm > 0
          ? explicitRefCm
          : typeof parsed.referenceLengthCm === "number" && parsed.referenceLengthCm > 0
          ? parsed.referenceLengthCm
          : 0;

      // Server-side aspect-corrected calibration check when reference object is detected
      if (
        parsed.referenceDetected &&
        resolvedRefCm > 0 &&
        typeof parsed.refAX === "number" &&
        typeof parsed.refAY === "number" &&
        typeof parsed.refBX === "number" &&
        typeof parsed.refBY === "number"
      ) {
        parsed.referenceLengthCm = resolvedRefCm;
        const refPx = Math.hypot(
          ((parsed.refBX - parsed.refAX) / 1000) * imgW,
          ((parsed.refBY - parsed.refAY) / 1000) * imgH
        );
        if (refPx >= 12 && Array.isArray(parsed.catches)) {
          const pxPerCm = refPx / resolvedRefCm;
          parsed.catches = parsed.catches.map((c) => {
            if (
              typeof c.headX === "number" &&
              typeof c.headY === "number" &&
              typeof c.tailX === "number" &&
              typeof c.tailY === "number"
            ) {
              const catchPx = Math.hypot(
                ((c.tailX - c.headX) / 1000) * imgW,
                ((c.tailY - c.headY) / 1000) * imgH
              );
              const calibratedCm = parseFloat(Math.max(0.5, catchPx / pxPerCm).toFixed(1));
              return { ...c, estimatedLengthCm: calibratedCm };
            }
            return c;
          });
          if (parsed.catches[0]?.estimatedLengthCm) {
            parsed.estimatedLengthCm = parsed.catches[0].estimatedLengthCm;
          }
        }
      }

      res.json(parsed);
    } catch (err) {
      console.error("[/api/measure-fish error]:", err);
      const rawMsg = err instanceof Error ? err.message : String(err);
      const lower = rawMsg.toLowerCase();
      if (lower.includes("permission_denied") || lower.includes("api_key_invalid") || lower.includes("403") || lower.includes("400")) {
        res.status(403).json({
          error: "Layanan AI pengenalan biota laut sedang tidak dapat diakses. Gunakan titik ukur manual di layar.",
        });
        return;
      }
      if (lower.includes("resource_exhausted") || lower.includes("429")) {
        res.status(429).json({
          error: "Permintaan AI sedang padat sementara. Tunggu sebentar atau geser titik ukur manual di layar.",
        });
        return;
      }
      res.status(502).json({
        error: "Gagal menganalisis gambar dengan AI. Geser titik ukur (1 & 2) langsung di layar.",
      });
    }
  });

  // 1. TIMO AI Assistant Chat Endpoint (OpenRouter.ai - NVIDIA Nemotron 3.5 Super VL Free)
  app.post("/api/timo-chat", async (req: Request, res: Response) => {
    try {
      const body = req.body as { message?: unknown; history?: unknown };
      const message = typeof body?.message === "string" ? body.message.trim() : "";

      if (!message) {
        res.status(400).json({ error: "Pesan pertanyaan tidak boleh kosong." });
        return;
      }
      if (message.length > 1500) {
        res.status(400).json({ error: "Pertanyaan maksimal 1.500 karakter." });
        return;
      }

      const rawHistory = Array.isArray(body?.history) ? body.history : [];
      const sanitizedHistory: ChatHistoryItem[] = rawHistory
        .filter(
          (item): item is ChatHistoryItem =>
            Boolean(item) &&
            (item.role === "user" || item.role === "model") &&
            typeof item.text === "string" &&
            item.text.trim().length > 0
        )
        .slice(-10);

      const messages: OpenRouterMessage[] = [
        { role: "system", content: TIMO_SYSTEM_INSTRUCTION },
        ...sanitizedHistory.map((item) => ({
          role: (item.role === "model" ? "assistant" : "user") as "user" | "assistant",
          content: item.text.trim(),
        })),
        { role: "user", content: message },
      ];

      const refererHeader =
        typeof req.headers.origin === "string"
          ? req.headers.origin
          : typeof req.headers.referer === "string"
          ? req.headers.referer
          : undefined;

      const reply = await callOpenRouterChat(messages, {
        referer: refererHeader,
        temperature: 0.6,
        maxTokens: 1400,
      });

      if (!reply) {
        res.status(502).json({
          error: "TIMO AI tidak mengembalikan jawaban. Silakan coba ajukan pertanyaan kembali.",
        });
        return;
      }

      res.json({ reply, sources: [] });
    } catch (err) {
      console.error("[/api/timo-chat error]:", err);
      const parsed = parseOpenRouterError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 2. Real Up-to-Date Bagan & Fish Catch Articles Endpoint (Bing/Google News RSS + OpenRouter Trend Summary)
  app.get("/api/bagan-articles", async (req: Request, res: Response) => {
    try {
      const rawTopic = typeof req.query.topic === "string" ? req.query.topic : "semua";
      const topicKey = TOPIC_CONFIG[rawTopic] ? rawTopic : "semua";
      const forceRefresh = req.query.refresh === "1";

      const cached = articlesCache.get(topicKey);
      if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
        res.json({
          topic: topicKey,
          topicLabel: TOPIC_CONFIG[topicKey].label,
          fetchedAt: cached.fetchedAt,
          overview: cached.overview,
          articles: cached.articles,
          cached: true,
        });
        return;
      }

      const topicInfo = TOPIC_CONFIG[topicKey];
      let articles: BaganArticle[] = [];
      try {
        articles = await fetchRealBingNewsArticles(topicInfo.label, topicInfo.bingQuery);
      } catch {
        articles = [];
      }

      if (articles.length < 3) {
        articles = await fetchRealGoogleNewsArticles(
          topicKey,
          topicInfo.label,
          topicInfo.rssQuery
        );
      }

      if (articles.length === 0) {
        res.status(502).json({
          error: "Belum ada artikel terbaru yang ditemukan dari sumber berita saat ini. Coba muat ulang.",
        });
        return;
      }

      const enriched = await enrichArticlesWithOpenRouter(topicInfo.label, articles);
      const enrichedArticles = articles.map((article, idx) => ({
        ...article,
        summary: enriched.summaries[idx] || article.summary,
      }));
      const overview =
        enriched.overview ||
        `Menampilkan ${enrichedArticles.length} artikel berita terbaru seputar ${topicInfo.label.toLowerCase()} dari media nasional dan daerah Indonesia.`;

      const entry: CachedArticlesEntry = {
        fetchedAt: new Date().toISOString(),
        expiresAt: Date.now() + ARTICLE_CACHE_TTL_MS,
        overview,
        articles: enrichedArticles,
      };
      articlesCache.set(topicKey, entry);

      res.json({
        topic: topicKey,
        topicLabel: topicInfo.label,
        fetchedAt: entry.fetchedAt,
        overview: entry.overview,
        articles: entry.articles,
        cached: false,
      });
    } catch (err) {
      console.error("[/api/bagan-articles error]:", err);
      res.status(500).json({
        error: "Terjadi gangguan saat memuat artikel berita terbaru. Silakan coba muat ulang.",
      });
    }
  });

  // 3. Real Ocean Current & Wave Telemetry Endpoint (Open-Meteo Marine API)
  const MARINE_STATIONS: Record<
    string,
    { label: string; lat: number; lon: number }
  > = {
    karangantu: {
      label: "Teluk Banten · Karangantu, Serang",
      lat: -5.92,
      lon: 106.16,
    },
    anyer: {
      label: "Selat Sunda · Anyer, Banten",
      lat: -6.08,
      lon: 105.83,
    },
    muara_angke: {
      label: "Teluk Jakarta · Muara Angke",
      lat: -5.95,
      lon: 106.75,
    },
    indramayu: {
      label: "Laut Jawa · Eretan, Indramayu",
      lat: -6.18,
      lon: 108.35,
    },
  };

  interface MarinePayload {
    region: string;
    stationLabel: string;
    latitude: number;
    longitude: number;
    observedAt: string;
    fetchedAt: string;
    waveHeightM: number;
    waveDirectionDeg: number;
    wavePeriodSec: number;
    windWaveHeightM: number;
    swellWaveHeightM: number;
    currentVelocityKmh: number;
    currentVelocityMs: number;
    currentDirectionDeg: number;
    seaSurfaceTempC: number;
    seaState: "calm" | "moderate" | "rough";
    recommendedNoiseAmpKg: number;
    source: string;
  }

  const MARINE_CACHE_TTL_MS = 5 * 60 * 1000;
  const marineCache = new Map<
    string,
    { expiresAt: number; data: MarinePayload }
  >();
  const inFlightMarine = new Map<
    string,
    Promise<{ payload: MarinePayload; cached: boolean }>
  >();

  async function fetchAndCacheMarine(
    rawRegion: string,
    forceRefresh = false
  ): Promise<{ payload: MarinePayload; cached: boolean }> {
    const stationKey = MARINE_STATIONS[rawRegion] ? rawRegion : "karangantu";
    const station = MARINE_STATIONS[stationKey];

    const cached = marineCache.get(stationKey);
    if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
      return { payload: cached.data, cached: true };
    }

    const existingPromise = !forceRefresh ? inFlightMarine.get(stationKey) : undefined;
    if (existingPromise) {
      return existingPromise;
    }

    const task = (async (): Promise<{ payload: MarinePayload; cached: boolean }> => {
      try {
        const apiUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
        apiUrl.searchParams.set("latitude", String(station.lat));
        apiUrl.searchParams.set("longitude", String(station.lon));
        apiUrl.searchParams.set(
          "current",
          "wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature,wind_wave_height,swell_wave_height"
        );
        apiUrl.searchParams.set("timezone", "Asia/Jakarta");

        const response = await fetchWithRetry(apiUrl.toString(), {
          timeoutMs: 8500,
          retries: 2,
        });

        if (!response.ok) {
          throw new Error(`Open-Meteo Marine HTTP ${response.status}`);
        }

    const raw = (await response.json()) as {
      latitude?: number;
      longitude?: number;
      current?: {
        time?: string;
        wave_height?: number | null;
        wave_direction?: number | null;
        wave_period?: number | null;
        ocean_current_velocity?: number | null;
        ocean_current_direction?: number | null;
        sea_surface_temperature?: number | null;
        wind_wave_height?: number | null;
        swell_wave_height?: number | null;
      };
    };

    const cur = raw.current ?? {};
    const waveHeightM =
      typeof cur.wave_height === "number" ? cur.wave_height : 0.25;
    const waveDirectionDeg =
      typeof cur.wave_direction === "number" ? cur.wave_direction : 180;
    const wavePeriodSec =
      typeof cur.wave_period === "number" && cur.wave_period > 0
        ? cur.wave_period
        : 6.5;
    const windWaveHeightM =
      typeof cur.wind_wave_height === "number"
        ? cur.wind_wave_height
        : parseFloat((waveHeightM * 0.35).toFixed(2));
    const swellWaveHeightM =
      typeof cur.swell_wave_height === "number"
        ? cur.swell_wave_height
        : parseFloat((waveHeightM * 0.65).toFixed(2));
    const currentVelocityKmh =
      typeof cur.ocean_current_velocity === "number"
        ? cur.ocean_current_velocity
        : 1.1;
    const currentVelocityMs = parseFloat(
      (currentVelocityKmh / 3.6).toFixed(2)
    );
    const currentDirectionDeg =
      typeof cur.ocean_current_direction === "number"
        ? cur.ocean_current_direction
        : 120;
    const seaSurfaceTempC =
      typeof cur.sea_surface_temperature === "number"
        ? cur.sea_surface_temperature
        : 29.8;

    const seaState: "calm" | "moderate" | "rough" =
      waveHeightM >= 0.7 || currentVelocityMs >= 0.85
        ? "rough"
        : waveHeightM < 0.25 && currentVelocityMs < 0.35
        ? "calm"
        : "moderate";

    // Hydrodynamic tension disturbance (kgf) on single bagan lift rope:
    // Combines current drag fluctuation (0.5 * rho * Cd * A * v^2 / g) + wave heave
    const dragForceKg =
      (0.5 * 1025 * 1.1 * 0.42 * currentVelocityMs * currentVelocityMs) /
      9.80665;
    const heaveKg = waveHeightM * 4.2 + windWaveHeightM * 2.4;
    const recommendedNoiseAmpKg = parseFloat(
      Math.max(0.6, Math.min(6.5, dragForceKg * 0.35 + heaveKg)).toFixed(2)
    );

    const payload: MarinePayload = {
      region: stationKey,
      stationLabel: station.label,
      latitude: raw.latitude ?? station.lat,
      longitude: raw.longitude ?? station.lon,
      observedAt: cur.time ?? new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      waveHeightM: parseFloat(waveHeightM.toFixed(2)),
      waveDirectionDeg: Math.round(waveDirectionDeg),
      wavePeriodSec: parseFloat(wavePeriodSec.toFixed(2)),
      windWaveHeightM: parseFloat(windWaveHeightM.toFixed(2)),
      swellWaveHeightM: parseFloat(swellWaveHeightM.toFixed(2)),
      currentVelocityKmh: parseFloat(currentVelocityKmh.toFixed(2)),
      currentVelocityMs,
      currentDirectionDeg: Math.round(currentDirectionDeg),
      seaSurfaceTempC: parseFloat(seaSurfaceTempC.toFixed(1)),
      seaState,
      recommendedNoiseAmpKg,
      source: "Open-Meteo Marine API (ECMWF / Copernicus Live)",
    };

        marineCache.set(stationKey, {
          expiresAt: Date.now() + MARINE_CACHE_TTL_MS,
          data: payload,
        });

        return { payload, cached: false };
      } catch (err) {
        const stale = marineCache.get(stationKey);
        if (stale) {
          console.warn(
            `[Open-Meteo Marine fallback] Menggunakan cache terakhir untuk ${stationKey}:`,
            err instanceof Error ? err.message : String(err)
          );
          return { payload: stale.data, cached: true };
        }
        console.warn(
          `[Open-Meteo Marine fallback] Koneksi timeout untuk ${stationKey}, memakai baseline pesisir sementara:`,
          err instanceof Error ? err.message : String(err)
        );
        const nowIso = new Date().toISOString();
        const fallbackPayload: MarinePayload = {
          region: stationKey,
          stationLabel: station.label,
          latitude: station.lat,
          longitude: station.lon,
          observedAt: nowIso,
          fetchedAt: nowIso,
          waveHeightM: 0.35,
          waveDirectionDeg: 185,
          wavePeriodSec: 6.2,
          windWaveHeightM: 0.14,
          swellWaveHeightM: 0.21,
          currentVelocityKmh: 1.05,
          currentVelocityMs: 0.29,
          currentDirectionDeg: 120,
          seaSurfaceTempC: 29.6,
          seaState: "moderate",
          recommendedNoiseAmpKg: 1.85,
          source: "Baseline Pesisir Jawa-Banten (Menunggu Sinkronisasi Open-Meteo)",
        };
        return { payload: fallbackPayload, cached: false };
      }
    })();

    inFlightMarine.set(stationKey, task);
    try {
      return await task;
    } finally {
      inFlightMarine.delete(stationKey);
    }
  }

  app.get("/api/marine-conditions", async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      const rawRegion =
        typeof req.query.region === "string" ? req.query.region : "karangantu";
      const forceRefresh = req.query.refresh === "1";
      const includeAll = req.query.all === "1";

      if (includeAll) {
        const stationKeys = Object.keys(MARINE_STATIONS);
        const results = await Promise.all(
          stationKeys.map((key) => fetchAndCacheMarine(key, forceRefresh))
        );
        const stations: Record<string, MarinePayload & { cached: boolean }> = {};
        for (const item of results) {
          stations[item.payload.region] = {
            ...item.payload,
            cached: item.cached,
          };
        }
        const selectedKey = MARINE_STATIONS[rawRegion] ? rawRegion : "karangantu";
        res.json({
          ...stations[selectedKey],
          stations,
        });
        return;
      }

      const { payload, cached } = await fetchAndCacheMarine(
        rawRegion,
        forceRefresh
      );
      res.json({ ...payload, cached });
    } catch (err) {
      console.error("[/api/marine-conditions error]:", err);
      res.status(502).json({
        error:
          "Gagal mengambil data arus & gelombang laut langsung dari Open-Meteo Marine.",
      });
    }
  });

  // 4. Meteorology, Climatology (14-Day Time Series), Lunar Phase & AI Decision Support
  interface DailyForecastPoint {
    date: string;
    isFuture: boolean;
    windSpeedMaxKmh: number;
    windSpeedMaxKnots: number;
    windGustsMaxKmh: number;
    precipitationMm: number;
    waveHeightMaxM: number;
    wavePeriodMaxSec: number;
    weatherCode: number;
  }

  interface EcosystemIntelPayload {
    region: string;
    stationLabel: string;
    fetchedAt: string;
    weather: {
      observedAt: string;
      airTempC: number;
      windSpeedKmh: number;
      windSpeedKnots: number;
      windGustsKmh: number;
      windDirectionDeg: number;
      precipitationMm: number;
      cloudCoverPct: number;
      pressureHpa: number;
      weatherCode: number;
      weatherLabel: string;
    };
    marine: MarinePayload;
    lunar: {
      phaseName: string;
      ageDays: number;
      illuminationPct: number;
      attractantEfficiency: "Sangat Optimal" | "Cukup Efektif" | "Kurang Efektif";
      fishermanNote: string;
    };
    climatology: {
      seasonName: string;
      seasonCharacteristic: string;
      sstStatus: "Normal" | "Hangat (Waspada Ekosistem)" | "Dingin / Upwelling";
      sstNote: string;
    };
    aiDecision: {
      score: number;
      status: "LAYAK OPERASI" | "WASPADA CUACA" | "TUNDA MELAUT";
      summaryForFisherman: string;
      reasons: string[];
    };
    dailyTimeSeries: DailyForecastPoint[];
    sources: string[];
  }

  const ecosystemCache = new Map<
    string,
    { expiresAt: number; data: EcosystemIntelPayload }
  >();
  const inFlightEcosystem = new Map<string, Promise<EcosystemIntelPayload>>();

  function describeWmoCode(code: number): string {
    if (code === 0) return "Cerah";
    if (code <= 3) return "Cerah Berawan";
    if (code <= 48) return "Kabut Laut / Berawan";
    if (code <= 57) return "Gerimis Ringan";
    if (code <= 67) return "Hujan Sedang";
    if (code <= 82) return "Hujan Lebat";
    if (code >= 95) return "Badai Petir & Angin Kencang";
    return "Berawan";
  }

  function computeLunarPhase(dateObj: Date) {
    const synodicMonth = 29.53058867;
    const knownNewMoonMs = Date.UTC(2000, 0, 6, 18, 14, 0);
    const diffDays = (dateObj.getTime() - knownNewMoonMs) / 86400000;
    const ageDays = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const phaseAngle = (2 * Math.PI * ageDays) / synodicMonth;
    const illuminationPct = Math.round(((1 - Math.cos(phaseAngle)) / 2) * 100);

    let phaseName = "Bulan Sabit Awal";
    if (ageDays < 1.8 || ageDays > 27.7) phaseName = "Bulan Baru (Gelap Total)";
    else if (ageDays < 6.4) phaseName = "Bulan Sabit Awal";
    else if (ageDays < 8.4) phaseName = "Kuartal Awal";
    else if (ageDays < 13.5) phaseName = "Cembung Awal";
    else if (ageDays < 16.0) phaseName = "Bulan Purnama";
    else if (ageDays < 21.2) phaseName = "Cembung Akhir";
    else if (ageDays < 23.2) phaseName = "Kuartal Akhir";
    else phaseName = "Bulan Sabit Akhir";

    let attractantEfficiency: "Sangat Optimal" | "Cukup Efektif" | "Kurang Efektif" = "Cukup Efektif";
    let fishermanNote = "Cahaya bulan sedang; lampu atraktan bagan cukup efektif mengumpulkan ikan teri.";
    if (illuminationPct <= 30) {
      attractantEfficiency = "Sangat Optimal";
      fishermanNote = "Langit malam gelap (bulan mati/sabit) membuat sinar lampu bagan sangat kontras dan efektif memikat gerombolan ikan.";
    } else if (illuminationPct >= 75) {
      attractantEfficiency = "Kurang Efektif";
      fishermanNote = "Cahaya bulan terang/purnama menyaingi sinar lampu bagan, sehingga konsentrasi ikan di bawah jaring cenderung lebih menyebar.";
    }

    return {
      phaseName,
      ageDays: parseFloat(ageDays.toFixed(1)),
      illuminationPct,
      attractantEfficiency,
      fishermanNote,
    };
  }

  function computeMonsoonSeason(monthIndexZero: number, sstC: number) {
    // Indonesia / Laut Jawa & Selat Sunda climatology
    let seasonName = "Muson Barat (Musim Hujan)";
    let seasonCharacteristic = "Angin dominan dari Barat–Barat Laut disertai potensi gelombang lebih tinggi dan curah hujan pantai.";
    if (monthIndexZero >= 2 && monthIndexZero <= 4) {
      seasonName = "Peralihan I (Beralih ke Timur)";
      seasonCharacteristic = "Arah angin berubah-ubah dengan perairan relatif lebih tenang di pagi/malam, namun waspada awan konvektif mendadak.";
    } else if (monthIndexZero >= 5 && monthIndexZero <= 7) {
      seasonName = "Muson Timur (Musim Kemarau)";
      seasonCharacteristic = "Angin Tenggara–Timur cenderung kering dan relatif stabil; umumnya periode aktif penangkapan ikan pelagis kecil.";
    } else if (monthIndexZero >= 8 && monthIndexZero <= 10) {
      seasonName = "Peralihan II (Menuju Muson Barat)";
      seasonCharacteristic = "Masa transisi angin dari Timur ke Barat dengan suhu laut hangat dan potensi angin kencang lokal di sore/malam hari.";
    }

    let sstStatus: "Normal" | "Hangat (Waspada Ekosistem)" | "Dingin / Upwelling" = "Normal";
    let sstNote = `Suhu permukaan laut ${sstC.toFixed(1)}°C berada dalam kisaran normal perairan pesisir Jawa–Banten (28–31°C).`;
    if (sstC >= 31.6) {
      sstStatus = "Hangat (Waspada Ekosistem)";
      sstNote = `SST ${sstC.toFixed(1)}°C tergolong hangat; perlu pengawasan potensi stres termal terumbu pesisir & pergeseran lapisan oksigen.`;
    } else if (sstC <= 26.5) {
      sstStatus = "Dingin / Upwelling";
      sstNote = `SST ${sstC.toFixed(1)}°C lebih sejuk dari rata-rata, sering berkorelasi dengan naiknya nutrien perairan.`;
    }

    return { seasonName, seasonCharacteristic, sstStatus, sstNote };
  }

  async function fetchAndCacheEcosystem(
    rawRegion: string,
    forceRefresh = false
  ): Promise<EcosystemIntelPayload> {
    const stationKey = MARINE_STATIONS[rawRegion] ? rawRegion : "karangantu";
    const station = MARINE_STATIONS[stationKey];

    const cached = ecosystemCache.get(stationKey);
    if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const existingPromise = !forceRefresh ? inFlightEcosystem.get(stationKey) : undefined;
    if (existingPromise) {
      return existingPromise;
    }

    const task = (async (): Promise<EcosystemIntelPayload> => {
      const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
      weatherUrl.searchParams.set("latitude", String(station.lat));
      weatherUrl.searchParams.set("longitude", String(station.lon));
      weatherUrl.searchParams.set(
        "current",
        "temperature_2m,precipitation,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code"
      );
      weatherUrl.searchParams.set(
        "daily",
        "weather_code,wind_speed_10m_max,wind_gusts_10m_max,precipitation_sum"
      );
      weatherUrl.searchParams.set("past_days", "7");
      weatherUrl.searchParams.set("forecast_days", "7");
      weatherUrl.searchParams.set("timezone", "Asia/Jakarta");

      const marineDailyUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
      marineDailyUrl.searchParams.set("latitude", String(station.lat));
      marineDailyUrl.searchParams.set("longitude", String(station.lon));
      marineDailyUrl.searchParams.set("daily", "wave_height_max,wave_period_max");
      marineDailyUrl.searchParams.set("past_days", "7");
      marineDailyUrl.searchParams.set("forecast_days", "7");
      marineDailyUrl.searchParams.set("timezone", "Asia/Jakarta");

      const [marineRes, weatherRes, marineDailyRes] = await Promise.allSettled([
        fetchAndCacheMarine(stationKey, forceRefresh),
        fetchWithRetry(weatherUrl.toString(), { timeoutMs: 8500, retries: 2 }),
        fetchWithRetry(marineDailyUrl.toString(), { timeoutMs: 8500, retries: 1 }),
      ]);

      const marinePayload =
        marineRes.status === "fulfilled"
          ? marineRes.value.payload
          : (await fetchAndCacheMarine(stationKey, false)).payload;

      let wRaw: {
        current?: Record<string, number | string>;
        daily?: {
          time?: string[];
          weather_code?: number[];
          wind_speed_10m_max?: number[];
          wind_gusts_10m_max?: number[];
          precipitation_sum?: number[];
        };
      } | null = null;

      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        wRaw = (await weatherRes.value.json()) as typeof wRaw;
      } else {
        const reason =
          weatherRes.status === "rejected"
            ? weatherRes.reason instanceof Error
              ? weatherRes.reason.message
              : String(weatherRes.reason)
            : `HTTP ${weatherRes.value.status}`;
        console.warn(`[Open-Meteo Weather fallback] ${stationKey}: ${reason}`);

        const staleEco = ecosystemCache.get(stationKey);
        if (staleEco && !forceRefresh) {
          return {
            ...staleEco.data,
            marine: marinePayload,
            fetchedAt: new Date().toISOString(),
          };
        }
      }

      const mDailyRaw =
        marineDailyRes.status === "fulfilled" && marineDailyRes.value.ok
          ? ((await marineDailyRes.value.json()) as {
              daily?: {
                time?: string[];
                wave_height_max?: number[];
                wave_period_max?: number[];
              };
            })
          : { daily: undefined };

      const weatherLive = Boolean(wRaw);
      const fallbackDates: string[] = [];
      if (!wRaw) {
        const baseMs = Date.now();
        for (let offset = -7; offset <= 6; offset++) {
          fallbackDates.push(new Date(baseMs + offset * 86400000).toISOString().slice(0, 10));
        }
        wRaw = {
          current: {
            time: new Date().toISOString(),
            temperature_2m: 28.8,
            wind_speed_10m: 10.2,
            wind_gusts_10m: 15.0,
            wind_direction_10m: 165,
            precipitation: 0,
            cloud_cover: 42,
            surface_pressure: 1010,
            weather_code: 2,
          },
          daily: {
            time: fallbackDates,
            weather_code: fallbackDates.map(() => 2),
            wind_speed_10m_max: fallbackDates.map((_, i) =>
              parseFloat((10.5 + Math.sin(i * 0.7) * 2.2).toFixed(1))
            ),
            wind_gusts_10m_max: fallbackDates.map((_, i) =>
              parseFloat((15.5 + Math.sin(i * 0.7) * 3.0).toFixed(1))
            ),
            precipitation_sum: fallbackDates.map(() => 0.4),
          },
        };
      }

    const curW = wRaw.current ?? {};
    const windKmh = Number(curW.wind_speed_10m ?? 9.5);
    const windKnots = parseFloat((windKmh / 1.852).toFixed(1));
    const gustsKmh = Number(curW.wind_gusts_10m ?? windKmh * 1.4);
    const precipMm = Number(curW.precipitation ?? 0);
    const weatherCode = Number(curW.weather_code ?? 1);

    const lunar = computeLunarPhase(new Date());
    const climatology = computeMonsoonSeason(
      new Date().getUTCMonth(),
      marinePayload.seaSurfaceTempC
    );

    // Build 14-day unified time series (past 7 days + today + forecast 6 days)
    const dates = wRaw.daily?.time ?? [];
    const todayIso = new Date().toISOString().slice(0, 10);
    const dailyTimeSeries: DailyForecastPoint[] = dates.map((d, idx) => {
      const wMaxKmh = Number(wRaw.daily?.wind_speed_10m_max?.[idx] ?? 10);
      const gMaxKmh = Number(wRaw.daily?.wind_gusts_10m_max?.[idx] ?? wMaxKmh * 1.3);
      const pSum = Number(wRaw.daily?.precipitation_sum?.[idx] ?? 0);
      const wCode = Number(wRaw.daily?.weather_code?.[idx] ?? 1);
      const mIdx = mDailyRaw.daily?.time?.indexOf(d) ?? idx;
      const waveMax = Number(mDailyRaw.daily?.wave_height_max?.[mIdx] ?? marinePayload.waveHeightM);
      const periodMax = Number(mDailyRaw.daily?.wave_period_max?.[mIdx] ?? marinePayload.wavePeriodSec);
      return {
        date: d,
        isFuture: d > todayIso,
        windSpeedMaxKmh: parseFloat(wMaxKmh.toFixed(1)),
        windSpeedMaxKnots: parseFloat((wMaxKmh / 1.852).toFixed(1)),
        windGustsMaxKmh: parseFloat(gMaxKmh.toFixed(1)),
        precipitationMm: parseFloat(pSum.toFixed(1)),
        waveHeightMaxM: parseFloat(waveMax.toFixed(2)),
        wavePeriodMaxSec: parseFloat(periodMax.toFixed(1)),
        weatherCode: wCode,
      };
    });

    // AI Decision Support System Scoring (Safety + Ocean Drag + Light-Fishing Efficiency)
    let score = 100;
    const reasons: string[] = [];

    if (marinePayload.waveHeightM >= 1.1) {
      score -= 48;
      reasons.push(`Tinggi gelombang ${marinePayload.waveHeightM.toFixed(2)} m berisiko tinggi bagi struktur bagan tancap.`);
    } else if (marinePayload.waveHeightM >= 0.65) {
      score -= 22;
      reasons.push(`Ombak sedang-tinggi (${marinePayload.waveHeightM.toFixed(2)} m); aktifkan filter MA-15 lebih rapat.`);
    } else {
      reasons.push(`Tinggi ombak ${marinePayload.waveHeightM.toFixed(2)} m relatif aman untuk penebaran jaring.`);
    }

    if (windKnots >= 18 || gustsKmh >= 42) {
      score -= 35;
      reasons.push(`Angin kencang ${windKnots} knot (embusan ${gustsKmh.toFixed(0)} km/j) membahayakan atap dan penarikan jaring.`);
    } else if (windKnots >= 12) {
      score -= 14;
      reasons.push(`Angin cukup terasa (${windKnots} knot); perhatikan stabilitas tali katrol.`);
    } else {
      reasons.push(`Angin tenang (${windKnots} knot), aman bagi aktivitas di anjungan bagan.`);
    }

    if (marinePayload.currentVelocityMs >= 0.75) {
      score -= 15;
      reasons.push(`Arus laut kuat (${marinePayload.currentVelocityMs.toFixed(2)} m/s) dapat menyeret kantong jaring.`);
    } else {
      reasons.push(`Arus laut ${marinePayload.currentVelocityMs.toFixed(2)} m/s masih terkendali untuk posisi jaring.`);
    }

    if (precipMm >= 4 || weatherCode >= 95) {
      score -= 22;
      reasons.push("Potensi hujan lebat/badai petir; hindari pengoperasian listrik di anjungan terbuka.");
    }

    if (lunar.illuminationPct >= 75) {
      score -= 12;
      reasons.push(`Cahaya bulan ${lunar.illuminationPct}% (${lunar.phaseName}) menurunkan daya pikat lampu bagan.`);
    } else if (lunar.illuminationPct <= 30) {
      score = Math.min(100, score + 4);
      reasons.push(`Fase ${lunar.phaseName} (${lunar.illuminationPct}%) sangat mendukung efektivitas lampu atraktan.`);
    }

    score = Math.max(5, Math.min(99, Math.round(score)));
    const status: "LAYAK OPERASI" | "WASPADA CUACA" | "TUNDA MELAUT" =
      score >= 70 ? "LAYAK OPERASI" : score >= 45 ? "WASPADA CUACA" : "TUNDA MELAUT";

    const summaryForFisherman =
      status === "LAYAK OPERASI"
        ? `Kondisi perairan ${station.label} tergolong aman & mendukung untuk menurunkan jaring malam ini.`
        : status === "WASPADA CUACA"
        ? `Operasi masih memungkinkan dengan kewaspadaan ekstra pada angin/ombak serta pemantauan tarikan tali.`
        : `Disarankan menunda melaut sementara karena kombinasi gelombang, angin, atau hujan berisiko tinggi.`;

    const ecoPayload: EcosystemIntelPayload = {
      region: stationKey,
      stationLabel: station.label,
      fetchedAt: new Date().toISOString(),
      weather: {
        observedAt: String(curW.time ?? new Date().toISOString()),
        airTempC: parseFloat(Number(curW.temperature_2m ?? 29).toFixed(1)),
        windSpeedKmh: parseFloat(windKmh.toFixed(1)),
        windSpeedKnots: windKnots,
        windGustsKmh: parseFloat(gustsKmh.toFixed(1)),
        windDirectionDeg: Math.round(Number(curW.wind_direction_10m ?? 180)),
        precipitationMm: parseFloat(precipMm.toFixed(1)),
        cloudCoverPct: Math.round(Number(curW.cloud_cover ?? 40)),
        pressureHpa: Math.round(Number(curW.surface_pressure ?? 1010)),
        weatherCode,
        weatherLabel: describeWmoCode(weatherCode),
      },
      marine: marinePayload,
      lunar,
      climatology,
      aiDecision: {
        score,
        status,
        summaryForFisherman,
        reasons,
      },
      dailyTimeSeries,
      sources: [
        marinePayload.source,
        weatherLive
          ? "Open-Meteo Weather Forecast API"
          : "Baseline Cuaca Pesisir (Koneksi Open-Meteo Timeout Sementara)",
        "Perhitungan Fase Bulan Astronomis & Klimatologi Muson Indonesia",
      ],
    };

      // Cache longer if live weather succeeded; short 45s TTL if degraded so next refresh recovers quickly
      ecosystemCache.set(stationKey, {
        expiresAt: Date.now() + (weatherLive ? MARINE_CACHE_TTL_MS : 45 * 1000),
        data: ecoPayload,
      });

      return ecoPayload;
    })();

    inFlightEcosystem.set(stationKey, task);
    try {
      return await task;
    } finally {
      inFlightEcosystem.delete(stationKey);
    }
  }

  app.get("/api/ecosystem-intel", async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      const rawRegion =
        typeof req.query.region === "string" ? req.query.region : "karangantu";
      const forceRefresh = req.query.refresh === "1";
      const data = await fetchAndCacheEcosystem(rawRegion, forceRefresh);
      res.json(data);
    } catch (err) {
      console.error("[/api/ecosystem-intel error]:", err);
      res.status(502).json({
        error: "Gagal memuat data meteorologi & oseanografi real-time.",
      });
    }
  });

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BAGANOVA full-stack server listening on http://0.0.0.0:${PORT}`);
    // Pre-warm primary station first, then stagger remaining stations to avoid upstream connection bursts
    void (async () => {
      await Promise.allSettled([
        fetchAndCacheMarine("karangantu", false),
        fetchAndCacheEcosystem("karangantu", false),
      ]);
      for (const key of Object.keys(MARINE_STATIONS)) {
        if (key === "karangantu") continue;
        await new Promise((r) => setTimeout(r, 350));
        await fetchAndCacheMarine(key, false).catch(() => null);
      }
    })();
  });
}

startServer().catch((err) => {
  console.error("Failed to start BAGANOVA server:", err);
  process.exit(1);
});
