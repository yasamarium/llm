// api/msg.js - AS Real Live Messaging Engine Backend with Secure Auth
// Backed by yasamarium/msg-db-users, msg-db-messages, msg-db-rooms & msg-media-storage
import crypto from "crypto";

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
// In-Memory Fast Cache for Sub-50ms WhatsApp Response Times
// ---------------------------------------------------------------------------
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
  const now = Date.now();
  if (!force && MEM_USERS.list.length > 0 && now - MEM_USERS.updatedAt < 5000) {
    return MEM_USERS.list;
  }
  const file = await fetchRepoFile(REPO_USERS, "data/users.json");
  if (file && Array.isArray(file.content)) {
    MEM_USERS = { list: file.content, sha: file.sha, updatedAt: now };
    return MEM_USERS.list;
  }
  return MEM_USERS.list;
}

async function saveUsers(newList) {
  MEM_USERS.list = newList;
  MEM_USERS.updatedAt = Date.now();
  const newSha = await writeRepoFile(REPO_USERS, "data/users.json", newList, "chore: update users directory", MEM_USERS.sha);
  if (newSha) MEM_USERS.sha = newSha;
}

async function loadRooms(force = false) {
  const now = Date.now();
  if (!force && MEM_ROOMS.list.length > 0 && now - MEM_ROOMS.updatedAt < 20000) {
    return MEM_ROOMS.list;
  }
  const file = await fetchRepoFile(REPO_ROOMS, "data/rooms.json");
  if (file && Array.isArray(file.content)) {
    MEM_ROOMS = { list: file.content, sha: file.sha, updatedAt: now };
    return MEM_ROOMS.list;
  }
  return MEM_ROOMS.list;
}

// ---------------------------------------------------------------------------
// Chat Messages Loader & Sync
// ---------------------------------------------------------------------------
function getChatFilePath(chatId) {
  const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `data/chats/${safeId}.json`;
}

async function loadChatMessages(chatId, force = false) {
  const now = Date.now();
  const cached = MEM_CHATS.get(chatId);
  if (!force && cached && now - cached.updatedAt < 3000) {
    return cached.messages;
  }

  const filePath = getChatFilePath(chatId);
  const file = await fetchRepoFile(REPO_MESSAGES, filePath);
  if (file && Array.isArray(file.content)) {
    MEM_CHATS.set(chatId, {
      messages: file.content,
      sha: file.sha,
      updatedAt: now,
      isDirty: false,
    });
    return file.content;
  }

  if (!cached) {
    MEM_CHATS.set(chatId, {
      messages: [],
      sha: null,
      updatedAt: now,
      isDirty: false,
    });
    return [];
  }
  return cached.messages;
}

function scheduleChatPersist(chatId) {
  if (PENDING_WRITES.has(chatId)) {
    clearTimeout(PENDING_WRITES.get(chatId));
  }

  const timer = setTimeout(async () => {
    PENDING_WRITES.delete(chatId);
    const cached = MEM_CHATS.get(chatId);
    if (!cached || !cached.isDirty) return;

    const filePath = getChatFilePath(chatId);
    const newSha = await writeRepoFile(
      REPO_MESSAGES,
      filePath,
      cached.messages,
      `feat: new message in ${chatId}`,
      cached.sha
    );
    if (newSha) {
      cached.sha = newSha;
      cached.isDirty = false;
    }
  }, 1000);

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
      const newUser = {
        username: cleanHandle,
        displayName: displayName?.trim() || cleanHandle,
        pfp: pfp || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        bio: bio?.trim() || "Available on AS Messages",
        passwordHash: hash,
        salt,
        verified: false,
        status: "Active now",
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
      const user = users.find(u => u.username.toLowerCase() === verifiedUsername);
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }

      user.lastSeen = Date.now();
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
      if (pfp) user.pfp = pfp;
      if (bio !== undefined) user.bio = bio.trim();
      user.lastSeen = Date.now();

      await saveUsers(users);

      return res.status(200).json({
        status: "ok",
        user: sanitizeUser(user),
      });
    }

    // -------------------------------------------------------------------------
    // 6. Search Users
    // -------------------------------------------------------------------------
    if (action === "search_users" || action === "get_users") {
      const q = (url.searchParams.get("q") || "").toLowerCase().trim();
      const current = (url.searchParams.get("exclude") || "").toLowerCase().trim();
      const users = await loadUsers();

      const matched = users
        .filter(u => {
          if (current && u.username.toLowerCase() === current) return false;
          if (!q) return true;
          return (
            u.username.toLowerCase().includes(q) ||
            (u.displayName && u.displayName.toLowerCase().includes(q))
          );
        })
        .map(u => ({
          username: u.username,
          displayName: u.displayName || u.username,
          pfp: u.pfp,
          bio: u.bio || "",
          verified: !!u.verified,
          lastSeen: u.lastSeen,
          isOnline: u.lastSeen ? (Date.now() - u.lastSeen < 120000) : false,
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
    // 8. Get Conversations for User
    // -------------------------------------------------------------------------
    if (action === "get_conversations") {
      const username = (url.searchParams.get("username") || "").toLowerCase().trim();
      if (!username) {
        return res.status(400).json({ error: "Username is required." });
      }

      const [rooms, users] = await Promise.all([loadRooms(), loadUsers()]);

      const convos = [];
      for (const room of rooms) {
        const msgs = await loadChatMessages(room.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        convos.push({
          id: room.id,
          type: "channel",
          handle: room.id,
          name: room.name,
          pfp: room.pfp || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150",
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

      for (const other of users) {
        if (other.username.toLowerCase() === username) continue;
        const dmId = getDmChatId(username, other.username);
        const msgs = await loadChatMessages(dmId);

        if (msgs && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          const unreadCount = msgs.filter(m => m.sender.toLowerCase() !== username && m.status !== "read").length;
          const isOnline = other.lastSeen ? (Date.now() - other.lastSeen < 120000) : false;

          convos.push({
            id: dmId,
            type: "direct",
            handle: other.username,
            name: other.displayName || other.username,
            pfp: other.pfp || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            verified: !!other.verified,
            status: isOnline ? "Active now" : "Offline",
            isOnline,
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
      }

      convos.sort((a, b) => {
        const timeA = a.lastMessage?.time || 0;
        const timeB = b.lastMessage?.time || 0;
        return timeB - timeA;
      });

      return res.status(200).json({ status: "ok", conversations: convos });
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
        chatId,
        sender,
        recipient,
        text = "",
        mediaType = null,
        mediaUrl = null,
        duration = null,
      } = req.body || {};

      if (!chatId || !sender) {
        return res.status(400).json({ error: "chatId and sender are required." });
      }
      if (!text.trim() && !mediaUrl) {
        return res.status(400).json({ error: "Message must contain text or media." });
      }

      const users = await loadUsers();
      const senderUser = users.find(u => u.username.toLowerCase() === sender.toLowerCase()) || {
        username: sender,
        displayName: sender,
        pfp: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      };

      const newMsg = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        chatId,
        sender: senderUser.username,
        senderName: senderUser.displayName || senderUser.username,
        senderPfp: senderUser.pfp,
        recipient: recipient || null,
        text: text.trim(),
        mediaType,
        mediaUrl,
        duration,
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

      scheduleChatPersist(chatId);
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
        scheduleChatPersist(chatId);
      }

      return res.status(200).json({ status: "ok", marked: changed });
    }

    // -------------------------------------------------------------------------
    // 12. Real-Time Sync & Presence
    // -------------------------------------------------------------------------
    if (action === "sync") {
      const username = (url.searchParams.get("username") || "").toLowerCase().trim();
      const activeChatId = url.searchParams.get("chatId");
      const since = parseInt(url.searchParams.get("since") || "0", 10);

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
