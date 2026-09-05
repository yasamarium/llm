// api/chat.js - Intelligent Load-Balanced Proxy for AS Cloud (0.5B, 1B & 1.7B Fleet)

const DEFAULT_API_KEY = "qwen3-direct-access";

// 0.5B Ultra-Lightweight Cluster Pool (server5 & server6)
const CLUSTER_0_5B = [
  "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
];

// Dedicated 1B node
const NODE_1B = "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt";

// 1.7B Cluster Pool (Load Balanced across multiple GitHub Actions runners)
const CLUSTER_1_7B = [
  "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
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

async function resolveServerUrl(modelType) {
  // If user explicitly set LLMSERVER_URL in Vercel environment, honor it
  if (process.env.LLMSERVER_URL) {
    return process.env.LLMSERVER_URL.replace(/\/+$/, "");
  }

  // 1. 0.5B Ultra-Lightweight Cluster Routing
  if (modelType === "0.5b") {
    const candidates = [...CLUSTER_0_5B];
    const startIndex = roundRobinIndex % candidates.length;
    roundRobinIndex = (roundRobinIndex + 1) % candidates.length;

    const orderedCandidates = [
      ...candidates.slice(startIndex),
      ...candidates.slice(0, startIndex),
    ];

    for (const candidate of orderedCandidates) {
      const url = await fetchEndpointUrl(candidate);
      if (url) return url;
    }
  }

  // 2. Dedicated 1B Routing
  if (modelType === "1b") {
    const url = await fetchEndpointUrl(NODE_1B);
    if (url) return url;
  }

  // 3. 1.7B Cluster Routing with Round-Robin & Health Check Failover
  const candidates = [...CLUSTER_1_7B];
  // Rotate starting candidate based on roundRobinIndex
  const startIndex = roundRobinIndex % candidates.length;
  roundRobinIndex = (roundRobinIndex + 1) % candidates.length;

  const orderedCandidates = [
    ...candidates.slice(startIndex),
    ...candidates.slice(0, startIndex),
  ];

  // Try each node in the cluster until an online one is found
  for (const candidate of orderedCandidates) {
    const url = await fetchEndpointUrl(candidate);
    if (url) {
      return url;
    }
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

  const {
    messages,
    model = "1.7b", // "0.5b", "1b", or "1.7b"
    temperature = 0.7,
    max_tokens = 512,
    stream = true,
  } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  const is05B = model.toLowerCase().includes("0.5b");
  const is1B = model.toLowerCase().includes("1b") && !is05B;
  const modelType = is05B ? "0.5b" : (is1B ? "1b" : "1.7b");
  const targetUrl = await resolveServerUrl(modelType);
  const apiKey = process.env.LLMSERVER_API_KEY || DEFAULT_API_KEY;
  const upstreamModel = is05B ? "qwen-0.5b" : (is1B ? "qwen-1b" : "qwen3-1.7b");

  try {
    const upstreamRes = await fetch(`${targetUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: upstreamModel,
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
        message: `AS cloud node (${targetUrl}) is currently initializing. Please try again in a few moments.`,
        type: "cluster_node_initializing",
      },
    });
  }
}
