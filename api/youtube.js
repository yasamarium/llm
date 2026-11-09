// api/youtube.js - AS Cloud YouTube Downloader & Stream Engine
export const config = {
  maxDuration: 60,
};

// In-memory cache for VD_NONCE to avoid fetching homepage on every request
let cachedNonce = null;
let nonceTimestamp = 0;

async function getSnapYtNonce() {
  const now = Date.now();
  if (cachedNonce && (now - nonceTimestamp < 1000 * 60 * 30)) {
    return cachedNonce;
  }
  try {
    const res = await fetch("https://www.snapyt.app/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/var VD_NONCE\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        cachedNonce = match[1];
        nonceTimestamp = now;
        return cachedNonce;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch fresh snapyt nonce:", e.message);
  }
  return cachedNonce || "f6076a058a";
}

async function resolveSnapYt(ytUrl, signal) {
  // Normalize YouTube URL to standard watch format (supports shorts, embed, youtu.be)
  const idMatch = ytUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  const normalizedUrl = idMatch ? ("https://www.youtube.com/watch?v=" + idMatch[1]) : ytUrl;

  const previewUrl = "https://www.snapyt.app/video-preview/?q=" + encodeURIComponent(normalizedUrl);
  const prevRes = await fetch(previewUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    },
    signal: signal
  });

  if (!prevRes.ok) {
    throw new Error("Video preview returned HTTP " + prevRes.status);
  }

  const prevHtml = await prevRes.text();

  // Extract Title
  const titleMatch = prevHtml.match(/var VIDEO_TITLE\s*=\s*"([^"]+)"/i) ||
                     prevHtml.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     prevHtml.match(/<img[^>]*id="vd-image"[^>]*alt="([^"]+)"/i);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "YouTube Video";
  if (title === "Video Preview - SnapYT.App" && idMatch) {
    title = "YouTube Video (" + idMatch[1] + ")";
  }

  // Extract Thumbnail
  const thumbMatch = prevHtml.match(/<img[^>]*id="vd-image"[^>]*src="([^"]+)"/i) ||
                     prevHtml.match(/<img[^>]*class="[^"]*thumb[^"]*"[^>]*src="([^"]+)"/i);
  let thumbnail = thumbMatch ? thumbMatch[1] : (idMatch ? ("https://i.ytimg.com/vi/" + idMatch[1] + "/hqdefault.jpg") : "");

  // Extract Duration
  const durMatch = prevHtml.match(/<span[^>]*class="[^"]*duration[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  let duration = durMatch ? durMatch[1].trim() : "";

  // Extract Mux PID and Nonce for Combine
  const muxPidMatch = prevHtml.match(/data-pid="([^"]+)"/);
  const muxNonceMatch = prevHtml.match(/id="merge-link"[^>]*data-nonce="([^"]+)"/);
  const pid = muxPidMatch ? muxPidMatch[1] : "";
  const muxNonce = muxNonceMatch ? muxNonceMatch[1] : "";

  // Extract Formats
  const formats = [];
  const optRegex = /<option value="([^"]+)"([^>]*)>([\s\S]*?)<\/option>/g;
  let m;
  while ((m = optRegex.exec(prevHtml)) !== null) {
    const val = m[1];
    const attrs = m[2];
    const text = m[3].replace(/&amp;/g, '&').trim();
    if (!text || text.includes('Select video quality') || text.includes('Select audio quality')) continue;

    const kindMatch = attrs.match(/data-kind="([^"]+)"/);
    const sizeMatch = attrs.match(/data-size="([^"]+)"/);
    const urlMatch = attrs.match(/data-url="([^"]+)"/);
    const forceMatch = attrs.match(/data-force="([^"]+)"/);
    const labelMatch = attrs.match(/data-label="([^"]+)"/);
    const extMatch = attrs.match(/data-ext="([^"]+)"/);

    formats.push({
      value: val,
      label: labelMatch ? labelMatch[1] : text,
      text: text,
      kind: kindMatch ? kindMatch[1] : 'video',
      ext: extMatch ? extMatch[1] : 'mp4',
      size: sizeMatch ? sizeMatch[1] : '',
      url: urlMatch ? urlMatch[1].replace(/&amp;/g, '&') : '',
      force: forceMatch ? forceMatch[1].replace(/&amp;/g, '&') : ''
    });
  }

  if (formats.length === 0) {
    throw new Error("No media streams available for this video.");
  }

  return {
    success: true,
    title,
    thumbnail,
    duration,
    pid,
    muxNonce,
    previewUrl,
    formats
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url || (req.body && req.body.url);
  const action = req.query.action || (req.body && req.body.action);

  // Handle Mux / Combine Job
  if (action === "combine" || action === "mux") {
    const { pid, v, a, nonce } = req.method === "POST" ? req.body : req.query;
    if (!pid || !v || !a || !nonce) {
      return res.status(400).json({ error: { message: "pid, v, a, and nonce are required to combine." } });
    }
    try {
      const body = new URLSearchParams();
      body.set("action", "vd_mux_start");
      body.set("pid", pid);
      body.set("v", String(v));
      body.set("a", String(a));
      body.set("nonce", nonce);
      body.set("px", "1");

      const muxRes = await fetch("https://www.snapyt.app/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://www.snapyt.app/",
          "Origin": "https://www.snapyt.app",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: body.toString()
      });
      const data = await muxRes.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: { message: err.message || "Failed to start mux job." } });
    }
  }

  if (!targetUrl || typeof targetUrl !== "string" || !targetUrl.trim()) {
    return res.status(400).json({ error: { message: "URL parameter is required." } });
  }

  const cleanUrl = targetUrl.trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);

  try {
    const snapResult = await resolveSnapYt(cleanUrl, controller.signal);
    clearTimeout(timer);
    return res.status(200).json(snapResult);
  } catch (snapErr) {
    clearTimeout(timer);
    console.error("SnapYT error:", snapErr.message);
    return res.status(500).json({
      error: { message: snapErr.message || "Failed to resolve YouTube media stream." }
    });
  }
}
