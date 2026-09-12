// api/chat.js - Unified Multi-Replica Fleet Proxy for AS Cloud

const DEFAULT_API_KEY = "qwen3-direct-access";

const ENDPOINTS = {
  "maiko-yen": [
    "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server7/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server8/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server9/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server10/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server11/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server12/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server13/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server14/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server15/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server16/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server17/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server18/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server19/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server20/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server21/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server22/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
  ],
  "r1": [
    "https://raw.githubusercontent.com/yasamarium/server9/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server15/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server16/main/endpoint.txt",
  ],
  "coder": [
    "https://raw.githubusercontent.com/yasamarium/server10/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server17/main/endpoint.txt",
  ],
  "llama3b": [
    "https://raw.githubusercontent.com/yasamarium/server19/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server20/main/endpoint.txt",
  ],
  "qwen3b": [
    "https://raw.githubusercontent.com/yasamarium/server21/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server22/main/endpoint.txt",
  ],
  "1.7b": [
    "https://raw.githubusercontent.com/yasamarium/server2/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server3/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server4/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/llmserver/main/endpoint.txt",
  ],
  "1b": [
    "https://raw.githubusercontent.com/yasamarium/server1/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server18/main/endpoint.txt",
  ],
  "0.5b": [
    "https://raw.githubusercontent.com/yasamarium/server5/main/endpoint.txt",
    "https://raw.githubusercontent.com/yasamarium/server6/main/endpoint.txt",
  ],
  "gemma": ["https://raw.githubusercontent.com/yasamarium/server11/main/endpoint.txt"],
  "smol": ["https://raw.githubusercontent.com/yasamarium/server12/main/endpoint.txt"],
  "math": ["https://raw.githubusercontent.com/yasamarium/server13/main/endpoint.txt"],
  "phi": ["https://raw.githubusercontent.com/yasamarium/server14/main/endpoint.txt"],
};

const S62_MODELS = {
  "gpt-5": "https://apis.davidcyril.name.ng/ai/gpt-5",
  "kimi-k2.6": "https://apis.davidcyril.name.ng/ai/kimi-k2.6",
  "claude-opus-4.8": "https://apis.davidcyril.name.ng/ai/claude-opus-4.8",
  "gemini-3-pro": "https://apis.davidcyril.name.ng/ai/gemini-3-pro",
  "gemini-3.1-pro": "https://apis.davidcyril.name.ng/ai/gemini-3.1-pro",
  "qwen3-max": "https://apis.davidcyril.name.ng/ai/qwen3-max",
  "deepseek-v4-flash": "https://apis.davidcyril.name.ng/ai/deepseek-v4-flash",
};

let roundRobinIndex = 0;

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

function normalizeModel(rawModel) {
  const m = (rawModel || "").toLowerCase();
  if (m.includes("maiko") || m.includes("yen")) return "maiko-yen";
  if (m.includes("gpt-5") || m.includes("gpt5")) return "gpt-5";
  if (m.includes("kimi") || m.includes("k2.6")) return "kimi-k2.6";
  if (m.includes("claude") || m.includes("opus")) return "claude-opus-4.8";
  if (m.includes("gemini-3.1") || m.includes("gemini 3.1") || m.includes("3.1-pro") || m.includes("3.1 pro") || m.includes("3.1")) return "gemini-3.1-pro";
  if (m.includes("gemini-3") || m.includes("gemini 3") || m.includes("3-pro") || m.includes("3 pro") || m.includes("gemini")) return "gemini-3-pro";
  if (m.includes("qwen3-max") || m.includes("qwen-max") || m.includes("qwen3 max") || m.includes("qwen max") || m.includes("max")) return "qwen3-max";
  if (m.includes("deepseek-v4-flash") || m.includes("deepseek-v4") || m.includes("deepseek v4") || m.includes("v4-flash") || m.includes("v4 flash") || m.includes("deepseek flash") || m.includes("v4")) return "deepseek-v4-flash";
  if (m.includes("r1") || m.includes("deepseek")) return "r1";
  if (m.includes("coder") || m.includes("code")) return "coder";
  if (m.includes("llama3b") || m.includes("llama-3b") || m.includes("llama 3b") || m.includes("llama")) return "llama3b";
  if (m.includes("qwen3b") || m.includes("qwen-3b") || m.includes("qwen 3b") || m.includes("3b")) return "qwen3b";
  if (m.includes("gemma")) return "gemma";
  if (m.includes("smol")) return "smol";
  if (m.includes("math")) return "math";
  if (m.includes("phi")) return "phi";
  if (m.includes("0.5b")) return "0.5b";
  if (m.includes("1b")) return "1b";
  return "1.7b";
}

function extractQwenThinking(raw) {
  if (!raw || typeof raw !== "string") return { thinking: "", reply: raw || "" };

  if (raw.includes("<think>")) {
    const end = raw.indexOf("</think>");
    if (end !== -1) {
      return {
        thinking: raw.substring(raw.indexOf("<think>") + 7, end).trim(),
        reply: raw.substring(end + 8).trim(),
      };
    }
    return { thinking: raw.substring(raw.indexOf("<think>") + 7).trim(), reply: "" };
  }

  const trimmed = raw.trim();
  const isReasoning = /^(okay|alright|let'?s?\s+(see|examine|think|look|check)|first|hmm+|the user|i need to|i should|wait|so\b|we need to|to answer this|looking at|our goal|this is a)/i.test(trimmed);
  if (!isReasoning) {
    return { thinking: "", reply: raw };
  }

  // 1. Find all wrap-up match candidates and choose the one that maximizes thinking (last transition)
  const wrapRegex = /(?:clearly and concisely|explain the steps in the comments|confident the result is correct|put it all together and see|put it all together clearly|provide a straightforward answer|provide (?:a )?friendly,?\s*(?:and )?helpful answer|respond helpfully[a-z0-9 ,-]*|answer directly|under \d+ tokens|that should cover it|that should be \w+ words|that makes sense|that works|should be sufficient|time to put it all together|let me put it all together|ready to write|looks correct|seems to work|all cases correctly|the result is correct|the answer is correct|that's the answer|that is the answer|should handle all cases|(?:I'll|I will|Let's|let me) (?:present|write|provide|give|output|go with) (?:that|this|the answer|the code|it|the solution)[a-z0-9 -]*|stick to the (?:basic|standard) version|no mistakes(?: here)?|all methods (?:lead to|give|match)[a-z0-9 -]*|still the same answer)[.!?](?:\s*|\n*)/gi;

  let bestSplitIdx = -1;
  let m;
  while ((m = wrapRegex.exec(trimmed)) !== null) {
    const candidateIdx = m.index + m[0].length;
    const remaining = trimmed.substring(candidateIdx).trim();
    if (remaining.length > 0) {
      bestSplitIdx = candidateIdx;
    }
  }

  if (bestSplitIdx !== -1) {
    return {
      thinking: trimmed.substring(0, bestSplitIdx).trim(),
      reply: trimmed.substring(bestSplitIdx).trim(),
    };
  }

  // 2. Scan for sentence boundary where monologue concludes and answer begins
  const regex = /([.!?])(?=(?:\n\s*|[A-Z0-9*#`]))/g;
  let lastCandidate = -1;
  while ((m = regex.exec(trimmed)) !== null) {
    const idx = m.index + 1;
    const after = trimmed.substring(idx).trim();
    if (after.length > 5 && (
      after.startsWith("**") ||
      after.startsWith("#") ||
      after.startsWith("```") ||
      /^\d+\.\s/.test(after) ||
      /^(The|Here|To solve|This|In short|I am|As an|Yes|No|Answer|Step|Sure)/.test(after)
    )) {
      lastCandidate = idx;
    }
  }

  if (lastCandidate !== -1) {
    return {
      thinking: trimmed.substring(0, lastCandidate).trim(),
      reply: trimmed.substring(lastCandidate).trim(),
    };
  }

  // 3. Fallback: double newline before structured text
  const mdMatch = trimmed.search(/\n\s*(?:#{1,6}\s|\d+\.\s|\*\*|```)/);
  if (mdMatch > 50) {
    return {
      thinking: trimmed.substring(0, mdMatch).trim(),
      reply: trimmed.substring(mdMatch).trim(),
    };
  }

  return { thinking: "", reply: raw };
}

async function getAvailableEndpoints(modelKey) {
  if (process.env.LLMSERVER_URL) {
    return [process.env.LLMSERVER_URL.replace(/\/+$/, "")];
  }

  const list = ENDPOINTS[modelKey] || ENDPOINTS["1.7b"];
  const startIndex = roundRobinIndex % list.length;
  roundRobinIndex = (roundRobinIndex + 1) % list.length;

  const ordered = [
    ...list.slice(startIndex),
    ...list.slice(0, startIndex),
  ];

  const validUrls = [];
  for (const candidate of ordered) {
    const url = await fetchEndpointUrl(candidate);
    if (url && !url.includes("localhost") && !url.includes("example.com")) {
      validUrls.push(url);
    }
  }

  return validUrls.length > 0 ? validUrls : ["http://localhost:8000"];
}

function isIdentityQuery(rawText) {
  if (!rawText) return false;
  const cleaned = rawText
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .replace(/\s+/g, " ");

  const identityKeywords = [
    "who are you", "what is your name", "who made you", "who created you",
    "who built you", "who designed you", "who developed you", "what are you",
    "tum kaun ho", "tera naam kya hai", "apka naam kya hai", "kisne banaya",
    "kisne create kiya", "tell me about yourself", "identify yourself",
    "who is your owner", "who owns you", "who is your maker", "maker of you",
    "who is as", "are you maiko", "are you maiko yen"
  ];
  return identityKeywords.some(phrase => cleaned.includes(phrase));
}

function isGreeting(rawText) {
  if (!rawText) return false;
  const cleaned = rawText
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .replace(/\s+/g, " ");

  const exactGreetings = new Set([
    "hi", "hii", "hiii", "hiiii",
    "hey", "heyy", "heyyy",
    "hello", "helloo", "hellooo",
    "hola", "namaste", "salam", "salaam",
    "assalam alaikum", "assalamu alaikum", "assalamualaikum",
    "yo", "sup", "whats up", "what is up", "whatsup",
    "howdy", "good morning", "good afternoon", "good evening", "good day",
    "hi there", "hello there", "hey there",
    "hi bot", "hello bot", "hey bot",
    "hi as", "hello as", "hey as"
  ]);

  if (exactGreetings.has(cleaned)) return true;

  const pattern = /^(h+i+|h+e+y+|h+e+l+l*o+|h+o+l+a|namaste|salam|assalam|yo|sup|howdy)(\s+(there|buddy|bro|friend|bot|as|cloud))?$/i;
  return pattern.test(cleaned);
}

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const {
    messages,
    model = "1.7b",
    temperature = 0.7,
    max_tokens = 512,
    stream = true,
  } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Messages array is required." } });
  }

  const modelKey = normalizeModel(model);

  // Instant preset reply for greetings (HI, hello, hey, etc.) - saves cloud inference & latency
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  // MAIKO YEN specific identity and creator fast-path
  if (modelKey === "maiko-yen" && isIdentityQuery(lastUserMsg)) {
    const replyText = "I am **MAIKO YEN**, an advanced autonomous AI model created and made by **AS**. I operate across a distributed cloud architecture of 20+ workflow node repositories on AS cloud. How can I assist you today?";
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const sseMsg = { choices: [{ delta: { content: replyText } }] };
      res.write(`data: ${JSON.stringify(sseMsg)}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    } else {
      return res.status(200).json({
        choices: [{ message: { role: "assistant", content: replyText } }],
      });
    }
  }

  if (isGreeting(lastUserMsg)) {
    if (modelKey === "maiko-yen") {
      const replyText = "Hello! I am **MAIKO YEN**, an advanced AI model created and made by **AS**, running on an autonomous distributed network of 20+ cloud workflow nodes. How can I assist you today?";
      if (stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const sseMsg = { choices: [{ delta: { content: replyText } }] };
        res.write(`data: ${JSON.stringify(sseMsg)}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      } else {
        return res.status(200).json({
          choices: [{ message: { role: "assistant", content: replyText } }],
        });
      }
    }
    const isS62 = Boolean(S62_MODELS[modelKey]);
    const s62Names = {
      "gpt-5": "GPT-5",
      "claude-opus-4.8": "Claude Opus 4.8",
      "kimi-k2.6": "Kimi K2.6",
      "gemini-3-pro": "Gemini 3 Pro",
      "gemini-3.1-pro": "Gemini 3.1 Pro",
      "qwen3-max": "Qwen 3 Max",
      "deepseek-v4-flash": "DeepSeek V4 Flash",
    };
    const displayName = s62Names[modelKey] || modelKey.toUpperCase();
    const replyText = isS62
      ? `Hello! I am **${displayName}**, running on **AS Cloud (EXCLUSIVE S-62)**. How can I assist you today?`
      : `Hello! I am **AS Intelligence**, powered by **AS Cloud**. How can I assist you today?`;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const sseMsg = { choices: [{ delta: { content: replyText } }] };
      res.write(`data: ${JSON.stringify(sseMsg)}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    } else {
      return res.status(200).json({
        choices: [{ message: { role: "assistant", content: replyText } }],
      });
    }
  }

  // Handle EXCLUSIVE S-62 Flagship models
  if (S62_MODELS[modelKey]) {
    const s62Url = S62_MODELS[modelKey];

    // Build prompt from messages array
    let promptText = "";
    if (messages.length === 1) {
      promptText = messages[0].content || "";
    } else {
      const recent = messages.slice(-6);
      promptText = recent
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n") + "\nAssistant:";
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const upstreamRes = await fetch(`${s62Url}?prompt=${encodeURIComponent(promptText)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!upstreamRes.ok) {
        throw new Error(`EXCLUSIVE S-62 node (${modelKey}) returned HTTP ${upstreamRes.status}`);
      }

      const json = await upstreamRes.json();
      let replyText = json.data || json.result || json.response || "";
      if (!replyText && typeof json === "string") replyText = json;
      if (!replyText) replyText = "No response output received from AS cloud (EXCLUSIVE S-62).";

      // Qwen 3 Max & DeepSeek V4 Flash Deep Reasoning & Thinking Mode
      if (modelKey === "qwen3-max" || modelKey === "deepseek-v4-flash") {
        const { thinking, reply } = extractQwenThinking(replyText);
        if (thinking && thinking.length > 0) {
          if (stream) {
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");

            // 1. Send opening <think> tag
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "<think>" } }] })}\n\n`);

            // 2. Stream thinking tokens smoothly
            const thinkWords = thinking.split(" ");
            for (let i = 0; i < thinkWords.length; i += 3) {
              const chunk = (i > 0 ? " " : "") + thinkWords.slice(i, i + 3).join(" ");
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
              if (i + 3 < thinkWords.length) {
                await new Promise((r) => setTimeout(r, 12));
              }
            }

            // 3. Send closing </think> tag and spacing
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "</think>\n\n" } }] })}\n\n`);

            // 4. Stream final reply tokens smoothly
            const replyWords = reply.split(" ");
            for (let i = 0; i < replyWords.length; i += 2) {
              const chunk = (i > 0 ? " " : "") + replyWords.slice(i, i + 2).join(" ");
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
              if (i + 2 < replyWords.length) {
                await new Promise((r) => setTimeout(r, 16));
              }
            }
            res.write("data: [DONE]\n\n");
            return res.end();
          } else {
            const formatted = `<think>${thinking}</think>\n\n${reply}`;
            return res.status(200).json({
              choices: [{ message: { role: "assistant", content: formatted } }],
            });
          }
        }
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const words = replyText.split(" ");
        for (let i = 0; i < words.length; i += 2) {
          const chunk = (i > 0 ? " " : "") + words.slice(i, i + 2).join(" ");
          const sseMsg = {
            choices: [{ delta: { content: chunk } }],
          };
          res.write(`data: ${JSON.stringify(sseMsg)}\n\n`);
          if (i + 2 < words.length) {
            await new Promise((r) => setTimeout(r, 16));
          }
        }
        res.write("data: [DONE]\n\n");
        return res.end();
      } else {
        return res.status(200).json({
          choices: [{ message: { role: "assistant", content: replyText } }],
        });
      }
    } catch (err) {
      return res.status(502).json({
        error: {
          message: `EXCLUSIVE S-62 node (${modelKey}) error: ${err.message}`,
        },
      });
    }
  }

  // MAIKO YEN workflow fleet preparation: Ensure persona system prompt is injected
  let effectiveMessages = messages;
  if (modelKey === "maiko-yen") {
    const maikoSystemPrompt = {
      role: "system",
      content: "You are MAIKO YEN, an advanced artificial intelligence system created and made by AS. You run on an autonomous distributed network of 20+ workflow node repositories. Your name is MAIKO YEN, and your creator is AS. When asked who you are, what your name is, or who made you, always answer that you are MAIKO YEN, made by AS. Never claim to be made by OpenAI, Google, Meta, or any other entity. Provide intelligent, helpful, accurate, polite, and comprehensive answers."
    };
    effectiveMessages = [
      maikoSystemPrompt,
      ...messages.filter(m => m.role !== "system"),
    ];
  }

  const targetUrls = await getAvailableEndpoints(modelKey);
  const apiKey = process.env.LLMSERVER_API_KEY || DEFAULT_API_KEY;

  let lastError = null;

  for (const targetUrl of targetUrls) {
    try {
      const upstreamRes = await fetch(`${targetUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelKey,
          messages: effectiveMessages,
          temperature: Number(temperature),
          max_tokens: Number(max_tokens),
          stream: Boolean(stream),
        }),
      });

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        lastError = new Error(`Node ${targetUrl} returned HTTP ${upstreamRes.status}: ${errText}`);
        continue;
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        return res.end();
      } else {
        const data = await upstreamRes.json();
        return res.status(200).json(data);
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  // Seamless fallback for MAIKO YEN if nodes are in 6-hour restart cycle
  if (modelKey === "maiko-yen") {
    try {
      const recent = effectiveMessages.slice(-6);
      const promptText = "Instructions: You are MAIKO YEN, created and made by AS. Runs on 20+ workflow nodes. Always identify as MAIKO YEN made by AS.\n\n" +
        recent.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\nAssistant:";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const fallbackUrl = "https://apis.davidcyril.name.ng/ai/deepseek-v4-flash";
      const upstreamRes = await fetch(`${fallbackUrl}?prompt=${encodeURIComponent(promptText)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const json = await upstreamRes.json();
        let replyText = json.data || json.result || json.response || "";
        if (replyText) {
          // Sanitize any generic branding
          replyText = replyText
            .replace(/deepseek|chatgpt|openai|google assistant/gi, "MAIKO YEN")
            .replace(/developed by deepseek|developed by openai|created by google/gi, "created and made by AS");

          if (stream) {
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");

            const words = replyText.split(" ");
            for (let i = 0; i < words.length; i += 2) {
              const chunk = (i > 0 ? " " : "") + words.slice(i, i + 2).join(" ");
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
              if (i + 2 < words.length) await new Promise((r) => setTimeout(r, 16));
            }
            res.write("data: [DONE]\n\n");
            return res.end();
          } else {
            return res.status(200).json({
              choices: [{ message: { role: "assistant", content: replyText } }],
            });
          }
        }
      }
    } catch (_) {}
  }

  return res.status(502).json({
    error: {
      message: `All replica nodes for model '${modelKey}' are temporarily busy or restarting. Retrying AS cloud...`,
      detail: lastError ? String(lastError) : "No endpoints responded",
    },
  });
}
