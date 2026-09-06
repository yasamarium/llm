// api/s.js - AS Cloud Short URL Redirector (/s/:id)
import { resolveShortLink, sanitizeSlug } from "./shortener.js";

export const config = {
  maxDuration: 45,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
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
    const linkRecord = await resolveShortLink(cleanSlug);
    if (!linkRecord || !linkRecord.url) {
      return res.status(404).json({ error: "Short link not found." });
    }

    res.setHeader("Location", linkRecord.url);
    return res.status(302).end();
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to resolve short link." });
  }
}
