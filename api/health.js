// api/health.js - Checks health of 1B or 1.7B cluster nodes

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
  const is1B = modelQuery.includes("1b");

  const endpointsToCheck = is1B ? [NODE_1B] : CLUSTER_1_7B;

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
          model: is1B ? "1B" : "1.7B",
          serverUrl: targetUrl,
          data,
        });
      }
    } catch (e) {}
  }

  return res.status(200).json({
    status: "offline",
    model: is1B ? "1B" : "1.7B",
    message: "Nodes initializing",
  });
}
