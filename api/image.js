// api/image.js - Intelligent Load-Balanced Image Generation Proxy (SD-Turbo Fleet)

const DEFAULT_API_KEY = "qwen3-direct-access";

const CLUSTER_IMAGE = [
  "https://raw.githubusercontent.com/yasamarium/server7/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server8/main/endpoint.txt",
];

let roundRobinIndex = 0;

async function fetchEndpointUrl(rawUrl) {
  try {
    const res = await fetch(`${rawUrl}?_t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.startsWith("http")) return text.replace(/\/+$/, "");
    }
  } catch (err) {}
  return null;
}

async function resolveImageServerUrl() {
  if (process.env.IMAGE_SERVER_URL) {
    return process.env.IMAGE_SERVER_URL.replace(/\/+$/, "");
  }

  const candidates = [...CLUSTER_IMAGE];
  const startIndex = roundRobinIndex % candidates.length;
  roundRobinIndex = (roundRobinIndex + 1) % candidates.length;

  const ordered = [
    ...candidates.slice(startIndex),
    ...candidates.slice(0, startIndex),
  ];

  for (const candidate of ordered) {
    const url = await fetchEndpointUrl(candidate);
    if (url) return url;
  }

  return "http://localhost:8000";
}

export const config = {
  runtime: "nodejs",
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

  const { prompt, size = "512x512", n = 1, response_format = "b64_json" } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: { message: "Prompt is required." } });
  }

  const targetUrl = await resolveImageServerUrl();
  const apiKey = process.env.LLMSERVER_API_KEY || DEFAULT_API_KEY;

  try {
    const upstreamRes = await fetch(`${targetUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        size,
        n,
        response_format,
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).send(errText);
    }

    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Image generation proxy error:", error);
    return res.status(502).json({
      error: {
        message: `AS cloud image node (${targetUrl}) is currently initializing. Please try again in a few moments.`,
        type: "image_node_initializing",
      },
    });
  }
}
