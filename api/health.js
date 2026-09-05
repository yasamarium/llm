// api/health.js - Checks health of 0.5B, 1B, 1.7B or SD-Turbo cluster nodes

const CLUSTER_IMAGE = [
  "https://raw.githubusercontent.com/yasamarium/server7/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server8/main/endpoint.txt",
];

const CLUSTER_0_5B = [
  "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
];

const NODE_1B = "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt";

const CLUSTER_1_7B = [
  "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
  "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
];

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const modelQuery = (req.query.model || "1.7b").toLowerCase();
  const isImage = modelQuery.includes("image") || modelQuery.includes("turbo");
  const is05B = modelQuery.includes("0.5b");
  const is1B = modelQuery.includes("1b") && !is05B;

  let endpointsToCheck = CLUSTER_1_7B;
  let modelLabel = "1.7B";

  if (isImage) {
    endpointsToCheck = CLUSTER_IMAGE;
    modelLabel = "SD-Turbo";
  } else if (is05B) {
    endpointsToCheck = CLUSTER_0_5B;
    modelLabel = "0.5B";
  } else if (is1B) {
    endpointsToCheck = [NODE_1B];
    modelLabel = "1B";
  }

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
