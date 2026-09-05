// api/chat.js - Vercel Serverless Function proxying to yasamarium/llmserver

// Built-in defaults (no manual Vercel env vars required)
const DEFAULT_SERVER_URL = process.env.LLMSERVER_URL || "http://localhost:8000";
const DEFAULT_API_KEY = process.env.LLMSERVER_API_KEY || "";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-server-url, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    messages,
    temperature = 0.7,
    max_tokens = 512,
    stream = true,
    serverUrl,
    apiKey,
  } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  // Resolve server URL: header > request body > env var > default
  const resolvedUrl = (
    req.headers["x-server-url"] ||
    serverUrl ||
    DEFAULT_SERVER_URL
  ).replace(/\/+$/, "");

  // Resolve API Key: header > request body > env var > default
  const resolvedApiKey = (
    req.headers["x-api-key"] ||
    apiKey ||
    DEFAULT_API_KEY
  ).trim();

  try {
    const upstreamHeaders = {
      "Content-Type": "application/json",
    };
    if (resolvedApiKey) {
      upstreamHeaders["Authorization"] = `Bearer ${resolvedApiKey}`;
    }

    const endpoint = `${resolvedUrl}/v1/chat/completions`;
    const upstreamRes = await fetch(endpoint, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify({
        model: "qwen3-4b",
        messages,
        temperature: Number(temperature),
        max_tokens: Number(max_tokens),
        stream: Boolean(stream),
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).send(errText);
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = upstreamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    } else {
      const data = await upstreamRes.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error("Upstream connection error:", error);
    return res.status(502).json({
      error: {
        message: `Could not connect to llmserver at '${resolvedUrl}'. Make sure the GitHub Actions runner / tunnel is online. Details: ${error.message}`,
        type: "upstream_unavailable",
      },
    });
  }
}
