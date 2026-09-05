// api/health.js - Checks backend status automatically

async function getLiveServerUrl() {
  if (process.env.LLMSERVER_URL) {
    return process.env.LLMSERVER_URL.replace(/\/+$/, "");
  }
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
  } catch (err) {}
  return "http://localhost:8000";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = await getLiveServerUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(`${targetUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (upstream.ok) {
      const data = await upstream.json();
      return res.status(200).json({ status: "ok", serverUrl: targetUrl, data });
    }
    return res.status(upstream.status).json({
      status: "offline",
      serverUrl: targetUrl,
      httpStatus: upstream.status,
    });
  } catch (err) {
    return res.status(200).json({
      status: "offline",
      serverUrl: targetUrl,
      message: err.message,
    });
  }
}
