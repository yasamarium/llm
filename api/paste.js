// api/paste.js - AS Cloud Pastebin API
export const config = {
  maxDuration: 45,
};

const pastesCache = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle Paste Creation POST
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { title, slug, lang, content } = body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required for paste." });
      }

      const cleanSlug = (slug && typeof slug === "string")
        ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
        : "paste-" + Math.random().toString(36).substring(2, 8);

      const pasteRecord = {
        slug: cleanSlug,
        title: (title && typeof title === "string") ? title.trim() : "Untitled Snippet",
        lang: lang || "plaintext",
        content: content,
        created_at: new Date().toISOString()
      };

      pastesCache.set(cleanSlug, pasteRecord);

      return res.status(200).json({
        success: true,
        ...pasteRecord,
        shareUrl: `/game?p=${cleanSlug}`
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to create paste." });
    }
  }

  // Handle List Query
  if (req.query.list === "1" || req.query.action === "list") {
    try {
      const dbRes = await fetch("https://raw.githubusercontent.com/yasamarium/cloudgame-db-users/main/data/pastes.json?t=" + Date.now(), { cache: "no-cache" });
      if (dbRes.ok) {
        const pastes = await dbRes.json();
        return res.status(200).json(Array.isArray(pastes) ? pastes : []);
      }
    } catch (e) {}

    const cachedList = Array.from(pastesCache.values());
    return res.status(200).json(cachedList);
  }

  // Handle Fetch by Slug
  const rawSlug = req.query.slug || req.query.id;
  if (!rawSlug || typeof rawSlug !== "string") {
    return res.status(400).json({ error: "Paste slug or ID is required." });
  }

  const cleanSlug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (pastesCache.has(cleanSlug)) {
    return res.status(200).json({ success: true, ...pastesCache.get(cleanSlug) });
  }

  try {
    const dbRes = await fetch("https://raw.githubusercontent.com/yasamarium/cloudgame-db-users/main/data/pastes.json?t=" + Date.now(), { cache: "no-cache" });
    if (dbRes.ok) {
      const pastes = await dbRes.json();
      if (Array.isArray(pastes)) {
        const found = pastes.find(p => p.slug && p.slug.toLowerCase() === cleanSlug);
        if (found) {
          pastesCache.set(cleanSlug, found);
          return res.status(200).json({ success: true, ...found });
        }
      }
    }
  } catch (e) {}

  return res.status(404).json({ error: "Paste not found for slug: " + cleanSlug });
}
