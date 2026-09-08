// home.js - AS Messages Real-Time Cloud Messaging Client
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
  };

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
  // Current User Profile State
  // ---------------------------------------------------------------------------
  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  ];

  let currentUser = null;
  try {
    const saved = localStorage.getItem("as_msg_current_user");
    if (saved) {
      currentUser = JSON.parse(saved);
      if (currentUser.username === "cloud_pilot") {
        currentUser = null;
        localStorage.removeItem("as_msg_current_user");
      }
    }
  } catch (_) {}

  // ---------------------------------------------------------------------------
  // DOM Element References
  // ---------------------------------------------------------------------------
  const msgWorkspace = document.getElementById("msgWorkspace");
  const msgSidebar = document.getElementById("msgSidebar");
  const msgChatPane = document.getElementById("msgChatPane");
  const conversationList = document.getElementById("conversationList");
  const chatSearchInput = document.getElementById("chatSearchInput");
  const openNewChatBtn = document.getElementById("openNewChatBtn");
  const mobileBackBtn = document.getElementById("mobileBackBtn");

  // Top Bar Profile
  const userProfileChip = document.getElementById("userProfileChip");
  const navUserPfp = document.getElementById("navUserPfp");
  const navDisplayName = document.getElementById("navDisplayName");
  const navUsername = document.getElementById("navUsername");
  const relayStatusText = document.getElementById("relayStatusText");

  // Chat Header Elements
  const activeContactPfp = document.getElementById("activeContactPfp");
  const activeContactStatusDot = document.getElementById("activeContactStatusDot");
  const activeContactName = document.getElementById("activeContactName");
  const activeContactHandle = document.getElementById("activeContactHandle");
  const activeContactStatus = document.getElementById("activeContactStatus");
  const activeVerifiedBadge = document.getElementById("activeVerifiedBadge");

  // Message Container
  const chatMessagesContainer = document.getElementById("chatMessagesContainer");
  const messagesFlow = document.getElementById("messagesFlow");
  const scrollBottomBtn = document.getElementById("scrollBottomBtn");

  // Composer Elements
  const messageTextInput = document.getElementById("messageTextInput");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const attachMediaBtn = document.getElementById("attachMediaBtn");
  const mediaFileInput = document.getElementById("mediaFileInput");
  const voiceRecordBtn = document.getElementById("voiceRecordBtn");
  const recordingLiveBar = document.getElementById("recordingLiveBar");
  const recordingTime = document.getElementById("recordingTime");
  const cancelRecordBtn = document.getElementById("cancelRecordBtn");
  const sendRecordBtn = document.getElementById("sendRecordBtn");

  // Profile Modal Elements
  const profileModal = document.getElementById("profileModal");
  const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
  const editPfpPreview = document.getElementById("editPfpPreview");
  const uploadPfpTrigger = document.getElementById("uploadPfpTrigger");
  const pfpFileInput = document.getElementById("pfpFileInput");
  const presetAvatarChips = document.getElementById("presetAvatarChips");
  const inputUsername = document.getElementById("inputUsername");
  const inputDisplayName = document.getElementById("inputDisplayName");
  const inputBio = document.getElementById("inputBio");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

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
  // State Management
  // ---------------------------------------------------------------------------
  let activeConvoId = "general";
  let activeConvoMeta = {
    id: "general",
    type: "channel",
    handle: "general",
    name: "Global Lounge",
    pfp: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150",
    status: "Active Community",
    verified: true,
  };
  let conversations = [];
  let loadedMessageIds = new Set();
  let lastMessageTimestamp = 0;
  let syncInterval = null;

  // ---------------------------------------------------------------------------
  // Profile Modal & Authentication Setup
  // ---------------------------------------------------------------------------
  function openProfileModal(isForcedOnboarding = false) {
    if (!profileModal) return;
    profileModal.style.display = "flex";

    const modalTitle = profileModal.querySelector(".modal-title");
    const modalSub = profileModal.querySelector(".modal-sub");
    if (isForcedOnboarding) {
      if (modalTitle) modalTitle.textContent = "Welcome to AS Messages";
      if (modalSub) modalSub.textContent = "Create your unique @username and profile to start chatting";
      if (closeProfileModalBtn) closeProfileModalBtn.style.display = "none";
    } else {
      if (modalTitle) modalTitle.textContent = "Edit Profile";
      if (modalSub) modalSub.textContent = "Manage your username, display name, and photo";
      if (closeProfileModalBtn) closeProfileModalBtn.style.display = "flex";
    }

    const currentPfp = currentUser?.pfp || PRESET_AVATARS[0];
    if (editPfpPreview) editPfpPreview.src = currentPfp;
    if (inputUsername) inputUsername.value = currentUser?.username || "";
    if (inputDisplayName) inputDisplayName.value = currentUser?.displayName || "";
    if (inputBio) inputBio.value = currentUser?.bio || "";

    renderPresetAvatarChips(currentPfp);
  }

  function closeProfileModal() {
    if (profileModal) profileModal.style.display = "none";
  }

  function renderPresetAvatarChips(selectedUrl) {
    if (!presetAvatarChips) return;
    presetAvatarChips.innerHTML = PRESET_AVATARS.map((url) => `
      <button class="avatar-chip ${url === selectedUrl ? "selected" : ""}" type="button" data-url="${url}">
        <img src="${url}" alt="Avatar">
      </button>
    `).join("");

    presetAvatarChips.querySelectorAll(".avatar-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        if (editPfpPreview) editPfpPreview.src = url;
        renderPresetAvatarChips(url);
      });
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
        if (editPfpPreview) editPfpPreview.src = base64;

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
              if (editPfpPreview) editPfpPreview.src = data.proxyUrl;
            }
          }
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSaveProfile() {
    const handle = (inputUsername?.value || "").toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    const displayName = (inputDisplayName?.value || "").trim() || handle;
    const bio = (inputBio?.value || "").trim();
    const pfp = editPfpPreview?.src || PRESET_AVATARS[0];

    if (!handle || handle.length < 2) {
      alert("Please enter a valid username (at least 2 letters, numbers, or underscore).");
      return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    try {
      const res = await fetch("/api/msg?action=register_or_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_or_login",
          username: handle,
          displayName,
          bio,
          pfp,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save profile");
      }

      const data = await res.json();
      currentUser = data.user;
      localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));

      renderNavProfile();
      closeProfileModal();

      await loadConversations();
      await openChat(activeConvoId);
    } catch (err) {
      alert("Could not register username: " + err.message);
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Changes";
    }
  }

  if (saveProfileBtn) saveProfileBtn.addEventListener("click", handleSaveProfile);
  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeProfileModal);
  if (userProfileChip) userProfileChip.addEventListener("click", () => openProfileModal(false));

  function renderNavProfile() {
    if (!currentUser) return;
    if (navUserPfp) navUserPfp.src = currentUser.pfp || PRESET_AVATARS[0];
    if (navDisplayName) navDisplayName.textContent = currentUser.displayName || currentUser.username;
    if (navUsername) navUsername.textContent = `@${currentUser.username}`;
  }

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

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------------------------------------------------------------------------
  // Load Conversations List from Real Database
  // ---------------------------------------------------------------------------
  async function loadConversations() {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/msg?action=get_conversations&username=${encodeURIComponent(currentUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        conversations = data.conversations || [];
        renderConversationList();
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }

  function renderConversationList() {
    if (!conversationList) return;

    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <div class="empty-state-card" style="padding: 30px 20px; text-align: center; color: var(--text-secondary);">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: var(--accent-cyan);">
            ${ICONS.userPlus}
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">No chats yet</div>
          <div style="font-size: 12px; line-height: 1.4; margin-bottom: 16px;">Search any @username to start a direct message or join Global Lounge.</div>
          <button class="modal-primary-btn" id="emptyStartChatBtn" type="button" style="padding: 8px 16px; font-size: 12px;">Start New Chat</button>
        </div>
      `;
      const btn = document.getElementById("emptyStartChatBtn");
      if (btn) btn.addEventListener("click", () => openNewChatModal());
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

      const timeStr = lastMsg?.time ? formatTime(lastMsg.time) : "";
      const isUnread = (c.unread || 0) > 0;

      return `
        <div class="convo-item ${isActive ? "active" : ""} ${isUnread ? "unread" : ""}" data-id="${c.id}">
          <div class="convo-pfp-wrap">
            <img class="convo-pfp" src="${c.pfp || PRESET_AVATARS[0]}" alt="Avatar" onerror="this.src='${PRESET_AVATARS[0]}'">
            ${c.isOnline ? '<div class="convo-online-dot"></div>' : ""}
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
    activeConvoId = chatId;

    let meta = conversations.find((c) => c.id === chatId) || newContactMeta;
    if (!meta && chatId === "general") {
      meta = {
        id: "general",
        type: "channel",
        handle: "general",
        name: "Global Lounge",
        pfp: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150",
        status: "Active Community",
        verified: true,
      };
    } else if (!meta) {
      meta = {
        id: chatId,
        type: "direct",
        handle: chatId.replace("dm_", "").replace("__", " & "),
        name: chatId,
        pfp: PRESET_AVATARS[0],
        status: "Online",
      };
    }
    activeConvoMeta = meta;

    if (activeContactPfp) activeContactPfp.src = meta.pfp || PRESET_AVATARS[0];
    if (activeContactName) activeContactName.textContent = meta.name || meta.handle;
    if (activeContactHandle) activeContactHandle.textContent = `@${meta.handle || meta.id}`;
    if (activeContactStatus) activeContactStatus.textContent = meta.status || "Active now";
    if (activeVerifiedBadge) activeVerifiedBadge.style.display = meta.verified ? "inline-flex" : "none";

    if (window.innerWidth <= 768 && msgWorkspace) {
      msgWorkspace.classList.add("mobile-chat-open");
    }

    renderConversationList();

    loadedMessageIds.clear();
    lastMessageTimestamp = 0;
    if (messagesFlow) messagesFlow.innerHTML = '<div style="text-align:center; padding: 30px; color: var(--text-secondary); font-size: 13px;">Loading messages...</div>';

    await loadChatHistory(chatId);

    if (messageTextInput) messageTextInput.focus();

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
  async function loadChatHistory(chatId) {
    try {
      const res = await fetch(`/api/msg?action=get_messages&chatId=${encodeURIComponent(chatId)}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      const messages = data.messages || [];

      if (messagesFlow) messagesFlow.innerHTML = "";
      loadedMessageIds.clear();

      if (messages.length === 0) {
        messagesFlow.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; color: var(--text-secondary);">
            <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">No messages here yet</div>
            <div style="font-size: 12px;">Say hello to start the conversation over AS Cloud!</div>
          </div>
        `;
      } else {
        messages.forEach((msg) => {
          renderMessage(msg, false);
        });
      }

      scrollToBottom();
    } catch (err) {
      console.error("Error loading chat history:", err);
      if (messagesFlow) messagesFlow.innerHTML = '<div style="text-align:center; padding: 20px; color: #ff453a; font-size: 12px;">Failed to load messages. Please try again.</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // Render Individual Message
  // ---------------------------------------------------------------------------
  function renderMessage(m, animate = true) {
    if (!messagesFlow || loadedMessageIds.has(m.id)) return;
    loadedMessageIds.add(m.id);

    if (m.timestamp > lastMessageTimestamp) {
      lastMessageTimestamp = m.timestamp;
    }

    const isOut = currentUser && m.sender.toLowerCase() === currentUser.username.toLowerCase();
    const senderPfp = m.senderPfp || PRESET_AVATARS[0];
    const senderName = m.senderName || m.sender;

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
      bodyContent += `<div>${escapeHtml(m.text)}</div>`;
    }

    const timeStr = formatTime(m.timestamp || Date.now());

    let receiptHtml = "";
    if (isOut) {
      if (m.status === "read") {
        receiptHtml = `<span class="msg-receipt-icon read" title="Read">${ICONS.checkDouble}</span>`;
      } else if (m.status === "delivered") {
        receiptHtml = `<span class="msg-receipt-icon" title="Delivered">${ICONS.checkDouble}</span>`;
      } else {
        receiptHtml = `<span class="msg-receipt-icon" title="Sent">${ICONS.checkSingle}</span>`;
      }
    }

    const html = `
      <div class="msg-row ${isOut ? "outgoing" : "incoming"} ${animate ? "animate-in" : ""}" id="${m.id}">
        <img class="msg-bubble-pfp" src="${senderPfp}" alt="Avatar" onerror="this.src='${PRESET_AVATARS[0]}'">
        <div class="msg-bubble-content">
          ${!isOut && activeConvoMeta.type === "channel" ? `<span class="msg-sender-name">${escapeHtml(senderName)}</span>` : ""}
          <div class="msg-bubble">
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
    // Media Photo Lightbox
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

    // Voice Note Player
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
  // Send Message (Real Live Network Operation)
  // ---------------------------------------------------------------------------
  async function handleSendMessage(text = "", media = null) {
    if (!text.trim() && !media) return;
    if (!currentUser) {
      openProfileModal(true);
      return;
    }

    const cleanText = text.trim();
    if (messageTextInput) {
      messageTextInput.value = "";
      autoResizeTextarea();
    }

    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      chatId: activeConvoId,
      sender: currentUser.username,
      senderName: currentUser.displayName || currentUser.username,
      senderPfp: currentUser.pfp,
      recipient: activeConvoMeta.type === "direct" ? activeConvoMeta.handle : null,
      text: cleanText,
      mediaType: media ? media.type : null,
      mediaUrl: media ? media.url : null,
      duration: media ? media.duration : null,
      timestamp: Date.now(),
      status: "sent",
    };

    renderMessage(optimisticMsg, true);
    scrollToBottom();
    playChime("sent");

    try {
      const res = await fetch("/api/msg?action=send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          chatId: activeConvoId,
          sender: currentUser.username,
          recipient: activeConvoMeta.type === "direct" ? activeConvoMeta.handle : null,
          text: cleanText,
          mediaType: media ? media.type : null,
          mediaUrl: media ? media.url : null,
          duration: media ? media.duration : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverMsg = data.message;
        const row = document.getElementById(optimisticMsg.id);
        if (row && serverMsg) {
          row.id = serverMsg.id;
          loadedMessageIds.delete(optimisticMsg.id);
          loadedMessageIds.add(serverMsg.id);
          const receipt = row.querySelector(".msg-receipt-icon");
          if (receipt) receipt.innerHTML = ICONS.checkDouble;
        }
      }
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
  // Media Attachments & GitHub Releases CDN Upload
  // ---------------------------------------------------------------------------
  if (attachMediaBtn && mediaFileInput) {
    attachMediaBtn.addEventListener("click", () => mediaFileInput.click());
    mediaFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = async (ev) => {
        const base64 = ev.target.result;
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

        handleSendMessage("", {
          type: isImg ? "image" : "file",
          url: cdnUrl,
        });
        mediaFileInput.value = "";
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------------------
  // Voice Note Recorder (MediaRecorder API)
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
  // Real-Time Polling Engine (Every 1.5s - Live Sync)
  // ---------------------------------------------------------------------------
  async function syncLiveMessages() {
    if (!currentUser) return;
    try {
      const url = `/api/msg?action=sync&username=${encodeURIComponent(currentUser.username)}&chatId=${encodeURIComponent(activeConvoId)}&since=${lastMessageTimestamp}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const newMsgs = data.newMessages || [];

      if (newMsgs.length > 0) {
        let hasIncoming = false;
        newMsgs.forEach((m) => {
          if (!loadedMessageIds.has(m.id)) {
            renderMessage(m, true);
            if (m.sender.toLowerCase() !== currentUser.username.toLowerCase()) {
              hasIncoming = true;
            }
          }
        });
        if (hasIncoming) {
          playChime("received");
          scrollToBottom();
          fetch("/api/msg?action=mark_read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: activeConvoId, username: currentUser.username }),
          });
        }
      }
    } catch (_) {}
  }

  syncInterval = setInterval(syncLiveMessages, 1500);

  setInterval(() => {
    if (currentUser) loadConversations();
  }, 6000);

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
      const users = data.users || [];

      if (users.length === 0) {
        quickContactsList.innerHTML = `
          <div style="padding: 20px 10px; text-align: center; color: var(--text-secondary); font-size: 12px;">
            No users found matching "${escapeHtml(query)}".
          </div>
        `;
        return;
      }

      quickContactsList.innerHTML = users.map((u) => `
        <div class="quick-contact-card" data-username="${u.username}" data-name="${escapeHtml(u.displayName)}" data-pfp="${u.pfp}">
          <div style="position: relative;">
            <img class="quick-contact-pfp" src="${u.pfp || PRESET_AVATARS[0]}" alt="Avatar" onerror="this.src='${PRESET_AVATARS[0]}'">
            ${u.isOnline ? '<div class="convo-online-dot"></div>' : ""}
          </div>
          <div class="quick-contact-info">
            <div class="quick-contact-name">
              ${escapeHtml(u.displayName || u.username)}
              ${u.verified ? `<span class="verified-glyph">${ICONS.verified}</span>` : ""}
            </div>
            <div class="quick-contact-handle">@${u.username} ${u.isOnline ? '• Online' : ''}</div>
          </div>
          <button class="quick-chat-action-btn" type="button">Chat</button>
        </div>
      `).join("");

      quickContactsList.querySelectorAll(".quick-contact-card").forEach((card) => {
        card.addEventListener("click", () => {
          const handle = card.getAttribute("data-username");
          const name = card.getAttribute("data-name");
          const pfp = card.getAttribute("data-pfp");
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
      openProfileModal(true);
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
      pfp: targetPfp || PRESET_AVATARS[0],
      status: "Active now",
    };

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

  // Filter tabs (All / Direct / Channels)
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.getAttribute("data-filter");
      document.querySelectorAll(".convo-item").forEach((item) => {
        const id = item.getAttribute("data-id");
        if (filter === "all") item.style.display = "flex";
        else if (filter === "direct") item.style.display = id.startsWith("dm_") ? "flex" : "none";
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
    });
  }

  // Lightbox Close
  if (closeLightboxBtn && mediaLightbox) {
    closeLightboxBtn.addEventListener("click", () => {
      mediaLightbox.style.display = "none";
    });
  }

  // ---------------------------------------------------------------------------
  // Initialization Routine
  // ---------------------------------------------------------------------------
  async function init() {
    if (!currentUser) {
      openProfileModal(true);
    } else {
      renderNavProfile();
    }

    if (relayStatusText) relayStatusText.textContent = "AS Cloud • 5 Relay Nodes Active";

    await loadConversations();
    await openChat(activeConvoId);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
