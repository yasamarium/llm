// app.js - Direct Client Application for yasamarium/llm

(function () {
  const chatViewport = document.getElementById("chatViewport");
  const welcomeContainer = document.getElementById("welcomeContainer");
  const messagesList = document.getElementById("messagesList");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const statusBtn = document.getElementById("statusBtn");
  const statusText = document.getElementById("statusText");

  let conversation = [];
  let abortController = null;
  let isGenerating = false;

  // ---------------------------------------------------------------------------
  // Status Check & Health Verification (Direct Auto-Discovery)
  // ---------------------------------------------------------------------------
  async function checkServerHealth() {
    try {
      const res = await fetch(`/api/health?_t=${Date.now()}`);
      const data = await res.json();

      if (data.status === "ok") {
        updateStatusPill("online", "Qwen3 4B Online");
        return true;
      } else {
        updateStatusPill("checking", "Runner Initializing...");
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

  // Poll health every 15 seconds
  setInterval(checkServerHealth, 15000);

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
      return marked.parse(text);
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
  // Send & Stream Message (Direct, Zero-Config)
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isGenerating) return;

    messageInput.value = "";
    messageInput.style.height = "auto";

    appendMessage("user", text);
    conversation.push({ role: "user", content: text });

    const assistantBubble = appendMessage("assistant", "");
    setGenerating(true);

    abortController = new AbortController();

    const fullMessages = [
      { role: "system", content: "You are Qwen3 4B, an intelligent, helpful, and precise AI assistant." },
      ...conversation,
    ];

    let accumulatedText = "";

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
          errorData.error?.message || `HTTP ${response.status}: Failed to reach LLM runner.`;
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
              assistantBubble.innerHTML =
                renderMarkdown(accumulatedText) + '<span class="streaming-cursor"></span>';
              scrollToBottom();
            }
          } catch (e) {}
        }
      }

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
        assistantBubble.innerHTML = `<div style="color: var(--status-offline); padding: 6px 0;">⚠️ <strong>Error:</strong> ${err.message}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
    }
  }

  // Initial health check
  checkServerHealth();
})();
