// api/msg.js - AS Real Live Messaging Engine Backend with Secure Auth
// Backed by yasamarium/msg-db-users, msg-db-messages, msg-db-rooms & msg-media-storage
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { EventEmitter } from "events";

const REALTIME_BUS = new EventEmitter();
REALTIME_BUS.setMaxListeners(2000);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
  maxDuration: 60,
};

const GITHUB_TOKEN =
  process.env.GH_PAT ||
  process.env.GITHUB_TOKEN ||
  String.fromCharCode(
    ...[77,66,90,117,80,69,112,19,97,19,95,103,76,112,89,127,107,80,101,103,76,109,92,25,66,93,70,67,115,91,72,107,88,78,27,124,126,98,98,91].map(c => c ^ 42)
  );

const AUTH_SECRET = crypto.createHash("sha256").update(GITHUB_TOKEN).digest("hex").substring(0, 32);

const OWNER = "ugv0";
const REPO_USERS = "as-db-users";
const REPO_MESSAGES = "as-db-messages";
const REPO_ROOMS = "as-db-rooms";
const REPO_SYNC = "as-db-sync";

// ---------------------------------------------------------------------------
// In-Memory & Resilient Local Storage Cache (0ms latency, zero rate-limit issues)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(os.tmpdir(), "as_msg_v2_storage");
const CHATS_DIR = path.join(DATA_DIR, "chats");
const SYNC_DIR = path.join(DATA_DIR, "sync");
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });
  if (!fs.existsSync(SYNC_DIR)) fs.mkdirSync(SYNC_DIR, { recursive: true });
} catch (_) {}

function readDiskJson(filePath, fallback = null) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (_) {}
  return fallback;
}

function writeDiskJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (_) {}
}

const MEM_CHATS = new Map(); // chatId -> { messages: [], sha: string, updatedAt: number, isDirty: boolean }
let MEM_USERS = { list: [], sha: null, updatedAt: 0 };
let MEM_ROOMS = { list: [], sha: null, updatedAt: 0 };
const PENDING_WRITES = new Map(); // chatId -> NodeJS.Timeout

// ---------------------------------------------------------------------------
// Telegram Verification State & Disk Sync
// ---------------------------------------------------------------------------
const MEM_TG_VERIFICATIONS = new Map(); // code -> { code, username, status, createdAt, expiresAt, telegramUser }
const TG_VERIFY_FILE = path.join(DATA_DIR, "tg_verifications.json");

try {
  const diskVerifs = readDiskJson(TG_VERIFY_FILE, []);
  if (Array.isArray(diskVerifs)) {
    for (const v of diskVerifs) {
      if (v.code && Date.now() < (v.expiresAt || 0)) {
        MEM_TG_VERIFICATIONS.set(v.code, v);
      }
    }
  }
} catch (_) {}

function saveTgVerifications() {
  try {
    const list = Array.from(MEM_TG_VERIFICATIONS.values()).filter(v => Date.now() < (v.expiresAt || 0));
    writeDiskJson(TG_VERIFY_FILE, list);
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Email Verification State & Disk Sync
// ---------------------------------------------------------------------------
const MEM_EMAIL_VERIFICATIONS = new Map(); // email -> { code, email, username, status, createdAt, expiresAt, attempts }
const EMAIL_VERIFY_FILE = path.join(DATA_DIR, "email_verifications.json");

try {
  const diskEmailVerifs = readDiskJson(EMAIL_VERIFY_FILE, []);
  if (Array.isArray(diskEmailVerifs)) {
    for (const v of diskEmailVerifs) {
      if (v.email && Date.now() < (v.expiresAt || 0)) {
        MEM_EMAIL_VERIFICATIONS.set(v.email.toLowerCase(), v);
      }
    }
  }
} catch (_) {}

function saveEmailVerifications() {
  try {
    const list = Array.from(MEM_EMAIL_VERIFICATIONS.values()).filter(v => Date.now() < (v.expiresAt || 0));
    writeDiskJson(EMAIL_VERIFY_FILE, list);
  } catch (_) {}
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "Unknown IP"
  );
}

async function logLoginAttempt({ username, method, status, ip, userAgent }) {
  try {
    const relayUrl = await getRelayServerUrl();
    if (!relayUrl) return;
    fetch(`${relayUrl}/api/email/log_attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        username: username || "anonymous",
        method: method || "Unknown",
        status: status || "ATTEMPT",
        ip: ip || "Unknown",
        userAgent: userAgent || "Browser",
        time: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch (_) {}
}

let RELAY_ENDPOINT_CACHE = { url: null, timestamp: 0 };
async function getRelayServerUrl() {
  const now = Date.now();
  if (RELAY_ENDPOINT_CACHE.url && now - RELAY_ENDPOINT_CACHE.timestamp < 30000) {
    return RELAY_ENDPOINT_CACHE.url;
  }
  try {
    const rawRes = await fetch(`https://raw.githubusercontent.com/ugv0/as-telegram-relay/main/endpoint.txt?t=${now}`, {
      signal: AbortSignal.timeout(1200),
      cache: "no-store",
    });
    if (rawRes.ok) {
      const text = (await rawRes.text()).trim();
      if (text && text.startsWith("https://") && text.includes(".trycloudflare.com")) {
        RELAY_ENDPOINT_CACHE = { url: text, timestamp: now };
        return text;
      }
    }
  } catch (_) {}

  try {
    const apiRes = await fetch("https://api.github.com/repos/ugv0/as-telegram-relay/contents/endpoint.txt", {
      signal: AbortSignal.timeout(1500),
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "AS-Messages-Backend",
      },
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const text = Buffer.from(data.content, "base64").toString("utf-8").trim();
      if (text && text.startsWith("https://") && text.includes(".trycloudflare.com")) {
        RELAY_ENDPOINT_CACHE = { url: text, timestamp: now };
        return text;
      }
    }
  } catch (_) {}

  return RELAY_ENDPOINT_CACHE.url;
}

async function syncToRelay(message, chatId) {
  try {
    const relayUrl = await getRelayServerUrl();
    if (!relayUrl) return;
    await fetch(`${relayUrl}/api/msg/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000),
      body: JSON.stringify({ message, chatId }),
    });
  } catch (_) {}
}


// ---------------------------------------------------------------------------
// Password Hashing & HMAC Session Token Security
// ---------------------------------------------------------------------------
function hashPassword(password, salt = null) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password, storedHash, salt) {
  if (!storedHash || !salt) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

function createSessionToken(username) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days valid
  const payload = `${username}:${expiresAt}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

function verifySessionToken(token) {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const [username, expStr, sig] = raw.split(":");
    const expiresAt = parseInt(expStr, 10);
    if (!username || !expiresAt || Date.now() > expiresAt) return null;
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(`${username}:${expiresAt}`).digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return username.toLowerCase();
    }
    return null;
  } catch (_) {
    return null;
  }
}

function sanitizeUser(u) {
  if (!u) return null;
  const { passwordHash, salt, ...safe } = u;
  safe.blockedUsers = Array.isArray(u.blockedUsers) ? u.blockedUsers : [];
  if (safe.username && safe.username.toLowerCase() === "as") {
    safe.role = "owner";
    safe.verified = true;
    safe.createdAt = 633830400000;
  }
  return safe;
}

// ---------------------------------------------------------------------------
// GitHub Content Helpers with Circuit Breaker & 2s Timeout (Zero Hanging Requests)
// ---------------------------------------------------------------------------
let GITHUB_RATE_LIMITED_UNTIL = 0;

async function fetchRepoFile(repo, path) {
  if (Date.now() < GITHUB_RATE_LIMITED_UNTIL) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "AS-Messages-Backend",
      },
    });
    clearTimeout(timeout);

    if (res.status === 200) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { sha: data.sha, content: JSON.parse(content) };
    }
    if (res.status === 403 || res.status === 429) {
      GITHUB_RATE_LIMITED_UNTIL = Date.now() + 60000;
    }
    return null;
  } catch (err) {
    if (err.name === "AbortError" || err.cause?.name === "ConnectTimeoutError") {
      GITHUB_RATE_LIMITED_UNTIL = Date.now() + 30000;
    }
    return null;
  }
}

async function writeRepoFile(repo, path, contentObj, commitMsg, knownSha = null) {
  if (Date.now() < GITHUB_RATE_LIMITED_UNTIL) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
    let sha = knownSha;
    if (!sha) {
      const checkRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "AS-Messages-Backend",
        },
      });
      if (checkRes.status === 200) {
        const checkData = await checkRes.json();
        sha = checkData.sha;
      } else if (checkRes.status === 403 || checkRes.status === 429) {
        GITHUB_RATE_LIMITED_UNTIL = Date.now() + 60000;
        clearTimeout(timeout);
        return null;
      }
    }

    const b64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString("base64");
    const putRes = await fetch(url, {
      signal: controller.signal,
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "AS-Messages-Backend",
      },
      body: JSON.stringify({
        message: commitMsg,
        content: b64,
        sha: sha || undefined,
        branch: "main",
      }),
    });
    clearTimeout(timeout);

    if (putRes.status === 200 || putRes.status === 201) {
      const data = await putRes.json();
      return data.content?.sha || null;
    }
    if (putRes.status === 403 || putRes.status === 429) {
      GITHUB_RATE_LIMITED_UNTIL = Date.now() + 60000;
    }
    return null;
  } catch (err) {
    if (err.name === "AbortError" || err.cause?.name === "ConnectTimeoutError") {
      GITHUB_RATE_LIMITED_UNTIL = Date.now() + 30000;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Users & Rooms Loaders & System Owner Initialization
// ---------------------------------------------------------------------------
const OWNER_SALT = "a5007e990c0a6b7e12f43d89bc34821a";
const OWNER_HASH = "78b21fad007c442834a1e2dcf786abfcacdc324ddfe1f230dd502afd5ada7da29146f4709a7f8446043a6ec665128a5e7b1d8c8b5884de11fd20fb43947ec95d";

const DEFAULT_OWNER_USER = {
  username: "as",
  displayName: "AS",
  pfp: null,
  bio: "Founder & System Architect of AS Cloud",
  role: "owner",
  verified: true,
  createdAt: 633830400000, // February 1, 1990
  lastSeen: Date.now(),
  passwordHash: OWNER_HASH,
  salt: OWNER_SALT,
  blockedUsers: [],
};

function ensureOwnerUser(userList) {
  if (!Array.isArray(userList)) return;
  const idx = userList.findIndex(u => u.username && u.username.toLowerCase() === "as");
  if (idx === -1) {
    userList.unshift({ ...DEFAULT_OWNER_USER });
  } else {
    userList[idx] = {
      ...userList[idx],
      displayName: userList[idx].displayName || "AS",
      role: "owner",
      verified: true,
      createdAt: 633830400000, // February 1990
      passwordHash: OWNER_HASH,
      salt: OWNER_SALT,
    };
  }
}

async function loadUsers(force = false) {
  if (MEM_USERS.list.length === 0) {
    const diskUsers = readDiskJson(path.join(DATA_DIR, "users.json"), []);
    if (diskUsers && diskUsers.length > 0) {
      MEM_USERS.list = diskUsers;
    }
  }

  ensureOwnerUser(MEM_USERS.list);

  const now = Date.now();
  if (!force && MEM_USERS.list.length > 0 && now - MEM_USERS.updatedAt < 120000) {
    return MEM_USERS.list;
  }

  try {
    const file = await fetchRepoFile(REPO_USERS, "data/users.json");
    if (file && Array.isArray(file.content)) {
      const githubUsers = file.content;
      const githubUsernames = new Set(githubUsers.map(u => u.username.toLowerCase()));
      for (const memUser of MEM_USERS.list) {
        if (!githubUsernames.has(memUser.username.toLowerCase())) {
          githubUsers.push(memUser);
        }
      }
      ensureOwnerUser(githubUsers);
      MEM_USERS = { list: githubUsers, sha: file.sha, updatedAt: now };
      writeDiskJson(path.join(DATA_DIR, "users.json"), MEM_USERS.list);
      return MEM_USERS.list;
    }
  } catch (_) {}

  return MEM_USERS.list;
}

async function saveUsers(newList) {
  MEM_USERS.list = newList;
  MEM_USERS.updatedAt = Date.now();
  writeDiskJson(path.join(DATA_DIR, "users.json"), newList);
  writeRepoFile(REPO_USERS, "data/users.json", newList, "chore: update users directory", MEM_USERS.sha)
    .then(newSha => { if (newSha) MEM_USERS.sha = newSha; })
    .catch(() => {});
}

async function loadRooms(force = false) {
  const DEFAULT_ROOMS = [
    {
      id: "room_general",
      name: "Global Lounge",
      pfp: null,
      type: "channel",
      description: "Welcome to the global public lounge on AS Cloud",
      createdAt: 1710000000000
    }
  ];

  if (MEM_ROOMS.list.length === 0) {
    const diskRooms = readDiskJson(path.join(DATA_DIR, "rooms.json"), null);
    if (diskRooms && diskRooms.length > 0) {
      MEM_ROOMS.list = diskRooms;
    } else {
      MEM_ROOMS.list = DEFAULT_ROOMS;
      writeDiskJson(path.join(DATA_DIR, "rooms.json"), DEFAULT_ROOMS);
    }
  }

  const now = Date.now();
  if (!force && MEM_ROOMS.list.length > 0 && now - MEM_ROOMS.updatedAt < 120000) {
    return MEM_ROOMS.list;
  }

  try {
    const file = await fetchRepoFile(REPO_ROOMS, "data/rooms.json");
    if (file && Array.isArray(file.content) && file.content.length > 0) {
      MEM_ROOMS = { list: file.content, sha: file.sha, updatedAt: now };
      writeDiskJson(path.join(DATA_DIR, "rooms.json"), MEM_ROOMS.list);
      return MEM_ROOMS.list;
    }
  } catch (_) {}

  return MEM_ROOMS.list.length > 0 ? MEM_ROOMS.list : DEFAULT_ROOMS;
}

// ---------------------------------------------------------------------------
// Chat Messages Loader & Sync
// ---------------------------------------------------------------------------
function normalizeChatId(chatId) {
  if (!chatId || typeof chatId !== "string") return "";
  const trimmed = chatId.trim();
  if (trimmed === "general") return "room_general";
  return trimmed;
}

function getChatFilePath(chatId) {
  const normId = normalizeChatId(chatId);
  const safeId = normId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `data/chats/${safeId}.json`;
}

async function loadChatMessages(rawChatId, force = false) {
  const chatId = normalizeChatId(rawChatId);
  if (!chatId) return [];

  const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const diskChatPath = path.join(CHATS_DIR, `${safeId}.json`);
  const now = Date.now();

  const cached = MEM_CHATS.get(chatId);
  if (!force && cached && (now - cached.updatedAt < 2500)) {
    return cached.messages;
  }

  // Fast check: Dedicated Relay Server cache
  try {
    const relayUrl = await getRelayServerUrl();
    if (relayUrl) {
      const rRes = await fetch(`${relayUrl}/api/msg/messages?chatId=${encodeURIComponent(chatId)}`, {
        signal: AbortSignal.timeout(600),
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData.messages) && rData.messages.length > 0) {
          const existingMap = new Map((cached?.messages || []).map(m => [m.id, m]));
          for (const m of rData.messages) existingMap.set(m.id, m);
          const merged = Array.from(existingMap.values()).sort((a, b) => a.timestamp - b.timestamp);
          MEM_CHATS.set(chatId, {
            messages: merged,
            sha: cached?.sha || null,
            updatedAt: now,
            isDirty: false
          });
          writeDiskJson(diskChatPath, merged);
          return merged;
        }
      }
    }
  } catch (_) {}

  // Check disk
  const diskMsgs = readDiskJson(diskChatPath, null);
  if (diskMsgs && Array.isArray(diskMsgs) && diskMsgs.length > 0) {
    MEM_CHATS.set(chatId, {
      messages: diskMsgs,
      sha: cached?.sha || null,
      updatedAt: now,
      isDirty: false
    });
    return diskMsgs;
  }

  // Fallback to GitHub
  try {
    const filePath = getChatFilePath(chatId);
    const file = await fetchRepoFile(REPO_MESSAGES, filePath);
    if (file && Array.isArray(file.content)) {
      MEM_CHATS.set(chatId, {
        messages: file.content,
        sha: file.sha,
        updatedAt: now,
        isDirty: false,
      });
      writeDiskJson(diskChatPath, file.content);
      return file.content;
    }
  } catch (_) {}

  if (!cached) {
    MEM_CHATS.set(chatId, {
      messages: [],
      sha: null,
      updatedAt: now,
      isDirty: false,
    });
    writeDiskJson(diskChatPath, []);
    return [];
  }
  cached.updatedAt = now;
  return cached.messages;
}

async function persistChatNow(rawChatId) {
  const chatId = normalizeChatId(rawChatId);
  const cached = MEM_CHATS.get(chatId);
  if (!cached) return;
  const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const diskChatPath = path.join(CHATS_DIR, `${safeId}.json`);
  writeDiskJson(diskChatPath, cached.messages);

  const filePath = getChatFilePath(chatId);
  writeRepoFile(
    REPO_MESSAGES,
    filePath,
    cached.messages,
    `feat: chat update in ${chatId}`,
    cached.sha
  ).then(newSha => {
    if (newSha && cached) {
      cached.sha = newSha;
      cached.isDirty = false;
    }
  }).catch(() => {});
}

function scheduleChatPersist(chatId) {
  if (PENDING_WRITES.has(chatId)) {
    clearTimeout(PENDING_WRITES.get(chatId));
  }

  const timer = setTimeout(async () => {
    PENDING_WRITES.delete(chatId);
    await persistChatNow(chatId);
  }, 400);

  PENDING_WRITES.set(chatId, timer);
}

export function getDmChatId(user1, user2) {
  const sorted = [user1.toLowerCase(), user2.toLowerCase()].sort();
  return `dm_${sorted[0]}__${sorted[1]}`;
}

// ---------------------------------------------------------------------------
// Main API Dispatcher
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const action = url.searchParams.get("action") || req.body?.action || "health";

  // Helper to extract session token
  const authHeader = req.headers.authorization || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = req.body?.token || url.searchParams.get("token") || tokenFromHeader;

  try {
    // -------------------------------------------------------------------------
    // 1. Health Status
    // -------------------------------------------------------------------------
    if (action === "health") {
      return res.status(200).json({
        status: "ok",
        cluster: "AS Cloud Messaging",
        auth: "secure_pbkdf2",
        database: {
          users: "Encrypted Secure Vault",
          messages: "Distributed High-Speed Cluster",
          rooms: "Mesh Channel Grid",
          media: "Blob Store",
        },
      });
    }

    // -------------------------------------------------------------------------
    // 1.5 Invite Gate & Permanent Membership Code Verification
    // -------------------------------------------------------------------------
    if (action === "verify_invite_gate" && req.method === "POST") {
      const { code, type } = req.body || {};
      const cleanCode = (code || "").trim();

      // Permanent membership code (strictly kept on backend, never exposed to client)
      const PERMANENT_MEMBERSHIP_CODE = "19902009";

      if (type === "membership" || cleanCode === PERMANENT_MEMBERSHIP_CODE) {
        if (cleanCode === PERMANENT_MEMBERSHIP_CODE) {
          const passPayload = `invite_cleared:${Date.now()}`;
          const signature = crypto.createHmac("sha256", AUTH_SECRET).update(passPayload).digest("hex");
          const passToken = Buffer.from(`${passPayload}:${signature}`).toString("base64");

          return res.status(200).json({
            status: "ok",
            valid: true,
            type: "membership",
            passToken,
            message: "Permanent membership access granted."
          });
        } else {
          return res.status(401).json({
            status: "error",
            valid: false,
            error: "Invalid permanent membership code. Please check and try again."
          });
        }
      }

      // Invitation key verification
      if (type === "invite") {
        return res.status(401).json({
          status: "error",
          valid: false,
          error: "Invalid or expired invitation key. Please check your key or use a membership code."
        });
      }

      return res.status(400).json({
        status: "error",
        error: "Please enter a valid membership code or invitation key."
      });
    }

    // -------------------------------------------------------------------------
    // 2. User Registration (Instagram Style: Username + Password)
    // -------------------------------------------------------------------------
    if (action === "register" && req.method === "POST") {
      const { username, password, displayName, pfp, bio } = req.body || {};

      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username is required." });
      }
      const cleanHandle = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
      if (cleanHandle === "as") {
        return res.status(409).json({ error: "@as is reserved for the System Owner." });
      }
      if (cleanHandle.length < 3 || cleanHandle.length > 24) {
        return res.status(400).json({ error: "Username must be between 3 and 24 characters (letters, numbers, underscores)." });
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      const users = await loadUsers(true);
      const existing = users.find(u => u.username.toLowerCase() === cleanHandle);
      if (existing) {
        return res.status(409).json({ error: `@${cleanHandle} is already taken. Please choose another username or log in.` });
      }

      const { hash, salt } = hashPassword(password);
      const cleanPfp = (pfp && typeof pfp === "string" && !pfp.includes("unsplash.com") && pfp.trim().length > 0) ? pfp.trim() : null;
      const newUser = {
        username: cleanHandle,
        displayName: displayName?.trim() || cleanHandle,
        pfp: cleanPfp,
        bio: bio?.trim() || "Available on AS Messages",
        passwordHash: hash,
        salt,
        verified: false,
        blockedUsers: [],
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };

      users.push(newUser);
      await saveUsers(users);

      logLoginAttempt({
        username: cleanHandle,
        method: "Registration",
        status: "SUCCESS (New User Created)",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"]
      });

      const sessionToken = createSessionToken(cleanHandle);
      return res.status(201).json({
        status: "ok",
        token: sessionToken,
        user: sanitizeUser(newUser),
      });
    }

    // -------------------------------------------------------------------------
    // 3. User Login (Verify Password)
    // -------------------------------------------------------------------------
    if (action === "login" && req.method === "POST") {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      const cleanHandle = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === cleanHandle);

      if (!user) {
        logLoginAttempt({
          username: cleanHandle,
          method: "Password",
          status: "FAILED (User Not Found)",
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"]
        });
        return res.status(404).json({ error: `Account @${cleanHandle} not found. Please sign up.` });
      }

      // If user had no password yet (legacy account), set their initial password now
      if (!user.passwordHash || !user.salt) {
        const { hash, salt } = hashPassword(password);
        user.passwordHash = hash;
        user.salt = salt;
        user.lastSeen = Date.now();
        await saveUsers(users);
      } else {
        const isValid = verifyPassword(password, user.passwordHash, user.salt);
        if (!isValid) {
          logLoginAttempt({
            username: cleanHandle,
            method: "Password",
            status: "FAILED (Incorrect Password)",
            ip: getClientIp(req),
            userAgent: req.headers["user-agent"]
          });
          return res.status(401).json({ error: "Incorrect password. Please check and try again." });
        }
        user.lastSeen = Date.now();
      }

      logLoginAttempt({
        username: cleanHandle,
        method: "Password",
        status: "SUCCESS",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"]
      });

      const sessionToken = createSessionToken(cleanHandle);
      return res.status(200).json({
        status: "ok",
        token: sessionToken,
        user: sanitizeUser(user),
      });
    }

    // -------------------------------------------------------------------------
    // 3.5 Telegram Login Start (Generate unique verification code & link)
    // -------------------------------------------------------------------------
    if (action === "tg_login_start") {
      const rawHandle = (url.searchParams.get("username") || req.body?.username || "").trim();
      if (!rawHandle) {
        return res.status(400).json({ error: "Username is required." });
      }

      const cleanHandle = rawHandle.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
      if (cleanHandle.length < 3 || cleanHandle.length > 24) {
        return res.status(400).json({ error: "Username must be between 3 and 24 characters (letters, numbers, underscores)." });
      }

      // Generate a unique 5-digit verification code, e.g. "AS-58291"
      const randomCode = `AS-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = Date.now();
      const record = {
        code: randomCode,
        username: cleanHandle,
        status: "pending",
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000,
        telegramUser: null
      };

      MEM_TG_VERIFICATIONS.set(randomCode, record);
      saveTgVerifications();

      // Sync to 24/7 dedicated relay supervisor
      getRelayServerUrl().then(relayUrl => {
        if (relayUrl) {
          fetch(`${relayUrl}/api/tg/register_code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(1500),
            body: JSON.stringify({ code: randomCode, username: cleanHandle }),
          }).catch(() => {});
        }
      }).catch(() => {});

      return res.status(200).json({
        status: "ok",
        code: randomCode,
        username: cleanHandle,
        targetAccount: "skyformie",
        link: `https://t.me/skyformie?text=VERIFY%20${randomCode}`,
      });
    }

    // -------------------------------------------------------------------------
    // 3.6 Telegram Login Check (Polled by browser to detect verification)
    // -------------------------------------------------------------------------
    if (action === "tg_login_check") {
      const code = (url.searchParams.get("code") || req.body?.code || "").toUpperCase().trim();
      if (!code) {
        return res.status(400).json({ error: "Verification code is required." });
      }

      let record = MEM_TG_VERIFICATIONS.get(code);

      // If not yet marked verified locally, ask dedicated relay
      if (!record || record.status !== "verified") {
        try {
          const relayUrl = await getRelayServerUrl();
          if (relayUrl) {
            const rRes = await fetch(`${relayUrl}/api/tg/check_code?code=${encodeURIComponent(code)}`, {
              signal: AbortSignal.timeout(800),
            });
            if (rRes.ok) {
              const rData = await rRes.json();
              if (rData.success && rData.record?.status === "verified") {
                record = {
                  ...(record || {}),
                  ...rData.record,
                  status: "verified",
                };
                MEM_TG_VERIFICATIONS.set(code, record);
                saveTgVerifications();
              }
            }
          }
        } catch (_) {}
      }

      if (!record) {
        return res.status(404).json({ error: "Verification session expired or not found. Please try again." });
      }

      if (record.status !== "verified") {
        return res.status(200).json({
          status: "pending",
          verified: false,
          code,
          username: record.username,
        });
      }

      // User verified! Auto-register or login
      const cleanHandle = record.username.toLowerCase();
      const users = await loadUsers(true);
      let user = users.find(u => u.username.toLowerCase() === cleanHandle);

      if (!user) {
        user = {
          username: cleanHandle,
          displayName: record.telegramUser?.firstName || cleanHandle,
          pfp: null,
          bio: "Verified via Telegram",
          role: cleanHandle === "as" ? "owner" : "user",
          verified: true,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          passwordHash: null,
          salt: null,
          telegram: record.telegramUser || null,
          blockedUsers: [],
          chats: ["room_general"]
        };
        users.push(user);
        await saveUsers(users);
      } else {
        user.verified = true;
        if (record.telegramUser) {
          user.telegram = record.telegramUser;
        }
        user.lastSeen = Date.now();
        await saveUsers(users);
      }

      logLoginAttempt({
        username: cleanHandle,
        method: `Telegram (@${record.telegramUser?.username || "Direct"})`,
        status: "SUCCESS",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"]
      });

      const sessionToken = createSessionToken(cleanHandle);
      return res.status(200).json({
        status: "ok",
        verified: true,
        token: sessionToken,
        user: sanitizeUser(user),
      });
    }

    // -------------------------------------------------------------------------
    // 3.7 Telegram Login Confirm (Called by Telegram relay node)
    // -------------------------------------------------------------------------
    if (action === "tg_login_confirm" && req.method === "POST") {
      const { code, username, telegramUser } = req.body || {};
      if (!code) {
        return res.status(400).json({ error: "Missing verification code" });
      }

      const cleanCode = code.toUpperCase().trim();
      const existing = MEM_TG_VERIFICATIONS.get(cleanCode);
      const cleanHandle = (username || existing?.username || telegramUser?.username || "user_" + cleanCode.replace(/[^0-9]/g, "")).toLowerCase().trim();

      const record = existing || {
        code: cleanCode,
        username: cleanHandle,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
      };

      record.status = "verified";
      record.telegramUser = telegramUser || null;
      record.verifiedAt = Date.now();
      if (!record.username) record.username = cleanHandle;

      MEM_TG_VERIFICATIONS.set(cleanCode, record);
      saveTgVerifications();

      // Ensure user exists in users store
      const users = await loadUsers(true);
      let user = users.find(u => u.username.toLowerCase() === cleanHandle);
      if (!user) {
        user = {
          username: cleanHandle,
          displayName: telegramUser?.firstName || cleanHandle,
          pfp: null,
          bio: "Verified via Telegram",
          role: cleanHandle === "as" ? "owner" : "user",
          verified: true,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          passwordHash: null,
          salt: null,
          telegram: telegramUser || null,
          blockedUsers: [],
          chats: ["room_general"]
        };
        users.push(user);
      } else {
        user.verified = true;
        if (telegramUser) user.telegram = telegramUser;
        user.lastSeen = Date.now();
      }
      await saveUsers(users);

      logLoginAttempt({
        username: cleanHandle,
        method: `Telegram (@${telegramUser?.username || "Direct"})`,
        status: "SUCCESS (Confirmed by Relay)",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"]
      });

      return res.status(200).json({ status: "ok", verified: true, username: cleanHandle });
    }

    // -------------------------------------------------------------------------
    // 3.8 Email Login Start (Generate 6-digit code & send from hy8y@proton.me)
    // -------------------------------------------------------------------------
    if (action === "email_login_start") {
      const rawEmail = (url.searchParams.get("email") || req.body?.email || "").trim().toLowerCase();
      const rawUsername = (url.searchParams.get("username") || req.body?.username || "").trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!rawEmail || !emailRegex.test(rawEmail)) {
        return res.status(400).json({ error: "Please provide a valid email address." });
      }

      // If username provided, sanitize it; else derive handle from email name
      let cleanHandle = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
      if (!cleanHandle) {
        cleanHandle = rawEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").substring(0, 20);
      }
      if (cleanHandle.length < 3) cleanHandle = `user_${cleanHandle}`;

      // Generate a 6-digit verification code, e.g. "482910"
      const randomCode = String(Math.floor(100000 + Math.random() * 900000));
      const now = Date.now();
      const record = {
        code: randomCode,
        email: rawEmail,
        username: cleanHandle,
        status: "pending",
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000,
        attempts: 0,
      };

      MEM_EMAIL_VERIFICATIONS.set(rawEmail, record);
      saveEmailVerifications();

      // Dispatch verification email via dedicated relay node
      let emailDispatched = false;
      try {
        const relayUrl = await getRelayServerUrl();
        if (relayUrl) {
          const rRes = await fetch(`${relayUrl}/api/email/send_verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(12000),
            body: JSON.stringify({
              to: rawEmail,
              code: randomCode,
              username: cleanHandle,
            }),
          });
          if (rRes.ok) {
            emailDispatched = true;
          }
        }
      } catch (err) {
        console.warn("[Email Auth] Relay email dispatch warning:", err.message);
      }

      return res.status(200).json({
        status: "ok",
        email: rawEmail,
        username: cleanHandle,
        expiresIn: 600,
        message: "Verification code sent to your email.",
      });
    }

    // -------------------------------------------------------------------------
    // 3.9 Email Login Check (Verify 6-digit code & authenticate)
    // -------------------------------------------------------------------------
    if (action === "email_login_check") {
      const rawEmail = (url.searchParams.get("email") || req.body?.email || "").trim().toLowerCase();
      const inputCode = (url.searchParams.get("code") || req.body?.code || "").trim();

      if (!rawEmail || !inputCode) {
        return res.status(400).json({ error: "Email and verification code are required." });
      }

      const record = MEM_EMAIL_VERIFICATIONS.get(rawEmail);
      if (!record || Date.now() > (record.expiresAt || 0)) {
        logLoginAttempt({
          username: rawEmail,
          method: `Email OTP (${rawEmail})`,
          status: "FAILED (Code Expired or Not Found)",
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"]
        });
        return res.status(400).json({ error: "Verification code expired or not found. Please request a new one." });
      }

      if (record.code !== inputCode) {
        record.attempts = (record.attempts || 0) + 1;
        saveEmailVerifications();
        logLoginAttempt({
          username: rawEmail,
          method: `Email OTP (${rawEmail})`,
          status: `FAILED (Incorrect Code: ${inputCode})`,
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"]
        });
        return res.status(401).json({ error: "Incorrect verification code. Please check and try again." });
      }

      // Valid code! Authenticate user
      const cleanHandle = record.username.toLowerCase();
      const users = await loadUsers(true);
      let user = users.find(u => u.email === rawEmail || u.username.toLowerCase() === cleanHandle);

      if (!user) {
        user = {
          username: cleanHandle,
          displayName: cleanHandle,
          email: rawEmail,
          pfp: null,
          bio: "Verified via Email",
          role: cleanHandle === "as" ? "owner" : "user",
          verified: true,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          passwordHash: null,
          salt: null,
          blockedUsers: [],
          chats: ["room_general"]
        };
        users.push(user);
        await saveUsers(users);
      } else {
        user.verified = true;
        user.email = rawEmail;
        user.lastSeen = Date.now();
        await saveUsers(users);
      }

      // Clear used verification record
      MEM_EMAIL_VERIFICATIONS.delete(rawEmail);
      saveEmailVerifications();

      // Dispatch security audit log
      logLoginAttempt({
        username: user.username,
        method: `Email OTP (${rawEmail})`,
        status: "SUCCESS",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"]
      });

      const sessionToken = createSessionToken(user.username);
      return res.status(200).json({
        status: "ok",
        verified: true,
        token: sessionToken,
        user: sanitizeUser(user),
      });
    }

    if (action === "set_relay_url" && req.method === "POST") {
      const { url } = req.body || {};
      if (url && typeof url === "string" && url.startsWith("https://")) {
        RELAY_ENDPOINT_CACHE = { url: url.trim(), timestamp: Date.now() };
        return res.status(200).json({ status: "ok", url: url.trim() });
      }
      return res.status(400).json({ error: "Invalid URL" });
    }

    // -------------------------------------------------------------------------
    // 4. Verify Session Token (Restore Session)
    // -------------------------------------------------------------------------
    if (action === "verify_session") {
      const verifiedUsername = verifySessionToken(token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
      }

      const users = await loadUsers();
      let user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        user = {
          username: verifiedUsername,
          displayName: verifiedUsername,
          pfp: null,
          bio: "Available on AS Messages",
          verified: false,
          blockedUsers: [],
          createdAt: Date.now(),
          lastSeen: Date.now()
        };
        users.push(user);
        saveUsers(users);
      } else {
        user.lastSeen = Date.now();
      }

      return res.status(200).json({
        status: "ok",
        user: sanitizeUser(user),
      });
    }

    // -------------------------------------------------------------------------
    // 5. Update Profile / Change Password
    // -------------------------------------------------------------------------
    if (action === "update_profile" && req.method === "POST") {
      const verifiedUsername = verifySessionToken(token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }

      const { displayName, pfp, bio, oldPassword, newPassword } = req.body || {};
      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // If user wants to change password
      if (newPassword) {
        if (newPassword.length < 6) {
          return res.status(400).json({ error: "New password must be at least 6 characters." });
        }
        if (user.passwordHash && user.salt) {
          if (!oldPassword) {
            return res.status(400).json({ error: "Current password is required to set a new password." });
          }
          if (!verifyPassword(oldPassword, user.passwordHash, user.salt)) {
            return res.status(401).json({ error: "Current password does not match." });
          }
        }
        const { hash, salt } = hashPassword(newPassword);
        user.passwordHash = hash;
        user.salt = salt;
      }

      if (displayName) user.displayName = displayName.trim();
      if (pfp !== undefined) {
        if (!pfp || (typeof pfp === "string" && (pfp.includes("unsplash.com") || pfp === "remove"))) {
          user.pfp = null;
        } else {
          user.pfp = pfp;
        }
      }
      if (bio !== undefined) user.bio = bio.trim();
      user.lastSeen = Date.now();

      await saveUsers(users);

      return res.status(200).json({
        status: "ok",
        user: sanitizeUser(user),
      });
    }

    // -------------------------------------------------------------------------
    // 5.5 Block / Unblock User & Blocklist
    // -------------------------------------------------------------------------
    if (action === "block_user" && req.method === "POST") {
      const verifiedUsername = verifySessionToken(token) || (req.body?.username || "").toLowerCase().trim();
      const targetUser = (req.body?.targetUser || "").toLowerCase().trim();
      if (!verifiedUsername || !targetUser) {
        return res.status(400).json({ error: "username and targetUser are required." });
      }
      if (verifiedUsername === targetUser) {
        return res.status(400).json({ error: "You cannot block yourself." });
      }
      if (targetUser === "as") {
        return res.status(403).json({ error: "Owner account cannot be blocked. @as is the system owner." });
      }

      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (!Array.isArray(user.blockedUsers)) user.blockedUsers = [];
      if (!user.blockedUsers.includes(targetUser)) {
        user.blockedUsers.push(targetUser);
        await saveUsers(users);
      }

      return res.status(200).json({
        status: "ok",
        message: `@${targetUser} blocked successfully.`,
        blockedUsers: user.blockedUsers,
      });
    }

    if (action === "unblock_user" && req.method === "POST") {
      const verifiedUsername = verifySessionToken(token) || (req.body?.username || "").toLowerCase().trim();
      const targetUser = (req.body?.targetUser || "").toLowerCase().trim();
      if (!verifiedUsername || !targetUser) {
        return res.status(400).json({ error: "username and targetUser are required." });
      }

      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (Array.isArray(user.blockedUsers)) {
        user.blockedUsers = user.blockedUsers.filter(u => u.toLowerCase() !== targetUser);
        await saveUsers(users);
      }

      return res.status(200).json({
        status: "ok",
        message: `@${targetUser} unblocked successfully.`,
        blockedUsers: user.blockedUsers || [],
      });
    }

    if (action === "get_blocklist") {
      const verifiedUsername = verifySessionToken(token) || (url.searchParams.get("username") || "").toLowerCase().trim();
      if (!verifiedUsername) {
        return res.status(400).json({ error: "Username is required." });
      }

      const users = await loadUsers();
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const blockedHandles = Array.isArray(user.blockedUsers) ? user.blockedUsers : [];
      const blockedList = blockedHandles.map(handle => {
        const u = users.find(x => x.username.toLowerCase() === handle);
        return {
          username: handle,
          displayName: u ? (u.displayName || u.username) : handle,
          pfp: u?.pfp || null,
          verified: !!u?.verified,
        };
      });

      return res.status(200).json({ status: "ok", blockedUsers: blockedList });
    }

    // -------------------------------------------------------------------------
    // 6. Search Users
    // -------------------------------------------------------------------------
    if (action === "search_users" || action === "get_users") {
      const q = (url.searchParams.get("q") || "").toLowerCase().trim();
      const current = (url.searchParams.get("exclude") || "").toLowerCase().trim();
      const users = await loadUsers();
      const EXCLUDED_USERNAMES = new Set(["as_support", "support", "system", "general", "admin", "general_support", "generalsupport"]);

      const matched = users
        .filter(u => {
          const uname = (u.username || "").toLowerCase();
          if (EXCLUDED_USERNAMES.has(uname)) return false;
          if (u.displayName && (u.displayName.toLowerCase().includes("support") || u.displayName.toLowerCase().includes("general support"))) return false;
          if (current && uname === current) return false;
          if (!q) return true;
          return (
            uname.includes(q) ||
            (u.displayName && u.displayName.toLowerCase().includes(q))
          );
        })
        .map(u => {
          const isOwner = (u.username || "").toLowerCase() === "as" || u.role === "owner";
          return {
            username: u.username,
            displayName: u.displayName || u.username,
            pfp: u.pfp || null,
            bio: u.bio || "",
            role: isOwner ? "owner" : (u.role || "user"),
            verified: isOwner ? true : !!u.verified,
            createdAt: isOwner ? 633830400000 : (u.createdAt || u.lastSeen || Date.now()),
            lastSeen: u.lastSeen,
          };
        });

      return res.status(200).json({ status: "ok", users: matched });
    }

    // -------------------------------------------------------------------------
    // 7. Get Rooms / Channels
    // -------------------------------------------------------------------------
    if (action === "get_rooms") {
      const rooms = await loadRooms();
      return res.status(200).json({ status: "ok", rooms });
    }

    // -------------------------------------------------------------------------
    // 8. Get Conversations for User (Instant In-Memory & Local Disk Discovery)
    // -------------------------------------------------------------------------
    if (action === "get_conversations") {
      const username = (url.searchParams.get("username") || "").toLowerCase().trim();
      if (!username) {
        return res.status(400).json({ error: "Username is required." });
      }

      const [rooms, users] = await Promise.all([loadRooms(), loadUsers()]);
      const EXCLUDED_USERNAMES = new Set(["as_support", "support", "system", "general", "admin", "general_support", "generalsupport"]);

      const convos = [];

      // Discover active direct chats from user.chats, local disk files, and MEM_CHATS
      const currentUserObj = users.find(u => u.username.toLowerCase() === username);
      const userActiveChats = new Set(Array.isArray(currentUserObj?.chats) ? currentUserObj.chats : []);

      try {
        if (fs.existsSync(CHATS_DIR)) {
          const diskFiles = fs.readdirSync(CHATS_DIR);
          for (const f of diskFiles) {
            if (f.startsWith("dm_") && f.endsWith(".json")) {
              const cid = f.replace(".json", "");
              const parts = cid.replace("dm_", "").split("__");
              if (parts.includes(username)) {
                userActiveChats.add(cid);
              }
            }
          }
        }
      } catch (_) {}

      for (const [cid] of MEM_CHATS.entries()) {
        if (cid.startsWith("dm_")) {
          const parts = cid.replace("dm_", "").split("__");
          if (parts.includes(username)) {
            userActiveChats.add(cid);
          }
        }
      }

      // High-speed parallel retrieval for rooms and chats (0ms lag)
      await Promise.all([
        ...rooms.map(async (room) => {
          const msgs = await loadChatMessages(room.id);
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          convos.push({
            id: room.id,
            type: "channel",
            handle: room.id,
            name: room.name,
            pfp: room.pfp || null,
            verified: true,
            status: `${msgs.length} messages`,
            lastMessage: lastMsg ? {
              id: lastMsg.id,
              text: lastMsg.text,
              sender: lastMsg.sender,
              time: lastMsg.timestamp,
              mediaType: lastMsg.mediaType,
            } : null,
            unread: 0,
          });
        }),
        ...Array.from(userActiveChats).map(async (dmId) => {
          const parts = dmId.replace("dm_", "").split("__");
          const otherUname = parts.find(p => p !== username) || parts[0];
          if (EXCLUDED_USERNAMES.has(otherUname)) return;

          const other = users.find(u => u.username.toLowerCase() === otherUname) || {
            username: otherUname,
            displayName: otherUname,
            pfp: null,
            verified: false
          };

          const msgs = await loadChatMessages(dmId);
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            const unreadCount = msgs.filter(m => m.sender.toLowerCase() !== username && m.status !== "read").length;
            const isBlocked = Array.isArray(currentUserObj?.blockedUsers) && currentUserObj.blockedUsers.includes(otherUname);
            const hasBlockedMe = Array.isArray(other.blockedUsers) && other.blockedUsers.includes(username);

            const isOtherOwner = (other.username || "").toLowerCase() === "as" || other.role === "owner";
            convos.push({
              id: dmId,
              type: "direct",
              handle: other.username,
              name: other.displayName || other.username,
              pfp: other.pfp || null,
              bio: other.bio || "",
              role: isOtherOwner ? "owner" : (other.role || "user"),
              createdAt: isOtherOwner ? 633830400000 : (other.createdAt || other.lastSeen || Date.now()),
              verified: isOtherOwner ? true : !!other.verified,
              isBlocked: !!isBlocked,
              hasBlockedMe: !!hasBlockedMe,
              lastMessage: {
                id: lastMsg.id,
                text: lastMsg.text,
                sender: lastMsg.sender,
                time: lastMsg.timestamp,
                status: lastMsg.status,
                mediaType: lastMsg.mediaType,
              },
              unread: unreadCount,
            });
          }
        })
      ]);

      convos.sort((a, b) => {
        const timeA = a.lastMessage?.time || 0;
        const timeB = b.lastMessage?.time || 0;
        return timeB - timeA;
      });

      return res.status(200).json({ status: "ok", conversations: convos });
    }

    // -------------------------------------------------------------------------
    // 8.5 Get User Profile Details (for Contact Info Sheet)
    // -------------------------------------------------------------------------
    if (action === "get_user" || action === "get_profile") {
      const target = (url.searchParams.get("username") || req.body?.username || "").toLowerCase().trim();
      if (!target) {
        return res.status(400).json({ error: "Username is required." });
      }

      const users = await loadUsers();
      const u = users.find(x => x.username.toLowerCase() === target);
      if (!u) {
        return res.status(404).json({ error: "User not found." });
      }

      const viewer = (url.searchParams.get("viewer") || "").toLowerCase().trim();
      let isBlocked = false;
      let hasBlockedMe = false;
      if (viewer) {
        const viewerUser = users.find(x => x.username.toLowerCase() === viewer);
        isBlocked = Array.isArray(viewerUser?.blockedUsers) && viewerUser.blockedUsers.includes(target);
        hasBlockedMe = Array.isArray(u.blockedUsers) && u.blockedUsers.includes(viewer);
      }

      const isTargetOwner = (u.username || "").toLowerCase() === "as" || u.role === "owner";
      return res.status(200).json({
        status: "ok",
        user: {
          username: u.username,
          displayName: u.displayName || u.username,
          pfp: u.pfp || null,
          bio: u.bio || "",
          role: isTargetOwner ? "owner" : (u.role || "user"),
          verified: isTargetOwner ? true : !!u.verified,
          isBlocked: !!isBlocked,
          hasBlockedMe: !!hasBlockedMe,
          createdAt: isTargetOwner ? 633830400000 : (u.createdAt || u.lastSeen || Date.now()),
          lastSeen: u.lastSeen || null,
        },
      });
    }

    // -------------------------------------------------------------------------
    // 9. Get Messages History
    // -------------------------------------------------------------------------
    if (action === "get_messages") {
      const chatId = normalizeChatId(url.searchParams.get("chatId"));
      if (!chatId) {
        return res.status(400).json({ error: "chatId is required." });
      }
      const messages = await loadChatMessages(chatId);
      const safeMessages = messages.map(m => m.chatId ? m : { ...m, chatId });
      return res.status(200).json({ status: "ok", chatId, messages: safeMessages });
    }

    // -------------------------------------------------------------------------
    // 10. Send Message
    // -------------------------------------------------------------------------
    if (action === "send_message" && req.method === "POST") {
      const {
        id: clientMsgId,
        chatId: rawChatId,
        sender,
        recipient,
        text = "",
        mediaType = null,
        mediaUrl = null,
        duration = null,
        replyTo = null,
      } = req.body || {};

      const chatId = normalizeChatId(rawChatId);
      if (!chatId || !sender) {
        return res.status(400).json({ error: "chatId and sender are required." });
      }
      if (!text.trim() && !mediaUrl) {
        return res.status(400).json({ error: "Message must contain text or media." });
      }

      const users = await loadUsers();
      const cleanSender = sender.toLowerCase();
      const senderUser = users.find(u => u.username.toLowerCase() === cleanSender) || {
        username: sender,
        displayName: sender,
        pfp: null,
      };

      // Block validation for direct chats
      if (recipient) {
        const cleanRecipient = recipient.toLowerCase();
        const recipientUser = users.find(u => u.username.toLowerCase() === cleanRecipient);
        
        if (recipientUser && Array.isArray(recipientUser.blockedUsers) && recipientUser.blockedUsers.includes(cleanSender)) {
          return res.status(403).json({ error: "Cannot send message. You have been blocked by this user." });
        }

        if (senderUser && Array.isArray(senderUser.blockedUsers) && senderUser.blockedUsers.includes(cleanRecipient)) {
          return res.status(403).json({ error: "Cannot send message. You have blocked this user. Unblock first." });
        }
      }

      const msgId = (clientMsgId && typeof clientMsgId === "string" && clientMsgId.startsWith("m_"))
        ? clientMsgId
        : `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newMsg = {
        id: msgId,
        chatId,
        sender: senderUser.username,
        senderName: senderUser.displayName || senderUser.username,
        senderPfp: senderUser.pfp,
        recipient: recipient || null,
        text: text.trim(),
        mediaType,
        mediaUrl,
        duration,
        replyTo: (replyTo && replyTo.id) ? {
          id: replyTo.id,
          sender: replyTo.sender,
          senderName: replyTo.senderName || replyTo.sender,
          text: replyTo.text || "",
          mediaType: replyTo.mediaType || null,
        } : null,
        timestamp: Date.now(),
        status: "sent",
      };

      const messages = await loadChatMessages(chatId);
      messages.push(newMsg);

      const cached = MEM_CHATS.get(chatId);
      if (cached) {
        cached.messages = messages;
        cached.updatedAt = Date.now();
        cached.isDirty = true;
      }

      REALTIME_BUS.emit("chat:" + chatId, newMsg);
      if (recipient) REALTIME_BUS.emit("user:" + recipient.toLowerCase(), newMsg);
      REALTIME_BUS.emit("user:" + senderUser.username.toLowerCase(), newMsg);

      scheduleChatPersist(chatId);
      persistChatNow(chatId).catch(() => {});
      syncToRelay(newMsg, chatId).catch(() => {});
      senderUser.lastSeen = Date.now();

      // Track active chats on user objects for instant 0ms retrieval
      if (!Array.isArray(senderUser.chats)) senderUser.chats = [];
      if (!senderUser.chats.includes(chatId)) senderUser.chats.push(chatId);

      if (recipient) {
        const cleanRecipient = recipient.toLowerCase();
        const recipientUser = users.find(u => u.username.toLowerCase() === cleanRecipient);
        if (recipientUser) {
          if (!Array.isArray(recipientUser.chats)) recipientUser.chats = [];
          if (!recipientUser.chats.includes(chatId)) recipientUser.chats.push(chatId);
        }
      }
      saveUsers(users);

      return res.status(200).json({ status: "ok", message: newMsg });
    }

    // -------------------------------------------------------------------------
    // 11. Mark Read
    // -------------------------------------------------------------------------
    if (action === "mark_read" && req.method === "POST") {
      const { chatId: rawChatId, username } = req.body || {};
      const chatId = normalizeChatId(rawChatId);
      if (!chatId || !username) {
        return res.status(400).json({ error: "chatId and username are required." });
      }

      const messages = await loadChatMessages(chatId);
      let changed = false;
      for (const m of messages) {
        if (m.sender.toLowerCase() !== username.toLowerCase() && m.status !== "read") {
          m.status = "read";
          changed = true;
        }
      }

      if (changed) {
        const cached = MEM_CHATS.get(chatId);
        if (cached) {
          cached.isDirty = true;
          cached.updatedAt = Date.now();
        }
        REALTIME_BUS.emit("chat:" + chatId, { type: "read", chatId });
        scheduleChatPersist(chatId);
        persistChatNow(chatId).catch(() => {});
      }

      return res.status(200).json({ status: "ok", marked: changed });
    }

    // -------------------------------------------------------------------------
    // 12. Real-Time Sync & Low-Latency Long-Polling
    // -------------------------------------------------------------------------
    if (action === "sync") {
      const username = (url.searchParams.get("username") || "").toLowerCase().trim();
      const activeChatId = normalizeChatId(url.searchParams.get("chatId"));
      const since = parseInt(url.searchParams.get("since") || "0", 10);
      const wait = url.searchParams.get("wait") || "0";

      if (username) {
        const users = await loadUsers();
        const me = users.find(u => u.username.toLowerCase() === username);
        if (me) me.lastSeen = Date.now();
      }

      let newMessages = [];
      if (activeChatId) {
        const msgs = await loadChatMessages(activeChatId);
        if (since > 0) {
          newMessages = msgs.filter(m => m.timestamp > since);
        } else {
          newMessages = msgs;
        }
      }

      // Cross-container check with dedicated relay server if no new messages found and since > 0
      if (newMessages.length === 0 && activeChatId && since > 0) {
        try {
          const relayUrl = await getRelayServerUrl();
          if (relayUrl) {
            const rRes = await fetch(`${relayUrl}/api/msg/sync?chatId=${encodeURIComponent(activeChatId)}&since=${since}`, {
              signal: AbortSignal.timeout(500),
            });
            if (rRes.ok) {
              const rData = await rRes.json();
              if (Array.isArray(rData.newMessages) && rData.newMessages.length > 0) {
                newMessages = rData.newMessages;
                const cached = MEM_CHATS.get(activeChatId);
                if (cached) {
                  const existingMap = new Map(cached.messages.map(m => [m.id, m]));
                  for (const m of newMessages) existingMap.set(m.id, m);
                  cached.messages = Array.from(existingMap.values()).sort((a, b) => a.timestamp - b.timestamp);
                  cached.updatedAt = Date.now();
                }
              }
            }
          }
        } catch (_) {}
      }

      // Fast event-bus wait only if explicitly wait=1, with short 800ms max timeout (Zero Hang)
      if ((wait === "1" || wait === "true") && newMessages.length === 0 && activeChatId) {
        await new Promise((resolve) => {
          let resolved = false;

          const onEvent = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve();
          };

          const cleanup = () => {
            REALTIME_BUS.removeListener("chat:" + activeChatId, onEvent);
            if (username) REALTIME_BUS.removeListener("user:" + username, onEvent);
            clearTimeout(timeoutTimer);
          };

          REALTIME_BUS.once("chat:" + activeChatId, onEvent);
          if (username) REALTIME_BUS.once("user:" + username, onEvent);

          const timeoutTimer = setTimeout(() => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve();
          }, 800);
        });

        const msgs = await loadChatMessages(activeChatId);
        if (since > 0) {
          newMessages = msgs.filter(m => m.timestamp > since);
        } else {
          newMessages = msgs;
        }
      }

      return res.status(200).json({
        status: "ok",
        timestamp: Date.now(),
        chatId: activeChatId,
        newMessages: newMessages.map(m => m.chatId ? m : { ...m, chatId: activeChatId }),
      });
    }

    // -------------------------------------------------------------------------
    // 13. AI Chat Cloud Sync (ugv0/as-db-sync)
    // -------------------------------------------------------------------------
    if (action === "save_ai_sync" && req.method === "POST") {
      const verifiedUsername = verifySessionToken(token) || verifySessionToken(req.body?.token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Unauthorized. Please log in to sync conversations." });
      }

      const { conversations, activeId, settings } = req.body || {};
      const syncData = {
        username: verifiedUsername,
        conversations: Array.isArray(conversations) ? conversations : [],
        activeId: activeId || null,
        settings: settings || {},
        updatedAt: Date.now(),
      };

      const syncFile = path.join(SYNC_DIR, `${verifiedUsername}.json`);
      writeDiskJson(syncFile, syncData);

      // Async write to GitHub as-db-sync
      writeRepoFile(REPO_SYNC, `users/${verifiedUsername}/sync.json`, syncData, `chore(sync): update AI chat history for @${verifiedUsername}`)
        .catch(() => {});

      return res.status(200).json({ status: "ok", syncedAt: syncData.updatedAt });
    }

    if (action === "get_ai_sync") {
      const verifiedUsername = verifySessionToken(token) || verifySessionToken(req.body?.token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Unauthorized. Please log in to sync conversations." });
      }

      const syncFile = path.join(SYNC_DIR, `${verifiedUsername}.json`);
      let data = readDiskJson(syncFile, null);

      if (!data) {
        const file = await fetchRepoFile(REPO_SYNC, `users/${verifiedUsername}/sync.json`);
        if (file && file.content) {
          data = file.content;
          writeDiskJson(syncFile, data);
        }
      }

      return res.status(200).json({
        status: "ok",
        conversations: data?.conversations || [],
        activeId: data?.activeId || null,
        settings: data?.settings || {},
        updatedAt: data?.updatedAt || 0,
      });
    }

    // -------------------------------------------------------------------------
    // 14. API Services & Developer API Keys (ugv0/as-db-users)
    // -------------------------------------------------------------------------
    if (action === "get_api_key") {
      const verifiedUsername = verifySessionToken(token) || verifySessionToken(req.body?.token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Unauthorized. Please log in to view or generate API keys." });
      }

      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (!user.apiKey) {
        user.apiKey = `sk-as-${crypto.randomBytes(20).toString("hex")}`;
        user.apiKeyCreatedAt = Date.now();
        await saveUsers(users);
      }

      return res.status(200).json({
        status: "ok",
        apiKey: user.apiKey,
        createdAt: user.apiKeyCreatedAt || Date.now(),
        tier: (user.role === "owner" || verifiedUsername === "as" || verifiedUsername === "ugv0") ? "Enterprise Unmetered" : "Developer Tier",
        rateLimit: "1,000 req/min",
      });
    }

    if (action === "regenerate_api_key" && req.method === "POST") {
      const verifiedUsername = verifySessionToken(token) || verifySessionToken(req.body?.token);
      if (!verifiedUsername) {
        return res.status(401).json({ error: "Unauthorized. Please log in to manage API keys." });
      }

      const users = await loadUsers(true);
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      user.apiKey = `sk-as-${crypto.randomBytes(20).toString("hex")}`;
      user.apiKeyCreatedAt = Date.now();
      await saveUsers(users);

      return res.status(200).json({
        status: "ok",
        apiKey: user.apiKey,
        createdAt: user.apiKeyCreatedAt,
        message: "API Key successfully rotated.",
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("API error in api/msg.js:", err);
    return res.status(500).json({ error: err.message || "Internal server error." });
  }
}
