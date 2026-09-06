// app.js - 120fps Fluid iOS Client with Claude/DeepSeek Bottom Selector & Separated Thinking

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

  // Bottom Composer Elements
  const modelPickerBtn = document.getElementById("modelPickerBtn");
  const modelPopover = document.getElementById("modelPopover");
  const popoverBackdrop = document.getElementById("popoverBackdrop");
  const closePopoverBtn = document.getElementById("closePopoverBtn");
  const currentModelGlyph = document.getElementById("currentModelGlyph");
  const currentModelName = document.getElementById("currentModelName");
  const currentModelBadge = document.getElementById("currentModelBadge");
  const popoverItems = document.querySelectorAll(".popover-item");
  const quickPills = document.querySelectorAll(".quick-pill");

  // Image Attachment Elements
  const attachBtn = document.getElementById("attachBtn");
  const imageFileInput = document.getElementById("imageFileInput");
  const attachedImagePreview = document.getElementById("attachedImagePreview");
  const attachedThumb = document.getElementById("attachedThumb");
  const attachedFileName = document.getElementById("attachedFileName");
  const removeAttachedBtn = document.getElementById("removeAttachedBtn");

  let attachedImage = null; // { data: base64/url, name: "file.jpg", type: "image/jpeg" }
  let selectedModel = "1.7b";
  let conversation = [];
  let abortController = null;
  let isGenerating = false;

  // Tactile Haptic Vibration for Mobile Devices
  function triggerHaptic(type = "light") {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(type === "medium" ? 15 : 8);
      } catch (e) {}
    }
  }

  const MODEL_CONFIG = {
    "1.7b": { name: "Qwen 1.7B", glyph: "✦", badge: "4 Nodes", title: "How can 1.7B help you?", placeholder: "Message Qwen 1.7B..." },
    "r1": { name: "DeepSeek R1", glyph: "🧠", badge: "3 Nodes", title: "DeepSeek-R1 (Reasoning)", placeholder: "Ask a complex reasoning or logic problem..." },
    "llama3b": { name: "Llama 3.2 3B", glyph: "🦙", badge: "2 Nodes", title: "Llama 3.2 3B (Meta)", placeholder: "Message Llama 3.2 3B..." },
    "qwen3b": { name: "Qwen 2.5 3B", glyph: "✨", badge: "2 Nodes", title: "Qwen 2.5 3B (Alibaba)", placeholder: "Message Qwen 2.5 3B..." },
    "coder": { name: "Qwen Coder", glyph: "💻", badge: "2 Nodes", title: "Qwen 2.5 Coder (Coding)", placeholder: "Ask for code, architecture, or debugging..." },
    "gemma": { name: "Gemma 2 2B", glyph: "💎", badge: "1 Node", title: "Gemma 2 2B (Google)", placeholder: "Message Gemma 2..." },
    "math": { name: "Qwen Math", glyph: "📐", badge: "1 Node", title: "Qwen Math (Calculations)", placeholder: "Enter a math problem or equation..." },
    "phi": { name: "Phi-3.5 Mini", glyph: "🔬", badge: "1 Node", title: "Phi-3.5 Mini (Microsoft)", placeholder: "Message Phi-3.5..." },
    "1b": { name: "Llama 3.2 1B", glyph: "⚡", badge: "2 Nodes", title: "How can 1B help you?", placeholder: "Message 1B..." },
    "smol": { name: "SmolLM2", glyph: "🍃", badge: "1 Node", title: "SmolLM2 (Fast Assistant)", placeholder: "Message SmolLM2..." },
    "0.5b": { name: "Qwen 0.5B", glyph: "🪶", badge: "2 Nodes", title: "How can 0.5B help you?", placeholder: "Message 0.5B..." },
    "image": { name: "SD-Turbo Image", glyph: "🎨", badge: "2 Nodes", title: "What would you like to imagine?", placeholder: "Describe an image to generate..." },
  };

  // ---------------------------------------------------------------------------
  // Claude / DeepSeek Style Bottom Model Switcher & Mobile Bottom Sheet
  // ---------------------------------------------------------------------------
  function togglePopover(forceState) {
    if (!modelPopover) return;
    const isClosed = modelPopover.classList.contains("hidden");
    const shouldOpen = forceState !== undefined ? forceState : isClosed;

    if (shouldOpen) {
      modelPopover.classList.remove("hidden");
      if (window.innerWidth <= 640 && popoverBackdrop) {
        popoverBackdrop.classList.remove("hidden");
      }
      modelPickerBtn?.setAttribute("aria-expanded", "true");
      triggerHaptic("light");
    } else {
      modelPopover.classList.add("hidden");
      if (popoverBackdrop) popoverBackdrop.classList.add("hidden");
      modelPickerBtn?.setAttribute("aria-expanded", "false");
    }
  }

  function closePopover() {
    togglePopover(false);
  }

  if (modelPickerBtn) {
    modelPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePopover();
    });
  }

  if (popoverBackdrop) {
    popoverBackdrop.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopover();
    });
  }

  if (closePopoverBtn) {
    closePopoverBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopover();
    });
  }

  document.addEventListener("click", (e) => {
    if (modelPopover && !modelPopover.classList.contains("hidden")) {
      if (!modelPopover.contains(e.target) && !modelPickerBtn?.contains(e.target) && !popoverBackdrop?.contains(e.target)) {
        closePopover();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopover();
  });

  // Swipe-down-to-dismiss gesture on iOS bottom sheet
  let sheetTouchStartY = 0;
  let sheetTouchCurrentY = 0;
  const sheetHandle = document.querySelector(".sheet-drag-handle");
  const popoverHeader = document.querySelector(".popover-header");

  function onSheetTouchStart(e) {
    sheetTouchStartY = e.touches[0].clientY;
  }
  function onSheetTouchMove(e) {
    sheetTouchCurrentY = e.touches[0].clientY;
    const delta = sheetTouchCurrentY - sheetTouchStartY;
    if (delta > 0 && modelPopover && window.innerWidth <= 640) {
      modelPopover.style.transform = `translateY(${delta}px)`;
    }
  }
  function onSheetTouchEnd() {
    const delta = sheetTouchCurrentY - sheetTouchStartY;
    if (delta > 60 && window.innerWidth <= 640) {
      closePopover();
    }
    if (modelPopover) {
      modelPopover.style.transform = "";
    }
    sheetTouchStartY = 0;
    sheetTouchCurrentY = 0;
  }

  if (sheetHandle) {
    sheetHandle.addEventListener("touchstart", onSheetTouchStart, { passive: true });
    sheetHandle.addEventListener("touchmove", onSheetTouchMove, { passive: true });
    sheetHandle.addEventListener("touchend", onSheetTouchEnd, { passive: true });
  }
  if (popoverHeader) {
    popoverHeader.addEventListener("touchstart", onSheetTouchStart, { passive: true });
    popoverHeader.addEventListener("touchmove", onSheetTouchMove, { passive: true });
    popoverHeader.addEventListener("touchend", onSheetTouchEnd, { passive: true });
  }

  function setModel(model) {
    if (!MODEL_CONFIG[model]) return;
    triggerHaptic("light");
    selectedModel = model;
    const cfg = MODEL_CONFIG[model];

    // Update bottom trigger button UI
    if (currentModelGlyph) currentModelGlyph.textContent = cfg.glyph;
    if (currentModelName) currentModelName.textContent = cfg.name;
    if (currentModelBadge) currentModelBadge.textContent = cfg.badge;

    // Update popover items active state
    popoverItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-model") === model);
    });

    // Update quick pills active state
    quickPills.forEach((pill) => {
      pill.classList.toggle("active", pill.getAttribute("data-model") === model);
    });

    // Update input placeholder & welcome heading
    messageInput.placeholder = cfg.placeholder;
    if (welcomeHeading) {
      welcomeHeading.textContent = cfg.title;
    }

    closePopover();
    checkConnection();
  }

  popoverItems.forEach((item) => {
    item.addEventListener("click", () => {
      const model = item.getAttribute("data-model");
      if (model) setModel(model);
    });
  });

  quickPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const model = pill.getAttribute("data-model");
      if (model) setModel(model);
    });
  });

  // ---------------------------------------------------------------------------
  // Status Check: "Connecting to AS cloud" / "Connected to AS cloud"
  // ---------------------------------------------------------------------------
  async function checkConnection() {
    try {
      const res = await fetch(`/api/health?model=${selectedModel}&_t=${Date.now()}`);
      const data = await res.json();

      if (data.status === "ok") {
        updateStatus("online", `Connected to AS cloud (${data.model || selectedModel.toUpperCase()})`);
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
          triggerHaptic("light");
          setTimeout(() => (btn.textContent = "Copy"), 2000);
        });
      };
      pre.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------------------
  // Separate Thinking & Reply Parser (Supports both Qwen3 & DeepSeek R1)
  // ---------------------------------------------------------------------------
  function parseThinkingAndReply(raw, model = selectedModel) {
    if (!raw) return { thinking: null, reply: "", isThinkingDone: true };

    const isR1 = (model || "").toLowerCase().includes("r1") || (model || "").toLowerCase().includes("deepseek");
    const thinkStart = raw.indexOf("<think>");

    if (thinkStart === -1) {
      // DeepSeek R1 often starts generation directly inside the thinking block without leading <think>
      if (raw.includes("</think>")) {
        const thinkEnd = raw.indexOf("</think>");
        const thinking = raw.substring(0, thinkEnd).trim();
        const reply = raw.substring(thinkEnd + 8).trimStart();
        return { thinking, reply, isThinkingDone: true };
      } else if (isR1) {
        // While streaming R1, before </think> arrives, all content is thinking
        return { thinking: raw.trimStart(), reply: "", isThinkingDone: false };
      }
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

  function renderAssistantBubble(bubbleElement, rawContent, isLive = false, model = selectedModel) {
    const { thinking, reply, isThinkingDone } = parseThinkingAndReply(rawContent, model);

    let html = "";

    if (thinking !== null && thinking.length > 0) {
      const isOpen = isLive && !isThinkingDone;
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
      renderAssistantBubble(bubble, content, false, selectedModel);
    }

    row.appendChild(bubble);
    messagesFlow.appendChild(row);

    smoothScrollToBottom();
    return bubble;
  }

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Input Handling & Image Attachment
  // ---------------------------------------------------------------------------
  function autoResizeInput() {
    messageInput.style.height = "auto";
    const newHeight = Math.min(messageInput.scrollHeight, 140);
    messageInput.style.height = `${newHeight}px`;
    const hasContent = Boolean(messageInput.value.trim() || attachedImage);
    sendBtn.disabled = !hasContent || isGenerating;
  }

  function setAttachedImage(imgObj) {
    attachedImage = imgObj;
    if (imgObj) {
      if (attachedThumb) attachedThumb.src = imgObj.data;
      if (attachedFileName) attachedFileName.textContent = imgObj.name || "Attached Image";
      attachedImagePreview?.classList.remove("hidden");
      attachBtn?.classList.add("active");
      messageInput.placeholder = "Describe edit (e.g. Remove the background)...";
      messageInput.focus();
    } else {
      attachedImagePreview?.classList.add("hidden");
      attachBtn?.classList.remove("active");
      if (attachedThumb) attachedThumb.src = "";
      messageInput.placeholder = MODEL_CONFIG[selectedModel]?.placeholder || "Message";
    }
    autoResizeInput();
  }

  if (attachBtn && imageFileInput) {
    attachBtn.addEventListener("click", () => {
      imageFileInput.click();
    });

    imageFileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedImage({
          data: ev.target.result,
          name: file.name,
          type: file.type || "image/jpeg",
        });
      };
      reader.readAsDataURL(file);
      imageFileInput.value = "";
    });
  }

  if (removeAttachedBtn) {
    removeAttachedBtn.addEventListener("click", () => {
      setAttachedImage(null);
    });
  }

  // Paste image directly from clipboard
  messageInput.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setAttachedImage({
              data: ev.target.result,
              name: file.name || `pasted_${Date.now()}.png`,
              type: file.type || "image/png",
            });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  });

  messageInput.addEventListener("input", autoResizeInput);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (messageInput.value.trim() || attachedImage)) {
        sendMessage();
      }
    }
  });

  sendBtn.addEventListener("click", () => {
    if (!isGenerating && (messageInput.value.trim() || attachedImage)) {
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
    setAttachedImage(null);
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
    const hasContent = Boolean(messageInput.value.trim() || attachedImage);
    sendBtn.disabled = generating || !hasContent;
    stopBtn.classList.toggle("hidden", !generating);
    if (!generating) {
      messageInput.focus();
    }
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  // ---------------------------------------------------------------------------
  // SD-Turbo Image Generation Handler
  // ---------------------------------------------------------------------------
  async function generateImageMessage(prompt) {
    appendMessage("user", prompt);

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-image-loading">
        <div class="image-shimmer"></div>
        <div class="image-loading-content">
          <span class="ios-spinner"></span>
          <span>Imagining with AS cloud (SD-Turbo)...</span>
        </div>
      </div>
    `;

    setGenerating(true);
    abortController = new AbortController();

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({ prompt, size: "512x512" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Failed to generate image (HTTP ${response.status}).`;
        throw new Error(errMsg);
      }

      const resData = await response.json();
      const item = resData.data?.[0];
      if (!item) {
        throw new Error("No image data returned from server.");
      }

      const dataUrl = item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url;
      const downloadFileName = `as_cloud_${Date.now()}.png`;

      assistantBubble.innerHTML = `
        <div class="ios-image-card">
          <div class="image-frame">
            <img src="${dataUrl}" alt="${escapeHtml(prompt)}" class="generated-image" />
          </div>
          <div class="image-meta-bar">
            <span class="image-prompt-text">"${escapeHtml(prompt)}"</span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="image-download-btn edit-generated-btn" style="background: rgba(255, 255, 255, 0.15); color: #ffffff;" title="Edit or Remove Background">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Edit / Remove BG</span>
              </button>
              <a href="${dataUrl}" download="${downloadFileName}" class="image-download-btn" title="Save Image">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Save</span>
              </a>
            </div>
          </div>
        </div>
      `;

      const editBtn = assistantBubble.querySelector(".edit-generated-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          setAttachedImage({
            data: dataUrl,
            name: `generated_${Date.now()}.png`,
            type: "image/png",
          });
          messageInput.value = "Remove the background";
          autoResizeInput();
          messageInput.focus();
        });
      }

      conversation.push({ role: "assistant", content: `[Generated Image: "${prompt}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Image generation canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">⚠️ ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  // ---------------------------------------------------------------------------
  // YouTube Detection & Formatting Helpers
  // ---------------------------------------------------------------------------
  const YT_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

  function formatViews(views) {
    if (!views) return "";
    const n = Number(views);
    if (isNaN(n)) return String(views);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B views";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M views";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K views";
    return n + " views";
  }

  // ---------------------------------------------------------------------------
  // /play <music name> Handler (David Cyril Play API)
  // ---------------------------------------------------------------------------
  async function handlePlayMusicCommand(query) {
    appendMessage("user", `/play ${query}`);

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-media-loading">
        <div class="image-shimmer"></div>
        <div class="image-loading-content">
          <span class="ios-spinner"></span>
          <span>Searching & loading track "${escapeHtml(query)}" from AS Cloud...</span>
        </div>
      </div>
    `;

    setGenerating(true);
    abortController = new AbortController();

    try {
      let data = null;

      // 1. Try serverless proxy first
      try {
        const proxyRes = await fetch(`/api/play?query=${encodeURIComponent(query)}`, {
          signal: abortController.signal,
        });
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch (e) {}

      // 2. Direct client fallback
      if (!data || !data.result) {
        const directRes = await fetch(`https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(query)}`, {
          signal: abortController.signal,
        });
        if (!directRes.ok) {
          throw new Error(`Music service returned HTTP ${directRes.status}`);
        }
        data = await directRes.json();
      }

      const item = data?.result || data;
      if (!item || !item.download_url) {
        throw new Error(`Track "${query}" could not be found or has no stream available.`);
      }

      const title = item.title || query;
      const thumbnail = item.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300";
      const duration = item.duration || "";
      const viewsFormatted = formatViews(item.views);
      const published = item.published || "";
      const streamUrl = item.download_url;
      const videoUrl = item.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
      const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp3`;

      assistantBubble.innerHTML = `
        <div class="ios-media-card">
          <div class="music-card-header">
            <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" class="music-cover-art" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'" />
            <div class="music-info">
              <span class="music-badge">🎵 AS Music</span>
              <div class="music-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
              <div class="music-meta">
                ${duration ? `<span>⏱ ${escapeHtml(duration)}</span>` : ""}
                ${viewsFormatted ? `<span>• 👁 ${viewsFormatted}</span>` : ""}
                ${published ? `<span>• 📅 ${escapeHtml(published)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="music-player-section">
            <audio controls preload="metadata" class="ios-native-audio" src="${escapeHtml(streamUrl)}">
              Your browser does not support audio playback.
            </audio>

            <div class="media-actions-bar">
              <a href="${escapeHtml(streamUrl)}" download="${escapeHtml(safeFilename)}" target="_blank" class="media-btn-primary" title="Download Track MP3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Download MP3</span>
              </a>

              <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="media-btn-secondary" title="Watch on YouTube">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>YouTube</span>
              </a>
            </div>
          </div>
        </div>
      `;

      conversation.push({ role: "assistant", content: `[Playing Track: "${title}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Music request canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">⚠️ ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  // ---------------------------------------------------------------------------
  // YouTube Link Detector & Downloader (David Cyril Snapsaver API)
  // ---------------------------------------------------------------------------
  async function handleYouTubeMedia(ytUrl, originalText) {
    appendMessage("user", originalText);

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-media-loading">
        <div class="image-shimmer"></div>
        <div class="image-loading-content">
          <span class="ios-spinner"></span>
          <span>Analyzing YouTube video & extracting streams...</span>
        </div>
      </div>
    `;

    setGenerating(true);
    abortController = new AbortController();

    try {
      let data = null;

      // 1. Try serverless proxy first
      try {
        const proxyRes = await fetch(`/api/youtube?url=${encodeURIComponent(ytUrl)}`, {
          signal: abortController.signal,
        });
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch (e) {}

      // 2. Direct client fallback
      if (!data || !data.result) {
        const directRes = await fetch(`https://apis.davidcyril.name.ng/download/snapsaver?url=${encodeURIComponent(ytUrl)}`, {
          signal: abortController.signal,
        });
        if (!directRes.ok) {
          throw new Error(`Video service returned HTTP ${directRes.status}`);
        }
        data = await directRes.json();
      }

      const res = data?.result || data;
      if (!res) {
        throw new Error("Could not extract media data from this YouTube link.");
      }

      const title = res.title || "YouTube Video";
      const author = res.author || "YouTube Creator";
      const thumbnail = res.thumbnail || "";
      const duration = res.duration || "";
      const viewsFormatted = formatViews(res.views);
      const videos = Array.isArray(res.videos) ? res.videos : [];
      const audios = Array.isArray(res.audios) ? res.audios : [];

      // Find best playable MP4 stream for <video> tag
      const playableVideo =
        videos.find((v) => v.format === "mp4" && v.quality && v.quality.includes("720")) ||
        videos.find((v) => v.format === "mp4" && v.quality && v.quality.includes("360")) ||
        videos.find((v) => v.format === "mp4") ||
        videos[0];

      const bestVideoUrl = playableVideo?.url || "";

      // Quality & Download options
      let chipsHtml = "";
      const seenQualities = new Set();

      videos.forEach((v) => {
        if (!v.url || seenQualities.has(v.quality)) return;
        seenQualities.add(v.quality);
        const isFeatured = v.quality.includes("720") || seenQualities.size === 1;
        const label = v.quality ? `${v.quality.replace(/x\d+/, "p")} ${v.format?.toUpperCase() || "MP4"}` : `${v.format?.toUpperCase() || "Video"}`;
        chipsHtml += `
          <a href="${escapeHtml(v.url)}" download="${escapeHtml(title)}_${escapeHtml(v.quality)}.${v.format || 'mp4'}" target="_blank" class="yt-dl-chip ${isFeatured ? 'featured' : ''}" title="Download ${escapeHtml(label)}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>${escapeHtml(label)}</span>
          </a>
        `;
      });

      audios.forEach((a) => {
        if (!a.url) return;
        const label = `🎵 Audio (${a.quality || "HQ"} ${a.format?.toUpperCase() || "MP4"})`;
        chipsHtml += `
          <a href="${escapeHtml(a.url)}" download="${escapeHtml(title)}_audio.${a.format || 'mp3'}" target="_blank" class="yt-dl-chip" title="Download ${escapeHtml(label)}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>${escapeHtml(label)}</span>
          </a>
        `;
      });

      assistantBubble.innerHTML = `
        <div class="ios-media-card">
          ${
            bestVideoUrl
              ? `
              <div class="yt-card-video-wrap">
                <video controls playsinline preload="metadata" poster="${escapeHtml(thumbnail)}" class="yt-card-video" src="${escapeHtml(bestVideoUrl)}">
                  Your browser does not support HTML5 video.
                </video>
              </div>
            `
              : thumbnail
              ? `
              <div class="yt-card-video-wrap">
                <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" class="yt-card-video" style="object-fit: cover;" />
              </div>
            `
              : ""
          }

          <div class="yt-card-body">
            <div class="yt-card-title">${escapeHtml(title)}</div>
            <div class="yt-card-author">
              <span>👤 ${escapeHtml(author)}</span>
            </div>

            <div class="yt-meta-pills">
              ${duration ? `<span class="yt-pill">⏱ ${escapeHtml(duration)}</span>` : ""}
              ${viewsFormatted ? `<span class="yt-pill">👁 ${viewsFormatted}</span>` : ""}
              <span class="yt-pill">▶ YouTube</span>
            </div>

            <div class="yt-downloads-header">Download Formats & Audio</div>
            <div class="yt-quality-list">
              ${chipsHtml || `<span style="color: var(--text-tertiary); font-size: 11px;">Direct links ready.</span>`}
            </div>

            <div style="margin-top: 6px;">
              <a href="${escapeHtml(ytUrl)}" target="_blank" rel="noopener noreferrer" class="media-btn-secondary" style="display: inline-flex;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Open on YouTube</span>
              </a>
            </div>
          </div>
        </div>
      `;

      conversation.push({ role: "assistant", content: `[YouTube Media: "${title}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(YouTube processing canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">⚠️ ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  // ---------------------------------------------------------------------------
  // Image-to-Image AI Editor Handler (Nanobanana + Release Database)
  // ---------------------------------------------------------------------------
  async function handleEditImage(imageSource, prompt, userMessageText) {
    appendMessage("user", userMessageText || `/edit ${prompt}`);

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-media-loading">
        <div class="image-shimmer"></div>
        <div class="image-loading-content">
          <span class="ios-spinner"></span>
          <span>Editing image with AS AI (Nanobanana)...</span>
        </div>
      </div>
    `;

    setGenerating(true);
    abortController = new AbortController();

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          image: imageSource,
          prompt: prompt || "Remove the background",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Image editing failed (HTTP ${response.status}).`);
      }

      const resData = await response.json();
      const originalProxyUrl = resData.original_proxy_url;
      const resultProxyUrl = resData.result_proxy_url;
      const originalStorageUrl = resData.original_storage_url;
      const resultStorageUrl = resData.result_storage_url;
      const finalPrompt = resData.prompt || prompt;

      assistantBubble.innerHTML = `
        <div class="ios-edit-card">
          <div class="edit-card-grid">
            <div class="edit-col">
              <span class="edit-col-badge">Original</span>
              <img src="${escapeHtml(originalProxyUrl)}" alt="Original Image" onerror="this.src='${escapeHtml(originalStorageUrl)}'" />
            </div>
            <div class="edit-col">
              <span class="edit-col-badge" style="background: rgba(48, 209, 88, 0.75);">Edited</span>
              <img src="${escapeHtml(resultProxyUrl)}" alt="Edited Image" onerror="this.src='${escapeHtml(resultStorageUrl)}'" />
            </div>
          </div>

          <div class="edit-card-body">
            <div class="edit-prompt-text">✨ "${escapeHtml(finalPrompt)}"</div>
            <div class="edit-actions-bar">
              <a href="${escapeHtml(resultProxyUrl)}" download="as_edited_${Date.now()}.jpg" target="_blank" class="media-btn-primary" title="Download Edited Image">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Save Result</span>
              </a>

              <button type="button" class="media-btn-secondary copy-proxy-btn" data-url="${escapeHtml(resultProxyUrl)}">
                <span>Copy URL</span>
              </button>

              <a href="${escapeHtml(resultProxyUrl)}" target="_blank" rel="noopener noreferrer" class="media-btn-secondary" title="Open Fullscreen">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                <span>View Full</span>
              </a>
            </div>
          </div>
        </div>
      `;

      const copyBtn = assistantBubble.querySelector(".copy-proxy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const fullUrl = window.location.origin + copyBtn.getAttribute("data-url");
          navigator.clipboard.writeText(fullUrl).then(() => {
            copyBtn.innerHTML = "<span>Copied!</span>";
            triggerHaptic("light");
            setTimeout(() => { copyBtn.innerHTML = "<span>Copy URL</span>"; }, 2000);
          });
        });
      }

      conversation.push({ role: "assistant", content: `[Edited Image: "${finalPrompt}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Image editing canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">⚠️ ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      setAttachedImage(null);
      autoResizeInput();
    }
  }

  // ---------------------------------------------------------------------------
  // Message Transmission with Separated Thinking & 120fps Batching
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    const text = messageInput.value.trim();
    if ((!text && !attachedImage) || isGenerating) return;

    triggerHaptic("medium");

    // Case A: User has attached an image to edit
    if (attachedImage) {
      const prompt = text || "Remove the background";
      const userText = text ? `[Attached Image] ${text}` : `[Attached Image] Remove the background`;
      const imgData = attachedImage.data;
      setAttachedImage(null);
      messageInput.value = "";
      autoResizeInput();
      handleEditImage(imgData, prompt, userText);
      return;
    }

    messageInput.value = "";
    autoResizeInput();

    // Case B: Check if /edit or /rmbg command
    const isEditCommand = /^\/(edit|rmbg|removebg)\b/i.test(text);
    if (isEditCommand) {
      const rest = text.replace(/^\/(edit|rmbg|removebg)\s*/i, "").trim();
      const urlMatch = rest.match(/^(https?:\/\/[^\s]+)\s*(.*)$/i);
      if (urlMatch) {
        const imageUrl = urlMatch[1];
        const prompt = urlMatch[2] || "Remove the background";
        handleEditImage(imageUrl, prompt, text);
        return;
      } else if (rest) {
        appendMessage("user", text);
        const guideBubble = appendMessage("assistant", "");
        guideBubble.innerHTML = `
          <div style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.5;">
            🎨 <strong>Image Editing Usage:</strong><br>
            1. Attach an image using the 📎 button in the composer and type your edit prompt.<br>
            2. Or type: <code>/edit &lt;image_url&gt; &lt;prompt&gt;</code><br>
            <em>Example:</em> <code>/edit https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg Remove the background</code>
          </div>
        `;
        return;
      }
    }

    // 1. Check if Music /play command
    const isPlayCommand = /^\/(play|music)\b/i.test(text);
    if (isPlayCommand) {
      const songQuery = text.replace(/^\/(play|music)\s*/i, "").trim();
      if (songQuery) {
        handlePlayMusicCommand(songQuery);
        return;
      } else {
        appendMessage("user", text);
        const guideBubble = appendMessage("assistant", "");
        guideBubble.innerHTML = `
          <div style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.5;">
            🎵 <strong>Music Play Command:</strong><br>
            Type <code>/play &lt;song name&gt;</code> to stream and download songs.<br>
            <em>Example:</em> <code>/play Alan Walker - Faded</code>
          </div>
        `;
        return;
      }
    }

    // 2. Check if YouTube link is pasted/entered
    const ytMatch = text.match(YT_REGEX);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const normalizedYtUrl = `https://www.youtube.com/watch?v=${videoId}`;
      handleYouTubeMedia(normalizedYtUrl, text);
      return;
    }

    // 3. Check if Image Mode or /image command
    const isImageCommand = text.toLowerCase().startsWith("/image ") || text.toLowerCase().startsWith("/imagine ");
    if (selectedModel === "image" || isImageCommand) {
      const prompt = isImageCommand ? text.replace(/^\/(image|imagine)\s+/i, "").trim() : text;
      if (prompt) {
        generateImageMessage(prompt);
        return;
      }
    }

    appendMessage("user", text);
    conversation.push({ role: "user", content: text });

    const currentReqModel = selectedModel;
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
          renderAssistantBubble(assistantBubble, accumulatedText, true, currentReqModel);
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
          model: currentReqModel,
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
        renderAssistantBubble(assistantBubble, accumulatedText, false, currentReqModel);
        smoothScrollToBottom();
      });

      // Save clean response to conversation history
      const parsedFinal = parseThinkingAndReply(accumulatedText, currentReqModel);
      conversation.push({ role: "assistant", content: parsedFinal.reply || accumulatedText });
    } catch (err) {
      if (err.name === "AbortError") {
        renderAssistantBubble(assistantBubble, accumulatedText, false, currentReqModel);
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

  // Virtual Viewport for mobile software keyboard alignment
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      smoothScrollToBottom();
    });
  }

  // Dismiss keyboard when scrolling messages viewport on mobile
  if (chatViewport) {
    chatViewport.addEventListener(
      "touchstart",
      () => {
        if (document.activeElement === messageInput) {
          messageInput.blur();
        }
      },
      { passive: true }
    );
  }

  // Initialize
  autoResizeInput();
  checkConnection();
})();
