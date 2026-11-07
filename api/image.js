// api/image.js - Intelligent Load-Balanced Image Generation for AS Cloud

export const config = {
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
    return res.status(405).json({ error: { message: "Method not allowed." } });
  }

  const { prompt, size = "512x512" } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: { message: "Prompt is required." } });
  }

  try {
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const [width, height] = size.includes("x") ? size.split("x") : ["512", "512"];
    const seed = Math.floor(Math.random() * 10000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width || 512}&height=${height || 512}&seed=${seed}&nologo=true`;

    return res.status(200).json({
      created: Date.now(),
      data: [{ url: imageUrl }],
    });
  } catch (error) {
    return res.status(502).json({
      error: {
        message: "Failed to generate image.",
        detail: String(error),
      },
    });
  }
}
