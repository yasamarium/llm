// api/proxy-image.js - AS Cloud Domain Image Streaming Proxy

export const config = {
  maxDuration: 45,
};

/**
 * Detect true image MIME and file extension from raw buffer magic numbers,
 * URL pathname, and upstream response headers.
 */
function detectImageMime(buffer, url, fallbackHeader) {
  if (buffer && buffer.length >= 4) {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mime: "image/jpeg", ext: "jpg" };
    }
    // PNG: 89 50 4E 47 (0x89 'PNG')
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { mime: "image/png", ext: "png" };
    }
    // GIF: 47 49 46 38 ('GIF8')
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return { mime: "image/gif", ext: "gif" };
    }
    // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return { mime: "image/webp", ext: "webp" };
    }
    // BMP: 42 4D ('BM')
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return { mime: "image/bmp", ext: "bmp" };
    }
    // SVG text check
    const startStr = buffer.subarray(0, 100).toString("utf8").trim().toLowerCase();
    if (startStr.startsWith("<svg") || startStr.startsWith("<?xml")) {
      return { mime: "image/svg+xml", ext: "svg" };
    }
  }

  // Check URL extension
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".png")) return { mime: "image/png", ext: "png" };
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return { mime: "image/jpeg", ext: "jpg" };
    if (pathname.endsWith(".webp")) return { mime: "image/webp", ext: "webp" };
    if (pathname.endsWith(".gif")) return { mime: "image/gif", ext: "gif" };
    if (pathname.endsWith(".svg")) return { mime: "image/svg+xml", ext: "svg" };
  } catch (_) {}

  // Check fallback header if it is a genuine image mime (never octet-stream)
  if (fallbackHeader && fallbackHeader.startsWith("image/")) {
    const clean = fallbackHeader.split(";")[0].trim().toLowerCase();
    const ext = clean.split("/")[1] || "jpg";
    return { mime: clean, ext: ext === "jpeg" ? "jpg" : ext };
  }

  // Fallback to standard JPEG
  return { mime: "image/jpeg", ext: "jpg" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== "string") {
    return res.status(400).json({ error: "Image URL parameter 'url' is required." });
  }

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    return res.status(400).json({ error: "Invalid image URL." });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream image server returned HTTP ${upstreamRes.status}`,
      });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect true MIME and file extension
    const detected = detectImageMime(
      buffer,
      targetUrl,
      upstreamRes.headers.get("content-type")
    );

    // Extract or compute safe filename
    let safeFilename = (req.query.filename || req.query.name || "").toString().trim();
    if (!safeFilename) {
      try {
        const parsedPath = new URL(targetUrl).pathname;
        const lastPart = parsedPath.split("/").filter(Boolean).pop();
        if (lastPart && lastPart.includes(".")) {
          safeFilename = lastPart;
        }
      } catch (_) {}
    }
    if (!safeFilename || !safeFilename.includes(".")) {
      safeFilename = `as_image_${Date.now()}.${detected.ext}`;
    }

    // Set clean image streaming headers - ALWAYS inline image, NEVER octet-stream
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
    return res.status(500).json({ error: err.message || "Failed to proxy image." });
  }
}
