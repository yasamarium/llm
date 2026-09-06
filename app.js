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
    "gpt-5": {
      name: "GPT-5",
      badge: "EXCLUSIVE S-62",
      title: "How can GPT-5 help you today?",
      placeholder: "Message GPT-5 (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-gpt5",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l7.5 4.3v8.6L12 21.5l-7.5-6.1V6.8L12 2.5z" stroke-opacity="0.35"/><path d="M12 6.5l4.5 2.6v5.2L12 16.9l-4.5-2.6V9.1L12 6.5z" fill="currentColor" fill-opacity="0.18"/><path d="M12 6.5v10.4M7.5 9.1l9 5.2M7.5 14.3l9-5.2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    },
    "claude-opus-4.8": {
      name: "Claude Opus 4.8",
      badge: "EXCLUSIVE S-62",
      title: "How can Claude Opus help you today?",
      placeholder: "Message Claude Opus 4.8 (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-claude",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.2 6.1 1.9-6.1 1.9L12 22l-1.9-8-6.1-1.9 6.1-1.9L12 2z"/><path d="M6.3 6.3l3.7 1.8-1.8 3.7-3.7-1.8 1.8-3.7zM17.7 6.3l-1.8 3.7 3.7 1.8 1.8-3.7-3.7-1.8zM6.3 17.7l1.8-3.7-3.7-1.8-1.8 3.7 3.7 1.8zM17.7 17.7l-3.7-1.8 1.8-3.7 3.7 1.8-1.8 3.7z" opacity="0.6"/></svg>`,
    },
    "kimi-k2.6": {
      name: "Kimi K2.6",
      badge: "EXCLUSIVE S-62",
      title: "How can Kimi help you today?",
      placeholder: "Message Kimi K2.6 (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-kimi",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fill-opacity="0.2"/><circle cx="16.5" cy="7.5" r="2" fill="currentColor"/><path d="M16.5 3.5v1.8M16.5 9.7v1.8M12.5 7.5h1.8M18.7 7.5h1.8" stroke-width="1.5"/></svg>`,
    },
    "gemini-3-pro": {
      name: "Gemini 3 Pro",
      badge: "EXCLUSIVE S-62",
      title: "How can Gemini 3 Pro help you today?",
      placeholder: "Message Gemini 3 Pro (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-gemini-pro",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z"/><circle cx="12" cy="12" r="2.2" fill="#ffffff" opacity="0.9"/></svg>`,
    },
    "gemini-3.1-pro": {
      name: "Gemini 3.1 Pro",
      badge: "EXCLUSIVE S-62",
      title: "How can Gemini 3.1 Pro help you today?",
      placeholder: "Message Gemini 3.1 Pro (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-gemini-31",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2c0 4.418 3.582 8 8 8-4.418 0-8 3.582-8 8 0-4.418-3.582-8-8-8 4.418 0 8-3.582 8-8z"/><path d="M18.5 13.5c0 2.21 1.79 4 4 4-2.21 0-4 1.79-4 4 0-2.21-1.79-4-4-4 2.21 0 4-1.79 4-4z" opacity="0.85"/><circle cx="10" cy="10" r="1.8" fill="#ffffff" opacity="0.9"/><circle cx="18.5" cy="17.5" r="1" fill="#ffffff" opacity="0.9"/></svg>`,
    },
    "qwen3-max": {
      name: "Qwen 3 Max",
      badge: "EXCLUSIVE S-62",
      title: "How can Qwen 3 Max help you today?",
      placeholder: "Message Qwen 3 Max (Runs on AS cloud EXCLUSIVE S-62)...",
      isExclusive: true,
      symClass: "sym-qwen-max",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8.5 4.9v9.8L12 21.5 3.5 16.7V6.9L12 2z"/><path d="M12 2v9.8m0 0L3.5 6.9m8.5 4.9l8.5-4.9m-8.5 4.9v9.8"/><circle cx="12" cy="11.8" r="2.5" fill="currentColor"/><path d="M8 14.5l4-2.5 4 2.5" stroke-dasharray="1.5 1.5"/></svg>`,
    },
    "1.7b": {
      name: "Qwen Medium",
      badge: "4 Nodes",
      title: "How can Qwen Medium help you?",
      placeholder: "Message Qwen Medium...",
      symClass: "sym-17b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 12 12 22 2 12" fill="currentColor" fill-opacity="0.15"/><polygon points="12 6 18 12 12 18 6 12"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    },
    "r1": {
      name: "DeepSeek High",
      badge: "3 Nodes",
      title: "DeepSeek High (Reasoning)",
      placeholder: "Ask a complex reasoning or logic problem...",
      symClass: "sym-r1",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5" fill="currentColor"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="6" cy="18" r="2.5" fill="currentColor"/><circle cx="18" cy="18" r="2.5" fill="currentColor"/><path d="M6 6l6 6m0 0l6-6M6 18l6-6m0 0l6 6M6 6v12M18 6v12"/></svg>`,
    },
    "llama3b": {
      name: "Llama High",
      badge: "2 Nodes",
      title: "Llama High (Meta)",
      placeholder: "Message Llama High...",
      symClass: "sym-llama3b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.178 8c2.11 0 3.822 1.79 3.822 4s-1.712 4-3.822 4c-2.73 0-4.66-2.58-6.178-4 1.518-1.42 3.448-4 6.178-4z"/><path d="M5.822 8C3.712 8 2 9.79 2 12s1.712 4 3.822 4c2.73 0 4.66-2.58 6.178-4-1.518-1.42-3.448-4-6.178-4z"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
    },
    "qwen3b": {
      name: "Qwen High",
      badge: "2 Nodes",
      title: "Qwen High (Flagship)",
      placeholder: "Message Qwen High...",
      symClass: "sym-qwen3b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>`,
    },
    "coder": {
      name: "Coder High",
      badge: "2 Nodes",
      title: "Coder High (Coding & Architecture)",
      placeholder: "Ask for code, architecture, or debugging...",
      symClass: "sym-coder",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
    },
    "gemma": {
      name: "Gemma Medium",
      badge: "1 Node",
      title: "Gemma Medium (Google)",
      placeholder: "Message Gemma Medium...",
      symClass: "sym-gemma",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 21 2 9" fill="currentColor" fill-opacity="0.12"/><line x1="2" y1="9" x2="22" y2="9"/><polyline points="6 3 12 9 18 3"/><polyline points="12 21 7 9 12 3 17 9 12 21"/></svg>`,
    },
    "math": {
      name: "Math Medium",
      badge: "1 Node",
      title: "Math Medium (Calculations)",
      placeholder: "Enter a math problem or equation...",
      symClass: "sym-math",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4H5l7 8-7 8h14"/><circle cx="17" cy="12" r="1.8" fill="currentColor"/></svg>`,
    },
    "phi": {
      name: "Phi Medium",
      badge: "1 Node",
      title: "Phi Medium (Microsoft)",
      placeholder: "Message Phi Medium...",
      symClass: "sym-phi",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7" fill="currentColor" fill-opacity="0.15"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="12" x2="19" y2="12" stroke-opacity="0.3"/></svg>`,
    },
    "1b": {
      name: "Llama Lightweight",
      badge: "2 Nodes",
      title: "Llama Lightweight",
      placeholder: "Message Llama Lightweight...",
      symClass: "sym-1b",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"/></svg>`,
    },
    "smol": {
      name: "SmolLM Medium",
      badge: "1 Node",
      title: "SmolLM Medium",
      placeholder: "Message SmolLM Medium...",
      symClass: "sym-smol",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C12 22 4 17 4 10a8 8 0 0 1 16 0c0 7-8 12-8 12z" fill="currentColor" fill-opacity="0.15"/><path d="M12 7v10M12 11l4-3M12 14l-3-2"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/></svg>`,
    },
    "0.5b": {
      name: "Qwen Lightweight",
      badge: "2 Nodes",
      title: "Qwen Lightweight",
      placeholder: "Message Qwen Lightweight...",
      symClass: "sym-05b",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 4.76a6 6 0 0 0-8.49 0L3.5 13.01l-.5 7.49 7.49-.5 8.25-8.25a6 6 0 0 0 0-8.49z" fill="currentColor" fill-opacity="0.15"/><line x1="3" y1="21" x2="14" y2="10"/><path d="M10 7l3 3M7 10l3 3M4 13l3 3"/></svg>`,
    },
    "image": {
      name: "Image Generator",
      badge: "2 Nodes",
      title: "What would you like to imagine?",
      placeholder: "Describe an image to generate...",
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

  function renderAssistantBubble(bubbleElement, rawContent, isLive = false, model = selectedModel) {
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
            item.innerHTML = "<span>✅</span><span>Copied!</span>";
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

      // 2. Direct client fallback (prioritize download/yt, then snapsaver)
      if (!data || !data.result) {
        try {
          const directYt = await fetch(`https://apis.davidcyril.name.ng/download/yt?url=${encodeURIComponent(ytUrl)}`, {
            signal: abortController.signal,
          });
          if (directYt.ok) {
            data = await directYt.json();
          }
        } catch (e) {}

        if (!data || !data.result) {
          const directRes = await fetch(`https://apis.davidcyril.name.ng/download/snapsaver?url=${encodeURIComponent(ytUrl)}`, {
            signal: abortController.signal,
          });
          if (!directRes.ok) {
            throw new Error(`Video service returned HTTP ${directRes.status}`);
          }
          data = await directRes.json();
        }
      }

      const res = data?.result || data;
      if (!res) {
        throw new Error("Could not extract media data from this YouTube link.");
      }

      const ytIdMatch = ytUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
      const ytVideoId = ytIdMatch ? ytIdMatch[1] : "";
      const fallbackThumb = ytVideoId ? `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg` : "";

      const title = res.title || "YouTube Video";
      const author = res.author || "YouTube Creator";
      const thumbnail = res.thumbnail || fallbackThumb;
      const duration = res.duration || "";
      const viewsFormatted = res.views ? formatViews(res.views) : "";
      const videos = Array.isArray(res.videos) ? [...res.videos] : [];
      const audios = Array.isArray(res.audios) ? [...res.audios] : [];

      if (res.download_url && !videos.some((v) => v.url === res.download_url)) {
        videos.unshift({
          url: res.download_url,
          quality: res.quality || "720p",
          format: res.format || "mp4",
        });
      }

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
            <div class="edit-prompt-text">✨ "${escapeHtml(finalPrompt)}"</div>
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
        `Hello! I am **${modelName}**, running on **AS Cloud (EXCLUSIVE S-62)**. How can I assist you today?`,
        `Greetings! **${modelName}** is active on **AS Cloud (EXCLUSIVE S-62)**. What would you like to explore or solve?`,
        `Welcome! **${modelName} (EXCLUSIVE S-62)** is ready. Ask any question, brainstorm ideas, or generate code.`,
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
        <span class="sakura-icon left">🌸</span>
        <span class="sakura-text">Aw? Wait wait!</span>
        <span class="sakura-icon right">🌸</span>
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
      <div class="chrono-stars-accent">✦ &nbsp; ✦ &nbsp; ✦</div>
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

    // 4. Instant Preset Reply for Greetings (HI, hello, hey, etc.) - Never queries model!
    if (isGreeting(text)) {
      appendMessage("user", text);
      conversation.push({ role: "user", content: text });

      const assistantBubble = appendMessage("assistant", "");
      const reply = getPresetGreetingReply(selectedModel);
      conversation.push({ role: "assistant", content: reply });

      triggerHaptic("light");

      let charIndex = 0;
      const step = 3;
      const timer = setInterval(() => {
        charIndex += step;
        const currentSlice = reply.slice(0, charIndex);
        renderAssistantBubble(assistantBubble, currentSlice, charIndex < reply.length, selectedModel);
        smoothScrollToBottom();
        if (charIndex >= reply.length) {
          clearInterval(timer);
          renderAssistantBubble(assistantBubble, reply, false, selectedModel);
        }
      }, 14);
      return;
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

  // Initialize
  syncVisualViewport();
  autoResizeInput();
  checkConnection();
})();
