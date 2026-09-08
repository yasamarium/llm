// home.js - AS Messages Live Cloud Messaging Engine
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Vector SVG Icons Registry (Zero Emojis Enforced)
  // ---------------------------------------------------------------------------
  const ICONS = {
    checkSingle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkDouble: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 9 17 4 12"/><polyline points="22 10 13 19 11 17"/></svg>`,
    play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    verified: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#0a84ff"><path d="M12 2l2.4 2.8 3.7-.4 1.2 3.5 3.4 1.6-1.1 3.5 1.1 3.5-3.4 1.6-1.2 3.5-3.7-.4L12 22l-2.4-2.8-3.7.4-1.2-3.5-3.4-1.6 1.1-3.5-1.1-3.5 3.4-1.6 1.2-3.5 3.7.4L12 2z"/><path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  };

  // ---------------------------------------------------------------------------
  // Web Audio Synthesized Chimes (Zero External Assets)
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
        // Crisp gentle rising blip
        osc.type = "sine";
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        // Soft double received pop
        osc.type = "sine";
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.setValueAtTime(940, now + 0.06);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // User Profile State & Storage
  // ---------------------------------------------------------------------------
  const DEFAULT_USER = {
    username: "cloud_pilot",
    displayName: "Cloud Pilot",
    bio: "Building on AS Cloud Intelligence",
    pfp: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  };

  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  ];

  let currentUser = { ...DEFAULT_USER };
  try {
    const saved = localStorage.getItem("as_msg_current_user");
    if (saved) currentUser = { ...DEFAULT_USER, ...JSON.parse(saved) };
  } catch (_) {}

  function saveCurrentUser() {
    try {
      localStorage.setItem("as_msg_current_user", JSON.stringify(currentUser));
    } catch (_) {}
    renderNavProfile();
  }

  // ---------------------------------------------------------------------------
  // Seeded Network Contacts & Conversations
  // ---------------------------------------------------------------------------
  const INITIAL_CONVERSATIONS = [
    {
      id: "cloud_fleet",
      type: "channel",
      handle: "cloud_fleet",
      name: "AS Cloud Fleet",
      pfp: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150",
      verified: true,
      status: "Cluster Online • 22 Nodes",
      lastSeen: "Online",
      unread: 1,
      messages: [
        {
          id: "m1",
          sender: "cloud_fleet",
          text: "Welcome to AS Messages. All 22 cluster nodes are synchronized and ready for live message routing.",
          time: "10:00 AM",
          status: "read",
        },
      ],
    },
    {
      id: "elon_ai",
      type: "direct",
      handle: "elon_ai",
      name: "Elon Musk AI",
      pfp: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
      verified: true,
      status: "Building multiplanetary comms",
      lastSeen: "Active now",
      unread: 0,
      messages: [
        {
          id: "m2",
          sender: "elon_ai",
          text: "Supersonic live messaging looks great. What are you building next on AS Cloud?",
          time: "10:14 AM",
          status: "read",
        },
      ],
    },
    {
      id: "sama_core",
      type: "direct",
      handle: "sama_core",
      name: "Sam Altman",
      pfp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      verified: true,
      status: "Frontiers of Intelligence",
      lastSeen: "Active 5m ago",
      unread: 0,
      messages: [
        {
          id: "m3",
          sender: "sama_core",
          text: "Low latency live messaging is super clean. The iOS 18 glass design is crisp.",
          time: "9:42 AM",
          status: "read",
        },
      ],
    },
    {
      id: "linus_dev",
      type: "direct",
      handle: "linus_dev",
      name: "Linus Torvalds",
      pfp: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      verified: true,
      status: "Talk is cheap. Show me the code.",
      lastSeen: "Online",
      unread: 0,
      messages: [
        {
          id: "m4",
          sender: "linus_dev",
          text: "Good to see 0 lag and hardware acceleration. Keep it lightweight.",
          time: "Yesterday",
          status: "read",
        },
      ],
    },
    {
      id: "general_chat",
      type: "channel",
      handle: "general",
      name: "Global Lounge",
      pfp: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150",
      verified: false,
      status: "Public Channel • 142 online",
      lastSeen: "Active now",
      unread: 0,
      messages: [
        {
          id: "m5",
          sender: "system",
          text: "Welcome to the Global Lounge channel. Connect with anyone via @username.",
          time: "Yesterday",
          status: "read",
        },
      ],
    },
  ];

  let conversations = [];
  try {
    const saved = localStorage.getItem("as_msg_conversations_v2");
    if (saved) {
      conversations = JSON.parse(saved);
    } else {
      conversations = INITIAL_CONVERSATIONS;
    }
  } catch (_) {
    conversations = INITIAL_CONVERSATIONS;
  }

  function saveConversations() {
    try {
      localStorage.setItem("as_msg_conversations_v2", JSON.stringify(conversations));
    } catch (_) {}
  }

  let activeConvoId = conversations[0]?.id || "cloud_fleet";
  let activeFilter = "all";

  // ---------------------------------------------------------------------------
  // DOM Elements
  // ---------------------------------------------------------------------------
  const msgWorkspace = document.getElementById("msgWorkspace");
  const conversationListEl = document.getElementById("conversationList");
  const chatMessagesContainer = document.getElementById("chatMessagesContainer");
  const messagesFlow = document.getElementById("messagesFlow");
  const scrollBottomBtn = document.getElementById("scrollBottomBtn");
  const messageTextInput = document.getElementById("messageTextInput");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const attachMediaBtn = document.getElementById("attachMediaBtn");
  const mediaFileInput = document.getElementById("mediaFileInput");
  const voiceRecordBtn = document.getElementById("voiceRecordBtn");
  const recordingLiveBar = document.getElementById("recordingLiveBar");
  const recordingTimeEl = document.getElementById("recordingTime");
  const cancelRecordBtn = document.getElementById("cancelRecordBtn");
  const sendRecordBtn = document.getElementById("sendRecordBtn");
  const chatSearchInput = document.getElementById("chatSearchInput");
  const mobileBackBtn = document.getElementById("mobileBackBtn");
  const remoteTypingIndicator = document.getElementById("remoteTypingIndicator");
  const remoteTypingText = document.getElementById("remoteTypingText");

  // Profile Navbar Elements
  const userProfileChip = document.getElementById("userProfileChip");
  const navUserPfp = document.getElementById("navUserPfp");
  const navDisplayName = document.getElementById("navDisplayName");
  const navUsername = document.getElementById("navUsername");

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
  const openNewChatBtn = document.getElementById("openNewChatBtn");
  const closeNewChatModalBtn = document.getElementById("closeNewChatModalBtn");
  const newChatHandleInput = document.getElementById("newChatHandleInput");
  const startChatByHandleBtn = document.getElementById("startChatByHandleBtn");
  const quickContactsList = document.getElementById("quickContactsList");

  // Media Lightbox
  const mediaLightbox = document.getElementById("mediaLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");

  // ---------------------------------------------------------------------------
  // Profile UI Rendering & Management
  // ---------------------------------------------------------------------------
  function renderNavProfile() {
    if (navUserPfp) navUserPfp.src = currentUser.pfp;
    if (navDisplayName) navDisplayName.textContent = currentUser.displayName;
    if (navUsername) navUsername.textContent = `@${currentUser.username}`;
  }

  function openProfileModal() {
    if (!profileModal) return;
    editPfpPreview.src = currentUser.pfp;
    inputUsername.value = currentUser.username;
    inputDisplayName.value = currentUser.displayName;
    inputBio.value = currentUser.bio;

    // Render preset avatar chips
    presetAvatarChips.innerHTML = PRESET_AVATARS.map(
      (src) => `<img src="${src}" class="${src === currentUser.pfp ? "selected" : ""}" alt="Avatar">`
    ).join("");

    presetAvatarChips.querySelectorAll("img").forEach((img) => {
      img.addEventListener("click", () => {
        presetAvatarChips.querySelectorAll("img").forEach((i) => i.classList.remove("selected"));
        img.classList.add("selected");
        editPfpPreview.src = img.src;
      });
    });

    profileModal.style.display = "flex";
  }

  function closeProfileModal() {
    if (profileModal) profileModal.style.display = "none";
  }

  if (userProfileChip) userProfileChip.addEventListener("click", openProfileModal);
  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeProfileModal);

  if (uploadPfpTrigger && pfpFileInput) {
    uploadPfpTrigger.addEventListener("click", () => pfpFileInput.click());
    pfpFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        editPfpPreview.src = base64;
        try {
          // Attempt upload to release storage
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, filename: `pfp_${Date.now()}.jpg` }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.proxyUrl) editPfpPreview.src = data.proxyUrl;
          }
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      const cleanHandle = inputUsername.value.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
      if (!cleanHandle) {
        alert("Please enter a valid username (letters, numbers, underscore).");
        return;
      }
      currentUser.username = cleanHandle;
      currentUser.displayName = inputDisplayName.value.trim() || cleanHandle;
      currentUser.bio = inputBio.value.trim() || "Available on AS Cloud";
      currentUser.pfp = editPfpPreview.src;
      saveCurrentUser();
      closeProfileModal();
      renderActiveChat();
    });
  }

  // ---------------------------------------------------------------------------
  // New Chat Modal & User Discovery
  // ---------------------------------------------------------------------------
  function openNewChatModal() {
    if (!newChatModal) return;
    newChatHandleInput.value = "";
    renderQuickContacts();
    newChatModal.style.display = "flex";
    setTimeout(() => newChatHandleInput.focus(), 50);
  }

  function closeNewChatModal() {
    if (newChatModal) newChatModal.style.display = "none";
  }

  function renderQuickContacts() {
    if (!quickContactsList) return;
    const suggestions = [
      { handle: "elon_ai", name: "Elon Musk AI", pfp: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100" },
      { handle: "sama_core", name: "Sam Altman", pfp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
      { handle: "linus_dev", name: "Linus Torvalds", pfp: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" },
      { handle: "cloud_support", name: "AS Cloud Team", pfp: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100" },
    ];

    quickContactsList.innerHTML = suggestions.map((c) => `
      <div class="quick-contact-item" data-handle="${c.handle}" data-name="${c.name}" data-pfp="${c.pfp}">
        <img src="${c.pfp}" alt="${c.name}">
        <div>
          <div class="quick-contact-name">${escapeHtml(c.name)}</div>
          <div class="quick-contact-handle">@${escapeHtml(c.handle)}</div>
        </div>
      </div>
    `).join("");

    quickContactsList.querySelectorAll(".quick-contact-item").forEach((item) => {
      item.addEventListener("click", () => {
        const handle = item.getAttribute("data-handle");
        const name = item.getAttribute("data-name");
        const pfp = item.getAttribute("data-pfp");
        initiateChatWithUser(handle, name, pfp);
        closeNewChatModal();
      });
    });
  }

  function initiateChatWithUser(rawHandle, optName = null, optPfp = null) {
    const handle = rawHandle.trim().replace(/^@+/, "").toLowerCase();
    if (!handle) return;

    // Check if already in conversations
    let convo = conversations.find((c) => c.handle.toLowerCase() === handle);
    if (!convo) {
      // Create new DM thread with this username
      const randomSeed = Math.floor(Math.random() * 1000);
      convo = {
        id: `dm_${handle}_${Date.now()}`,
        type: "direct",
        handle: handle,
        name: optName || handle.charAt(0).toUpperCase() + handle.slice(1),
        pfp: optPfp || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&seed=${randomSeed}`,
        verified: false,
        status: "Active now",
        lastSeen: "Online",
        unread: 0,
        messages: [
          {
            id: `msg_${Date.now()}`,
            sender: handle,
            text: `Hey @${currentUser.username}! You started a conversation with @${handle}.`,
            time: formatTime(new Date()),
            status: "read",
          },
        ],
      };
      conversations.unshift(convo);
      saveConversations();
    }

    activeConvoId = convo.id;
    renderConversationList();
    renderActiveChat();

    // On mobile viewports, transition to chat view
    if (window.innerWidth <= 768 && msgWorkspace) {
      msgWorkspace.classList.add("chat-open");
    }
  }

  if (openNewChatBtn) openNewChatBtn.addEventListener("click", openNewChatModal);
  if (closeNewChatModalBtn) closeNewChatModalBtn.addEventListener("click", closeNewChatModal);
  if (startChatByHandleBtn && newChatHandleInput) {
    startChatByHandleBtn.addEventListener("click", () => {
      const val = newChatHandleInput.value.trim();
      if (val) {
        initiateChatWithUser(val);
        closeNewChatModal();
      }
    });
    newChatHandleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startChatByHandleBtn.click();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Conversation List Rendering
  // ---------------------------------------------------------------------------
  function renderConversationList() {
    if (!conversationListEl) return;
    const query = chatSearchInput ? chatSearchInput.value.toLowerCase().trim() : "";

    const filtered = conversations.filter((c) => {
      if (activeFilter === "direct" && c.type !== "direct") return false;
      if (activeFilter === "channels" && c.type !== "channel") return false;
      if (query) {
        return (
          c.name.toLowerCase().includes(query) ||
          c.handle.toLowerCase().includes(query) ||
          (c.messages.length && c.messages[c.messages.length - 1].text.toLowerCase().includes(query))
        );
      }
      return true;
    });

    conversationListEl.innerHTML = filtered.map((c) => {
      const lastMsg = c.messages.length ? c.messages[c.messages.length - 1] : null;
      const lastText = lastMsg ? (lastMsg.mediaType ? `[${lastMsg.mediaType.toUpperCase()}]` : lastMsg.text) : "No messages yet";
      const lastTime = lastMsg ? lastMsg.time : "";
      const isActive = c.id === activeConvoId;
      const statusClass = c.lastSeen === "Online" || c.lastSeen.includes("Active") ? "online" : "away";

      return `
        <div class="conversation-item ${isActive ? "active" : ""}" data-id="${c.id}">
          <div class="convo-pfp-box">
            <img src="${c.pfp}" alt="${escapeHtml(c.name)}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'">
            <div class="convo-status-dot ${statusClass}"></div>
          </div>
          <div class="convo-info">
            <div class="convo-top-row">
              <span class="convo-name">${escapeHtml(c.name)}</span>
              <span class="convo-time">${escapeHtml(lastTime)}</span>
            </div>
            <div class="convo-bottom-row">
              <span class="convo-last-msg">${escapeHtml(lastText)}</span>
              ${c.unread > 0 ? `<span class="convo-unread-badge">${c.unread}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    conversationListEl.querySelectorAll(".conversation-item").forEach((el) => {
      el.addEventListener("click", () => {
        activeConvoId = el.getAttribute("data-id");
        const activeConvo = conversations.find((c) => c.id === activeConvoId);
        if (activeConvo) activeConvo.unread = 0;
        saveConversations();
        renderConversationList();
        renderActiveChat();
        if (window.innerWidth <= 768 && msgWorkspace) {
          msgWorkspace.classList.add("chat-open");
        }
      });
    });
  }

  // Filter tabs handler
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter") || "all";
      renderConversationList();
    });
  });

  if (chatSearchInput) {
    chatSearchInput.addEventListener("input", renderConversationList);
  }

  if (mobileBackBtn) {
    mobileBackBtn.addEventListener("click", () => {
      if (msgWorkspace) msgWorkspace.classList.remove("chat-open");
    });
  }

  // ---------------------------------------------------------------------------
  // Active Chat Workspace Rendering
  // ---------------------------------------------------------------------------
  function getActiveConvo() {
    return conversations.find((c) => c.id === activeConvoId) || conversations[0];
  }

  function renderActiveChat() {
    const convo = getActiveConvo();
    if (!convo) return;

    // Header updates
    const activeContactPfp = document.getElementById("activeContactPfp");
    const activeContactName = document.getElementById("activeContactName");
    const activeContactHandle = document.getElementById("activeContactHandle");
    const activeContactStatus = document.getElementById("activeContactStatus");
    const activeVerifiedBadge = document.getElementById("activeVerifiedBadge");

    if (activeContactPfp) activeContactPfp.src = convo.pfp;
    if (activeContactName) activeContactName.textContent = convo.name;
    if (activeContactHandle) activeContactHandle.textContent = `@${convo.handle}`;
    if (activeContactStatus) activeContactStatus.textContent = convo.status;
    if (activeVerifiedBadge) activeVerifiedBadge.style.display = convo.verified ? "inline-flex" : "none";

    // Allow clicking active contact PFP to inspect
    if (activeContactPfp) {
      activeContactPfp.onclick = () => openLightbox(convo.pfp, `@${convo.handle} (${convo.name})`);
    }

    // Render Messages Stream
    if (!messagesFlow) return;
    messagesFlow.innerHTML = convo.messages.map((m) => renderMessageHtml(m, convo)).join("");

    // Bind media clicks and voice player events
    bindMessageInteractions();

    scrollToBottom();
  }

  function renderMessageHtml(m, convo) {
    const isOut = m.sender === currentUser.username || m.sender === "you";
    const senderPfp = isOut ? currentUser.pfp : convo.pfp;
    const senderName = isOut ? currentUser.displayName : convo.name;

    // Status glyph
    let statusIcon = "";
    if (isOut) {
      if (m.status === "read") {
        statusIcon = `<span class="msg-receipt-icon read" title="Read">${ICONS.checkDouble}</span>`;
      } else if (m.status === "delivered") {
        statusIcon = `<span class="msg-receipt-icon" title="Delivered">${ICONS.checkDouble}</span>`;
      } else {
        statusIcon = `<span class="msg-receipt-icon" title="Sent">${ICONS.checkSingle}</span>`;
      }
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

    if (m.text && m.mediaType !== "audio") {
      bodyContent += `<div>${escapeHtml(m.text)}</div>`;
    }

    return `
      <div class="msg-row ${isOut ? "outgoing" : "incoming"}" id="${m.id}">
        <img class="msg-bubble-pfp" src="${senderPfp}" alt="Avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'">
        <div class="msg-bubble-content">
          ${!isOut && convo.type === "channel" ? `<span class="msg-sender-name">${escapeHtml(senderName)}</span>` : ""}
          <div class="msg-bubble">
            ${bodyContent}
            <div class="msg-meta-row">
              <span class="msg-time">${escapeHtml(m.time)}</span>
              ${statusIcon}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindMessageInteractions() {
    // Media photo click -> lightbox
    messagesFlow.querySelectorAll(".msg-media-photo").forEach((box) => {
      box.onclick = () => {
        const url = box.getAttribute("data-url");
        const cap = box.getAttribute("data-caption");
        openLightbox(url, cap);
      };
    });

    // Voice Note Player bind
    messagesFlow.querySelectorAll(".voice-note-card").forEach((card) => {
      const audio = card.querySelector("audio");
      const playBtn = card.querySelector(".vn-play-btn");
      if (!audio || !playBtn) return;

      playBtn.onclick = () => {
        if (audio.paused) {
          // Pause any other playing voice notes
          document.querySelectorAll("audio").forEach((a) => {
            if (a !== audio) {
              a.pause();
              a.currentTime = 0;
            }
          });
          document.querySelectorAll(".voice-note-card").forEach((c) => c.classList.remove("playing"));
          document.querySelectorAll(".vn-play-btn").forEach((b) => (b.innerHTML = ICONS.play));

          audio.play().catch(() => {});
          playBtn.innerHTML = ICONS.pause;
          card.classList.add("playing");
        } else {
          audio.pause();
          playBtn.innerHTML = ICONS.play;
          card.classList.remove("playing");
        }
      };

      audio.onended = () => {
        playBtn.innerHTML = ICONS.play;
        card.classList.remove("playing");
      };
    });
  }

  function scrollToBottom() {
    if (!chatMessagesContainer) return;
    requestAnimationFrame(() => {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
  }

  if (chatMessagesContainer && scrollBottomBtn) {
    chatMessagesContainer.addEventListener("scroll", () => {
      const distFromBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight;
      scrollBottomBtn.style.display = distFromBottom > 160 ? "flex" : "none";
    });
    scrollBottomBtn.addEventListener("click", scrollToBottom);
  }

  // ---------------------------------------------------------------------------
  // Sending Messages & Natural Interaction Pipeline
  // ---------------------------------------------------------------------------
  function sendOutgoingMessage(text = "", media = null) {
    if (!text.trim() && !media) return;

    const convo = getActiveConvo();
    if (!convo) return;

    const msgId = `m_${Date.now()}`;
    const newMsg = {
      id: msgId,
      sender: currentUser.username,
      text: text.trim(),
      time: formatTime(new Date()),
      status: "sent",
      mediaType: media ? media.type : null,
      mediaUrl: media ? media.url : null,
      duration: media ? media.duration : null,
    };

    convo.messages.push(newMsg);
    saveConversations();

    // Optimistic UI Append
    messagesFlow.insertAdjacentHTML("beforeend", renderMessageHtml(newMsg, convo));
    bindMessageInteractions();
    scrollToBottom();
    renderConversationList();

    // Play local sent chime
    playChime("sent");

    // Clear input
    if (messageTextInput) {
      messageTextInput.value = "";
      autoResizeTextarea();
    }

    // Step 1: Delivered Transition after 550ms
    setTimeout(() => {
      newMsg.status = "delivered";
      saveConversations();
      const el = document.getElementById(msgId);
      if (el) {
        const receipt = el.querySelector(".msg-receipt-icon");
        if (receipt) receipt.innerHTML = ICONS.checkDouble;
      }
    }, 550);

    // Step 2: Read Receipt Transition after 1400ms
    setTimeout(() => {
      newMsg.status = "read";
      saveConversations();
      const el = document.getElementById(msgId);
      if (el) {
        const receipt = el.querySelector(".msg-receipt-icon");
        if (receipt) {
          receipt.className = "msg-receipt-icon read";
          receipt.innerHTML = ICONS.checkDouble;
        }
      }
    }, 1400);

    // Step 3: Natural Contact Reply Simulation (if direct message)
    if (convo.type === "direct") {
      triggerSimulatedReply(convo, text);
    }
  }

  function triggerSimulatedReply(convo, userText) {
    setTimeout(() => {
      if (remoteTypingIndicator && remoteTypingText) {
        remoteTypingText.textContent = `@${convo.handle} is typing...`;
        remoteTypingIndicator.style.display = "flex";
        scrollToBottom();
      }

      setTimeout(() => {
        if (remoteTypingIndicator) remoteTypingIndicator.style.display = "none";

        let replyText = `Received! Messaging @${currentUser.username} over AS Cloud relay.`;
        if (convo.handle === "elon_ai") {
          replyText = `Starlink optical relays confirmed. The latency here is almost zero.`;
        } else if (convo.handle === "sama_core") {
          replyText = `The UI fluidity is great. Keep scaling the cluster nodes.`;
        } else if (convo.handle === "linus_dev") {
          replyText = `Zero emojis and clean vector SVGs — exactly the way efficient code should look.`;
        }

        const replyMsg = {
          id: `reply_${Date.now()}`,
          sender: convo.handle,
          text: replyText,
          time: formatTime(new Date()),
          status: "read",
        };

        convo.messages.push(replyMsg);
        saveConversations();

        if (convo.id === activeConvoId) {
          messagesFlow.insertAdjacentHTML("beforeend", renderMessageHtml(replyMsg, convo));
          bindMessageInteractions();
          scrollToBottom();
          playChime("received");
        } else {
          convo.unread = (convo.unread || 0) + 1;
        }
        renderConversationList();
      }, 1600);
    }, 900);
  }

  if (sendMessageBtn && messageTextInput) {
    sendMessageBtn.addEventListener("click", () => sendOutgoingMessage(messageTextInput.value));
    messageTextInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendOutgoingMessage(messageTextInput.value);
      }
    });
  }

  function autoResizeTextarea() {
    if (!messageTextInput) return;
    messageTextInput.style.height = "auto";
    messageTextInput.style.height = `${Math.min(messageTextInput.scrollHeight, 140)}px`;
  }
  if (messageTextInput) {
    messageTextInput.addEventListener("input", autoResizeTextarea);
  }

  // ---------------------------------------------------------------------------
  // Media Attachments & GitHub Release Upload Pipeline
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
        let cdnUrl = base64; // Instant fallback

        try {
          // Attempt upload to AS Cloud / GitHub Release Storage
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              filename: `msg_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`,
              contentType: file.type,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.proxyUrl) cdnUrl = data.proxyUrl;
          }
        } catch (_) {}

        sendOutgoingMessage("", {
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
        mediaRecorder.start();

        recordSeconds = 0;
        recordingTimeEl.textContent = "0:00";
        recordingLiveBar.style.display = "flex";

        recordTimer = setInterval(() => {
          recordSeconds++;
          const mins = Math.floor(recordSeconds / 60);
          const secs = recordSeconds % 60;
          recordingTimeEl.textContent = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
        }, 1000);
      } catch (err) {
        alert("Microphone access is required to record voice notes.");
      }
    });

    cancelRecordBtn.addEventListener("click", () => {
      stopRecording(false);
    });

    sendRecordBtn.addEventListener("click", () => {
      stopRecording(true);
    });
  }

  function stopRecording(shouldSend) {
    if (recordTimer) clearInterval(recordTimer);
    recordingLiveBar.style.display = "none";

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = () => {
        if (shouldSend && audioChunks.length > 0) {
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(blob);
          const durationStr = recordingTimeEl.textContent;
          sendOutgoingMessage("", {
            type: "audio",
            url: audioUrl,
            duration: durationStr,
          });
        }
        audioChunks = [];
      };
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  // ---------------------------------------------------------------------------
  // Fullscreen Lightbox
  // ---------------------------------------------------------------------------
  function openLightbox(url, caption = "") {
    if (!mediaLightbox || !lightboxImage) return;
    lightboxImage.src = url;
    if (lightboxCaption) lightboxCaption.textContent = caption || "";
    mediaLightbox.style.display = "flex";
  }

  function closeLightbox() {
    if (mediaLightbox) mediaLightbox.style.display = "none";
  }
  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
  if (mediaLightbox) {
    mediaLightbox.addEventListener("click", (e) => {
      if (e.target === mediaLightbox) closeLightbox();
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
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
  // Initialize
  // ---------------------------------------------------------------------------
  renderNavProfile();
  renderConversationList();
  renderActiveChat();
})();
