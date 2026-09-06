// api/health.js - Checks health across multi-replica AS Cloud fleet

const ENDPOINTS = {
  "r1": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server9/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server15/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server16/main/endpoint.txt",
    ],
    label: "DeepSeek-R1 (3 Nodes)",
  },
  "coder": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server10/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server17/main/endpoint.txt",
    ],
    label: "Qwen-Coder (2 Nodes)",
  },
  "llama3b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server19/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server20/main/endpoint.txt",
    ],
    label: "Llama High (2 Nodes)",
  },
  "qwen3b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server21/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server22/main/endpoint.txt",
    ],
    label: "Qwen High (2 Nodes)",
  },
  "gemma": {
    list: ["https://raw.githubusercontent.com/yasamarium/server11/main/endpoint.txt"],
    label: "Gemma Medium",
  },
  "smol": {
    list: ["https://raw.githubusercontent.com/yasamarium/server12/main/endpoint.txt"],
    label: "SmolLM Medium",
  },
  "math": {
    list: ["https://raw.githubusercontent.com/yasamarium/server13/main/endpoint.txt"],
    label: "Math Medium",
  },
  "phi": {
    list: ["https://raw.githubusercontent.com/yasamarium/server14/main/endpoint.txt"],
    label: "Phi Medium",
  },
  "image": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server7/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server8/main/endpoint.txt",
    ],
    label: "SD-Turbo (2 Nodes)",
  },
  "0.5b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
    ],
    label: "Qwen Lightweight (2 Nodes)",
  },
  "1b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server18/main/endpoint.txt",
    ],
    label: "Llama Lightweight (2 Nodes)",
  },
  "1.7b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
    ],
    label: "Qwen Medium Cluster (4 Nodes)",
  },
};

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

function normalizeKey(raw) {
  const m = (raw || "").toLowerCase();
  if (m.includes("gpt-5") || m.includes("gpt5")) return "gpt-5";
  if (m.includes("kimi") || m.includes("k2.6")) return "kimi-k2.6";
  if (m.includes("claude") || m.includes("opus")) return "claude-opus-4.8";
  if (m.includes("gemini-3.1") || m.includes("gemini 3.1") || m.includes("3.1-pro") || m.includes("3.1 pro") || m.includes("3.1")) return "gemini-3.1-pro";
  if (m.includes("gemini-3") || m.includes("gemini 3") || m.includes("3-pro") || m.includes("3 pro") || m.includes("gemini")) return "gemini-3-pro";
  if (m.includes("qwen3-max") || m.includes("qwen-max") || m.includes("qwen3 max") || m.includes("qwen max") || m.includes("max")) return "qwen3-max";
  if (m.includes("r1") || m.includes("deepseek")) return "r1";
  if (m.includes("coder") || m.includes("code")) return "coder";
  if (m.includes("llama3b") || m.includes("llama-3b") || m.includes("llama 3b") || m.includes("llama")) return "llama3b";
  if (m.includes("qwen3b") || m.includes("qwen-3b") || m.includes("qwen 3b") || m.includes("3b")) return "qwen3b";
  if (m.includes("gemma")) return "gemma";
  if (m.includes("smol")) return "smol";
  if (m.includes("math")) return "math";
  if (m.includes("phi")) return "phi";
  if (m.includes("image") || m.includes("turbo")) return "image";
  if (m.includes("0.5b")) return "0.5b";
  if (m.includes("1b")) return "1b";
  return "1.7b";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const modelKey = normalizeKey(req.query.model || "1.7b");

  // Health status for EXCLUSIVE S-62 Flagship models
  const s62Labels = {
    "gpt-5": "GPT-5 (EXCLUSIVE S-62)",
    "claude-opus-4.8": "Claude Opus 4.8 (EXCLUSIVE S-62)",
    "kimi-k2.6": "Kimi K2.6 (EXCLUSIVE S-62)",
    "gemini-3-pro": "Gemini 3 Pro (EXCLUSIVE S-62)",
    "gemini-3.1-pro": "Gemini 3.1 Pro (EXCLUSIVE S-62)",
    "qwen3-max": "Qwen 3 Max (EXCLUSIVE S-62)",
  };

  if (s62Labels[modelKey]) {
    return res.status(200).json({
      status: "ok",
      model: s62Labels[modelKey],
      serverUrl: "https://apis.davidcyril.name.ng",
      tier: "EXCLUSIVE S-62",
      badge: "EXCLUSIVE S-62",
    });
  }

  const config = ENDPOINTS[modelKey] || ENDPOINTS["1.7b"];
  const endpointsToCheck = config.list;
  const modelLabel = config.label;

  for (const endpointMeta of endpointsToCheck) {
    const targetUrl = await fetchEndpointUrl(endpointMeta);
    if (!targetUrl || targetUrl.includes("localhost") || targetUrl.includes("example.com")) continue;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const upstream = await fetch(`${targetUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (upstream.ok) {
        const data = await upstream.json();
        return res.status(200).json({
          status: "ok",
          model: modelLabel,
          serverUrl: targetUrl,
          data,
        });
      }
    } catch (e) {}
  }

  return res.status(200).json({
    status: "offline",
    model: modelLabel,
    message: "Nodes connecting",
  });
}
