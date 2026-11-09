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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
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
  const nonce = await getSnapYtNonce();
  const body = new URLSearchParams();
  body.set("action", "process_video_url");
  body.set("video_url", ytUrl);
  body.set("security", nonce);

  const ajaxRes = await fetch("https://www.snapyt.app/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    body: body,
    signal: signal
  });

  const ajaxData = await ajaxRes.json();
  if (!ajaxData || !ajaxData.success || !ajaxData.data?.redirect) {
    throw new Error((ajaxData && ajaxData.data) || "SnapYT extraction failed");
  }

  const prevRes = await fetch(ajaxData.data.redirect, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    signal: signal
  });
  const prevHtml = await prevRes.text();

  // Extract Title
  const titleMatch = prevHtml.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     prevHtml.match(/<div[^>]*class="[^"]*video-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                     prevHtml.match(/<title>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "YouTube Video";

  // Extract Thumbnail
  const thumbMatch = prevHtml.match(/<img[^>]*id="vd-image"[^>]*src="([^"]+)"/i) ||
                     prevHtml.match(/<img[^>]*class="[^"]*thumb[^"]*"[^>]*src="([^"]+)"/i);
  let thumbnail = thumbMatch ? thumbMatch[1] : "";

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

  return {
    success: true,
    title,
    thumbnail,
    duration,
    pid,
    muxNonce,
    previewUrl: ajaxData.data.redirect,
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        body: body
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

  // 1. Primary: SnapYT Full Resolution Engine
  try {
    const snapResult = await resolveSnapYt(cleanUrl, controller.signal);
    clearTimeout(timer);
    return res.status(200).json(snapResult);
  } catch (snapErr) {
    console.warn("SnapYT engine fallback triggered:", snapErr.message);
  }

  // 2. Secondary Fallback: David Cyril YT Downloader API
  try {
    const encodedUrl = encodeURIComponent(cleanUrl);
    const ytUrl = `https://apis.davidcyril.name.ng/download/yt?url=${encodedUrl}`;
    const ytRes = await fetch(ytUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    if (ytRes.ok) {
      const ytData = await ytRes.json();
      if (ytData && ytData.result && (ytData.result.download_url || ytData.result.videos)) {
        clearTimeout(timer);
        return res.status(200).json({
          success: true,
          title: ytData.result.title || "YouTube Video",
          thumbnail: ytData.result.thumbnail || "",
          formats: [
            {
              value: "360",
              label: "360p MP4",
              text: "360p MP4 (Direct Ready)",
              kind: "video+audio",
              ext: "mp4",
              url: ytData.result.download_url || ytData.result.videos?.[0]?.url || "",
              force: ytData.result.download_url || ""
            },
            {
              value: "720",
              label: "720p HD MP4",
              text: "720p HD MP4",
              kind: "video",
              ext: "mp4",
              url: ytData.result.videos?.find(v => v.quality === "720p")?.url || ytData.result.download_url || "",
              force: ""
            },
            {
              value: "mp3",
              label: "MP3 Audio",
              text: "MP3 Audio (Lossless)",
              kind: "audio",
              ext: "mp3",
              url: ytData.result.audio_url || ytData.result.download_url || "",
              force: ""
            }
          ]
        });
      }
    }
  } catch (e) {
    // Proceed to snapsaver fallback
  }

  // 3. Tertiary: Snapsaver API Fallback
  try {
    const encodedUrl = encodeURIComponent(cleanUrl);
    const upstreamUrl = `https://apis.davidcyril.name.ng/download/snapsaver?url=${encodedUrl}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return res.status(200).json(data);
    }

    return res.status(upstreamRes.status).json({
      error: { message: `Upstream service returned HTTP ${upstreamRes.status}` },
    });
  } catch (err) {
    clearTimeout(timer);
    return res.status(500).json({
      error: { message: err.message || "Failed to resolve YouTube media stream." },
    });
  }
}
