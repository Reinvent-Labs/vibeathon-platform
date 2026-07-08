import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_CONTENT } from "@/lib/cms-defaults";

export type SiteContent = typeof DEFAULT_SITE_CONTENT;

let cache: { data: Record<string, string>; at: number } | null = null;
const CACHE_TTL = 60_000; // 60 s

export async function getSiteContent(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;

  let overrides: Record<string, string> = {};
  if (prisma) {
    try {
      const rows = await prisma.siteContent.findMany();
      overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch {
      // DB unavailable — fall back to defaults silently
    }
  }

  const data = { ...DEFAULT_SITE_CONTENT, ...overrides };
  cache = { data, at: Date.now() };
  return data;
}

/** Read a single key with fallback (no DB call — use after getSiteContent()). */
export function get(
  content: Record<string, string>,
  key: string,
  fallback = "",
): string {
  return content[key] ?? DEFAULT_SITE_CONTENT[key] ?? fallback;
}

/** Parse a newline-separated list value into an array. */
export function getList(
  content: Record<string, string>,
  key: string,
  fallback: string[] = [],
): string[] {
  const raw = content[key] ?? DEFAULT_SITE_CONTENT[key];
  if (!raw) return fallback;
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Invalidate the in-process cache (called after admin saves content). */
export function invalidateSiteContentCache() {
  cache = null;
}
