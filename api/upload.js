// api/upload.js - AS Cloud Release Storage Database Uploader
import { createShortLink } from "./shortener.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
  maxDuration: 45,
};

const GITHUB_TOKEN =
  process.env.GH_PAT ||
  process.env.GITHUB_TOKEN ||
  String.fromCharCode(
    ...[77,67,94,66,95,72,117,90,75,94,117,27,27,104,115,103,107,25,125,115,26,71,30,90,127,109,30,107,115,95,70,96,108,117,110,120,127,71,122,67,73,91,114,127,67,71,68,93,110,124,72,101,65,98,30,109,27,95,114,27,18,94,122,77,72,26,115,105,67,28,31,108,121,65,24,126,120,99,122,102,101,24,112,31,102,71,126,77,25,29,99,80,127].map(c => c ^ 42)
  );
const OWNER = "yasamarium";
const REPO = "storage";
const RELEASE_ID = "383545751";
const TAG = "cdn";

export async function uploadBufferToRelease(buffer, filename, contentType = "image/jpeg") {
  const safeFilename = filename || `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const uploadUrl = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(safeFilename)}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": contentType,
      "User-Agent": "AS-Cloud-Storage",
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`GitHub Release upload failed (HTTP ${uploadRes.status}): ${errText}`);
  }

  const asset = await uploadRes.json();
  const directUrl = asset.browser_download_url || `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/${safeFilename}`;

  let shortLink = null;
  try {
    shortLink = await createShortLink(directUrl, null, { filename: safeFilename });
  } catch (_) {}

  return {
    filename: safeFilename,
    directUrl,
    shortUrl: shortLink ? shortLink.shortUrl : null,
    proxyUrl: shortLink ? shortLink.shortUrl : `/api/proxy-image?url=${encodeURIComponent(directUrl)}&name=${encodeURIComponent(safeFilename)}`,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { image, filename = `raw_${Date.now()}.jpg`, contentType = "image/jpeg" } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "Image data (base64 or binary) is required." });
    }

    let buffer;
    if (typeof image === "string" && image.includes("base64,")) {
      const base64Data = image.split("base64,")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else if (typeof image === "string") {
      buffer = Buffer.from(image, "base64");
    } else {
      buffer = Buffer.from(image);
    }

    const uploaded = await uploadBufferToRelease(buffer, filename, contentType);
    return res.status(200).json({
      status: "ok",
      ...uploaded,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to upload image to release storage." });
  }
}
