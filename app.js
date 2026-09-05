// app.js - 120fps Fluid iOS Client for Qwen3 4B

(function () {
  "use strict";

  const chatViewport = document.getElementById("chatViewport");
  const welcomeView = document.getElementById("welcomeView");
  const messagesFlow = document.getElementById("messagesFlow");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const statusPill = document.getElementById("statusPill");
  const statusLabel = document.getElementById("statusLabel");

  let conversation = [];
  let abortController = null;
  let isGenerating = false;
  let isConnected = false;

  // ---------------------------------------------------------------------------
  // Status Check: "Connecting to AS cloud" / "Connected to AS cloud"
  // ---------------------------------------------------------------------------
  async function checkConnection() {
    try {
      const res = await fetch(`/api/health?_t=${Date.now()}`);
      const data = await res.json();

      if (data.status === "ok") {
        updateStatus("online", "Connected to AS cloud");
        isConnected = true;
        return true;
      } else {
        updateStatus("checking", "Connecting to AS cloud...");
        isConnected = false;
        return false;
      }
    } catch (e) {
      updateStatus("offline", "AS cloud offline");
      isConnected = false;
      return false;
    }
  }

  function updateStatus(state, text) {
    statusPill.className = `ios-pill ${state}`;
    statusLabel.textContent = text;
  }

  // Poll health every 15 seconds
  setInterval(checkConnection, 15000);

  // ---------------------------------------------------------------------------
  // 120fps Optimized Rendering & Scroll Helpers
  // ---------------------------------------------------------------------------
  let scrollRafId = null;
  function smoothScrollToBottom() {
    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    scrollRafId = requestAnimationFrame(() => {
      chatViewport.scrollTo({
        top: chatViewport.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '<span class="ios-cursor"></span>';
    if (typeof marked !== "undefined") {
      return marked.parse(rawText);
    }
    return rawText.replace(/\n/g, "<br>");
  }

  function attachCodeCopy(container) {
    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.textContent = "Copy";
      btn.onclick = () => {
        const code = pre.querySelector("code")?.innerText || pre.innerText;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 2000);
        });
      };
      pre.appendChild(btn);
    });
  }

  function appendMessage(role, content = "") {
    if (welcomeView) {
      welcomeView.style.display = "none";
    }

    const row = document.createElement("div");
    row.className = `ios-row ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "ios-bubble";

    if (role === "user") {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }

    row.appendChild(bubble);
    messagesFlow.appendChild(row);

    smoothScrollToBottom();
    return bubble;
  }

  // ---------------------------------------------------------------------------
  // Input Handling
  // ---------------------------------------------------------------------------
  function autoResizeInput() {
    messageInput.style.height = "auto";
    const newHeight = Math.min(messageInput.scrollHeight, 140);
    messageInput.style.height = `${newHeight}px`;
    sendBtn.disabled = !messageInput.value.trim() || isGenerating;
  }

  messageInput.addEventListener("input", autoResizeInput);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && messageInput.value.trim()) {
        sendMessage();
      }
    }
  });

  sendBtn.addEventListener("click", () => {
    if (!isGenerating && messageInput.value.trim()) {
      sendMessage();
    }
  });

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
    messagesFlow.innerHTML = "";
    if (welcomeView) welcomeView.style.display = "flex";
    setGenerating(false);
    messageInput.value = "";
    autoResizeInput();
    messageInput.focus();
  });

  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      messageInput.value = chip.getAttribute("data-prompt");
      autoResizeInput();
      sendMessage();
    });
  });

  function setGenerating(generating) {
    isGenerating = generating;
    sendBtn.disabled = generating || !messageInput.value.trim();
    stopBtn.classList.toggle("hidden", !generating);
    if (!generating) {
      messageInput.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Direct Message Transmission with 120fps Batching
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isGenerating) return;

    messageInput.value = "";
    autoResizeInput();

    appendMessage("user", text);
    conversation.push({ role: "user", content: text });

    const assistantBubble = appendMessage("assistant", "");
    setGenerating(true);

    abortController = new AbortController();

    const fullMessages = [
      { role: "system", content: "You are a helpful, precise, and polite AI assistant." },
      ...conversation,
    ];

    let accumulatedText = "";
    let renderScheduled = false;

    // 120fps render loop
    function scheduleRender() {
      if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(() => {
          assistantBubble.innerHTML =
            renderMarkdown(accumulatedText) + '<span class="ios-cursor"></span>';
          smoothScrollToBottom();
          renderScheduled = false;
        });
      }
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 512,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg =
          errorData.error?.message || `Failed to connect to AS cloud (HTTP ${response.status}).`;
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
        buffer = lines.pop();

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
              scheduleRender();
            }
          } catch (e) {}
        }
      }

      // Final render without cursor
      requestAnimationFrame(() => {
        assistantBubble.innerHTML = renderMarkdown(accumulatedText);
        attachCodeCopy(assistantBubble);
        if (typeof hljs !== "undefined") {
          assistantBubble.querySelectorAll("pre code").forEach(hljs.highlightElement);
        }
        smoothScrollToBottom();
      });

      conversation.push({ role: "assistant", content: accumulatedText });
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML =
          renderMarkdown(accumulatedText) + '<p style="color: var(--text-tertiary); font-style: italic;">(Stopped)</p>';
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red);">⚠️ ${err.message}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  // Initialize
  autoResizeInput();
  checkConnection();
})();
