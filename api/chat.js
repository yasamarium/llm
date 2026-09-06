// api/chat.js - Unified Multi-Replica Fleet Proxy for AS Cloud

const DEFAULT_API_KEY = "qwen3-direct-access";

const ENDPOINTS = {
  "r1": [
    "https://raw.githubusercontent.com/yasamarium/server9/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server15/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server16/main/endpoint.txt",
  ],
  "coder": [
    "https://raw.githubusercontent.com/yasamarium/server10/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server17/main/endpoint.txt",
  ],
  "llama3b": [
    "https://raw.githubusercontent.com/yasamarium/server19/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server20/main/endpoint.txt",
  ],
  "qwen3b": [
    "https://raw.githubusercontent.com/yasamarium/server21/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server22/main/endpoint.txt",
  ],
  "1.7b": [
    "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
  ],
  "1b": [
    "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server18/main/endpoint.txt",
  ],
  "0.5b": [
    "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
  ],
  "gemma": ["https://raw.githubusercontent.com/yasamarium/server11/main/endpoint.txt"],
  "smol": ["https://raw.githubusercontent.com/yasamarium/server12/main/endpoint.txt"],
  "math": ["https://raw.githubusercontent.com/yasamarium/server13/main/endpoint.txt"],
  "phi": ["https://raw.githubusercontent.com/yasamarium/server14/main/endpoint.txt"],
};

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

function normalizeModel(rawModel) {
  const m = (rawModel || "").toLowerCase();
  if (m.includes("r1") || m.includes("deepseek")) return "r1";
  if (m.includes("coder") || m.includes("code")) return "coder";
  if (m.includes("llama3b") || m.includes("llama-3b") || m.includes("llama 3b") || m.includes("llama")) return "llama3b";
  if (m.includes("qwen3b") || m.includes("qwen-3b") || m.includes("qwen 3b") || m.includes("3b")) return "qwen3b";
  if (m.includes("gemma")) return "gemma";
  if (m.includes("smol")) return "smol";
  if (m.includes("math")) return "math";
  if (m.includes("phi")) return "phi";
  if (m.includes("0.5b")) return "0.5b";
  if (m.includes("1b")) return "1b";
  return "1.7b";
}

async function getAvailableEndpoints(modelKey) {
  if (process.env.LLMSERVER_URL) {
    return [process.env.LLMSERVER_URL.replace(/\/+$/, "")];
  }

  const list = ENDPOINTS[modelKey] || ENDPOINTS["1.7b"];
  const startIndex = roundRobinIndex % list.length;
  roundRobinIndex = (roundRobinIndex + 1) % list.length;

  const ordered = [
    ...list.slice(startIndex),
    ...list.slice(0, startIndex),
  ];

  const validUrls = [];
  for (const candidate of ordered) {
    const url = await fetchEndpointUrl(candidate);
    if (url && !url.includes("localhost") && !url.includes("example.com")) {
      validUrls.push(url);
    }
  }

  return validUrls.length > 0 ? validUrls : ["http://localhost:8000"];
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

  const {
    messages,
    model = "1.7b",
    temperature = 0.7,
    max_tokens = 512,
    stream = true,
  } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  const modelKey = normalizeModel(model);
  const targetUrls = await getAvailableEndpoints(modelKey);
  const apiKey = process.env.LLMSERVER_API_KEY || DEFAULT_API_KEY;

  let lastError = null;

  for (const targetUrl of targetUrls) {
    try {
      const upstreamRes = await fetch(`${targetUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelKey,
          messages,
          temperature: Number(temperature),
          max_tokens: Number(max_tokens),
          stream: Boolean(stream),
        }),
      });

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        lastError = new Error(`Node ${targetUrl} returned HTTP ${upstreamRes.status}: ${errText}`);
        continue;
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        return res.end();
      } else {
        const data = await upstreamRes.json();
        return res.status(200).json(data);
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  return res.status(502).json({
    error: {
      message: `All replica nodes for model '${modelKey}' are temporarily busy or restarting. Retrying AS cloud...`,
      detail: lastError ? String(lastError) : "No endpoints responded",
    },
  });
}
