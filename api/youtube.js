// api/youtube.js - AS Cloud YouTube Downloader & Media Extractor
export const config = {
  maxDuration: 45,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url || (req.body && req.body.url);

  if (!targetUrl || typeof targetUrl !== "string" || !targetUrl.trim()) {
    return res.status(400).json({ error: { message: "URL parameter is required." } });
  }

  try {
    const upstreamUrl = `https://apis.davidcyril.name.ng/download/snapsaver?url=${encodeURIComponent(targetUrl.trim())}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);

    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: { message: `Upstream video service returned HTTP ${upstreamRes.status}` },
      });
    }

    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: { message: err.message || "Failed to fetch YouTube media data." },
    });
  }
}
