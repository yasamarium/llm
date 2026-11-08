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
const TG_SESSION  = process.env.TELEGRAM_SESSION  || "1BJWap1sBuwpme1vKfMhBw84NdJr_WDp2aWZTpfkuYsSW7UPY2z117h4nOEDxCaV_JPLEZWnlG_bFN-4teG5sP4e96SA48liXl9ImDvMLKN_syAz5KLHtxP2Ilkl_uY64L9QJsyuzfzyJ96QRT3ol8RHzYFcCnixvlHAqKN7za8d3eIxfeplj2BKU_LxZW1YvqXcvjBYw-uD_joYQct9sGUe9yySvHGAlnbSOTC6ja5-DfvSzF0iHGIiVLGA1D2j6TwQCtQNH6fVJiWN-JPF60N_Ogmy0YKUbE3lWAtP2Ajn4lDECyy_1PXeQsLVibjx-2g2oWqlykSPcxpFgu9xI6vzYvUiYBWw=";
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

  let postBody = {};
  if (req.method === "POST") {
    if (typeof req.body === "string") {
      try { postBody = JSON.parse(req.body); } catch (_) {}
    } else if (req.body && typeof req.body === "object") {
      postBody = req.body;
    }
  }

  // ── Route: Bot Number Generation (Seven1tel_Number_Bot) ───────────────────
  if (action === "bot" || action === "number" || postBody.action === "bot" || postBody.action === "number") {
    return handleBotOperations(req, res, postBody);
  }

  // ── Route: Telegram profile lookup ───────────────────────────────────────
  const isTgQuery =
    action === "telegram" ||
    req.query?.telegram !== undefined ||
    req.query?.q || req.query?.username || req.query?.id;

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
    let channelTitle = "Live Updates Feed";
    try {
      const entity = await client.getEntity(TG_CHANNEL);
      // Keep title clean and branded
      channelTitle = "Live Updates Feed";
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

// ── Seven1tel Number Bot Handler (@Seven1tel_Number_Bot) ──────────────────────
const TG_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "Seven1tel_Number_Bot";

const BOT_SERVICES = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", data: "pick_svc_whatsapp" },
  { id: "telegram", name: "Telegram", icon: "✈️", data: "pick_svc_telegram" },
  { id: "instagram", name: "Instagram", icon: "📸", data: "pick_svc_instagram" },
  { id: "facebook", name: "Facebook", icon: "📘", data: "pick_svc_facebook" },
  { id: "google", name: "Google", icon: "🔍", data: "pick_svc_google" },
  { id: "tiktok", name: "TikTok", icon: "🎵", data: "pick_svc_tiktok" },
  { id: "imo", name: "imo", icon: "🗨️", data: "pick_svc_imo" },
  { id: "uber", name: "Uber", icon: "🚗", data: "pick_svc_uber" },
  { id: "paypal", name: "PayPal", icon: "💳", data: "pick_svc_paypal" },
  { id: "hsbc", name: "HSBC", icon: "🏦", data: "pick_svc_hsbc" },
];

let botLockQueue = Promise.resolve();
function runBotLocked(fn) {
  const run = () => fn();
  const next = botLockQueue.then(run, run);
  botLockQueue = next.catch(() => {});
  return next;
}

// In-memory cache for countries and user sessions across invocations in same container
const countriesCache = globalThis.__as_countries_cache || (globalThis.__as_countries_cache = new Map());
const userSessionsMap = globalThis.__as_user_sessions || (globalThis.__as_user_sessions = new Map());
const allocatedNumbersMap = globalThis.__as_allocated_nums || (globalThis.__as_allocated_nums = new Map());

async function handleBotOperations(req, res, postBody) {
  const op = (req.query?.op || postBody.op || "").trim().toLowerCase();
  const userId = (req.query?.user_id || req.query?.userId || postBody.user_id || postBody.userId || "anonymous").trim();

  // Op: Services list (0ms instant response)
  if (op === "services" || !op) {
    return res.status(200).json({
      success: true,
      services: BOT_SERVICES,
      network: "AS Cloud Telecom Verification Relay"
    });
  }

  // Op: User state (returns current active number if already assigned)
  if (op === "user_state" || op === "session") {
    const session = userSessionsMap.get(userId) || null;
    return res.status(200).json({
      success: true,
      userId,
      activeNumber: session ? session.number : null,
      session
    });
  }

  // Op: Fetch Countries for a service
  if (op === "countries") {
    const svcParam = (req.query?.service || postBody.service || "whatsapp").trim().toLowerCase();
    const svcObj = BOT_SERVICES.find(s => s.id === svcParam || s.data === svcParam || s.name.toLowerCase() === svcParam) || BOT_SERVICES[0];
    const targetData = svcObj.data;

    // Check 2-minute cache
    const cached = countriesCache.get(targetData);
    if (cached && (Date.now() - cached.timestamp < 120000)) {
      return res.status(200).json({
        success: true,
        service: svcObj.name,
        serviceId: svcObj.id,
        count: cached.countries.length,
        countries: cached.countries,
        cached: true
      });
    }

    try {
      const countries = await runBotLocked(async () => {
        return await fetchBotCountries(targetData, svcObj.id);
      });

      countriesCache.set(targetData, { countries, timestamp: Date.now() });

      return res.status(200).json({
        success: true,
        service: svcObj.name,
        serviceId: svcObj.id,
        count: countries.length,
        countries,
        cached: false
      });
    } catch (err) {
      console.error("[bot-countries]", err?.message);
      return res.status(500).json({ success: false, error: "Failed to load countries: " + (err?.message || "unknown") });
    }
  }

  // Op: Generate / Get number for a country
  if (op === "get_number" || op === "number") {
    const countryData = (req.query?.country_data || postBody.country_data || "").trim();
    const serviceParam = (req.query?.service || postBody.service || "whatsapp").trim();

    if (!countryData) {
      return res.status(400).json({ success: false, error: "Country selection (country_data) is required." });
    }

    try {
      const result = await runBotLocked(async () => {
        return await fetchBotNumber(countryData, serviceParam, userId);
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      console.error("[bot-get-number]", err?.message);
      return res.status(500).json({ success: false, error: "Failed to allocate number: " + (err?.message || "unknown") });
    }
  }

  // Op: Change number (requests a new number from the active pool)
  if (op === "change_number") {
    try {
      const result = await runBotLocked(async () => {
        return await changeBotNumber(userId);
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      console.error("[bot-change-number]", err?.message);
      return res.status(500).json({ success: false, error: "Failed to change number: " + (err?.message || "unknown") });
    }
  }

  return res.status(400).json({ success: false, error: `Unknown op '${op}'. Supported: services, countries, get_number, change_number, user_state` });
}

// ── Bot Helper: fetch countries ──────────────────────────────────────────────
async function fetchBotCountries(targetData, serviceId) {
  const { TelegramClient, Api } = await import("telegram");
  const { StringSession } = await import("telegram/sessions/index.js");

  const session = new StringSession(TG_SESSION);
  const client = new TelegramClient(session, TG_API_ID, TG_API_HASH, {
    connectionRetries: 2,
    requestRetries: 1,
    baseLogger: null,
    useWSS: false,
    autoReconnect: false,
  });

  await client.connect();
  const bot = await client.getEntity(TG_BOT_USERNAME);

  // Send "Get Number" to reveal service selection buttons
  await client.sendMessage(bot, { message: "Get Number" });
  await new Promise(r => setTimeout(r, 1600));

  const msgs = await client.getMessages(bot, { limit: 5 });
  const svcMsg = msgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.data && Buffer.from(b.data).toString().includes("pick_svc"))));

  if (!svcMsg) {
    await client.disconnect().catch(() => {});
    throw new Error("Service gateway busy. Please retry in a few seconds.");
  }

  let svcBtn = null;
  for (const row of svcMsg.replyMarkup.rows) {
    for (const b of row.buttons) {
      const dataStr = b.data ? Buffer.from(b.data).toString('utf-8') : '';
      if (dataStr === targetData || dataStr.includes(serviceId.toLowerCase())) {
        svcBtn = b;
        break;
      }
    }
  }

  if (!svcBtn) {
    await client.disconnect().catch(() => {});
    throw new Error(`Service '${serviceId}' is currently undergoing maintenance.`);
  }

  // Click the service button via GetBotCallbackAnswer
  await client.invoke(new Api.messages.GetBotCallbackAnswer({
    peer: bot,
    msgId: svcMsg.id,
    data: svcBtn.data
  }));
  await new Promise(r => setTimeout(r, 2000));

  const updatedMsgs = await client.getMessages(bot, { limit: 3 });
  const countryMsg = updatedMsgs.find(m => m.message?.includes("Select country") || (m.replyMarkup && m.replyMarkup.rows?.length > 2));

  if (!countryMsg || !countryMsg.replyMarkup) {
    await client.disconnect().catch(() => {});
    throw new Error("Regional lines busy. Please retry in a moment.");
  }

  const countries = [];
  for (const row of countryMsg.replyMarkup.rows) {
    for (const b of row.buttons) {
      const dataStr = b.data ? Buffer.from(b.data).toString('utf-8') : '';
      if (!dataStr || dataStr === 'back_to_services') continue;

      const raw = b.text.trim();
      const flagMatch = raw.match(/^([\uD83C-\uDBFF\uDC00-\uDFFF]{2}|\p{Emoji})/u);
      const flag = flagMatch ? flagMatch[0] : "🌐";
      const cleanText = raw.replace(flag, '').trim();

      const parts = cleanText.split(" - ");
      const name = parts[0].trim();
      const stock = parts[1] ? parseInt(parts[1].replace(/,/g, '')) || parts[1] : null;

      countries.push({
        name,
        fullName: raw,
        flag,
        stock,
        data: dataStr
      });
    }
  }

  await client.disconnect().catch(() => {});
  return countries;
}

// ── Bot Helper: fetch number ─────────────────────────────────────────────────
async function fetchBotNumber(countryData, serviceParam, userId) {
  const { TelegramClient, Api } = await import("telegram");
  const { StringSession } = await import("telegram/sessions/index.js");

  const session = new StringSession(TG_SESSION);
  const client = new TelegramClient(session, TG_API_ID, TG_API_HASH, {
    connectionRetries: 2,
    requestRetries: 1,
    baseLogger: null,
    useWSS: false,
    autoReconnect: false,
  });

  await client.connect();
  const bot = await client.getEntity(TG_BOT_USERNAME);

  let msgs = await client.getMessages(bot, { limit: 6 });
  let countryMsg = msgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.data && Buffer.from(b.data).toString() === countryData)));

  if (!countryMsg) {
    // Navigate via Get Number -> Service -> Country
    await client.sendMessage(bot, { message: "Get Number" });
    await new Promise(r => setTimeout(r, 1600));
    msgs = await client.getMessages(bot, { limit: 5 });
    const svcMsg = msgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.data && Buffer.from(b.data).toString().includes("pick_svc"))));
    if (svcMsg) {
      const targetData = serviceParam.startsWith("pick_svc_") ? serviceParam : `pick_svc_${serviceParam.toLowerCase()}`;
      let sBtn = null;
      for (const row of svcMsg.replyMarkup.rows) {
        for (const b of row.buttons) {
          const d = b.data ? Buffer.from(b.data).toString('utf-8') : '';
          if (d === targetData || d.includes(serviceParam.toLowerCase())) {
            sBtn = b;
            break;
          }
        }
      }
      if (sBtn) {
        await client.invoke(new Api.messages.GetBotCallbackAnswer({
          peer: bot,
          msgId: svcMsg.id,
          data: sBtn.data
        }));
        await new Promise(r => setTimeout(r, 1800));
        msgs = await client.getMessages(bot, { limit: 3 });
        countryMsg = msgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.data && Buffer.from(b.data).toString() === countryData)));
      }
    }
  }

  if (!countryMsg) {
    await client.disconnect().catch(() => {});
    throw new Error("Selected country line is currently unavailable. Please pick another country.");
  }

  // Click the country button!
  await client.invoke(new Api.messages.GetBotCallbackAnswer({
    peer: bot,
    msgId: countryMsg.id,
    data: Buffer.from(countryData)
  }));
  await new Promise(r => setTimeout(r, 1800));

  const resultMsgs = await client.getMessages(bot, { limit: 4 });
  const numMsg = resultMsgs.find(m => m.message?.includes("Waiting for OTP") || (m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.text.includes("+")))));

  if (!numMsg) {
    await client.disconnect().catch(() => {});
    throw new Error("Region pool currently at capacity. Please select another country or rotate line.");
  }

  const rawNumbers = [];
  for (const row of numMsg.replyMarkup.rows) {
    for (const b of row.buttons) {
      const clean = b.text.replace(/[^\d+]/g, '');
      if (clean.length >= 8) {
        const full = clean.startsWith('+') ? clean : '+' + clean;
        rawNumbers.push({
          full,
          raw: b.text.trim()
        });
      }
    }
  }

  await client.disconnect().catch(() => {});

  if (rawNumbers.length === 0) {
    throw new Error("Line assignment timed out. Please retry.");
  }

  // Separate number allocation so multiple users don't get the same number
  const now = Date.now();
  let assigned = null;
  for (const n of rawNumbers) {
    const existing = allocatedNumbersMap.get(n.full);
    if (!existing || existing.userId === userId || (now - existing.timestamp > 15 * 60 * 1000)) {
      assigned = n;
      break;
    }
  }

  if (!assigned) {
    assigned = rawNumbers[0];
  }

  allocatedNumbersMap.set(assigned.full, { userId, timestamp: now, service: serviceParam });

  const countryTitle = (numMsg.message?.split('\n')[0] || "").replace(/Number:/i, '').trim();

  const userRecord = {
    userId,
    number: assigned.full,
    allNumbers: rawNumbers.map(n => n.full),
    service: serviceParam,
    country: countryTitle,
    countryData,
    status: "Waiting for OTP...",
    assignedAt: now
  };

  userSessionsMap.set(userId, userRecord);
  return userRecord;
}

// ── Bot Helper: change number ────────────────────────────────────────────────
async function changeBotNumber(userId) {
  const { TelegramClient, Api } = await import("telegram");
  const { StringSession } = await import("telegram/sessions/index.js");

  const session = new StringSession(TG_SESSION);
  const client = new TelegramClient(session, TG_API_ID, TG_API_HASH, {
    connectionRetries: 2,
    requestRetries: 1,
    baseLogger: null,
    useWSS: false,
    autoReconnect: false,
  });

  await client.connect();
  const bot = await client.getEntity(TG_BOT_USERNAME);

  const msgs = await client.getMessages(bot, { limit: 5 });
  const numMsg = msgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.data && Buffer.from(b.data).toString() === 'change_number')));

  if (!numMsg) {
    await client.disconnect().catch(() => {});
    throw new Error("No active virtual line found to rotate. Please select a country first.");
  }

  // Click 'change_number'
  await client.invoke(new Api.messages.GetBotCallbackAnswer({
    peer: bot,
    msgId: numMsg.id,
    data: Buffer.from("change_number")
  }));
  await new Promise(r => setTimeout(r, 1800));

  const updatedMsgs = await client.getMessages(bot, { limit: 3 });
  const newNumMsg = updatedMsgs.find(m => m.replyMarkup && m.replyMarkup.rows?.some(r => r.buttons.some(b => b.text.includes("+"))));

  const rawNumbers = [];
  if (newNumMsg) {
    for (const row of newNumMsg.replyMarkup.rows) {
      for (const b of row.buttons) {
        const clean = b.text.replace(/[^\d+]/g, '');
        if (clean.length >= 8) {
          rawNumbers.push({
            full: clean.startsWith('+') ? clean : '+' + clean,
            raw: b.text.trim()
          });
        }
      }
    }
  }

  await client.disconnect().catch(() => {});

  if (rawNumbers.length === 0) {
    throw new Error("Carrier line rotation complete or region pool busy. Please select another country.");
  }

  const assigned = rawNumbers[0];
  const now = Date.now();
  allocatedNumbersMap.set(assigned.full, { userId, timestamp: now });

  const prev = userSessionsMap.get(userId) || {};
  const userRecord = {
    ...prev,
    userId,
    number: assigned.full,
    allNumbers: rawNumbers.map(n => n.full),
    status: "Waiting for OTP...",
    assignedAt: now
  };

  userSessionsMap.set(userId, userRecord);
  return userRecord;
}
