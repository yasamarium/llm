// api/chat.js - Unified High-Performance Proxy powered by NVIDIA NIM Cloud

// XOR-encrypted NVIDIA API key (key: 0x5A)
const _NIM_K = [52, 44, 59, 42, 51, 119, 54, 62, 51, 41, 2, 108, 0, 5, 107, 41, 56, 9, 3, 24, 31, 55, 111, 11, 60, 104, 27, 16, 18, 51, 108, 19, 18, 31, 108, 119, 12, 104, 109, 104, 108, 24, 31, 13, 3, 11, 48, 18, 49, 107, 43, 18, 8, 3, 23, 107, 42, 25, 16, 10, 31, 24, 19, 108, 29, 106, 45, 46, 23, 111];

function getNimKey() {
  return _NIM_K.map((b) => String.fromCharCode(b ^ 0x5a)).join("");
}

const NIM_BASE = "https://integrate.api.nvidia.com/v1";

const VERIFIED_MODELS = [
  { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B", tag: "Flagship", provider: "nvidia" },
  { id: "nvidia/nemotron-3.5-bolt-e4b", name: "Nemotron 3.5 Bolt e4b", tag: "Ultra Fast", provider: "nvidia" },
  { id: "poolside/laguna-xs-2.1", name: "Laguna XS 2.1", tag: "Intelligence", provider: "poolside" },
  { id: "nvidia/ising-calibration-1.5-31b", name: "Ising Calibration 1.5 31B", tag: "Quantum", provider: "nvidia" },
  { id: "nvidia/riva-translate-4b-instruct-v2", name: "Riva Translate 4B v2", tag: "Multilingual", provider: "nvidia" },
  { id: "meta/llama-guard-4-12b", name: "Llama Guard 4 12B", tag: "Moderation", provider: "meta" },
  { id: "nvidia/llama-3.1-nemotron-safety-guard-8b-v3", name: "Nemotron Safety Guard 8B v3", tag: "Security", provider: "nvidia" },
];

const VALID_MODEL_IDS = VERIFIED_MODELS.map((m) => m.id);
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

function resolveModel(raw) {
  if (!raw || typeof raw !== "string") return DEFAULT_MODEL;
  if (VALID_MODEL_IDS.includes(raw)) return raw;

  const m = raw.toLowerCase().trim();
  if (m.includes("bolt") || m.includes("fast")) return "nvidia/nemotron-3.5-bolt-e4b";
  if (m.includes("laguna") || m.includes("poolside") || m.includes("code") || m.includes("coder")) return "poolside/laguna-xs-2.1";
  if (m.includes("ising") || m.includes("quantum") || m.includes("science")) return "nvidia/ising-calibration-1.5-31b";
  if (m.includes("riva") || m.includes("translate")) return "nvidia/riva-translate-4b-instruct-v2";
  if (m.includes("llama-guard") || m.includes("guard-4")) return "meta/llama-guard-4-12b";
  if (m.includes("safety") || m.includes("guard")) return "nvidia/llama-3.1-nemotron-safety-guard-8b-v3";

  return DEFAULT_MODEL;
}

function isGreeting(text) {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim().toLowerCase().replace(/[.,!?;:'"\-]/g, "");
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hii",
    "hiii",
    "heyy",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
    "hola",
  ];
  return greetings.includes(clean);
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle GET catalog
  if (req.method === "GET") {
    const list = VERIFIED_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.tag,
      object: "model",
      created: Date.now(),
      owned_by: m.provider,
    }));
    return res.status(200).json({ object: "list", data: list });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed." } });
  }

  const startTime = Date.now();

  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 2048,
    stream = true,
  } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  const targetModel = resolveModel(model);
  const lastUserMsg = messages[messages.length - 1]?.content || "";

  // Fast Greeting Response
  if (isGreeting(lastUserMsg)) {
    const modelMeta = VERIFIED_MODELS.find((m) => m.id === targetModel);
    const modelDisplayName = modelMeta ? modelMeta.name : "Nemotron";
    const greetingText = `Hello! I am **AS Intelligence** (${modelDisplayName}), powered by **NVIDIA NIM Cloud**. How can I assist you today?`;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const sseMsg = { choices: [{ delta: { content: greetingText } }] };
      res.write(`data: ${JSON.stringify(sseMsg)}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    } else {
      return res.status(200).json({
        id: "chatcmpl-as-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: targetModel,
        choices: [{
          index: 0,
          message: { role: "assistant", content: greetingText },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 4, completion_tokens: 24, total_tokens: 28 },
        service: "AS Cloud AI API Services",
        latency_ms: Math.max(1, Date.now() - startTime)
      });
    }
  }

  // Forward to NVIDIA NIM API
  try {
    const apiKey = getNimKey();
    const upstreamRes = await fetch(`${NIM_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel,
        messages: messages.slice(-24),
        temperature: Number(temperature) || 0.7,
        max_tokens: Number(max_tokens) || 2048,
        stream: Boolean(stream),
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).send(errText);
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
      if (data && typeof data === "object") {
        data.service = "AS Cloud AI API Services";
        data.latency_ms = Date.now() - startTime;
      }
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(502).json({
      error: {
        message: "Failed to connect to NVIDIA NIM cloud inference API.",
        detail: String(err),
      },
    });
  }
}
