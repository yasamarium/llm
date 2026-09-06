// api/edit-image.js - AS Cloud Image-to-Image AI Editor (Nanobanana + Release Database)
import { uploadBufferToRelease } from "./upload.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
  maxDuration: 60,
};

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

  const { image, prompt = "Remove the background" } = req.body || {};

  if (!image || !prompt) {
    return res.status(400).json({ error: "Both 'image' (URL or base64) and 'prompt' are required." });
  }

  try {
    let directImageUrl = "";

    // 1. If base64, upload to storage release first to obtain direct public URL
    if (typeof image === "string" && (image.startsWith("data:") || !image.startsWith("http"))) {
      let buffer;
      let contentType = "image/jpeg";
      if (image.includes("base64,")) {
        const parts = image.split("base64,");
        const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
        if (match) contentType = match[1];
        buffer = Buffer.from(parts[1], "base64");
      } else {
        buffer = Buffer.from(image, "base64");
      }
      const rawUpload = await uploadBufferToRelease(
        buffer,
        `raw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`,
        contentType
      );
      directImageUrl = rawUpload.directUrl;
    } else {
      directImageUrl = image.trim();
    }

    // 2. Call nanobanana image-to-image API
    const nanobananaUrl = `https://apis.davidcyril.name.ng/imageToImage/nanobanana?url=${encodeURIComponent(
      directImageUrl
    )}&prompt=${encodeURIComponent(prompt.trim())}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const apiRes = await fetch(nanobananaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!apiRes.ok) {
      throw new Error(`Nanobanana editing API returned HTTP ${apiRes.status}`);
    }

    const json = await apiRes.json();
    const resultUrl = json.result?.result_url;

    if (!resultUrl) {
      throw new Error("No edited image URL returned by nanobanana.");
    }

    // 3. Download the result image and save permanently to our GitHub Release database
    let savedEditedUrl = resultUrl;
    let savedFilename = `edited_${Date.now()}.jpg`;
    try {
      const imgRes = await fetch(resultUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        savedFilename = `edited_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
        const editedUpload = await uploadBufferToRelease(
          imgBuffer,
          savedFilename,
          "image/jpeg"
        );
        savedEditedUrl = editedUpload.directUrl;
        if (editedUpload.filename) savedFilename = editedUpload.filename;
      }
    } catch (e) {
      // If saving to release fails, resultUrl is still valid
    }

    return res.status(200).json({
      status: "ok",
      prompt: prompt.trim(),
      filename: savedFilename,
      original_proxy_url: `/api/proxy-image?url=${encodeURIComponent(directImageUrl)}&name=original_${Date.now()}.jpg`,
      original_storage_url: directImageUrl,
      result_proxy_url: `/api/proxy-image?url=${encodeURIComponent(savedEditedUrl)}&name=${encodeURIComponent(savedFilename)}`,
      result_storage_url: savedEditedUrl,
      upstream_result_url: resultUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to process image editing." });
  }
}
