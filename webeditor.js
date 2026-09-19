/**
 * AS Web Editor • Visual Website Builder Engine
 * Desktop-First Precision Studio
 * Multi-Page Project Architecture, Direct Media Links, Component Presets & ZIP Exporter
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
    }
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
  const pageSelectDropdown = document.getElementById('pageSelectDropdown');
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

  // =========================================================================
  // Initialization & Storage
  // =========================================================================
  function init() {
    loadProjectFromStorage();
    setupGatekeeper();
    setupEventListeners();
    setupKeyboardShortcuts();
    renderPageDropdown();
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
          if (projectNameInput) projectNameInput.value = project.name || 'My Website';
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load saved project from localStorage:', e);
    }
    // Default starter template if empty
    project.pages.index.html = getDefaultHomeContent();
    project.pages.about.html = getDefaultAboutContent();
  }

  function saveProjectToStorage() {
    try {
      // Sync active page content before saving
      if (canvas && project.pages[project.activePageId]) {
        project.pages[project.activePageId].html = canvas.innerHTML;
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
    // If we're not at top of stack, drop future states
    if (historyIndex < historyStack.length - 1) {
      historyStack.splice(historyIndex + 1);
    }
    // Deep clone project state
    const snapshot = JSON.parse(JSON.stringify(project));
    snapshot.activeCanvasHtml = canvas.innerHTML;
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
    renderPageDropdown();
    loadPage(project.activePageId, false);
    deselectElement();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
  }

  // =========================================================================
  // Multi-Page Management
  // =========================================================================
  function renderPageDropdown() {
    if (!pageSelectDropdown) return;
    pageSelectDropdown.innerHTML = '';
    const pageKeys = Object.keys(project.pages);
    pageKeys.forEach(pageId => {
      const page = project.pages[pageId];
      const opt = document.createElement('option');
      opt.value = page.id;
      opt.textContent = `${page.name} (${page.slug}.html)`;
      if (page.id === project.activePageId) opt.selected = true;
      pageSelectDropdown.appendChild(opt);
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
      project.pages[project.activePageId].html = canvas.innerHTML;
    }
    project.activePageId = pageId;
    loadPage(pageId);
    renderPageDropdown();
    recordHistory(`Switch to ${project.pages[pageId].name}`);
  }

  function loadPage(pageId, shouldSaveCurrent = true) {
    const page = project.pages[pageId];
    if (!page) return;
    canvas.setAttribute('data-page-id', page.id);
    canvas.style.backgroundColor = page.bgColor || '#0a0a0c';
    canvas.innerHTML = page.html || '';

    // Re-bind click listeners to canvas nodes
    bindCanvasNodeListeners();
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

  function deleteCurrentPage() {
    const pageKeys = Object.keys(project.pages);
    if (pageKeys.length <= 1) {
      alert('You cannot delete the only remaining page in the project.');
      return;
    }
    const currentId = project.activePageId;
    if (confirm(`Are you sure you want to delete the page "${project.pages[currentId].name}"?`)) {
      delete project.pages[currentId];
      const nextId = Object.keys(project.pages)[0];
      project.activePageId = nextId;
      loadPage(nextId);
      renderPageDropdown();
      closeModal('pageSettingsModal');
      recordHistory('Delete Page');
    }
  }

  // =========================================================================
  // Canvas Node Manipulation & Selection
  // =========================================================================
  function bindCanvasNodeListeners() {
    const nodes = canvas.querySelectorAll('.we-node');
    nodes.forEach(node => {
      // Ensure unique ID
      if (!node.getAttribute('data-we-id')) {
        node.setAttribute('data-we-id', 'node-' + Math.random().toString(36).substr(2, 9));
      }
      node.removeEventListener('click', handleNodeClick);
      node.addEventListener('click', handleNodeClick);

      // Inline text editing double click
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
  // Property Inspector Binding (Two-Way Synchronization)
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
    const isMedia = type === 'image' || type === 'video' || el.tagName === 'IMG' || el.tagName === 'IFRAME';
    sectionMedia.style.display = isMedia ? 'block' : 'none';
    if (isMedia) {
      if (type === 'image' || el.tagName === 'IMG') {
        propMediaUrl.value = el.getAttribute('src') || '';
        propMediaAlt.value = el.getAttribute('alt') || '';
        propMediaFit.value = comp.objectFit || 'cover';
        propMediaRatio.value = el.style.aspectRatio || 'auto';
      } else if (type === 'video') {
        propMediaUrl.value = el.getAttribute('data-we-video-src') || el.getAttribute('src') || '';
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

      // Text align
      const align = comp.textAlign || 'left';
      document.querySelectorAll('#propTextAlignGroup .we-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-align') === align);
      });
    }

    // Section 4: Colors & Background
    const bg = el.style.background || comp.backgroundColor;
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
  // Inspector Input Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Canvas click -> deselect if clicking canvas directly
    canvas.addEventListener('click', (e) => {
      if (e.target === canvas) {
        deselectElement();
      }
    });

    // Project Name Rename
    projectNameInput.addEventListener('input', (e) => {
      project.name = e.target.value;
      saveProjectToStorage();
    });

    // Page Switcher Dropdown
    pageSelectDropdown.addEventListener('change', (e) => {
      switchPage(e.target.value);
    });

    // Add Page Button
    document.getElementById('addPageBtn').addEventListener('click', () => {
      openModal('newPageModal');
    });

    // Page Settings Button
    document.getElementById('pageSettingsBtn').addEventListener('click', () => {
      openPageSettingsModal();
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

    // Basic Elements Drag and Click to insert
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

    // Contextual Floating Toolbar Actions
    document.getElementById('toolMoveUp').addEventListener('click', () => moveElement(-1));
    document.getElementById('toolMoveDown').addEventListener('click', () => moveElement(1));
    document.getElementById('toolDuplicate').addEventListener('click', duplicateElement);
    document.getElementById('toolDelete').addEventListener('click', deleteElement);

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

    // Inspector Events: Media
    propMediaUrl.addEventListener('input', (e) => {
      if (!selectedElement) return;
      const url = e.target.value;
      if (selectedElement.tagName === 'IMG') {
        selectedElement.src = url;
      } else if (selectedElement.tagName === 'IFRAME') {
        selectedElement.src = convertVideoUrlToEmbed(url);
        selectedElement.setAttribute('data-we-video-src', url);
      }
      recordHistory('Update Media URL');
    });

    propMediaAlt.addEventListener('input', (e) => {
      if (!selectedElement) return;
      selectedElement.setAttribute('alt', e.target.value);
      recordHistory('Update Media Alt');
    });

    propMediaFit.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.objectFit = e.target.value;
      recordHistory('Update Object Fit');
    });

    propMediaRatio.addEventListener('change', (e) => {
      if (!selectedElement) return;
      selectedElement.style.aspectRatio = e.target.value;
      recordHistory('Update Aspect Ratio');
    });

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

    // History Buttons Click
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // Clear Canvas Button
    document.getElementById('clearCanvasBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all elements on this page?')) {
        canvas.innerHTML = '';
        deselectElement();
        updateLayersTree();
        recordHistory('Clear Canvas');
      }
    });

    // Preview Mode Button
    document.getElementById('previewBtn').addEventListener('click', openLivePreview);

    // Code Viewer Button
    document.getElementById('viewCodeBtn').addEventListener('click', openCodeInspector);

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', () => {
      const pageCount = Object.keys(project.pages).length;
      document.getElementById('exportPageCount').textContent = `${pageCount} page${pageCount > 1 ? 's' : ''}`;
      openModal('exportModal');
    });

    // Modal Close Triggers
    document.querySelectorAll('.we-modal-close, [data-close]').forEach(btn => {
      btn.addEventListener('click', function () {
        const modalId = this.getAttribute('data-close');
        if (modalId) closeModal(modalId);
      });
    });

    // Create New Page Modal Form
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

    // Save Page Settings Modal Form
    document.getElementById('savePageSettingsBtn').addEventListener('click', () => {
      const active = project.pages[project.activePageId];
      if (!active) return;
      active.title = document.getElementById('settingPageTitle').value;
      active.desc = document.getElementById('settingPageDesc').value;
      active.bgColor = document.getElementById('settingPageBgColorPicker').value;
      canvas.style.backgroundColor = active.bgColor;
      renderPageDropdown();
      closeModal('pageSettingsModal');
      recordHistory('Update Page Settings');
    });

    document.getElementById('deletePageBtn').addEventListener('click', deleteCurrentPage);

    // Code Inspector Tabs
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
      const activePane = document.querySelector('.we-code-pane.active code');
      if (activePane) {
        navigator.clipboard.writeText(activePane.textContent);
        const copyBtn = document.getElementById('copyCodeBtn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 1500);
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
      // Ignore if user is typing in form inputs
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
  function insertElement(type) {
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
        el.innerHTML = '<p style="font-size: 16px; color: #9ca3af; line-height: 1.6; margin: 0;">This is a paragraph text block. Double-click to edit the content or customize styling in the right panel.</p>';
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
        img.style.height = 'auto';
        img.style.maxHeight = '420px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        img.style.display = 'block';
        el.appendChild(img);
        el.style.marginBottom = '20px';
        break;

      case 'video':
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
        iframe.style.width = '100%';
        iframe.style.aspectRatio = '16 / 9';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '12px';
        iframe.setAttribute('allowfullscreen', 'true');
        el.appendChild(iframe);
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

    canvas.appendChild(el);
    bindCanvasNodeListeners();
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
    selectElement(el);
    updateLayersTree();
    recordHistory(`Insert ${styleName} Button`);
  }

  function insertPreset(presetType) {
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
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <input type="text" placeholder="Your Name" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
              <input type="email" placeholder="Your Email Address" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
              <textarea placeholder="Your Message..." rows="4" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none; resize: vertical;"></textarea>
              <button class="we-node" data-we-type="button" data-we-link-type="none" style="background: #0a84ff; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Send Message</button>
            </div>
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

    canvas.appendChild(wrapper);
    bindCanvasNodeListeners();
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
      if (prev) {
        canvas.insertBefore(selectedElement, prev);
        positionFloatingToolbar(selectedElement);
        updateLayersTree();
        recordHistory('Move Element Up');
      }
    } else if (direction === 1) {
      const next = selectedElement.nextElementSibling;
      if (next) {
        canvas.insertBefore(next, selectedElement);
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
    selectElement(clone);
    updateLayersTree();
    recordHistory('Duplicate Element');
  }

  function deleteElement() {
    if (!selectedElement) return;
    const parent = selectedElement.parentNode;
    parent.removeChild(selectedElement);
    deselectElement();
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
    // Save current canvas state
    if (project.pages[project.activePageId]) {
      project.pages[project.activePageId].html = canvas.innerHTML;
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
  // Code Inspector (HTML & CSS Viewer)
  // =========================================================================
  function openCodeInspector() {
    if (project.pages[project.activePageId]) {
      project.pages[project.activePageId].html = canvas.innerHTML;
    }
    const page = project.pages[project.activePageId];
    document.getElementById('codePageName').textContent = `${page.slug}.html`;

    const htmlCode = generateFullPageHtml(page, true);
    const cssCode = generateBundledCss();

    document.getElementById('codeHtmlViewer').textContent = htmlCode;
    document.getElementById('codeCssViewer').textContent = cssCode;

    openModal('codeModal');
  }

  // =========================================================================
  // Package Exporter (ZIP & Single HTML)
  // =========================================================================
  function exportProjectZip() {
    if (!window.JSZip || !window.saveAs) {
      alert('Exporter library is loading. Please wait 2 seconds and try again.');
      return;
    }

    // Ensure all canvas changes are committed
    if (project.pages[project.activePageId]) {
      project.pages[project.activePageId].html = canvas.innerHTML;
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
      project.pages[project.activePageId].html = canvas.innerHTML;
    }
    const page = project.pages[project.activePageId];
    const fullHtml = generateFullPageHtml(page, true);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const safeSlug = page.slug || 'index';
    saveAs(blob, `${safeSlug}.html`);
  }

  // =========================================================================
  // HTML / CSS Code Generators
  // =========================================================================
  function generateFullPageHtml(page, inlineCss = false, cssFileName = 'style.css') {
    // Clean canvas HTML: convert data-we-link-type to functional hrefs and remove editor classes
    const temp = document.createElement('div');
    temp.innerHTML = page.html || '';

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
  <style>
${generateBundledCss(bg)}
  </style>
</head>
<body style="background-color: ${bg};">
  <main class="page-container">
${indentHtml(cleanContent, 4)}
  </main>
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
</head>
<body style="background-color: ${bg};">
  <main class="page-container">
${indentHtml(cleanContent, 4)}
  </main>
</body>
</html>`;
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
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <input type="text" placeholder="Full Name" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
          <input type="email" placeholder="Email Address" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none;">
          <textarea placeholder="Message..." rows="4" style="width: 100%; background: #191b22; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px; outline: none; resize: vertical;"></textarea>
          <button class="we-node" data-we-type="button" data-we-link-type="none" style="background: #0a84ff; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Submit Request</button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // Modal Helpers
  // =========================================================================
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function openPageSettingsModal() {
    const active = project.pages[project.activePageId];
    if (!active) return;
    document.getElementById('settingPageTitle').value = active.title || '';
    document.getElementById('settingPageSlug').value = active.slug || '';
    document.getElementById('settingPageDesc').value = active.desc || '';

    const hexBg = active.bgColor || '#0a0a0c';
    document.getElementById('settingPageBgColorPicker').value = hexBg;
    document.getElementById('settingPageBgColorText').value = hexBg;

    openModal('pageSettingsModal');
  }

  // =========================================================================
  // Utilities
  // =========================================================================
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

  // Initialize once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
