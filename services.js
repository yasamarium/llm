// services.js - AS Cloud General Web Services & Developer Tools Engine
// Standalone Container Logic
// Strictly Zero Unicode Emojis

(function() {
  'use strict';

  // --- MD5 Hash Algorithm (Pure JavaScript Implementation) ---
  function computeMD5(string) {
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function md51(s) {
      var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
      for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i++) tail[i] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function md5blk(s) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    var hex_chr = '0123456789abcdef'.split('');
    function rhex(n) {
      var s = '', j = 0;
      for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
      return s;
    }
    function hex(x) {
      for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
      return x.join('');
    }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    return hex(md51(string));
  }

  // --- Web Crypto API SHA Hashes ---
  async function computeWebCryptoHash(algorithm, text) {
    if (!window.crypto || !window.crypto.subtle) return 'Web Crypto API unavailable';
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- UUID v4 Generator ---
  function generateUUIDv4() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // --- Toast Notification ---
  function showToast(msg) {
    const toast = document.getElementById('servicesToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- URL Helpers ---
  function getLocationOrigin() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        return window.location.origin;
      }
    } catch (e) {}
    return 'https://asllm.vercel.app';
  }

  // --- Default Presets for Links and Pastes ---
  const DEFAULT_LINKS = [
    { slug: 'game', url: '/game', title: 'Square Era 3D Voxel Sandbox', clicks: 148 },
    { slug: 'ai', url: '/', title: 'AS Intelligence Multi-Model Chat', clicks: 236 },
    { slug: 'webeditor', url: '/webeditor', title: 'Web Editor Studio', clicks: 89 },
    { slug: 'docs', url: 'https://github.com/yasamarium', title: 'AS Cloud GitHub Repositories', clicks: 64 }
  ];

  const DEFAULT_PASTES = [
    {
      slug: 'welcome-demo',
      title: 'Welcome to AS Cloud Services',
      lang: 'javascript',
      content: '// Welcome to AS Cloud Services & Tools Hub\n// Features: URL Shortener, QR Code Studio, Pastebin, Dev Utilities\nconsole.log("AS Cloud Platform Active");'
    }
  ];

  let cachedActiveLinks = [];
  let cachedActivePastes = [];

  // =========================================================================
  // 1. Primary Tab Navigation
  // =========================================================================
  function initTabNavigation() {
    const tabs = document.querySelectorAll('.service-tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        const tabKey = btn.dataset.tab;
        document.querySelectorAll('.service-panel').forEach(p => p.classList.remove('active'));

        const targetPanel = document.getElementById('panel' + tabKey.charAt(0).toUpperCase() + tabKey.slice(1));
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Update URL query param quietly
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', tabKey);
          window.history.replaceState({}, '', url.toString());
        } catch (e) {}
      });
    });

    // Subtab navigation in Developer Utilities
    const subtabs = document.querySelectorAll('.dev-subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.subtab;
        document.querySelectorAll('.dev-subpanel').forEach(sp => sp.classList.remove('active'));

        const panelEl = document.getElementById('devSub' + target.charAt(0).toUpperCase() + target.slice(1));
        if (panelEl) panelEl.classList.add('active');
      });
    });
  }

  // =========================================================================
  // 2. Link Shortener Logic
  // =========================================================================
  function initShortener() {
    const domainEl = document.getElementById('slugPrefixDomain');
    if (domainEl) {
      domainEl.textContent = `${getLocationOrigin()}/s/`;
    }

    const btnGenRandom = document.getElementById('btnGenRandomSlug');
    if (btnGenRandom) {
      btnGenRandom.addEventListener('click', () => {
        const input = document.getElementById('shortenerCustomSlug');
        if (input) {
          input.value = Math.random().toString(36).substring(2, 8);
          input.focus();
        }
      });
    }

    const form = document.getElementById('shortenerForm');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const urlInput = document.getElementById('shortenerLongUrl');
        const slugInput = document.getElementById('shortenerCustomSlug');
        const titleInput = document.getElementById('shortenerTitle');

        let longUrl = urlInput ? urlInput.value.trim() : '';
        let slug = slugInput ? slugInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
        const title = titleInput ? titleInput.value.trim() : '';

        if (!longUrl) {
          showToast('Please enter a destination URL.');
          return;
        }

        if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
          longUrl = 'https://' + longUrl;
        }

        if (!slug) {
          slug = Math.random().toString(36).substring(2, 8);
        }

        const origin = getLocationOrigin();
        const shortUrl = `${origin}/s/${slug}`;

        // Add to local storage
        let localLinks = [];
        try {
          const stored = localStorage.getItem('as_cloud_links');
          if (stored) localLinks = JSON.parse(stored);
        } catch (err) {}

        const linkRecord = {
          slug,
          url: longUrl,
          title: title || slug,
          clicks: 0,
          created_at: new Date().toISOString()
        };

        const idx = localLinks.findIndex(l => l.slug === slug);
        if (idx >= 0) localLinks[idx] = linkRecord;
        else localLinks.unshift(linkRecord);

        try {
          localStorage.setItem('as_cloud_links', JSON.stringify(localLinks));
        } catch (err) {}

        // Serverless persistence call to /api/s
        try {
          fetch('/api/s', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: longUrl, slug, title })
          }).catch(() => {});
        } catch (err) {}

        // Show result box
        const resultCard = document.getElementById('shortenerResultCard');
        const resultUrlEl = document.getElementById('shortenerResultUrl');
        const resultSlugEl = document.getElementById('shortenerResultSlug');
        const btnVisit = document.getElementById('btnVisitShortUrl');

        if (resultUrlEl) resultUrlEl.textContent = shortUrl;
        if (resultSlugEl) resultSlugEl.textContent = `/s/${slug}`;
        if (btnVisit) btnVisit.href = shortUrl;
        if (resultCard) resultCard.style.display = 'block';

        // Copy button
        const btnCopy = document.getElementById('btnCopyShortUrl');
        if (btnCopy) {
          btnCopy.onclick = () => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shortUrl);
              showToast(`Copied: ${shortUrl}`);
            }
          };
        }

        // Render QR in result box
        renderResultQR(shortUrl);

        loadAndRenderLinks();
        showToast(`Short link created: /s/${slug}`);
      });
    }

    const btnRefresh = document.getElementById('btnRefreshLinks');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        loadAndRenderLinks();
        showToast('Links refreshed');
      });
    }

    const btnClearLocal = document.getElementById('btnClearLocalLinks');
    if (btnClearLocal) {
      btnClearLocal.addEventListener('click', () => {
        if (confirm('Clear locally created links cache?')) {
          localStorage.removeItem('as_cloud_links');
          loadAndRenderLinks();
          showToast('Local links cache cleared');
        }
      });
    }
  }

  function renderResultQR(text) {
    const canvas = document.getElementById('shortenerResultQR');
    if (!canvas) return;
    drawQRCodeToCanvas(canvas, text, 120, '#000000', '#ffffff');

    const btnDownload = document.getElementById('btnDownloadShortQR');
    if (btnDownload) {
      btnDownload.onclick = () => {
        const link = document.createElement('a');
        link.download = `qr-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
    }
  }

  async function loadAndRenderLinks() {
    let localLinks = [];
    try {
      const stored = localStorage.getItem('as_cloud_links');
      if (stored) localLinks = JSON.parse(stored);
    } catch (e) {}

    let remoteLinks = [];
    try {
      const res = await fetch('https://raw.githubusercontent.com/yasamarium/cloudgame-db-sessions/main/data/links.json?t=' + Date.now(), { cache: 'no-cache' });
      if (res.ok) {
        remoteLinks = await res.json();
      }
    } catch (e) {}

    const map = new Map();
    DEFAULT_LINKS.forEach(l => map.set(l.slug, l));
    if (Array.isArray(remoteLinks)) remoteLinks.forEach(l => map.set(l.slug, l));
    if (Array.isArray(localLinks)) localLinks.forEach(l => map.set(l.slug, { ...map.get(l.slug), ...l }));

    cachedActiveLinks = Array.from(map.values());
    renderLinksTable(cachedActiveLinks);
  }

  function renderLinksTable(links) {
    const tbody = document.getElementById('linksTableBody');
    const badge = document.getElementById('activeLinksCountBadge');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (badge) badge.textContent = `${links.length} Links`;

    if (links.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 24px;">No short links generated yet. Create one above!</td></tr>';
      return;
    }

    const origin = getLocationOrigin();

    links.forEach(link => {
      const tr = document.createElement('tr');
      const shortUrl = `${origin}/s/${link.slug}`;

      tr.innerHTML = `
        <td>
          <div class="table-slug">/s/${escapeHtml(link.slug)}</div>
          <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(link.title || '')}</div>
        </td>
        <td>
          <div class="table-dest" title="${escapeHtml(link.url)}">${escapeHtml(link.url)}</div>
        </td>
        <td>
          <span style="font-family: monospace; color: #34d399;">${link.clicks || 0}</span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary btn-sm btn-copy-link" data-url="${escapeHtml(shortUrl)}" title="Copy Link">Copy</button>
            <a href="${escapeHtml(shortUrl)}" target="_blank" class="btn-secondary btn-sm" title="Visit Link">Open</a>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.url;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(u);
          showToast(`Copied: ${u}`);
        }
      });
    });
  }

  // =========================================================================
  // 3. QR Code Studio Logic
  // =========================================================================
  function initQRStudio() {
    const txtInput = document.getElementById('qrTextInput');
    const fgInput = document.getElementById('qrFgColor');
    const bgInput = document.getElementById('qrBgColor');
    const fgHex = document.getElementById('qrFgColorHex');
    const bgHex = document.getElementById('qrBgColorHex');
    const resSelect = document.getElementById('qrResolution');
    const eccSelect = document.getElementById('qrEccLevel');

    if (txtInput && !txtInput.value) {
      txtInput.value = getLocationOrigin();
    }

    function triggerQRUpdate() {
      const text = txtInput ? txtInput.value.trim() : '';
      const fg = fgInput ? fgInput.value : '#000000';
      const bg = bgInput ? bgInput.value : '#ffffff';
      const size = resSelect ? parseInt(resSelect.value) || 256 : 256;
      const ecc = eccSelect ? eccSelect.value : 'M';

      if (fgHex) fgHex.textContent = fg;
      if (bgHex) bgHex.textContent = bg;

      renderQRStudioCanvas(text || getLocationOrigin(), size, fg, bg, ecc);
    }

    if (txtInput) txtInput.addEventListener('input', triggerQRUpdate);
    if (fgInput) fgInput.addEventListener('input', triggerQRUpdate);
    if (bgInput) bgInput.addEventListener('input', triggerQRUpdate);
    if (resSelect) resSelect.addEventListener('change', triggerQRUpdate);
    if (eccSelect) eccSelect.addEventListener('change', triggerQRUpdate);

    // Presets
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (txtInput) {
          txtInput.value = btn.dataset.qr;
          triggerQRUpdate();
          showToast('Preset loaded');
        }
      });
    });

    // Download PNG
    const btnDownload = document.getElementById('btnDownloadQR');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const wrapper = document.getElementById('qrCanvasWrapper');
        const canvas = wrapper ? wrapper.querySelector('canvas') : null;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('QR Code PNG downloaded');
      });
    }

    // Copy Image to Clipboard
    const btnCopyImg = document.getElementById('btnCopyQRImage');
    if (btnCopyImg) {
      btnCopyImg.addEventListener('click', async () => {
        const wrapper = document.getElementById('qrCanvasWrapper');
        const canvas = wrapper ? wrapper.querySelector('canvas') : null;
        if (!canvas || !navigator.clipboard || !window.ClipboardItem) {
          showToast('Clipboard image copying unsupported on this browser.');
          return;
        }
        try {
          canvas.toBlob(async blob => {
            if (blob) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              showToast('QR Code image copied to clipboard');
            }
          });
        } catch (err) {
          showToast('Failed to copy image to clipboard');
        }
      });
    }

    triggerQRUpdate();
  }

  function renderQRStudioCanvas(text, size, fg, bg, ecc) {
    const wrapper = document.getElementById('qrCanvasWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    wrapper.appendChild(canvas);

    drawQRCodeToCanvas(canvas, text, size, fg, bg, ecc);
  }

  function drawQRCodeToCanvas(canvas, text, size, fg = '#000000', bg = '#ffffff', ecc = 'M') {
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    if (typeof QRCode !== 'undefined' && QRCode.QRCodeModel) {
      try {
        const qr = new QRCode.QRCodeModel(-1, QRCode.QRErrorCorrectLevel[ecc] || 0);
        qr.addData(text);
        qr.make();

        const count = qr.getModuleCount();
        const tileW = size / count;
        const tileH = size / count;

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = fg;
        for (let row = 0; row < count; row++) {
          for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) {
              ctx.fillRect(Math.round(col * tileW), Math.round(row * tileH), Math.ceil(tileW), Math.ceil(tileH));
            }
          }
        }
        return;
      } catch (e) {}
    }

    // Fallback: draw clean matrix pattern
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    ctx.fillRect(8, 8, size - 16, size - 16);
    ctx.fillStyle = bg;
    ctx.fillRect(16, 16, size - 32, size - 32);
    ctx.fillStyle = fg;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QR ENGINE', size / 2, size / 2);
  }

  // =========================================================================
  // 4. Cloud Pastebin Logic
  // =========================================================================
  function initPastebin() {
    const form = document.getElementById('pasteForm');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const titleInput = document.getElementById('pasteTitle');
        const langSelect = document.getElementById('pasteLang');
        const slugInput = document.getElementById('pasteCustomSlug');
        const contentArea = document.getElementById('pasteContent');

        const title = titleInput ? titleInput.value.trim() : '';
        const lang = langSelect ? langSelect.value : 'plaintext';
        let slug = slugInput ? slugInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
        const content = contentArea ? contentArea.value.trim() : '';

        if (!content) {
          showToast('Paste content cannot be empty.');
          return;
        }

        if (!slug) {
          slug = 'paste-' + Math.random().toString(36).substring(2, 8);
        }

        const pasteRecord = {
          slug,
          title: title || 'Untitled Snippet',
          lang,
          content,
          created_at: new Date().toISOString()
        };

        // Cache locally
        let localPastes = [];
        try {
          const stored = localStorage.getItem('as_cloud_pastes');
          if (stored) localPastes = JSON.parse(stored);
        } catch (err) {}

        const idx = localPastes.findIndex(p => p.slug === slug);
        if (idx >= 0) localPastes[idx] = pasteRecord;
        else localPastes.unshift(pasteRecord);

        try {
          localStorage.setItem('as_cloud_pastes', JSON.stringify(localPastes));
        } catch (err) {}

        // Serverless POST to /api/s?type=paste
        try {
          fetch('/api/s?type=paste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pasteRecord)
          }).catch(() => {});
        } catch (err) {}

        const origin = getLocationOrigin();
        const shareUrl = `${origin}/services?p=${slug}`;

        const resultCard = document.getElementById('pasteResultCard');
        const urlEl = document.getElementById('pasteResultUrl');
        const btnCopy = document.getElementById('btnCopyPasteResult');

        if (urlEl) urlEl.textContent = shareUrl;
        if (resultCard) resultCard.style.display = 'block';

        if (btnCopy) {
          btnCopy.onclick = () => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl);
              showToast(`Copied: ${shareUrl}`);
            }
          };
        }

        loadAndRenderPastes();
        showToast(`Snippet published: /services?p=${slug}`);
      });
    }

    const btnFormat = document.getElementById('btnFormatPaste');
    if (btnFormat) {
      btnFormat.addEventListener('click', () => {
        const contentEl = document.getElementById('pasteContent');
        const langEl = document.getElementById('pasteLang');
        if (!contentEl) return;
        const val = contentEl.value.trim();
        if (!val) return;

        if (langEl && langEl.value === 'json') {
          try {
            contentEl.value = JSON.stringify(JSON.parse(val), null, 2);
            showToast('JSON beautified');
          } catch (e) {
            showToast('Invalid JSON syntax');
          }
        } else {
          contentEl.value = val.replace(/\r\n/g, '\n');
          showToast('Line endings normalized');
        }
      });
    }

    const btnClear = document.getElementById('btnClearPaste');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const contentEl = document.getElementById('pasteContent');
        const titleEl = document.getElementById('pasteTitle');
        const slugEl = document.getElementById('pasteCustomSlug');
        if (contentEl) contentEl.value = '';
        if (titleEl) titleEl.value = '';
        if (slugEl) slugEl.value = '';
        const card = document.getElementById('pasteResultCard');
        if (card) card.style.display = 'none';
      });
    }

    const searchInput = document.getElementById('pasteSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = cachedActivePastes.filter(p =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.lang || '').toLowerCase().includes(q) ||
          (p.slug || '').toLowerCase().includes(q)
        );
        renderPastesGrid(filtered);
      });
    }
  }

  async function loadAndRenderPastes() {
    let localPastes = [];
    try {
      const stored = localStorage.getItem('as_cloud_pastes');
      if (stored) localPastes = JSON.parse(stored);
    } catch (e) {}

    let remotePastes = [];
    try {
      const res = await fetch('https://raw.githubusercontent.com/yasamarium/cloudgame-db-users/main/data/pastes.json?t=' + Date.now(), { cache: 'no-cache' });
      if (res.ok) {
        remotePastes = await res.json();
      }
    } catch (e) {}

    const map = new Map();
    DEFAULT_PASTES.forEach(p => map.set(p.slug, p));
    if (Array.isArray(remotePastes)) remotePastes.forEach(p => map.set(p.slug, p));
    if (Array.isArray(localPastes)) localPastes.forEach(p => map.set(p.slug, { ...map.get(p.slug), ...p }));

    cachedActivePastes = Array.from(map.values());
    renderPastesGrid(cachedActivePastes);
  }

  function renderPastesGrid(pastes) {
    const listEl = document.getElementById('pastesList');
    const badge = document.getElementById('pastesCountBadge');
    if (!listEl) return;

    listEl.innerHTML = '';
    if (badge) badge.textContent = `${pastes.length} Pastes`;

    if (pastes.length === 0) {
      listEl.innerHTML = '<div style="color: #64748b; padding: 20px; text-align: center;">No snippets found.</div>';
      return;
    }

    const origin = getLocationOrigin();

    pastes.forEach(p => {
      const card = document.createElement('div');
      card.className = 'paste-item-card';

      const shareUrl = `${origin}/services?p=${p.slug}`;
      const snippetPreview = (p.content || '').substring(0, 160);

      card.innerHTML = `
        <div class="paste-header-row">
          <div class="paste-title-text">${escapeHtml(p.title || 'Untitled')}</div>
          <span class="paste-lang-badge">${escapeHtml(p.lang || 'text')}</span>
        </div>
        <div class="paste-code-snippet">${escapeHtml(snippetPreview)}</div>
        <div class="paste-actions-row">
          <span style="color: #64748b; font-size: 11px;">/services?p=${escapeHtml(p.slug)}</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary btn-sm btn-load-paste">Load</button>
            <button class="btn-secondary btn-sm btn-copy-paste-url" data-url="${escapeHtml(shareUrl)}">Copy Link</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-load-paste').onclick = () => {
        const titleEl = document.getElementById('pasteTitle');
        const langEl = document.getElementById('pasteLang');
        const slugEl = document.getElementById('pasteCustomSlug');
        const contentEl = document.getElementById('pasteContent');

        if (titleEl) titleEl.value = p.title || '';
        if (langEl) langEl.value = p.lang || 'plaintext';
        if (slugEl) slugEl.value = p.slug || '';
        if (contentEl) contentEl.value = p.content || '';

        contentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast(`Loaded: ${p.title || p.slug}`);
      };

      card.querySelector('.btn-copy-paste-url').onclick = e => {
        const url = e.target.dataset.url;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          showToast(`Copied: ${url}`);
        }
      };

      listEl.appendChild(card);
    });
  }

  // =========================================================================
  // 5. Developer Utilities Suite Logic
  // =========================================================================
  function initDevSuite() {
    // 1. UUID Generation
    function handleGenUUID(count = 1) {
      const el = document.getElementById('uuidResult');
      if (!el) return;
      const list = [];
      for (let i = 0; i < count; i++) {
        list.push(generateUUIDv4());
      }
      el.value = list.join('\n');
    }

    const b1 = document.getElementById('btnGenUUID1'); if (b1) b1.onclick = () => handleGenUUID(1);
    const b5 = document.getElementById('btnGenUUID5'); if (b5) b5.onclick = () => handleGenUUID(5);
    const b10 = document.getElementById('btnGenUUID10'); if (b10) b10.onclick = () => handleGenUUID(10);

    const btnCopyUUID = document.getElementById('btnCopyUUID');
    if (btnCopyUUID) {
      btnCopyUUID.onclick = () => {
        const el = document.getElementById('uuidResult');
        if (el && el.value && navigator.clipboard) {
          navigator.clipboard.writeText(el.value);
          showToast('Copied UUIDs');
        }
      };
    }
    handleGenUUID(1);

    // 2. High-Entropy Password & Key Generator
    const pwdLenInput = document.getElementById('pwdLength');
    const pwdLenVal = document.getElementById('pwdLengthVal');
    if (pwdLenInput) {
      pwdLenInput.oninput = () => {
        if (pwdLenVal) pwdLenVal.textContent = pwdLenInput.value;
      };
    }

    function generateSecretPassword() {
      const len = pwdLenInput ? parseInt(pwdLenInput.value) || 24 : 24;
      const useUpper = document.getElementById('pwdUpper')?.checked ?? true;
      const useLower = document.getElementById('pwdLower')?.checked ?? true;
      const useDigits = document.getElementById('pwdDigits')?.checked ?? true;
      const useSymbols = document.getElementById('pwdSymbols')?.checked ?? true;

      let chars = '';
      if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (useDigits) chars += '0123456789';
      if (useSymbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

      if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      let out = '';
      const array = new Uint32Array(len);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
          out += chars.charAt(array[i] % chars.length);
        }
      } else {
        for (let i = 0; i < len; i++) {
          out += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }

      const resEl = document.getElementById('pwdResult');
      if (resEl) resEl.value = out;
    }

    const btnGenPwd = document.getElementById('btnGenPwd');
    if (btnGenPwd) btnGenPwd.onclick = generateSecretPassword;

    const btnCopyPwd = document.getElementById('btnCopyPwd');
    if (btnCopyPwd) {
      btnCopyPwd.onclick = () => {
        const el = document.getElementById('pwdResult');
        if (el && el.value && navigator.clipboard) {
          navigator.clipboard.writeText(el.value);
          showToast('Copied secret password');
        }
      };
    }
    generateSecretPassword();

    // 3. Cryptographic Hashes Calculation
    const hashInput = document.getElementById('hashInput');
    async function updateHashes() {
      const val = hashInput ? hashInput.value : '';
      const md5El = document.getElementById('hashMD5');
      const sha1El = document.getElementById('hashSHA1');
      const sha256El = document.getElementById('hashSHA256');
      const sha512El = document.getElementById('hashSHA512');

      if (!val) {
        if (md5El) md5El.value = '';
        if (sha1El) sha1El.value = '';
        if (sha256El) sha256El.value = '';
        if (sha512El) sha512El.value = '';
        return;
      }

      if (md5El) md5El.value = computeMD5(val);
      if (sha1El) sha1El.value = await computeWebCryptoHash('SHA-1', val);
      if (sha256El) sha256El.value = await computeWebCryptoHash('SHA-256', val);
      if (sha512El) sha512El.value = await computeWebCryptoHash('SHA-512', val);
    }

    if (hashInput) hashInput.addEventListener('input', updateHashes);

    document.querySelectorAll('.btn-copy-hash').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const target = document.getElementById(targetId);
        if (target && target.value && navigator.clipboard) {
          navigator.clipboard.writeText(target.value);
          showToast('Hash copied to clipboard');
        }
      });
    });

    // 4. Base64 & JWT Inspector
    const b64Raw = document.getElementById('b64Raw');
    const b64Encoded = document.getElementById('b64Encoded');
    const btnEnc = document.getElementById('btnEncodeB64');
    const btnDec = document.getElementById('btnDecodeB64');

    if (btnEnc) {
      btnEnc.onclick = () => {
        if (!b64Raw || !b64Encoded) return;
        try {
          const bytes = new TextEncoder().encode(b64Raw.value);
          let bin = '';
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          b64Encoded.value = btoa(bin);
          showToast('Encoded to Base64');
        } catch (e) {
          showToast('Failed to encode Base64');
        }
      };
    }

    if (btnDec) {
      btnDec.onclick = () => {
        if (!b64Raw || !b64Encoded) return;
        try {
          const bin = atob(b64Encoded.value.trim());
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          b64Raw.value = new TextDecoder().decode(bytes);
          showToast('Decoded to Plain Text');
        } catch (e) {
          showToast('Invalid Base64 format');
        }
      };
    }

    const jwtInput = document.getElementById('jwtInput');
    if (jwtInput) {
      jwtInput.addEventListener('input', () => {
        const token = jwtInput.value.trim();
        const headerEl = document.getElementById('jwtHeaderOutput');
        const payloadEl = document.getElementById('jwtPayloadOutput');

        if (!token) {
          if (headerEl) headerEl.textContent = 'Waiting for JWT token...';
          if (payloadEl) payloadEl.textContent = 'Waiting for JWT token...';
          return;
        }

        const parts = token.split('.');
        if (parts.length < 2) {
          if (headerEl) headerEl.textContent = 'Error: Invalid JWT format (expected 3 dot-separated segments).';
          return;
        }

        try {
          const headerJson = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          if (headerEl) headerEl.textContent = JSON.stringify(headerJson, null, 2);
        } catch (e) {
          if (headerEl) headerEl.textContent = 'Error decoding header: ' + e.message;
        }

        try {
          const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          let expInfo = '';
          if (payloadJson.exp) {
            const expDate = new Date(payloadJson.exp * 1000);
            const isExp = Date.now() > payloadJson.exp * 1000;
            expInfo = `\n// Token Expiration: ${expDate.toISOString()} (${isExp ? 'EXPIRED' : 'VALID'})\n`;
          }
          if (payloadEl) payloadEl.textContent = expInfo + JSON.stringify(payloadJson, null, 2);
        } catch (e) {
          if (payloadEl) payloadEl.textContent = 'Error decoding payload: ' + e.message;
        }
      });
    }

    // 5. In-Browser HTTP API Tester
    const btnSendHttp = document.getElementById('btnSendHttp');
    if (btnSendHttp) {
      btnSendHttp.addEventListener('click', async () => {
        const method = document.getElementById('httpMethod')?.value || 'GET';
        const url = document.getElementById('httpUrl')?.value.trim();
        const headersRaw = document.getElementById('httpHeaders')?.value.trim();
        const bodyRaw = document.getElementById('httpBody')?.value.trim();
        const statusBadge = document.getElementById('httpStatusBadge');
        const latencyBadge = document.getElementById('httpLatencyBadge');
        const respEl = document.getElementById('httpResponseBody');

        if (!url) {
          showToast('Please specify a target URL.');
          return;
        }

        let headers = {};
        if (headersRaw) {
          try {
            headers = JSON.parse(headersRaw);
          } catch (e) {
            showToast('Headers must be valid JSON.');
            return;
          }
        }

        const options = { method, headers };
        if (method !== 'GET' && method !== 'HEAD' && bodyRaw) {
          options.body = bodyRaw;
        }

        if (statusBadge) statusBadge.textContent = 'Sending...';
        if (respEl) respEl.textContent = 'Awaiting response...';

        const startTime = performance.now();
        try {
          const res = await fetch(url, options);
          const elapsed = Math.round(performance.now() - startTime);

          if (latencyBadge) latencyBadge.textContent = `${elapsed} ms`;
          if (statusBadge) {
            statusBadge.textContent = `HTTP ${res.status} ${res.statusText || ''}`;
            statusBadge.style.color = res.ok ? '#34d399' : '#fb7185';
          }

          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            if (respEl) respEl.textContent = JSON.stringify(parsed, null, 2);
          } catch (e) {
            if (respEl) respEl.textContent = text;
          }
        } catch (err) {
          const elapsed = Math.round(performance.now() - startTime);
          if (latencyBadge) latencyBadge.textContent = `${elapsed} ms`;
          if (statusBadge) {
            statusBadge.textContent = 'Request Failed';
            statusBadge.style.color = '#fb7185';
          }
          if (respEl) respEl.textContent = 'Network Error: ' + err.message;
        }
      });
    }

    // 6. JSON Formatter & Minifier
    const jsonArea = document.getElementById('jsonInputArea');
    const jsonStatus = document.getElementById('jsonStatusMsg');

    function handleFormatJSON(space) {
      if (!jsonArea) return;
      const text = jsonArea.value.trim();
      if (!text) return;
      try {
        const obj = JSON.parse(text);
        jsonArea.value = JSON.stringify(obj, null, space);
        if (jsonStatus) {
          jsonStatus.textContent = 'JSON valid and formatted successfully.';
          jsonStatus.style.color = '#10b981';
        }
      } catch (err) {
        if (jsonStatus) {
          jsonStatus.textContent = 'Syntax Error: ' + err.message;
          jsonStatus.style.color = '#f43f5e';
        }
      }
    }

    const bJson2 = document.getElementById('btnFormatJson2'); if (bJson2) bJson2.onclick = () => handleFormatJSON(2);
    const bJson4 = document.getElementById('btnFormatJson4'); if (bJson4) bJson4.onclick = () => handleFormatJSON(4);
    const bJsonMin = document.getElementById('btnMinifyJson'); if (bJsonMin) bJsonMin.onclick = () => handleFormatJSON(0);
    const bJsonClr = document.getElementById('btnClearJson'); if (bJsonClr) {
      bJsonClr.onclick = () => {
        if (jsonArea) jsonArea.value = '';
        if (jsonStatus) jsonStatus.textContent = '';
      };
    }
  }

  // =========================================================================
  // 6. Query Parameters & Deep Linking
  // =========================================================================
  function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);

    // Deep link tab navigation (?tab=qrstudio, ?tab=pastebin, etc.)
    const tabParam = params.get('tab');
    if (tabParam) {
      const tabBtn = document.querySelector(`.service-tab-btn[data-tab="${tabParam}"]`);
      if (tabBtn) tabBtn.click();
    }

    // Short link redirection (?s=<slug>)
    const shortSlug = params.get('s');
    if (shortSlug) {
      const clean = shortSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const found = cachedActiveLinks.find(l => l.slug === clean);
      if (found && found.url) {
        found.clicks = (found.clicks || 0) + 1;
        try {
          localStorage.setItem('as_cloud_links', JSON.stringify(cachedActiveLinks));
        } catch (e) {}
        window.location.href = found.url;
        return;
      }
    }

    // Paste loading (?p=<slug>)
    const pasteSlug = params.get('p');
    if (pasteSlug) {
      const clean = pasteSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const tabBtn = document.querySelector('.service-tab-btn[data-tab="pastebin"]');
      if (tabBtn) tabBtn.click();

      // Check cache or fetch
      const found = cachedActivePastes.find(p => p.slug === clean);
      if (found) {
        const titleEl = document.getElementById('pasteTitle');
        const langEl = document.getElementById('pasteLang');
        const slugEl = document.getElementById('pasteCustomSlug');
        const contentEl = document.getElementById('pasteContent');

        if (titleEl) titleEl.value = found.title || '';
        if (langEl) langEl.value = found.lang || 'plaintext';
        if (slugEl) slugEl.value = found.slug || '';
        if (contentEl) contentEl.value = found.content || '';
        showToast(`Loaded snippet: ${found.title || found.slug}`);
      }
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  async function bootstrap() {
    initTabNavigation();
    initShortener();
    initQRStudio();
    initPastebin();
    initDevSuite();

    await loadAndRenderLinks();
    await loadAndRenderPastes();

    handleQueryParameters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
