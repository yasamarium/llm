// api/health.js - Checks health of any AS Cloud fleet node

const ENDPOINTS = {
  "r1": { list: ["https://raw.githubusercontent.com/yasamarium/server9/main/endpoint.txt"], label: "DeepSeek-R1" },
  "coder": { list: ["https://raw.githubusercontent.com/yasamarium/server10/main/endpoint.txt"], label: "Qwen-Coder" },
  "gemma": { list: ["https://raw.githubusercontent.com/yasamarium/server11/main/endpoint.txt"], label: "Gemma-2" },
  "smol": { list: ["https://raw.githubusercontent.com/yasamarium/server12/main/endpoint.txt"], label: "SmolLM2" },
  "math": { list: ["https://raw.githubusercontent.com/yasamarium/server13/main/endpoint.txt"], label: "Qwen-Math" },
  "phi": { list: ["https://raw.githubusercontent.com/yasamarium/server14/main/endpoint.txt"], label: "Phi-3.5" },
  "image": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server7/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server8/main/endpoint.txt",
    ],
    label: "SD-Turbo",
  },
  "0.5b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
    ],
    label: "0.5B",
  },
  "1b": { list: ["https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt"], label: "1B" },
  "1.7b": {
    list: [
      "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
      "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
    ],
    label: "1.7B",
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
  if (m.includes("r1") || m.includes("deepseek")) return "r1";
  if (m.includes("coder") || m.includes("code")) return "coder";
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
  const config = ENDPOINTS[modelKey] || ENDPOINTS["1.7b"];
  const endpointsToCheck = config.list;
  const modelLabel = config.label;

  for (const endpointMeta of endpointsToCheck) {
    const targetUrl = await fetchEndpointUrl(endpointMeta);
    if (!targetUrl) continue;

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
    message: "Nodes initializing",
  });
}
