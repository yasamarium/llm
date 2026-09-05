// app.js - 120fps Fluid iOS Client with Separated Thinking & Reply

(function () {
  "use strict";

  const chatViewport = document.getElementById("chatViewport");
  const welcomeView = document.getElementById("welcomeView");
  const welcomeHeading = document.getElementById("welcomeHeading");
  const messagesFlow = document.getElementById("messagesFlow");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const statusPill = document.getElementById("statusPill");
  const statusLabel = document.getElementById("statusLabel");

  const btn17B = document.getElementById("btn17B");
  const btn1B = document.getElementById("btn1B");
  const btn05B = document.getElementById("btn05B");

  let selectedModel = "1.7b";
  let conversation = [];
  let abortController = null;
  let isGenerating = false;

  // ---------------------------------------------------------------------------
  // Model Switcher (1.7B vs 1B vs 0.5B)
  // ---------------------------------------------------------------------------
  function setModel(model) {
    if (selectedModel === model) return;
    selectedModel = model;

    btn17B.classList.toggle("active", model === "1.7b");
    btn1B.classList.toggle("active", model === "1b");
    btn05B.classList.toggle("active", model === "0.5b");

    if (model === "0.5b") {
      if (welcomeHeading) welcomeHeading.textContent = "How can 0.5B help you?";
    } else if (model === "1b") {
      if (welcomeHeading) welcomeHeading.textContent = "How can 1B help you?";
    } else {
      if (welcomeHeading) welcomeHeading.textContent = "How can I help you?";
    }

    checkConnection();
  }

  btn17B.addEventListener("click", () => setModel("1.7b"));
  btn1B.addEventListener("click", () => setModel("1b"));
  btn05B.addEventListener("click", () => setModel("0.5b"));

  // ---------------------------------------------------------------------------
  // Status Check: "Connecting to AS cloud" / "Connected to AS cloud"
  // ---------------------------------------------------------------------------
  async function checkConnection() {
    try {
      const res = await fetch(`/api/health?model=${selectedModel}&_t=${Date.now()}`);
      const data = await res.json();

      if (data.status === "ok") {
        updateStatus("online", `Connected to AS cloud (${selectedModel.toUpperCase()})`);
        return true;
      } else {
        updateStatus("checking", "Connecting to AS cloud...");
        return false;
      }
    } catch (e) {
      updateStatus("offline", "AS cloud offline");
      return false;
    }
  }

  function updateStatus(state, text) {
    statusPill.className = `ios-pill ${state}`;
    statusLabel.textContent = text;
  }

  setInterval(checkConnection, 15000);

  // ---------------------------------------------------------------------------
  // 120fps Rendering & Scroll Helpers
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
    if (!rawText) return "";
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

  // ---------------------------------------------------------------------------
  // Separate Thinking & Reply Parser
  // ---------------------------------------------------------------------------
  function parseThinkingAndReply(raw) {
    const thinkStart = raw.indexOf("<think>");
    if (thinkStart === -1) {
      // Check if raw starts with partial or leading tag
      return { thinking: null, reply: raw, isThinkingDone: true };
    }

    const thinkEnd = raw.indexOf("</think>");
    if (thinkEnd === -1) {
      // Currently generating inside thinking
      const thinking = raw.substring(thinkStart + 7).trimStart();
      return { thinking, reply: "", isThinkingDone: false };
    }

    // Thinking is completed, reply is streaming
    const thinking = raw.substring(thinkStart + 7, thinkEnd).trim();
    const reply = raw.substring(thinkEnd + 8).trimStart();
    return { thinking, reply, isThinkingDone: true };
  }

  function renderAssistantBubble(bubbleElement, rawContent, isLive = false) {
    const { thinking, reply, isThinkingDone } = parseThinkingAndReply(rawContent);

    let html = "";

    if (thinking !== null) {
      // Determine if thought container should be open
      // During active thinking, keep open. Once thinking is finished, collapse automatically.
      const isOpen = isLive && !isThinkingDone;
      const pulseClass = !isThinkingDone ? "thinking-active" : "";
      const labelText = !isThinkingDone ? "Thinking..." : "Thought Process";

      html += `
        <div class="ios-thought-container ${isOpen ? "open" : ""}" id="thoughtBox">
          <button class="thought-toggle-btn" type="button">
            <span class="thought-pulse-icon">💭</span>
            <span class="thought-label">${labelText}</span>
            <span class="thought-chevron">›</span>
          </button>
          <div class="thought-body">${thinking.replace(/\n/g, "<br>")}</div>
        </div>
      `;
    }

    // Final clean reply
    const renderedReply = renderMarkdown(reply);
    const cursor = isLive ? '<span class="ios-cursor"></span>' : "";

    html += `<div class="ios-reply-body">${renderedReply}${cursor}</div>`;

    bubbleElement.innerHTML = html;

    // Attach click toggle for the thought accordion
    const toggleBtn = bubbleElement.querySelector(".thought-toggle-btn");
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const container = toggleBtn.closest(".ios-thought-container");
        if (container) {
          container.classList.toggle("open");
        }
      };
    }

    attachCodeCopy(bubbleElement);
    if (typeof hljs !== "undefined") {
      bubbleElement.querySelectorAll("pre code").forEach(hljs.highlightElement);
    }
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
      renderAssistantBubble(bubble, content, false);
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
  // Message Transmission with Separated Thinking & 120fps Batching
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
      { role: "system", content: "You are a helpful, concise, and polite AI assistant." },
      ...conversation,
    ];

    let accumulatedText = "";
    let renderScheduled = false;

    function scheduleRender() {
      if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(() => {
          renderAssistantBubble(assistantBubble, accumulatedText, true);
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
          model: selectedModel,
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
        renderAssistantBubble(assistantBubble, accumulatedText, false);
        smoothScrollToBottom();
      });

      // Save clean response to conversation history
      const parsedFinal = parseThinkingAndReply(accumulatedText);
      conversation.push({ role: "assistant", content: parsedFinal.reply || accumulatedText });
    } catch (err) {
      if (err.name === "AbortError") {
        renderAssistantBubble(assistantBubble, accumulatedText, false);
        const stopNotice = document.createElement("p");
        stopNotice.style.cssText = "color: var(--text-tertiary); font-style: italic; margin-top: 8px;";
        stopNotice.textContent = "(Stopped)";
        assistantBubble.appendChild(stopNotice);
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">⚠️ ${err.message}</div>`;
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
