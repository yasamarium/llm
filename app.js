// app.js - Client Application for yasamarium/llm

(function () {
  // DOM Elements
  const chatViewport = document.getElementById("chatViewport");
  const welcomeContainer = document.getElementById("welcomeContainer");
  const messagesList = document.getElementById("messagesList");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const statusBtn = document.getElementById("statusBtn");
  const statusText = document.getElementById("statusText");

  // Settings Modal Elements
  const settingsModal = document.getElementById("settingsModal");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const resetSettingsBtn = document.getElementById("resetSettingsBtn");
  const testConnectionBtn = document.getElementById("testConnectionBtn");
  const serverUrlInput = document.getElementById("serverUrlInput");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const systemPromptInput = document.getElementById("systemPromptInput");
  const tempInput = document.getElementById("tempInput");
  const tempVal = document.getElementById("tempVal");
  const maxTokensInput = document.getElementById("maxTokensInput");
  const maxTokensVal = document.getElementById("maxTokensVal");
  const connectionResult = document.getElementById("connectionResult");

  // Default Settings
  const DEFAULT_CONFIG = {
    serverUrl: "", // Empty = use Vercel Serverless /api/chat fallback
    apiKey: "",
    systemPrompt: "You are Qwen3 4B, an intelligent, helpful, and precise AI assistant.",
    temperature: 0.7,
    maxTokens: 512,
  };

  // State
  let config = loadConfig();
  let conversation = [];
  let abortController = null;
  let isGenerating = false;

  // ---------------------------------------------------------------------------
  // Settings Management
  // ---------------------------------------------------------------------------
  function loadConfig() {
    try {
      const saved = localStorage.getItem("yasamarium_llm_config");
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to load local config:", e);
    }
    return { ...DEFAULT_CONFIG };
  }

  function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    localStorage.setItem("yasamarium_llm_config", JSON.stringify(config));
  }

  function populateSettingsUI() {
    serverUrlInput.value = config.serverUrl || "";
    apiKeyInput.value = config.apiKey || "";
    systemPromptInput.value = config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
    tempInput.value = config.temperature;
    tempVal.textContent = config.temperature;
    maxTokensInput.value = config.maxTokens;
    maxTokensVal.textContent = config.maxTokens;
    connectionResult.textContent = "";
    connectionResult.className = "field-feedback";
  }

  tempInput.addEventListener("input", () => (tempVal.textContent = tempInput.value));
  maxTokensInput.addEventListener("input", () => (maxTokensVal.textContent = maxTokensInput.value));

  // ---------------------------------------------------------------------------
  // Status Check & Health Verification
  // ---------------------------------------------------------------------------
  async function checkServerHealth() {
    updateStatusPill("checking", "Connecting...");
    try {
      const queryParam = config.serverUrl ? `?serverUrl=${encodeURIComponent(config.serverUrl)}` : "";
      const res = await fetch(`/api/health${queryParam}`, {
        headers: config.serverUrl ? { "x-server-url": config.serverUrl } : {},
      });
      const data = await res.json();

      if (data.status === "ok") {
        updateStatusPill("online", "Qwen3 4B Online");
        return true;
      } else {
        updateStatusPill("offline", "Server Offline");
        return false;
      }
    } catch (err) {
      updateStatusPill("offline", "Server Offline");
      return false;
    }
  }

  function updateStatusPill(status, text) {
    statusBtn.className = `status-pill ${status}`;
    statusText.textContent = text;
  }

  // Poll health every 30 seconds
  setInterval(checkServerHealth, 30000);

  // ---------------------------------------------------------------------------
  // Message Handling & UI
  // ---------------------------------------------------------------------------
  function appendMessage(role, content = "") {
    if (welcomeContainer) {
      welcomeContainer.classList.add("hidden");
    }

    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "You" : "⚡";

    const contentBox = document.createElement("div");
    contentBox.className = "message-content";

    if (role === "user") {
      contentBox.textContent = content;
    } else {
      contentBox.innerHTML = renderMarkdown(content);
    }

    row.appendChild(avatar);
    row.appendChild(contentBox);
    messagesList.appendChild(row);

    scrollToBottom();
    return contentBox;
  }

  function renderMarkdown(text) {
    if (!text) return '<span class="streaming-cursor"></span>';
    if (typeof marked !== "undefined") {
      const html = marked.parse(text);
      return html;
    }
    return text.replace(/\n/g, "<br>");
  }

  function attachCodeCopyButtons(container) {
    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.onclick = () => {
        const code = pre.querySelector("code")?.innerText || pre.innerText;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 2000);
        });
      };
      pre.appendChild(btn);
    });
  }

  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  // Auto-resize input
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${Math.min(this.scrollHeight, 160)}px`;
  });

  messageInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  stopBtn.addEventListener("click", () => {
    if (abortController) {
      abortController.abort();
      setGenerating(false);
    }
  });

  newChatBtn.addEventListener("click", () => {
    if (isGenerating && abortController) {
      abortController.abort();
    }
    conversation = [];
    messagesList.innerHTML = "";
    welcomeContainer.classList.remove("hidden");
    setGenerating(false);
    messageInput.focus();
  });

  // Prompt chip quick clicks
  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      messageInput.value = chip.getAttribute("data-prompt");
      sendMessage();
    });
  });

  function setGenerating(generating) {
    isGenerating = generating;
    sendBtn.disabled = generating;
    messageInput.disabled = generating;
    stopBtn.classList.toggle("hidden", !generating);
    if (!generating) {
      messageInput.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Send & Stream Message
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isGenerating) return;

    // Reset input
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Append user message
    appendMessage("user", text);
    conversation.push({ role: "user", content: text });

    // Prepare assistant message bubble
    const assistantBubble = appendMessage("assistant", "");
    setGenerating(true);

    abortController = new AbortController();

    // Prepare full messages array with system prompt
    const fullMessages = [];
    if (config.systemPrompt) {
      fullMessages.push({ role: "system", content: config.systemPrompt });
    }
    fullMessages.push(...conversation);

    let accumulatedText = "";

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (config.serverUrl) headers["x-server-url"] = config.serverUrl;
      if (config.apiKey) headers["x-api-key"] = config.apiKey;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        signal: abortController.signal,
        body: JSON.stringify({
          messages: fullMessages,
          temperature: Number(config.temperature),
          max_tokens: Number(config.maxTokens),
          stream: true,
          serverUrl: config.serverUrl,
          apiKey: config.apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg =
          errorData.error?.message || `HTTP ${response.status}: Server request failed.`;
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete chunk in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const delta =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.text ||
              "";
            if (delta) {
              accumulatedText += delta;
              assistantBubble.innerHTML =
                renderMarkdown(accumulatedText) + '<span class="streaming-cursor"></span>';
              scrollToBottom();
            }
          } catch (e) {
            // Partial JSON fragment, ignore
          }
        }
      }

      // Complete render without cursor
      assistantBubble.innerHTML = renderMarkdown(accumulatedText);
      attachCodeCopyButtons(assistantBubble);
      if (typeof hljs !== "undefined") {
        assistantBubble.querySelectorAll("pre code").forEach(hljs.highlightElement);
      }
      conversation.push({ role: "assistant", content: accumulatedText });
      scrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML =
          renderMarkdown(accumulatedText) + '<p class="text-muted"><em>(Generation stopped)</em></p>';
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-offline);">⚠️ <strong>Error:</strong> ${err.message}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Modal Interactions
  // ---------------------------------------------------------------------------
  function openSettings() {
    populateSettingsUI();
    settingsModal.classList.remove("hidden");
  }

  function closeSettings() {
    settingsModal.classList.add("hidden");
  }

  settingsBtn.addEventListener("click", openSettings);
  statusBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);

  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  saveSettingsBtn.addEventListener("click", () => {
    saveConfig({
      serverUrl: serverUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      systemPrompt: systemPromptInput.value.trim(),
      temperature: parseFloat(tempInput.value),
      maxTokens: parseInt(maxTokensInput.value, 10),
    });
    closeSettings();
    checkServerHealth();
  });

  resetSettingsBtn.addEventListener("click", () => {
    saveConfig(DEFAULT_CONFIG);
    populateSettingsUI();
    checkServerHealth();
  });

  testConnectionBtn.addEventListener("click", async () => {
    const testUrl = serverUrlInput.value.trim();
    connectionResult.textContent = "Testing connection...";
    connectionResult.className = "field-feedback";

    try {
      const query = testUrl ? `?serverUrl=${encodeURIComponent(testUrl)}` : "";
      const res = await fetch(`/api/health${query}`);
      const data = await res.json();
      if (data.status === "ok") {
        connectionResult.textContent = `✓ Connected! Model: ${data.data?.model || "qwen3-4b"}`;
        connectionResult.className = "field-feedback success";
      } else {
        connectionResult.textContent = `✗ Server offline or unreachable: ${data.message || "Check URL"}`;
        connectionResult.className = "field-feedback error";
      }
    } catch (e) {
      connectionResult.textContent = `✗ Test failed: ${e.message}`;
      connectionResult.className = "field-feedback error";
    }
  });

  // Initialize
  checkServerHealth();
})();
