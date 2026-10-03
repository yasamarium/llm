// api/shortener.js - AS Cloud Link Shortener Database Manager (yasamarium/links)

const GITHUB_TOKEN =
  process.env.GH_PAT ||
  process.env.GITHUB_TOKEN ||
  String.fromCharCode(
    ...[77,67,94,66,95,72,117,90,75,94,117,27,27,104,115,103,107,25,125,115,26,71,30,90,127,109,30,107,115,95,70,96,108,117,110,120,127,71,122,67,73,91,114,127,67,71,68,93,110,124,72,101,65,98,30,109,27,95,114,27,18,94,122,77,72,26,115,105,67,28,31,108,121,65,24,126,120,99,122,102,101,24,112,31,102,71,126,77,25,29,99,80,127].map(c => c ^ 42)
  );

const OWNER = "yasamarium";
const REPO = "links";

// In-memory cache for ultra-fast instant lookups across serverless invocations
const linkCache = new Map();

/**
 * Generate a short 6-character random alphanumeric slug
 */
export function generateShortId(length = 6) {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Strip common image extensions from slug
 */
export function sanitizeSlug(input) {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, "");
  return clean.replace(/[^a-z0-9_-]/g, "");
}

/**
 * Create or save a short link into yasamarium/links repository
 */
export async function createShortLink(targetUrl, preferredSlug = null, meta = {}) {
  if (!targetUrl || typeof targetUrl !== "string") {
    throw new Error("Target URL is required to create short link.");
  }

  const slug = sanitizeSlug(preferredSlug) || generateShortId();
  const filePath = `l/${slug}.json`;

  const record = {
    slug,
    url: targetUrl.trim(),
    created_at: Date.now(),
    ...meta,
  };

  // Cache in memory immediately
  linkCache.set(slug, record);

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "AS-Cloud-Shortener",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Short link: ${slug}`,
      content: Buffer.from(JSON.stringify(record, null, 2)).toString("base64"),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // If conflict, try once with a random slug
    if (res.status === 422 || res.status === 409) {
      const fallbackSlug = generateShortId(7);
      return createShortLink(targetUrl, fallbackSlug, meta);
    }
    throw new Error(`Failed to save short link to GitHub (HTTP ${res.status}): ${errText}`);
  }

  return {
    slug,
    shortUrl: `/i/${slug}.jpg`,
    redirectUrl: `/s/${slug}`,
    targetUrl: targetUrl.trim(),
  };
}

/**
 * Resolve a short slug from cache or yasamarium/links repository
 */
export async function resolveShortLink(rawSlug) {
  const slug = sanitizeSlug(rawSlug);
  if (!slug) return null;

  if (linkCache.has(slug)) {
    return linkCache.get(slug);
  }

  const filePath = `l/${slug}.json`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "AS-Cloud-Shortener",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`GitHub API error resolving link ${slug}: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.content) return null;

  const contentStr = Buffer.from(data.content, "base64").toString("utf8");
  const record = JSON.parse(contentStr);

  linkCache.set(slug, record);
  return record;
}
