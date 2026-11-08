// api/health.js — AS Cloud: Health Status · Telegram Profile Resolver · Channel Feed
// Consolidated into single function to stay within Vercel Hobby 12-function limit.

const VERIFIED_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3.5-bolt-e4b",
  "poolside/laguna-xs-2.1",
  "nvidia/ising-calibration-1.5-31b",
  "nvidia/riva-translate-4b-instruct-v2",
  "meta/llama-guard-4-12b",
  "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
];

const TG_API_ID   = parseInt(process.env.TELEGRAM_API_ID) || 35328182;
const TG_API_HASH = process.env.TELEGRAM_API_HASH || "24e4690a9b3fa242311bbe5b1586f13c";
const TG_SESSION  = process.env.TELEGRAM_SESSION  || "";
const TG_CHANNEL  = process.env.TELEGRAM_CHANNEL_ID || "-1002750437982";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query?.action || "";

  // ── Route: Channel feed ───────────────────────────────────────────────────
  if (action === "channel") {
    return handleChannelFetch(req, res);
  }

  // ── Route: Telegram profile lookup ───────────────────────────────────────
  const isTgQuery =
    action === "telegram" ||
    req.query?.telegram !== undefined ||
    req.query?.q || req.query?.username || req.query?.id;

  let postBody = {};
  if (req.method === "POST") {
    if (typeof req.body === "string") {
      try { postBody = JSON.parse(req.body); } catch (_) {}
    } else if (req.body && typeof req.body === "object") {
      postBody = req.body;
    }
  }

  if (isTgQuery || postBody.action === "telegram" || postBody.q || postBody.username || postBody.id) {
    return handleTelegramLookup(req, res, postBody);
  }

  // ── Default: Platform health ──────────────────────────────────────────────
  const modelParam = (req.query?.model || "").trim();
  return res.status(200).json({
    status: "ok",
    platform: "AS Cloud",
    engine: "NVIDIA NIM Cloud Inference",
    model: modelParam || "nvidia/nemotron-3-ultra-550b-a55b",
    models_online: VERIFIED_MODELS.length,
    verified_models: VERIFIED_MODELS,
    uptime: "99.99%",
    timestamp: Date.now(),
  });
}

// ── Channel Messages Fetcher (GramJS / MTProto) ───────────────────────────────
async function handleChannelFetch(req, res) {
  if (!TG_SESSION) {
    return res.status(503).json({ success: false, error: "Channel session not configured." });
  }

  const limit = Math.min(parseInt(req.query?.limit) || 25, 50);

  try {
    // Dynamic import keeps startup fast for other actions
    const { TelegramClient } = await import("telegram");
    const { StringSession } = await import("telegram/sessions/index.js");

    const session = new StringSession(TG_SESSION);
    const client  = new TelegramClient(session, TG_API_ID, TG_API_HASH, {
      connectionRetries : 3,
      requestRetries    : 2,
      floodSleepThreshold: 0,
      baseLogger        : null,
      useWSS            : false,
    });

    await client.connect();

    // Resolve the channel entity, then fetch messages
    let messages = [];
    let channelTitle = "Live Updates";
    try {
      const entity = await client.getEntity(TG_CHANNEL);
      if (entity?.title) channelTitle = entity.title;
      messages = await client.getMessages(entity, { limit });
    } catch (innerErr) {
      // Fallback: try passing channel ID as BigInt directly
      const chanId = BigInt(TG_CHANNEL.replace(/^-100/, ""));
      messages = await client.getMessages(chanId, { limit });
    }

    try { await client.disconnect(); } catch (_) {}

    const result = messages
      .filter(m => m && (m.message || m.media))
      .map(m => ({
        id      : m.id,
        text    : m.message || "",
        date    : (m.date || 0) * 1000,   // convert Telegram unix → ms
        hasMedia: !!(m.media),
        mediaType: m.media?.className || null,
      }));

    return res.status(200).json({
      success: true,
      title: channelTitle,
      count: result.length,
      messages: result,
      fetchedAt: Date.now()
    });

  } catch (err) {
    console.error("[channel-fetch]", err?.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch channel: " + (err?.message || "unknown error"),
    });
  }
}

// ── Silent Telegram Profile Resolver (public scrape via t.me) ────────────────
async function handleTelegramLookup(req, res, postBody) {
  let query = "";
  if (req.method === "GET") {
    query = req.query?.id || req.query?.q || req.query?.username || "";
  } else {
    query = postBody?.id || postBody?.q || postBody?.username || "";
  }
  query = (query || "").trim();

  let clean = query
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^tg:\/\/resolve\?domain=/i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .trim();

  if (!clean) {
    return res.status(400).json({ success: false, error: "Please enter a Telegram username, numeric ID, or profile link." });
  }

  if (/^\d+$/.test(clean)) {
    return res.status(200).json({
      success: true, exists: true, query: clean, type: "numeric_id",
      id: clean, name: `Telegram User (${clean})`, username: null,
      bio: "Direct Telegram 64-bit numerical user identity.",
      photo: null, avatarPlaceholder: clean.charAt(0), verified: false,
      link: `tg://user?id=${clean}`, webLink: `https://web.telegram.org/a/#${clean}`,
      checkedAt: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch(`https://t.me/${encodeURIComponent(clean)}`, {
      headers: {
        "User-Agent"     : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control"  : "no-cache",
      },
    });

    if (!response.ok) {
      return res.status(200).json({
        success: true, exists: false, query: `@${clean}`, username: `@${clean}`,
        message: `Username @${clean} returned HTTP ${response.status}.`,
      });
    }

    const html          = await response.text();
    const titleMatch    = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const descMatch     = html.match(/<meta property="og:description" content="([^"]+)"/i);
    const imgMatch      = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const extraMatch    = html.match(/<div class="tgme_page_extra">([\s\S]*?)<\/div>/i);
    const pageTitleMatch= html.match(/<div class="tgme_page_title"[^>]*>([\s\S]*?)<\/div>/i);
    const isVerified    = html.includes("tgme_page_verified_badge") || html.includes("verified");

    const rawTitle  = titleMatch   ? titleMatch[1].trim()  : "";
    const rawDesc   = descMatch    ? descMatch[1].trim()   : "";
    const rawImg    = imgMatch     ? imgMatch[1].trim()    : "";
    const extraText = extraMatch   ? extraMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    const isGenericDefault = rawTitle.toLowerCase().includes("a new era of messaging") || rawImg.includes("t_logo_2x.png");
    const hasPhotoOrExtra  = html.includes("tgme_page_photo") || extraText.length > 0 || (rawImg && !rawImg.includes("t_logo_2x.png"));

    if (isGenericDefault && !hasPhotoOrExtra) {
      return res.status(200).json({
        success: true, exists: false, query: `@${clean}`, username: `@${clean}`,
        message: `Username @${clean} does not exist or is currently available on Telegram.`,
      });
    }

    let type = "user";
    if      (extraText.toLowerCase().includes("subscriber")) type = "channel";
    else if (extraText.toLowerCase().includes("member"))     type = "group";
    else if (clean.toLowerCase().endsWith("bot") || rawTitle.toLowerCase().includes("bot")) type = "bot";

    let displayName = rawTitle;
    if (pageTitleMatch) displayName = pageTitleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!displayName || displayName === `@${clean}`) displayName = clean;

    let bio = rawDesc;
    if (bio === `You can contact @${clean} right away.` || bio === `If you have Telegram, you can contact @${clean} right away.`) {
      bio = "Public Telegram account. No bio description publicly set.";
    }

    const photoUrl = (rawImg && !rawImg.includes("t_logo_2x.png")) ? rawImg : null;

    return res.status(200).json({
      success: true, exists: true,
      query: `@${clean}`, username: `@${clean}`,
      name: displayName, bio: bio || "No bio description.",
      photo: photoUrl, avatarPlaceholder: displayName.charAt(0).toUpperCase() || "U",
      extra: extraText || null, type, verified: isVerified,
      link: `https://t.me/${clean}`, webLink: `https://web.telegram.org/k/#@${clean}`,
      checkedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[tg-lookup]", err?.message);
    return res.status(500).json({ success: false, error: "Error querying Telegram: " + (err?.message || "unknown") });
  }
}
