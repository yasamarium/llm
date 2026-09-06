// api/i.js - AS Cloud Direct Short Image Streamer (/i/:id)
import { resolveShortLink, sanitizeSlug } from "./shortener.js";

export const config = {
  maxDuration: 45,
};

function detectImageMime(buffer, url, fallbackHeader) {
  if (buffer && buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mime: "image/jpeg", ext: "jpg" };
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { mime: "image/png", ext: "png" };
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return { mime: "image/gif", ext: "gif" };
    }
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return { mime: "image/webp", ext: "webp" };
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return { mime: "image/bmp", ext: "bmp" };
    }
    const startStr = buffer.subarray(0, 100).toString("utf8").trim().toLowerCase();
    if (startStr.startsWith("<svg") || startStr.startsWith("<?xml")) {
      return { mime: "image/svg+xml", ext: "svg" };
    }
  }

  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".png")) return { mime: "image/png", ext: "png" };
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return { mime: "image/jpeg", ext: "jpg" };
    if (pathname.endsWith(".webp")) return { mime: "image/webp", ext: "webp" };
    if (pathname.endsWith(".gif")) return { mime: "image/gif", ext: "gif" };
    if (pathname.endsWith(".svg")) return { mime: "image/svg+xml", ext: "svg" };
  } catch (_) {}

  if (fallbackHeader && fallbackHeader.startsWith("image/")) {
    const clean = fallbackHeader.split(";")[0].trim().toLowerCase();
    const ext = clean.split("/")[1] || "jpg";
    return { mime: clean, ext: ext === "jpeg" ? "jpg" : ext };
  }

  return { mime: "image/jpeg", ext: "jpg" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawId = req.query.id || req.query.slug || req.query.url;
  if (!rawId || typeof rawId !== "string") {
    return res.status(400).json({ error: "Image short ID is required." });
  }

  const cleanSlug = sanitizeSlug(rawId);
  if (!cleanSlug) {
    return res.status(400).json({ error: "Invalid short ID." });
  }

  try {
    const linkRecord = await resolveShortLink(cleanSlug);
    if (!linkRecord || !linkRecord.url) {
      return res.status(404).json({ error: "Image short link not found." });
    }

    const targetUrl = linkRecord.url;
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream storage server returned HTTP ${upstreamRes.status}`,
      });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detected = detectImageMime(
      buffer,
      targetUrl,
      upstreamRes.headers.get("content-type")
    );

    const safeFilename = `${cleanSlug}.${detected.ext}`;

    res.setHeader("Content-Type", detected.mime);
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", buffer.length);

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to stream short image." });
  }
}
