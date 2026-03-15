// ===== Interactive Periodic Table — Main Application =====
(function () {
  'use strict';

  // DOM references
  const tableEl = document.getElementById('periodic-table');
  const lanthanideRow = document.getElementById('lanthanide-row');
  const actinideRow = document.getElementById('actinide-row');
  const detailPanel = document.getElementById('detail-panel');
  const overlay = document.getElementById('overlay');
  const panelClose = document.getElementById('panel-close');
  const searchInput = document.getElementById('search-input');
  const tempSlider = document.getElementById('temp-slider');
  const tempValue = document.getElementById('temp-value');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let activeCategory = 'all';
  let searchQuery = '';
  let currentTemp = 298;

  // ===== RENDERING =====

  function createElementCell(el) {
    const cell = document.createElement('div');
    cell.className = 'element-cell';
    cell.id = `element-${el.number}`;
    cell.dataset.category = el.category;
    cell.dataset.number = el.number;

    // State dot
    const stateDot = document.createElement('span');
    stateDot.className = 'state-dot';
    updateStateDot(stateDot, el, currentTemp);

    const numSpan = document.createElement('span');
    numSpan.className = 'el-number';
    numSpan.textContent = el.number;

    const symSpan = document.createElement('span');
    symSpan.className = 'el-symbol';
    symSpan.textContent = el.symbol;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'el-name';
    nameSpan.textContent = el.name;

    const massSpan = document.createElement('span');
    massSpan.className = 'el-mass';
    massSpan.textContent = el.mass;

    cell.appendChild(stateDot);
    cell.appendChild(numSpan);
    cell.appendChild(symSpan);
    cell.appendChild(nameSpan);
    cell.appendChild(massSpan);

    // Staggered animation
    cell.style.animationDelay = `${el.number * 8}ms`;

    cell.addEventListener('click', () => openPanel(el));

    return cell;
  }

  function renderTable() {
    // Main grid elements (not lanthanides/actinides)
    const mainElements = ELEMENTS.filter(el => el.gridCol !== undefined);
    // Create placeholders for the full 7x18 grid
    // We use CSS grid placement
    mainElements.forEach(el => {
      const cell = createElementCell(el);
      cell.style.gridColumn = el.gridCol;
      cell.style.gridRow = el.gridRow;
      tableEl.appendChild(cell);
    });

    // Add placeholder markers for lanthanide/actinide series in main grid
    const lanPlaceholder = document.createElement('div');
    lanPlaceholder.className = 'element-cell series-placeholder';
    lanPlaceholder.style.gridColumn = 3;
    lanPlaceholder.style.gridRow = 6;
    lanPlaceholder.innerHTML = '<span class="el-symbol" style="font-size:0.65rem;color:var(--color-lanthanide)">57-71</span><span class="el-name">Lan</span>';
    lanPlaceholder.style.cursor = 'default';
    lanPlaceholder.dataset.category = 'lanthanide';
    tableEl.appendChild(lanPlaceholder);

    const actPlaceholder = document.createElement('div');
    actPlaceholder.className = 'element-cell series-placeholder';
    actPlaceholder.style.gridColumn = 3;
    actPlaceholder.style.gridRow = 7;
    actPlaceholder.innerHTML = '<span class="el-symbol" style="font-size:0.65rem;color:var(--color-actinide)">89-103</span><span class="el-name">Act</span>';
    actPlaceholder.style.cursor = 'default';
    actPlaceholder.dataset.category = 'actinide';
    tableEl.appendChild(actPlaceholder);

    // Lanthanide row (57-71)
    const lanthanides = ELEMENTS.filter(el => el.number >= 57 && el.number <= 71);
    lanthanides.forEach(el => {
      lanthanideRow.appendChild(createElementCell(el));
    });

    // Actinide row (89-103)
    const actinides = ELEMENTS.filter(el => el.number >= 89 && el.number <= 103);
    actinides.forEach(el => {
      actinideRow.appendChild(createElementCell(el));
    });
  }

  // ===== STATE (solid/liquid/gas) =====

  function getState(el, tempK) {
    if (el.meltingPoint === null && el.boilingPoint === null) return 'unknown';
    if (el.meltingPoint !== null && tempK < el.meltingPoint) return 'solid';
    if (el.boilingPoint !== null && tempK > el.boilingPoint) return 'gas';
    if (el.meltingPoint !== null && el.boilingPoint !== null) return 'liquid';
    return 'unknown';
  }

  function updateStateDot(dot, el, tempK) {
    const state = getState(el, tempK);
    const colors = {
      solid: 'var(--color-solid)',
      liquid: 'var(--color-liquid)',
      gas: 'var(--color-gas)',
      unknown: 'var(--color-unknown-state)'
    };
    dot.style.background = colors[state] || colors.unknown;
    dot.title = state.charAt(0).toUpperCase() + state.slice(1) + ` at ${tempK} K`;
  }

  function updateAllStates(tempK) {
    ELEMENTS.forEach(el => {
      const cell = document.getElementById(`element-${el.number}`);
      if (cell) {
        const dot = cell.querySelector('.state-dot');
        if (dot) updateStateDot(dot, el, tempK);
      }
    });
  }

  // ===== DETAIL PANEL =====

  function openPanel(el) {
    const color = CATEGORY_COLORS[el.category] || '#60a5fa';

    document.getElementById('panel-number').textContent = el.number;

    const panelSymbol = document.getElementById('panel-symbol');
    panelSymbol.textContent = el.symbol;
    panelSymbol.style.background = `linear-gradient(135deg, ${color}, ${color}aa)`;
    panelSymbol.style.webkitBackgroundClip = 'text';
    panelSymbol.style.webkitTextFillColor = 'transparent';
    panelSymbol.style.backgroundClip = 'text';

    document.getElementById('panel-name').textContent = el.name;
    document.getElementById('panel-mass').textContent = `${el.mass} u`;
    document.getElementById('panel-description').textContent = el.description;
    document.getElementById('panel-config-text').textContent = el.electronConfig;

    // Category badge
    const badge = document.getElementById('panel-category-badge');
    const catName = CATEGORY_NAMES[el.category] || el.category;
    badge.innerHTML = `<span style="background:${color}22;color:${color};border:1px solid ${color}44">${catName}</span>`;

    // Properties grid
    const propsGrid = document.getElementById('panel-props-grid');
    const state = getState(el, currentTemp);
    const props = [
      { label: 'Block', value: el.block.toUpperCase() },
      { label: 'Group', value: el.group || '—' },
      { label: 'Period', value: el.period },
      { label: 'State', value: state.charAt(0).toUpperCase() + state.slice(1) },
      { label: 'Density', value: el.density ? `${el.density} g/cm³` : '—' },
      { label: 'Melting Point', value: el.meltingPoint ? `${el.meltingPoint} K` : '—' },
      { label: 'Boiling Point', value: el.boilingPoint ? `${el.boilingPoint} K` : '—' },
      { label: 'Year Discovered', value: el.yearDiscovered || 'Ancient' }
    ];

    propsGrid.innerHTML = props.map(p => `
      <div class="prop-card">
        <div class="prop-label">${p.label}</div>
        <div class="prop-value">${p.value}</div>
      </div>
    `).join('');

    // Discovery
    const discoveryText = document.getElementById('panel-discovery-text');
    discoveryText.textContent = el.discoveredBy
      ? `Discovered by ${el.discoveredBy}${el.yearDiscovered ? ` in ${el.yearDiscovered}` : ''}.`
      : 'Known since antiquity.';

    // Show panel
    detailPanel.classList.remove('panel-hidden');
    detailPanel.classList.add('panel-visible');
    overlay.classList.remove('overlay-hidden');
    overlay.classList.add('overlay-visible');
  }

  function closePanel() {
    detailPanel.classList.remove('panel-visible');
    detailPanel.classList.add('panel-hidden');
    overlay.classList.remove('overlay-visible');
    overlay.classList.add('overlay-hidden');
  }

  // ===== SEARCH =====

  function applyFilters() {
    const allCells = document.querySelectorAll('.element-cell');
    const query = searchQuery.toLowerCase().trim();

    allCells.forEach(cell => {
      if (cell.classList.contains('series-placeholder')) {
        // Handle placeholder cells
        const cat = cell.dataset.category;
        const dimByCategory = activeCategory !== 'all' && activeCategory !== cat;
        cell.classList.toggle('dimmed', dimByCategory);
        return;
      }

      const num = parseInt(cell.dataset.number);
      const el = ELEMENTS.find(e => e.number === num);
      if (!el) return;

      let matchesSearch = true;
      let matchesCategory = true;

      // Search filter
      if (query) {
        matchesSearch =
          el.name.toLowerCase().includes(query) ||
          el.symbol.toLowerCase().includes(query) ||
          el.number.toString() === query;
      }

      // Category filter
      if (activeCategory !== 'all') {
        matchesCategory = el.category === activeCategory;
      }

      const visible = matchesSearch && matchesCategory;
      cell.classList.toggle('dimmed', !visible);
      cell.classList.toggle('search-match', query && matchesSearch && matchesCategory);
    });
  }

  // ===== EVENT LISTENERS =====

  // Panel close
  panelClose.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });

  // Category filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });

  // Temperature slider
  tempSlider.addEventListener('input', (e) => {
    currentTemp = parseInt(e.target.value);
    tempValue.textContent = `${currentTemp} K`;
    updateAllStates(currentTemp);
  });

  // ===== INIT =====
  renderTable();

})();
