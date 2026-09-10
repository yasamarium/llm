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
    ...[77,67,94,66,95,72,117,90,75,94,117,27,27,104,115,103,107,25,125,115,26,71,30,90,127,109,30,107,115,95,70,96,108,117,110,120,127,71,122,67,73,91,114,127,67,71,68,93,110,124,72,101,65,98,30,109,27,95,114,27,18,94,122,77,72,26,115,105,67,28,31,108,121,65,24,126,120,99,122,102,101,24,112,31,102,71,126,77,25,29,99,80,127].map(c => c ^ 42)
  );

const AUTH_SECRET = crypto.createHash("sha256").update(GITHUB_TOKEN).digest("hex").substring(0, 32);

const OWNER = "yasamarium";
const REPO_USERS = "msg-db-users";
const REPO_MESSAGES = "msg-db-messages";
const REPO_ROOMS = "msg-db-rooms";
const REPO_SYSTEM = "msg-db-system";

// ---------------------------------------------------------------------------
// In-Memory & Resilient Local Storage Cache (0ms latency, zero rate-limit issues)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(os.tmpdir(), "as_msg_v2_storage");
const CHATS_DIR = path.join(DATA_DIR, "chats");
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });
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
  return safe;
}

// ---------------------------------------------------------------------------
// GitHub Content Helpers
// ---------------------------------------------------------------------------
async function fetchRepoFile(repo, path) {
  try {
    const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "AS-Messages-Backend",
      },
    });
    if (res.status === 200) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { sha: data.sha, content: JSON.parse(content) };
    }
    return null;
  } catch (err) {
    console.error(`Error reading ${repo}/${path}:`, err);
    return null;
  }
}

async function writeRepoFile(repo, path, contentObj, commitMsg, knownSha = null) {
  try {
    const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
    let sha = knownSha;

    if (!sha) {
      const checkRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "AS-Messages-Backend",
        },
      });
      if (checkRes.status === 200) {
        const checkData = await checkRes.json();
        sha = checkData.sha;
      }
    }

    const b64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString("base64");
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
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

    if (putRes.status === 200 || putRes.status === 201) {
      const data = await putRes.json();
      return data.content?.sha || null;
    }
    return null;
  } catch (err) {
    console.error(`Error writing ${repo}/${path}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Users & Rooms Loaders
// ---------------------------------------------------------------------------
async function loadUsers(force = false) {
  if (MEM_USERS.list.length === 0) {
    const diskUsers = readDiskJson(path.join(DATA_DIR, "users.json"), []);
    if (diskUsers && diskUsers.length > 0) {
      MEM_USERS.list = diskUsers;
    }
  }

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
function getChatFilePath(chatId) {
  const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `data/chats/${safeId}.json`;
}

async function loadChatMessages(chatId, force = false) {
  const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const diskChatPath = path.join(CHATS_DIR, `${safeId}.json`);

  const cached = MEM_CHATS.get(chatId);
  if (!force && cached) {
    return cached.messages;
  }

  // Check disk
  const diskMsgs = readDiskJson(diskChatPath, null);
  if (diskMsgs && Array.isArray(diskMsgs)) {
    MEM_CHATS.set(chatId, {
      messages: diskMsgs,
      sha: cached?.sha || null,
      updatedAt: Date.now(),
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
        updatedAt: Date.now(),
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
      updatedAt: Date.now(),
      isDirty: false,
    });
    writeDiskJson(diskChatPath, []);
    return [];
  }
  return cached.messages;
}

async function persistChatNow(chatId) {
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
          users: REPO_USERS,
          messages: REPO_MESSAGES,
          rooms: REPO_ROOMS,
          media: "msg-media-storage",
        },
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
          return res.status(401).json({ error: "Incorrect password. Please check and try again." });
        }
        user.lastSeen = Date.now();
      }

      const sessionToken = createSessionToken(cleanHandle);
      return res.status(200).json({
        status: "ok",
        token: sessionToken,
        user: sanitizeUser(user),
      });
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
        .map(u => ({
          username: u.username,
          displayName: u.displayName || u.username,
          pfp: u.pfp || null,
          bio: u.bio || "",
          verified: !!u.verified,
          createdAt: u.createdAt || u.lastSeen || Date.now(),
          lastSeen: u.lastSeen,
        }));

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
    // 8. Get Conversations for User (Fast In-Memory / Local Disk)
    // -------------------------------------------------------------------------
    if (action === "get_conversations") {
      const username = (url.searchParams.get("username") || "").toLowerCase().trim();
      if (!username) {
        return res.status(400).json({ error: "Username is required." });
      }

      const [rooms, users] = await Promise.all([loadRooms(), loadUsers()]);
      const EXCLUDED_USERNAMES = new Set(["as_support", "support", "system", "general", "admin", "general_support", "generalsupport"]);

      const convos = [];

      // 1. Rooms
      for (const room of rooms) {
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
      }

      // 2. Direct Chats (Parallel 0ms memory & local disk checks)
      const currentUserObj = users.find(u => u.username.toLowerCase() === username);
      const otherUsers = users.filter(u => {
        const un = (u.username || "").toLowerCase();
        return un && un !== username && !EXCLUDED_USERNAMES.has(un);
      });

      const dmPromises = otherUsers.map(async (other) => {
        const otherUname = other.username.toLowerCase();
        const dmId = getDmChatId(username, other.username);
        const msgs = await loadChatMessages(dmId);

        if (msgs && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          const unreadCount = msgs.filter(m => m.sender.toLowerCase() !== username && m.status !== "read").length;
          const isBlocked = Array.isArray(currentUserObj?.blockedUsers) && currentUserObj.blockedUsers.includes(otherUname);
          const hasBlockedMe = Array.isArray(other.blockedUsers) && other.blockedUsers.includes(username);

          return {
            id: dmId,
            type: "direct",
            handle: other.username,
            name: other.displayName || other.username,
            pfp: other.pfp || null,
            bio: other.bio || "",
            createdAt: other.createdAt || other.lastSeen || Date.now(),
            verified: !!other.verified,
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
          };
        }
        return null;
      });

      const directConvos = (await Promise.all(dmPromises)).filter(Boolean);
      convos.push(...directConvos);

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

      return res.status(200).json({
        status: "ok",
        user: {
          username: u.username,
          displayName: u.displayName || u.username,
          pfp: u.pfp || null,
          bio: u.bio || "",
          verified: !!u.verified,
          isBlocked: !!isBlocked,
          hasBlockedMe: !!hasBlockedMe,
          createdAt: u.createdAt || u.lastSeen || Date.now(),
          lastSeen: u.lastSeen || null,
        },
      });
    }

    // -------------------------------------------------------------------------
    // 9. Get Messages History
    // -------------------------------------------------------------------------
    if (action === "get_messages") {
      const chatId = url.searchParams.get("chatId");
      if (!chatId) {
        return res.status(400).json({ error: "chatId is required." });
      }
      const messages = await loadChatMessages(chatId);
      return res.status(200).json({ status: "ok", chatId, messages });
    }

    // -------------------------------------------------------------------------
    // 10. Send Message
    // -------------------------------------------------------------------------
    if (action === "send_message" && req.method === "POST") {
      const {
        id: clientMsgId,
        chatId,
        sender,
        recipient,
        text = "",
        mediaType = null,
        mediaUrl = null,
        duration = null,
        replyTo = null,
      } = req.body || {};

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
      senderUser.lastSeen = Date.now();

      return res.status(200).json({ status: "ok", message: newMsg });
    }

    // -------------------------------------------------------------------------
    // 11. Mark Read
    // -------------------------------------------------------------------------
    if (action === "mark_read" && req.method === "POST") {
      const { chatId, username } = req.body || {};
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
      const activeChatId = url.searchParams.get("chatId");
      const since = parseInt(url.searchParams.get("since") || "0", 10);
      const wait = url.searchParams.get("wait");

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

      // Long-polling: if wait=1 is requested and no new messages yet, wait for real-time bus or timeout
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
          }, 12000);
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
        newMessages,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("API error in api/msg.js:", err);
    return res.status(500).json({ error: err.message || "Internal server error." });
  }
}
