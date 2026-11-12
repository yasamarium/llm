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
  const modelModal = document.getElementById("modelModal");
  const modelPopover = document.getElementById("modelPopover");
  const popoverBackdrop = document.getElementById("popoverBackdrop");
  const closePopoverBtn = document.getElementById("closePopoverBtn");
  const currentModelGlyph = document.getElementById("currentModelGlyph");
  const currentModelName = document.getElementById("currentModelName");
  const currentModelBadge = document.getElementById("currentModelBadge");
  const popoverItems = document.querySelectorAll(".popover-item");

  // Image Attachment Elements
  const attachBtn = document.getElementById("attachBtn");
  const imageFileInput = document.getElementById("imageFileInput");
  const attachedImagePreview = document.getElementById("attachedImagePreview");
  const attachedThumb = document.getElementById("attachedThumb");
  const attachedFileName = document.getElementById("attachedFileName");
  const removeAttachedBtn = document.getElementById("removeAttachedBtn");

  // iOS 18 Lightbox Elements
  const imageLightbox = document.getElementById("imageLightbox");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxSaveBtn = document.getElementById("lightboxSaveBtn");
  const lightboxCopyBtn = document.getElementById("lightboxCopyBtn");
  const lightboxTabBtn = document.getElementById("lightboxTabBtn");

  let attachedImage = null; // { data: base64/url, name: "file.jpg", type: "image/jpeg" }
  let selectedModel = "nvidia/nemotron-3-ultra-550b-a55b";
  let conversation = [];
  let abortController = null;
  let isGenerating = false;

  // ---------------------------------------------------------------------------
  // iOS Taptic Engine & Web Audio Sound Synthesis (Strictly Zero Emojis)
  // ---------------------------------------------------------------------------
  const Taptic = {
    selection: () => { try { navigator.vibrate?.(6); } catch (_) {} },
    light: () => { try { navigator.vibrate?.(10); } catch (_) {} },
    medium: () => { try { navigator.vibrate?.(18); } catch (_) {} },
    heavy: () => { try { navigator.vibrate?.(26); } catch (_) {} },
    reaction: () => { try { navigator.vibrate?.([8, 25, 12]); } catch (_) {} },
    success: () => { try { navigator.vibrate?.([10, 35, 15]); } catch (_) {} },
    warning: () => { try { navigator.vibrate?.([15, 50, 20]); } catch (_) {} },
    error: () => { try { navigator.vibrate?.([20, 30, 20, 30, 25]); } catch (_) {} },
  };

  function triggerHaptic(type = "light") {
    if (type === "medium") Taptic.medium();
    else if (type === "heavy") Taptic.heavy();
    else Taptic.light();
  }

  let audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtx = new AudioCtx();
      }
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  function playIosSound(type = "sent") {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === "sent") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "tapback") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(750, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "refresh") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch (_) {}
  }

  // Cross-browser clipboard copy with fallback
  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(textArea);
    return true;
  }

  // Open iOS 18 Fullscreen Image Lightbox
  function openImageLightbox(src, title = "Image Preview", fallbackSrc = "") {
    if (!imageLightbox || !lightboxImg) return;

    let fullUrl = src;
    if (src && src.startsWith("/")) {
      fullUrl = window.location.origin + src;
    }

    lightboxImg.src = src;
    if (fallbackSrc) {
      lightboxImg.onerror = () => { lightboxImg.src = fallbackSrc; };
    } else {
      lightboxImg.onerror = null;
    }

    if (lightboxTitle) {
      lightboxTitle.textContent = title || "Image Preview";
    }

    if (lightboxSaveBtn) {
      lightboxSaveBtn.href = src;
      lightboxSaveBtn.setAttribute("download", `as_image_${Date.now()}.jpg`);
    }

    if (lightboxTabBtn) {
      lightboxTabBtn.href = src;
    }

    if (lightboxCopyBtn) {
      lightboxCopyBtn.setAttribute("data-url", fullUrl);
      lightboxCopyBtn.innerHTML = "<span>Copy URL</span>";
    }

    imageLightbox.classList.remove("hidden");
    triggerHaptic("light");
  }

  function closeImageLightbox() {
    if (!imageLightbox) return;
    imageLightbox.classList.add("hidden");
    if (lightboxImg) lightboxImg.src = "";
  }

  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeImageLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeImageLightbox);

  if (lightboxCopyBtn) {
    lightboxCopyBtn.addEventListener("click", () => {
      const urlToCopy = lightboxCopyBtn.getAttribute("data-url");
      if (urlToCopy) {
        copyTextToClipboard(urlToCopy).then(() => {
          lightboxCopyBtn.innerHTML = "<span>Copied!</span>";
          triggerHaptic("medium");
          setTimeout(() => {
            if (lightboxCopyBtn) lightboxCopyBtn.innerHTML = "<span>Copy URL</span>";
          }, 2000);
        });
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && imageLightbox && !imageLightbox.classList.contains("hidden")) {
      closeImageLightbox();
    }
  });

    const MODEL_CONFIG = {
    "nvidia/nemotron-3-ultra-550b-a55b": {
      name: "Nemotron 3 Ultra 550B",
      badge: "550B Flagship",
      title: "How can Nemotron 3 Ultra help you today?",
      placeholder: "Message Nemotron 3 Ultra (550B Flagship)...",
      isExclusive: true,
      symClass: "sym-gpt5",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    },
    "nvidia/nemotron-3.5-bolt-e4b": {
      name: "Nemotron 3.5 Bolt",
      badge: "Ultra Fast",
      title: "Nemotron 3.5 Bolt (Lightning Fast)",
      placeholder: "Message Nemotron 3.5 Bolt...",
      isExclusive: false,
      symClass: "sym-17b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    },
    "poolside/laguna-xs-2.1": {
      name: "Laguna XS 2.1",
      badge: "Intelligence",
      title: "Laguna XS 2.1 (Coding & Reasoning)",
      placeholder: "Message Laguna XS 2.1...",
      isExclusive: false,
      symClass: "sym-coder",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    },
    "nvidia/ising-calibration-1.5-31b": {
      name: "Ising Calibration 1.5 31B",
      badge: "Quantum",
      title: "Ising Calibration (Quantum Science)",
      placeholder: "Message Ising Calibration...",
      isExclusive: false,
      symClass: "sym-math",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3.6" y1="9" x2="20.4" y2="9"/><line x1="3.6" y1="15" x2="20.4" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
    },
    "nvidia/riva-translate-4b-instruct-v2": {
      name: "Riva Translate 4B v2",
      badge: "Multilingual",
      title: "Riva Translate (Multilingual Neural Translation)",
      placeholder: "Message Riva Translate...",
      isExclusive: false,
      symClass: "sym-phi",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`,
    },
    "meta/llama-guard-4-12b": {
      name: "Llama Guard 4 12B",
      badge: "Moderation",
      title: "Llama Guard 4 (Safety Classifier)",
      placeholder: "Test content safety or policy check...",
      isExclusive: false,
      symClass: "sym-llama3b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
    "nvidia/llama-3.1-nemotron-safety-guard-8b-v3": {
      name: "Nemotron Safety Guard 8B",
      badge: "Security",
      title: "Nemotron Safety Guard 8B",
      placeholder: "Verify input/output AI safety...",
      isExclusive: false,
      symClass: "sym-smol",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    },
    "image": {
      name: "Image Generator",
      badge: "Image AI",
      title: "What would you like to imagine?",
      placeholder: "Describe an image to generate...",
      isExclusive: false,
      symClass: "sym-image",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>`,
    },
  };

  // ---------------------------------------------------------------------------
  // Claude / DeepSeek Style Bottom Model Switcher & Mobile Bottom Sheet
  // ---------------------------------------------------------------------------
  function updatePopoverPosition() {
    if (!modelPopover) return;
    if (window.innerWidth > 640 && modelPickerBtn) {
      const rect = modelPickerBtn.getBoundingClientRect();
      const bottomDist = window.innerHeight - rect.top + 10;
      const leftDist = Math.max(16, Math.min(rect.left, window.innerWidth - 396));
      modelPopover.style.position = "fixed";
      modelPopover.style.bottom = `${bottomDist}px`;
      modelPopover.style.left = `${leftDist}px`;
      modelPopover.style.right = "auto";
      modelPopover.style.top = "auto";
    } else {
      modelPopover.style.position = "";
      modelPopover.style.bottom = "";
      modelPopover.style.left = "";
      modelPopover.style.right = "";
      modelPopover.style.top = "";
    }
  }

  function togglePopover(forceState) {
    if (!modelModal) return;
    const isClosed = modelModal.classList.contains("hidden");
    const shouldOpen = forceState !== undefined ? forceState : isClosed;

    if (shouldOpen) {
      updatePopoverPosition();
      modelModal.classList.remove("hidden");
      modelPickerBtn?.setAttribute("aria-expanded", "true");
      triggerHaptic("light");
    } else {
      modelModal.classList.add("hidden");
      if (modelPopover) {
        modelPopover.style.transform = "";
      }
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
    if (modelModal && !modelModal.classList.contains("hidden")) {
      if (!modelPopover?.contains(e.target) && !modelPickerBtn?.contains(e.target)) {
        closePopover();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (modelModal && !modelModal.classList.contains("hidden")) {
      updatePopoverPosition();
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
    if (currentModelGlyph) {
      currentModelGlyph.innerHTML = cfg.svg || "";
      currentModelGlyph.className = `model-picker-glyph ${cfg.symClass || ""}`;
    }
    if (currentModelName) currentModelName.textContent = cfg.name;
    if (currentModelBadge) {
      currentModelBadge.textContent = cfg.badge;
      currentModelBadge.classList.toggle("badge-exclusive-s62", Boolean(cfg.isExclusive));
      currentModelBadge.classList.toggle("badge-maiko-yen", Boolean(cfg.isMaiko));
    }

    // Update popover items active state
    popoverItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-model") === model);
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

  // ---------------------------------------------------------------------------
  // Status Check: "Connecting to AS cloud" / "Connected to AS cloud"
  // ---------------------------------------------------------------------------
  async function checkConnection() {
    try {
      const res = await fetch(`/api/health?model=${encodeURIComponent(selectedModel)}&_t=${Date.now()}`);
      const data = await res.json();

      if (data.status === "ok") {
        updateStatus("online", "AS Cloud • NIM Online");
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
  function smoothScrollToBottom(isSmooth = false) {
    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    scrollRafId = requestAnimationFrame(() => {
      if (isSmooth) {
        chatViewport.scrollTo({
          top: chatViewport.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatViewport.scrollTop = chatViewport.scrollHeight;
      }
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
  // Separate Thinking & Reply Parser (Supports both Qwen 3 Max & DeepSeek R1)
  // ---------------------------------------------------------------------------
  function extractQwenThinkingClient(raw) {
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
    if (!isReasoning) return { thinking: "", reply: raw };

    const wrapRegex = /(?:clearly and concisely|explain the steps in the comments|confident the result is correct|put it all together and see|put it all together clearly|provide a straightforward answer|provide (?:a )?friendly,?\s*(?:and )?helpful answer|respond helpfully[a-z0-9 ,-]*|answer directly|under \d+ tokens|that should cover it|that should be \w+ words|that makes sense|that works|should be sufficient|time to put it all together|let me put it all together|ready to write|looks correct|seems to work|all cases correctly|the result is correct|the answer is correct|that's the answer|that is the answer|should handle all cases|(?:I'll|I will|Let's|let me) (?:present|write|provide|give|output|go with) (?:that|this|the answer|the code|it|the solution)[a-z0-9 -]*|stick to the (?:basic|standard) version|no mistakes(?: here)?|all methods (?:lead to|give|match)[a-z0-9 -]*|still the same answer)[.!?](?:\s*|\n*)/gi;

    let bestSplitIdx = -1;
    let m;
    while ((m = wrapRegex.exec(trimmed)) !== null) {
      const candidateIdx = m.index + m[0].length;
      const remaining = trimmed.substring(candidateIdx).trim();
      if (remaining.length > 0) bestSplitIdx = candidateIdx;
    }

    if (bestSplitIdx !== -1) {
      return {
        thinking: trimmed.substring(0, bestSplitIdx).trim(),
        reply: trimmed.substring(bestSplitIdx).trim(),
      };
    }

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

    const mdMatch = trimmed.search(/\n\s*(?:#{1,6}\s|\d+\.\s|\*\*|```)/);
    if (mdMatch > 50) {
      return {
        thinking: trimmed.substring(0, mdMatch).trim(),
        reply: trimmed.substring(mdMatch).trim(),
      };
    }

    return { thinking: "", reply: raw };
  }

  function parseThinkingAndReply(raw, model = selectedModel) {
    if (!raw) return { thinking: null, reply: "", isThinkingDone: true };

    const isFlash = (model || "").toLowerCase().includes("deepseek-v4-flash") || (model || "").toLowerCase().includes("v4-flash");
    const isR1 = !isFlash && ((model || "").toLowerCase().includes("r1") || (model || "").toLowerCase().includes("deepseek"));
    const isQwenMax = (model || "").toLowerCase().includes("qwen3-max") || (model || "").toLowerCase().includes("qwen-max");
    const isReasoningModel = isQwenMax || isFlash;
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

      // If Qwen 3 Max or DeepSeek V4 Flash was passed raw unformatted text (fallback)
      if (isReasoningModel) {
        const qExt = extractQwenThinkingClient(raw);
        if (qExt.thinking) {
          return { thinking: qExt.thinking, reply: qExt.reply, isThinkingDone: true };
        }
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

  // ---------------------------------------------------------------------------
  // Document & Response Export Suite (Word DOC, PDF, Markdown, Text, Image Formats)
  // ---------------------------------------------------------------------------
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function slugifyFilename(title, ext) {
    const safe = (title || "response")
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "_")
      .slice(0, 32);
    return `${safe || "response"}_${Date.now()}.${ext}`;
  }

  function exportTextDocument(format, rawText, htmlContent, docTitle = "AS Cloud Response") {
    triggerHaptic("light");

    if (format === "copy") {
      copyTextToClipboard(rawText).then(() => {
        triggerHaptic("medium");
      });
      return;
    }

    if (format === "txt") {
      const header = `${docTitle}\nExported from AS Cloud Intelligence • ${new Date().toLocaleString()}\n${"-".repeat(60)}\n\n`;
      const blob = new Blob([header + rawText], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, slugifyFilename(docTitle, "txt"));
      return;
    }

    if (format === "md") {
      const header = `# ${docTitle}\n\n*Exported from AS Cloud Intelligence • ${new Date().toLocaleString()}*\n\n---\n\n`;
      const blob = new Blob([header + rawText], { type: "text/markdown;charset=utf-8" });
      downloadBlob(blob, slugifyFilename(docTitle, "md"));
      return;
    }

    if (format === "doc") {
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${escapeHtml(docTitle)}</title>
          <style>
            body { font-family: -apple-system, 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11.5pt; line-height: 1.6; color: #1e293b; margin: 36pt; }
            h1, h2, h3 { color: #0f172a; margin-top: 18pt; margin-bottom: 6pt; }
            p { margin: 0 0 10pt 0; }
            code { font-family: Consolas, 'Courier New', monospace; background-color: #f1f5f9; padding: 2pt 4pt; font-size: 10pt; border-radius: 3pt; }
            pre { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10pt; font-family: Consolas, monospace; font-size: 9.5pt; border-radius: 4pt; overflow-x: auto; }
            blockquote { border-left: 3pt solid #6366f1; margin: 10pt 0; padding-left: 10pt; color: #475569; }
            hr { border: 0; border-top: 1px solid #e2e8f0; margin: 16pt 0; }
            .doc-header { border-bottom: 2pt solid #6366f1; padding-bottom: 8pt; margin-bottom: 16pt; }
            .doc-title { font-size: 16pt; font-weight: bold; color: #4338ca; }
            .doc-meta { font-size: 9pt; color: #64748b; margin-top: 4pt; }
          </style>
        </head>
        <body>
          <div class="doc-header">
            <div class="doc-title">${escapeHtml(docTitle)}</div>
            <div class="doc-meta">AS Cloud Intelligence &bull; Exported on ${new Date().toLocaleString()}</div>
          </div>
          <div class="doc-content">
            ${htmlContent || rawText.replace(/\n/g, "<br>")}
          </div>
        </body>
        </html>
      `;
      const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
      downloadBlob(blob, slugifyFilename(docTitle, "doc"));
      return;
    }

    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please enable popups to export as PDF.");
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeHtml(docTitle)} - AS Cloud</title>
          <style>
            @page { size: A4; margin: 18mm 16mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.65; color: #0f172a; margin: 0; padding: 10px; }
            .pdf-header { border-bottom: 2px solid #6366f1; padding-bottom: 8px; margin-bottom: 18px; }
            .pdf-title { font-size: 20px; font-weight: 700; color: #312e81; margin: 0 0 4px 0; }
            .pdf-meta { font-size: 11px; color: #64748b; }
            p { margin: 0 0 10px 0; }
            pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-family: Consolas, monospace; font-size: 11.5px; page-break-inside: avoid; }
            code { background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 12px; }
            blockquote { border-left: 3px solid #6366f1; margin: 10px 0; padding-left: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="pdf-header">
            <div class="pdf-title">${escapeHtml(docTitle)}</div>
            <div class="pdf-meta">Generated by AS Cloud Intelligence &bull; ${new Date().toLocaleString()}</div>
          </div>
          <div class="pdf-body">
            ${htmlContent || rawText.replace(/\n/g, "<br>")}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  async function exportImageDocument(format, imgSource, docTitle = "as_cloud_image") {
    triggerHaptic("light");
    const cleanName = slugifyFilename(docTitle, format).replace(`.${format}`, "");

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgSource;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      if (format === "jpg" || format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      if (format === "pdf") {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Please enable popups to export as PDF.");
          return;
        }
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${escapeHtml(docTitle)} - AS Cloud</title>
            <style>
              @page { size: auto; margin: 15mm; }
              body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, sans-serif; }
              .meta { font-size: 12px; color: #64748b; margin-bottom: 12px; }
              img { max-width: 100%; max-height: 85vh; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="meta">${escapeHtml(docTitle)} &bull; AS Cloud &bull; ${new Date().toLocaleString()}</div>
            <img src="${dataUrl}" onload="setTimeout(() => window.print(), 250);" />
          </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }

      const mime = format === "webp" ? "image/webp" : (format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png");
      const ext = format === "webp" ? "webp" : (format === "jpg" || format === "jpeg" ? "jpg" : "png");

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${cleanName}.${ext}`);
        } else {
          const a = document.createElement("a");
          a.href = canvas.toDataURL(mime, 0.95);
          a.download = `${cleanName}.${ext}`;
          a.click();
        }
      }, mime, 0.95);
    } catch (err) {
      const a = document.createElement("a");
      a.href = imgSource;
      a.download = `${cleanName}.${format}`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function createSaveMenuHtml(type = "text") {
    if (type === "image") {
      return `
        <div class="ios-save-dropdown-wrapper">
          <button type="button" class="ios-bubble-save-btn" title="Save Image with Format Options">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Save</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="ios-save-dropdown-menu">
            <div class="save-menu-label">SAVE IMAGE AS</div>
            <button type="button" class="save-menu-item" data-action="png">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>PNG Image</span>
              <span class="ext-pill">.png</span>
            </button>
            <button type="button" class="save-menu-item" data-action="jpg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
              <span>JPEG Image</span>
              <span class="ext-pill">.jpg</span>
            </button>
            <button type="button" class="save-menu-item" data-action="webp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>WebP Image</span>
              <span class="ext-pill">.webp</span>
            </button>
            <button type="button" class="save-menu-item" data-action="pdf">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>PDF Document</span>
              <span class="ext-pill">.pdf</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="ios-save-dropdown-wrapper">
        <button type="button" class="ios-bubble-save-btn" title="Save / Export Response">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Save</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="ios-save-dropdown-menu">
          <div class="save-menu-label">EXPORT FORMAT</div>
          <button type="button" class="save-menu-item" data-action="doc">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Word Document</span>
            <span class="ext-pill">.doc</span>
          </button>
          <button type="button" class="save-menu-item" data-action="pdf">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>PDF Document</span>
            <span class="ext-pill">.pdf</span>
          </button>
          <button type="button" class="save-menu-item" data-action="md">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="7 15 7 9 10 12 13 9 13 15"/><polyline points="18 12 18 15 16 15"/></svg>
            <span>Markdown</span>
            <span class="ext-pill">.md</span>
          </button>
          <button type="button" class="save-menu-item" data-action="txt">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
            <span>Plain Text</span>
            <span class="ext-pill">.txt</span>
          </button>
          <div class="save-menu-divider"></div>
          <button type="button" class="save-menu-item" data-action="copy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy Text</span>
          </button>
        </div>
      </div>
    `;
  }

  function positionSaveMenu(trigger, menu) {
    menu.style.left = "";
    menu.style.right = "";
    menu.style.top = "";
    menu.style.bottom = "";

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = 185;
    const padding = 12;

    const isEditBar = Boolean(trigger.closest(".edit-actions-bar"));
    const spaceToLeft = triggerRect.right;

    // Anchor to left if inside edit-actions-bar or if left space is tight
    if (isEditBar || spaceToLeft < menuWidth + padding) {
      menu.style.left = "0";
      menu.style.right = "auto";
    } else {
      menu.style.right = "0";
      menu.style.left = "auto";
    }

    // Vertical positioning: open downwards if too close to viewport top
    if (triggerRect.top < 210) {
      menu.style.bottom = "auto";
      menu.style.top = "calc(100% + 6px)";
    } else {
      menu.style.bottom = "calc(100% + 6px)";
      menu.style.top = "auto";
    }
  }

  function bindSaveMenu(wrapper, onAction) {
    if (!wrapper) return;
    const trigger = wrapper.querySelector(".ios-bubble-save-btn");
    const menu = wrapper.querySelector(".ios-save-dropdown-menu");
    if (!trigger || !menu) return;

    trigger.onclick = (e) => {
      e.stopPropagation();
      const wasOpen = menu.classList.contains("open");
      document.querySelectorAll(".ios-save-dropdown-menu.open").forEach((m) => m.classList.remove("open"));
      document.querySelectorAll(".ios-save-dropdown-wrapper.open").forEach((w) => w.classList.remove("open"));

      if (!wasOpen) {
        positionSaveMenu(trigger, menu);
        wrapper.classList.add("open");
        menu.classList.add("open");
        triggerHaptic("light");
      }
    };

    menu.querySelectorAll(".save-menu-item").forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        wrapper.classList.remove("open");
        const action = item.getAttribute("data-action");
        if (action) onAction(action, item);
      };
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ios-save-dropdown-wrapper")) {
      document.querySelectorAll(".ios-save-dropdown-menu.open").forEach((m) => m.classList.remove("open"));
      document.querySelectorAll(".ios-save-dropdown-wrapper.open").forEach((w) => w.classList.remove("open"));
    }
  });

  function renderTypingIndicator(bubbleElement) {
    bubbleElement.innerHTML = `
      <div class="ios-typing-indicator" aria-label="Thinking">
        <div class="ios-typing-dots">
          <span class="ios-typing-dot"></span>
          <span class="ios-typing-dot"></span>
          <span class="ios-typing-dot"></span>
        </div>
        <span class="ios-typing-label">Thinking...</span>
      </div>
    `;
  }

  function renderAssistantBubble(bubbleElement, rawContent, isLive = false, model = selectedModel) {
    if (!rawContent || !rawContent.trim()) {
      if (isLive) {
        renderTypingIndicator(bubbleElement);
      } else {
        bubbleElement.innerHTML = `<div class="ios-reply-body"></div>`;
      }
      return;
    }

    const { thinking, reply, isThinkingDone } = parseThinkingAndReply(rawContent, model);

    let html = "";

    if (thinking !== null && thinking.length > 0) {
      const isOpen = isLive && !isThinkingDone;
      const labelText = !isThinkingDone ? "Thinking..." : "Thought Process";

      html += `
        <div class="ios-thought-container ${isOpen ? "open" : ""}" id="thoughtBox">
          <button class="thought-toggle-btn" type="button">
            <span class="thought-pulse-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5l1.5-1.5M4 20l1.5-1.5m0-13L4 4m16 16l-1.5-1.5"/></svg></span>
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

    if (!isLive && reply && reply.trim()) {
      html += `<div class="ios-bubble-actions">${createSaveMenuHtml("text")}</div>`;
    }

    bubbleElement.innerHTML = html;

    if (!isLive && reply && reply.trim()) {
      const saveWrap = bubbleElement.querySelector(".ios-save-dropdown-wrapper");
      bindSaveMenu(saveWrap, (action, item) => {
        const title = MODEL_CONFIG[model]?.name || "AS Cloud Response";
        if (action === "copy") {
          copyTextToClipboard(reply).then(() => {
            triggerHaptic("medium");
            const orig = item.innerHTML;
            item.innerHTML = '<span style="display:inline-flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><span>Copied!</span>';
            setTimeout(() => { item.innerHTML = orig; }, 1800);
          });
        } else {
          exportTextDocument(action, reply, renderedReply, title);
        }
      });
    }

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

    if (!isLive) {
      attachCodeCopy(bubbleElement);
      if (typeof hljs !== "undefined") {
        bubbleElement.querySelectorAll("pre code").forEach(hljs.highlightElement);
      }
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
      if (!content) {
        renderTypingIndicator(bubble);
      } else {
        renderAssistantBubble(bubble, content, false, selectedModel);
      }
    }

    row.appendChild(bubble);
    messagesFlow.appendChild(row);

    attachIosMessageGestures(row, bubble);

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
            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" class="image-download-btn edit-generated-btn" style="background: rgba(255, 255, 255, 0.15); color: #ffffff;" title="Edit or Remove Background">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Edit / Remove BG</span>
              </button>
              ${createSaveMenuHtml("image")}
            </div>
          </div>
        </div>
      `;

      const saveWrap = assistantBubble.querySelector(".ios-save-dropdown-wrapper");
      bindSaveMenu(saveWrap, (action) => {
        exportImageDocument(action, dataUrl, prompt || "generated_image");
      });

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

      const genImg = assistantBubble.querySelector(".generated-image");
      if (genImg) {
        genImg.addEventListener("click", () => {
          openImageLightbox(dataUrl, `Generated: "${prompt}"`);
        });
      }

      conversation.push({ role: "assistant", content: `[Generated Image: "${prompt}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Image generation canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${escapeHtml(err.message)}</div>`;
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
  const INSTA_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/(?:reel|reels|p|stories|tv)\/([a-zA-Z0-9_-]+)|instagr\.am\/(?:p|reel)\/([a-zA-Z0-9_-]+))/i;

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
  // iOS 18 Custom Media Player Controller (Audio & Video, Scrubber, Speed, Zero Emojis)
  // ---------------------------------------------------------------------------
  function formatMediaTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function bindCustomMediaPlayer(card) {
    if (!card) return;
    const media = card.querySelector(".ios-media-element");
    if (!media) return;

    const playPauseBtn = card.querySelector(".ios-btn-play-pause");
    const centerPlayBtn = card.querySelector(".ios-video-center-btn");
    const rewindBtn = card.querySelector(".ios-btn-rewind");
    const forwardBtn = card.querySelector(".ios-btn-forward");
    const speedBtn = card.querySelector(".ios-btn-speed");
    const speedMenu = card.querySelector(".ios-speed-menu");
    const volumeBtn = card.querySelector(".ios-btn-volume");
    const volumeSlider = card.querySelector(".ios-volume-slider");
    const fullscreenBtn = card.querySelector(".ios-btn-fullscreen");
    const scrubberTrack = card.querySelector(".ios-scrubber-track");
    const scrubberFill = card.querySelector(".ios-scrubber-fill");
    const scrubberThumb = card.querySelector(".ios-scrubber-thumb");
    const scrubberBuffered = card.querySelector(".ios-scrubber-buffered");
    const curTimeEl = card.querySelector(".ios-time-cur");
    const durTimeEl = card.querySelector(".ios-time-dur");
    const videoWrap = card.querySelector(".yt-card-video-wrap");

    let isDragging = false;
    let hideControlsTimeout = null;

    function updatePlayState(isPlaying) {
      if (isPlaying) {
        card.classList.add("playing");
        if (videoWrap) videoWrap.classList.add("playing");
        if (playPauseBtn) {
          const playIcon = playPauseBtn.querySelector(".icon-play");
          const pauseIcon = playPauseBtn.querySelector(".icon-pause");
          if (playIcon) playIcon.style.display = "none";
          if (pauseIcon) pauseIcon.style.display = "block";
          playPauseBtn.title = "Pause";
        }
        if (centerPlayBtn) {
          const cPlay = centerPlayBtn.querySelector(".center-icon-play");
          const cPause = centerPlayBtn.querySelector(".center-icon-pause");
          if (cPlay) cPlay.style.display = "none";
          if (cPause) cPause.style.display = "block";
        }
        resetHideTimer();
      } else {
        card.classList.remove("playing");
        if (videoWrap) videoWrap.classList.remove("playing");
        if (playPauseBtn) {
          const playIcon = playPauseBtn.querySelector(".icon-play");
          const pauseIcon = playPauseBtn.querySelector(".icon-pause");
          if (playIcon) playIcon.style.display = "block";
          if (pauseIcon) pauseIcon.style.display = "none";
          playPauseBtn.title = "Play";
        }
        if (centerPlayBtn) {
          const cPlay = centerPlayBtn.querySelector(".center-icon-play");
          const cPause = centerPlayBtn.querySelector(".center-icon-pause");
          if (cPlay) cPlay.style.display = "block";
          if (cPause) cPause.style.display = "none";
        }
        showControls();
      }
    }

    // Single active media playback: pause any other playing media in chat
    media.addEventListener("play", () => {
      document.querySelectorAll(".ios-media-element").forEach((other) => {
        if (other !== media && !other.paused) {
          other.pause();
        }
      });
      updatePlayState(true);
      triggerHaptic("light");
    });

    media.addEventListener("pause", () => {
      updatePlayState(false);
      triggerHaptic("light");
    });

    media.addEventListener("ended", () => {
      updatePlayState(false);
      if (scrubberFill) scrubberFill.style.width = "0%";
      if (scrubberThumb) scrubberThumb.style.left = "0%";
      if (curTimeEl) curTimeEl.textContent = "0:00";
    });

    // Time & Scrubber updates
    media.addEventListener("timeupdate", () => {
      if (isDragging) return;
      const cur = media.currentTime || 0;
      const dur = media.duration || 0;
      if (curTimeEl) curTimeEl.textContent = formatMediaTime(cur);
      if (dur && durTimeEl && (durTimeEl.textContent === "0:00" || !durTimeEl.textContent.trim())) {
        durTimeEl.textContent = formatMediaTime(dur);
      }
      if (dur > 0) {
        const pct = (cur / dur) * 100;
        if (scrubberFill) scrubberFill.style.width = `${pct}%`;
        if (scrubberThumb) scrubberThumb.style.left = `${pct}%`;
      }
    });

    // Buffered range update
    media.addEventListener("progress", () => {
      if (!media.duration || media.buffered.length === 0) return;
      try {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1);
        const pct = (bufferedEnd / media.duration) * 100;
        if (scrubberBuffered) scrubberBuffered.style.width = `${Math.min(100, pct)}%`;
      } catch (e) {}
    });

    media.addEventListener("loadedmetadata", () => {
      if (media.duration && durTimeEl) {
        durTimeEl.textContent = formatMediaTime(media.duration);
      }
    });

    function togglePlay() {
      if (media.paused || media.ended) {
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    }

    if (playPauseBtn) playPauseBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
    if (centerPlayBtn) centerPlayBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });

    // Video click to toggle play / auto-hiding controls
    function resetHideTimer() {
      if (videoWrap && !media.paused) {
        clearTimeout(hideControlsTimeout);
        videoWrap.classList.remove("controls-hidden");
        hideControlsTimeout = setTimeout(() => {
          if (!media.paused && !card.querySelector(".ios-speed-menu.open")) {
            videoWrap.classList.add("controls-hidden");
          }
        }, 2600);
      }
    }

    function showControls() {
      if (videoWrap) {
        clearTimeout(hideControlsTimeout);
        videoWrap.classList.remove("controls-hidden");
      }
    }

    if (videoWrap) {
      videoWrap.addEventListener("click", (e) => {
        if (e.target.closest(".ios-video-controls-overlay") || e.target.closest(".ios-video-center-btn")) return;
        togglePlay();
      });
      videoWrap.addEventListener("mousemove", resetHideTimer);
      videoWrap.addEventListener("touchstart", resetHideTimer, { passive: true });
    }

    // Rewind 10s & Forward 10s
    if (rewindBtn) {
      rewindBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        media.currentTime = Math.max(0, (media.currentTime || 0) - 10);
        triggerHaptic("light");
      });
    }
    if (forwardBtn) {
      forwardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        media.currentTime = Math.min(media.duration || 0, (media.currentTime || 0) + 10);
        triggerHaptic("light");
      });
    }

    // Scrubber Dragging / Seeking (Mouse + Touch)
    if (scrubberTrack) {
      function seekAtPosition(clientX) {
        const rect = scrubberTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        if (scrubberFill) scrubberFill.style.width = `${ratio * 100}%`;
        if (scrubberThumb) scrubberThumb.style.left = `${ratio * 100}%`;
        if (media.duration && curTimeEl) {
          curTimeEl.textContent = formatMediaTime(ratio * media.duration);
        }
        return ratio;
      }

      function onScrubStart(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        scrubberTrack.classList.add("dragging");
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        seekAtPosition(clientX);

        function onScrubMove(moveEvent) {
          const x = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
          seekAtPosition(x);
        }

        function onScrubEnd(endEvent) {
          isDragging = false;
          scrubberTrack.classList.remove("dragging");
          const x = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
          const ratio = seekAtPosition(x);
          if (media.duration) {
            media.currentTime = ratio * media.duration;
          }
          triggerHaptic("light");
          document.removeEventListener("mousemove", onScrubMove);
          document.removeEventListener("mouseup", onScrubEnd);
          document.removeEventListener("touchmove", onScrubMove);
          document.removeEventListener("touchend", onScrubEnd);
        }

        document.addEventListener("mousemove", onScrubMove);
        document.addEventListener("mouseup", onScrubEnd);
        document.addEventListener("touchmove", onScrubMove, { passive: false });
        document.addEventListener("touchend", onScrubEnd);
      }

      scrubberTrack.addEventListener("mousedown", onScrubStart);
      scrubberTrack.addEventListener("touchstart", onScrubStart, { passive: false });
    }

    // Speed Controller
    if (speedBtn && speedMenu) {
      speedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = speedMenu.classList.contains("open");
        document.querySelectorAll(".ios-speed-menu.open").forEach((m) => m.classList.remove("open"));
        if (!wasOpen) {
          speedMenu.classList.add("open");
          triggerHaptic("light");
        }
      });

      speedMenu.querySelectorAll(".speed-option").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          const rate = parseFloat(opt.dataset.speed);
          media.playbackRate = rate;
          const valEl = speedBtn.querySelector(".speed-val");
          if (valEl) valEl.textContent = `${rate}x`;
          speedMenu.querySelectorAll(".speed-option").forEach((o) => o.classList.remove("active"));
          opt.classList.add("active");
          speedMenu.classList.remove("open");
          triggerHaptic("medium");
        });
      });
    }

    // Volume Controller
    if (volumeBtn && volumeSlider) {
      volumeSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        media.volume = val;
        media.muted = (val === 0);
        updateVolumeIcon(media.muted ? 0 : val);
      });

      volumeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (media.muted || media.volume === 0) {
          media.muted = false;
          media.volume = 1;
          volumeSlider.value = 1;
          updateVolumeIcon(1);
        } else {
          media.muted = true;
          volumeSlider.value = 0;
          updateVolumeIcon(0);
        }
        triggerHaptic("light");
      });

      function updateVolumeIcon(vol) {
        const highIcon = volumeBtn.querySelector(".icon-vol-high");
        const muteIcon = volumeBtn.querySelector(".icon-vol-mute");
        if (vol === 0) {
          if (highIcon) highIcon.style.display = "none";
          if (muteIcon) muteIcon.style.display = "block";
        } else {
          if (highIcon) highIcon.style.display = "block";
          if (muteIcon) muteIcon.style.display = "none";
        }
      }
    }

    // Fullscreen Controller (Video)
    if (fullscreenBtn && videoWrap) {
      fullscreenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerHaptic("medium");
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (videoWrap.requestFullscreen) {
          videoWrap.requestFullscreen().catch(() => {});
        } else if (media.webkitEnterFullscreen) {
          media.webkitEnterFullscreen();
        }
      });

      document.addEventListener("fullscreenchange", () => {
        const isFs = Boolean(document.fullscreenElement);
        const enterIcon = fullscreenBtn.querySelector(".icon-fs-enter");
        const exitIcon = fullscreenBtn.querySelector(".icon-fs-exit");
        if (isFs) {
          if (enterIcon) enterIcon.style.display = "none";
          if (exitIcon) exitIcon.style.display = "block";
        } else {
          if (enterIcon) enterIcon.style.display = "block";
          if (exitIcon) exitIcon.style.display = "none";
        }
      });
    }
  }

  // Global dismissal for open speed menus
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ios-speed-wrapper")) {
      document.querySelectorAll(".ios-speed-menu.open").forEach((m) => m.classList.remove("open"));
    }
  });

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
        <div class="ios-media-card ios-music-card">
          <div class="music-card-header">
            <div class="music-cover-wrap">
              <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" class="music-cover-art" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'" />
            </div>
            <div class="music-info">
              <div class="music-badge">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span>AS Music</span>
              </div>
              <div class="music-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
              <div class="music-meta">
                ${duration ? `<span><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${escapeHtml(duration)}</span>` : ""}
                ${viewsFormatted ? `<span>• <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${viewsFormatted}</span>` : ""}
                ${published ? `<span>• <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${escapeHtml(published)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="music-player-section">
            <audio preload="metadata" class="ios-media-element" src="${escapeHtml(streamUrl)}"></audio>

            <div class="ios-player-widget">
              <div class="ios-scrubber-container">
                <div class="ios-scrubber-track">
                  <div class="ios-scrubber-buffered"></div>
                  <div class="ios-scrubber-fill"></div>
                  <div class="ios-scrubber-thumb"></div>
                </div>
                <div class="ios-time-row">
                  <span class="ios-time-cur">0:00</span>
                  <span class="ios-time-dur">${duration || "0:00"}</span>
                </div>
              </div>

              <div class="ios-controls-bar">
                <div class="ios-ctrl-group ios-ctrl-left">
                  <button class="ios-player-btn ios-btn-rewind" type="button" title="Rewind 10s">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <polyline points="3 3 3 8 8 8"/>
                      <text x="12" y="15" text-anchor="middle" font-size="7.5" font-family="system-ui, -apple-system" font-weight="700" stroke="none" fill="currentColor">10</text>
                    </svg>
                  </button>

                  <button class="ios-player-btn ios-btn-play-pause" type="button" title="Play">
                    <svg class="icon-play" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    <svg class="icon-pause" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                  </button>

                  <button class="ios-player-btn ios-btn-forward" type="button" title="Forward 10s">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <polyline points="21 3 21 8 16 8"/>
                      <text x="12" y="15" text-anchor="middle" font-size="7.5" font-family="system-ui, -apple-system" font-weight="700" stroke="none" fill="currentColor">10</text>
                    </svg>
                  </button>

                  <div class="ios-audio-eq" title="Audio Activity">
                    <span class="eq-bar bar-1"></span>
                    <span class="eq-bar bar-2"></span>
                    <span class="eq-bar bar-3"></span>
                    <span class="eq-bar bar-4"></span>
                  </div>
                </div>

                <div class="ios-ctrl-group ios-ctrl-right">
                  <div class="ios-speed-wrapper">
                    <button class="ios-player-btn ios-btn-speed" type="button" title="Playback Speed">
                      <span class="speed-val">1x</span>
                    </button>
                    <div class="ios-speed-menu">
                      <button type="button" class="speed-option" data-speed="0.5">0.5x</button>
                      <button type="button" class="speed-option" data-speed="0.75">0.75x</button>
                      <button type="button" class="speed-option active" data-speed="1">1x</button>
                      <button type="button" class="speed-option" data-speed="1.25">1.25x</button>
                      <button type="button" class="speed-option" data-speed="1.5">1.5x</button>
                      <button type="button" class="speed-option" data-speed="2">2x</button>
                    </div>
                  </div>

                  <div class="ios-volume-wrapper">
                    <button class="ios-player-btn ios-btn-volume" type="button" title="Mute/Unmute">
                      <svg class="icon-vol-high" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      </svg>
                      <svg class="icon-vol-mute" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    </button>
                    <div class="ios-volume-slider-bar">
                      <input type="range" class="ios-volume-slider" min="0" max="1" step="0.05" value="1" title="Volume" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

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

      bindCustomMediaPlayer(assistantBubble.querySelector(".ios-media-card"));

      conversation.push({ role: "assistant", content: `[Playing Track: "${title}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Music request canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${escapeHtml(err.message)}</div>`;
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
  // ---------------------------------------------------------------------------
  // Instagram Link Detector & Downloader (Direct Client Relay)
  // ---------------------------------------------------------------------------
  async function handleInstagramMedia(rawText) {
    appendMessage("user", rawText);

    const match = rawText.match(/https?:\/\/[^\s]+/i);
    const cleanUrl = match ? match[0] : rawText.trim();

    let mediaType = "Instagram Post";
    if (/\/(?:reel|reels)\//i.test(cleanUrl)) mediaType = "Instagram Reel";
    else if (/\/stories\//i.test(cleanUrl)) mediaType = "Instagram Story";
    else if (/\/(?:audio|reels\/audio)\//i.test(cleanUrl)) mediaType = "Instagram Audio";

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-media-loading">
        <div class="image-shimmer"></div>
        <div class="image-loading-content">
          <span class="ios-spinner"></span>
          <span>Analyzing ${escapeHtml(mediaType)} & resolving streams...</span>
        </div>
      </div>
    `;

    setGenerating(true);
    abortController = new AbortController();

    try {
      let data = null;
      try {
        const ENC_KEY = "qwertyuioplkjhgf";
        const ENC_IV = new Uint8Array(16);
        const encoded = new TextEncoder().encode(cleanUrl);
        const padLen = 16 - (encoded.length % 16);
        const padded = new Uint8Array(encoded.length + padLen);
        padded.set(encoded);
        padded.fill(padLen, encoded.length);

        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(ENC_KEY),
          "AES-CBC",
          false,
          ["encrypt"]
        );
        const chunks = [];
        for (let i = 0; i < padded.length; i += 16) {
          chunks.push(crypto.subtle.encrypt({ name: "AES-CBC", iv: ENC_IV }, cryptoKey, padded.subarray(i, i + 16)));
        }
        const results = await Promise.all(chunks);
        let hex = "";
        for (const res of results) {
          for (const byte of new Uint8Array(res, 0, 16)) {
            hex += byte.toString(16).padStart(2, "0");
          }
        }

        const resp = await fetch("https://api.getrequest.dev/allinone", {
          method: "GET",
          headers: { url: hex },
          signal: abortController.signal
        });
        if (resp.ok) data = await resp.json();
      } catch (e) {
        console.warn("Direct insta resolver fallback:", e);
      }

      const cdnPrefix = "https://cdn.turbosave.app/?url=";
      const mp3Url = "https://mp3.turbosave.app/api?url=" + encodeURIComponent(cleanUrl);
      const studioUrl = "/insta?url=" + encodeURIComponent(cleanUrl);

      let videoUrl = "";
      let thumbUrl = "";
      let photoUrls = [];

      if (data && data.video && data.video.length > 0) {
        const first = data.video[0];
        videoUrl = first.video || "";
        thumbUrl = first.thumbnail ? (cdnPrefix + encodeURIComponent(first.thumbnail)) : "";
      }
      if (data && data.image && data.image.length > 0) {
        photoUrls = data.image.map(img => cdnPrefix + encodeURIComponent(img));
      }

      const dlServer1 = videoUrl ? (cdnPrefix + encodeURIComponent(videoUrl)) : (cdnPrefix + encodeURIComponent(cleanUrl));
      const dlServer2 = videoUrl || cleanUrl;

      assistantBubble.innerHTML = `
        <div class="ios-media-card ios-video-card">
          <div class="media-ai-badge insta">⚡ AS Intelligence Core • ${escapeHtml(mediaType)}</div>
          <div style="font-size: 13.5px; font-weight: 600; color: #ffffff; margin-bottom: 6px;">
            Direct Media Extracted Successfully
          </div>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.45;">
            I have analyzed your ${escapeHtml(mediaType)} link and extracted the highest available bitrate video stream and isolated MP3 audio track:
          </p>

          ${videoUrl ? `
            <div class="yt-card-video-wrap" style="aspect-ratio: 9/16; max-height: 380px;">
              <video playsinline controls preload="metadata" poster="${escapeHtml(thumbUrl)}" class="yt-card-video" src="${escapeHtml(dlServer1)}"></video>
            </div>
          ` : (photoUrls.length > 0 ? `
            <div class="yt-card-video-wrap" style="aspect-ratio: 1/1; max-height: 340px;">
              <img src="${escapeHtml(photoUrls[0])}" alt="Instagram Post" class="yt-card-video" style="object-fit: cover;" />
            </div>
          ` : "")}

          <div class="yt-card-body" style="padding-top: 10px;">
            <div class="yt-downloads-header" style="margin-bottom: 8px;">Download Options</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="${escapeHtml(dlServer1)}" target="_blank" rel="noopener noreferrer" class="insta-dl-chip" style="justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>📥 Download HD Video (Server 1)</span>
              </a>
              <a href="${escapeHtml(dlServer2)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" class="yt-dl-chip" style="justify-content: center; padding: 7px 12px;">
                <span>⚡ Direct Stream (Server 2)</span>
              </a>
              <a href="${escapeHtml(mp3Url)}" target="_blank" rel="noopener noreferrer" class="yt-dl-chip featured" style="justify-content: center; padding: 7px 12px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span>🎵 Download MP3 Audio Track</span>
              </a>
              <a href="${escapeHtml(studioUrl)}" class="media-btn-secondary" style="justify-content: center; margin-top: 4px;">
                <span>↗ Open in Media Downloader Studio</span>
              </a>
            </div>
          </div>
        </div>
      `;

      conversation.push({ role: "assistant", content: `[Instagram ${mediaType}: Extracted]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Instagram processing canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;">Failed to resolve Instagram media: ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  async function handleYouTubeMedia(ytUrl, originalText) {
    appendMessage("user", originalText);

    const isShort = /\/shorts\//i.test(ytUrl);
    const mediaType = isShort ? "YouTube Short" : "YouTube Video";

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.innerHTML = `
      <div class="ios-media-card ios-video-card">
        <div class="media-ai-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
          ⚡ AS Intelligence Core • Maintenance Notice
        </div>
        <div style="font-size: 14.5px; font-weight: 700; color: #ffffff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          YouTube Service Temporarily Unavailable
        </div>
        <p style="font-size: 12.8px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.5;">
          YouTube stream resolution for <strong>${escapeHtml(mediaType)}</strong> is currently <strong>Under Maintenance</strong>. Our engineering team is upgrading the direct high-speed stream nodes to ensure stable 4K, 1080p, and MP3 processing.
        </p>

        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 600; color: #fbbf24; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#f59e0b; animation: pulse 1.5s infinite;"></span>
            Status: Maintenance in Progress
          </div>
          <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.4;">
            YouTube links are temporarily paused. In the meantime, Instagram Reels/Posts/Stories and Audio Studio are running normally.
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="/insta" class="media-btn-primary" style="flex: 1; justify-content: center; text-decoration: none;">
            <span>📸 Use Instagram Downloader</span>
          </a>
          <a href="/music" class="media-btn-secondary" style="flex: 1; justify-content: center; text-decoration: none;">
            <span>🎵 Audio Studio</span>
          </a>
        </div>
      </div>
    `;

    conversation.push({ role: "assistant", content: `[YouTube Studio is temporarily under maintenance. Service paused.]` });
    smoothScrollToBottom();
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
            <div class="edit-col original-col" title="Click to view full original image">
              <span class="edit-col-badge">Original</span>
              <img src="${escapeHtml(originalProxyUrl)}" alt="Original Image" onerror="this.src='${escapeHtml(originalStorageUrl)}'" />
            </div>
            <div class="edit-col edited-col" title="Click to view full edited image">
              <span class="edit-col-badge" style="background: rgba(48, 209, 88, 0.75);">Edited</span>
              <img src="${escapeHtml(resultProxyUrl)}" alt="Edited Image" onerror="this.src='${escapeHtml(resultStorageUrl)}'" />
            </div>
          </div>

          <div class="edit-card-body">
            <div class="edit-prompt-text"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>"${escapeHtml(finalPrompt)}"</div>
            <div class="edit-actions-bar">
              ${createSaveMenuHtml("image")}

              <button type="button" class="media-btn-secondary copy-proxy-btn" data-url="${escapeHtml(resultProxyUrl)}" title="Copy Image Link">
                <span>Copy URL</span>
              </button>

              <button type="button" class="media-btn-secondary view-full-btn" title="Open Fullscreen Lightbox">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                <span>View Full</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const saveWrap = assistantBubble.querySelector(".ios-save-dropdown-wrapper");
      bindSaveMenu(saveWrap, (action) => {
        exportImageDocument(action, resultProxyUrl, finalPrompt || "edited_image");
      });

      const origCol = assistantBubble.querySelector(".original-col");
      if (origCol) {
        origCol.addEventListener("click", () => {
          openImageLightbox(originalProxyUrl, "Original Image", originalStorageUrl);
        });
      }

      const editedCol = assistantBubble.querySelector(".edited-col");
      if (editedCol) {
        editedCol.addEventListener("click", () => {
          openImageLightbox(resultProxyUrl, `Edited: "${finalPrompt}"`, resultStorageUrl);
        });
      }

      const viewFullBtn = assistantBubble.querySelector(".view-full-btn");
      if (viewFullBtn) {
        viewFullBtn.addEventListener("click", () => {
          openImageLightbox(resultProxyUrl, `Edited: "${finalPrompt}"`, resultStorageUrl);
        });
      }

      const copyBtn = assistantBubble.querySelector(".copy-proxy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const rawUrl = copyBtn.getAttribute("data-url");
          const fullUrl = rawUrl.startsWith("http") ? rawUrl : window.location.origin + rawUrl;
          copyTextToClipboard(fullUrl).then(() => {
            copyBtn.innerHTML = "<span>Copied Link!</span>";
            triggerHaptic("medium");
            setTimeout(() => { if (copyBtn) copyBtn.innerHTML = "<span>Copy URL</span>"; }, 2000);
          });
        });
      }

      conversation.push({ role: "assistant", content: `[Edited Image: "${finalPrompt}"]` });
      smoothScrollToBottom();
    } catch (err) {
      if (err.name === "AbortError") {
        assistantBubble.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">(Image editing canceled)</div>`;
      } else {
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      setAttachedImage(null);
      autoResizeInput();
    }
  }

  // ---------------------------------------------------------------------------
  // Instant Preset Greeting Detection (HI, hello, hey, etc.) - No LLM query
  // ---------------------------------------------------------------------------
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

  function getPresetGreetingReply(modelKey) {
    const cfg = MODEL_CONFIG[modelKey];
    const modelName = cfg?.name || "AS Intelligence";

    if (cfg?.isExclusive) {
      const s62Replies = [
        `Hello! I am **${modelName}**, powered by **AS Cloud (NVIDIA NIM)**. How can I assist you today?`,
        `Greetings! **${modelName}** is active on **AS Cloud (NVIDIA NIM)**. What would you like to explore or solve?`,
        `Welcome! **${modelName}** is ready. Ask any question, brainstorm ideas, or generate code.`,
      ];
      return s62Replies[Math.floor(Math.random() * s62Replies.length)];
    }

    const standardReplies = [
      `Hello! I am **${modelName}**, powered by **AS Cloud**. How can I help you today?`,
      `Greetings! How can I assist you with your questions, coding, or projects today?`,
      `Welcome to AS Cloud. I am ready to help. Feel free to ask questions or explore our models.`,
      `Hello! What would you like to work on today?`,
    ];
    return standardReplies[Math.floor(Math.random() * standardReplies.length)];
  }

  // ---------------------------------------------------------------------------
  // Secret Celestial Experience (Hidden Easter Egg)
  // ---------------------------------------------------------------------------
  const CHRONO_MONTHS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  function formatChronoDate(d) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = CHRONO_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function formatChronoTime(d) {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function chronoEase(t) {
    if (t < 0.2) {
      return 2.5 * t * t;
    }
    const p = (t - 0.2) / 0.8;
    const easeOut = 1 - Math.pow(1 - p, 4);
    return 0.1 + 0.9 * easeOut;
  }

  function handleSecretExperience(userText) {
    appendMessage("user", userText);
    conversation.push({ role: "user", content: userText });

    const assistantBubble = appendMessage("assistant", "");
    assistantBubble.classList.add("cherry-blossom-bubble");
    assistantBubble.innerHTML = `
      <div class="sakura-bubble-content">
        <span class="sakura-icon left"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a4 4 0 0 0-4 4c0 3 4 6 4 6s4-3 4-6a4 4 0 0 0-4-4z"/><path d="M12 22a4 4 0 0 0 4-4c0-3-4-6-4-6s-4 3-4 6a4 4 0 0 0 4 4z"/><path d="M2 12a4 4 0 0 0 4 4c3 0 6-4 6-4s-3-4-6-4a4 4 0 0 0-4 4z"/><path d="M22 12a4 4 0 0 0-4-4c-3 0-6 4-6 4s3 4 6 4a4 4 0 0 0 4-4z"/></svg></span>
        <span class="sakura-text">Aw? Wait wait!</span>
        <span class="sakura-icon right"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a4 4 0 0 0-4 4c0 3 4 6 4 6s4-3 4-6a4 4 0 0 0-4-4z"/><path d="M12 22a4 4 0 0 0 4-4c0-3-4-6-4-6s-4 3-4 6a4 4 0 0 0 4 4z"/><path d="M2 12a4 4 0 0 0 4 4c3 0 6-4 6-4s-3-4-6-4a4 4 0 0 0-4 4z"/><path d="M22 12a4 4 0 0 0-4-4c-3 0-6 4-6 4s3 4 6 4a4 4 0 0 0 4-4z"/></svg></span>
      </div>
    `;
    conversation.push({ role: "assistant", content: "Aw? Wait wait!" });

    triggerHaptic("light");
    smoothScrollToBottom();

    setTimeout(() => {
      startSecretCelestialJourney();
    }, 1200);
  }

  function startSecretCelestialJourney() {
    if (messageInput) messageInput.blur();
    document.body.style.overflow = "hidden";

    const overlay = document.createElement("div");
    overlay.className = "secret-experience-overlay";
    overlay.id = "secretExperienceOverlay";

    const canvas = document.createElement("canvas");
    canvas.className = "secret-experience-canvas";
    overlay.appendChild(canvas);

    const hud = document.createElement("div");
    hud.className = "chrono-hud";
    hud.id = "chronoHud";
    hud.innerHTML = `
      <div class="chrono-stars-accent">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        &nbsp;
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        &nbsp;
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <div class="chrono-time" id="chronoTime">--:--:--</div>
      <div class="chrono-date" id="chronoDate">-- -- ----</div>
      <div class="chrono-sub">RETROGRADE TEMPORAL FLOW</div>
    `;
    overlay.appendChild(hud);
    document.body.appendChild(overlay);

    const chronoTime = hud.querySelector("#chronoTime");
    const chronoDate = hud.querySelector("#chronoDate");

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    requestAnimationFrame(() => {
      overlay.classList.add("visible");
    });

    const STAR_COUNT = 260;
    const stars = [];
    const starColors = ["#ffffff", "#f8fafc", "#e0f2fe", "#fef3c7", "#fae8ff"];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width + 10,
        origZ: Math.random() * width + 10,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        color: starColors[i % starColors.length],
      });
    }

    const sparks = [];

    const startDate = new Date();
    const startMs = startDate.getTime();
    const targetDate = new Date(1990, 1, 27, 0, 0, 0);
    const targetMs = targetDate.getTime();
    const REWIND_DURATION = 11200;

    chronoTime.textContent = formatChronoTime(startDate);
    chronoDate.textContent = formatChronoDate(startDate);

    const journeyStartTime = performance.now();
    let animId = null;
    let isCleanedUp = false;

    function renderFrame(now) {
      if (isCleanedUp) return;
      const elapsed = now - journeyStartTime;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Phase 1: Time Travel Rewind (1400ms -> 12600ms)
      if (elapsed < 14400) {
        let warpSpeed = 0.5;

        if (elapsed >= 1400 && elapsed < 12600) {
          const rewindElapsed = elapsed - 1400;
          const p = Math.min(rewindElapsed / REWIND_DURATION, 1);
          const eased = chronoEase(p);
          const currentMs = startMs + (targetMs - startMs) * eased;
          const curDate = new Date(currentMs);

          chronoDate.textContent = formatChronoDate(curDate);
          chronoTime.textContent = formatChronoTime(curDate);

          if (p < 0.2) {
            warpSpeed = 0.5 + (p / 0.2) * 26;
          } else if (p < 0.85) {
            warpSpeed = 26.5;
          } else {
            const decel = (p - 0.85) / 0.15;
            warpSpeed = 26.5 * (1 - decel) + 0.5;
          }
        } else if (elapsed >= 12600) {
          chronoDate.textContent = "27 FEBRUARY 1990";
          chronoTime.textContent = "00:00:00";
          hud.classList.add("chrono-settled");
          warpSpeed = 0.3;
        }

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.z -= warpSpeed;
          if (s.z <= 0) {
            s.z = width;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
          }

          const k = 260 / s.z;
          const px = cx + s.x * k;
          const py = cy + s.y * k;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const starAlpha = Math.min((1 - s.z / width) * 1.2, 1) * s.alpha;
            const starRadius = Math.max(0.6, s.size * (1 - s.z / width) * 1.5);

            if (warpSpeed > 5) {
              const prevZ = s.z + warpSpeed * 1.8;
              const prevK = 260 / prevZ;
              const prevPx = cx + s.x * prevK;
              const prevPy = cy + s.y * prevK;

              ctx.strokeStyle = `rgba(215, 230, 255, ${starAlpha * 0.75})`;
              ctx.lineWidth = Math.max(1, starRadius * 0.8);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(prevPx, prevPy);
              ctx.stroke();
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
              ctx.beginPath();
              ctx.arc(px, py, starRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Phase 2: Fade to Black (14400ms -> 15800ms)
      if (elapsed >= 14400 && elapsed < 15800) {
        hud.style.opacity = "0";
      }

      // Phase 3: Waxing Crescent Moon & Night Sky (15600ms onwards)
      if (elapsed >= 15600) {
        hud.style.display = "none";

        // Cosmic background nebula haze behind moon
        const nebula = ctx.createRadialGradient(cx, cy - 24, 40, cx, cy - 24, Math.max(width, height) * 0.65);
        nebula.addColorStop(0, "rgba(49, 46, 129, 0.08)");
        nebula.addColorStop(0.35, "rgba(88, 28, 135, 0.04)");
        nebula.addColorStop(0.7, "rgba(15, 23, 42, 0.02)");
        nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, width, height);

        // Draw Tranquil Night Sky Stars with Multi-frequency Twinkling
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.twinkleOffset += s.twinkleSpeed;
          const twinkle = 0.4 + 0.6 * (0.6 * Math.sin(s.twinkleOffset) + 0.4 * Math.cos(s.twinkleOffset * 1.3));
          const starAlpha = Math.max(0, Math.min(s.alpha * twinkle, 1));

          const sx = (s.x / 2) + cx;
          const sy = (s.y / 2) + cy;

          if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
            ctx.fillStyle = s.color || "rgba(240, 245, 255, 1)";
            ctx.globalAlpha = starAlpha;
            ctx.beginPath();
            ctx.arc(sx, sy, s.size * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Waxing Crescent Moon Animation
        const moonProgress = Math.min((elapsed - 15600) / 2600, 1);
        const moonAlpha = moonProgress;
        const easeProgress = 1 - Math.pow(1 - moonProgress, 4);
        const breath = Math.sin(elapsed * 0.0016) * 0.012;
        const moonScale = (0.92 + 0.08 * easeProgress) * (1 + breath);

        const moonR = Math.min(width, height) * 0.165;
        const moonY = cy - 24;

        ctx.save();
        ctx.globalAlpha = moonAlpha;
        ctx.translate(cx, moonY);
        ctx.scale(moonScale, moonScale);

        // A. Multi-tiered Atmospheric Lunar Corona
        const outerCorona = ctx.createRadialGradient(moonR * 0.45, 0, moonR * 0.7, moonR * 0.45, 0, moonR * 3.6);
        outerCorona.addColorStop(0, "rgba(255, 248, 235, 0.38)");
        outerCorona.addColorStop(0.18, "rgba(210, 235, 255, 0.16)");
        outerCorona.addColorStop(0.48, "rgba(165, 200, 255, 0.05)");
        outerCorona.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = outerCorona;
        ctx.beginPath();
        ctx.arc(moonR * 0.45, 0, moonR * 3.6, 0, Math.PI * 2);
        ctx.fill();

        const midCorona = ctx.createRadialGradient(moonR * 0.3, 0, moonR * 0.4, moonR * 0.3, 0, moonR * 1.8);
        midCorona.addColorStop(0, "rgba(255, 252, 240, 0.45)");
        midCorona.addColorStop(0.45, "rgba(190, 225, 255, 0.15)");
        midCorona.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = midCorona;
        ctx.beginPath();
        ctx.arc(moonR * 0.3, 0, moonR * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // B. Earthshine Disc (Dark side of the moon)
        ctx.beginPath();
        ctx.arc(0, 0, moonR, 0, Math.PI * 2);
        const earthshine = ctx.createRadialGradient(-moonR * 0.35, -moonR * 0.35, moonR * 0.1, 0, 0, moonR);
        earthshine.addColorStop(0, "rgba(25, 34, 52, 0.98)");
        earthshine.addColorStop(0.65, "rgba(15, 20, 32, 0.99)");
        earthshine.addColorStop(1, "rgba(8, 12, 18, 1)");
        ctx.fillStyle = earthshine;
        ctx.fill();

        // C. Earthshine Lunar Maria
        const mariaDetails = [
          [-0.32, -0.22, 0.18, 0.42],
          [-0.18, 0.28, 0.22, 0.38],
          [-0.46, 0.08, 0.14, 0.48],
          [-0.12, -0.42, 0.15, 0.42],
          [-0.52, -0.32, 0.11, 0.38],
          [-0.28, 0.02, 0.16, 0.35],
          [-0.05, 0.15, 0.12, 0.28]
        ];
        for (const [mx, my, mr, mopac] of mariaDetails) {
          ctx.fillStyle = `rgba(10, 14, 22, ${mopac})`;
          ctx.beginPath();
          ctx.arc(mx * moonR, my * moonR, mr * moonR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = "rgba(180, 215, 255, 0.22)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, moonR, Math.PI / 2, -Math.PI / 2, false);
        ctx.stroke();

        // D. Sunlit Waxing Crescent (Right Limb - Silky Mathematical Perfection)
        ctx.beginPath();
        ctx.arc(0, 0, moonR, -Math.PI / 2, Math.PI / 2, false);
        ctx.ellipse(0, 0, moonR * 0.56, moonR, 0, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath();

        const moonGrad = ctx.createLinearGradient(-moonR * 0.2, -moonR, moonR, moonR * 0.5);
        moonGrad.addColorStop(0, "#ffffff");
        moonGrad.addColorStop(0.18, "#fffdf5");
        moonGrad.addColorStop(0.55, "#f7eedb");
        moonGrad.addColorStop(0.85, "#ebe1cd");
        moonGrad.addColorStop(1, "#dfd5be");
        ctx.fillStyle = moonGrad;
        ctx.shadowColor = "rgba(255, 250, 235, 0.95)";
        ctx.shadowBlur = 38;
        ctx.fill();

        // Delicate feathered inner terminator highlight
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, moonR * 0.56, moonR, 0, Math.PI / 2, -Math.PI / 2, true);
        const termGrad = ctx.createLinearGradient(0, -moonR, 0, moonR);
        termGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
        termGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
        termGrad.addColorStop(1, "rgba(255, 255, 255, 0.25)");
        ctx.strokeStyle = termGrad;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }

      // Phase 4: Hyper-Premium Shooting Star (18200ms -> 19800ms)
      if (elapsed >= 18200 && elapsed < 20400) {
        const starElapsed = elapsed - 18200;
        const starDuration = 1400;
        const rawT = Math.min(starElapsed / starDuration, 1);
        const st = rawT * rawT * (3 - 2 * rawT);

        const sx0 = width * 0.88;
        const sy0 = height * 0.10;
        const scx = width * 0.48;
        const scy = height * 0.32;
        const sx1 = width * 0.10;
        const sy1 = height * 0.74;

        const inv = 1 - st;
        const hx = inv * inv * sx0 + 2 * inv * st * scx + st * st * sx1;
        const hy = inv * inv * sy0 + 2 * inv * st * scy + st * st * sy1;

        const dx = 2 * inv * (scx - sx0) + 2 * st * (sx1 - scx);
        const dy = 2 * inv * (scy - sy0) + 2 * st * (sy1 - scy);
        const theta = Math.atan2(dy, dx);

        const totalDist = Math.hypot(sx1 - sx0, sy1 - sy0);
        const tailLen = Math.min(270, totalDist * 0.38) * Math.sin(st * Math.PI);

        const tx = hx - Math.cos(theta) * tailLen;
        const ty = hy - Math.sin(theta) * tailLen;

        if (st < 1 && tailLen > 2) {
          ctx.save();

          // 1. Wide Ionization Aurora Trail
          const auroraGrad = ctx.createLinearGradient(hx, hy, tx, ty);
          auroraGrad.addColorStop(0, "rgba(56, 189, 248, 0.22)");
          auroraGrad.addColorStop(0.3, "rgba(168, 85, 247, 0.14)");
          auroraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.strokeStyle = auroraGrad;
          ctx.lineWidth = 14;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // 2. Mid Plasma Trail
          const midGrad = ctx.createLinearGradient(hx, hy, tx, ty);
          midGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          midGrad.addColorStop(0.2, "rgba(56, 189, 248, 0.85)");
          midGrad.addColorStop(0.65, "rgba(168, 85, 247, 0.45)");
          midGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = midGrad;
          ctx.lineWidth = 4.8;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // 3. Razor Core Streak
          const coreGrad = ctx.createLinearGradient(hx, hy, tx, ty);
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
          coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = coreGrad;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // 4. Diamond Diffraction Spikes at Nucleus
          ctx.translate(hx, hy);
          const spikeLen = 14 * Math.sin(st * Math.PI);

          const spikeH = ctx.createLinearGradient(-spikeLen, 0, spikeLen, 0);
          spikeH.addColorStop(0, "rgba(255, 255, 255, 0)");
          spikeH.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
          spikeH.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = spikeH;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-spikeLen, 0);
          ctx.lineTo(spikeLen, 0);
          ctx.stroke();

          const spikeV = ctx.createLinearGradient(0, -spikeLen, 0, spikeLen);
          spikeV.addColorStop(0, "rgba(255, 255, 255, 0)");
          spikeV.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
          spikeV.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = spikeV;
          ctx.beginPath();
          ctx.moveTo(0, -spikeLen);
          ctx.lineTo(0, spikeLen);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 26;
          ctx.beginPath();
          ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          if (st > 0.05 && st < 0.92) {
            for (let k = 0; k < 4; k++) {
              sparks.push({
                x: hx + (Math.random() - 0.5) * 8,
                y: hy + (Math.random() - 0.5) * 8,
                vx: -Math.cos(theta) * (Math.random() * 2.6 + 0.8) + (Math.random() - 0.5) * 1.8,
                vy: -Math.sin(theta) * (Math.random() * 2.6 + 0.8) + (Math.random() * 1.8 + 0.6),
                life: 1.0,
                decay: Math.random() * 0.016 + 0.01,
                size: Math.random() * 2.5 + 0.9,
                color: Math.random() > 0.4 ? "#ffffff" : (Math.random() > 0.5 ? "#fef08a" : "#7dd3fc"),
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.16 + 0.08
              });
            }
          }
        }
      }

      // Phase 4b: Distant Companion Micro-Meteor (19600ms -> 20450ms)
      if (elapsed >= 19600 && elapsed < 20450) {
        const mElapsed = elapsed - 19600;
        const mt = Math.min(mElapsed / 800, 1);
        if (mt < 1) {
          const mx0 = width * 0.70;
          const my0 = height * 0.08;
          const mx1 = width * 0.38;
          const my1 = height * 0.24;
          const mhx = mx0 + (mx1 - mx0) * mt;
          const mhy = my0 + (my1 - my0) * mt;
          const mtheta = Math.atan2(my1 - my0, mx1 - mx0);
          const mTail = 95 * Math.sin(mt * Math.PI);
          const mtx = mhx - Math.cos(mtheta) * mTail;
          const mty = mhy - Math.sin(mtheta) * mTail;

          const mGrad = ctx.createLinearGradient(mhx, mhy, mtx, mty);
          mGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
          mGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.6)");
          mGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.save();
          ctx.strokeStyle = mGrad;
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(mhx, mhy);
          ctx.lineTo(mtx, mty);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#bae6fd";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(mhx, mhy, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Render Sparkling Stardust Embers
      if (sparks.length > 0) {
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= sp.decay;

          if (sp.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }

          sp.twinkleOffset += sp.twinkleSpeed;
          const sparkTwinkle = 0.5 + 0.5 * Math.sin(sp.twinkleOffset);
          const sparkAlpha = sp.life * sparkTwinkle;

          ctx.save();
          ctx.fillStyle = sp.color;
          ctx.globalAlpha = sparkAlpha;
          ctx.shadowColor = sp.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Phase 5: Peaceful Cosmic Pause & Slow Fade Back to Chat
      if (elapsed >= 25000 && !overlay.classList.contains("fading-out")) {
        overlay.classList.add("fading-out");
        overlay.style.transition = "opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1)";
        overlay.style.opacity = "0";
        document.body.style.overflow = "";
      }

      if (elapsed >= 27600) {
        cleanup();
        return;
      }

      animId = requestAnimationFrame(renderFrame);
    }

    function cleanup() {
      if (isCleanedUp) return;
      isCleanedUp = true;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      document.body.style.overflow = "";
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    animId = requestAnimationFrame(renderFrame);
  }

  // ---------------------------------------------------------------------------
  // Message Transmission with Separated Thinking & 120fps Batching
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    if (!currentUser || !sessionToken) {
      showAuthGate("Please log in to AS Cloud to send messages.");
      return;
    }
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

    // 0. Secret Easter Egg: STRICTLY only "shuvangi" or "suhu"
    // No other words before, after, or accompanying it.
    const normalizedWord = text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");

    if (normalizedWord === "shuvangi" || normalizedWord === "suhu") {
      handleSecretExperience(text);
      return;
    }

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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg><strong>Image Editing Usage:</strong><br>
            1. Attach an image using the <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> button in the composer and type your edit prompt.<br>
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
            <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #ffffff;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <span>Music Play Command:</span>
            </span><br>
            Type <code>/play &lt;song name&gt;</code> to stream and download songs.<br>
            <em>Example:</em> <code>/play Alan Walker - Faded</code>
          </div>
        `;
        return;
      }
    }

    // 2. Check if YouTube link is pasted/entered
    // 1.5. Check if Instagram link is pasted/entered
    const instaMatch = text.match(INSTA_REGEX);
    if (instaMatch) {
      handleInstagramMedia(text);
      return;
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

    // 4. Instant Preset Reply for Greetings (HI, hello, hey, etc.) - Never queries model!
    if (isGreeting(text)) {
      appendMessage("user", text);
      conversation.push({ role: "user", content: text });

      const assistantBubble = appendMessage("assistant", "");
      renderTypingIndicator(assistantBubble);
      const reply = getPresetGreetingReply(selectedModel);
      conversation.push({ role: "assistant", content: reply });

      triggerHaptic("light");

      setTimeout(() => {
        let charIndex = 0;
        const step = 2;
        const timer = setInterval(() => {
          charIndex += step;
          const currentSlice = reply.slice(0, charIndex);
          renderAssistantBubble(assistantBubble, currentSlice, charIndex < reply.length, selectedModel);
          smoothScrollToBottom();
          if (charIndex >= reply.length) {
            clearInterval(timer);
            renderAssistantBubble(assistantBubble, reply, false, selectedModel);
          }
        }, 15);
      }, 240);
      return;
    }

    appendMessage("user", text);
    conversation.push({ role: "user", content: text });

    const currentReqModel = selectedModel;
    const assistantBubble = appendMessage("assistant", "");
    renderTypingIndicator(assistantBubble);
    setGenerating(true);

    abortController = new AbortController();

    const fullMessages = [
      {
        role: "system",
        content: "You are AS Intelligence, a helpful, precise, and advanced AI assistant powered by AS Cloud."
      },
      ...conversation,
    ];

    let accumulatedText = "";
    let renderScheduled = false;

    function scheduleRender() {
      if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(() => {
          renderAssistantBubble(assistantBubble, accumulatedText, true, currentReqModel);
          smoothScrollToBottom(false);
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

      // Final render without cursor & enable code highlight + save menus
      requestAnimationFrame(() => {
        renderAssistantBubble(assistantBubble, accumulatedText, false, currentReqModel);
        smoothScrollToBottom(true);
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
        assistantBubble.innerHTML = `<div style="color: var(--status-red); padding: 4px 0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${escapeHtml(err.message)}</div>`;
      }
    } finally {
      setGenerating(false);
      abortController = null;
      autoResizeInput();
    }
  }

  // Dynamic Visual Viewport Synchronization for Mobile Phones
  function syncVisualViewport() {
    const appEl = document.getElementById("app") || document.querySelector(".ios-app");
    if (!appEl) return;

    if (window.visualViewport && window.innerWidth <= 768) {
      const vh = window.visualViewport.height;
      const offsetTop = window.visualViewport.offsetTop || 0;
      appEl.style.position = "fixed";
      appEl.style.top = `${offsetTop}px`;
      appEl.style.height = `${vh}px`;
      appEl.style.bottom = "auto";
    } else {
      appEl.style.position = "";
      appEl.style.top = "";
      appEl.style.height = "";
      appEl.style.bottom = "";
    }
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      syncVisualViewport();
      smoothScrollToBottom();
    });
    window.visualViewport.addEventListener("scroll", () => {
      syncVisualViewport();
    });
  }

  if (messageInput) {
    messageInput.addEventListener("focus", () => {
      setTimeout(() => {
        syncVisualViewport();
        smoothScrollToBottom();
      }, 100);
      setTimeout(() => {
        syncVisualViewport();
        smoothScrollToBottom();
      }, 300);
    });
    messageInput.addEventListener("blur", () => {
      setTimeout(() => {
        syncVisualViewport();
      }, 100);
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


  // ---------------------------------------------------------------------------
  // iOS Message Reactions Storage & Icon System (Strictly Zero Emojis)
  // ---------------------------------------------------------------------------
  const REACTION_ICONS = {
    heart: `<svg class="reaction-badge-svg" width="14" height="14" viewBox="0 0 24 24" fill="#ff2d55"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    thumbsup: `<svg class="reaction-badge-svg" width="14" height="14" viewBox="0 0 24 24" fill="#34c759"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`,
    thumbsdown: `<svg class="reaction-badge-svg" width="14" height="14" viewBox="0 0 24 24" fill="#ff9500"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>`,
    haha: `<span style="font-size: 8px; font-weight: 800; line-height: 1; color: #ff9f0a;">HA</span>`,
    exclaim: `<span style="font-size: 11px; font-weight: 900; line-height: 1; color: #ff375f;">!!</span>`,
    question: `<span style="font-size: 11px; font-weight: 900; line-height: 1; color: #bf5af2;">?</span>`,
  };

  function renderReactionIconHtml(type) {
    return REACTION_ICONS[type] || REACTION_ICONS.heart;
  }

  function triggerHeartBurst(bubbleEl, clientX, clientY) {
    const burst = document.createElement("div");
    burst.className = "ios-heart-burst";
    burst.innerHTML = `<svg width="42" height="42" viewBox="0 0 24 24" fill="#ff2d55"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    const rect = bubbleEl.getBoundingClientRect();
    burst.style.left = `${(clientX || rect.left + rect.width / 2) - rect.left}px`;
    burst.style.top = `${(clientY || rect.top + rect.height / 2) - rect.top}px`;
    bubbleEl.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  // ---------------------------------------------------------------------------
  // iOS Context Menu & Tapback Manager for AI Viewport
  // ---------------------------------------------------------------------------
  const aiMessageContextMenu = document.getElementById("aiMessageContextMenu");
  const aiContextBackdrop = document.getElementById("aiContextBackdrop");
  const aiContextPreview = document.getElementById("aiContextPreview");
  const aiCtxCopyBtn = document.getElementById("aiCtxCopyBtn");
  const aiCtxShareBtn = document.getElementById("aiCtxShareBtn");

  let activeContextBubble = null;

  function openAiContextMenu(bubbleEl) {
    if (!aiMessageContextMenu || !bubbleEl) return;
    activeContextBubble = bubbleEl;

    if (aiContextPreview) {
      aiContextPreview.innerHTML = "";
      const clone = bubbleEl.cloneNode(true);
      clone.querySelectorAll(".msg-reaction-container").forEach(el => el.remove());
      aiContextPreview.appendChild(clone);
    }

    aiMessageContextMenu.style.display = "flex";
    Taptic.medium();
    playIosSound("pop");
  }

  function closeAiContextMenu() {
    if (aiMessageContextMenu) {
      aiMessageContextMenu.style.display = "none";
    }
    activeContextBubble = null;
  }

  if (aiContextBackdrop) aiContextBackdrop.addEventListener("click", closeAiContextMenu);

  document.querySelectorAll("#aiTapbackBar .tapback-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rx = btn.getAttribute("data-reaction");
      if (activeContextBubble && rx) {
        let badge = activeContextBubble.querySelector(".msg-reaction-container");
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "msg-reaction-container";
          activeContextBubble.appendChild(badge);
        }
        badge.innerHTML = `<span class="reaction-mini-icon">${renderReactionIconHtml(rx)}</span>`;
        Taptic.reaction();
        playIosSound("tapback");
      }
      closeAiContextMenu();
    });
  });

  if (aiCtxCopyBtn) {
    aiCtxCopyBtn.addEventListener("click", () => {
      if (activeContextBubble) {
        const text = activeContextBubble.innerText || activeContextBubble.textContent || "";
        copyTextToClipboard(text);
        Taptic.success();
      }
      closeAiContextMenu();
    });
  }

  if (aiCtxShareBtn) {
    aiCtxShareBtn.addEventListener("click", () => {
      if (activeContextBubble) {
        const text = activeContextBubble.innerText || "";
        if (navigator.share) {
          navigator.share({ title: "AS Intelligence", text }).catch(() => {});
        } else {
          copyTextToClipboard(text);
        }
        Taptic.light();
      }
      closeAiContextMenu();
    });
  }

  // ---------------------------------------------------------------------------
  // Message Gestures: Long-Press Context Menu & Double-Tap Heart Burst
  // ---------------------------------------------------------------------------
  function attachIosMessageGestures(row, bubble) {
    let pressTimer = null;
    let isLongPress = false;
    let lastTap = 0;

    function startPress(e) {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        openAiContextMenu(bubble);
      }, 450);
    }

    function cancelPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    bubble.addEventListener("touchstart", (e) => {
      startPress(e);
    }, { passive: true });

    bubble.addEventListener("touchmove", cancelPress, { passive: true });
    bubble.addEventListener("touchend", (e) => {
      cancelPress();
      if (isLongPress) return;

      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap heart burst
        const touch = e.changedTouches?.[0];
        triggerHeartBurst(bubble, touch?.clientX, touch?.clientY);
        let badge = bubble.querySelector(".msg-reaction-container");
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "msg-reaction-container";
          bubble.appendChild(badge);
        }
        badge.innerHTML = `<span class="reaction-mini-icon">${renderReactionIconHtml("heart")}</span>`;
        Taptic.reaction();
        playIosSound("tapback");
        lastTap = 0;
      } else {
        lastTap = now;
      }
    });

    bubble.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openAiContextMenu(bubble);
    });
  }

  // ---------------------------------------------------------------------------
  // iOS Pull-To-Refresh Physics on Viewport
  // ---------------------------------------------------------------------------
  function setupAiPullToRefresh() {
    const ptr = document.getElementById("aiPtr");
    if (!ptr || !chatViewport) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;
    const threshold = 65;

    chatViewport.addEventListener("touchstart", (e) => {
      if (chatViewport.scrollTop <= 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    chatViewport.addEventListener("touchmove", (e) => {
      if (!isPulling || isRefreshing) return;
      currentY = e.touches[0].clientY;
      const rawOffset = currentY - startY;
      if (rawOffset <= 0) return;

      const dampened = Math.min(68, Math.pow(rawOffset, 0.82) * 2.2);
      ptr.style.height = `${dampened}px`;
      ptr.classList.add("pulling");

      const rotation = Math.min(360, (dampened / threshold) * 360);
      const spinner = ptr.querySelector(".ios-ptr-spinner") || ptr;
      spinner.style.transform = `rotate(${rotation}deg)`;

      if (dampened >= threshold && !ptr.dataset.primed) {
        ptr.dataset.primed = "true";
        Taptic.medium();
      } else if (dampened < threshold && ptr.dataset.primed) {
        delete ptr.dataset.primed;
      }
    }, { passive: true });

    chatViewport.addEventListener("touchend", async () => {
      if (!isPulling || isRefreshing) return;
      isPulling = false;
      const rawOffset = currentY - startY;
      const dampened = Math.min(68, Math.pow(rawOffset, 0.82) * 2.2);
      delete ptr.dataset.primed;

      if (dampened >= threshold) {
        isRefreshing = true;
        ptr.classList.remove("pulling");
        ptr.classList.add("refreshing");
        ptr.style.height = "46px";
        Taptic.success();
        playIosSound("refresh");

        try {
          await checkConnection();
        } catch (_) {}

        setTimeout(() => {
          ptr.style.transition = "height 0.28s var(--ios-spring-bounce), opacity 0.25s ease";
          ptr.style.height = "0";
          ptr.classList.remove("refreshing");
          setTimeout(() => {
            ptr.style.transition = "";
            isRefreshing = false;
          }, 300);
        }, 600);
      } else {
        ptr.style.transition = "height 0.24s var(--ios-spring-bounce)";
        ptr.style.height = "0";
        ptr.classList.remove("pulling");
        setTimeout(() => {
          ptr.style.transition = "";
        }, 250);
      }
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // iOS Modal Sheet Drag-To-Dismiss Physics
  // ---------------------------------------------------------------------------
  function attachModalSheetDrag(modalEl, cardEl, onClose) {
    if (!modalEl || !cardEl) return;
    const dragTarget = cardEl.querySelector(".sheet-drag-handle") || cardEl;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    dragTarget.addEventListener("touchstart", (e) => {
      if (window.innerWidth > 768) return;
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = true;
      cardEl.style.transition = "none";
    }, { passive: true });

    dragTarget.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const dy = currentY - startY;
      if (dy > 0) {
        cardEl.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      const dy = currentY - startY;
      startY = 0;

      if (dy > 80) {
        cardEl.style.transition = "transform 0.24s var(--ios-spring-bounce)";
        cardEl.style.transform = "translateY(100%)";
        Taptic.light();
        setTimeout(() => {
          cardEl.style.transform = "";
          cardEl.style.transition = "";
          if (typeof onClose === "function") onClose();
          else modalEl.classList.add("hidden");
        }, 250);
      } else {
        cardEl.style.transition = "transform 0.28s var(--ios-spring-bounce)";
        cardEl.style.transform = "";
        setTimeout(() => {
          cardEl.style.transition = "";
        }, 290);
      }
    }

    dragTarget.addEventListener("touchend", onDragEnd, { passive: true });
    dragTarget.addEventListener("touchcancel", onDragEnd, { passive: true });
  }


  // Initialize iOS Systems
  setupAiPullToRefresh();
  if (modelModal && modelPopover) {
    attachModalSheetDrag(modelModal, modelPopover, closePopover);
  }

  // Bind Taptic feedback to buttons and chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => Taptic.light());
  });
  document.querySelectorAll(".popover-item").forEach((item) => {
    item.addEventListener("click", () => Taptic.selection());
  });
  if (newChatBtn) newChatBtn.addEventListener("click", () => Taptic.medium());
  if (modelPickerBtn) modelPickerBtn.addEventListener("click", () => Taptic.light());
  if (attachBtn) attachBtn.addEventListener("click", () => Taptic.light());
  if (sendBtn) sendBtn.addEventListener("click", () => { Taptic.heavy(); playIosSound("sent"); });


  // ---------------------------------------------------------------------------
  // iOS Offline Screen & Walking Cat Roamer System (Strictly Zero Emojis)
  // ---------------------------------------------------------------------------
  function initOfflineSystem() {
    const offlineOverlay = document.getElementById("iosOfflineOverlay");
    const retryBtn = document.getElementById("offlineRetryBtn");
    const timerNotice = document.getElementById("offlineTimerNotice");
    const roamingCat = document.getElementById("offlineRoamingCat");
    if (!offlineOverlay) return;

    let isOffline = !navigator.onLine;
    let autoRetryTimer = null;
    let secondsLeft = 4;

    // Cat Roamer Physics State
    let catX = 60;
    let catY = 300;
    let targetX = 60;
    let targetY = 300;
    let facing = 1; // 1 = right, -1 = left
    let isRoamingActive = false;
    let animFrameId = null;
    let pauseTimer = null;
    let isPausedAtTarget = false;

    function getBounds() {
      const isMobile = window.innerWidth <= 768;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (isMobile) {
        return {
          minX: 10,
          maxX: Math.max(20, w - 125),
          minY: Math.max(280, h * 0.55),
          maxY: Math.max(300, h - 110),
          speed: 1.25,
        };
      } else {
        return {
          minX: 35,
          maxX: Math.max(80, w - 175),
          minY: Math.max(160, h * 0.45),
          maxY: Math.max(220, h - 130),
          speed: 1.85,
        };
      }
    }

    function pickNewTarget() {
      const b = getBounds();
      targetX = b.minX + Math.random() * (b.maxX - b.minX);
      targetY = b.minY + Math.random() * (b.maxY - b.minY);
      isPausedAtTarget = false;
      if (roamingCat) {
        roamingCat.classList.add("cat-is-walking");
      }
    }

    function updateCatRoam() {
      if (!isRoamingActive || !roamingCat || offlineOverlay.style.display === "none") return;

      const b = getBounds();

      // Keep cat strictly within visible bounds on screen resize
      catX = Math.max(b.minX, Math.min(b.maxX, catX));
      catY = Math.max(b.minY, Math.min(b.maxY, catY));

      if (!isPausedAtTarget) {
        const dx = targetX - catX;
        const dy = targetY - catY;
        const dist = Math.hypot(dx, dy);

        if (dist > 6) {
          const vx = (dx / dist) * b.speed;
          const vy = (dy / dist) * b.speed;
          catX += vx;
          catY += vy;

          // Flip direction when walking left vs right
          if (dx > 2) facing = 1;
          else if (dx < -2) facing = -1;

          roamingCat.style.transform = `translate3d(${catX}px, ${catY}px, 0) scaleX(${facing})`;
          if (!roamingCat.classList.contains("cat-is-walking")) {
            roamingCat.classList.add("cat-is-walking");
          }
        } else {
          // Arrived at target: pause and sniff for packets
          isPausedAtTarget = true;
          roamingCat.classList.remove("cat-is-walking");

          clearTimeout(pauseTimer);
          const pauseDuration = 1600 + Math.random() * 1400; // 1.6s to 3s sniff
          pauseTimer = setTimeout(() => {
            if (isRoamingActive) {
              pickNewTarget();
            }
          }, pauseDuration);
        }
      }

      animFrameId = requestAnimationFrame(updateCatRoam);
    }

    function startRoaming() {
      if (isRoamingActive) return;
      isRoamingActive = true;
      const b = getBounds();
      catX = (b.minX + b.maxX) / 2;
      catY = (b.minY + b.maxY) / 2;
      pickNewTarget();
      animFrameId = requestAnimationFrame(updateCatRoam);
    }

    function stopRoaming() {
      isRoamingActive = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      clearTimeout(pauseTimer);
    }

    function showOfflineScreen() {
      if (!isOffline) return;
      offlineOverlay.style.display = "flex";
      offlineOverlay.setAttribute("aria-hidden", "false");
      if (typeof Taptic !== "undefined") Taptic.warning();
      if (typeof playIosSound !== "undefined") playIosSound("pop");
      startRoaming();
      startAutoRetryCountdown();
    }

    function hideOfflineScreen(instant = false) {
      if (instant) {
        stopRoaming();
        offlineOverlay.style.display = "none";
        offlineOverlay.setAttribute("aria-hidden", "true");
        return;
      }
      const card = offlineOverlay.querySelector(".ios-offline-card");
      if (card) card.classList.add("restored");
      if (roamingCat) roamingCat.classList.add("restored");
      const badgeText = offlineOverlay.querySelector(".offline-badge-text");
      if (badgeText) badgeText.textContent = "Online • Connection Restored";
      if (typeof Taptic !== "undefined") Taptic.success();
      if (typeof playIosSound !== "undefined") playIosSound("refresh");

      setTimeout(() => {
        offlineOverlay.style.transition = "opacity 0.35s var(--ios-spring-bounce)";
        offlineOverlay.style.opacity = "0";
        setTimeout(() => {
          stopRoaming();
          offlineOverlay.style.display = "none";
          offlineOverlay.style.opacity = "";
          offlineOverlay.style.transition = "";
          offlineOverlay.setAttribute("aria-hidden", "true");
          if (card) card.classList.remove("restored");
          if (roamingCat) roamingCat.classList.remove("restored");
          if (badgeText) badgeText.textContent = "Offline • Cat Radar Active";
        }, 350);
      }, 750);
    }

    async function testConnection() {
      if (retryBtn) {
        retryBtn.classList.add("retrying");
        const lbl = retryBtn.querySelector(".retry-btn-label");
        if (lbl) lbl.textContent = "Checking...";
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch("/api/health?t=" + Date.now(), {
          cache: "no-store",
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok || res.status < 500) {
          isOffline = false;
          hideOfflineScreen();
          return true;
        }
      } catch (_) {
        // Still offline
      } finally {
        if (retryBtn) {
          retryBtn.classList.remove("retrying");
          const lbl = retryBtn.querySelector(".retry-btn-label");
          if (lbl) lbl.textContent = "Check Connection";
        }
      }
      return false;
    }

    function startAutoRetryCountdown() {
      clearInterval(autoRetryTimer);
      secondsLeft = 4;
      if (timerNotice) timerNotice.textContent = `Auto-reconnecting in ${secondsLeft}s...`;

      autoRetryTimer = setInterval(async () => {
        secondsLeft--;
        if (secondsLeft > 0) {
          if (timerNotice) timerNotice.textContent = `Auto-reconnecting in ${secondsLeft}s...`;
        } else {
          secondsLeft = 4;
          if (timerNotice) timerNotice.textContent = "Checking connection...";
          const restored = await testConnection();
          if (restored) {
            clearInterval(autoRetryTimer);
          } else {
            if (timerNotice) timerNotice.textContent = `Auto-reconnecting in ${secondsLeft}s...`;
          }
        }
      }, 1000);
    }

    window.addEventListener("offline", () => {
      isOffline = true;
      showOfflineScreen();
    });

    window.addEventListener("online", async () => {
      const restored = await testConnection();
      if (restored) {
        clearInterval(autoRetryTimer);
      }
    });

    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        if (typeof Taptic !== "undefined") Taptic.selection();
        testConnection();
      });
    }

    if (!navigator.onLine) {
      showOfflineScreen();
    }
  }

  initOfflineSystem();

  // Initialize
  syncVisualViewport();
  autoResizeInput();
  checkConnection();


  // ===========================================================================
  // AS Cloud Unified Auth & Distributed Vault Cloud Sync
  // ===========================================================================
  let currentUser = null;
  let sessionToken = null;
  let cloudSyncTimeout = null;
  let signupAvatarBase64 = null;
  let editAvatarBase64 = null;

  // Nav Profile Elements
  const userNavWrapper = document.getElementById("userNavWrapper");
  const userProfileNavBtn = document.getElementById("userProfileNavBtn");
  const navUserAvatarSlot = document.getElementById("navUserAvatarSlot");
  const navUserNameText = document.getElementById("navUserNameText");
  const navSyncDot = document.getElementById("navSyncDot");
  const userProfileDropdown = document.getElementById("userProfileDropdown");
  const dropdownUserAvatar = document.getElementById("dropdownUserAvatar");
  const dropdownDisplayName = document.getElementById("dropdownDisplayName");
  const dropdownBadge = document.getElementById("dropdownBadge");
  const dropdownHandle = document.getElementById("dropdownHandle");
  const syncLastStatus = document.getElementById("syncLastStatus");
  const openEditProfileBtn = document.getElementById("openEditProfileBtn");
  const userSignOutBtn = document.getElementById("userSignOutBtn");

  // Auth Gate Elements
  const asAuthGateOverlay = document.getElementById("asAuthGateOverlay");
  const tabAuthSignIn = document.getElementById("tabAuthSignIn");
  const tabAuthSignUp = document.getElementById("tabAuthSignUp");
  const authGateError = document.getElementById("authGateError");
  const authGateErrorText = document.getElementById("authGateErrorText");

  // Sign In Form Elements
  const authSignInForm = document.getElementById("authSignInForm");
  const signInUsername = document.getElementById("signInUsername");
  const signInPassword = document.getElementById("signInPassword");
  const signInSubmitBtn = document.getElementById("signInSubmitBtn");
  const switchToSignUpBtn = document.getElementById("switchToSignUpBtn");

  // Sign Up Form Elements
  const authSignUpForm = document.getElementById("authSignUpForm");
  const signUpAvatarSlot = document.getElementById("signUpAvatarSlot");
  const signUpAvatarInput = document.getElementById("signUpAvatarInput");
  const triggerAvatarUploadBtn = document.getElementById("triggerAvatarUploadBtn");
  const signUpUsername = document.getElementById("signUpUsername");
  const signUpDisplayName = document.getElementById("signUpDisplayName");
  const signUpPassword = document.getElementById("signUpPassword");
  const signUpBio = document.getElementById("signUpBio");
  const signUpSubmitBtn = document.getElementById("signUpSubmitBtn");
  const switchToSignInBtn = document.getElementById("switchToSignInBtn");

  // Telegram Auth Elements
  const tabAuthTelegram = document.getElementById("tabAuthTelegram");
  const authTelegramForm = document.getElementById("authTelegramForm");
  const chatTgStepInput = document.getElementById("chatTgStepInput");
  const chatTgStepVerify = document.getElementById("chatTgStepVerify");
  const chatTgUsername = document.getElementById("chatTgUsername");
  const chatTgStartBtn = document.getElementById("chatTgStartBtn");
  const chatTgDisplayCode = document.getElementById("chatTgDisplayCode");
  const chatTgCopyCodeBtn = document.getElementById("chatTgCopyCodeBtn");
  const chatTgCopyBtnText = document.getElementById("chatTgCopyBtnText");
  const chatTgLiveStatus = document.getElementById("chatTgLiveStatus");
  const chatTgDirectLinkBtn = document.getElementById("chatTgDirectLinkBtn");
  const chatTgBackBtn = document.getElementById("chatTgBackBtn");

  let chatTgPollInterval = null;
  let chatActiveTgCode = null;

  function stopChatTgPolling() {
    if (chatTgPollInterval) {
      clearInterval(chatTgPollInterval);
      chatTgPollInterval = null;
    }
  }

  function resetChatTgView() {
    stopChatTgPolling();
    chatActiveTgCode = null;
    if (chatTgStepInput) chatTgStepInput.style.display = "block";
    if (chatTgStepVerify) chatTgStepVerify.style.display = "none";
    if (chatTgStartBtn) {
      chatTgStartBtn.disabled = false;
      chatTgStartBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
        Get Verification Link
      `;
    }
    if (chatTgLiveStatus) {
      chatTgLiveStatus.textContent = "Listening for your message...";
      chatTgLiveStatus.style.color = "#2aabee";
    }
  }

  async function handleChatStartTg() {
    const rawVal = (chatTgUsername?.value || "").trim();
    const handle = rawVal.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();

    if (!handle || handle.length < 3) {
      showAuthError("Please enter a username with at least 3 characters (letters, numbers, underscores).");
      return;
    }

    hideAuthError();
    if (chatTgStartBtn) {
      chatTgStartBtn.disabled = true;
      chatTgStartBtn.textContent = "Generating Link...";
    }

    try {
      const res = await fetch(`/api/msg?action=tg_login_start&username=${encodeURIComponent(handle)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start verification.");
      }

      chatActiveTgCode = data.code;

      if (chatTgDisplayCode) chatTgDisplayCode.textContent = data.code;
      if (chatTgDirectLinkBtn) chatTgDirectLinkBtn.href = data.link || `https://t.me/skyformie?text=VERIFY%20${data.code}`;

      if (chatTgStepInput) chatTgStepInput.style.display = "none";
      if (chatTgStepVerify) chatTgStepVerify.style.display = "block";

      startChatTgPolling(data.code);
    } catch (err) {
      showAuthError(err.message);
      if (chatTgStartBtn) {
        chatTgStartBtn.disabled = false;
        chatTgStartBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
          Get Verification Link
        `;
      }
    }
  }

  function startChatTgPolling(code) {
    stopChatTgPolling();

    chatTgPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/msg?action=tg_login_check&code=${encodeURIComponent(code)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.verified && data.token && data.user) {
          stopChatTgPolling();

          if (chatTgLiveStatus) {
            chatTgLiveStatus.innerHTML = "✅ <strong>Approved! Verified via Telegram 👍</strong>";
            chatTgLiveStatus.style.color = "#34c759";
          }

          setTimeout(async () => {
            persistSession(data.user, data.token);
            renderNavProfile();
            hideAuthGate();
            if (typeof triggerHaptic === "function") triggerHaptic("success");
            await loadCloudSync();
          }, 800);
        }
      } catch (_) {}
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // WhatsApp Auth Elements & Handlers
  // ---------------------------------------------------------------------------
  const tabAuthWhatsApp = document.getElementById("tabAuthWhatsApp");
  const authWhatsAppForm = document.getElementById("authWhatsAppForm");
  const chatWaStepInput = document.getElementById("chatWaStepInput");
  const chatWaStepVerify = document.getElementById("chatWaStepVerify");
  const chatWaUsername = document.getElementById("chatWaUsername");
  const chatWaStartBtn = document.getElementById("chatWaStartBtn");
  const chatWaDisplayCode = document.getElementById("chatWaDisplayCode");
  const chatWaCopyCodeBtn = document.getElementById("chatWaCopyCodeBtn");
  const chatWaCopyBtnText = document.getElementById("chatWaCopyBtnText");
  const chatWaLiveStatus = document.getElementById("chatWaLiveStatus");
  const chatWaDirectLinkBtn = document.getElementById("chatWaDirectLinkBtn");
  const chatWaBackBtn = document.getElementById("chatWaBackBtn");
  const chatWaTargetPhoneTag = document.getElementById("chatWaTargetPhoneTag");

  let chatWaPollInterval = null;
  let chatActiveWaCode = null;

  function stopChatWaPolling() {
    if (chatWaPollInterval) {
      clearInterval(chatWaPollInterval);
      chatWaPollInterval = null;
    }
  }

  function resetChatWaView() {
    stopChatWaPolling();
    chatActiveWaCode = null;
    if (chatWaStepInput) chatWaStepInput.style.display = "block";
    if (chatWaStepVerify) chatWaStepVerify.style.display = "none";
    if (chatWaStartBtn) {
      chatWaStartBtn.disabled = false;
      chatWaStartBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z"/>
        </svg>
        Get Verification Link
      `;
    }
    if (chatWaLiveStatus) {
      chatWaLiveStatus.textContent = "Listening for your WhatsApp message...";
      chatWaLiveStatus.style.color = "#25D366";
    }
  }

  async function handleChatStartWa() {
    const rawVal = (chatWaUsername?.value || "").trim();
    const handle = rawVal.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();

    if (!handle || handle.length < 3) {
      showAuthError("Please enter a username with at least 3 characters (letters, numbers, underscores).");
      return;
    }

    hideAuthError();
    if (chatWaStartBtn) {
      chatWaStartBtn.disabled = true;
      chatWaStartBtn.textContent = "Generating Link...";
    }

    try {
      const res = await fetch(`/api/msg?action=wa_login_start&username=${encodeURIComponent(handle)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start verification.");
      }

      chatActiveWaCode = data.code;

      if (chatWaDisplayCode) chatWaDisplayCode.textContent = data.code;
      if (chatWaDirectLinkBtn) chatWaDirectLinkBtn.href = data.link || `https://wa.me/919627404432?text=VERIFY%20${data.code}`;
      if (chatWaTargetPhoneTag && data.targetPhone) {
        chatWaTargetPhoneTag.href = `https://wa.me/${data.targetPhone}`;
        chatWaTargetPhoneTag.textContent = `+${data.targetPhone}`;
      }

      if (chatWaStepInput) chatWaStepInput.style.display = "none";
      if (chatWaStepVerify) chatWaStepVerify.style.display = "block";

      startChatWaPolling(data.code);
    } catch (err) {
      showAuthError(err.message);
      if (chatWaStartBtn) {
        chatWaStartBtn.disabled = false;
        chatWaStartBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z"/>
          </svg>
          Get Verification Link
        `;
      }
    }
  }

  function startChatWaPolling(code) {
    stopChatWaPolling();

    chatWaPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/msg?action=wa_login_check&code=${encodeURIComponent(code)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.verified && data.token && data.user) {
          stopChatWaPolling();

          if (chatWaLiveStatus) {
            chatWaLiveStatus.innerHTML = "✅ <strong>Approved! Verified via WhatsApp</strong>";
            chatWaLiveStatus.style.color = "#34c759";
          }

          setTimeout(async () => {
            persistSession(data.user, data.token);
            renderNavProfile();
            hideAuthGate();
            if (typeof triggerHaptic === "function") triggerHaptic("success");
            await loadCloudSync();
          }, 800);
        }
      } catch (_) {}
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Email Auth Elements & State
  // ---------------------------------------------------------------------------
  const tabAuthEmail = document.getElementById("tabAuthEmail");
  const authEmailForm = document.getElementById("authEmailForm");
  const chatEmailStepInput = document.getElementById("chatEmailStepInput");
  const chatEmailStepVerify = document.getElementById("chatEmailStepVerify");
  const chatEmailInput = document.getElementById("chatEmailInput");
  const chatEmailUsername = document.getElementById("chatEmailUsername");
  const chatEmailSendBtn = document.getElementById("chatEmailSendBtn");
  const chatEmailTargetDisplay = document.getElementById("chatEmailTargetDisplay");
  const chatEmailCodeInput = document.getElementById("chatEmailCodeInput");
  const chatEmailVerifyBtn = document.getElementById("chatEmailVerifyBtn");
  const chatEmailLiveStatus = document.getElementById("chatEmailLiveStatus");
  const chatEmailResendBtn = document.getElementById("chatEmailResendBtn");
  const chatEmailBackBtn = document.getElementById("chatEmailBackBtn");

  let chatActiveEmail = "";

  function resetChatEmailView() {
    if (chatEmailStepInput) chatEmailStepInput.style.display = "block";
    if (chatEmailStepVerify) chatEmailStepVerify.style.display = "none";
    if (chatEmailCodeInput) chatEmailCodeInput.value = "";
    if (chatEmailSendBtn) {
      chatEmailSendBtn.disabled = false;
      chatEmailSendBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Send Verification Code
      `;
    }
    if (chatEmailVerifyBtn) {
      chatEmailVerifyBtn.disabled = false;
      chatEmailVerifyBtn.textContent = "Verify & Sign In";
    }
    if (chatEmailLiveStatus) {
      chatEmailLiveStatus.textContent = "Verification code dispatched";
      chatEmailLiveStatus.style.color = "#a78bfa";
    }
  }

  async function handleChatSendEmailCode() {
    const emailVal = (chatEmailInput?.value || "").trim().toLowerCase();
    const usernameVal = (chatEmailUsername?.value || "").trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      showAuthError("Please enter a valid email address.");
      return;
    }

    hideAuthError();
    if (chatEmailSendBtn) {
      chatEmailSendBtn.disabled = true;
      chatEmailSendBtn.textContent = "Sending Code...";
    }

    try {
      const res = await fetch(`/api/msg?action=email_login_start&email=${encodeURIComponent(emailVal)}&username=${encodeURIComponent(usernameVal)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification code.");
      }

      chatActiveEmail = emailVal;
      if (chatEmailTargetDisplay) chatEmailTargetDisplay.textContent = emailVal;
      if (chatEmailStepInput) chatEmailStepInput.style.display = "none";
      if (chatEmailStepVerify) chatEmailStepVerify.style.display = "block";
      if (chatEmailCodeInput) {
        chatEmailCodeInput.value = "";
        chatEmailCodeInput.focus();
      }
    } catch (err) {
      showAuthError(err.message);
      if (chatEmailSendBtn) {
        chatEmailSendBtn.disabled = false;
        chatEmailSendBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Send Verification Code
        `;
      }
    }
  }

  async function handleChatVerifyEmailCode() {
    const codeVal = (chatEmailCodeInput?.value || "").trim();
    if (!codeVal || codeVal.length < 5) {
      showAuthError("Please enter the 6-digit verification code from your email.");
      return;
    }

    hideAuthError();
    if (chatEmailVerifyBtn) {
      chatEmailVerifyBtn.disabled = true;
      chatEmailVerifyBtn.textContent = "Verifying...";
    }

    try {
      const res = await fetch(`/api/msg?action=email_login_check&email=${encodeURIComponent(chatActiveEmail)}&code=${encodeURIComponent(codeVal)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      if (chatEmailLiveStatus) {
        chatEmailLiveStatus.innerHTML = "✅ <strong>Verified! Authenticating...</strong>";
        chatEmailLiveStatus.style.color = "#34c759";
      }

      setTimeout(async () => {
        persistSession(data.user, data.token);
        renderNavProfile();
        hideAuthGate();
        if (typeof triggerHaptic === "function") triggerHaptic("success");
        await loadCloudSync();
      }, 700);
    } catch (err) {
      showAuthError(err.message);
      if (chatEmailVerifyBtn) {
        chatEmailVerifyBtn.disabled = false;
        chatEmailVerifyBtn.textContent = "Verify & Sign In";
      }
    }
  }

  // Edit Profile Modal Elements
  const asEditProfileModal = document.getElementById("asEditProfileModal");
  const closeEditProfileBtn = document.getElementById("closeEditProfileBtn");
  const editAvatarPreview = document.getElementById("editAvatarPreview");
  const editAvatarInput = document.getElementById("editAvatarInput");
  const triggerEditAvatarBtn = document.getElementById("triggerEditAvatarBtn");
  const removeAvatarBtn = document.getElementById("removeAvatarBtn");
  const editDisplayName = document.getElementById("editDisplayName");
  const editBio = document.getElementById("editBio");
  const editCurrentPassword = document.getElementById("editCurrentPassword");
  const editNewPassword = document.getElementById("editNewPassword");
  const saveProfileChangesBtn = document.getElementById("saveProfileChangesBtn");

  function getInitials(name, username) {
    const src = (name || username || "AS").trim();
    const parts = src.split(/[\s_]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return src.substring(0, 2).toUpperCase();
  }

  function renderAvatar(container, pfp, name, username) {
    if (!container) return;
    container.innerHTML = "";
    if (pfp && typeof pfp === "string" && pfp.trim().length > 0) {
      const img = document.createElement("img");
      img.src = pfp;
      img.alt = name || username || "User";
      img.onerror = () => {
        container.innerHTML = getInitials(name, username);
      };
      container.appendChild(img);
    } else {
      container.textContent = getInitials(name, username);
    }
  }

  function showAuthError(msg) {
    if (!authGateError || !authGateErrorText) return;
    authGateErrorText.textContent = msg || "An error occurred. Please try again.";
    authGateError.style.display = "flex";
  }

  function hideAuthError() {
    if (authGateError) authGateError.style.display = "none";
  }

  function isInviteCleared() {
    const cleared = localStorage.getItem("as_invite_cleared") === "true";
    const hasUser = !!(localStorage.getItem("as_user") || localStorage.getItem("as_msg_current_user"));
    return cleared || hasUser;
  }

  function renderGateViews() {
    const authInviteGateView = document.getElementById("authInviteGateView");
    const authMainPortalView = document.getElementById("authMainPortalView");
    if (!authInviteGateView || !authMainPortalView) return;

    if (isInviteCleared()) {
      authInviteGateView.style.display = "none";
      authMainPortalView.style.display = "block";
    } else {
      authInviteGateView.style.display = "block";
      authMainPortalView.style.display = "none";
    }
  }

  window.switchInviteChoice = function (choice) {
    const tabChoiceMembership = document.getElementById("tabChoiceMembership");
    const tabChoiceInvite = document.getElementById("tabChoiceInvite");
    const inviteMembershipForm = document.getElementById("inviteMembershipForm");
    const inviteKeyForm = document.getElementById("inviteKeyForm");
    const inviteGateError = document.getElementById("inviteGateError");

    if (inviteGateError) inviteGateError.style.display = "none";

    if (choice === "invite") {
      if (tabChoiceInvite) tabChoiceInvite.classList.add("active");
      if (tabChoiceMembership) tabChoiceMembership.classList.remove("active");
      if (inviteMembershipForm) inviteMembershipForm.style.display = "none";
      if (inviteKeyForm) {
        inviteKeyForm.style.display = "flex";
        const inp = document.getElementById("inviteKeyInput");
        if (inp) inp.focus();
      }
    } else {
      if (tabChoiceMembership) tabChoiceMembership.classList.add("active");
      if (tabChoiceInvite) tabChoiceInvite.classList.remove("active");
      if (inviteKeyForm) inviteKeyForm.style.display = "none";
      if (inviteMembershipForm) {
        inviteMembershipForm.style.display = "flex";
        const inp = document.getElementById("inviteMembershipCode");
        if (inp) inp.focus();
      }
    }
  };

  async function handleVerifyInvite(type) {
    const inviteGateError = document.getElementById("inviteGateError");
    const inviteGateErrorText = document.getElementById("inviteGateErrorText");
    const inviteGateSuccess = document.getElementById("inviteGateSuccess");
    const inviteGateSuccessText = document.getElementById("inviteGateSuccessText");
    const membershipBtn = document.getElementById("inviteMembershipBtn");
    const inviteKeyBtn = document.getElementById("inviteKeyBtn");
    const membershipInput = document.getElementById("inviteMembershipCode");
    const inviteKeyInput = document.getElementById("inviteKeyInput");

    if (inviteGateError) inviteGateError.style.display = "none";
    if (inviteGateSuccess) inviteGateSuccess.style.display = "none";

    const btn = type === "invite" ? inviteKeyBtn : membershipBtn;
    const input = type === "invite" ? inviteKeyInput : membershipInput;
    const codeVal = input ? input.value.trim() : "";

    if (!codeVal) {
      if (inviteGateError && inviteGateErrorText) {
        inviteGateErrorText.textContent = type === "invite" 
          ? "Please enter an invitation key." 
          : "Please enter your permanent membership code.";
        inviteGateError.style.display = "flex";
      }
      if (input) input.focus();
      return;
    }

    const origBtnContent = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="auth-spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:-2px;"></span> Verifying...`;
    }

    try {
      const res = await fetch("/api/msg?action=verify_invite_gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeVal, type }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.valid && data.passToken) {
        localStorage.setItem("as_invite_cleared", "true");
        localStorage.setItem("as_invite_pass", data.passToken);

        if (inviteGateSuccess && inviteGateSuccessText) {
          inviteGateSuccessText.textContent = data.message || "Access Granted! Opening login portal...";
          inviteGateSuccess.style.display = "flex";
        }

        if (btn) {
          btn.innerHTML = `<span>Access Granted ✓</span>`;
          btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
        }

        setTimeout(() => {
          renderGateViews();
          const signInUserInp = document.getElementById("signInUsername");
          if (signInUserInp) signInUserInp.focus();
        }, 650);
      } else {
        const errMsg = (data && data.error) || (type === "invite" 
          ? "Invalid or expired invitation key. Please check your key or use a membership code."
          : "Invalid permanent membership code. Please check and try again.");
        if (inviteGateError && inviteGateErrorText) {
          inviteGateErrorText.textContent = errMsg;
          inviteGateError.style.display = "flex";
        }
        if (input) {
          input.classList.add("shake-anim");
          setTimeout(() => input.classList.remove("shake-anim"), 500);
        }
      }
    } catch (err) {
      if (inviteGateError && inviteGateErrorText) {
        inviteGateErrorText.textContent = "Unable to connect to verification server. Please try again.";
        inviteGateError.style.display = "flex";
      }
    } finally {
      if (btn && !localStorage.getItem("as_invite_cleared")) {
        btn.disabled = false;
        btn.innerHTML = origBtnContent;
      }
    }
  }

  function showAuthGate(notice) {
    if (!asAuthGateOverlay) return;
    hideAuthError();
    renderGateViews();
    if (notice) {
      if (isInviteCleared()) {
        showAuthError(notice);
      } else {
        const inviteGateError = document.getElementById("inviteGateError");
        const inviteGateErrorText = document.getElementById("inviteGateErrorText");
        if (inviteGateError && inviteGateErrorText) {
          inviteGateErrorText.textContent = notice;
          inviteGateError.style.display = "flex";
        }
      }
    }
    asAuthGateOverlay.style.display = "flex";
    if (messageInput) messageInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
  }

  function hideAuthGate() {
    stopChatTgPolling();
    stopChatWaPolling();
    if (!asAuthGateOverlay) return;
    asAuthGateOverlay.style.display = "none";
    if (messageInput) {
      messageInput.disabled = false;
      messageInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
  }

  function renderNavProfile() {
    const navSupportBtn = document.getElementById("navSupportBtn");
    if (!currentUser) {
      if (navUserNameText) navUserNameText.textContent = "Sign In";
      if (navUserAvatarSlot) navUserAvatarSlot.textContent = "AS";
      if (navSyncDot) navSyncDot.style.display = "none";
      if (navSupportBtn) navSupportBtn.style.display = "none";
      return;
    }
    if (navSupportBtn) navSupportBtn.style.display = "inline-flex";

    const displayName = currentUser.displayName || currentUser.username;
    if (navUserNameText) navUserNameText.textContent = displayName;
    renderAvatar(navUserAvatarSlot, currentUser.pfp, currentUser.displayName, currentUser.username);
    if (navSyncDot) navSyncDot.style.display = "inline-block";

    // Dropdown updates
    renderAvatar(dropdownUserAvatar, currentUser.pfp, currentUser.displayName, currentUser.username);
    if (dropdownDisplayName) dropdownDisplayName.textContent = displayName;
    if (dropdownHandle) dropdownHandle.textContent = "@" + currentUser.username;
    
    const isOwner = currentUser.role === "owner" || currentUser.username.toLowerCase() === "as" || currentUser.username.toLowerCase() === "ugv0";
    if (dropdownBadge) {
      dropdownBadge.textContent = isOwner ? "Owner" : "Member";
      dropdownBadge.style.background = isOwner ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)";
      dropdownBadge.style.color = isOwner ? "#fbbf24" : "#60a5fa";
      dropdownBadge.style.borderColor = isOwner ? "rgba(245, 158, 11, 0.4)" : "rgba(59, 130, 246, 0.4)";
    }
  }

  function persistSession(user, token) {
    currentUser = user;
    sessionToken = token;
    try {
      localStorage.setItem("as_user", JSON.stringify(user));
      localStorage.setItem("as_token", token);
      localStorage.setItem("as_msg_current_user", JSON.stringify(user));
      localStorage.setItem("as_msg_token", token);
    } catch (_) {}
  }

  function clearSession() {
    currentUser = null;
    sessionToken = null;
    try {
      localStorage.removeItem("as_user");
      localStorage.removeItem("as_token");
      localStorage.removeItem("as_msg_current_user");
      localStorage.removeItem("as_msg_token");
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Sign In & Sign Up API Handlers
  // ---------------------------------------------------------------------------
  async function handleSignIn(e) {
    if (e) e.preventDefault();
    hideAuthError();

    const username = (signInUsername?.value || "").trim();
    const password = (signInPassword?.value || "").trim();

    if (!username || !password) {
      showAuthError("Please enter your username and password.");
      return;
    }

    if (signInSubmitBtn) {
      signInSubmitBtn.disabled = true;
      signInSubmitBtn.innerHTML = "<span>Signing in...</span>";
    }

    try {
      const res = await fetch("/api/msg?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || data.status !== "ok") {
        throw new Error(data.error || "Incorrect credentials.");
      }

      persistSession(data.user, data.token);
      renderNavProfile();
      hideAuthGate();
      if (typeof triggerHaptic === "function") triggerHaptic("success");

      // Load user conversations synced with AS Cloud Vault
      await loadCloudSync();
    } catch (err) {
      showAuthError(err.message || "Failed to sign in. Please verify your details.");
      if (typeof triggerHaptic === "function") triggerHaptic("error");
    } finally {
      if (signInSubmitBtn) {
        signInSubmitBtn.disabled = false;
        signInSubmitBtn.innerHTML = "<span>Sign In to AS Cloud</span>";
      }
    }
  }

  async function handleSignUp(e) {
    if (e) e.preventDefault();
    hideAuthError();

    const username = (signUpUsername?.value || "").trim().toLowerCase();
    const displayName = (signUpDisplayName?.value || "").trim();
    const password = (signUpPassword?.value || "").trim();
    const bio = (signUpBio?.value || "").trim();

    if (!username || !password) {
      showAuthError("Username and password are required.");
      return;
    }

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      showAuthError("Username must be 3-24 characters containing only letters, numbers, and underscores.");
      return;
    }

    if (password.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      return;
    }

    if (signUpSubmitBtn) {
      signUpSubmitBtn.disabled = true;
      signUpSubmitBtn.innerHTML = "<span>Creating Account...</span>";
    }

    try {
      const res = await fetch("/api/msg?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: displayName || username,
          password,
          bio: bio || "Available on AS Cloud",
          pfp: signupAvatarBase64 || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status !== "ok") {
        throw new Error(data.error || "Failed to create account.");
      }

      persistSession(data.user, data.token);
      renderNavProfile();
      hideAuthGate();
      if (typeof triggerHaptic === "function") triggerHaptic("success");

      // Initialize empty sync or save initial session
      await triggerCloudSync(true);
    } catch (err) {
      showAuthError(err.message || "Could not register. Username might already be taken.");
      if (typeof triggerHaptic === "function") triggerHaptic("error");
    } finally {
      if (signUpSubmitBtn) {
        signUpSubmitBtn.disabled = false;
        signUpSubmitBtn.innerHTML = "<span>Create AS Cloud Account</span>";
      }
    }
  }

  function handleSignOut() {
    if (!confirm("Are you sure you want to sign out of AS Cloud?")) return;
    clearSession();
    renderNavProfile();
    if (userProfileDropdown) userProfileDropdown.style.display = "none";

    // Clear local chat UI
    conversation = [];
    if (messagesFlow) messagesFlow.innerHTML = "";
    if (welcomeView) welcomeView.style.display = "flex";

    showAuthGate("You have been signed out. Log in to continue.");
  }

  // ---------------------------------------------------------------------------
  // Cloud Database Sync Engine (AS Cloud Vault)
  // ---------------------------------------------------------------------------
  function triggerCloudSync(immediate = false) {
    if (!currentUser || !sessionToken) return;

    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);

    const performSync = async () => {
      if (!currentUser || !sessionToken) return;
      try {
        if (syncLastStatus) syncLastStatus.textContent = "Syncing to cloud vault...";
        const res = await fetch("/api/msg?action=save_ai_sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + sessionToken,
          },
          body: JSON.stringify({
            token: sessionToken,
            conversations: conversation,
            activeId: "current_chat",
            settings: { selectedModel },
          }),
        });
        if (res.ok) {
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          if (syncLastStatus) syncLastStatus.textContent = `Synced at ${nowStr} (Cloud Vault)`;
        }
      } catch (err) {
        console.warn("Cloud sync notice:", err);
      }
    };

    if (immediate) {
      performSync();
    } else {
      cloudSyncTimeout = setTimeout(performSync, 1500);
    }
  }

  async function loadCloudSync() {
    if (!currentUser || !sessionToken) return;
    try {
      if (syncLastStatus) syncLastStatus.textContent = "Connecting to AS Cloud Vault...";
      const res = await fetch(`/api/msg?action=get_ai_sync&token=${encodeURIComponent(sessionToken)}`, {
        headers: { Authorization: "Bearer " + sessionToken },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.conversations) && data.conversations.length > 0) {
          if (conversation.length === 0) {
            conversation = data.conversations;
            if (messagesFlow) messagesFlow.innerHTML = "";
            if (welcomeView) welcomeView.style.display = "none";

            // Re-render chat messages from synced state
            conversation.forEach((msg) => {
              if (msg.role === "user") {
                appendMessage("user", msg.content);
              } else if (msg.role === "assistant") {
                const b = appendMessage("assistant", msg.content);
                if (typeof parseAndRenderMarkdown === "function") {
                  parseAndRenderMarkdown(b, msg.content);
                }
              }
            });
            scrollToBottom();
          }
        }
        if (syncLastStatus) syncLastStatus.textContent = "All conversations synchronized (Cloud Vault)";
      }
    } catch (err) {
      console.warn("Could not load cloud sync:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit Profile Handlers
  // ---------------------------------------------------------------------------
  function openEditProfile() {
    if (!currentUser) return;
    if (userProfileDropdown) userProfileDropdown.style.display = "none";
    if (editDisplayName) editDisplayName.value = currentUser.displayName || "";
    if (editBio) editBio.value = currentUser.bio || "";
    if (editCurrentPassword) editCurrentPassword.value = "";
    if (editNewPassword) editNewPassword.value = "";
    editAvatarBase64 = null;
    renderAvatar(editAvatarPreview, currentUser.pfp, currentUser.displayName, currentUser.username);
    if (asEditProfileModal) asEditProfileModal.style.display = "flex";
  }

  function closeEditProfile() {
    if (asEditProfileModal) asEditProfileModal.style.display = "none";
  }

  async function handleSaveProfileChanges() {
    if (!currentUser || !sessionToken) return;

    const displayName = (editDisplayName?.value || "").trim();
    const bio = (editBio?.value || "").trim();
    const oldPassword = (editCurrentPassword?.value || "").trim();
    const newPassword = (editNewPassword?.value || "").trim();

    if (newPassword && newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    if (saveProfileChangesBtn) {
      saveProfileChangesBtn.disabled = true;
      saveProfileChangesBtn.textContent = "Saving...";
    }

    try {
      const payload = {
        displayName,
        bio,
      };
      if (editAvatarBase64 !== null) {
        payload.pfp = editAvatarBase64;
      }
      if (newPassword) {
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch(`/api/msg?action=update_profile&token=${encodeURIComponent(sessionToken)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status !== "ok") {
        throw new Error(data.error || "Failed to update profile.");
      }

      persistSession(data.user, sessionToken);
      renderNavProfile();
      closeEditProfile();
      if (typeof triggerHaptic === "function") triggerHaptic("success");
    } catch (err) {
      alert(err.message || "Failed to update profile.");
    } finally {
      if (saveProfileChangesBtn) {
        saveProfileChangesBtn.disabled = false;
        saveProfileChangesBtn.textContent = "Save Changes";
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Setup Event Listeners & Initialize
  // ---------------------------------------------------------------------------
  
  window.switchAuthTab = function(mode) {
    const tabIn = document.getElementById("tabAuthSignIn");
    const tabUp = document.getElementById("tabAuthSignUp");
    const tabTg = document.getElementById("tabAuthTelegram");
    const tabWa = document.getElementById("tabAuthWhatsApp");
    const tabEm = document.getElementById("tabAuthEmail");
    const formIn = document.getElementById("authSignInForm");
    const formUp = document.getElementById("authSignUpForm");
    const formTg = document.getElementById("authTelegramForm");
    const formWa = document.getElementById("authWhatsAppForm");
    const formEm = document.getElementById("authEmailForm");

    hideAuthError();

    if (mode === 'signup') {
      stopChatTgPolling();
      stopChatWaPolling();
      tabUp?.classList.add("active");
      tabIn?.classList.remove("active");
      tabTg?.classList.remove("active");
      tabWa?.classList.remove("active");
      tabEm?.classList.remove("active");
      if (formIn) formIn.style.display = "none";
      if (formUp) formUp.style.display = "flex";
      if (formTg) formTg.style.display = "none";
      if (formWa) formWa.style.display = "none";
      if (formEm) formEm.style.display = "none";
    } else if (mode === 'telegram') {
      stopChatWaPolling();
      tabTg?.classList.add("active");
      tabIn?.classList.remove("active");
      tabUp?.classList.remove("active");
      tabWa?.classList.remove("active");
      tabEm?.classList.remove("active");
      if (formIn) formIn.style.display = "none";
      if (formUp) formUp.style.display = "none";
      if (formTg) formTg.style.display = "flex";
      if (formWa) formWa.style.display = "none";
      if (formEm) formEm.style.display = "none";

      const prefill = (signInUsername?.value || signUpUsername?.value || "").trim();
      if (prefill && chatTgUsername && !chatTgUsername.value) {
        chatTgUsername.value = prefill;
      }
      resetChatTgView();
      if (chatTgUsername) chatTgUsername.focus();
    } else if (mode === 'whatsapp') {
      stopChatTgPolling();
      tabWa?.classList.add("active");
      tabIn?.classList.remove("active");
      tabUp?.classList.remove("active");
      tabTg?.classList.remove("active");
      tabEm?.classList.remove("active");
      if (formIn) formIn.style.display = "none";
      if (formUp) formUp.style.display = "none";
      if (formTg) formTg.style.display = "none";
      if (formWa) formWa.style.display = "flex";
      if (formEm) formEm.style.display = "none";

      const prefill = (signInUsername?.value || signUpUsername?.value || "").trim();
      if (prefill && chatWaUsername && !chatWaUsername.value) {
        chatWaUsername.value = prefill;
      }
      resetChatWaView();
      if (chatWaUsername) chatWaUsername.focus();
    } else if (mode === 'email') {
      stopChatTgPolling();
      stopChatWaPolling();
      tabEm?.classList.add("active");
      tabIn?.classList.remove("active");
      tabUp?.classList.remove("active");
      tabTg?.classList.remove("active");
      tabWa?.classList.remove("active");
      if (formIn) formIn.style.display = "none";
      if (formUp) formUp.style.display = "none";
      if (formTg) formTg.style.display = "none";
      if (formWa) formWa.style.display = "none";
      if (formEm) formEm.style.display = "flex";

      const prefill = (signInUsername?.value || signUpUsername?.value || "").trim();
      if (prefill && chatEmailUsername && !chatEmailUsername.value) {
        chatEmailUsername.value = prefill;
      }
      resetChatEmailView();
      if (chatEmailInput) chatEmailInput.focus();
    } else {
      stopChatTgPolling();
      stopChatWaPolling();
      tabIn?.classList.add("active");
      tabUp?.classList.remove("active");
      tabTg?.classList.remove("active");
      tabWa?.classList.remove("active");
      tabEm?.classList.remove("active");
      if (formIn) formIn.style.display = "flex";
      if (formUp) formUp.style.display = "none";
      if (formTg) formTg.style.display = "none";
      if (formWa) formWa.style.display = "none";
      if (formEm) formEm.style.display = "none";
    }
  };

  window.handleSignInClick = handleSignIn;
  window.handleSignUpClick = handleSignUp;
  window.showASAuthGate = showAuthGate;
  window.hideASAuthGate = hideAuthGate;

  function setupAuthEvents() {
    // Nav Profile Button & Dropdown Toggle
    if (userProfileNavBtn) {
      userProfileNavBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!currentUser) {
          showAuthGate();
          return;
        }
        if (userProfileDropdown) {
          const isOpen = userProfileDropdown.style.display === "flex";
          userProfileDropdown.style.display = isOpen ? "none" : "flex";
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (userProfileDropdown && !userNavWrapper?.contains(e.target)) {
        userProfileDropdown.style.display = "none";
      }
    });

    if (openEditProfileBtn) openEditProfileBtn.addEventListener("click", openEditProfile);
    if (userSignOutBtn) userSignOutBtn.addEventListener("click", handleSignOut);

    // Telegram Auth Event Listeners
    if (chatTgStartBtn) chatTgStartBtn.addEventListener("click", handleChatStartTg);
    if (chatTgUsername) {
      chatTgUsername.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleChatStartTg();
      });
    }
    if (chatTgBackBtn) {
      chatTgBackBtn.addEventListener("click", () => {
        resetChatTgView();
        if (chatTgUsername) chatTgUsername.focus();
      });
    }
    if (chatTgCopyCodeBtn) {
      chatTgCopyCodeBtn.addEventListener("click", () => {
        const code = chatTgDisplayCode?.textContent || chatActiveTgCode || "";
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
          if (chatTgCopyBtnText) {
            const orig = chatTgCopyBtnText.textContent;
            chatTgCopyBtnText.textContent = "Copied! ✓";
            setTimeout(() => { chatTgCopyBtnText.textContent = orig; }, 2000);
          }
        }).catch(() => {});
      });
    }

    // WhatsApp Auth Event Listeners
    if (tabAuthWhatsApp) tabAuthWhatsApp.addEventListener("click", () => window.switchAuthTab('whatsapp'));
    if (chatWaStartBtn) chatWaStartBtn.addEventListener("click", handleChatStartWa);
    if (chatWaUsername) {
      chatWaUsername.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleChatStartWa();
      });
    }
    if (chatWaBackBtn) {
      chatWaBackBtn.addEventListener("click", () => {
        resetChatWaView();
        if (chatWaUsername) chatWaUsername.focus();
      });
    }
    if (chatWaCopyCodeBtn) {
      chatWaCopyCodeBtn.addEventListener("click", () => {
        const code = chatWaDisplayCode?.textContent || chatActiveWaCode || "";
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
          if (chatWaCopyBtnText) {
            const orig = chatWaCopyBtnText.textContent;
            chatWaCopyBtnText.textContent = "Copied! ✓";
            setTimeout(() => { chatWaCopyBtnText.textContent = orig; }, 2000);
          }
        }).catch(() => {});
      });
    }

    // Email Auth Event Listeners
    if (tabAuthEmail) tabAuthEmail.addEventListener("click", () => window.switchAuthTab('email'));
    if (chatEmailSendBtn) chatEmailSendBtn.addEventListener("click", handleChatSendEmailCode);
    if (chatEmailInput) {
      chatEmailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleChatSendEmailCode();
      });
    }
    if (chatEmailUsername) {
      chatEmailUsername.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleChatSendEmailCode();
      });
    }
    if (chatEmailVerifyBtn) chatEmailVerifyBtn.addEventListener("click", handleChatVerifyEmailCode);
    if (chatEmailCodeInput) {
      chatEmailCodeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleChatVerifyEmailCode();
        }
      });
      chatEmailCodeInput.addEventListener("input", () => {
        const val = chatEmailCodeInput.value.trim();
        if (val.length === 6 && /^\d{6}$/.test(val)) {
          handleChatVerifyEmailCode();
        }
      });
    }
    if (chatEmailResendBtn) chatEmailResendBtn.addEventListener("click", handleChatSendEmailCode);
    if (chatEmailBackBtn) {
      chatEmailBackBtn.addEventListener("click", () => {
        resetChatEmailView();
        if (chatEmailInput) chatEmailInput.focus();
      });
    }

    // Segmented Tabs Toggle
    if (tabAuthSignIn && tabAuthSignUp) {
      tabAuthSignIn.addEventListener("click", () => {
        tabAuthSignIn.classList.add("active");
        tabAuthSignUp.classList.remove("active");
        if (authSignInForm) authSignInForm.style.display = "flex";
        if (authSignUpForm) authSignUpForm.style.display = "none";
        hideAuthError();
      });

      tabAuthSignUp.addEventListener("click", () => {
        tabAuthSignUp.classList.add("active");
        tabAuthSignIn.classList.remove("active");
        if (authSignInForm) authSignInForm.style.display = "none";
        if (authSignUpForm) authSignUpForm.style.display = "flex";
        hideAuthError();
      });
    }

    if (switchToSignUpBtn) {
      switchToSignUpBtn.addEventListener("click", () => {
        tabAuthSignUp?.click();
      });
    }

    if (switchToSignInBtn) {
      switchToSignInBtn.addEventListener("click", () => {
        tabAuthSignIn?.click();
      });
    }

    // Invite-Only Gate Listeners
    const inviteMembershipBtn = document.getElementById("inviteMembershipBtn");
    const inviteMembershipCode = document.getElementById("inviteMembershipCode");
    const inviteKeyBtn = document.getElementById("inviteKeyBtn");
    const inviteKeyInput = document.getElementById("inviteKeyInput");
    const inviteMembershipForm = document.getElementById("inviteMembershipForm");
    const inviteKeyForm = document.getElementById("inviteKeyForm");

    if (inviteMembershipBtn) {
      inviteMembershipBtn.addEventListener("click", () => handleVerifyInvite("membership"));
    }
    if (inviteMembershipForm) {
      inviteMembershipForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleVerifyInvite("membership");
      });
    }
    if (inviteMembershipCode) {
      inviteMembershipCode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleVerifyInvite("membership");
      });
    }

    if (inviteKeyBtn) {
      inviteKeyBtn.addEventListener("click", () => handleVerifyInvite("invite"));
    }
    if (inviteKeyForm) {
      inviteKeyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleVerifyInvite("invite");
      });
    }
    if (inviteKeyInput) {
      inviteKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleVerifyInvite("invite");
      });
    }

    // Password Eye Toggles
    document.querySelectorAll(".auth-eye-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const inp = document.getElementById(targetId);
        if (inp) {
          inp.type = inp.type === "password" ? "text" : "password";
        }
      });
    });

    // Close overlay on backdrop click
    const overlayElem = document.getElementById("asAuthGateOverlay");
    if (overlayElem) {
      overlayElem.addEventListener("click", (e) => {
        if (e.target === overlayElem) {
          hideAuthGate();
        }
      });
    }

    // Form Submissions
    if (authSignInForm) authSignInForm.addEventListener("submit", handleSignIn);
    if (signInSubmitBtn) signInSubmitBtn.addEventListener("click", handleSignIn);
    if (authSignUpForm) authSignUpForm.addEventListener("submit", handleSignUp);
    if (signUpSubmitBtn) signUpSubmitBtn.addEventListener("click", handleSignUp);

    // Avatar Uploads
    if (triggerAvatarUploadBtn && signUpAvatarInput) {
      triggerAvatarUploadBtn.addEventListener("click", () => signUpAvatarInput.click());
      signUpAvatarInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            signupAvatarBase64 = evt.target.result;
            renderAvatar(signUpAvatarSlot, signupAvatarBase64, signUpDisplayName?.value, signUpUsername?.value);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Edit Profile Modal
    if (closeEditProfileBtn) closeEditProfileBtn.addEventListener("click", closeEditProfile);
    if (triggerEditAvatarBtn && editAvatarInput) {
      triggerEditAvatarBtn.addEventListener("click", () => editAvatarInput.click());
      editAvatarInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            editAvatarBase64 = evt.target.result;
            renderAvatar(editAvatarPreview, editAvatarBase64, editDisplayName?.value, currentUser?.username);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener("click", () => {
        editAvatarBase64 = "remove";
        renderAvatar(editAvatarPreview, null, editDisplayName?.value, currentUser?.username);
      });
    }

    if (saveProfileChangesBtn) saveProfileChangesBtn.addEventListener("click", handleSaveProfileChanges);
  }

  // Initial Auth Check
  // Support Modal Handlers
  window.openASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (!modal) return;
    const directBtn = document.getElementById("directSupportEmailRedirectBtn");
    if (directBtn) {
      const userParam = currentUser ? ` (@${currentUser.username})` : "";
      directBtn.href = `mailto:tanuqna@proton.me?subject=${encodeURIComponent("AS Cloud Support Request" + userParam)}&body=${encodeURIComponent("Hello AS Cloud Support Team,\n\nAccount: @" + (currentUser?.username || "unregistered") + "\n\nIssue Description:\n")}`;
    }
    modal.style.display = "flex";
  };

  window.closeASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (modal) modal.style.display = "none";
    const alert = document.getElementById("supportTicketAlert");
    if (alert) alert.style.display = "none";
  };

  function setupSupportModalEvents() {
    const copyBtn = document.getElementById("copySupportEmailBtn");
    const copyText = document.getElementById("copySupportText");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText("tanuqna@proton.me").then(() => {
          if (copyText) copyText.textContent = "Copied!";
          setTimeout(() => { if (copyText) copyText.textContent = "Copy"; }, 2000);
        }).catch(() => {});
      });
    }

    const sendTicketBtn = document.getElementById("sendSupportTicketBtn");
    const ticketSubject = document.getElementById("supportTicketSubject");
    const ticketMsg = document.getElementById("supportTicketMessage");
    const ticketAlert = document.getElementById("supportTicketAlert");

    if (sendTicketBtn) {
      sendTicketBtn.addEventListener("click", async () => {
        const sub = ticketSubject?.value?.trim() || "Support Request";
        const msg = ticketMsg?.value?.trim() || "";
        if (!msg) {
          if (ticketAlert) {
            ticketAlert.textContent = "Please enter your message before sending.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#ff6961";
            ticketAlert.style.background = "rgba(255, 69, 58, 0.12)";
          }
          return;
        }

        sendTicketBtn.disabled = true;
        sendTicketBtn.innerHTML = "<span>Sending ticket...</span>";

        try {
          const res = await fetch("/api/msg?action=support_ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: sub,
              message: msg,
              email: currentUser?.email || "member@ascloud.local",
              username: currentUser?.username || "Member",
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (ticketAlert) {
            ticketAlert.textContent = data.message || "Support ticket dispatched! An automated AI reply will be sent to your email from tanuqna@proton.me.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#34d399";
            ticketAlert.style.background = "rgba(16, 185, 129, 0.12)";
          }
          if (ticketMsg) ticketMsg.value = "";
        } catch (_) {
          if (ticketAlert) {
            ticketAlert.textContent = "Ticket dispatched to tanuqna@proton.me";
            ticketAlert.style.display = "block";
          }
        } finally {
          sendTicketBtn.disabled = false;
          sendTicketBtn.innerHTML = "<span>Send to Support Desk</span>";
        }
      });
    }
  }

  // Support Modal Handlers
  window.openASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (!modal) return;
    const directBtn = document.getElementById("directSupportEmailRedirectBtn");
    if (directBtn) {
      const userParam = currentUser ? ` (@${currentUser.username})` : "";
      directBtn.href = `mailto:tanuqna@proton.me?subject=${encodeURIComponent("AS Cloud Support Request" + userParam)}&body=${encodeURIComponent("Hello AS Cloud Support Team,\n\nAccount: @" + (currentUser?.username || "unregistered") + "\n\nIssue Description:\n")}`;
    }
    modal.style.display = "flex";
  };

  window.closeASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (modal) modal.style.display = "none";
    const alert = document.getElementById("supportTicketAlert");
    if (alert) alert.style.display = "none";
  };

  function setupSupportModalEvents() {
    const copyBtn = document.getElementById("copySupportEmailBtn");
    const copyText = document.getElementById("copySupportText");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText("tanuqna@proton.me").then(() => {
          if (copyText) copyText.textContent = "Copied!";
          setTimeout(() => { if (copyText) copyText.textContent = "Copy"; }, 2000);
        }).catch(() => {});
      });
    }

    const sendTicketBtn = document.getElementById("sendSupportTicketBtn");
    const ticketSubject = document.getElementById("supportTicketSubject");
    const ticketMsg = document.getElementById("supportTicketMessage");
    const ticketAlert = document.getElementById("supportTicketAlert");

    if (sendTicketBtn) {
      sendTicketBtn.addEventListener("click", async () => {
        const sub = ticketSubject?.value?.trim() || "Support Request";
        const msg = ticketMsg?.value?.trim() || "";
        if (!msg) {
          if (ticketAlert) {
            ticketAlert.textContent = "Please enter your message before sending.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#ff6961";
            ticketAlert.style.background = "rgba(255, 69, 58, 0.12)";
          }
          return;
        }

        sendTicketBtn.disabled = true;
        sendTicketBtn.innerHTML = "<span>Sending ticket...</span>";

        try {
          const res = await fetch("/api/msg?action=support_ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: sub,
              message: msg,
              email: currentUser?.email || "member@ascloud.local",
              username: currentUser?.username || "Member",
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (ticketAlert) {
            ticketAlert.textContent = data.message || "Support ticket dispatched! An automated AI reply will be sent to your email from tanuqna@proton.me.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#34d399";
            ticketAlert.style.background = "rgba(16, 185, 129, 0.12)";
          }
          if (ticketMsg) ticketMsg.value = "";
        } catch (_) {
          if (ticketAlert) {
            ticketAlert.textContent = "Ticket dispatched to tanuqna@proton.me";
            ticketAlert.style.display = "block";
          }
        } finally {
          sendTicketBtn.disabled = false;
          sendTicketBtn.innerHTML = "<span>Send to Support Desk</span>";
        }
      });
    }
  }

  // Support Modal Handlers
  window.openASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (!modal) return;
    const directBtn = document.getElementById("directSupportEmailRedirectBtn");
    if (directBtn) {
      const userParam = currentUser ? ` (@${currentUser.username})` : "";
      directBtn.href = `mailto:tanuqna@proton.me?subject=${encodeURIComponent("AS Cloud Support Request" + userParam)}&body=${encodeURIComponent("Hello AS Cloud Support Team,\n\nAccount: @" + (currentUser?.username || "unregistered") + "\n\nIssue Description:\n")}`;
    }
    modal.style.display = "flex";
  };

  window.closeASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (modal) modal.style.display = "none";
    const alert = document.getElementById("supportTicketAlert");
    if (alert) alert.style.display = "none";
  };

  function setupSupportModalEvents() {
    const copyBtn = document.getElementById("copySupportEmailBtn");
    const copyText = document.getElementById("copySupportText");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText("tanuqna@proton.me").then(() => {
          if (copyText) copyText.textContent = "Copied!";
          setTimeout(() => { if (copyText) copyText.textContent = "Copy"; }, 2000);
        }).catch(() => {});
      });
    }

    const sendTicketBtn = document.getElementById("sendSupportTicketBtn");
    const ticketSubject = document.getElementById("supportTicketSubject");
    const ticketMsg = document.getElementById("supportTicketMessage");
    const ticketAlert = document.getElementById("supportTicketAlert");

    if (sendTicketBtn) {
      sendTicketBtn.addEventListener("click", async () => {
        const sub = ticketSubject?.value?.trim() || "Support Request";
        const msg = ticketMsg?.value?.trim() || "";
        if (!msg) {
          if (ticketAlert) {
            ticketAlert.textContent = "Please enter your message before sending.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#ff6961";
            ticketAlert.style.background = "rgba(255, 69, 58, 0.12)";
          }
          return;
        }

        sendTicketBtn.disabled = true;
        sendTicketBtn.innerHTML = "<span>Sending ticket...</span>";

        try {
          const res = await fetch("/api/msg?action=support_ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: sub,
              message: msg,
              email: currentUser?.email || "member@ascloud.local",
              username: currentUser?.username || "Member",
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (ticketAlert) {
            ticketAlert.textContent = data.message || "Support ticket dispatched! An automated AI reply will be sent to your email from tanuqna@proton.me.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#34d399";
            ticketAlert.style.background = "rgba(16, 185, 129, 0.12)";
          }
          if (ticketMsg) ticketMsg.value = "";
        } catch (_) {
          if (ticketAlert) {
            ticketAlert.textContent = "Ticket dispatched to tanuqna@proton.me";
            ticketAlert.style.display = "block";
          }
        } finally {
          sendTicketBtn.disabled = false;
          sendTicketBtn.innerHTML = "<span>Send to Support Desk</span>";
        }
      });
    }
  }

  // Support Modal Handlers
  window.openASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (!modal) return;
    const directBtn = document.getElementById("directSupportEmailRedirectBtn");
    if (directBtn) {
      const userParam = currentUser ? ` (@${currentUser.username})` : "";
      directBtn.href = `mailto:tanuqna@proton.me?subject=${encodeURIComponent("AS Cloud Support Request" + userParam)}&body=${encodeURIComponent("Hello AS Cloud Support Team,\n\nAccount: @" + (currentUser?.username || "unregistered") + "\n\nIssue Description:\n")}`;
    }
    modal.style.display = "flex";
  };

  window.closeASSupportModal = function () {
    const modal = document.getElementById("asSupportModal");
    if (modal) modal.style.display = "none";
    const alert = document.getElementById("supportTicketAlert");
    if (alert) alert.style.display = "none";
  };

  function setupSupportModalEvents() {
    const copyBtn = document.getElementById("copySupportEmailBtn");
    const copyText = document.getElementById("copySupportText");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText("tanuqna@proton.me").then(() => {
          if (copyText) copyText.textContent = "Copied!";
          setTimeout(() => { if (copyText) copyText.textContent = "Copy"; }, 2000);
        }).catch(() => {});
      });
    }

    const sendTicketBtn = document.getElementById("sendSupportTicketBtn");
    const ticketSubject = document.getElementById("supportTicketSubject");
    const ticketMsg = document.getElementById("supportTicketMessage");
    const ticketAlert = document.getElementById("supportTicketAlert");

    if (sendTicketBtn) {
      sendTicketBtn.addEventListener("click", async () => {
        const sub = ticketSubject?.value?.trim() || "Support Request";
        const msg = ticketMsg?.value?.trim() || "";
        if (!msg) {
          if (ticketAlert) {
            ticketAlert.textContent = "Please enter your message before sending.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#ff6961";
            ticketAlert.style.background = "rgba(255, 69, 58, 0.12)";
          }
          return;
        }

        sendTicketBtn.disabled = true;
        sendTicketBtn.innerHTML = "<span>Sending ticket...</span>";

        try {
          const res = await fetch("/api/msg?action=support_ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: sub,
              message: msg,
              email: currentUser?.email || "member@ascloud.local",
              username: currentUser?.username || "Member",
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (ticketAlert) {
            ticketAlert.textContent = data.message || "Support ticket dispatched! An automated AI reply will be sent to your email from tanuqna@proton.me.";
            ticketAlert.style.display = "block";
            ticketAlert.style.color = "#34d399";
            ticketAlert.style.background = "rgba(16, 185, 129, 0.12)";
          }
          if (ticketMsg) ticketMsg.value = "";
        } catch (_) {
          if (ticketAlert) {
            ticketAlert.textContent = "Ticket dispatched to tanuqna@proton.me";
            ticketAlert.style.display = "block";
          }
        } finally {
          sendTicketBtn.disabled = false;
          sendTicketBtn.innerHTML = "<span>Send to Support Desk</span>";
        }
      });
    }
  }

  function initAuthSystem() {
    setupAuthEvents();
    setupSupportModalEvents();

    try {
      // Auto-verify if link opened with email verification code
      const urlParams = new URLSearchParams(window.location.search);
      const urlEmail = urlParams.get("email");
      const urlCode = urlParams.get("code");
      if (urlEmail && urlCode) {
        localStorage.setItem("as_invite_cleared", "true");
        showAuthGate();
        switchAuthMode("email");
        if (chatEmailInput) chatEmailInput.value = urlEmail;
        chatActiveEmail = urlEmail;
        if (chatEmailTargetDisplay) chatEmailTargetDisplay.textContent = urlEmail;
        if (chatEmailStepInput) chatEmailStepInput.style.display = "none";
        if (chatEmailStepVerify) chatEmailStepVerify.style.display = "block";
        if (chatEmailCodeInput) chatEmailCodeInput.value = urlCode;
        setTimeout(() => {
          handleChatVerifyEmailCode();
        }, 400);
        return;
      }

      const savedUser = localStorage.getItem("as_user") || localStorage.getItem("as_msg_current_user");
      const savedToken = localStorage.getItem("as_token") || localStorage.getItem("as_msg_token");

      if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        sessionToken = savedToken;
        renderNavProfile();

        // Background session verification
        fetch(`/api/msg?action=verify_session&token=${encodeURIComponent(sessionToken)}`, {
          headers: { Authorization: "Bearer " + sessionToken },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d && d.status === "ok" && d.user) {
              persistSession(d.user, sessionToken);
              renderNavProfile();
              loadCloudSync();
            } else {
              clearSession();
              renderNavProfile();
              showAuthGate("Your session has expired. Please log in again.");
            }
          })
          .catch(() => {
            // Keep local session if network check fails
            loadCloudSync();
          });
      } else {
        // Enforce Gate: Bina login ke use nahi kar sacte
        showAuthGate();
      }
    } catch (_) {
      showAuthGate();
    }
  }

  initAuthSystem();

})();
