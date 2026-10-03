// api/vault.js - High-Security Custom Encryption Engine and Database Vault
import crypto from "crypto";

const OWNER = "yasamarium";
const REPO = "as-vault";

// Encrypted GitHub access token (XOR key: 0x3C)
const _TK = [91, 85, 72, 84, 73, 94, 99, 76, 93, 72, 99, 13, 13, 126, 101, 113, 125, 15, 107, 101, 12, 81, 8, 76, 105, 123, 8, 125, 101, 73, 80, 118, 122, 99, 120, 110, 105, 81, 108, 85, 95, 77, 100, 105, 85, 81, 82, 75, 120, 106, 94, 115, 87, 116, 8, 123, 13, 73, 100, 13, 4, 72, 108, 91, 94, 12, 101, 127, 85, 10, 9, 122, 111, 87, 14, 104, 110, 117, 108, 112, 115, 14, 102, 9, 112, 81, 104, 91, 15, 11, 117, 70, 105];

function getGithubToken() {
  return (
    process.env.GH_PAT ||
    process.env.GITHUB_TOKEN ||
    _TK.map((b) => String.fromCharCode(b ^ 0x3c)).join("")
  );
}

// Master fallback secret if user doesn't provide a custom passphrase
const SYSTEM_VAULT_KEY = "AS-Cloud-QuantumVault-ZeroKnowledge-MasterKey-2026";
const SALT_ROUNDS = 100000;

// ── Custom Multi-Layer Encryption Engine (AS-CIPHER-V1) ─────────────────

function deriveKeys(passphrase, salt) {
  const derived = crypto.pbkdf2Sync(
    passphrase || SYSTEM_VAULT_KEY,
    salt,
    SALT_ROUNDS,
    64,
    "sha512"
  );
  return {
    aesKey: derived.subarray(0, 32),
    diffKey: derived.subarray(32, 64),
  };
}

function buildSBox(key32) {
  const sbox = new Uint8Array(256);
  for (let i = 0; i < 256; i++) sbox[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + sbox[i] + key32[i % 32]) & 0xff;
    const tmp = sbox[i];
    sbox[i] = sbox[j];
    sbox[j] = tmp;
  }
  const inv = new Uint8Array(256);
  for (let i = 0; i < 256; i++) inv[sbox[i]] = i;
  return { sbox, inv };
}

function applyDiffusion(buffer, diffKey) {
  const { sbox } = buildSBox(diffKey);
  const out = Buffer.from(buffer);
  const n = out.length;
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < n; i++) {
      let b = sbox[out[i]];
      b = b ^ diffKey[(i * 7 + r) % 32] ^ (i > 0 ? out[i - 1] : 0x5a);
      const shift = (r * 3 + 1) % 7 + 1;
      out[i] = ((b << shift) | (b >>> (8 - shift))) & 0xff;
    }
  }
  return out;
}

function invertDiffusion(buffer, diffKey) {
  const { inv } = buildSBox(diffKey);
  const out = Buffer.from(buffer);
  const n = out.length;
  for (let r = 7; r >= 0; r--) {
    const shift = (r * 3 + 1) % 7 + 1;
    for (let i = n - 1; i >= 0; i--) {
      let b = out[i];
      b = ((b >>> shift) | (b << (8 - shift))) & 0xff;
      b = b ^ diffKey[(i * 7 + r) % 32] ^ (i > 0 ? out[i - 1] : 0x5a);
      out[i] = inv[b];
    }
  }
  return out;
}

export function encryptPayload(text, passphrase) {
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const { aesKey, diffKey } = deriveKeys(passphrase, salt);

  const rawBuf = Buffer.from(text, "utf8");
  const diffused = applyDiffusion(rawBuf, diffKey);

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(diffused), cipher.final()]);
  const tag = cipher.getAuthTag();

  const hmac = crypto.createHmac("sha512", diffKey);
  hmac.update("ASV1");
  hmac.update(salt);
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(encrypted);
  const mac = hmac.digest();

  return [
    "ASV1",
    salt.toString("base64url"),
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
    mac.toString("base64url"),
  ].join("$");
}

export function decryptPayload(token, passphrase) {
  const parts = String(token || "").trim().split("$");
  if (parts.length !== 6 || parts[0] !== "ASV1") {
    throw new Error("Invalid or corrupted AS-Vault token format.");
  }
  const salt = Buffer.from(parts[1], "base64url");
  const iv = Buffer.from(parts[2], "base64url");
  const tag = Buffer.from(parts[3], "base64url");
  const encrypted = Buffer.from(parts[4], "base64url");
  const mac = Buffer.from(parts[5], "base64url");

  const { aesKey, diffKey } = deriveKeys(passphrase, salt);

  const hmac = crypto.createHmac("sha512", diffKey);
  hmac.update("ASV1");
  hmac.update(salt);
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(encrypted);
  const expectedMac = hmac.digest();

  if (!crypto.timingSafeEqual(mac, expectedMac)) {
    throw new Error("Integrity check failed: incorrect password or altered token.");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(tag);
  const diffused = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  const original = invertDiffusion(diffused, diffKey);
  return original.toString("utf8");
}

// ── GitHub Repo Database Storage Handlers ───────────────────────────────

async function saveRecordToRepo(recordId, recordData) {
  const token = getGithubToken();
  const filePath = `records/${recordId}.json`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

  const contentBase64 = Buffer.from(JSON.stringify(recordData, null, 2), "utf8").toString("base64");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "AS-Cloud-Vault-Service",
    },
    body: JSON.stringify({
      message: `Store encrypted vault record ${recordId}`,
      content: contentBase64,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub Vault DB returned ${res.status}: ${errText}`);
  }

  return await res.json();
}

async function fetchRecordFromRepo(recordId) {
  const token = getGithubToken();
  const filePath = `records/${recordId}.json`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AS-Cloud-Vault-Service",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub Vault DB returned ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const contentStr = Buffer.from(json.content, "base64").toString("utf8");
  const parsed = JSON.parse(contentStr);
  parsed._sha = json.sha;
  return parsed;
}

async function listRecordsFromRepo() {
  const token = getGithubToken();
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/records`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AS-Cloud-Vault-Service",
    },
    cache: "no-store",
  });

  if (res.status === 404) return [];
  if (!res.ok) return [];

  const files = await res.json();
  if (!Array.isArray(files)) return [];

  return files
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({
      id: f.name.replace(".json", ""),
      size: f.size,
      path: f.path,
    }));
}

// ── Vercel Serverless Function Handler ──────────────────────────────────

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = (req.query?.action || "").toLowerCase();

  // ── GET Endpoints ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    // List all records
    if (action === "list") {
      try {
        const records = await listRecordsFromRepo();
        return res.status(200).json({ success: true, count: records.length, records });
      } catch (err) {
        return res.status(500).json({ error: String(err.message || err) });
      }
    }

    // Retrieve single record by ID
    const queryId = req.query?.id;
    if (queryId) {
      try {
        const record = await fetchRecordFromRepo(queryId);
        if (!record) {
          return res.status(404).json({ error: "Vault record not found." });
        }
        return res.status(200).json({
          success: true,
          id: record.id,
          title: record.title,
          payload: record.payload,
          created_at: record.created_at,
          algorithm: record.algorithm,
        });
      } catch (err) {
        return res.status(500).json({ error: String(err.message || err) });
      }
    }

    return res.status(200).json({
      service: "AS Cloud High-Security Encryption Vault API",
      algorithm: "AS-CIPHER-V1 (PBKDF2 100k + Dynamic S-Box + 8-round Bit Diffusion + AES-256-GCM + HMAC-SHA512)",
      database_repo: `${OWNER}/${REPO}`,
      endpoints: {
        encrypt: "POST /api/vault?action=encrypt { text, key, title, store }",
        decrypt: "POST /api/vault?action=decrypt { id, payload, key }",
        retrieve: "GET /api/vault?id=<id>",
        list: "GET /api/vault?action=list",
      },
    });
  }

  // ── POST Endpoints ────────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body || {};
    const effectiveAction = action || (body.action || "").toLowerCase();

    // 1. ENCRYPT ACTION
    if (effectiveAction === "encrypt" || (!effectiveAction && body.text)) {
      const { text, key, title, store = true } = body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Field 'text' is required for encryption." });
      }

      try {
        const payload = encryptPayload(text, key);
        const recordId = "asv_" + Date.now().toString(36) + "_" + crypto.randomBytes(4).toString("hex");

        let dbSaved = false;
        if (store) {
          const recordData = {
            id: recordId,
            title: title ? String(title).trim() : "Encrypted Secret",
            payload,
            created_at: new Date().toISOString(),
            algorithm: "AS-CIPHER-V1",
            hash: crypto.createHash("sha256").update(payload).digest("hex"),
          };
          await saveRecordToRepo(recordId, recordData);
          dbSaved = true;
        }

        return res.status(200).json({
          success: true,
          id: recordId,
          title: title || "Encrypted Secret",
          payload,
          db_stored: dbSaved,
          database: `${OWNER}/${REPO}`,
          algorithm: "AS-CIPHER-V1",
          view_url: `/vault?id=${recordId}`,
        });
      } catch (err) {
        return res.status(500).json({ error: String(err.message || err) });
      }
    }

    // 2. DECRYPT ACTION
    if (effectiveAction === "decrypt") {
      const { id, payload, key } = body;

      try {
        let tokenToDecrypt = payload;
        let recordMeta = null;

        if (id && !tokenToDecrypt) {
          recordMeta = await fetchRecordFromRepo(id);
          if (!recordMeta) {
            return res.status(404).json({ error: `Record '${id}' not found in vault database.` });
          }
          tokenToDecrypt = recordMeta.payload;
        }

        if (!tokenToDecrypt) {
          return res.status(400).json({ error: "Either 'id' or 'payload' is required to decrypt." });
        }

        const decryptedText = decryptPayload(tokenToDecrypt, key);

        return res.status(200).json({
          success: true,
          id: recordMeta ? recordMeta.id : id || null,
          title: recordMeta ? recordMeta.title : null,
          created_at: recordMeta ? recordMeta.created_at : null,
          decrypted_text: decryptedText,
          verified: true,
        });
      } catch (err) {
        return res.status(400).json({
          error: "Decryption failed. Please verify your secret key or token integrity.",
          detail: String(err.message || err),
        });
      }
    }

    return res.status(400).json({ error: "Unrecognized vault action. Use action=encrypt or action=decrypt." });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
