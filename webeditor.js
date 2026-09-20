/**
 * AS Web Editor • Visual Website Builder Engine
 * Desktop-First Precision Studio
 * Prominent Page Tabs, Fluid Expanding Scroll, Live Code Editor, Presets & Plugins System
 * Strictly Zero Unicode Emojis
 */

(function () {
  'use strict';

  // =========================================================================
  // State Model
  // =========================================================================
  const STORAGE_KEY = 'as_webeditor_project_v1';
  let project = {
    name: 'My Website',
    activePageId: 'index',
    pages: {
      index: {
        id: 'index',
        name: 'Home',
        slug: 'index',
        title: 'Home • Modern Web Experience',
        desc: 'A modern website built with AS Web Editor.',
        bgColor: '#0a0a0c',
        html: ''
      },
      about: {
        id: 'about',
        name: 'About',
        slug: 'about',
        title: 'About Us • Modern Web Experience',
        desc: 'Learn more about our team, mission, and technology.',
        bgColor: '#0a0a0c',
        html: ''
      }
    },
    plugins: {
      whatsapp: { enabled: false, number: '', message: 'Hello! I visited your website.' },
      cookie: { enabled: false, text: 'We use cookies to enhance your experience.', btnText: 'Accept' },
      themeToggle: { enabled: false },
      form: { enabled: false, endpoint: '' },
      seo: { enabled: false, ogImage: '' },
      customScript: { enabled: false, head: '', body: '' },
      announcement: { enabled: false, text: 'Special Launch Offer: Build and launch your website today!', linkText: 'Learn More', link: '', bg: '#2563eb', textColor: '#ffffff' },
      backToTop: { enabled: false, style: 'pill', position: 'right' },
      audio: { enabled: false, url: '', title: 'Ambient Soundscape', autoplay: false },
      particle: { enabled: false, color: '#60a5fa', density: 70 },
      visitorProof: { enabled: false, text: 'people are exploring this site right now', min: 18, max: 48 },
      newsletter: { enabled: false, title: 'Subscribe to Our Newsletter', desc: 'Get exclusive updates, insights, and releases delivered to your inbox.', delay: 4 },
      neonCursor: { enabled: false, color: '#00f0ff' }
    },
    customCss: '',
    customJs: ''
  };

  // Undo / Redo History Stack
  const historyStack = [];
  let historyIndex = -1;
  const MAX_HISTORY = 30;

  // Editor References
  let selectedElement = null;
  let activeViewport = 'desktop';

  // DOM Elements
  const canvas = document.getElementById('webCanvas');
  const artboardWrapper = document.getElementById('artboardWrapper');
  const pageTabList = document.getElementById('wePageTabList');
  const projectNameInput = document.getElementById('projectNameInput');
  const saveStatusIndicator = document.getElementById('saveStatusIndicator');
  const floatingToolbar = document.getElementById('elementFloatingToolbar');
  const floatingElementName = document.getElementById('floatingElementName');
  const selectedElementBadge = document.getElementById('selectedElementBadge');
  const inspectorEmptyState = document.getElementById('inspectorEmptyState');
  const inspectorForm = document.getElementById('inspectorForm');

  // History Buttons
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  // Inspector Form Fields
  const sectionLinkAction = document.getElementById('sectionLinkAction');
  const propLinkType = document.getElementById('propLinkType');
  const rowTargetPage = document.getElementById('rowTargetPage');
  const propTargetPage = document.getElementById('propTargetPage');
  const rowTargetUrl = document.getElementById('rowTargetUrl');
  const propTargetUrl = document.getElementById('propTargetUrl');
  const rowScrollId = document.getElementById('rowScrollId');
  const propScrollId = document.getElementById('propScrollId');
  const rowTargetWindow = document.getElementById('rowTargetWindow');
  const propTargetWindow = document.getElementById('propTargetWindow');

  const sectionMedia = document.getElementById('sectionMedia');
  const propMediaUrl = document.getElementById('propMediaUrl');
  const propMediaAlt = document.getElementById('propMediaAlt');
  const propMediaFit = document.getElementById('propMediaFit');
  const propMediaRatio = document.getElementById('propMediaRatio');
  const propMediaWidthSelect = document.getElementById('propMediaWidthSelect');
  const propMediaHeightSelect = document.getElementById('propMediaHeightSelect');
  const propMediaPosition = document.getElementById('propMediaPosition');
  const propMediaZoom = document.getElementById('propMediaZoom');
  const valMediaZoom = document.getElementById('valMediaZoom');
  const mediaRatioPresets = document.getElementById('mediaRatioPresets');

  const sectionTypography = document.getElementById('sectionTypography');
  const propTextContent = document.getElementById('propTextContent');
  const propFontFamily = document.getElementById('propFontFamily');
  const propFontSize = document.getElementById('propFontSize');
  const propFontWeight = document.getElementById('propFontWeight');
  const propTextColorPicker = document.getElementById('propTextColorPicker');
  const propTextColorText = document.getElementById('propTextColorText');

  const propBgType = document.getElementById('propBgType');
  const rowSolidBg = document.getElementById('rowSolidBg');
  const propBgColorPicker = document.getElementById('propBgColorPicker');
  const propBgColorText = document.getElementById('propBgColorText');
  const rowGradientPreset = document.getElementById('rowGradientPreset');
  const propGradientPreset = document.getElementById('propGradientPreset');
  const rowBgImageLink = document.getElementById('rowBgImageLink');
  const propBgImageUrl = document.getElementById('propBgImageUrl');
  const propOpacity = document.getElementById('propOpacity');
  const valOpacity = document.getElementById('valOpacity');

  const propBorderRadius = document.getElementById('propBorderRadius');
  const valBorderRadius = document.getElementById('valBorderRadius');
  const propBorderWidth = document.getElementById('propBorderWidth');
  const propBorderStyle = document.getElementById('propBorderStyle');
  const propBorderColorPicker = document.getElementById('propBorderColorPicker');
  const propBorderColorText = document.getElementById('propBorderColorText');
  const propBoxShadow = document.getElementById('propBoxShadow');

  const propWidth = document.getElementById('propWidth');
  const propMaxWidth = document.getElementById('propMaxWidth');
  const propPadding = document.getElementById('propPadding');
  const propMarginBottom = document.getElementById('propMarginBottom');

  // Code Editor Elements
  const codeModal = document.getElementById('codeModal');
  const editPageHtml = document.getElementById('editPageHtml');
  const editPageCss = document.getElementById('editPageCss');
  const applyCodeBtn = document.getElementById('applyCodeBtn');
  const elementCodeModal = document.getElementById('elementCodeModal');
  const editElementHtml = document.getElementById('editElementHtml');
  const applyElementCodeBtn = document.getElementById('applyElementCodeBtn');

  // Codebar Project IDE Elements
  const openCodebarBtn = document.getElementById('openCodebarBtn');
  const codebarModal = document.getElementById('codebarModal');
  const codebarEditor = document.getElementById('codebarEditor');
  const codebarGutter = document.getElementById('codebarGutter');
  const codebarFileList = document.getElementById('codebarFileList');
  const codebarTabName = document.getElementById('codebarTabName');
  const codebarCurrentFilePath = document.getElementById('codebarCurrentFilePath');
  const codebarLineCount = document.getElementById('codebarLineCount');
  const codebarByteCount = document.getElementById('codebarByteCount');
  const codebarFormatBtn = document.getElementById('codebarFormatBtn');
  const codebarCopyBtn = document.getElementById('codebarCopyBtn');
  const applyCodebarBtn = document.getElementById('applyCodebarBtn');
  let activeCodebarFile = 'index.html'; // Tracks currently open file in Codebar

  // =========================================================================
  // Initialization & Storage
  // =========================================================================
  function init() {
    loadProjectFromStorage();
    setupGatekeeper();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupPluginsListeners();
    setupCodebarEditorEvents();
    renderPageTabs();
    loadPage(project.activePageId);
    recordHistory('Initial Load');
  }

  function setupGatekeeper() {
    const gatekeeper = document.getElementById('desktopOnlyGatekeeper');
    function checkWidth() {
      if (window.innerWidth < 960) {
        gatekeeper.style.display = 'flex';
      } else {
        gatekeeper.style.display = 'none';
      }
    }
    window.addEventListener('resize', checkWidth);
    checkWidth();
  }

  function loadProjectFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pages && Object.keys(parsed.pages).length > 0) {
          project = parsed;
          if (!project.plugins) {
            project.plugins = {
              whatsapp: { enabled: false, number: '', message: '' },
              cookie: { enabled: false, text: 'We use cookies.', btnText: 'Accept' },
              themeToggle: { enabled: false },
              form: { enabled: false, endpoint: '' },
              seo: { enabled: false, ogImage: '' },
              customScript: { enabled: false, head: '', body: '' }
            };
          }
          if (projectNameInput) projectNameInput.value = project.name || 'My Website';
          syncPluginFieldsFromState();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load saved project from localStorage:', e);
    }
    // Default starter template if empty
    project.pages.index.html = getDefaultHomeContent();
    project.pages.about.html = getDefaultAboutContent();
    syncPluginFieldsFromState();
  }

  function saveProjectToStorage() {
    try {
      // Sync active page content before saving
      if (canvas && project.pages[project.activePageId]) {
        // Strip out temporary section insert bars before saving
        const clone = canvas.cloneNode(true);
        clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
        project.pages[project.activePageId].html = clone.innerHTML;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      triggerSaveIndicator();
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  function triggerSaveIndicator() {
    if (!saveStatusIndicator) return;
    saveStatusIndicator.textContent = 'Saving...';
    saveStatusIndicator.classList.add('saving');
    setTimeout(() => {
      saveStatusIndicator.textContent = 'Saved';
      saveStatusIndicator.classList.remove('saving');
    }, 400);
  }

  // =========================================================================
  // History Engine (Undo / Redo)
  // =========================================================================
  function recordHistory(actionName) {
    if (historyIndex < historyStack.length - 1) {
      historyStack.splice(historyIndex + 1);
    }
    const snapshot = JSON.parse(JSON.stringify(project));
    const clone = canvas.cloneNode(true);
    clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
    snapshot.activeCanvasHtml = clone.innerHTML;
    historyStack.push({ action: actionName, snapshot });
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    } else {
      historyIndex++;
    }
    updateHistoryButtons();
    saveProjectToStorage();
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      restoreHistoryState(historyStack[historyIndex].snapshot);
    }
  }

  function redo() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      restoreHistoryState(historyStack[historyIndex].snapshot);
    }
  }

  function restoreHistoryState(snapshot) {
    project = JSON.parse(JSON.stringify(snapshot));
    if (projectNameInput) projectNameInput.value = project.name;
    renderPageTabs();
    syncPluginFieldsFromState();
    loadPage(project.activePageId, false);
    deselectElement();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
  }

  // =========================================================================
  // Prominent Page Tabs Bar & Multi-Page Management
  // =========================================================================
  function renderPageTabs() {
    if (!pageTabList) return;
    pageTabList.innerHTML = '';
    const pageKeys = Object.keys(project.pages);

    pageKeys.forEach(pageId => {
      const page = project.pages[pageId];
      const tab = document.createElement('div');
      tab.className = `we-page-tab ${page.id === project.activePageId ? 'active' : ''}`;
      tab.innerHTML = `
        <span>${page.name}</span>
        <span class="we-page-tab-slug">${page.slug}.html</span>
      `;

      // Allow deleting tab if more than 1 page
      if (pageKeys.length > 1) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'we-tab-close-btn';
        closeBtn.title = 'Delete this page';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deletePage(page.id);
        });
        tab.appendChild(closeBtn);
      }

      tab.addEventListener('click', () => {
        if (page.id !== project.activePageId) {
          switchPage(page.id);
        }
      });

      pageTabList.appendChild(tab);
    });

    renderPagesTabList();
    populateLinkTargetPages();
  }

  function renderPagesTabList() {
    const container = document.getElementById('pagesListContainer');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(project.pages).forEach(pageId => {
      const page = project.pages[pageId];
      const item = document.createElement('div');
      item.className = `we-page-list-item ${page.id === project.activePageId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="we-page-item-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div>
            <div class="we-page-item-title">${page.name}</div>
            <div class="we-page-item-slug">${page.slug}.html</div>
          </div>
        </div>
      `;
      item.addEventListener('click', () => {
        if (page.id !== project.activePageId) {
          switchPage(page.id);
        }
      });
      container.appendChild(item);
    });
  }

  function populateLinkTargetPages() {
    if (!propTargetPage) return;
    propTargetPage.innerHTML = '';
    Object.keys(project.pages).forEach(pageId => {
      const p = project.pages[pageId];
      const opt = document.createElement('option');
      opt.value = p.slug;
      opt.textContent = `${p.name} (${p.slug}.html)`;
      propTargetPage.appendChild(opt);
    });
  }

  function switchPage(pageId) {
    if (!project.pages[pageId]) return;
    // Save current page state
    if (canvas && project.pages[project.activePageId]) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }
    project.activePageId = pageId;
    loadPage(pageId);
    renderPageTabs();
    recordHistory(`Switch to ${project.pages[pageId].name}`);
  }

  function loadPage(pageId, shouldSaveCurrent = true) {
    const page = project.pages[pageId];
    if (!page) return;
    canvas.setAttribute('data-page-id', page.id);
    canvas.style.backgroundColor = page.bgColor || '#0a0a0c';
    canvas.innerHTML = page.html || '';

    // Re-bind click listeners to canvas nodes & insert divider bars
    bindCanvasNodeListeners();
    renderSectionInsertBars();
    deselectElement();
    updateLayersTree();
  }

  function createNewPage(name, slug, starterType) {
    slug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '').trim();
    if (!slug) slug = 'page-' + Date.now();
    if (project.pages[slug]) {
      alert('A page with this filename already exists. Please choose a unique name.');
      return;
    }

    let initialHtml = '';
    if (starterType === 'standard') {
      initialHtml = getStandardPageStarter(name);
    } else if (starterType === 'contact') {
      initialHtml = getContactPageStarter();
    }

    project.pages[slug] = {
      id: slug,
      name: name || 'New Page',
      slug: slug,
      title: `${name} • ${project.name}`,
      desc: `Page details for ${name}.`,
      bgColor: '#0a0a0c',
      html: initialHtml
    };

    switchPage(slug);
    closeModal('newPageModal');
  }

  function deletePage(pageId) {
    const pageKeys = Object.keys(project.pages);
    if (pageKeys.length <= 1) {
      alert('You cannot delete the only remaining page in the project.');
      return;
    }
    if (confirm(`Are you sure you want to delete the page "${project.pages[pageId].name}"?`)) {
      delete project.pages[pageId];
      if (project.activePageId === pageId) {
        const nextId = Object.keys(project.pages)[0];
        project.activePageId = nextId;
        loadPage(nextId);
      }
      renderPageTabs();
      recordHistory('Delete Page');
    }
  }

  // =========================================================================
  // Canvas Node Manipulation & Insertion Bars (Fluid Scroll Expansion)
  // =========================================================================
  function renderSectionInsertBars() {
    // Remove existing insert bars first
    canvas.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());

    const topLevelNodes = canvas.querySelectorAll(':scope > .we-node');
    topLevelNodes.forEach((node, idx) => {
      // Create insert bar before each section
      const bar = document.createElement('div');
      bar.className = 'we-section-insert-bar';
      bar.innerHTML = `
        <div class="we-section-insert-line"></div>
        <button class="we-section-insert-btn" type="button">+ Insert Section</button>
      `;
      bar.querySelector('.we-section-insert-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        insertPreset('hero', node); // Insert before this node
      });
      canvas.insertBefore(bar, node);
    });
  }

  function bindCanvasNodeListeners() {
    const nodes = canvas.querySelectorAll('.we-node');
    nodes.forEach(node => {
      if (!node.getAttribute('data-we-id')) {
        node.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));
      }
      node.removeEventListener('click', handleNodeClick);
      node.addEventListener('click', handleNodeClick);

      // Single-click direct inline text editing for text elements
      if (['heading', 'paragraph', 'badge', 'button'].includes(node.getAttribute('data-we-type'))) {
        node.setAttribute('contenteditable', 'true');
        node.removeEventListener('input', handleNodeTextInput);
        node.addEventListener('input', handleNodeTextInput);
      }
    });
  }

  function handleNodeClick(e) {
    e.stopPropagation();
    selectElement(this);
  }

  function handleNodeTextInput(e) {
    if (selectedElement === this && propTextContent) {
      propTextContent.value = this.innerText;
      saveProjectToStorage();
    }
  }

  function selectElement(el) {
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }
    selectedElement = el;
    selectedElement.classList.add('selected');

    positionFloatingToolbar(selectedElement);
    populateInspector(selectedElement);
    highlightLayerNode(selectedElement.getAttribute('data-we-id'));
  }

  function deselectElement() {
    if (selectedElement) {
      selectedElement.classList.remove('selected');
      selectedElement = null;
    }
    if (floatingToolbar) floatingToolbar.style.display = 'none';
    if (inspectorEmptyState) inspectorEmptyState.style.display = 'flex';
    if (inspectorForm) inspectorForm.style.display = 'none';
    if (selectedElementBadge) selectedElementBadge.textContent = 'No Selection';
  }

  function positionFloatingToolbar(el) {
    if (!floatingToolbar) return;
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const top = rect.top - canvasRect.top + canvas.scrollTop;
    const left = rect.left - canvasRect.left + canvas.scrollLeft;

    floatingToolbar.style.top = Math.max(8, top - 38) + 'px';
    floatingToolbar.style.left = Math.max(8, left) + 'px';
    floatingToolbar.style.display = 'flex';

    const type = el.getAttribute('data-we-type') || 'Element';
    floatingElementName.textContent = type.toUpperCase();
  }

  // =========================================================================
  // Property Inspector Binding
  // =========================================================================
  function populateInspector(el) {
    if (!inspectorEmptyState || !inspectorForm) return;
    inspectorEmptyState.style.display = 'none';
    inspectorForm.style.display = 'block';

    const type = el.getAttribute('data-we-type') || 'container';
    selectedElementBadge.textContent = type.toUpperCase();

    const comp = window.getComputedStyle(el);

    // Section 1: Button Navigation / Link
    const isButtonOrLink = type === 'button' || el.tagName === 'A' || el.tagName === 'BUTTON';
    sectionLinkAction.style.display = isButtonOrLink ? 'block' : 'none';
    if (isButtonOrLink) {
      const linkType = el.getAttribute('data-we-link-type') || 'none';
      propLinkType.value = linkType;
      updateLinkActionRows(linkType);

      if (propTargetPage) propTargetPage.value = el.getAttribute('data-we-target-page') || 'index';
      if (propTargetUrl) propTargetUrl.value = el.getAttribute('data-we-target-url') || '';
      if (propScrollId) propScrollId.value = el.getAttribute('data-we-scroll-id') || '';
      if (propTargetWindow) propTargetWindow.value = el.getAttribute('data-we-target-window') || '_self';
    }

    // Section 2: Media Inspector
    const isMedia = type === 'image' || type === 'video' || el.tagName === 'IMG' || el.tagName === 'IFRAME' || !!el.querySelector('img, video, iframe');
    sectionMedia.style.display = isMedia ? 'block' : 'none';
    if (isMedia) {
      const mediaEl = (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'IFRAME') ? el : el.querySelector('img, video, iframe');
      const mediaComp = mediaEl ? window.getComputedStyle(mediaEl) : comp;

      if (type === 'image' || (mediaEl && mediaEl.tagName === 'IMG')) {
        propMediaUrl.value = mediaEl ? (mediaEl.getAttribute('src') || '') : '';
        propMediaAlt.value = mediaEl ? (mediaEl.getAttribute('alt') || '') : '';
        propMediaFit.value = (mediaEl && mediaEl.style.objectFit) || mediaComp.objectFit || 'contain';
        const currentRatio = (mediaEl && mediaEl.style.aspectRatio) || 'auto';
        propMediaRatio.value = currentRatio;
        if (propMediaWidthSelect) propMediaWidthSelect.value = (mediaEl && mediaEl.style.width) || '100%';
        if (propMediaHeightSelect) propMediaHeightSelect.value = (mediaEl && mediaEl.style.maxHeight) || 'none';
        if (propMediaPosition) propMediaPosition.value = (mediaEl && mediaEl.style.objectPosition) || 'center';

        // Zoom scale
        let zoomVal = 100;
        if (mediaEl && mediaEl.style.transform) {
          const match = mediaEl.style.transform.match(/scale\(([^)]+)\)/);
          if (match) zoomVal = Math.round(parseFloat(match[1]) * 100);
        }
        if (propMediaZoom) propMediaZoom.value = zoomVal;
        if (valMediaZoom) valMediaZoom.textContent = zoomVal + '%';

        // Preset pill sync
        if (mediaRatioPresets) {
          mediaRatioPresets.querySelectorAll('.we-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-ratio') === currentRatio);
          });
        }
      } else if (type === 'video' || (mediaEl && (mediaEl.tagName === 'IFRAME' || mediaEl.tagName === 'VIDEO'))) {
        propMediaUrl.value = el.getAttribute('data-we-video-src') || (mediaEl ? mediaEl.getAttribute('src') : '') || '';
        const currentRatio = (mediaEl && mediaEl.style.aspectRatio) || (el.style.aspectRatio) || '16 / 9';
        propMediaRatio.value = currentRatio;
        if (propMediaWidthSelect) propMediaWidthSelect.value = el.style.width || '100%';
        if (propMediaHeightSelect) propMediaHeightSelect.value = el.style.maxHeight || 'none';

        if (mediaRatioPresets) {
          mediaRatioPresets.querySelectorAll('.we-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-ratio') === currentRatio);
          });
        }
      }
    }

    // Section 3: Typography
    const hasText = ['heading', 'paragraph', 'button', 'badge'].includes(type) || el.innerText.trim().length > 0;
    sectionTypography.style.display = hasText ? 'block' : 'none';
    if (hasText) {
      propTextContent.value = el.innerText || '';
      propFontSize.value = parseInt(comp.fontSize, 10) || 16;
      propFontWeight.value = comp.fontWeight || '400';

      const rgbColor = comp.color;
      const hexColor = rgbToHex(rgbColor);
      propTextColorPicker.value = hexColor;
      propTextColorText.value = hexColor;

      const align = comp.textAlign || 'left';
      document.querySelectorAll('#propTextAlignGroup .we-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-align') === align);
      });
    }

    // Section 4: Colors & Background
    const rgbBg = comp.backgroundColor;
    const hexBg = rgbToHex(rgbBg);
    propBgColorPicker.value = hexBg;
    propBgColorText.value = hexBg;

    const currentOpacity = Math.round(parseFloat(comp.opacity || 1) * 100);
    propOpacity.value = currentOpacity;
    valOpacity.textContent = currentOpacity + '%';

    // Section 5: Shape, Border & Corners
    const radius = parseInt(comp.borderRadius, 10) || 0;
    propBorderRadius.value = radius;
    valBorderRadius.textContent = radius + 'px';

    const bWidth = parseInt(comp.borderWidth, 10) || 0;
    propBorderWidth.value = bWidth;
    propBorderStyle.value = comp.borderStyle || 'none';

    const rgbBorder = comp.borderColor;
    const hexBorder = rgbToHex(rgbBorder);
    propBorderColorPicker.value = hexBorder;
    propBorderColorText.value = hexBorder;

    propBoxShadow.value = el.style.boxShadow || 'none';

    // Section 6: Dimensions & Spacing
    propWidth.value = el.style.width || '';
    propMaxWidth.value = el.style.maxWidth || '';
    propPadding.value = parseInt(comp.paddingTop, 10) || 0;
    propMarginBottom.value = parseInt(comp.marginBottom, 10) || 0;
  }

  function updateLinkActionRows(linkType) {
    if (rowTargetPage) rowTargetPage.style.display = linkType === 'page' ? 'flex' : 'none';
    if (rowTargetUrl) rowTargetUrl.style.display = linkType === 'url' ? 'flex' : 'none';
    if (rowScrollId) rowScrollId.style.display = linkType === 'scroll' ? 'flex' : 'none';
    if (rowTargetWindow) rowTargetWindow.style.display = linkType === 'url' ? 'flex' : 'none';
  }

  // =========================================================================
  // Live Two-Way Code Editor (Full Page & Per-Element)
  // =========================================================================
  function openPageCodeEditor() {
    if (project.pages[project.activePageId]) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }
    const page = project.pages[project.activePageId];
    document.getElementById('codePageBadge').textContent = `${page.slug}.html`;

    editPageHtml.value = formatHtmlString(page.html || '');
    editPageCss.value = generateBundledCss();

    openModal('codeModal');
  }

  function applyPageCodeChanges() {
    const updatedHtml = editPageHtml.value;
    canvas.innerHTML = updatedHtml;

    if (project.pages[project.activePageId]) {
      project.pages[project.activePageId].html = updatedHtml;
    }

    bindCanvasNodeListeners();
    renderSectionInsertBars();
    deselectElement();
    updateLayersTree();
    closeModal('codeModal');
    recordHistory('Apply Custom Code to Page');
  }

  function openElementCodeEditor() {
    if (!selectedElement) return;
    const clone = selectedElement.cloneNode(true);
    clone.classList.remove('selected');
    editElementHtml.value = formatHtmlString(clone.outerHTML);
    openModal('elementCodeModal');
  }

  function applyElementCodeChanges() {
    if (!selectedElement) return;
    const updatedHtml = editElementHtml.value.trim();
    if (!updatedHtml) return;

    const temp = document.createElement('div');
    temp.innerHTML = updatedHtml;
    const newElement = temp.firstElementChild;
    if (newElement) {
      newElement.classList.add('we-node');
      selectedElement.parentNode.replaceChild(newElement, selectedElement);
      bindCanvasNodeListeners();
      selectElement(newElement);
      renderSectionInsertBars();
      updateLayersTree();
      closeModal('elementCodeModal');
      recordHistory('Apply Element Custom HTML');
    }
  }

  // =========================================================================
  // Codebar Project IDE Engine (Full File Explorer & Live Sync)
  // =========================================================================
  function openCodebarIDE() {
    syncCurrentCanvasToPage();
    renderCodebarFileList();
    const currentSlug = project.pages[project.activePageId] ? project.pages[project.activePageId].slug : 'index';
    loadCodebarFile(activeCodebarFile || `${currentSlug}.html`);
    openModal('codebarModal');
  }

  function syncCurrentCanvasToPage() {
    if (project.pages[project.activePageId] && canvas) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }
  }

  function renderCodebarFileList() {
    if (!codebarFileList) return;
    codebarFileList.innerHTML = '';

    // Category 1: Pages (HTML)
    const catPages = document.createElement('div');
    catPages.className = 'codebar-category-title';
    catPages.textContent = 'Pages (HTML)';
    codebarFileList.appendChild(catPages);

    Object.keys(project.pages).forEach(pageId => {
      const page = project.pages[pageId];
      const fileName = `${page.slug}.html`;
      const item = document.createElement('div');
      item.className = `codebar-file-item ${activeCodebarFile === fileName ? 'active' : ''}`;
      item.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>${fileName}</span>
        <span class="codebar-file-badge codebar-badge-html">HTML</span>
      `;
      item.addEventListener('click', () => {
        loadCodebarFile(fileName);
      });
      codebarFileList.appendChild(item);
    });

    // Category 2: Stylesheets
    const catCss = document.createElement('div');
    catCss.className = 'codebar-category-title';
    catCss.textContent = 'Styles (CSS)';
    codebarFileList.appendChild(catCss);

    const cssItem = document.createElement('div');
    cssItem.className = `codebar-file-item ${activeCodebarFile === 'style.css' ? 'active' : ''}`;
    cssItem.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
      <span>style.css</span>
      <span class="codebar-file-badge codebar-badge-css">CSS</span>
    `;
    cssItem.addEventListener('click', () => {
      loadCodebarFile('style.css');
    });
    codebarFileList.appendChild(cssItem);

    // Category 3: Scripts & Plugins
    const catJs = document.createElement('div');
    catJs.className = 'codebar-category-title';
    catJs.textContent = 'Scripts (JS)';
    codebarFileList.appendChild(catJs);

    const jsItem = document.createElement('div');
    jsItem.className = `codebar-file-item ${activeCodebarFile === 'plugins.js' ? 'active' : ''}`;
    jsItem.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      <span>plugins.js</span>
      <span class="codebar-file-badge codebar-badge-js">JS</span>
    `;
    jsItem.addEventListener('click', () => {
      loadCodebarFile('plugins.js');
    });
    codebarFileList.appendChild(jsItem);
  }

  function loadCodebarFile(fileName) {
    activeCodebarFile = fileName;
    if (codebarTabName) codebarTabName.textContent = fileName;
    if (codebarCurrentFilePath) codebarCurrentFilePath.textContent = `project / ${fileName}`;

    document.querySelectorAll('.codebar-file-item').forEach(item => {
      const isCurrent = item.querySelector('span') && item.querySelector('span').textContent === fileName;
      item.classList.toggle('active', isCurrent);
    });

    let content = '';
    if (fileName.endsWith('.html')) {
      const slug = fileName.replace('.html', '');
      const page = Object.values(project.pages).find(p => p.slug === slug) || project.pages[project.activePageId];
      if (page) {
        if (page.id === project.activePageId && canvas) {
          const clone = canvas.cloneNode(true);
          clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
          content = formatHtmlString(clone.innerHTML);
        } else {
          content = formatHtmlString(page.html || '');
        }
      }
    } else if (fileName === 'style.css') {
      content = project.customCss || generateBundledCss();
    } else if (fileName === 'plugins.js') {
      content = project.customJs || generateRuntimePluginsJs();
    }

    if (codebarEditor) {
      codebarEditor.value = content;
      updateCodebarStatsAndGutter();
    }
  }

  function updateCodebarStatsAndGutter() {
    if (!codebarEditor || !codebarGutter) return;
    const lines = codebarEditor.value.split('\n');
    const lineCount = lines.length;
    const byteCount = (new Blob([codebarEditor.value]).size / 1024).toFixed(1);

    if (codebarLineCount) codebarLineCount.textContent = `${lineCount} lines`;
    if (codebarByteCount) codebarByteCount.textContent = `${byteCount} KB`;

    let gutterHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      gutterHtml += `<div>${i}</div>`;
    }
    codebarGutter.innerHTML = gutterHtml;
  }

  function formatCodebarCode() {
    if (!codebarEditor) return;
    if (activeCodebarFile.endsWith('.html')) {
      codebarEditor.value = formatHtmlString(codebarEditor.value);
    }
    updateCodebarStatsAndGutter();
  }

  function applyCodebarChanges() {
    if (!codebarEditor) return;
    const updatedContent = codebarEditor.value;

    if (activeCodebarFile.endsWith('.html')) {
      const slug = activeCodebarFile.replace('.html', '');
      const page = Object.values(project.pages).find(p => p.slug === slug);
      if (page) {
        page.html = updatedContent;
        if (page.id === project.activePageId) {
          canvas.innerHTML = updatedContent;
          bindCanvasNodeListeners();
          renderSectionInsertBars();
          deselectElement();
          updateLayersTree();
        }
      }
    } else if (activeCodebarFile === 'style.css') {
      project.customCss = updatedContent;
    } else if (activeCodebarFile === 'plugins.js') {
      project.customJs = updatedContent;
    }

    saveProjectToStorage();
    recordHistory(`Codebar Edit ${activeCodebarFile}`);
    triggerSaveIndicator();

    const applyBtn = document.getElementById('applyCodebarBtn');
    if (applyBtn) {
      const originalHtml = applyBtn.innerHTML;
      applyBtn.innerHTML = '<span>Synced to Canvas!</span>';
      setTimeout(() => { applyBtn.innerHTML = originalHtml; }, 1400);
    }
  }

  function generateRuntimePluginsJs() {
    return `/**
 * AS Web Editor • Runtime Plugins Engine
 * Standalone Client-Side Extensions
 */
(function () {
  'use strict';
  console.log('AS Web Editor Runtime Plugins active');
})();
`;
  }

  function setupCodebarEditorEvents() {
    if (!codebarEditor) return;
    codebarEditor.addEventListener('input', updateCodebarStatsAndGutter);
    codebarEditor.addEventListener('scroll', () => {
      if (codebarGutter) codebarGutter.scrollTop = codebarEditor.scrollTop;
    });
    codebarEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codebarEditor.selectionStart;
        const end = codebarEditor.selectionEnd;
        codebarEditor.value = codebarEditor.value.substring(0, start) + '  ' + codebarEditor.value.substring(end);
        codebarEditor.selectionStart = codebarEditor.selectionEnd = start + 2;
        updateCodebarStatsAndGutter();
      }
    });

    if (openCodebarBtn) openCodebarBtn.addEventListener('click', openCodebarIDE);
    if (applyCodebarBtn) applyCodebarBtn.addEventListener('click', applyCodebarChanges);
    if (codebarFormatBtn) codebarFormatBtn.addEventListener('click', formatCodebarCode);
    if (codebarCopyBtn) codebarCopyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codebarEditor.value);
      codebarCopyBtn.textContent = 'Copied!';
      setTimeout(() => { codebarCopyBtn.textContent = 'Copy'; }, 1500);
    });
  }

  // =========================================================================
  // Plugins & Integrations Engine
  // =========================================================================
  function setupPluginsListeners() {
    const pWhatsapp = document.getElementById('pluginWhatsappToggle');
    const pCookie = document.getElementById('pluginCookieToggle');
    const pTheme = document.getElementById('pluginThemeToggle');
    const pForm = document.getElementById('pluginFormToggle');
    const pSeo = document.getElementById('pluginSeoToggle');
    const pScript = document.getElementById('pluginCustomScriptToggle');

    // Toggles
    pWhatsapp.addEventListener('change', (e) => {
      project.plugins.whatsapp.enabled = e.target.checked;
      document.getElementById('pluginWhatsappFields').style.display = e.target.checked ? 'flex' : 'none';
      saveProjectToStorage();
    });

    pCookie.addEventListener('change', (e) => {
      project.plugins.cookie.enabled = e.target.checked;
      document.getElementById('pluginCookieFields').style.display = e.target.checked ? 'flex' : 'none';
      saveProjectToStorage();
    });

    pTheme.addEventListener('change', (e) => {
      project.plugins.themeToggle.enabled = e.target.checked;
      saveProjectToStorage();
    });

    pForm.addEventListener('change', (e) => {
      project.plugins.form.enabled = e.target.checked;
      document.getElementById('pluginFormFields').style.display = e.target.checked ? 'flex' : 'none';
      saveProjectToStorage();
    });

    pSeo.addEventListener('change', (e) => {
      project.plugins.seo.enabled = e.target.checked;
      document.getElementById('pluginSeoFields').style.display = e.target.checked ? 'flex' : 'none';
      saveProjectToStorage();
    });

    pScript.addEventListener('change', (e) => {
      project.plugins.customScript.enabled = e.target.checked;
      document.getElementById('pluginCustomScriptFields').style.display = e.target.checked ? 'flex' : 'none';
      saveProjectToStorage();
    });

    // New 7 Plugin Toggles
    const pAnnounce = document.getElementById('pluginAnnouncementToggle');
    if (pAnnounce) {
      pAnnounce.addEventListener('change', (e) => {
        project.plugins.announcement.enabled = e.target.checked;
        document.getElementById('pluginAnnouncementFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pBackTop = document.getElementById('pluginBackToTopToggle');
    if (pBackTop) {
      pBackTop.addEventListener('change', (e) => {
        project.plugins.backToTop.enabled = e.target.checked;
        document.getElementById('pluginBackToTopFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pAudio = document.getElementById('pluginAudioToggle');
    if (pAudio) {
      pAudio.addEventListener('change', (e) => {
        project.plugins.audio.enabled = e.target.checked;
        document.getElementById('pluginAudioFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pParticle = document.getElementById('pluginParticleToggle');
    if (pParticle) {
      pParticle.addEventListener('change', (e) => {
        project.plugins.particle.enabled = e.target.checked;
        document.getElementById('pluginParticleFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pVisitor = document.getElementById('pluginVisitorToggle');
    if (pVisitor) {
      pVisitor.addEventListener('change', (e) => {
        project.plugins.visitorProof.enabled = e.target.checked;
        document.getElementById('pluginVisitorFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pNewsletter = document.getElementById('pluginNewsletterToggle');
    if (pNewsletter) {
      pNewsletter.addEventListener('change', (e) => {
        project.plugins.newsletter.enabled = e.target.checked;
        document.getElementById('pluginNewsletterFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    const pNeon = document.getElementById('pluginNeonCursorToggle');
    if (pNeon) {
      pNeon.addEventListener('change', (e) => {
        project.plugins.neonCursor.enabled = e.target.checked;
        document.getElementById('pluginNeonCursorFields').style.display = e.target.checked ? 'flex' : 'none';
        saveProjectToStorage();
      });
    }

    // Inputs
    document.getElementById('pluginWhatsappNumber').addEventListener('input', (e) => {
      project.plugins.whatsapp.number = e.target.value;
      saveProjectToStorage();
    });
    document.getElementById('pluginWhatsappMsg').addEventListener('input', (e) => {
      project.plugins.whatsapp.message = e.target.value;
      saveProjectToStorage();
    });

    document.getElementById('pluginCookieText').addEventListener('input', (e) => {
      project.plugins.cookie.text = e.target.value;
      saveProjectToStorage();
    });
    document.getElementById('pluginCookieBtnText').addEventListener('input', (e) => {
      project.plugins.cookie.btnText = e.target.value;
      saveProjectToStorage();
    });

    document.getElementById('pluginFormEndpoint').addEventListener('input', (e) => {
      project.plugins.form.endpoint = e.target.value;
      saveProjectToStorage();
    });

    document.getElementById('pluginOgImage').addEventListener('input', (e) => {
      project.plugins.seo.ogImage = e.target.value;
      saveProjectToStorage();
    });

    document.getElementById('pluginHeadScript').addEventListener('input', (e) => {
      project.plugins.customScript.head = e.target.value;
      saveProjectToStorage();
    });
    document.getElementById('pluginBodyScript').addEventListener('input', (e) => {
      project.plugins.customScript.body = e.target.value;
      saveProjectToStorage();
    });

    // New 7 Plugin Inputs
    const setVal = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => { fn(e.target.value); saveProjectToStorage(); });
    };

    setVal('pluginAnnouncementText', v => project.plugins.announcement.text = v);
    setVal('pluginAnnouncementLinkText', v => project.plugins.announcement.linkText = v);
    setVal('pluginAnnouncementLink', v => project.plugins.announcement.link = v);
    setVal('pluginAnnouncementBg', v => project.plugins.announcement.bg = v);
    setVal('pluginAnnouncementTextColor', v => project.plugins.announcement.textColor = v);

    const bStyle = document.getElementById('pluginBackToTopStyle');
    if (bStyle) bStyle.addEventListener('change', e => { project.plugins.backToTop.style = e.target.value; saveProjectToStorage(); });
    const bPos = document.getElementById('pluginBackToTopPos');
    if (bPos) bPos.addEventListener('change', e => { project.plugins.backToTop.position = e.target.value; saveProjectToStorage(); });

    setVal('pluginAudioUrl', v => project.plugins.audio.url = v);
    setVal('pluginAudioTitle', v => project.plugins.audio.title = v);
    const aAuto = document.getElementById('pluginAudioAutoplay');
    if (aAuto) aAuto.addEventListener('change', e => { project.plugins.audio.autoplay = e.target.checked; saveProjectToStorage(); });

    setVal('pluginParticleColor', v => project.plugins.particle.color = v);
    const pDense = document.getElementById('pluginParticleDensity');
    if (pDense) pDense.addEventListener('change', e => { project.plugins.particle.density = parseInt(e.target.value); saveProjectToStorage(); });

    setVal('pluginVisitorText', v => project.plugins.visitorProof.text = v);
    setVal('pluginVisitorMin', v => project.plugins.visitorProof.min = parseInt(v) || 10);
    setVal('pluginVisitorMax', v => project.plugins.visitorProof.max = parseInt(v) || 50);

    setVal('pluginNewsletterTitle', v => project.plugins.newsletter.title = v);
    setVal('pluginNewsletterDesc', v => project.plugins.newsletter.desc = v);
    setVal('pluginNewsletterDelay', v => project.plugins.newsletter.delay = parseInt(v) || 4);

    setVal('pluginNeonCursorColor', v => project.plugins.neonCursor.color = v);
  }

  function syncPluginFieldsFromState() {
    if (!project.plugins) return;
    const pw = document.getElementById('pluginWhatsappToggle');
    if (pw) {
      pw.checked = !!project.plugins.whatsapp.enabled;
      document.getElementById('pluginWhatsappFields').style.display = pw.checked ? 'flex' : 'none';
      document.getElementById('pluginWhatsappNumber').value = project.plugins.whatsapp.number || '';
      document.getElementById('pluginWhatsappMsg').value = project.plugins.whatsapp.message || '';
    }

    const pc = document.getElementById('pluginCookieToggle');
    if (pc) {
      pc.checked = !!project.plugins.cookie.enabled;
      document.getElementById('pluginCookieFields').style.display = pc.checked ? 'flex' : 'none';
      document.getElementById('pluginCookieText').value = project.plugins.cookie.text || '';
      document.getElementById('pluginCookieBtnText').value = project.plugins.cookie.btnText || '';
    }

    const pt = document.getElementById('pluginThemeToggle');
    if (pt) pt.checked = !!project.plugins.themeToggle.enabled;

    const pf = document.getElementById('pluginFormToggle');
    if (pf) {
      pf.checked = !!project.plugins.form.enabled;
      document.getElementById('pluginFormFields').style.display = pf.checked ? 'flex' : 'none';
      document.getElementById('pluginFormEndpoint').value = project.plugins.form.endpoint || '';
    }

    const ps = document.getElementById('pluginSeoToggle');
    if (ps) {
      ps.checked = !!project.plugins.seo.enabled;
      document.getElementById('pluginSeoFields').style.display = ps.checked ? 'flex' : 'none';
      document.getElementById('pluginOgImage').value = project.plugins.seo.ogImage || '';
    }

    const psc = document.getElementById('pluginCustomScriptToggle');
    if (psc) {
      psc.checked = !!project.plugins.customScript.enabled;
      document.getElementById('pluginCustomScriptFields').style.display = psc.checked ? 'flex' : 'none';
      document.getElementById('pluginHeadScript').value = project.plugins.customScript.head || '';
      document.getElementById('pluginBodyScript').value = project.plugins.customScript.body || '';
    }

    // Sync new 7 plugins
    const syncField = (toggleId, fieldsId, stateKey, populateFn) => {
      const toggle = document.getElementById(toggleId);
      const fields = document.getElementById(fieldsId);
      const state = project.plugins[stateKey];
      if (toggle && state) {
        toggle.checked = !!state.enabled;
        if (fields) fields.style.display = state.enabled ? 'flex' : 'none';
        if (populateFn) populateFn(state);
      }
    };

    syncField('pluginAnnouncementToggle', 'pluginAnnouncementFields', 'announcement', s => {
      const t = document.getElementById('pluginAnnouncementText'); if (t) t.value = s.text || '';
      const lt = document.getElementById('pluginAnnouncementLinkText'); if (lt) lt.value = s.linkText || '';
      const l = document.getElementById('pluginAnnouncementLink'); if (l) l.value = s.link || '';
      const bg = document.getElementById('pluginAnnouncementBg'); if (bg) bg.value = s.bg || '#2563eb';
      const tc = document.getElementById('pluginAnnouncementTextColor'); if (tc) tc.value = s.textColor || '#ffffff';
    });

    syncField('pluginBackToTopToggle', 'pluginBackToTopFields', 'backToTop', s => {
      const st = document.getElementById('pluginBackToTopStyle'); if (st) st.value = s.style || 'pill';
      const pos = document.getElementById('pluginBackToTopPos'); if (pos) pos.value = s.position || 'right';
    });

    syncField('pluginAudioToggle', 'pluginAudioFields', 'audio', s => {
      const u = document.getElementById('pluginAudioUrl'); if (u) u.value = s.url || '';
      const t = document.getElementById('pluginAudioTitle'); if (t) t.value = s.title || '';
      const ap = document.getElementById('pluginAudioAutoplay'); if (ap) ap.checked = !!s.autoplay;
    });

    syncField('pluginParticleToggle', 'pluginParticleFields', 'particle', s => {
      const c = document.getElementById('pluginParticleColor'); if (c) c.value = s.color || '#60a5fa';
      const d = document.getElementById('pluginParticleDensity'); if (d) d.value = s.density || 70;
    });

    syncField('pluginVisitorToggle', 'pluginVisitorFields', 'visitorProof', s => {
      const t = document.getElementById('pluginVisitorText'); if (t) t.value = s.text || '';
      const mi = document.getElementById('pluginVisitorMin'); if (mi) mi.value = s.min || 18;
      const ma = document.getElementById('pluginVisitorMax'); if (ma) ma.value = s.max || 48;
    });

    syncField('pluginNewsletterToggle', 'pluginNewsletterFields', 'newsletter', s => {
      const t = document.getElementById('pluginNewsletterTitle'); if (t) t.value = s.title || '';
      const d = document.getElementById('pluginNewsletterDesc'); if (d) d.value = s.desc || '';
      const dl = document.getElementById('pluginNewsletterDelay'); if (dl) dl.value = s.delay || 4;
    });

    syncField('pluginNeonCursorToggle', 'pluginNeonCursorFields', 'neonCursor', s => {
      const c = document.getElementById('pluginNeonCursorColor'); if (c) c.value = s.color || '#00f0ff';
    });
  }

  // =========================================================================
  // Inspector Input Event Listeners
  // =========================================================================
  function setupEventListeners() {
    canvas.addEventListener('click', (e) => {
      if (e.target === canvas) {
        deselectElement();
      }
    });

    projectNameInput.addEventListener('input', (e) => {
      project.name = e.target.value;
      saveProjectToStorage();
    });

    document.getElementById('tabBarAddPageBtn').addEventListener('click', () => {
      openModal('newPageModal');
    });

    document.getElementById('createNewPageBtn').addEventListener('click', () => {
      openModal('newPageModal');
    });

    // Viewport Mode Switcher
    document.querySelectorAll('.we-viewport-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const vp = this.getAttribute('data-viewport');
        if (!vp) return;
        document.querySelectorAll('.we-viewport-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeViewport = vp;
        artboardWrapper.className = `we-artboard-wrapper viewport-${vp}`;
      });
    });

    // Sidebar Tabs
    document.querySelectorAll('.we-tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.we-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.we-tab-pane').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const target = document.getElementById(this.getAttribute('data-tab'));
        if (target) target.classList.add('active');
      });
    });

    // Basic Elements Click to insert
    document.querySelectorAll('.we-element-card').forEach(card => {
      card.addEventListener('click', function () {
        const type = this.getAttribute('data-element');
        insertElement(type);
      });
    });

    // Presets Insert Buttons
    document.querySelectorAll('.we-preset-item').forEach(item => {
      const presetType = item.getAttribute('data-preset');
      const insertBtn = item.querySelector('.add-preset-btn');
      if (insertBtn) {
        insertBtn.addEventListener('click', () => {
          insertPreset(presetType);
        });
      }
    });

    // Button Style Presets
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', function () {
        const styleName = this.getAttribute('data-button-style');
        insertStyledButton(styleName);
      });
    });

    // Bottom Add Section Button
    document.getElementById('canvasBottomAddSectionBtn').addEventListener('click', () => {
      insertPreset('hero');
      setTimeout(() => {
        canvas.scrollTop = canvas.scrollHeight;
      }, 50);
    });

    // Contextual Floating Toolbar Actions
    document.getElementById('toolEditCode').addEventListener('click', openElementCodeEditor);
    document.getElementById('inspectorEditCodeBtn').addEventListener('click', openElementCodeEditor);
    document.getElementById('toolMoveUp').addEventListener('click', () => moveElement(-1));
    document.getElementById('toolMoveDown').addEventListener('click', () => moveElement(1));
    document.getElementById('toolDuplicate').addEventListener('click', duplicateElement);
    document.getElementById('toolDelete').addEventListener('click', deleteElement);

    // Code Editor Buttons
    document.getElementById('viewCodeBtn').addEventListener('click', openPageCodeEditor);
    applyCodeBtn.addEventListener('click', applyPageCodeChanges);
    applyElementCodeBtn.addEventListener('click', applyElementCodeChanges);

    // Inspector Events: Button Link
    propLinkType.addEventListener('change', (e) => {
      if (!selectedElement) return;
      const type = e.target.value;
      selectedElement.setAttribute('data-we-link-type', type);
      updateLinkActionRows(type);
      recordHistory('Update Button Link Type');
    });

    propTargetPage.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.setAttribute('data-we-target-page', e.target.value);
      recordHistory('Update Button Target Page');
    });

    propTargetUrl.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.setAttribute('data-we-target-url', e.target.value);
      recordHistory('Update Button Target URL');
    });

    propScrollId.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.setAttribute('data-we-scroll-id', e.target.value);
      recordHistory('Update Button Scroll ID');
    });

    propTargetWindow.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.setAttribute('data-we-target-window', e.target.value);
      recordHistory('Update Button Target Window');
    });

    // Inspector Events: Media (Natural Ratio, Resizing & Crop)
    function getSelectedMediaTarget() {
      if (!selectedElement) return null;
      if (selectedElement.tagName === 'IMG' || selectedElement.tagName === 'VIDEO' || selectedElement.tagName === 'IFRAME') {
        return selectedElement;
      }
      return selectedElement.querySelector('img, video, iframe') || selectedElement;
    }

    if (propMediaUrl) {
      propMediaUrl.addEventListener('input', (e) => {
        if (!selectedElement) return;
        const target = getSelectedMediaTarget();
        const url = e.target.value.trim();

        if (target.tagName === 'IMG') {
          target.src = url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
        } else if (target.tagName === 'IFRAME' || target.tagName === 'VIDEO') {
          // If direct mp4/webm video, use <video> tag
          if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('.mp4?')) {
            const vid = document.createElement('video');
            vid.src = url;
            vid.controls = true;
            vid.style.width = '100%';
            vid.style.height = 'auto';
            vid.style.borderRadius = target.style.borderRadius || '12px';
            vid.style.display = 'block';
            target.parentNode.replaceChild(vid, target);
          } else {
            target.src = convertVideoUrlToEmbed(url);
            selectedElement.setAttribute('data-we-video-src', url);
          }
        }
        recordHistory('Update Media URL');
      });
    }

    if (propMediaAlt) {
      propMediaAlt.addEventListener('input', (e) => {
        const target = getSelectedMediaTarget();
        if (target) {
          target.setAttribute('alt', e.target.value);
          recordHistory('Update Media Alt');
        }
      });
    }

    if (propMediaFit) {
      propMediaFit.addEventListener('change', (e) => {
        const target = getSelectedMediaTarget();
        if (target) {
          target.style.objectFit = e.target.value;
          recordHistory('Update Media Object Fit');
        }
      });
    }

    function applyMediaRatio(ratio) {
      const target = getSelectedMediaTarget();
      if (!target) return;
      target.style.aspectRatio = ratio;
      if (selectedElement && selectedElement !== target) {
        selectedElement.style.aspectRatio = ratio;
      }
      if (propMediaRatio) propMediaRatio.value = ratio;
      if (mediaRatioPresets) {
        mediaRatioPresets.querySelectorAll('.we-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratio);
        });
      }
      recordHistory(`Update Aspect Ratio (${ratio})`);
    }

    if (propMediaRatio) {
      propMediaRatio.addEventListener('change', (e) => {
        applyMediaRatio(e.target.value);
      });
    }

    if (mediaRatioPresets) {
      mediaRatioPresets.querySelectorAll('.we-pill-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const ratio = this.getAttribute('data-ratio');
          applyMediaRatio(ratio);
        });
      });
    }

    if (propMediaWidthSelect) {
      propMediaWidthSelect.addEventListener('change', (e) => {
        const target = getSelectedMediaTarget();
        if (!target) return;
        target.style.width = e.target.value;
        if (selectedElement && selectedElement !== target) {
          selectedElement.style.width = e.target.value;
        }
        recordHistory('Update Media Width');
      });
    }

    if (propMediaHeightSelect) {
      propMediaHeightSelect.addEventListener('change', (e) => {
        const target = getSelectedMediaTarget();
        if (!target) return;
        target.style.maxHeight = e.target.value;
        if (selectedElement && selectedElement !== target) {
          selectedElement.style.maxHeight = e.target.value;
        }
        recordHistory('Update Media Max Height');
      });
    }

    if (propMediaPosition) {
      propMediaPosition.addEventListener('change', (e) => {
        const target = getSelectedMediaTarget();
        if (target) {
          target.style.objectPosition = e.target.value;
          recordHistory('Update Media Focal Position');
        }
      });
    }

    if (propMediaZoom) {
      propMediaZoom.addEventListener('input', (e) => {
        const target = getSelectedMediaTarget();
        const scale = (parseInt(e.target.value) / 100).toFixed(2);
        if (valMediaZoom) valMediaZoom.textContent = `${e.target.value}%`;
        if (target) {
          target.style.transform = `scale(${scale})`;
          target.style.transformOrigin = 'center center';
          if (target.parentNode) target.parentNode.style.overflow = 'hidden';
          saveProjectToStorage();
        }
      });
      propMediaZoom.addEventListener('change', () => {
        recordHistory('Update Media Zoom Scale');
      });
    }

    // Inspector Events: Typography
    propTextContent.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.innerText = e.target.value;
      saveProjectToStorage();
    });

    propFontFamily.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.fontFamily = e.target.value;
      recordHistory('Update Font Family');
    });

    propFontSize.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.fontSize = e.target.value + 'px';
      recordHistory('Update Font Size');
    });

    propFontWeight.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.fontWeight = e.target.value;
      recordHistory('Update Font Weight');
    });

    document.querySelectorAll('#propTextAlignGroup .we-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        if (!selectedElement) return;
        document.querySelectorAll('#propTextAlignGroup .we-toggle-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedElement.style.textAlign = this.getAttribute('data-align');
        recordHistory('Update Text Align');
      });
    });

    propTextColorPicker.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.color = e.target.value;
      propTextColorText.value = e.target.value;
      recordHistory('Update Text Color');
    });

    propTextColorText.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.color = e.target.value;
      propTextColorPicker.value = e.target.value;
      recordHistory('Update Text Color');
    });

    // Inspector Events: Colors & Background
    propBgType.addEventListener('change', (e) => {
      const type = e.target.value;
      rowSolidBg.style.display = type === 'solid' ? 'flex' : 'none';
      rowGradientPreset.style.display = type === 'gradient' ? 'flex' : 'none';
      rowBgImageLink.style.display = type === 'image' ? 'flex' : 'none';

      if (!selectedElement) return;
      if (type === 'transparent') {
        selectedElement.style.background = 'transparent';
      } else if (type === 'solid') {
        selectedElement.style.background = propBgColorPicker.value;
      } else if (type === 'gradient') {
        selectedElement.style.background = propGradientPreset.value;
      }
      recordHistory('Update Background Type');
    });

    propBgColorPicker.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.background = e.target.value;
      propBgColorText.value = e.target.value;
      recordHistory('Update Background Color');
    });

    propBgColorText.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.background = e.target.value;
      propBgColorPicker.value = e.target.value;
      recordHistory('Update Background Color');
    });

    propGradientPreset.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.background = e.target.value;
      recordHistory('Update Gradient');
    });

    propBgImageUrl.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.backgroundImage = `url('${e.target.value}')`;
      selectedElement.style.backgroundSize = 'cover';
      selectedElement.style.backgroundPosition = 'center';
      recordHistory('Update Background Image');
    });

    propOpacity.addEventListener('input', (e) => {
      if (!selectedElement) return;
      const op = e.target.value;
      selectedElement.style.opacity = op / 100;
      valOpacity.textContent = op + '%';
      recordHistory('Update Opacity');
    });

    // Inspector Events: Shape & Borders
    propBorderRadius.addEventListener('input', (e) => {
      if (!selectedElement) return;
      const r = e.target.value;
      selectedElement.style.borderRadius = r + 'px';
      valBorderRadius.textContent = r + 'px';
      recordHistory('Update Border Radius');
    });

    document.querySelectorAll('.we-chip-btn[data-radius]').forEach(btn => {
      btn.addEventListener('click', function () {
        if (!selectedElement) return;
        const r = this.getAttribute('data-radius');
        selectedElement.style.borderRadius = r + 'px';
        propBorderRadius.value = Math.min(100, parseInt(r, 10));
        valBorderRadius.textContent = r + 'px';
        recordHistory('Update Border Radius');
      });
    });

    propBorderWidth.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.borderWidth = e.target.value + 'px';
      recordHistory('Update Border Width');
    });

    propBorderStyle.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.borderStyle = e.target.value;
      recordHistory('Update Border Style');
    });

    propBorderColorPicker.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.borderColor = e.target.value;
      propBorderColorText.value = e.target.value;
      recordHistory('Update Border Color');
    });

    propBorderColorText.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.borderColor = e.target.value;
      propBorderColorPicker.value = e.target.value;
      recordHistory('Update Border Color');
    });

    propBoxShadow.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.boxShadow = e.target.value;
      recordHistory('Update Box Shadow');
    });

    // Inspector Events: Spacing & Sizing
    propWidth.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.width = e.target.value;
      recordHistory('Update Width');
    });

    propMaxWidth.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.maxWidth = e.target.value;
      recordHistory('Update Max Width');
    });

    propPadding.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.padding = e.target.value + 'px';
      recordHistory('Update Padding');
    });

    propMarginBottom.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.style.marginBottom = e.target.value + 'px';
      recordHistory('Update Margin Bottom');
    });

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    document.getElementById('clearCanvasBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all elements on this page?')) {
        canvas.innerHTML = '';
        deselectElement();
        renderSectionInsertBars();
        updateLayersTree();
        recordHistory('Clear Canvas');
      }
    });

    document.getElementById('previewBtn').addEventListener('click', openLivePreview);

    document.getElementById('exportBtn').addEventListener('click', () => {
      const pageCount = Object.keys(project.pages).length;
      document.getElementById('exportPageCount').textContent = `${pageCount} page${pageCount > 1 ? 's' : ''}`;
      openModal('exportModal');
    });

    document.querySelectorAll('.we-modal-close, [data-close]').forEach(btn => {
      btn.addEventListener('click', function () {
        const modalId = this.getAttribute('data-close');
        if (modalId) closeModal(modalId);
      });
    });

    document.getElementById('confirmCreatePageBtn').addEventListener('click', () => {
      const name = document.getElementById('newPageNameInput').value.trim();
      const slug = document.getElementById('newPageSlugInput').value.trim();
      const starter = document.querySelector('input[name="pageStarter"]:checked').value;
      if (!name) {
        alert('Please provide a page name.');
        return;
      }
      createNewPage(name, slug || name.toLowerCase().replace(/\s+/g, '-'), starter);
    });

    document.getElementById('deletePageBtn').addEventListener('click', () => deletePage(project.activePageId));

    // Code tabs switching in codeModal
    document.querySelectorAll('.we-code-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.we-code-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.we-code-pane').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const target = document.getElementById(this.getAttribute('data-code-tab'));
        if (target) target.classList.add('active');
      });
    });

    document.getElementById('copyCodeBtn').addEventListener('click', () => {
      const activeTextarea = document.querySelector('.we-code-pane.active textarea');
      if (activeTextarea) {
        navigator.clipboard.writeText(activeTextarea.value);
        const copyBtn = document.getElementById('copyCodeBtn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      }
    });

    // Export Modal Selection & Download
    const optZip = document.getElementById('exportOptionZip');
    const optHtml = document.getElementById('exportOptionHtml');
    optZip.addEventListener('click', () => {
      optZip.classList.add('active');
      optHtml.classList.remove('active');
    });
    optHtml.addEventListener('click', () => {
      optHtml.classList.add('active');
      optZip.classList.remove('active');
    });

    document.getElementById('confirmDownloadBtn').addEventListener('click', () => {
      if (optZip.classList.contains('active')) {
        exportProjectZip();
      } else {
        exportSinglePageHtml();
      }
      closeModal('exportModal');
    });

    // Live Preview Viewport Toggles
    document.querySelectorAll('[data-preview-vp]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-preview-vp]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const vp = this.getAttribute('data-preview-vp');
        document.getElementById('previewIframe').style.width = vp;
      });
    });
  }

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const isContentEditable = document.activeElement.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!isInput) {
          e.preventDefault();
          redo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedElement && !isInput && !isContentEditable) {
          e.preventDefault();
          duplicateElement();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !isInput && !isContentEditable) {
          e.preventDefault();
          deleteElement();
        }
      } else if (e.key === 'Escape') {
        deselectElement();
      }
    });
  }

  // =========================================================================
  // Element Insertion Functions
  // =========================================================================
  function insertElement(type, beforeNode = null) {
    const el = document.createElement('div');
    el.className = 'we-node';
    el.setAttribute('data-we-type', type);
    el.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));

    switch (type) {
      case 'heading':
        el.innerHTML = '<h2 style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; line-height: 1.2;">Heading Title</h2>';
        el.style.marginBottom = '16px';
        break;

      case 'paragraph':
        el.innerHTML = '<p style="font-size: 16px; color: #9ca3af; line-height: 1.6; margin: 0;">This is a paragraph text block. Click to edit in place or customize styling in the right panel.</p>';
        el.style.marginBottom = '16px';
        break;

      case 'button':
        el.innerHTML = '<button style="background: #0a84ff; color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">Action Button</button>';
        el.setAttribute('data-we-link-type', 'none');
        el.style.display = 'inline-block';
        el.style.marginBottom = '16px';
        break;

      case 'box':
        el.style.background = '#121318';
        el.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        el.style.borderRadius = '12px';
        el.style.padding = '24px';
        el.style.marginBottom = '20px';
        el.innerHTML = '<p style="color: #6b7280; font-size: 13px; margin: 0;">Container Box. You can add nested content or apply background gradients here.</p>';
        break;

      case 'card':
        el.style.background = '#14161f';
        el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        el.style.borderRadius = '16px';
        el.style.padding = '24px';
        el.style.marginBottom = '20px';
        el.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
        el.innerHTML = `
          <h3 style="font-size: 20px; font-weight: 600; color: #fff; margin: 0 0 10px 0;">Feature Card</h3>
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0 0 16px 0;">A sleek showcase card with high-conversion typography and smooth border styling.</p>
          <button style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">Learn More</button>
        `;
        break;

      case 'image':
        const img = document.createElement('img');
        img.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
        img.alt = 'Modern Abstract Artwork';
        img.style.width = '100%';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = 'none';
        img.style.aspectRatio = 'auto';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '12px';
        img.style.display = 'block';
        el.appendChild(img);
        el.style.marginBottom = '20px';
        break;

      case 'video':
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'we-media-frame';
        videoWrapper.style.width = '100%';
        videoWrapper.style.maxWidth = '100%';
        videoWrapper.style.aspectRatio = '16 / 9';
        videoWrapper.style.borderRadius = '12px';
        videoWrapper.style.overflow = 'hidden';
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.setAttribute('allowfullscreen', 'true');
        videoWrapper.appendChild(iframe);
        el.appendChild(videoWrapper);
        el.setAttribute('data-we-video-src', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        el.style.marginBottom = '20px';
        break;

      case 'badge':
        el.innerHTML = '<span style="display: inline-block; padding: 4px 12px; background: rgba(10, 132, 255, 0.15); border: 1px solid rgba(10, 132, 255, 0.35); color: #0a84ff; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">New Feature</span>';
        el.style.display = 'inline-block';
        el.style.marginBottom = '12px';
        break;

      case 'input':
        el.innerHTML = '<input type="text" placeholder="Enter your email address..." style="width: 100%; max-width: 400px; background: #121318; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; color: #fff; padding: 12px 16px; font-size: 14px; outline: none;">';
        el.style.marginBottom = '16px';
        break;

      case 'divider':
        el.innerHTML = '<hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0;">';
        el.style.marginBottom = '24px';
        break;
    }

    if (beforeNode && beforeNode.parentNode === canvas) {
      canvas.insertBefore(el, beforeNode);
    } else {
      canvas.appendChild(el);
    }

    bindCanvasNodeListeners();
    renderSectionInsertBars();
    selectElement(el);
    updateLayersTree();
    recordHistory(`Insert ${type}`);
  }

  function insertStyledButton(styleName) {
    const el = document.createElement('div');
    el.className = 'we-node';
    el.setAttribute('data-we-type', 'button');
    el.setAttribute('data-we-link-type', 'none');
    el.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));
    el.style.display = 'inline-block';
    el.style.marginBottom = '16px';

    let btnHtml = '';
    switch (styleName) {
      case 'primary':
        btnHtml = '<button style="background: #0071e3; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);">Get Started</button>';
        break;
      case 'glass':
        btnHtml = '<button style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #fff; border: 1px solid rgba(255, 255, 255, 0.18); padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer;">Explore More</button>';
        break;
      case 'gradient':
        btnHtml = '<button style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; padding: 12px 26px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);">Unlock Access</button>';
        break;
      case 'outline':
        btnHtml = '<button style="background: transparent; color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); padding: 10px 22px; border-radius: 999px; font-size: 14px; font-weight: 500; cursor: pointer;">View Catalog</button>';
        break;
      case 'emerald':
        btnHtml = '<button style="background: #10b981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">Launch Now</button>';
        break;
      case 'cyber':
        btnHtml = '<button style="background: #06b6d4; color: #0a0a0c; border: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);">Initialize</button>';
        break;
    }
    el.innerHTML = btnHtml;

    canvas.appendChild(el);
    bindCanvasNodeListeners();
    renderSectionInsertBars();
    selectElement(el);
    updateLayersTree();
    recordHistory(`Insert ${styleName} Button`);
  }

  function insertPreset(presetType, beforeNode = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'we-node';
    wrapper.setAttribute('data-we-type', 'section');
    wrapper.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));
    wrapper.style.marginBottom = '40px';

    switch (presetType) {
      case 'hero':
        wrapper.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; background: linear-gradient(180deg, rgba(18, 19, 24, 0.9) 0%, rgba(10, 10, 12, 1) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;">
            <span style="display: inline-block; padding: 5px 14px; background: rgba(10, 132, 255, 0.15); border: 1px solid rgba(10, 132, 255, 0.3); color: #0a84ff; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px;">Next Generation Web Builder</span>
            <h1 style="font-size: 46px; font-weight: 800; color: #fff; line-height: 1.15; margin: 0 auto 16px; max-width: 800px; letter-spacing: -0.5px;">Build High-Conversion Websites at the Speed of Thought</h1>
            <p style="font-size: 18px; color: #9ca3af; line-height: 1.6; margin: 0 auto 30px; max-width: 620px;">Visual no-code architecture with real-time responsive preview, multi-page routing, and full package export.</p>
            <div style="display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap;">
              <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: #0a84ff; color: #fff; border: none; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 18px rgba(10, 132, 255, 0.4);">Get Started Free</button>
              <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer;">Learn More</button>
            </div>
          </div>
        `;
        break;

      case 'navbar':
        wrapper.innerHTML = `
          <header style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px; border-radius: 6px; background: #0a84ff; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">AS</div>
              <span style="font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px;">Enterprise</span>
            </div>
            <nav style="display: flex; gap: 20px; align-items: center;">
              <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #9ca3af; text-decoration: none; font-size: 13px; font-weight: 500;">Home</a>
              <a href="about.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="color: #9ca3af; text-decoration: none; font-size: 13px; font-weight: 500;">About</a>
              <a href="#features" class="we-node" data-we-type="button" data-we-link-type="scroll" data-we-scroll-id="features" style="color: #9ca3af; text-decoration: none; font-size: 13px; font-weight: 500;">Features</a>
            </nav>
            <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: #0a84ff; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Sign Up</button>
          </header>
        `;
        break;

      case 'features':
        wrapper.innerHTML = `
          <div id="features" style="padding: 40px 0;">
            <div style="text-align: center; margin-bottom: 36px;">
              <h2 style="font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 10px;">Engineered for Pure Performance</h2>
              <p style="font-size: 16px; color: #9ca3af; margin: 0;">Everything you need to ship world-class digital experiences.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 24px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(10, 132, 255, 0.15); color: #0a84ff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-bottom: 16px;">01</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #fff; margin: 0 0 10px;">Direct Media Integration</h3>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0;">Paste any direct link to images, banners, or video streams and watch them render instantly.</p>
              </div>
              <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 24px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); color: #6366f1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-bottom: 16px;">02</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #fff; margin: 0 0 10px;">Inter-Page Navigation</h3>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0;">Connect buttons directly to project pages. Test live transitions right inside the interactive preview.</p>
              </div>
              <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 24px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-bottom: 16px;">03</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #fff; margin: 0 0 10px;">One-Click Package Export</h3>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0;">Download a complete ZIP containing all connected HTML files and responsive stylesheets ready to host.</p>
              </div>
            </div>
          </div>
        `;
        break;

      case 'pricing':
        wrapper.innerHTML = `
          <div style="padding: 40px 0;">
            <div style="text-align: center; margin-bottom: 36px;">
              <h2 style="font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 10px;">Predictable, Transparent Pricing</h2>
              <p style="font-size: 16px; color: #9ca3af; margin: 0;">Scale seamlessly from personal blogs to enterprise suites.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              <div style="background: #121318; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 28px;">
                <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px;">Starter</h3>
                <div style="font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 14px;">$0<span style="font-size: 14px; color: #6b7280; font-weight: 400;"> / month</span></div>
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 20px;">Essential tools for personal portfolios and landing pages.</p>
                <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="width: 100%; background: #1f222c; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Start Free</button>
              </div>
              <div style="background: #161822; border: 2px solid #0a84ff; border-radius: 16px; padding: 28px; box-shadow: 0 10px 35px rgba(10, 132, 255, 0.25); position: relative;">
                <span style="position: absolute; top: -11px; right: 20px; background: #0a84ff; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 999px; text-transform: uppercase;">Most Popular</span>
                <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px;">Pro Cloud</h3>
                <div style="font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 14px;">$19<span style="font-size: 14px; color: #6b7280; font-weight: 400;"> / month</span></div>
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 20px;">Unlimited multi-page websites, custom domains, and zero branding.</p>
                <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="width: 100%; background: #0a84ff; border: none; color: #fff; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Get Started</button>
              </div>
              <div style="background: #121318; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 28px;">
                <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px;">Enterprise</h3>
                <div style="font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 14px;">$49<span style="font-size: 14px; color: #6b7280; font-weight: 400;"> / month</span></div>
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 20px;">Dedicated clusters, team collaboration, and 99.9% uptime SLA.</p>
                <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="width: 100%; background: #1f222c; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Contact Sales</button>
              </div>
            </div>
          </div>
        `;
        break;

      case 'cta':
        wrapper.innerHTML = `
          <div style="text-align: center; padding: 50px 30px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);">
            <h2 style="font-size: 34px; font-weight: 700; color: #fff; margin: 0 0 12px;">Ready to Launch Your Project?</h2>
            <p style="font-size: 16px; color: #cbd5e1; max-width: 540px; margin: 0 auto 26px; line-height: 1.6;">Design without constraints. Download full static code packages and host anywhere on the web.</p>
            <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: #6366f1; color: #fff; border: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.45);">Get Started Today</button>
          </div>
        `;
        break;

      case 'testimonials':
        wrapper.innerHTML = `
          <div style="padding: 40px 0;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px;">Loved by Modern Creators</h2>
              <p style="font-size: 15px; color: #9ca3af; margin: 0;">See what developers and founders are saying.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
              <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 22px;">
                <p style="font-size: 14px; color: #e5e7eb; line-height: 1.6; margin: 0 0 16px;">"The visual canvas and multi-page link connectivity saved me dozens of hours building our prototype."</p>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Alex Rivera</div>
                <div style="font-size: 11px; color: #6b7280;">Lead Designer at Apex</div>
              </div>
              <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 22px;">
                <p style="font-size: 14px; color: #e5e7eb; line-height: 1.6; margin: 0 0 16px;">"Exporting a clean ZIP file with working page routes directly from the browser is absolute genius."</p>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Sarah Jenkins</div>
                <div style="font-size: 11px; color: #6b7280;">Founder at VibeCore</div>
              </div>
            </div>
          </div>
        `;
        break;

      case 'contact':
        wrapper.innerHTML = `
          <div style="padding: 40px 20px; background: #121318; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; max-width: 600px; margin: 0 auto;">
            <h2 style="font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 8px; text-align: center;">Get in Touch</h2>
            <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px; text-align: center;">Have questions or need enterprise consultation? Send us a message.</p>
            <form action="${project.plugins.form.enabled ? (project.plugins.form.endpoint || '#') : '#'}" method="POST" style="display: flex; flex-direction: column; gap: 14px;">
              <input type="text" name="name" placeholder="Your Name" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
              <input type="email" name="email" placeholder="Your Email Address" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
              <textarea name="message" placeholder="Your Message..." rows="4" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none; resize: vertical;"></textarea>
              <button class="we-node" data-we-type="button" data-we-link-type="none" type="submit" style="background: #0a84ff; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Send Message</button>
            </form>
          </div>
        `;
        break;

      case 'media-gallery':
        wrapper.innerHTML = `
          <div style="padding: 30px 0;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 8px;">Visual Showcase Gallery</h2>
              <p style="font-size: 14px; color: #9ca3af; margin: 0;">Connected direct media assets rendered dynamically.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" alt="Scenic Gallery 1" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; display: block;">
              <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80" alt="Scenic Gallery 2" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; display: block;">
              <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80" alt="Scenic Gallery 3" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; display: block;">
            </div>
          </div>
        `;
        break;

      case 'footer':
        wrapper.innerHTML = `
          <footer style="padding: 40px 20px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 60px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 30px; margin-bottom: 30px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                  <div style="width: 24px; height: 24px; border-radius: 6px; background: #0a84ff; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px;">AS</div>
                  <strong style="color: #fff; font-size: 15px;">AS Web Studio</strong>
                </div>
                <p style="font-size: 12px; color: #6b7280; max-width: 240px; line-height: 1.5; margin: 0;">Designed and deployed on the AS Cloud distributed network.</p>
              </div>
              <div style="display: flex; gap: 40px; font-size: 12px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <strong style="color: #fff; margin-bottom: 4px;">Pages</strong>
                  <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #9ca3af; text-decoration: none;">Home</a>
                  <a href="about.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="color: #9ca3af; text-decoration: none;">About</a>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <strong style="color: #fff; margin-bottom: 4px;">Legal</strong>
                  <span style="color: #6b7280;">Privacy Policy</span>
                  <span style="color: #6b7280;">Terms of Service</span>
                </div>
              </div>
            </div>
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; font-size: 11px; color: #4b5563; text-align: center;">
              Copyright 2026 AS Cloud Inc. All rights reserved.
            </div>
          </footer>
        `;
        break;
    }

    if (beforeNode && beforeNode.parentNode === canvas) {
      canvas.insertBefore(wrapper, beforeNode);
    } else {
      canvas.appendChild(wrapper);
    }

    bindCanvasNodeListeners();
    renderSectionInsertBars();
    selectElement(wrapper);
    updateLayersTree();
    recordHistory(`Insert ${presetType} Section`);
  }

  // =========================================================================
  // Element Manipulation Operations
  // =========================================================================
  function moveElement(direction) {
    if (!selectedElement) return;
    if (direction === -1) {
      const prev = selectedElement.previousElementSibling;
      if (prev && !prev.classList.contains('we-section-insert-bar')) {
        canvas.insertBefore(selectedElement, prev);
        renderSectionInsertBars();
        positionFloatingToolbar(selectedElement);
        updateLayersTree();
        recordHistory('Move Element Up');
      }
    } else if (direction === 1) {
      const next = selectedElement.nextElementSibling;
      if (next && !next.classList.contains('we-section-insert-bar')) {
        canvas.insertBefore(next, selectedElement);
        renderSectionInsertBars();
        positionFloatingToolbar(selectedElement);
        updateLayersTree();
        recordHistory('Move Element Down');
      }
    }
  }

  function duplicateElement() {
    if (!selectedElement) return;
    const clone = selectedElement.cloneNode(true);
    clone.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));
    clone.classList.remove('selected');
    selectedElement.parentNode.insertBefore(clone, selectedElement.nextSibling);
    bindCanvasNodeListeners();
    renderSectionInsertBars();
    selectElement(clone);
    updateLayersTree();
    recordHistory('Duplicate Element');
  }

  function deleteElement() {
    if (!selectedElement) return;
    const parent = selectedElement.parentNode;
    parent.removeChild(selectedElement);
    deselectElement();
    renderSectionInsertBars();
    updateLayersTree();
    recordHistory('Delete Element');
  }

  // =========================================================================
  // Layers Tree Synchronization
  // =========================================================================
  function updateLayersTree() {
    const container = document.getElementById('layersTreeContainer');
    if (!container) return;
    container.innerHTML = '';

    const nodes = canvas.querySelectorAll(':scope > .we-node');
    if (nodes.length === 0) {
      container.innerHTML = '<div style="color: #6b7280; font-size: 11px; padding: 8px;">No elements on this page.</div>';
      return;
    }

    nodes.forEach((node, idx) => {
      const type = node.getAttribute('data-we-type') || node.tagName.toLowerCase();
      const id = node.getAttribute('data-we-id');
      const item = document.createElement('div');
      item.className = `we-layer-node ${selectedElement === node ? 'active' : ''}`;
      item.setAttribute('data-layer-id', id);

      let previewText = node.innerText.slice(0, 20).trim();
      if (!previewText) previewText = type;

      item.innerHTML = `
        <span style="display: flex; align-items: center; gap: 6px;">
          <span style="font-family: var(--we-font-mono); font-size: 10px; color: var(--we-text-dim);">${idx + 1}.</span>
          <span>${type}</span>
        </span>
        <span style="font-size: 10px; color: var(--we-text-dim);">${previewText}</span>
      `;
      item.addEventListener('click', () => {
        selectElement(node);
      });
      container.appendChild(item);
    });
  }

  function highlightLayerNode(id) {
    document.querySelectorAll('.we-layer-node').forEach(node => {
      node.classList.toggle('active', node.getAttribute('data-layer-id') === id);
    });
  }

  // =========================================================================
  // Interactive Live Preview Mode
  // =========================================================================
  function openLivePreview() {
    if (project.pages[project.activePageId]) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }

    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewIframe');
    const indicator = document.getElementById('previewPageIndicator');

    modal.classList.add('open');
    renderIframePage(project.activePageId);

    function renderIframePage(pageId) {
      const page = project.pages[pageId];
      if (!page) return;
      indicator.textContent = `Viewing: ${page.name} (${page.slug}.html)`;

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(generateFullPageHtml(page, false));
      doc.close();

      // Intercept link/button navigation clicks inside preview iframe
      doc.addEventListener('click', (e) => {
        const link = e.target.closest('[data-we-link-type], a, button');
        if (link) {
          const linkType = link.getAttribute('data-we-link-type');
          const targetPage = link.getAttribute('data-we-target-page');
          const targetUrl = link.getAttribute('data-we-target-url') || link.getAttribute('href');

          if (linkType === 'page' && targetPage) {
            e.preventDefault();
            renderIframePage(targetPage);
          } else if (targetUrl && (targetUrl.endsWith('.html') || !targetUrl.startsWith('http'))) {
            const cleanSlug = targetUrl.replace('.html', '').replace(/^\//, '');
            if (project.pages[cleanSlug]) {
              e.preventDefault();
              renderIframePage(cleanSlug);
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // Package Exporter (ZIP & Single HTML)
  // =========================================================================
  function exportProjectZip() {
    if (!window.JSZip || !window.saveAs) {
      alert('Exporter library is loading. Please wait 2 seconds and try again.');
      return;
    }

    if (project.pages[project.activePageId]) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }

    const zip = new JSZip();
    const sharedCss = generateBundledCss();
    zip.file('style.css', sharedCss);

    Object.keys(project.pages).forEach(pageId => {
      const page = project.pages[pageId];
      const pageHtml = generateFullPageHtml(page, false, 'style.css');
      zip.file(`${page.slug}.html`, pageHtml);
    });

    const safeName = (project.name || 'website').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `${safeName}.zip`);
    });
  }

  function exportSinglePageHtml() {
    if (project.pages[project.activePageId]) {
      const clone = canvas.cloneNode(true);
      clone.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());
      project.pages[project.activePageId].html = clone.innerHTML;
    }
    const page = project.pages[project.activePageId];
    const fullHtml = generateFullPageHtml(page, true);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const safeSlug = page.slug || 'index';
    saveAs(blob, `${safeSlug}.html`);
  }

  // =========================================================================
  // HTML / CSS Code Generators with Plugins Injection
  // =========================================================================
  function generateFullPageHtml(page, inlineCss = false, cssFileName = 'style.css') {
    const temp = document.createElement('div');
    temp.innerHTML = page.html || '';

    // Remove any leftover editor bars
    temp.querySelectorAll('.we-section-insert-bar').forEach(b => b.remove());

    // Convert linked buttons
    temp.querySelectorAll('.we-node').forEach(node => {
      node.classList.remove('we-node', 'selected');
      node.removeAttribute('contenteditable');

      const linkType = node.getAttribute('data-we-link-type');
      if (linkType === 'page') {
        const targetPageSlug = node.getAttribute('data-we-target-page') || 'index';
        const button = node.querySelector('button') || (node.tagName === 'BUTTON' ? node : null);
        if (button) {
          const a = document.createElement('a');
          a.href = `${targetPageSlug}.html`;
          a.innerHTML = button.innerHTML;
          a.style.cssText = button.style.cssText;
          a.style.display = 'inline-block';
          a.style.textDecoration = 'none';
          button.parentNode.replaceChild(a, button);
        } else if (node.tagName === 'A') {
          node.href = `${targetPageSlug}.html`;
        }
      } else if (linkType === 'url') {
        const url = node.getAttribute('data-we-target-url') || '#';
        const win = node.getAttribute('data-we-target-window') || '_self';
        const button = node.querySelector('button') || (node.tagName === 'BUTTON' ? node : null);
        if (button) {
          const a = document.createElement('a');
          a.href = url;
          a.target = win;
          a.innerHTML = button.innerHTML;
          a.style.cssText = button.style.cssText;
          a.style.display = 'inline-block';
          a.style.textDecoration = 'none';
          button.parentNode.replaceChild(a, button);
        } else if (node.tagName === 'A') {
          node.href = url;
          node.target = win;
        }
      } else if (linkType === 'scroll') {
        const id = node.getAttribute('data-we-scroll-id') || '';
        const button = node.querySelector('button') || (node.tagName === 'BUTTON' ? node : null);
        if (button) {
          const a = document.createElement('a');
          a.href = `#${id}`;
          a.innerHTML = button.innerHTML;
          a.style.cssText = button.style.cssText;
          a.style.display = 'inline-block';
          a.style.textDecoration = 'none';
          button.parentNode.replaceChild(a, button);
        }
      }
    });

    const cleanContent = temp.innerHTML;
    const title = page.title || `${page.name} • ${project.name}`;
    const desc = page.desc || 'Created with AS Web Editor';
    const bg = page.bgColor || '#0a0a0c';

    // Build Plugin Scripts & Head/Body injections
    const pluginHeadTags = buildPluginHeadInjections();
    const pluginBodyTags = buildPluginBodyInjections();

    if (inlineCss) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
${pluginHeadTags}
  <style>
${generateBundledCss(bg)}
  </style>
</head>
<body style="background-color: ${bg};">
  <main class="page-container">
${indentHtml(cleanContent, 4)}
  </main>
${pluginBodyTags}
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssFileName}">
${pluginHeadTags}
</head>
<body style="background-color: ${bg};">
  <main class="page-container">
${indentHtml(cleanContent, 4)}
  </main>
${pluginBodyTags}
</body>
</html>`;
  }

  function buildPluginHeadInjections() {
    let out = '';
    const plugins = project.plugins || {};

    if (plugins.seo && plugins.seo.enabled && plugins.seo.ogImage) {
      out += `  <meta property="og:title" content="${escapeHtml(project.name)}">\n`;
      out += `  <meta property="og:image" content="${escapeHtml(plugins.seo.ogImage)}">\n`;
      out += `  <meta property="og:type" content="website">\n`;
    }

    if (plugins.customScript && plugins.customScript.enabled && plugins.customScript.head) {
      out += `  ${plugins.customScript.head}\n`;
    }

    return out;
  }

  function buildPluginBodyInjections() {
    let out = '';
    const plugins = project.plugins || {};

    // 1. WhatsApp Floating Widget
    if (plugins.whatsapp && plugins.whatsapp.enabled && plugins.whatsapp.number) {
      const cleanNum = plugins.whatsapp.number.replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(plugins.whatsapp.message || 'Hello!');
      out += `
  <!-- WhatsApp Floating Widget (AS Plugin) -->
  <a href="https://wa.me/${cleanNum}?text=${msg}" target="_blank" rel="noopener noreferrer" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; width: 56px; height: 56px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.45); text-decoration: none;" title="Chat with us on WhatsApp">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
  </a>\n`;
    }

    // 2. Cookie Consent Banner
    if (plugins.cookie && plugins.cookie.enabled) {
      const text = escapeHtml(plugins.cookie.text || 'We use cookies to improve your experience.');
      const btn = escapeHtml(plugins.cookie.btnText || 'Accept');
      out += `
  <!-- Cookie Consent Banner (AS Plugin) -->
  <div id="asCookieBanner" style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(18, 19, 24, 0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 24px; z-index: 9998; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
    <p style="margin: 0; font-size: 13px; color: #d1d5db;">${text}</p>
    <button onclick="document.getElementById('asCookieBanner').style.display='none'" style="background: #0a84ff; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">${btn}</button>
  </div>\n`;
    }

    // 3. Dark/Light Theme Switcher
    if (plugins.themeToggle && plugins.themeToggle.enabled) {
      out += `
  <!-- Theme Switcher (AS Plugin) -->
  <button id="asThemeBtn" onclick="document.body.classList.toggle('as-light-mode')" style="position: fixed; bottom: 24px; left: 24px; z-index: 9999; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">
    <span>Theme Mode</span>
  </button>
  <style>
    body.as-light-mode { background-color: #f8fafc !important; color: #0f172a !important; }
    body.as-light-mode .page-container * { color: inherit; }
  </style>\n`;
    }

    // 4. Custom Body Scripts
    if (plugins.customScript && plugins.customScript.enabled && plugins.customScript.body) {
      out += `  ${plugins.customScript.body}\n`;
    }

    // 5. Announcement Top Bar
    if (plugins.announcement && plugins.announcement.enabled) {
      const ann = plugins.announcement;
      const msg = escapeHtml(ann.text || 'Special Announcement');
      const bg = ann.bg || '#2563eb';
      const tc = ann.textColor || '#ffffff';
      const linkHtml = ann.link ? `<a href="${escapeHtml(ann.link)}" style="background: rgba(255,255,255,0.2); color: inherit; padding: 3px 12px; border-radius: 4px; text-decoration: none; font-size: 11px; margin-left: 8px;">${escapeHtml(ann.linkText || 'Learn More')}</a>` : '';
      out += `
  <!-- Announcement Top Bar (AS Plugin) -->
  <div id="asAnnouncementBar" style="background: ${bg}; color: ${tc}; padding: 10px 20px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; position: sticky; top: 0; z-index: 9997;">
    <span>${msg}</span>${linkHtml}
    <button onclick="document.getElementById('asAnnouncementBar').style.display='none'" style="margin-left: 14px; background: transparent; border: none; color: inherit; font-size: 16px; cursor: pointer; line-height: 1;">&times;</button>
  </div>\n`;
    }

    // 6. Back-to-Top Button
    if (plugins.backToTop && plugins.backToTop.enabled) {
      const posStyle = plugins.backToTop.position === 'left' ? 'left: 24px;' : 'right: 24px;';
      const isPill = plugins.backToTop.style !== 'circle';
      out += `
  <!-- Back-to-Top Button (AS Plugin) -->
  <button id="asBackToTop" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" style="display: none; position: fixed; bottom: 24px; ${posStyle} z-index: 9996; background: #0a84ff; color: #fff; border: none; padding: ${isPill ? '8px 18px' : '12px'}; border-radius: ${isPill ? '999px' : '50%'}; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px rgba(10, 132, 255, 0.45); align-items: center; gap: 6px;">
    <span>Top &uarr;</span>
  </button>
  <script>
    window.addEventListener('scroll', function() {
      var btn = document.getElementById('asBackToTop');
      if (btn) btn.style.display = window.scrollY > 280 ? 'flex' : 'none';
    });
  </script>\n`;
    }

    // 7. Background Audio Player
    if (plugins.audio && plugins.audio.enabled && plugins.audio.url) {
      const aud = plugins.audio;
      out += `
  <!-- Background Audio Player (AS Plugin) -->
  <div id="asAudioWidget" style="position: fixed; bottom: 24px; left: 24px; z-index: 9995; background: rgba(18, 19, 24, 0.9); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 999px; padding: 6px 16px 6px 10px; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
    <audio id="asAudioTrack" src="${escapeHtml(aud.url)}" ${aud.autoplay ? 'autoplay muted' : ''} loop></audio>
    <button id="asAudioToggleBtn" onclick="var a=document.getElementById('asAudioTrack'); if(a.paused){a.play();this.textContent='Pause';}else{a.pause();this.textContent='Play';}" style="background: #0a84ff; color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 10px; font-weight: 700;">Play</button>
    <span style="font-size: 12px; color: #e2e8f0; font-weight: 500;">${escapeHtml(aud.title || 'Audio')}</span>
  </div>\n`;
    }

    // 8. Animated Particle Background
    if (plugins.particle && plugins.particle.enabled) {
      const part = plugins.particle;
      out += `
  <!-- Animated Particle Canvas (AS Plugin) -->
  <canvas id="asParticleCanvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 0;"></canvas>
  <script>
    (function(){
      var cv = document.getElementById('asParticleCanvas');
      if(!cv) return;
      var ctx = cv.getContext('2d');
      var w, h;
      function resize(){ w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; }
      window.addEventListener('resize', resize);
      resize();
      var pts = [];
      var count = ${part.density || 70};
      for(var i=0; i<count; i++) pts.push({x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*0.8, vy: (Math.random()-0.5)*0.8});
      function frame(){
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '${part.color || '#60a5fa'}';
        for(var i=0; i<pts.length; i++){
          var p = pts[i];
          p.x += p.vx; p.y += p.vy;
          if(p.x<0) p.x=w; if(p.x>w) p.x=0;
          if(p.y<0) p.y=h; if(p.y>h) p.y=0;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
          for(var j=i+1; j<pts.length; j++){
            var p2 = pts[j];
            var d = Math.hypot(p.x-p2.x, p.y-p2.y);
            if(d < 100){
              ctx.strokeStyle = '${part.color || '#60a5fa'}';
              ctx.globalAlpha = (1 - d/100) * 0.25;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
        requestAnimationFrame(frame);
      }
      frame();
    })();
  </script>\n`;
    }

    // 9. Live Social Proof Visitor Counter
    if (plugins.visitorProof && plugins.visitorProof.enabled) {
      const vis = plugins.visitorProof;
      out += `
  <!-- Live Social Proof Counter (AS Plugin) -->
  <div id="asVisitorBadge" style="position: fixed; bottom: 24px; left: 24px; z-index: 9994; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); padding: 8px 14px; border-radius: 999px; font-size: 12px; color: #fff; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 18px rgba(0,0,0,0.4);">
    <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
    <span><strong id="asVisitorCountVal">${vis.min || 24}</strong> ${escapeHtml(vis.text || 'people browsing right now')}</span>
  </div>
  <script>
    setInterval(function(){
      var el = document.getElementById('asVisitorCountVal');
      if(el){
        var min = ${vis.min || 18}, max = ${vis.max || 48};
        el.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }, 6000);
  </script>\n`;
    }

    // 10. Newsletter Lead Capture Modal
    if (plugins.newsletter && plugins.newsletter.enabled) {
      const news = plugins.newsletter;
      out += `
  <!-- Newsletter Lead Capture Modal (AS Plugin) -->
  <div id="asNewsletterModal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 20px;">
    <div style="background: #12141f; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 32px 28px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
      <h3 style="color: #fff; font-size: 20px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(news.title || 'Subscribe')}</h3>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">${escapeHtml(news.desc || 'Stay up to date with our newsletter.')}</p>
      <form onsubmit="event.preventDefault(); document.getElementById('asNewsletterModal').style.display='none'; alert('Thank you for subscribing!');" style="display: flex; flex-direction: column; gap: 10px;">
        <input type="email" placeholder="Enter your email address..." required style="padding: 12px 14px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
        <button type="submit" style="background: #0a84ff; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Subscribe</button>
      </form>
      <button onclick="document.getElementById('asNewsletterModal').style.display='none'" style="margin-top: 14px; background: transparent; border: none; color: #64748b; font-size: 12px; cursor: pointer;">No thanks, close window</button>
    </div>
  </div>
  <script>
    setTimeout(function(){
      var modal = document.getElementById('asNewsletterModal');
      if(modal) modal.style.display = 'flex';
    }, ${(news.delay || 4) * 1000});
  </script>\n`;
    }

    // 11. Glowing Neon Cursor Follower
    if (plugins.neonCursor && plugins.neonCursor.enabled) {
      const neon = plugins.neonCursor;
      out += `
  <!-- Neon Cursor Follower (AS Plugin) -->
  <div id="asNeonCursor" style="position: fixed; pointer-events: none; width: 16px; height: 16px; border-radius: 50%; background: ${neon.color || '#00f0ff'}; box-shadow: 0 0 16px ${neon.color || '#00f0ff'}; transform: translate(-50%, -50%); transition: transform 0.08s ease-out; z-index: 10001;"></div>
  <script>
    window.addEventListener('mousemove', function(e){
      var cur = document.getElementById('asNeonCursor');
      if(cur){ cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }
    });
  </script>\n`;
    }

    return out;
  }

  function generateBundledCss(defaultBg = '#0a0a0c') {
    return `/* Universal Clean Reset & Responsive Base
   Generated by AS Web Editor Studio
*/
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #ffffff;
  background-color: ${defaultBg};
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

img, video, iframe {
  max-width: 100%;
  height: auto;
}

button, a {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

button:hover, a:hover {
  opacity: 0.92;
}

button:active, a:active {
  transform: scale(0.98);
}
`;
  }

  // =========================================================================
  // Starter Content Templates
  // =========================================================================
  function getDefaultHomeContent() {
    return `
      <header class="we-node" data-we-type="section" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin-bottom: 40px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; border-radius: 6px; background: #0a84ff; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">AS</div>
          <span style="font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px;">Intelligence</span>
        </div>
        <nav style="display: flex; gap: 20px; align-items: center;">
          <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #0a84ff; text-decoration: none; font-size: 13px; font-weight: 600;">Home</a>
          <a href="about.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="color: #9ca3af; text-decoration: none; font-size: 13px; font-weight: 500;">About</a>
        </nav>
        <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: #0a84ff; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Connect</button>
      </header>

      <div class="we-node" data-we-type="section" style="text-align: center; padding: 60px 20px; background: linear-gradient(180deg, rgba(18, 19, 24, 0.9) 0%, rgba(10, 10, 12, 1) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; margin-bottom: 40px;">
        <span class="we-node" data-we-type="badge" style="display: inline-block; padding: 5px 14px; background: rgba(10, 132, 255, 0.15); border: 1px solid rgba(10, 132, 255, 0.3); color: #0a84ff; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px;">Visual Web Studio</span>
        <h1 class="we-node" data-we-type="heading" style="font-size: 46px; font-weight: 800; color: #fff; line-height: 1.15; margin: 0 auto 16px; max-width: 800px; letter-spacing: -0.5px;">Design Without Limits</h1>
        <p class="we-node" data-we-type="paragraph" style="font-size: 18px; color: #9ca3af; line-height: 1.6; margin: 0 auto 30px; max-width: 620px;">Adjust elements, colors, shapes, attach direct media links, and connect multiple pages together with zero code.</p>
        <div style="display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap;">
          <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="background: #0a84ff; color: #fff; border: none; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 18px rgba(10, 132, 255, 0.4);">Explore About Page</button>
          <button class="we-node" data-we-type="button" data-we-link-type="url" data-we-target-url="https://github.com" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer;">External Docs</button>
        </div>
      </div>

      <div class="we-node" data-we-type="section" style="margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" alt="Hero Showcase Image" style="width: 100%; height: 380px; object-fit: cover; border-radius: 16px; display: block; border: 1px solid rgba(255, 255, 255, 0.1);">
      </div>

      <footer class="we-node" data-we-type="section" style="padding: 30px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; color: #6b7280; font-size: 12px;">
        Created with AS Web Editor. All rights reserved.
      </footer>
    `;
  }

  function getDefaultAboutContent() {
    return `
      <header class="we-node" data-we-type="section" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin-bottom: 40px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; border-radius: 6px; background: #0a84ff; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">AS</div>
          <span style="font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px;">Intelligence</span>
        </div>
        <nav style="display: flex; gap: 20px; align-items: center;">
          <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #9ca3af; text-decoration: none; font-size: 13px; font-weight: 500;">Home</a>
          <a href="about.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="about" style="color: #0a84ff; text-decoration: none; font-size: 13px; font-weight: 600;">About</a>
        </nav>
        <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;">Back to Home</button>
      </header>

      <div class="we-node" data-we-type="section" style="padding: 40px 0; margin-bottom: 40px;">
        <h1 class="we-node" data-we-type="heading" style="font-size: 40px; font-weight: 800; color: #fff; margin-bottom: 16px;">About Our Platform</h1>
        <p class="we-node" data-we-type="paragraph" style="font-size: 18px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px;">We empower engineers and creators to visually construct rich digital experiences and export them as production-ready static assets.</p>
        <div style="background: #14161f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 28px; margin-bottom: 24px;">
          <h3 style="font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 10px;">Our Vision</h3>
          <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin: 0;">Unifying no-code ease with code-level freedom. Every element on this page was connected via visual inspectors and direct button routing.</p>
        </div>
        <button class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="background: #0a84ff; color: #fff; border: none; padding: 12px 26px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Return to Home Page</button>
      </div>

      <footer class="we-node" data-we-type="section" style="padding: 30px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; color: #6b7280; font-size: 12px;">
        Created with AS Web Editor. All rights reserved.
      </footer>
    `;
  }

  function getStandardPageStarter(name) {
    return `
      <header class="we-node" data-we-type="section" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin-bottom: 40px;">
        <span style="font-size: 16px; font-weight: 700; color: #fff;">${name}</span>
        <nav style="display: flex; gap: 20px; align-items: center;">
          <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #9ca3af; text-decoration: none; font-size: 13px;">Home</a>
        </nav>
      </header>

      <div class="we-node" data-we-type="section" style="padding: 50px 0; margin-bottom: 40px;">
        <h1 class="we-node" data-we-type="heading" style="font-size: 38px; font-weight: 700; color: #fff; margin-bottom: 16px;">${name}</h1>
        <p class="we-node" data-we-type="paragraph" style="font-size: 16px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px;">Start adding content to this page using the element cards or pre-built sections in the left sidebar.</p>
      </div>

      <footer class="we-node" data-we-type="section" style="padding: 30px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; color: #6b7280; font-size: 12px;">
        Created with AS Web Editor.
      </footer>
    `;
  }

  function getContactPageStarter() {
    return `
      <header class="we-node" data-we-type="section" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(18, 19, 24, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin-bottom: 40px;">
        <span style="font-size: 16px; font-weight: 700; color: #fff;">Contact</span>
        <a href="index.html" class="we-node" data-we-type="button" data-we-link-type="page" data-we-target-page="index" style="color: #0a84ff; text-decoration: none; font-size: 13px;">Home</a>
      </header>
      <div class="we-node" data-we-type="section" style="padding: 40px 20px; background: #121318; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; max-width: 600px; margin: 0 auto 40px;">
        <h2 style="font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 8px; text-align: center;">Send Us a Message</h2>
        <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px; text-align: center;">We will respond within 24 hours.</p>
        <form action="${project.plugins && project.plugins.form && project.plugins.form.enabled ? (project.plugins.form.endpoint || '#') : '#'}" method="POST" style="display: flex; flex-direction: column; gap: 14px;">
          <input type="text" name="name" placeholder="Full Name" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
          <input type="email" name="email" placeholder="Email Address" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
          <textarea name="message" placeholder="Message..." rows="4" required style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none; resize: vertical;"></textarea>
          <button class="we-node" data-we-type="button" data-we-link-type="none" type="submit" style="background: #0a84ff; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Submit Request</button>
        </form>
      </div>
    `;
  }

  // =========================================================================
  // Modal Helpers & Utilities
  // =========================================================================
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    return '#' + ((1 << 24) + (parseInt(match[0]) << 16) + (parseInt(match[1]) << 8) + parseInt(match[2])).toString(16).slice(1);
  }

  function convertVideoUrlToEmbed(url) {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${vidId}`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${vidId}`;
    }
    return url;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function indentHtml(html, spaces) {
    const pad = ' '.repeat(spaces);
    return html.split('\n').map(line => pad + line).join('\n');
  }

  function formatHtmlString(html) {
    return html
      .replace(/>\s*</g, '>\n<')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n');
  }

  // Initialize once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
