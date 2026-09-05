// api/health.js - Checks backend server health

const DEFAULT_SERVER_URL = process.env.LLMSERVER_URL || "http://localhost:8000";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = (
    req.query.serverUrl ||
    req.headers["x-server-url"] ||
    DEFAULT_SERVER_URL
  ).replace(/\/+$/, "");

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
      status: "degraded",
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
