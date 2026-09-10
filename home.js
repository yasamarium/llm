// home.js - AS Messages Real-Time Cloud Messaging Client (iOS Themed)
// Connected to yasamarium/msg-db-users, msg-db-messages, msg-db-rooms & msg-media-storage
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Vector SVG Icons Registry (Strictly Zero Emojis)
  // ---------------------------------------------------------------------------
  const ICONS = {
    checkSingle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkDouble: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 9 17 4 12"/><polyline points="22 10 13 19 11 17"/></svg>`,
    play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    verified: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#0a84ff"><path d="M12 2l2.4 2.8 3.7-.4 1.2 3.5 3.4 1.6-1.1 3.5 1.1 3.5-3.4 1.6-1.2 3.5-3.7-.4L12 22l-2.4-2.8-3.7.4-1.2-3.5-3.4-1.6 1.1-3.5-1.1-3.5 3.4-1.6 1.2-3.5 3.7.4L12 2z"/><path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    userPlus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    eyeOpen: `<svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    reply: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
  };

  // ---------------------------------------------------------------------------
  // iOS Initial Avatar & Palette System (Blue, Pink, Purple, Red)
  // ---------------------------------------------------------------------------
  const IOS_ACCENT_COLORS = ["init-blue", "init-pink", "init-purple", "init-red"];

  function getAvatarColorClass(str) {
    if (!str) return IOS_ACCENT_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return IOS_ACCENT_COLORS[hash % IOS_ACCENT_COLORS.length];
  }

  function getInitialLetter(name, fallback = "U") {
    const clean = (name || fallback).replace(/^@+/, "").trim();
    return (clean[0] || fallback).toUpperCase();
  }

  function renderAvatarHtml(name, pfp, sizeClass = "avatar-md", extraClasses = "") {
    const safeName = escapeHtml(name || "User");
    const initial = getInitialLetter(name);
    const colorClass = getAvatarColorClass(name);

    if (pfp && typeof pfp === "string" && !pfp.includes("unsplash.com") && pfp.trim().length > 0) {
      const safeUrl = escapeHtml(pfp.trim());
      return `<img class="user-avatar-img ${sizeClass} ${extraClasses}" src="${safeUrl}" alt="${safeName}" onerror="this.onerror=null; this.outerHTML='<div class=\\'initial-avatar ${sizeClass} ${colorClass} ${extraClasses}\\'>${initial}</div>'">`;
    }

    return `<div class="initial-avatar ${sizeClass} ${colorClass} ${extraClasses}">${initial}</div>`;
  }

  // Telegram/WhatsApp group chat distinctive sender colors
  const SENDER_COLORS = [
    "#0a84ff", // iOS Blue
    "#ff375f", // iOS Pink
    "#bf5af2", // iOS Purple
    "#ff453a", // iOS Red
    "#30d158", // iOS Green
    "#5e5ce6", // iOS Indigo
    "#64d2ff", // iOS Cyan
    "#ffd60a", // iOS Yellow
    "#ff9f0a", // iOS Orange
    "#ac8e68", // iOS Brown
  ];

  function getSenderColor(name) {
    if (!name) return SENDER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return SENDER_COLORS[hash % SENDER_COLORS.length];
  }

  // ---------------------------------------------------------------------------
  // Web Audio Synthesized Chimes (Sent / Received)
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChime(type = "sent") {
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
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.setValueAtTime(940, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Session State
  // ---------------------------------------------------------------------------
  let currentUser = null;
  let sessionToken = null;

  try {
    const savedUser = localStorage.getItem("as_msg_current_user");
    const savedToken = localStorage.getItem("as_msg_token");
    if (savedUser && savedToken) {
      currentUser = JSON.parse(savedUser);
      sessionToken = savedToken;
      if (currentUser.username === "cloud_pilot") {
        currentUser = null;
        sessionToken = null;
        localStorage.removeItem("as_msg_current_user");
        localStorage.removeItem("as_msg_token");
      }
    }
  } catch (_) {}

  // ---------------------------------------------------------------------------
  // DOM References
  // ---------------------------------------------------------------------------
  const msgWorkspace = document.getElementById("msgWorkspace");
  const msgSidebar = document.getElementById("msgSidebar");
  const msgChatPane = document.getElementById("msgChatPane");
  const conversationList = document.getElementById("conversationList");
  const chatSearchInput = document.getElementById("chatSearchInput");
  const openNewChatBtn = document.getElementById("openNewChatBtn");
  const mobileBackBtn = document.getElementById("mobileBackBtn");

  // Navigation Left Rail Profile
  const userProfileChip = document.getElementById("userProfileChip");
  const navUserAvatarSlot = document.getElementById("navUserAvatarSlot");
  const navDisplayName = document.getElementById("navDisplayName");
  const navUsername = document.getElementById("navUsername");
  const relayStatusText = document.getElementById("relayStatusText");

  // Chat Header Elements
  const chatHeaderProfile = document.getElementById("chatHeaderProfile");
  const activeContactAvatarSlot = document.getElementById("activeContactAvatarSlot");
  const activeContactStatusDot = null;
  const activeContactName = document.getElementById("activeContactName");
  const activeContactHandle = document.getElementById("activeContactHandle");
  const activeContactStatus = null;
  const activeVerifiedBadge = document.getElementById("activeVerifiedBadge");
  const openContactInfoBtn = document.getElementById("openContactInfoBtn");

  // Message Container
  const chatMessagesContainer = document.getElementById("chatMessagesContainer");
  const messagesFlow = document.getElementById("messagesFlow");
  const scrollBottomBtn = document.getElementById("scrollBottomBtn");

  // Composer Elements
  const composerCapsule = document.getElementById("composerCapsule");
  const messageTextInput = document.getElementById("messageTextInput");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const attachMediaBtn = document.getElementById("attachMediaBtn");
  const mediaFileInput = document.getElementById("mediaFileInput");
  const voiceRecordBtn = document.getElementById("voiceRecordBtn");
  const recordingLiveBar = document.getElementById("recordingLiveBar");
  const recordingTime = document.getElementById("recordingTime");
  const cancelRecordBtn = document.getElementById("cancelRecordBtn");
  const sendRecordBtn = document.getElementById("sendRecordBtn");

  // Reply Banner Elements
  const composerReplyBanner = document.getElementById("composerReplyBanner");
  const replyBannerTitle = document.getElementById("replyBannerTitle");
  const replyBannerSnippet = document.getElementById("replyBannerSnippet");
  const closeReplyBannerBtn = document.getElementById("closeReplyBannerBtn");

  // Blocked Banner Elements
  const composerBlockedBanner = document.getElementById("composerBlockedBanner");
  const composerBlockedText = document.getElementById("composerBlockedText");
  const composerUnblockBtn = document.getElementById("composerUnblockBtn");

  // Media Preview Modal Elements
  const mediaPreviewModal = document.getElementById("mediaPreviewModal");
  const mediaPreviewImage = document.getElementById("mediaPreviewImage");
  const mediaPreviewFileInfo = document.getElementById("mediaPreviewFileInfo");
  const mediaPreviewFileName = document.getElementById("mediaPreviewFileName");
  const mediaPreviewFileSize = document.getElementById("mediaPreviewFileSize");
  const mediaPreviewCaption = document.getElementById("mediaPreviewCaption");
  const cancelMediaPreviewBtn = document.getElementById("cancelMediaPreviewBtn");
  const discardMediaBtn = document.getElementById("discardMediaBtn");
  const sendMediaPreviewBtn = document.getElementById("sendMediaPreviewBtn");
  const sendMediaBtnText = document.getElementById("sendMediaBtnText");

  // Settings Blocklist Container
  const settingsBlocklistContainer = document.getElementById("settingsBlocklistContainer");

  // iOS Two-Step Confirmation Modal Elements
  const twoStepConfirmModal = document.getElementById("twoStepConfirmModal");
  const twoStepBadge = document.getElementById("twoStepBadge");
  const twoStepIconWrap = document.getElementById("twoStepIconWrap");
  const twoStepTitle = document.getElementById("twoStepTitle");
  const twoStepDesc = document.getElementById("twoStepDesc");
  const twoStepCancelBtn = document.getElementById("twoStepCancelBtn");
  const twoStepPrimaryBtn = document.getElementById("twoStepPrimaryBtn");
  const closeTwoStepModalBtn = document.getElementById("closeTwoStepModalBtn");

  // Active Reply State
  let activeReply = null;

  // Instagram-Style Auth Elements
  const authOverlay = document.getElementById("authOverlay");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const authErrorBanner = document.getElementById("authErrorBanner");
  const authErrorText = document.getElementById("authErrorText");

  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  const switchToSignupBtn = document.getElementById("switchToSignupBtn");

  const signupAvatarSlot = document.getElementById("signupAvatarSlot");
  const signupAvatarUploadBtn = document.getElementById("signupAvatarUploadBtn");
  const signupAvatarFileInput = document.getElementById("signupAvatarFileInput");
  const signupUsername = document.getElementById("signupUsername");
  const signupDisplayName = document.getElementById("signupDisplayName");
  const signupPassword = document.getElementById("signupPassword");
  const signupBio = document.getElementById("signupBio");
  const signupSubmitBtn = document.getElementById("signupSubmitBtn");
  const switchToLoginBtn = document.getElementById("switchToLoginBtn");

  let signupUploadedPfp = null;

  // Profile Modal Elements
  const profileModal = document.getElementById("profileModal");
  const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
  const editPfpSlot = document.getElementById("editPfpSlot");
  const uploadPfpTrigger = document.getElementById("uploadPfpTrigger");
  const pfpFileInput = document.getElementById("pfpFileInput");
  const removePfpBtn = document.getElementById("removePfpBtn");
  const inputUsername = document.getElementById("inputUsername");
  const inputDisplayName = document.getElementById("inputDisplayName");
  const inputBio = document.getElementById("inputBio");
  const inputOldPassword = document.getElementById("inputOldPassword");
  const inputNewPassword = document.getElementById("inputNewPassword");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let profileEditUploadedPfp = undefined; // undefined = keep, null = remove, string = new url

  // Contact Info Sheet Modal Elements
  const contactInfoModal = document.getElementById("contactInfoModal");
  const closeContactInfoBtn = document.getElementById("closeContactInfoBtn");
  const contactSheetAvatarSlot = document.getElementById("contactSheetAvatarSlot");
  const contactSheetStatusDot = null;
  const contactSheetName = document.getElementById("contactSheetName");
  const contactSheetHandle = document.getElementById("contactSheetHandle");
  const contactSheetVerified = document.getElementById("contactSheetVerified");
  const copyContactHandleBtn = document.getElementById("copyContactHandleBtn");
  const copyHandleText = document.getElementById("copyHandleText");
  const contactSheetStatusPill = null;
  const contactSheetJoinDate = document.getElementById("contactSheetJoinDate");
  const contactSheetBio = document.getElementById("contactSheetBio");
  const contactSheetActions = document.getElementById("contactSheetActions");

  // New Chat Modal Elements
  const newChatModal = document.getElementById("newChatModal");
  const closeNewChatModalBtn = document.getElementById("closeNewChatModalBtn");
  const newChatHandleInput = document.getElementById("newChatHandleInput");
  const quickContactsList = document.getElementById("quickContactsList");
  const startChatByHandleBtn = document.getElementById("startChatByHandleBtn");

  // Media Lightbox Elements
  const mediaLightbox = document.getElementById("mediaLightbox");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");

  // ---------------------------------------------------------------------------
  // Conversation & Sync State
  // ---------------------------------------------------------------------------
  let activeConvoId = "general";
  let activeConvoMeta = {
    id: "general",
    type: "channel",
    handle: "general",
    name: "Global Lounge",
    pfp: null,
    status: "Active Community",
    verified: true,
    createdAt: 1788880000000,
    bio: "The public lounge for all AS Cloud community members.",
  };
  let conversations = [];
  let loadedMessageIds = new Set();
  let lastMessageTimestamp = 0;

  // ---------------------------------------------------------------------------
  // Client-Side Fast Storage Cache (Instant 0ms UI, zero lag, no disappearing chats)
  // ---------------------------------------------------------------------------
  function getLocalConvosKey() {
    return currentUser ? `as_msg_convos_${currentUser.username.toLowerCase()}` : "as_msg_convos_guest";
  }

  function getLocalChatMsgsKey(chatId) {
    return `as_msg_chat_${chatId}`;
  }

  function loadLocalConvos() {
    try {
      const raw = localStorage.getItem(getLocalConvosKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          conversations = parsed;
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  function saveLocalConvos() {
    try {
      if (currentUser && Array.isArray(conversations)) {
        localStorage.setItem(getLocalConvosKey(), JSON.stringify(conversations));
      }
    } catch (_) {}
  }

  let chatSessionCounter = 0;

  function loadLocalChatMessages(chatId) {
    if (!chatId) return [];
    try {
      const raw = localStorage.getItem(getLocalChatMsgsKey(chatId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Strictly purge any foreign messages that do not belong to this chatId
          const cleaned = parsed.filter((m) => {
            if (!m || !m.id) return false;
            if (m.chatId && m.chatId !== chatId) return false;
            if (chatId.startsWith("dm_")) {
              const parts = chatId.replace("dm_", "").split("__");
              const s = (m.sender || "").toLowerCase();
              const r = (m.recipient || "").toLowerCase();
              if (s && !parts.includes(s)) return false;
              if (r && !parts.includes(r)) return false;
            }
            return true;
          });
          if (cleaned.length !== parsed.length) {
            saveLocalChatMessages(chatId, cleaned);
          }
          return cleaned;
        }
      }
    } catch (_) {}
    return [];
  }

  function saveLocalChatMessages(chatId, msgs) {
    try {
      if (chatId && Array.isArray(msgs)) {
        const tagged = msgs
          .filter((m) => m && m.id && (!m.chatId || m.chatId === chatId))
          .map((m) => (m.chatId ? m : { ...m, chatId }));
        const slice = tagged.slice(-150);
        localStorage.setItem(getLocalChatMsgsKey(chatId), JSON.stringify(slice));
      }
    } catch (_) {}
  }

  function appendLocalChatMessage(chatId, newMsg) {
    if (!chatId || !newMsg || !newMsg.id) return;
    if (newMsg.chatId && newMsg.chatId !== chatId) return;
    try {
      const existing = loadLocalChatMessages(chatId);
      if (!existing.some((m) => m.id === newMsg.id)) {
        existing.push({ ...newMsg, chatId });
        saveLocalChatMessages(chatId, existing);
      }
    } catch (_) {}
  }

  function renderLoadingSkeleton() {
    return `
      <div class="chat-loading-skeleton" id="chatLoadingSkeleton" aria-label="Loading messages">
        <div class="skeleton-bubble incoming">
          <div class="skeleton-line" style="width: 140px;"></div>
          <div class="skeleton-line" style="width: 85px;"></div>
        </div>
        <div class="skeleton-bubble outgoing">
          <div class="skeleton-line" style="width: 165px;"></div>
        </div>
        <div class="skeleton-bubble incoming">
          <div class="skeleton-line" style="width: 210px;"></div>
          <div class="skeleton-line" style="width: 110px;"></div>
        </div>
        <div class="skeleton-bubble outgoing">
          <div class="skeleton-line" style="width: 130px;"></div>
          <div class="skeleton-line" style="width: 75px;"></div>
        </div>
      </div>
    `;
  }

  let syncInterval = null;
  let isPolling = false;

  // ---------------------------------------------------------------------------
  // Date & Format Helpers
  // ---------------------------------------------------------------------------
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function formatWhatsAppDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[date.getDay()];
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatJoinDate(timestamp) {
    if (!timestamp) return "September 2026";
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "September 2026";
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const day = d.getDate();
    return `Joined ${day} ${month} ${year}`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------------------------------------------------------------------------
  // Authentication Handlers
  // ---------------------------------------------------------------------------
  function showAuthOverlay(mode = "login") {
    if (!authOverlay) return;
    authOverlay.style.display = "flex";
    hideAuthError();

    if (mode === "login") {
      tabLogin.classList.add("active");
      tabSignup.classList.remove("active");
      loginForm.style.display = "flex";
      signupForm.style.display = "none";
      if (loginUsername) loginUsername.focus();
    } else {
      tabSignup.classList.add("active");
      tabLogin.classList.remove("active");
      loginForm.style.display = "none";
      signupForm.style.display = "flex";
      signupUploadedPfp = null;
      updateSignupAvatarPreview();
      if (signupUsername) signupUsername.focus();
    }
  }

  function hideAuthOverlay() {
    if (authOverlay) authOverlay.style.display = "none";
  }

  function showAuthError(msg) {
    if (authErrorBanner && authErrorText) {
      authErrorText.textContent = msg;
      authErrorBanner.style.display = "flex";
    }
  }

  function hideAuthError() {
    if (authErrorBanner) authErrorBanner.style.display = "none";
  }

  if (tabLogin) tabLogin.addEventListener("click", () => showAuthOverlay("login"));
  if (tabSignup) tabSignup.addEventListener("click", () => showAuthOverlay("signup"));
  if (switchToSignupBtn) switchToSignupBtn.addEventListener("click", () => showAuthOverlay("signup"));
  if (switchToLoginBtn) switchToLoginBtn.addEventListener("click", () => showAuthOverlay("login"));

  // Password Visibility Toggle
  document.querySelectorAll(".toggle-password-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = ICONS.eyeOff;
      } else {
        input.type = "password";
        btn.innerHTML = ICONS.eyeOpen;
      }
    });
  });

  // Dynamic Signup Avatar Initial Update
  function updateSignupAvatarPreview() {
    if (!signupAvatarSlot) return;
    if (signupUploadedPfp) {
      signupAvatarSlot.innerHTML = `<img class="user-avatar-img avatar-xl" src="${escapeHtml(signupUploadedPfp)}" alt="Avatar">`;
      return;
    }
    const name = (signupDisplayName?.value || signupUsername?.value || "?").trim();
    signupAvatarSlot.innerHTML = renderAvatarHtml(name, null, "avatar-xl");
  }

  if (signupUsername) {
    signupUsername.addEventListener("input", () => {
      if (!signupUploadedPfp) updateSignupAvatarPreview();
    });
  }
  if (signupDisplayName) {
    signupDisplayName.addEventListener("input", () => {
      if (!signupUploadedPfp) updateSignupAvatarPreview();
    });
  }

  if (signupAvatarUploadBtn && signupAvatarFileInput) {
    signupAvatarUploadBtn.addEventListener("click", () => signupAvatarFileInput.click());
    signupAvatarFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        signupUploadedPfp = base64;
        updateSignupAvatarPreview();

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              filename: `pfp_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`,
              contentType: file.type,
              target: "msg-media-storage",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.proxyUrl) {
              signupUploadedPfp = data.proxyUrl;
              updateSignupAvatarPreview();
            }
          }
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Log In
  async function handleLogin() {
    const handle = (loginUsername?.value || "").toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    const pass = loginPassword?.value || "";

    if (!handle) {
      showAuthError("Please enter your username.");
      return;
    }
    if (!pass) {
      showAuthError("Please enter your password.");
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = "Logging In...";
    hideAuthError();

    try {
      const res = await fetch("/api/msg?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: handle, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      currentUser = data.user;
      sessionToken = data.token;
      localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));
      localStorage.setItem("as_msg_token", sessionToken);

      hideAuthOverlay();
      renderNavProfile();

      await loadConversations();
      await openChat(activeConvoId);
      startSyncEngine();
    } catch (err) {
      showAuthError(err.message);
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "Log In";
    }
  }

  if (loginSubmitBtn) loginSubmitBtn.addEventListener("click", handleLogin);
  if (loginPassword) {
    loginPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  // Handle Sign Up (No preset avatars)
  async function handleSignup() {
    const handle = (signupUsername?.value || "").toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    const displayName = (signupDisplayName?.value || "").trim() || handle;
    const pass = signupPassword?.value || "";
    const bio = (signupBio?.value || "").trim();
    const pfp = signupUploadedPfp || null; // Null so name's initial avatar shows!

    if (!handle || handle.length < 3) {
      showAuthError("Username must be at least 3 characters (letters, numbers, underscores).");
      return;
    }
    if (!pass || pass.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      return;
    }

    signupSubmitBtn.disabled = true;
    signupSubmitBtn.textContent = "Creating Account...";
    hideAuthError();

    try {
      const res = await fetch("/api/msg?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          username: handle,
          password: pass,
          displayName,
          bio,
          pfp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      currentUser = data.user;
      sessionToken = data.token;
      localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));
      localStorage.setItem("as_msg_token", sessionToken);

      hideAuthOverlay();
      renderNavProfile();

      await loadConversations();
      await openChat(activeConvoId);
      startSyncEngine();
    } catch (err) {
      showAuthError(err.message);
    } finally {
      signupSubmitBtn.disabled = false;
      signupSubmitBtn.textContent = "Create Account";
    }
  }

  if (signupSubmitBtn) signupSubmitBtn.addEventListener("click", handleSignup);
  if (signupPassword) {
    signupPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSignup();
    });
  }

  // Handle Log Out
  function handleLogout() {
    if (!confirm("Are you sure you want to log out of AS Messages?")) return;

    currentUser = null;
    sessionToken = null;
    localStorage.removeItem("as_msg_current_user");
    localStorage.removeItem("as_msg_token");

    stopSyncEngine();

    if (conversationList) conversationList.innerHTML = "";
    if (messagesFlow) messagesFlow.innerHTML = "";
    closeProfileModal();
    closeContactInfo();
    showAuthOverlay("login");
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  // ---------------------------------------------------------------------------
  // Profile Settings Modal Handlers
  // ---------------------------------------------------------------------------
  function openProfileModal() {
    if (!profileModal || !currentUser) return;
    profileModal.style.display = "flex";
    profileEditUploadedPfp = undefined;

    renderProfileEditAvatar();

    if (inputUsername) {
      inputUsername.value = currentUser.username;
      inputUsername.disabled = true;
    }
    if (inputDisplayName) inputDisplayName.value = currentUser.displayName || "";
    if (inputBio) inputBio.value = currentUser.bio || "";
    if (inputOldPassword) inputOldPassword.value = "";
    if (inputNewPassword) inputNewPassword.value = "";

    renderSettingsBlocklist();
  }

  function closeProfileModal() {
    if (profileModal) profileModal.style.display = "none";
  }

  function renderProfileEditAvatar() {
    if (!editPfpSlot || !currentUser) return;
    const currentPfp = profileEditUploadedPfp !== undefined ? profileEditUploadedPfp : currentUser.pfp;
    const name = currentUser.displayName || currentUser.username;
    editPfpSlot.innerHTML = renderAvatarHtml(name, currentPfp, "avatar-xl");

    if (removePfpBtn) {
      removePfpBtn.style.display = currentPfp ? "inline-block" : "none";
    }
  }

  if (removePfpBtn) {
    removePfpBtn.addEventListener("click", () => {
      profileEditUploadedPfp = null;
      renderProfileEditAvatar();
    });
  }

  if (uploadPfpTrigger && pfpFileInput) {
    uploadPfpTrigger.addEventListener("click", () => pfpFileInput.click());
    pfpFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        profileEditUploadedPfp = base64;
        renderProfileEditAvatar();

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              filename: `pfp_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`,
              contentType: file.type,
              target: "msg-media-storage",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.proxyUrl) {
              profileEditUploadedPfp = data.proxyUrl;
              renderProfileEditAvatar();
            }
          }
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSaveProfile() {
    if (!currentUser || !sessionToken) return;

    const displayName = (inputDisplayName?.value || "").trim() || currentUser.username;
    const bio = (inputBio?.value || "").trim();
    const oldPassword = inputOldPassword?.value || "";
    const newPassword = inputNewPassword?.value || "";

    if (newPassword && newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    let finalPfp = currentUser.pfp;
    if (profileEditUploadedPfp !== undefined) {
      finalPfp = profileEditUploadedPfp === null ? "remove" : profileEditUploadedPfp;
    }

    try {
      const res = await fetch("/api/msg?action=update_profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          action: "update_profile",
          token: sessionToken,
          displayName,
          bio,
          pfp: finalPfp,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      currentUser = data.user;
      localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));

      renderNavProfile();
      closeProfileModal();
      loadConversations();
    } catch (err) {
      alert("Could not update profile: " + err.message);
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Changes";
    }
  }

  if (saveProfileBtn) saveProfileBtn.addEventListener("click", handleSaveProfile);
  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeProfileModal);
  if (userProfileChip) userProfileChip.addEventListener("click", openProfileModal);

  function renderNavProfile() {
    if (!currentUser) return;
    if (navUserAvatarSlot) {
      const name = currentUser.displayName || currentUser.username;
      navUserAvatarSlot.innerHTML = renderAvatarHtml(name, currentUser.pfp, "avatar-sm");
    }
    if (navDisplayName) navDisplayName.textContent = currentUser.displayName || currentUser.username;
    if (navUsername) navUsername.textContent = `@${currentUser.username}`;
  }

  // ---------------------------------------------------------------------------
  // Contact Info & Profile Sheet Modal (iOS Style with Joining Date)
  // ---------------------------------------------------------------------------
  async function openContactInfo(contactMeta) {
    if (!contactInfoModal) return;

    let target = contactMeta || activeConvoMeta;
    if (!target) return;

    contactInfoModal.style.display = "flex";

    // Immediate optimistic populate
    populateContactSheetData(target);

    // Fetch fresh user profile if direct chat to guarantee live createdAt & bio
    if (target.type === "direct" && target.handle) {
      try {
        const res = await fetch(`/api/msg?action=get_user&username=${encodeURIComponent(target.handle)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            target = {
              ...target,
              ...data.user,
              handle: data.user.username,
              name: data.user.displayName || data.user.username,
            };
            populateContactSheetData(target);
          }
        }
      } catch (_) {}
    }
  }

  function populateContactSheetData(target) {
    const isChannel = target.type === "channel" || target.id === "general";
    const name = target.name || target.handle || "User";
    const handle = target.handle || target.id || "username";
    const isSelf = currentUser && handle.toLowerCase() === currentUser.username.toLowerCase();

    // Render Avatar / Initial
    if (contactSheetAvatarSlot) {
      contactSheetAvatarSlot.innerHTML = renderAvatarHtml(name, target.pfp, "avatar-xl");
    }



    // Name & Verified
    if (contactSheetName) contactSheetName.textContent = name;
    if (contactSheetVerified) contactSheetVerified.style.display = target.verified ? "inline-flex" : "none";

    // Handle
    if (contactSheetHandle) contactSheetHandle.textContent = `@${handle}`;
    if (copyContactHandleBtn) {
      copyContactHandleBtn.onclick = () => {
        navigator.clipboard.writeText(`@${handle}`);
        if (copyHandleText) copyHandleText.textContent = "Copied!";
        setTimeout(() => {
          if (copyHandleText) copyHandleText.textContent = "Copy";
        }, 1800);
      };
    }



    // Joining Date
    if (contactSheetJoinDate) {
      contactSheetJoinDate.textContent = formatJoinDate(target.createdAt);
    }

    // About / Bio
    if (contactSheetBio) {
      contactSheetBio.textContent = target.bio || (isChannel ? "AS Cloud Public Community Room" : "Available on AS Messages");
    }

    // Action buttons
    if (contactSheetActions) {
      if (isSelf) {
        contactSheetActions.innerHTML = `
          <button class="modal-primary-btn" id="sheetEditProfileBtn" type="button">Edit Profile</button>
          <button class="modal-secondary-btn" id="sheetLogoutBtn" type="button">Log Out</button>
        `;
        const editBtn = document.getElementById("sheetEditProfileBtn");
        const outBtn = document.getElementById("sheetLogoutBtn");
        if (editBtn) editBtn.onclick = () => { closeContactInfo(); openProfileModal(); };
        if (outBtn) outBtn.onclick = () => { closeContactInfo(); handleLogout(); };
      } else {
        const cleanTarget = handle.toLowerCase();
        const isBlocked = Array.isArray(currentUser?.blockedUsers) && currentUser.blockedUsers.includes(cleanTarget);
        contactSheetActions.innerHTML = `
          <button class="modal-primary-btn" id="sheetDirectMsgBtn" type="button">Message</button>
          <button class="modal-secondary-btn" id="sheetCloseBtn" type="button">Done</button>
          ${!isChannel ? `
            <button id="sheetBlockBtn" class="sheet-block-btn ${isBlocked ? "unblock" : "block"}" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              <span>${isBlocked ? `Unblock @${handle}` : `Block @${handle}`}</span>
            </button>
          ` : ""}
        `;
        const msgBtn = document.getElementById("sheetDirectMsgBtn");
        const doneBtn = document.getElementById("sheetCloseBtn");
        const blockBtn = document.getElementById("sheetBlockBtn");
        if (msgBtn) msgBtn.onclick = () => {
          closeContactInfo();
          if (activeConvoId !== target.id) {
            startDirectChat(handle, name, target.pfp);
          }
        };
        if (doneBtn) doneBtn.onclick = closeContactInfo;
        if (blockBtn) blockBtn.onclick = () => toggleBlockUser(handle);
      }
    }
  }

  function closeContactInfo() {
    if (contactInfoModal) contactInfoModal.style.display = "none";
  }

  if (closeContactInfoBtn) closeContactInfoBtn.addEventListener("click", closeContactInfo);
  if (chatHeaderProfile) chatHeaderProfile.addEventListener("click", () => openContactInfo(activeConvoMeta));
  if (openContactInfoBtn) openContactInfoBtn.addEventListener("click", () => openContactInfo(activeConvoMeta));

  // ---------------------------------------------------------------------------
  // Load Conversations List
  // ---------------------------------------------------------------------------
  function mergeConversations(serverConvos) {
    const map = new Map();
    // 1. Preserve all existing local conversations
    for (const c of conversations) {
      if (c && c.id) map.set(c.id, c);
    }
    // 2. Merge server conversations
    if (Array.isArray(serverConvos)) {
      for (const sc of serverConvos) {
        if (!sc || !sc.id) continue;
        const local = map.get(sc.id);
        if (!local) {
          map.set(sc.id, sc);
        } else {
          const localTime = local.lastMessage?.time || 0;
          const serverTime = sc.lastMessage?.time || 0;
          if (serverTime >= localTime) {
            map.set(sc.id, { ...local, ...sc });
          } else {
            map.set(sc.id, { ...sc, lastMessage: local.lastMessage });
          }
        }
      }
    }
    conversations = Array.from(map.values()).sort((a, b) => {
      const tA = a.lastMessage?.time || 0;
      const tB = b.lastMessage?.time || 0;
      return tB - tA;
    });
    saveLocalConvos();
    renderConversationList();
  }

  function updateLocalConversationPreview(chatId, lastMsg, contactMeta = null) {
    if (!chatId) return;
    let found = conversations.find(c => c.id === chatId);
    const meta = contactMeta || activeConvoMeta;
    if (found) {
      found.lastMessage = lastMsg;
      if (meta && meta.name) found.name = meta.name;
      if (meta && meta.pfp) found.pfp = meta.pfp;
      conversations = [found, ...conversations.filter(c => c.id !== chatId)];
    } else if (meta) {
      found = {
        id: chatId,
        type: meta.type || (chatId.startsWith("dm_") ? "direct" : "channel"),
        handle: meta.handle || meta.id,
        name: meta.name || meta.handle || meta.id,
        pfp: meta.pfp || null,
        verified: !!meta.verified,
        lastMessage: lastMsg,
        unread: 0,
      };
      conversations = [found, ...conversations];
    }
    saveLocalConvos();
    renderConversationList();
  }

  async function loadConversations() {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/msg?action=get_conversations&username=${encodeURIComponent(currentUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          mergeConversations(data.conversations);
        }
      }
    } catch (err) {
      console.warn("Error background loading conversations:", err);
    }
  }

  function renderConversationList() {
    if (!conversationList) return;

    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <div class="empty-state-card" style="padding: 30px 20px; text-align: center; color: var(--text-secondary);">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: var(--accent-blue);">
            ${ICONS.userPlus}
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">No chats yet</div>
          <div style="font-size: 12px; line-height: 1.4; margin-bottom: 16px;">Search any @username to start a direct message or join Global Lounge.</div>
          <button class="modal-primary-btn" id="emptyStartChatBtn" type="button" style="padding: 8px 16px; font-size: 12px;">Start New Chat</button>
        </div>
      `;
      const btn = document.getElementById("emptyStartChatBtn");
      if (btn) btn.addEventListener("click", openNewChatModal);
      return;
    }

    conversationList.innerHTML = conversations.map((c) => {
      const isActive = c.id === activeConvoId;
      const lastMsg = c.lastMessage;
      let previewText = "No messages yet";
      if (lastMsg) {
        if (lastMsg.mediaType === "image") previewText = "Photo attachment";
        else if (lastMsg.mediaType === "audio") previewText = "Voice note";
        else previewText = lastMsg.text || "";
      }

      const timeStr = lastMsg?.time ? formatWhatsAppDate(lastMsg.time) : "";
      const isUnread = (c.unread || 0) > 0;
      const avatarHtml = renderAvatarHtml(c.name || c.handle, c.pfp, "avatar-lg");

      return `
        <div class="convo-item ${isActive ? "active" : ""} ${isUnread ? "unread" : ""}" data-id="${c.id}">
          <div class="convo-pfp-wrap">
            ${avatarHtml}
          </div>
          <div class="convo-meta">
            <div class="convo-row-top">
              <span class="convo-name">${escapeHtml(c.name || c.handle)}</span>
              ${c.verified ? `<span class="verified-glyph">${ICONS.verified}</span>` : ""}
              <span class="convo-time">${timeStr}</span>
            </div>
            <div class="convo-row-bot">
              <span class="convo-snippet">${escapeHtml(previewText)}</span>
              ${isUnread ? `<span class="convo-unread-pill">${c.unread}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    conversationList.querySelectorAll(".convo-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        openChat(id);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Open and Switch Active Chat
  // ---------------------------------------------------------------------------
  async function openChat(chatId, newContactMeta = null) {
    const sessionToken = ++chatSessionCounter;
    activeConvoId = chatId;

    let meta = conversations.find((c) => c.id === chatId) || newContactMeta;
    if (!meta && chatId === "general") {
      meta = {
        id: "general",
        type: "channel",
        handle: "general",
        name: "Global Lounge",
        pfp: null,
        verified: true,
        createdAt: 1788880000000,
        bio: "The public lounge for all AS Cloud community members.",
      };
    } else if (!meta) {
      meta = {
        id: chatId,
        type: "direct",
        handle: chatId.replace("dm_", "").replace("__", " & "),
        name: chatId,
        pfp: null,
        createdAt: Date.now(),
        bio: "Available on AS Messages",
      };
    }
    activeConvoMeta = meta;

    // Abort pending long-poll for prior chat so new chat connects immediately
    if (longPollAbortCtrl) {
      try { longPollAbortCtrl.abort(); } catch (_) {}
    }

    cancelReply();
    updateComposerBlockedState();

    // Render active contact avatar in header
    if (activeContactAvatarSlot) {
      activeContactAvatarSlot.innerHTML = renderAvatarHtml(meta.name || meta.handle, meta.pfp, "avatar-md");
    }
    if (activeContactName) activeContactName.textContent = meta.name || meta.handle;
    if (activeContactHandle) activeContactHandle.textContent = `@${meta.handle || meta.id}`;
    if (activeVerifiedBadge) activeVerifiedBadge.style.display = meta.verified ? "inline-flex" : "none";

    if (window.innerWidth <= 768 && msgWorkspace) {
      msgWorkspace.classList.add("mobile-chat-open");
      msgWorkspace.classList.add("chat-open");
    }

    renderConversationList();

    // FAST 0ms LOCAL MESSAGE RENDERING
    loadedMessageIds.clear();
    lastMessageTimestamp = 0;
    
    const localMsgs = loadLocalChatMessages(chatId);
    if (messagesFlow) {
      messagesFlow.innerHTML = "";
      messagesFlow.classList.remove("chat-fade-in");
      void messagesFlow.offsetWidth; // Trigger reflow for smooth iOS fade-in transition
      messagesFlow.classList.add("chat-fade-in");

      if (localMsgs.length > 0) {
        localMsgs.forEach((msg) => renderMessage(msg, false));
        scrollToBottom();
      } else {
        messagesFlow.innerHTML = renderLoadingSkeleton();
      }
    }

    await loadChatHistory(chatId, sessionToken);

    if (activeConvoId === chatId && messageTextInput) messageTextInput.focus();

    if (currentUser) {
      try {
        fetch("/api/msg?action=mark_read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, username: currentUser.username }),
        });
      } catch (_) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Load Messages for Active Chat
  // ---------------------------------------------------------------------------
  async function loadChatHistory(chatId, sessionToken) {
    try {
      const res = await fetch(`/api/msg?action=get_messages&chatId=${encodeURIComponent(chatId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const messages = data.messages || [];

      if (messages.length > 0) {
        saveLocalChatMessages(chatId, messages);
      }

      // STRICT CHAT GUARD: If user switched chats while fetching, discard DOM update
      if (activeConvoId !== chatId || sessionToken !== chatSessionCounter) return;

      const skeleton = messagesFlow ? messagesFlow.querySelector(".chat-loading-skeleton") : null;
      if (skeleton) {
        skeleton.remove();
      }

      if (messages.length === 0 && (!messagesFlow.children || messagesFlow.children.length === 0)) {
        messagesFlow.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; color: var(--text-secondary); animation: chatFadeIn 0.2s ease;">
            <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">No messages here yet</div>
            <div style="font-size: 12px;">Say hello to start the conversation over AS Cloud!</div>
          </div>
        `;
      } else {
        messages.forEach((msg) => {
          renderMessage({ ...msg, chatId }, false);
        });
      }

      scrollToBottom();
    } catch (err) {
      console.warn("Error background loading chat history:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Render Individual Message
  // ---------------------------------------------------------------------------
  function renderMessage(m, animate = true) {
    if (!messagesFlow || !m || !m.id) return;

    // STRICT CHAT ISOLATION GUARD 1: Message must belong to activeConvoId
    if (m.chatId && activeConvoId && m.chatId !== activeConvoId) {
      return;
    }

    // STRICT CHAT ISOLATION GUARD 2: In direct chats, verify sender and recipient belong to active DM pair
    if (activeConvoMeta && activeConvoMeta.type === "direct" && currentUser) {
      const partner = (activeConvoMeta.handle || activeConvoMeta.name || "").toLowerCase();
      const me = currentUser.username.toLowerCase();
      const s = (m.sender || "").toLowerCase();
      const r = (m.recipient || "").toLowerCase();
      if (s && r && !((s === me && r === partner) || (s === partner && r === me))) {
        return;
      }
    }

    if (loadedMessageIds.has(m.id) || document.getElementById(m.id)) return;

    // Remove loading skeleton if present
    const skeleton = messagesFlow.querySelector(".chat-loading-skeleton");
    if (skeleton) skeleton.remove();

    // Check for duplicate optimistic / in-flight messages from the same sender
    if (currentUser && m.sender && m.sender.toLowerCase() === currentUser.username.toLowerCase()) {
      const existingRows = messagesFlow.querySelectorAll(".msg-row.outgoing");
      for (const row of existingRows) {
        if (row.id === m.id) return;
        const rowText = row.querySelector(".msg-text-content")?.textContent || "";
        const rowTime = parseInt(row.dataset.timestamp || "0", 10);
        if (rowText && rowText === (m.text || "").trim() && Math.abs((m.timestamp || Date.now()) - rowTime) < 3500) {
          row.id = m.id;
          loadedMessageIds.add(m.id);
          const receipt = row.querySelector(".msg-receipt-icon");
          if (receipt) receipt.innerHTML = ICONS.checkDouble;
          return;
        }
      }
    }

    loadedMessageIds.add(m.id);

    if (m.timestamp > lastMessageTimestamp) {
      lastMessageTimestamp = m.timestamp;
    }

    const isOut = currentUser && m.sender.toLowerCase() === currentUser.username.toLowerCase();
    const isChannel = activeConvoMeta && activeConvoMeta.type === "channel";
    const showAvatar = !isOut && isChannel;
    const showSenderName = !isOut && isChannel;
    const senderName = m.senderName || m.sender;
    const senderColor = getSenderColor(m.sender);

    let replyQuoteHtml = "";
    if (m.replyTo && m.replyTo.id) {
      const qSender = escapeHtml(m.replyTo.senderName || m.replyTo.sender || "User");
      let qSnippet = m.replyTo.text || "";
      if (!qSnippet && m.replyTo.mediaType === "image") qSnippet = "Photo";
      else if (!qSnippet && m.replyTo.mediaType === "audio") qSnippet = "Voice note";
      else if (!qSnippet && m.replyTo.mediaType === "file") qSnippet = "Attachment";

      replyQuoteHtml = `
        <div class="msg-reply-quote" data-target-id="${escapeHtml(m.replyTo.id)}" title="Click to view quoted message">
          <div class="reply-quote-content">
            <span class="reply-quote-sender">${qSender}</span>
            <span class="reply-quote-text">${escapeHtml(qSnippet || "Message")}</span>
          </div>
        </div>
      `;
    }

    let bodyContent = "";

    if (m.mediaType === "image" && m.mediaUrl) {
      bodyContent += `
        <div class="msg-media-photo" data-url="${escapeHtml(m.mediaUrl)}" data-caption="${escapeHtml(m.text || "")}">
          <img src="${escapeHtml(m.mediaUrl)}" alt="Attached Image" loading="lazy">
        </div>
      `;
    }

    if (m.mediaType === "audio" && m.mediaUrl) {
      bodyContent += `
        <div class="voice-note-card" data-audio="${escapeHtml(m.mediaUrl)}">
          <button class="vn-play-btn" type="button" aria-label="Play Voice Note">${ICONS.play}</button>
          <div class="vn-waveform">
            <span class="vn-bar" style="height: 8px;"></span>
            <span class="vn-bar" style="height: 14px;"></span>
            <span class="vn-bar" style="height: 20px;"></span>
            <span class="vn-bar" style="height: 10px;"></span>
            <span class="vn-bar" style="height: 16px;"></span>
            <span class="vn-bar" style="height: 12px;"></span>
            <span class="vn-bar" style="height: 18px;"></span>
            <span class="vn-bar" style="height: 9px;"></span>
          </div>
          <span class="vn-time">${escapeHtml(m.duration || "0:04")}</span>
          <audio src="${escapeHtml(m.mediaUrl)}" preload="metadata" style="display: none;"></audio>
        </div>
      `;
    }

    if (m.text) {
      bodyContent += `<div class="msg-text-content">${escapeHtml(m.text)}</div>`;
    }

    const timeStr = formatTime(m.timestamp || Date.now());

    let receiptHtml = "";
    if (isOut) {
      if (m.status === "read") {
        receiptHtml = `<span class="msg-receipt-icon read" title="Read" style="color: #00d2ff;">${ICONS.checkDouble}</span>`;
      } else if (m.status === "delivered") {
        receiptHtml = `<span class="msg-receipt-icon" title="Delivered">${ICONS.checkDouble}</span>`;
      } else {
        receiptHtml = `<span class="msg-receipt-icon" title="Sent">${ICONS.checkSingle}</span>`;
      }
    }

    const avatarHtml = showAvatar ? renderAvatarHtml(senderName, m.senderPfp, "avatar-xs", "msg-bubble-avatar") : "";
    const replyBtnHtml = `<button class="msg-reply-trigger-btn" type="button" title="Reply to message" data-id="${m.id}">${ICONS.reply}</button>`;

    const html = `
      <div class="msg-row ${isOut ? "outgoing" : "incoming"} ${isChannel ? "channel-row" : "direct-row"} ${animate ? "animate-in" : ""}" id="${m.id}" data-timestamp="${m.timestamp || Date.now()}">
        ${avatarHtml}
        <div class="msg-bubble-content">
          ${replyBtnHtml}
          <div class="msg-bubble">
            ${showSenderName ? `<div class="msg-sender-name" style="color: ${senderColor};">${escapeHtml(senderName)}</div>` : ""}
            ${replyQuoteHtml}
            <div class="msg-text">${bodyContent}</div>
            <div class="msg-footer">
              <span class="msg-timestamp">${timeStr}</span>
              ${receiptHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    messagesFlow.insertAdjacentHTML("beforeend", html);
    bindMessageInteractions();
  }

  function bindMessageInteractions() {
    // Reply Action Trigger Button
    document.querySelectorAll(".msg-reply-trigger-btn:not([data-bound])").forEach((btn) => {
      btn.setAttribute("data-bound", "true");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const row = document.getElementById(id);
        if (!row) return;

        const isRowOut = row.classList.contains("outgoing");
        const sName = row.querySelector(".msg-sender-name")?.textContent || (isRowOut ? (currentUser?.displayName || currentUser?.username) : (activeConvoMeta?.name || activeConvoMeta?.handle || "Contact"));
        const txt = row.querySelector(".msg-text-content")?.textContent || "";
        const isImg = !!row.querySelector(".msg-media-photo");
        const isAudio = !!row.querySelector(".voice-note-card");

        startReplyToMessage({
          id,
          sender: isRowOut ? currentUser.username : (activeConvoMeta?.handle || "contact"),
          senderName: sName,
          text: txt,
          mediaType: isImg ? "image" : (isAudio ? "audio" : null),
        });
      });
    });

    // Quoted Message Click (Scroll to Quote)
    document.querySelectorAll(".msg-reply-quote:not([data-bound])").forEach((quote) => {
      quote.setAttribute("data-bound", "true");
      quote.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetId = quote.getAttribute("data-target-id");
        if (!targetId) return;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.classList.remove("msg-highlight-pulse");
          void targetEl.offsetWidth;
          targetEl.classList.add("msg-highlight-pulse");
          setTimeout(() => targetEl.classList.remove("msg-highlight-pulse"), 1500);
        }
      });
    });

    document.querySelectorAll(".msg-media-photo:not([data-bound])").forEach((el) => {
      el.setAttribute("data-bound", "true");
      el.addEventListener("click", () => {
        const url = el.getAttribute("data-url");
        const caption = el.getAttribute("data-caption");
        if (lightboxImage) lightboxImage.src = url;
        if (lightboxCaption) lightboxCaption.textContent = caption || "";
        if (mediaLightbox) mediaLightbox.style.display = "flex";
      });
    });

    document.querySelectorAll(".voice-note-card:not([data-bound])").forEach((card) => {
      card.setAttribute("data-bound", "true");
      const btn = card.querySelector(".vn-play-btn");
      const audio = card.querySelector("audio");
      const bars = card.querySelectorAll(".vn-bar");
      const timeSpan = card.querySelector(".vn-time");

      if (!btn || !audio) return;

      btn.addEventListener("click", () => {
        if (audio.paused) {
          document.querySelectorAll("audio").forEach((a) => {
            if (a !== audio) {
              a.pause();
              a.currentTime = 0;
            }
          });
          audio.play();
          btn.innerHTML = ICONS.pause;
          bars.forEach((b) => b.classList.add("playing"));
        } else {
          audio.pause();
          btn.innerHTML = ICONS.play;
          bars.forEach((b) => b.classList.remove("playing"));
        }
      });

      audio.addEventListener("ended", () => {
        btn.innerHTML = ICONS.play;
        bars.forEach((b) => b.classList.remove("playing"));
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          const rem = Math.max(0, audio.duration - audio.currentTime);
          const mins = Math.floor(rem / 60);
          const secs = Math.floor(rem % 60).toString().padStart(2, "0");
          if (timeSpan) timeSpan.textContent = `${mins}:${secs}`;
        }
      });
    });
  }

  function scrollToBottom() {
    if (!chatMessagesContainer) return;
    requestAnimationFrame(() => {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
  }

  if (scrollBottomBtn && chatMessagesContainer) {
    chatMessagesContainer.addEventListener("scroll", () => {
      const distFromBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight;
      scrollBottomBtn.style.display = distFromBottom > 160 ? "flex" : "none";
    });
    scrollBottomBtn.addEventListener("click", scrollToBottom);
  }

  // ---------------------------------------------------------------------------
  // Message Reply Helpers
  // ---------------------------------------------------------------------------
  function startReplyToMessage(info) {
    activeReply = info;
    if (replyBannerTitle) replyBannerTitle.textContent = `Replying to ${info.senderName || info.sender}`;
    let preview = info.text || "";
    if (!preview && info.mediaType === "image") preview = "Photo";
    else if (!preview && info.mediaType === "audio") preview = "Voice note";
    else if (!preview && info.mediaType === "file") preview = "Attachment";
    if (replyBannerSnippet) replyBannerSnippet.textContent = preview || "Message";
    if (composerReplyBanner) composerReplyBanner.style.display = "flex";
    if (messageTextInput) messageTextInput.focus();
  }

  function cancelReply() {
    activeReply = null;
    if (composerReplyBanner) composerReplyBanner.style.display = "none";
  }

  if (closeReplyBannerBtn) closeReplyBannerBtn.addEventListener("click", cancelReply);

  // ---------------------------------------------------------------------------
  // Send Message (Optimistic Instant Delivery with Reply & Block Support)
  // ---------------------------------------------------------------------------
  async function handleSendMessage(text = "", media = null) {
    if (!text.trim() && !media) return;
    if (!currentUser) {
      showAuthOverlay("login");
      return;
    }

    const targetChatId = activeConvoId;
    const targetMeta = activeConvoMeta;
    if (!targetChatId) return;

    const currentReply = activeReply;
    cancelReply();

    const cleanText = text.trim();
    if (messageTextInput) {
      messageTextInput.value = "";
      autoResizeTextarea();
    }

    const clientMsgId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: clientMsgId,
      chatId: targetChatId,
      sender: currentUser.username,
      senderName: currentUser.displayName || currentUser.username,
      senderPfp: currentUser.pfp,
      recipient: targetMeta?.type === "direct" ? targetMeta.handle : null,
      text: cleanText,
      mediaType: media ? media.type : null,
      mediaUrl: media ? media.url : null,
      duration: media ? media.duration : null,
      replyTo: currentReply ? { ...currentReply } : null,
      timestamp: Date.now(),
      status: "sent",
    };

    if (activeConvoId === targetChatId) {
      renderMessage(optimisticMsg, true);
      scrollToBottom();
      playChime("sent");
    }

    // Persist immediately to target chat local cache
    appendLocalChatMessage(targetChatId, optimisticMsg);

    // Cross-tab real-time dispatch
    broadcastRealtimeEvent({
      type: "new_message",
      chatId: targetChatId,
      message: optimisticMsg,
    });

    try {
      const res = await fetch("/api/msg?action=send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          id: clientMsgId,
          chatId: targetChatId,
          sender: currentUser.username,
          recipient: targetMeta?.type === "direct" ? targetMeta.handle : null,
          text: cleanText,
          mediaType: media ? media.type : null,
          mediaUrl: media ? media.url : null,
          duration: media ? media.duration : null,
          replyTo: currentReply ? { ...currentReply } : null,
        }),
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        const row = document.getElementById(clientMsgId);
        if (row) {
          const footer = row.querySelector(".msg-footer");
          if (footer) footer.innerHTML += `<span style="color: #ff453a; font-size: 11px; margin-left: 6px;">Not delivered</span>`;
        }
        alert(errData.error || "Cannot send message. This user is blocked.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const serverMsg = data.message;
        const targetId = serverMsg?.id || clientMsgId;
        loadedMessageIds.add(targetId);
        const row = document.getElementById(clientMsgId) || document.getElementById(targetId);
        if (row) {
          row.id = targetId;
          const receipt = row.querySelector(".msg-receipt-icon");
          if (receipt) receipt.innerHTML = ICONS.checkDouble;
        }
      }
      updateLocalConversationPreview(activeConvoId, {
        id: clientMsgId,
        text: cleanText,
        sender: currentUser.username,
        time: Date.now(),
        status: "sent",
        mediaType: media ? media.type : null,
      });
      loadConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  if (sendMessageBtn && messageTextInput) {
    sendMessageBtn.addEventListener("click", () => handleSendMessage(messageTextInput.value));
    messageTextInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(messageTextInput.value);
      }
    });
  }

  function autoResizeTextarea() {
    if (!messageTextInput) return;
    messageTextInput.style.height = "auto";
    messageTextInput.style.height = `${Math.min(messageTextInput.scrollHeight, 140)}px`;
  }
  if (messageTextInput) messageTextInput.addEventListener("input", autoResizeTextarea);

  // ---------------------------------------------------------------------------
  // Media Attachments & Preview with Optional Caption
  // ---------------------------------------------------------------------------
  let pendingMediaUpload = null;

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function closeMediaPreviewModal() {
    pendingMediaUpload = null;
    if (mediaPreviewModal) mediaPreviewModal.style.display = "none";
    if (mediaPreviewImage) mediaPreviewImage.src = "";
    if (mediaFileInput) mediaFileInput.value = "";
    if (sendMediaBtnText) sendMediaBtnText.textContent = "Send Media";
    if (sendMediaPreviewBtn) sendMediaPreviewBtn.disabled = false;
  }

  async function sendPendingMedia() {
    if (!pendingMediaUpload) return;
    const { file, base64, isImg } = pendingMediaUpload;
    const caption = (mediaPreviewCaption ? mediaPreviewCaption.value : "").trim();

    if (sendMediaBtnText) {
      sendMediaBtnText.innerHTML = `
        <svg class="smooth-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="12" style="margin-right: 6px; width: 14px; height: 14px;">
          <circle cx="12" cy="12" r="10" stroke-width="2.5"></circle>
        </svg>
        <span>Uploading...</span>
      `;
    }
    if (sendMediaPreviewBtn) sendMediaPreviewBtn.disabled = true;

    let cdnUrl = base64;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          filename: `msg_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`,
          contentType: file.type,
          target: "msg-media-storage",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.proxyUrl) cdnUrl = data.proxyUrl;
      }
    } catch (_) {}

    closeMediaPreviewModal();

    handleSendMessage(caption, {
      type: isImg ? "image" : "file",
      url: cdnUrl,
    });
  }

  if (attachMediaBtn && mediaFileInput) {
    attachMediaBtn.addEventListener("click", () => mediaFileInput.click());
    mediaFileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (ev) => {
        const base64 = ev.target.result;
        pendingMediaUpload = { file, base64, isImg };

        if (isImg) {
          if (mediaPreviewImage) {
            mediaPreviewImage.src = base64;
            mediaPreviewImage.style.display = "block";
          }
          if (mediaPreviewFileInfo) mediaPreviewFileInfo.style.display = "none";
        } else {
          if (mediaPreviewImage) mediaPreviewImage.style.display = "none";
          if (mediaPreviewFileInfo) {
            mediaPreviewFileInfo.style.display = "flex";
            if (mediaPreviewFileName) mediaPreviewFileName.textContent = file.name;
            if (mediaPreviewFileSize) mediaPreviewFileSize.textContent = formatBytes(file.size);
          }
        }

        if (mediaPreviewCaption) mediaPreviewCaption.value = "";
        if (mediaPreviewModal) mediaPreviewModal.style.display = "flex";
        if (mediaPreviewCaption) mediaPreviewCaption.focus();
      };
      reader.readAsDataURL(file);
    });
  }

  if (sendMediaPreviewBtn) sendMediaPreviewBtn.addEventListener("click", sendPendingMedia);
  if (cancelMediaPreviewBtn) cancelMediaPreviewBtn.addEventListener("click", closeMediaPreviewModal);
  if (discardMediaBtn) discardMediaBtn.addEventListener("click", closeMediaPreviewModal);
  if (mediaPreviewCaption) {
    mediaPreviewCaption.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendPendingMedia();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Voice Note Recorder
  // ---------------------------------------------------------------------------
  let mediaRecorder = null;
  let audioChunks = [];
  let recordTimer = null;
  let recordSeconds = 0;

  if (voiceRecordBtn && recordingLiveBar) {
    voiceRecordBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const mins = Math.floor(recordSeconds / 60);
          const secs = (recordSeconds % 60).toString().padStart(2, "0");
          const durStr = `${mins}:${secs}`;

          const reader = new FileReader();
          reader.onload = async () => {
            const base64Audio = reader.result;
            handleSendMessage("", {
              type: "audio",
              url: base64Audio,
              duration: durStr,
            });
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorder.start();
        recordingLiveBar.style.display = "flex";
        recordSeconds = 0;
        if (recordingTime) recordingTime.textContent = "0:00";
        recordTimer = setInterval(() => {
          recordSeconds++;
          const mins = Math.floor(recordSeconds / 60);
          const secs = (recordSeconds % 60).toString().padStart(2, "0");
          if (recordingTime) recordingTime.textContent = `${mins}:${secs}`;
        }, 1000);
      } catch (err) {
        alert("Microphone access denied or unavailable.");
      }
    });

    if (cancelRecordBtn) {
      cancelRecordBtn.addEventListener("click", () => {
        clearInterval(recordTimer);
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.onstop = null;
          mediaRecorder.stop();
        }
        recordingLiveBar.style.display = "none";
      });
    }

    if (sendRecordBtn) {
      sendRecordBtn.addEventListener("click", () => {
        clearInterval(recordTimer);
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        recordingLiveBar.style.display = "none";
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Real-Time Live Long-Polling & Instant Cross-Tab Broadcast Engine
  // ---------------------------------------------------------------------------
  const realtimeChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("as_messages_realtime_v1") : null;

  function broadcastRealtimeEvent(event) {
    try {
      if (realtimeChannel) realtimeChannel.postMessage(event);
      localStorage.setItem("as_msg_realtime_ping", JSON.stringify({ ...event, _t: Date.now() }));
    } catch (_) {}
  }

  function handleIncomingRealtimeEvent(data) {
    if (!data || !currentUser) return;
    if (data.type === "new_message" && data.message) {
      const m = data.message;
      const eventChatId = data.chatId || m.chatId;

      // Always save to the relevant chat's cache
      if (eventChatId) {
        appendLocalChatMessage(eventChatId, { ...m, chatId: eventChatId });
      }

      // STRICT CHAT GUARD: Only render if this message belongs to the currently active conversation
      if (eventChatId && activeConvoId && eventChatId === activeConvoId) {
        if (!loadedMessageIds.has(m.id) && !document.getElementById(m.id)) {
          renderMessage(m, true);
          if (m.sender.toLowerCase() !== currentUser.username.toLowerCase()) {
            playChime("received");
            if (chatMessagesContainer) {
              const distFromBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight;
              if (distFromBottom < 220) {
                scrollToBottom();
              }
            }
            fetch("/api/msg?action=mark_read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: activeConvoId, username: currentUser.username }),
            });
          }
        }
      }
      loadConversations();
    }
  }

  if (realtimeChannel) {
    realtimeChannel.onmessage = (ev) => handleIncomingRealtimeEvent(ev.data);
  }

  window.addEventListener("storage", (ev) => {
    if (ev.key === "as_msg_realtime_ping" && ev.newValue) {
      try {
        const data = JSON.parse(ev.newValue);
        handleIncomingRealtimeEvent(data);
      } catch (_) {}
    }
  });

  let longPollAbortCtrl = null;
  let isRealtimeLoopActive = false;

  function startSyncEngine() {
    if (isRealtimeLoopActive) return;
    isRealtimeLoopActive = true;
    runRealtimeLongPoll();
  }

  function stopSyncEngine() {
    isRealtimeLoopActive = false;
    if (longPollAbortCtrl) {
      try { longPollAbortCtrl.abort(); } catch (_) {}
      longPollAbortCtrl = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUser && !isRealtimeLoopActive) {
      startSyncEngine();
    }
  });

  async function runRealtimeLongPoll() {
    if (!currentUser) return;

    while (currentUser && isRealtimeLoopActive) {
      const pollTargetChatId = activeConvoId;
      const pollSessionId = chatSessionCounter;

      try {
        longPollAbortCtrl = new AbortController();
        const url = `/api/msg?action=sync&wait=1&username=${encodeURIComponent(currentUser.username)}&chatId=${encodeURIComponent(pollTargetChatId || "")}&since=${lastMessageTimestamp}`;
        
        const res = await fetch(url, { signal: longPollAbortCtrl.signal });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        const data = await res.json();
        const resChatId = data.chatId || pollTargetChatId;
        const newMsgs = data.newMessages || [];

        // STRICT CHAT BOUNDARY: If user switched conversations while awaiting response, do NOT render to active screen!
        if (activeConvoId !== resChatId || chatSessionCounter !== pollSessionId) {
          if (newMsgs.length > 0 && resChatId) {
            newMsgs.forEach((m) => appendLocalChatMessage(resChatId, { ...m, chatId: resChatId }));
            loadConversations();
          }
          continue;
        }

        if (newMsgs.length > 0) {
          let hasIncoming = false;
          newMsgs.forEach((m) => {
            const mWithChat = { ...m, chatId: resChatId };
            // Ensure message belongs to currently open chat
            if (mWithChat.chatId !== activeConvoId) {
              appendLocalChatMessage(mWithChat.chatId, mWithChat);
              return;
            }

            if (!loadedMessageIds.has(m.id) && !document.getElementById(m.id)) {
              renderMessage(mWithChat, true);
              appendLocalChatMessage(activeConvoId, mWithChat);
              if (m.sender.toLowerCase() !== currentUser.username.toLowerCase()) {
                hasIncoming = true;
              }
            }
          });

          if (hasIncoming) {
            playChime("received");
            if (chatMessagesContainer) {
              const distFromBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight;
              if (distFromBottom < 220) {
                scrollToBottom();
              }
            }
            fetch("/api/msg?action=mark_read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: activeConvoId, username: currentUser.username }),
            });
            loadConversations();
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }
  }

  // Replaced aggressive 4s polling with real-time event bus and reactive cache updates (Zero Lag)

  // ---------------------------------------------------------------------------
  // New Chat & Real User Search
  // ---------------------------------------------------------------------------
  function openNewChatModal() {
    if (!newChatModal) return;
    newChatModal.style.display = "flex";
    if (newChatHandleInput) {
      newChatHandleInput.value = "";
      newChatHandleInput.focus();
    }
    searchAndRenderUsers("");
  }

  function closeNewChatModal() {
    if (newChatModal) newChatModal.style.display = "none";
  }

  async function searchAndRenderUsers(query = "") {
    if (!quickContactsList) return;
    quickContactsList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 12px;">Searching network...</div>';

    try {
      const current = currentUser ? currentUser.username : "";
      const res = await fetch(`/api/msg?action=search_users&q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(current)}`);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      const EXCLUDED_USERNAMES = new Set(["as_support", "support", "system", "general", "admin", "cloud_pilot", "general_support", "generalsupport"]);
      const rawUsers = data.users || [];
      const users = rawUsers.filter((u) => {
        const uname = (u.username || "").toLowerCase();
        const dname = (u.displayName || "").toLowerCase();
        if (EXCLUDED_USERNAMES.has(uname)) return false;
        if (dname.includes("support") || dname.includes("general support")) return false;
        return true;
      });

      if (users.length === 0) {
        quickContactsList.innerHTML = `
          <div style="padding: 20px 10px; text-align: center; color: var(--text-secondary); font-size: 12px;">
            No users found matching "${escapeHtml(query)}".
          </div>
        `;
        return;
      }

      quickContactsList.innerHTML = users.map((u) => {
        const avatarHtml = renderAvatarHtml(u.displayName || u.username, u.pfp, "avatar-md");
        return `
          <div class="quick-contact-card" data-username="${u.username}" data-name="${escapeHtml(u.displayName || u.username)}" data-pfp="${escapeHtml(u.pfp || "")}" data-created="${u.createdAt || 0}" data-bio="${escapeHtml(u.bio || "")}">
            <div style="position: relative;">
              ${avatarHtml}
            </div>
            <div class="quick-contact-info">
              <div class="quick-contact-name">
                ${escapeHtml(u.displayName || u.username)}
                ${u.verified ? `<span class="verified-glyph">${ICONS.verified}</span>` : ""}
              </div>
              <div class="quick-contact-handle">@${u.username}</div>
            </div>
            <button class="quick-chat-action-btn" type="button">Chat</button>
          </div>
        `;
      }).join("");

      quickContactsList.querySelectorAll(".quick-contact-card").forEach((card) => {
        card.addEventListener("click", () => {
          const handle = card.getAttribute("data-username");
          const name = card.getAttribute("data-name");
          const pfp = card.getAttribute("data-pfp") || null;
          startDirectChat(handle, name, pfp);
          closeNewChatModal();
        });
      });
    } catch (err) {
      quickContactsList.innerHTML = '<div style="padding: 12px; color: #ff453a; font-size: 12px;">Failed to search network users.</div>';
    }
  }

  let searchDebounce = null;
  if (newChatHandleInput) {
    newChatHandleInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchAndRenderUsers(newChatHandleInput.value.trim());
      }, 250);
    });
  }

  function startDirectChat(targetHandle, targetName = null, targetPfp = null) {
    if (!currentUser) {
      showAuthOverlay("login");
      return;
    }
    const cleanTarget = targetHandle.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    if (!cleanTarget || cleanTarget === currentUser.username.toLowerCase()) {
      alert("Please choose a different user to message.");
      return;
    }

    const sorted = [currentUser.username.toLowerCase(), cleanTarget].sort();
    const dmId = `dm_${sorted[0]}__${sorted[1]}`;

    const meta = {
      id: dmId,
      type: "direct",
      handle: cleanTarget,
      name: targetName || cleanTarget,
      pfp: targetPfp || null,
      createdAt: Date.now(),
      bio: "Available on AS Messages",
      lastMessage: null,
    };

    // Immediately register in local conversations list so chat never disappears
    updateLocalConversationPreview(dmId, null, meta);

    openChat(dmId, meta);
  }

  if (startChatByHandleBtn && newChatHandleInput) {
    startChatByHandleBtn.addEventListener("click", () => {
      const handle = newChatHandleInput.value.trim();
      if (handle) {
        startDirectChat(handle);
        closeNewChatModal();
      }
    });
  }

  if (openNewChatBtn) openNewChatBtn.addEventListener("click", openNewChatModal);
  if (closeNewChatModalBtn) closeNewChatModalBtn.addEventListener("click", closeNewChatModal);

  const sidebarMenuBtn = document.getElementById("sidebarMenuBtn");
  if (sidebarMenuBtn) {
    sidebarMenuBtn.addEventListener("click", openProfileModal);
  }

  // WhatsApp Filter Chips
  document.querySelectorAll(".filter-tab, .wa-filter-chip").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab, .wa-filter-chip").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.getAttribute("data-filter");
      document.querySelectorAll(".convo-item, .conversation-item").forEach((item) => {
        const id = item.getAttribute("data-id");
        const isUnread = item.classList.contains("unread");
        if (filter === "all") item.style.display = "flex";
        else if (filter === "unread") item.style.display = isUnread ? "flex" : "none";
        else if (filter === "direct" || filter === "favourites") item.style.display = id.startsWith("dm_") ? "flex" : "none";
        else if (filter === "channels") item.style.display = !id.startsWith("dm_") ? "flex" : "none";
      });
    });
  });

  // Sidebar Filter Search
  if (chatSearchInput) {
    chatSearchInput.addEventListener("input", () => {
      const q = chatSearchInput.value.toLowerCase().trim();
      document.querySelectorAll(".convo-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? "flex" : "none";
      });
    });
  }

  // Mobile Back Button
  if (mobileBackBtn && msgWorkspace) {
    mobileBackBtn.addEventListener("click", () => {
      msgWorkspace.classList.remove("mobile-chat-open");
      msgWorkspace.classList.remove("chat-open");
    });
  }

  // Lightbox Close
  if (closeLightboxBtn && mediaLightbox) {
    closeLightboxBtn.addEventListener("click", () => {
      mediaLightbox.style.display = "none";
    });
  }

  // ---------------------------------------------------------------------------
  // Block / Unblock Management & Settings Blocklist
  // ---------------------------------------------------------------------------
  function updateComposerBlockedState() {
    if (!activeConvoMeta || activeConvoMeta.type !== "direct" || !currentUser) {
      if (composerBlockedBanner) composerBlockedBanner.style.display = "none";
      if (composerCapsule) composerCapsule.style.display = "flex";
      return;
    }

    const partnerHandle = (activeConvoMeta.handle || "").toLowerCase();
    const isBlocked = Array.isArray(currentUser.blockedUsers) && currentUser.blockedUsers.includes(partnerHandle);

    if (isBlocked) {
      if (composerCapsule) composerCapsule.style.display = "none";
      if (composerReplyBanner) composerReplyBanner.style.display = "none";
      if (composerBlockedText) composerBlockedText.textContent = `You have blocked @${partnerHandle}. Unblock to send messages.`;
      if (composerBlockedBanner) composerBlockedBanner.style.display = "flex";
    } else {
      if (composerBlockedBanner) composerBlockedBanner.style.display = "none";
      if (composerCapsule) composerCapsule.style.display = "flex";
    }
  }

  // ---------------------------------------------------------------------------
  // iOS Two-Step Confirmation Guard for Block & Unblock Actions
  // ---------------------------------------------------------------------------
  function showTwoStepConfirmation({ type, targetUsername }) {
    return new Promise((resolve) => {
      if (!twoStepConfirmModal) {
        if (type === "block") {
          const s1 = confirm("Are you sure that you wanna block this user? its just a technical step but it has the tendency to break any relation into null");
          if (!s1) return resolve(false);
          const s2 = confirm(`Please confirm: Blocking @${targetUsername} will restrict all messaging. Finalize block?`);
          return resolve(s2);
        } else {
          const s1 = confirm("Are you sure that restart the convo by unblocking the user ?");
          if (!s1) return resolve(false);
          const s2 = confirm(`Please confirm: Unblocking @${targetUsername} will restore conversations and allow both parties to message again.`);
          return resolve(s2);
        }
      }

      let currentStep = 1;

      function renderStep() {
        if (type === "block") {
          if (currentStep === 1) {
            twoStepBadge.className = "two-step-badge";
            twoStepBadge.textContent = "Step 1 of 2 • Safety Check";
            twoStepIconWrap.className = "two-step-icon-wrap icon-block";
            twoStepIconWrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
            twoStepTitle.textContent = `Block @${targetUsername}?`;
            twoStepDesc.textContent = "Are you sure that you wanna block this user? its just a technical step but it has the tendency to break any relation into null";
            twoStepCancelBtn.textContent = "Cancel";
            twoStepPrimaryBtn.className = "modal-btn primary-btn";
            twoStepPrimaryBtn.textContent = "Continue";
          } else {
            twoStepBadge.className = "two-step-badge badge-step-2";
            twoStepBadge.textContent = "Step 2 of 2 • Final Confirmation";
            twoStepIconWrap.className = "two-step-icon-wrap icon-block";
            twoStepIconWrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            twoStepTitle.textContent = `Confirm Blocking @${targetUsername}`;
            twoStepDesc.textContent = `Blocking @${targetUsername} will prevent them from sending you messages or seeing your profile updates. Are you sure you want to finalize this action?`;
            twoStepCancelBtn.textContent = "Back";
            twoStepPrimaryBtn.className = "modal-btn primary-btn two-step-primary-danger";
            twoStepPrimaryBtn.textContent = "Yes, Block User";
          }
        } else {
          // Unblock flow
          if (currentStep === 1) {
            twoStepBadge.className = "two-step-badge";
            twoStepBadge.textContent = "Step 1 of 2 • Restore Access";
            twoStepIconWrap.className = "two-step-icon-wrap icon-unblock";
            twoStepIconWrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
            twoStepTitle.textContent = `Unblock @${targetUsername}?`;
            twoStepDesc.textContent = "Are you sure that restart the convo by unblocking the user ?";
            twoStepCancelBtn.textContent = "Cancel";
            twoStepPrimaryBtn.className = "modal-btn primary-btn";
            twoStepPrimaryBtn.textContent = "Continue";
          } else {
            twoStepBadge.className = "two-step-badge badge-unblock-step-2";
            twoStepBadge.textContent = "Step 2 of 2 • Final Confirmation";
            twoStepIconWrap.className = "two-step-icon-wrap icon-unblock";
            twoStepIconWrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`;
            twoStepTitle.textContent = `Confirm Unblocking @${targetUsername}`;
            twoStepDesc.textContent = `Unblocking @${targetUsername} will immediately restore direct messaging and allow both of you to exchange messages again.`;
            twoStepCancelBtn.textContent = "Back";
            twoStepPrimaryBtn.className = "modal-btn primary-btn two-step-primary-normal";
            twoStepPrimaryBtn.textContent = "Yes, Unblock User";
          }
        }
      }

      function cleanup() {
        twoStepPrimaryBtn.removeEventListener("click", onPrimary);
        twoStepCancelBtn.removeEventListener("click", onCancel);
        if (closeTwoStepModalBtn) closeTwoStepModalBtn.removeEventListener("click", onClose);
        twoStepConfirmModal.style.display = "none";
      }

      function onPrimary() {
        if (currentStep === 1) {
          currentStep = 2;
          renderStep();
        } else {
          cleanup();
          resolve(true);
        }
      }

      function onCancel() {
        if (currentStep === 2) {
          currentStep = 1;
          renderStep();
        } else {
          cleanup();
          resolve(false);
        }
      }

      function onClose() {
        cleanup();
        resolve(false);
      }

      renderStep();
      twoStepPrimaryBtn.addEventListener("click", onPrimary);
      twoStepCancelBtn.addEventListener("click", onCancel);
      if (closeTwoStepModalBtn) closeTwoStepModalBtn.addEventListener("click", onClose);

      twoStepConfirmModal.style.display = "flex";
    });
  }

  async function toggleBlockUser(targetUsername) {
    if (!currentUser || !targetUsername) return;
    const cleanTarget = targetUsername.toLowerCase().trim();
    const isCurrentlyBlocked = Array.isArray(currentUser.blockedUsers) && currentUser.blockedUsers.includes(cleanTarget);
    const action = isCurrentlyBlocked ? "unblock_user" : "block_user";

    const confirmed = await showTwoStepConfirmation({
      type: isCurrentlyBlocked ? "unblock" : "block",
      targetUsername: cleanTarget,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/msg?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          targetUser: cleanTarget,
          token: sessionToken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        currentUser.blockedUsers = data.blockedUsers || [];
        localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));

        updateComposerBlockedState();
        loadConversations();
        if (contactInfoModal && contactInfoModal.style.display !== "none" && activeConvoMeta) {
          openContactInfo(activeConvoMeta);
        }
        renderSettingsBlocklist();
      }
    } catch (err) {
      console.error("Error toggling block:", err);
    }
  }

  if (composerUnblockBtn) {
    composerUnblockBtn.addEventListener("click", () => {
      if (activeConvoMeta && activeConvoMeta.handle) {
        toggleBlockUser(activeConvoMeta.handle);
      }
    });
  }

  async function renderSettingsBlocklist() {
    if (!settingsBlocklistContainer || !currentUser) return;
    try {
      const res = await fetch(`/api/msg?action=get_blocklist&username=${encodeURIComponent(currentUser.username)}&token=${encodeURIComponent(sessionToken || "")}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = data.blockedUsers || [];

      if (list.length === 0) {
        settingsBlocklistContainer.innerHTML = '<div class="blocklist-empty-msg">No blocked users</div>';
        return;
      }

      settingsBlocklistContainer.innerHTML = list.map((u) => {
        const avatarHtml = renderAvatarHtml(u.displayName || u.username, u.pfp, "avatar-sm");
        return `
          <div class="blocklist-item">
            <div class="blocklist-user-info">
              ${avatarHtml}
              <div class="blocklist-names">
                <span class="blocklist-name">${escapeHtml(u.displayName || u.username)}</span>
                <span class="blocklist-handle">@${escapeHtml(u.username)}</span>
              </div>
            </div>
            <button class="blocklist-unblock-btn" data-username="${escapeHtml(u.username)}" type="button">Unblock</button>
          </div>
        `;
      }).join("");

      settingsBlocklistContainer.querySelectorAll(".blocklist-unblock-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const uname = btn.getAttribute("data-username");
          toggleBlockUser(uname);
        });
      });
    } catch (err) {
      console.error("Error rendering blocklist:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // App Initialization & Session Verification
  // ---------------------------------------------------------------------------
  async function init() {
    if (relayStatusText) relayStatusText.textContent = "AS Cloud • 5 Relay Nodes Active";

    if (currentUser && sessionToken) {
      // 1. Immediately render UI and unhide workspace with local session (0ms instant login)
      renderNavProfile();
      hideAuthOverlay();

      // 2. Load conversations from localStorage cache immediately (0ms instant list)
      try {
        const savedConvos = localStorage.getItem(`as_msg_convos_${currentUser.username}`);
        if (savedConvos) {
          conversations = JSON.parse(savedConvos);
          renderConversationList();
        }
      } catch (_) {}

      // 3. Fetch fresh conversations from backend
      await loadConversations();
      if (window.innerWidth > 768) {
        await openChat(activeConvoId);
      } else {
        if (msgWorkspace) {
          msgWorkspace.classList.remove("mobile-chat-open");
          msgWorkspace.classList.remove("chat-open");
        }
      }
      startSyncEngine();

      // 4. Validate session in background (ONLY logout if explicit 401)
      try {
        const res = await fetch(`/api/msg?action=verify_session&token=${encodeURIComponent(sessionToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            currentUser = { ...currentUser, ...data.user };
            localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));
            renderNavProfile();
          }
        } else if (res.status === 401) {
          // Token is cryptographically expired or forged
          currentUser = null;
          sessionToken = null;
          localStorage.removeItem("as_msg_current_user");
          localStorage.removeItem("as_msg_token");
          showAuthOverlay("login");
        }
      } catch (err) {
        console.warn("Session check offline or slow, maintaining local session:", err);
      }
      return;
    }

    showAuthOverlay("login");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
