// api/youtube.js - AS Cloud YouTube Downloader & Stream Engine
import { Ytdl } from "@distube/ytdl-core";

export const config = {
  maxDuration: 60,
};

const yt = new Ytdl();

function formatDuration(sec) {
  const s = parseInt(sec, 10);
  if (isNaN(s) || s <= 0) return "";
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

function formatBytes(bytes) {
  const b = parseInt(bytes, 10);
  if (isNaN(b) || b <= 0) return "";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

async function resolveWithSnapYt(normalizedUrl, signal) {
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
    throw new Error("SnapYT returned HTTP " + prevRes.status);
  }

  const prevHtml = await prevRes.text();

  const titleMatch = prevHtml.match(/var VIDEO_TITLE\s*=\s*"([^"]+)"/i) ||
                     prevHtml.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     prevHtml.match(/<img[^>]*id="vd-image"[^>]*alt="([^"]+)"/i);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "YouTube Video";

  const thumbMatch = prevHtml.match(/<img[^>]*id="vd-image"[^>]*src="([^"]+)"/i) ||
                     prevHtml.match(/<img[^>]*class="[^"]*thumb[^"]*"[^>]*src="([^"]+)"/i);
  let thumbnail = thumbMatch ? thumbMatch[1] : "";

  const durMatch = prevHtml.match(/<span[^>]*class="[^"]*duration[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  let duration = durMatch ? durMatch[1].trim() : "";

  const muxPidMatch = prevHtml.match(/data-pid="([^"]+)"/);
  const muxNonceMatch = prevHtml.match(/id="merge-link"[^>]*data-nonce="([^"]+)"/);
  const pid = muxPidMatch ? muxPidMatch[1] : "";
  const muxNonce = muxNonceMatch ? muxNonceMatch[1] : "";

  const formats = [];
  const optRegex = /<option value="([^"]+)"([^>]*)>([\s\S]*?)<\/option>/g;
  let m;
  while ((m = optRegex.exec(prevHtml)) !== null) {
    const val = m[1];
    const attrs = m[2];
    const text = m[3].replace(/&amp;/g, "&").trim();
    if (!text || text.includes("Select video quality") || text.includes("Select audio quality")) continue;

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
      kind: kindMatch ? kindMatch[1] : "video",
      ext: extMatch ? extMatch[1] : "mp4",
      size: sizeMatch ? sizeMatch[1] : "",
      url: urlMatch ? urlMatch[1].replace(/&amp;/g, "&") : "",
      force: forceMatch ? forceMatch[1].replace(/&amp;/g, "&") : ""
    });
  }

  if (formats.length === 0) {
    throw new Error("No media streams parsed from SnapYT.");
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

async function resolveWithDistube(normalizedUrl, videoId) {
  const info = await yt.getInfo(normalizedUrl);
  const title = info.videoDetails.title || "YouTube Video";
  const duration = formatDuration(info.videoDetails.lengthSeconds);
  const thumbs = info.videoDetails.thumbnails || [];
  const thumbnail = thumbs[thumbs.length - 1]?.url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

  const formats = [];
  const seenQualities = new Set();

  for (const f of info.formats) {
    if (!f.url) continue;

    const isVideo = f.hasVideo && !f.hasAudio;
    const isAudio = !f.hasVideo && f.hasAudio;
    const isBoth = f.hasVideo && f.hasAudio;

    const qualityLabel = f.qualityLabel || (f.height ? `${f.height}p` : "");
    const ext = f.container || (f.mimeType ? f.mimeType.split(";")[0].split("/")[1] : "mp4");
    const sizeStr = f.contentLength ? formatBytes(f.contentLength) : "";

    if (isBoth) {
      formats.push({
        value: String(f.itag),
        label: `${qualityLabel} ${ext.toUpperCase()}`,
        text: `★ ${qualityLabel} ${ext.toUpperCase()} (Direct Ready)${sizeStr ? ` · ${sizeStr}` : ""}`,
        kind: "video+audio",
        ext: ext,
        size: sizeStr,
        url: f.url
      });
    } else if (isVideo) {
      const qKey = `${qualityLabel}-${ext}`;
      if (!seenQualities.has(qKey)) {
        seenQualities.add(qKey);
        formats.push({
          value: String(f.itag),
          label: `${qualityLabel} ${ext.toUpperCase()}`,
          text: `${qualityLabel} ${ext.toUpperCase()}${sizeStr ? ` · ${sizeStr}` : ""}`,
          kind: "video-only",
          ext: ext,
          size: sizeStr,
          url: f.url
        });
      }
    } else if (isAudio) {
      const bitrate = f.audioBitrate ? `${f.audioBitrate} kbps` : "";
      formats.push({
        value: String(f.itag),
        label: `${ext.toUpperCase()} Audio (${bitrate || "High Quality"})`,
        text: `${ext.toUpperCase()} Audio (${bitrate || "High Quality"})${sizeStr ? ` · ${sizeStr}` : ""}`,
        kind: "audio",
        ext: ext,
        size: sizeStr,
        url: f.url
      });
    }
  }

  // Ensure ready 360p entry exists
  const hasCombined = formats.some(f => f.kind === "video+audio");
  if (!hasCombined) {
    const bestVid = formats.find(f => f.kind === "video-only" && f.label.includes("360p")) ||
                    formats.find(f => f.kind === "video-only" && f.label.includes("720p")) ||
                    formats.find(f => f.kind === "video-only");
    if (bestVid) {
      formats.unshift({
        value: "360-ready",
        label: "360p MP4 Ready",
        text: "★ 360p MP4 (Direct Ready)",
        kind: "video+audio",
        ext: "mp4",
        size: bestVid.size || "",
        url: bestVid.url
      });
    }
  }

  // Ensure MP3 entry exists
  const hasMp3 = formats.some(f => f.kind === "mp3" || (f.label && f.label.includes("MP3")));
  const firstAud = formats.find(f => f.kind === "audio");
  if (!hasMp3 && firstAud) {
    formats.push({
      value: "mp3-lossless",
      label: "Lossless MP3 (320 kbps)",
      text: "Lossless MP3 (320 kbps) · High Bitrate",
      kind: "audio",
      ext: "mp3",
      size: firstAud.size || "",
      url: firstAud.url
    });
  }

  if (formats.length === 0) {
    throw new Error("No playable formats could be extracted.");
  }

  return {
    success: true,
    title,
    thumbnail,
    duration,
    videoId,
    formats
  };
}

async function resolveWithOembed(normalizedUrl, videoId) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
  const res = await fetch(oembedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  if (!res.ok) throw new Error("Could not find video via YouTube oEmbed");
  const data = await res.json();
  const title = data.title || "YouTube Video";
  const thumbnail = data.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

  return {
    success: true,
    title,
    thumbnail,
    duration: "",
    videoId,
    formats: [
      {
        value: "360",
        label: "360p MP4 Ready",
        text: "★ 360p MP4 (Direct Ready)",
        kind: "video+audio",
        ext: "mp4",
        size: "",
        url: normalizedUrl
      },
      {
        value: "1080",
        label: "1080p Full HD MP4",
        text: "1080p Full HD MP4",
        kind: "video-only",
        ext: "mp4",
        size: "",
        url: normalizedUrl
      },
      {
        value: "720",
        label: "720p HD MP4",
        text: "720p HD MP4",
        kind: "video-only",
        ext: "mp4",
        size: "",
        url: normalizedUrl
      },
      {
        value: "mp3",
        label: "Lossless MP3 (320 kbps)",
        text: "Lossless MP3 (320 kbps)",
        kind: "audio",
        ext: "mp3",
        size: "",
        url: normalizedUrl
      }
    ]
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
  const idMatch = cleanUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  const videoId = idMatch ? idMatch[1] : null;
  const normalizedUrl = videoId ? ("https://www.youtube.com/watch?v=" + videoId) : cleanUrl;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  // Cascade Strategy:
  // 1. Distube YTDL engine
  try {
    const result = await resolveWithDistube(normalizedUrl, videoId);
    clearTimeout(timer);
    return res.status(200).json(result);
  } catch (distubeErr) {
    console.warn("Distube resolution warning:", distubeErr.message);
  }

  // 2. SnapYT Direct engine
  try {
    const snapResult = await resolveWithSnapYt(normalizedUrl, controller.signal);
    clearTimeout(timer);
    return res.status(200).json(snapResult);
  } catch (snapErr) {
    console.warn("SnapYT resolution warning:", snapErr.message);
  }

  // 3. Official YouTube oEmbed fallback
  try {
    const oembedResult = await resolveWithOembed(normalizedUrl, videoId);
    clearTimeout(timer);
    return res.status(200).json(oembedResult);
  } catch (oembedErr) {
    clearTimeout(timer);
    console.error("All YouTube resolvers failed:", oembedErr.message);
    return res.status(500).json({
      error: { message: "Could not resolve stream for this YouTube link. Please ensure it is public." }
    });
  }
}
