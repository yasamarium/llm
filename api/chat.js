// api/chat.js - Vercel Serverless Function proxying directly to yasamarium/llmserver

const DEFAULT_API_KEY = "qwen3-direct-access";

async function getLiveServerUrl() {
  // 1. If explicit environment variable exists in Vercel, use it
  if (process.env.LLMSERVER_URL) {
    return process.env.LLMSERVER_URL.replace(/\/+$/, "");
  }

  // 2. Fetch live endpoint automatically published by yasamarium/llmserver runner on GitHub
  try {
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt?_t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (rawRes.ok) {
      const urlText = (await rawRes.text()).trim();
      if (urlText && urlText.startsWith("http")) {
        return urlText.replace(/\/+$/, "");
      }
    }
  } catch (err) {
    console.error("Failed to fetch endpoint.txt:", err);
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

  const { messages, temperature = 0.7, max_tokens = 512, stream = true } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  const targetUrl = await getLiveServerUrl();
  const apiKey = process.env.LLMSERVER_API_KEY || DEFAULT_API_KEY;

  try {
    const upstreamRes = await fetch(`${targetUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
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
    console.error("Direct connection error:", error);
    return res.status(502).json({
      error: {
        message: `Could not connect to Qwen3 4B backend (${targetUrl}). The runner may be initializing. Please try again in a few moments.`,
        type: "backend_initializing",
      },
    });
  }
}
