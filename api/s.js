// api/s.js - AS Cloud Short URL Redirector & Link Creator (/s/:id)
import { resolveShortLink, sanitizeSlug, createShortLink } from "./shortener.js";

export const config = {
  maxDuration: 45,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle Link Creation POST
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { url, slug, title } = body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Destination URL is required." });
      }

      const result = await createShortLink(url, slug, { title: title || "" });
      return res.status(200).json({
        success: true,
        slug: result.slug,
        targetUrl: result.targetUrl,
        redirectUrl: `/s/${result.slug}`,
        shortUrl: `/s/${result.slug}`
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to create short link." });
    }
  }

  // Handle List Query
  if (req.query.list === "1" || req.query.action === "list") {
    try {
      const dbRes = await fetch("https://raw.githubusercontent.com/yasamarium/cloudgame-db-sessions/main/data/links.json?t=" + Date.now(), { cache: "no-cache" });
      if (dbRes.ok) {
        const links = await dbRes.json();
        return res.status(200).json(Array.isArray(links) ? links : []);
      }
    } catch (e) {}
    return res.status(200).json([]);
  }

  const rawId = req.query.id || req.query.slug;
  if (!rawId || typeof rawId !== "string") {
    return res.status(400).json({ error: "Short ID is required." });
  }

  const cleanSlug = sanitizeSlug(rawId);
  if (!cleanSlug) {
    return res.status(400).json({ error: "Invalid short ID." });
  }

  try {
    // 1. Try local cache / links repo
    let linkRecord = null;
    try {
      linkRecord = await resolveShortLink(cleanSlug);
    } catch (e) {}

    // 2. Fallback check in cloudgame-db-sessions data/links.json
    if (!linkRecord || !linkRecord.url) {
      try {
        const dbRes = await fetch("https://raw.githubusercontent.com/yasamarium/cloudgame-db-sessions/main/data/links.json?t=" + Date.now(), { cache: "no-cache" });
        if (dbRes.ok) {
          const links = await dbRes.json();
          if (Array.isArray(links)) {
            const found = links.find(l => l.slug && l.slug.toLowerCase() === cleanSlug.toLowerCase());
            if (found && found.url) {
              linkRecord = found;
            }
          }
        }
      } catch (e) {}
    }

    if (!linkRecord || !linkRecord.url) {
      return res.status(404).json({ error: "Short link not found for slug: " + cleanSlug });
    }

    // If client specifically requests JSON info
    if (req.query.info === "1" || (req.headers.accept && req.headers.accept.includes("application/json") && !req.headers.accept.includes("text/html"))) {
      return res.status(200).json({ success: true, ...linkRecord });
    }

    res.setHeader("Location", linkRecord.url);
    return res.status(302).end();
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to resolve short link." });
  }
}
