/** Browse complete offline faction trees with readable branches and exact prerequisite details. */
(() => {
  'use strict';
  // Layout dimensions are shared by HTML nodes, connectors and the navigation map.
  const GEOMETRY = { column: 380, width: 304, header: 64, leaf: 46, gap: 12, groupGap: 26, left: 36, top: 68 };
  // Faction colors match the existing catalog while remaining distinct on both themes.
  const COLORS = { allies: '#347bc7', soviet: '#c45345', epsilon: '#8c62b3', foehn: '#b58a35' };
  // Plain SVGs are honest type placeholders when a game object has no independent artwork.
  const GLYPHS = {
    buildings: '<path d="M4 18V5h9v13M13 10h4v8M2 18h18M7 8h3M7 11h3M7 14h3"/>',
    infantry: '<circle cx="11" cy="5" r="2.5"/><path d="M5 20v-4l3-4V9h6v3l3 4v4M8 16h6M11 9v11"/>',
    vehicles: '<path d="M3 12h16v6H3zM6 12V7h8v5M14 8h6M5 18v2h12v-2"/>',
    aircraft: '<path d="m11 2 2 7 7 4v2l-7-1-1 5h-2l-1-5-7 1v-2l7-4z"/>',
    support: '<circle cx="11" cy="11" r="7"/><path d="M11 1v5m0 10v5M1 11h5m10 0h5m-10-10 5 5-5 5"/>',
  };
  // Local UI state never changes the delivered production data.
  const state = { faction: null, nodes: new Map(), positions: new Map(), groups: [], selected: null, scale: .8, width: 1, height: 1, matches: [], matchIndex: -1, country: '', changed: false, drag: null };
  const data = window.MO_TECH_TREE;
  const atlas = document.getElementById('tech-atlas');
  if (!data || !atlas) return;
  const viewport = document.getElementById('tech-viewport');
  const world = document.getElementById('tech-world');
  const sizer = document.getElementById('tech-sizer');
  const inspector = document.getElementById('tech-inspector');
  const search = document.getElementById('tech-search');
  const country = document.getElementById('tech-country');
  const changed = document.getElementById('tech-changed');

  /** Escape every configuration-derived string inserted into HTML or SVG. */
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

  /** Render a real cameo or a clearly different, category-only fallback. */
  function artwork(node) {
    return node.icon ? `<img src="${esc(node.icon)}" alt="" draggable="false">` : `<span class="tt-glyph" title="暂无独立图标"><svg viewBox="0 0 22 22" aria-hidden="true">${GLYPHS[node.category] ?? GLYPHS.vehicles}</svg></span>`;
  }

  /** Distinguish grant, replacement and ordinary technology links for players. */
  function relationLabel(kind) {
    return { requires: '常规前置', alternative: '任选前置', override: '替代解锁', grants: '建筑授予', deploys: '部署获得', undeploys: '收起获得', upgrade: '建筑升级', auxiliary: '技能额外条件', produces: '生产设施' }[kind] ?? '关联解锁';
  }

  /** Find a primary edge only for visual organization; exact logic remains in the inspector. */
  function primaryEdge(node) {
    return state.faction.edges.find(edge => edge.source === node.primaryParent && edge.target === node.id) ?? null;
  }

  /** Find the nearest building ancestor so all unit and skill leaves stay on a real branch. */
  function anchor(node) {
    let current = node;
    const seen = new Set();
    while (current && current.category !== 'buildings' && !seen.has(current.id)) {
      seen.add(current.id);
      current = state.nodes.get(current.primaryParent);
    }
    return current?.category === 'buildings' ? current.id : state.faction.root;
  }

  /** Assign one horizontal tier per building generation and pack non-overlapping branch panels. */
  function layout() {
    const buildings = state.faction.nodes.filter(node => node.category === 'buildings');
    const groups = new Map(buildings.map(node => [node.id, { node, leaves: [], level: null, parent: null, x: 0, y: 0, height: 0 }]));
    for (const node of state.faction.nodes) if (node.category !== 'buildings') groups.get(anchor(node))?.leaves.push(node);
    for (const group of groups.values()) {
      const parent = state.nodes.get(group.node.primaryParent);
      group.parent = group.node.id === state.faction.root ? null : parent ? anchor(parent) : state.faction.root;
      if (group.parent === group.node.id || !groups.has(group.parent)) group.parent = group.node.id === state.faction.root ? null : state.faction.root;
      group.leaves.sort((a, b) => {
        // Keep production categories together and put granted skills after trained units.
        const order = { infantry: 0, vehicles: 1, aircraft: 2, support: 3 };
        return order[a.category] - order[b.category] || Number(a.tech ?? 0) - Number(b.tech ?? 0) || a.name.localeCompare(b.name, 'zh-CN');
      });
      group.height = GEOMETRY.header + (group.leaves.length ? 14 + group.leaves.length * (GEOMETRY.leaf + GEOMETRY.gap) : 0);
    }

    /** Resolve building generations with a root fallback for malformed relation cycles. */
    function level(group, seen = new Set()) {
      if (group.level !== null) return group.level;
      if (!group.parent || seen.has(group.node.id)) return group.level = 0;
      const next = new Set(seen); next.add(group.node.id);
      return group.level = level(groups.get(group.parent), next) + 1;
    }
    buildings.forEach(node => level(groups.get(node.id)));
    const maxLevel = Math.max(...[...groups.values()].map(group => group.level));
    for (let tier = 0; tier <= maxLevel; tier++) {
      const column = [...groups.values()].filter(group => group.level === tier);
      column.sort((a, b) => (groups.get(a.parent)?.y ?? 0) - (groups.get(b.parent)?.y ?? 0) || Number(a.node.tech ?? 0) - Number(b.node.tech ?? 0) || a.node.name.localeCompare(b.node.name, 'zh-CN'));
      let bottom = GEOMETRY.top;
      for (const group of column) {
        group.x = GEOMETRY.left + tier * GEOMETRY.column;
        group.y = Math.max(bottom, Math.min(groups.get(group.parent)?.y ?? GEOMETRY.top, bottom + 160));
        bottom = group.y + group.height + GEOMETRY.groupGap;
      }
    }
    state.groups = [...groups.values()];
    state.positions = new Map();
    for (const group of state.groups) {
      state.positions.set(group.node.id, { x: group.x, y: group.y, w: GEOMETRY.width, h: GEOMETRY.header, group: group.node.id });
      group.leaves.forEach((node, index) => state.positions.set(node.id, { x: group.x + 18, y: group.y + GEOMETRY.header + 14 + index * (GEOMETRY.leaf + GEOMETRY.gap), w: GEOMETRY.width - 18, h: GEOMETRY.leaf, group: group.node.id }));
    }
    state.width = GEOMETRY.left + maxLevel * GEOMETRY.column + GEOMETRY.width + 40;
    state.height = Math.max(620, ...state.groups.map(group => group.y + group.height + 100));
  }

  /** Route branch links through column gaps and leaf links through each panel's inner rail. */
  function route(source, target) {
    const a = state.positions.get(source), b = state.positions.get(target);
    if (!a || !b) return '';
    if (a.group === b.group && a.y <= b.y) {
      const rail = b.x - 10;
      return `M${a.x + 9},${a.y + a.h}V${b.y + b.h / 2}H${b.x}`.replace(`M${a.x + 9}`, `M${rail}`);
    }
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    if (x2 > x1) {
      const bend = x1 + (x2 - x1) * .52;
      return `M${x1},${y1}H${bend - 7}Q${bend},${y1} ${bend},${y1 + Math.sign(y2 - y1) * Math.min(7, Math.abs(y2 - y1) / 2)}V${y2 - Math.sign(y2 - y1) * Math.min(7, Math.abs(y2 - y1) / 2)}Q${bend},${y2} ${bend + 7},${y2}H${x2}`;
    }
    const bend = Math.min(a.x, b.x) - 17;
    return `M${a.x},${y1}H${bend}V${y2}H${x2}`;
  }

  /** Draw the readable primary tree plus exact incoming/outgoing links for the selected node. */
  function connectors() {
    const related = new Set([state.selected]);
    const focusedEdges = state.faction.edges.filter(edge => edge.source === state.selected || edge.target === state.selected);
    for (const edge of focusedEdges) { related.add(edge.source); related.add(edge.target); }
    const paths = [];
    const drawn = new Set();
    for (const node of state.faction.nodes) {
      if (node.id === state.faction.root) continue;
      const pos = state.positions.get(node.id);
      const source = node.category === 'buildings' ? state.groups.find(group => group.node.id === node.id)?.parent : pos.group;
      if (!source || source === node.id) continue;
      const edge = primaryEdge(node);
      const selected = source === state.selected || node.id === state.selected;
      const classes = ['tt-edge', node.category !== 'buildings' ? 'leaf' : '', ['override', 'alternative'].includes(edge?.kind) ? 'alternative' : '', selected ? 'selected' : ''];
      paths.push(`<path class="${classes.join(' ')}" data-source="${esc(source)}" data-target="${esc(node.id)}" d="${route(source, node.id)}"/>`);
      drawn.add(`${source}:${node.id}`);
    }
    // Additional conditions appear only on selection, keeping the full atlas free of crossing lines.
    for (const edge of focusedEdges.filter(edge => edge.target === state.selected && state.selected !== state.faction.root)) {
      const key = `${edge.source}:${edge.target}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      paths.push(`<path class="tt-edge extra selected ${['override', 'alternative'].includes(edge.kind) ? 'alternative' : ''}" data-source="${esc(edge.source)}" data-target="${esc(edge.target)}" d="${route(edge.source, edge.target)}"><title>${esc(relationLabel(edge.kind))}</title></path>`);
    }
    world.querySelector('.tt-connectors').innerHTML = paths.join('');
    for (const button of world.querySelectorAll('.tt-node')) button.classList.toggle('related', button.dataset.id !== state.selected && related.has(button.dataset.id));
  }

  /** Render all original, changed and newly added objects as individual accessible buttons. */
  function draw() {
    const stages = Math.max(...state.groups.map(group => group.level));
    let html = Array.from({ length: stages + 1 }, (_, index) => `<div class="tt-stage" style="left:${GEOMETRY.left + index * GEOMETRY.column}px"><b>${String(index).padStart(2, '0')}</b><span>${index === 0 ? '起始基地' : `科技分支 ${index}`}</span></div>`).join('');
    html += state.groups.map(group => `<div class="tt-group" style="left:${group.x - 7}px;top:${group.y - 7}px;width:${GEOMETRY.width + 14}px;height:${group.height + 14}px"></div>`).join('');
    html += `<svg class="tt-connectors" width="${state.width}" height="${state.height}" aria-hidden="true"></svg>`;
    html += state.faction.nodes.map(node => {
      const pos = state.positions.get(node.id);
      const countryNames = node.countries?.length && node.countries.length < 3 ? node.countries.map(item => item.name).join(' / ') : node.typeLabel;
      return `<button type="button" class="tt-node ${node.category === 'buildings' ? 'building' : node.category === 'support' ? 'support' : 'unit'}" data-id="${esc(node.id)}" aria-label="${esc(`${node.name}，${node.typeLabel}，查看解锁条件`)}" aria-pressed="false" style="left:${pos.x}px;top:${pos.y}px;width:${pos.w}px;height:${pos.h}px">${artwork(node)}<span class="tt-node-copy"><b>${esc(node.name)}</b><small>${esc(countryNames)}</small></span>${node.change !== 'original' ? `<i class="tt-node-dot ${esc(node.change)}" title="${node.change === 'added' ? '新增' : '已修改'}"></i>` : ''}${node.change === 'added' ? '<span class="tt-node-tag">新增</span>' : ''}</button>`;
    }).join('');
    world.innerHTML = html;
    world.style.width = `${state.width}px`;
    world.style.height = `${state.height}px`;
    const counts = { buildings: 0, units: 0, support: 0 };
    for (const node of state.faction.nodes) counts[node.category === 'buildings' ? 'buildings' : node.category === 'support' ? 'support' : 'units']++;
    document.getElementById('tech-counts').textContent = `${counts.buildings} 建筑 · ${counts.units} 单位 · ${counts.support} 支援技能`;
    document.getElementById('tech-minimap').innerHTML = `<svg viewBox="0 0 ${state.width} ${state.height}" preserveAspectRatio="none">${state.groups.map(group => `<rect class="tt-mini-group" x="${group.x}" y="${group.y}" width="${GEOMETRY.width}" height="${group.height}" rx="8"/>`).join('')}<rect class="tt-mini-window" id="tech-mini-window"/></svg>`;
    setZoom(state.scale);
  }

  /** Show AND terms, OR members and alternative full lists without inventing cumulative requirements. */
  function requirements(node) {
    const sections = [];
    if (node.role === 'root') sections.push('<div class="tt-requirement">由基地车展开，作为本阵营科技起点。</div>');
    else if (node.category === 'support') {
      const providers = [...new Set(state.faction.edges.filter(edge => edge.target === node.id && edge.kind === 'grants').map(edge => state.nodes.get(edge.source)?.name).filter(Boolean))];
      sections.push(`<div class="tt-requirement"><b>提供技能的建筑</b>${esc(providers.join(' / ') || '参见关联建筑')}</div>`);
    }
    if (node.requirements?.length) sections.push(`<div class="tt-requirement"><b>${node.requirementBranches?.length > 1 ? '以下整套条件任选一套' : '以下条件同时满足'}</b>${node.requirements.map(esc).join(node.requirementBranches?.length > 1 ? '<br>或<br>' : '<br>＋ ')}</div>`);
    if (node.override?.length) sections.push(`<div class="tt-requirement"><b>替代解锁 · 任一即可</b>${node.override.map(esc).join('<br>或 ')}</div>`);
    if (node.auxiliary?.length) sections.push(`<div class="tt-requirement"><b>额外技能条件 · 任一即可</b>${node.auxiliary.map(esc).join('<br>或 ')}</div>`);
    if (!sections.length) sections.push('<p>无额外建筑前置，取得方式见关联节点。</p>');
    return sections.join('');
  }

  /** Inspect a node, highlight its real direct dependencies and optionally navigate the canvas to it. */
  function select(id, center = false, save = true) {
    const node = state.nodes.get(id);
    if (!node) return;
    state.selected = id;
    for (const button of world.querySelectorAll('.tt-node')) {
      const selected = button.dataset.id === id;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    const outgoing = [...new Set(state.faction.edges.filter(edge => edge.source === id && edge.target !== id).map(edge => edge.target))];
    const incoming = state.faction.edges.filter(edge => edge.target === id && ['deploys', 'undeploys', 'upgrade'].includes(edge.kind));
    const links = outgoing.map(target => `<button type="button" data-locate="${esc(target)}">${esc(state.nodes.get(target)?.name ?? target)}</button>`).join('');
    const acquired = incoming.map(edge => `${relationLabel(edge.kind)}：${state.nodes.get(edge.source)?.name ?? edge.source}`).join('；');
    inspector.innerHTML = `<div class="tt-eyebrow">NODE / ${esc(node.typeLabel)}</div><div class="tt-detail-image">${artwork(node)}<div><h2>${esc(node.name)}</h2><div class="tt-detail-id">${esc(node.id)}</div></div></div><div class="tt-detail-tags"><span>${esc(node.typeLabel)}</span><span class="${node.change !== 'original' ? 'changed' : ''}">${{ original: '原版节点', added: '新增内容', modified: '已修改' }[node.change]}</span>${node.role === 'deployed' ? '<span>部署形态</span>' : ''}</div>${node.cost != null ? `<div class="tt-detail-metrics"><div><small>造价</small><strong>$ ${Number(node.cost).toLocaleString('zh-CN')}</strong></div>${node.tech != null && Number(node.tech) >= 0 ? `<div><small>科技等级</small><strong>${esc(node.tech)}</strong></div>` : ''}</div>` : ''}<h3>解锁条件</h3>${requirements(node)}${acquired ? `<p>${esc(acquired)}</p>` : ''}${node.countries?.length ? `<h3>适用子阵营</h3><p>${node.countries.map(item => esc(item.name)).join(' / ')}</p>` : ''}${outgoing.length ? `<h3>后续关联 · ${outgoing.length}</h3><div class="tt-detail-links">${links}</div>` : ''}${node.notes?.length ? `<h3>使用说明</h3>${node.notes.map(note => `<p>${esc(note)}</p>`).join('')}` : ''}${node.href ? `<a class="tt-detail-link" href="${esc(node.href)}">查看完整图鉴 <span>↗</span></a>` : '<p class="tt-detail-note">此节点用于补全科技路线；未单独收录为改动图鉴卡片。</p>'}`;
    inspector.scrollTop = 0;
    connectors();
    applyFilters();
    document.getElementById('tech-status').textContent = `已选：${node.name}`;
    if (center) locate(id);
    if (save) saveHash();
  }

  /** Update the deep link without moving the page or replacing the theme preference. */
  function saveHash() {
    try {
      const hash = new URLSearchParams({ faction: state.faction.id, node: state.selected });
      history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`);
    } catch (error) { /* Restrictive file viewers may disallow history updates. */ }
  }

  /** Center one object while preserving enough zoom for its Chinese label to remain readable. */
  function locate(id) {
    const pos = state.positions.get(id);
    if (!pos) return;
    if (state.scale < .6) setZoom(.8);
    viewport.scrollTo({ left: Math.max(0, (pos.x + pos.w / 2) * state.scale - viewport.clientWidth / 2), top: Math.max(0, (pos.y + pos.h / 2) * state.scale - viewport.clientHeight / 2) });
    updateMinimap();
  }

  /** Resize the scrollable surface while keeping an optional mouse anchor in place. */
  function setZoom(scale, point = null) {
    const previous = state.scale;
    state.scale = Math.max(.12, Math.min(1.5, scale));
    const center = point ?? { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    const x = (viewport.scrollLeft + center.x) / previous;
    const y = (viewport.scrollTop + center.y) / previous;
    world.style.transform = `scale(${state.scale})`;
    sizer.style.width = `${state.width * state.scale}px`;
    sizer.style.height = `${state.height * state.scale}px`;
    document.getElementById('tech-zoom-label').value = `${Math.round(state.scale * 100)}%`;
    viewport.scrollLeft = x * state.scale - center.x;
    viewport.scrollTop = y * state.scale - center.y;
    updateMinimap();
  }

  /** Keep the navigation window synchronized with scrolling and zoom. */
  function updateMinimap() {
    const rect = document.getElementById('tech-mini-window');
    if (!rect) return;
    rect.setAttribute('x', viewport.scrollLeft / state.scale);
    rect.setAttribute('y', viewport.scrollTop / state.scale);
    rect.setAttribute('width', Math.min(state.width, viewport.clientWidth / state.scale));
    rect.setAttribute('height', Math.min(state.height, viewport.clientHeight / state.scale));
  }

  /** Dim incompatible nodes while retaining their prerequisite context and stable map positions. */
  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    for (const button of world.querySelectorAll('.tt-node')) {
      const node = state.nodes.get(button.dataset.id);
      const countryMatch = !state.country || node.countries?.some(item => item.id === state.country);
      const changeMatch = !state.changed || node.change !== 'original';
      const searchMatch = !query || `${node.name} ${node.id} ${node.typeLabel}`.toLocaleLowerCase().includes(query);
      button.classList.toggle('dim', (!countryMatch || !changeMatch || !searchMatch) && node.id !== state.selected);
      button.classList.toggle('match', !!query && searchMatch && countryMatch);
    }
  }

  /** Find and locate text matches without hiding any branch of the technology tree. */
  function findMatches(advance = false) {
    const query = search.value.trim().toLocaleLowerCase();
    state.matches = query ? state.faction.nodes.filter(node => `${node.name} ${node.id} ${node.typeLabel}`.toLocaleLowerCase().includes(query) && (!state.country || node.countries?.some(item => item.id === state.country))) : [];
    state.matchIndex = state.matches.length ? advance ? (state.matchIndex + 1) % state.matches.length : 0 : -1;
    document.getElementById('tech-search-count').textContent = query ? state.matches.length ? `${state.matchIndex + 1} / ${state.matches.length}` : '无匹配' : '';
    document.getElementById('tech-search-next').hidden = state.matches.length < 2;
    if (state.matchIndex >= 0) select(state.matches[state.matchIndex].id, true);
    applyFilters();
  }

  /** Switch between four independent trees and reset per-faction filters. */
  function switchFaction(id, selected = null, save = true) {
    const faction = data.factions.find(item => item.id === id) ?? data.factions[0];
    state.faction = faction;
    state.nodes = new Map(faction.nodes.map(node => [node.id, node]));
    state.scale = window.innerWidth < 600 ? .72 : .85;
    state.country = '';
    search.value = '';
    state.matches = [];
    state.matchIndex = -1;
    document.getElementById('tech-search-count').textContent = '';
    document.getElementById('tech-search-next').hidden = true;
    atlas.style.setProperty('--accent', COLORS[faction.id]);
    for (const tab of document.querySelectorAll('.tt-faction')) {
      const active = tab.dataset.faction === faction.id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    document.getElementById('tech-panel').setAttribute('aria-labelledby', `tab-${faction.id}`);
    document.getElementById('tech-faction-name').textContent = faction.name;
    const countries = [...new Map(faction.nodes.flatMap(node => node.countries ?? []).map(item => [item.id, item])).values()];
    country.innerHTML = '<option value="">全部子阵营</option>' + countries.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
    layout();
    draw();
    const target = state.nodes.has(selected) ? selected : faction.root;
    select(target, false, save);
    if (selected && target !== faction.root) locate(target);
    else viewport.scrollTo({ left: 0, top: 0 });
    updateMinimap();
  }

  /** Toggle fullscreen, including file viewers that do not implement the fullscreen API. */
  async function fullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (atlas.classList.contains('expanded')) atlas.classList.remove('expanded');
    else {
      try { await atlas.requestFullscreen(); }
      catch (error) { atlas.classList.add('expanded'); }
    }
    document.getElementById('tech-fullscreen').setAttribute('aria-label', document.fullscreenElement || atlas.classList.contains('expanded') ? '退出全屏科技树' : '全屏查看科技树');
    updateMinimap();
  }

  // Events stay delegated so faction switches do not accumulate handlers.
  document.querySelector('.tt-tabs').addEventListener('click', event => {
    const tab = event.target.closest('[data-faction]');
    if (tab) switchFaction(tab.dataset.faction);
  });
  document.querySelector('.tt-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('.tt-faction')];
    const index = tabs.findIndex(tab => tab.dataset.faction === state.faction.id);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    switchFaction(tabs[next].dataset.faction);
    tabs[next].focus();
  });
  world.addEventListener('click', event => {
    const button = event.target.closest('[data-id]');
    if (button && !state.drag?.moved) select(button.dataset.id);
  });
  inspector.addEventListener('click', event => {
    const button = event.target.closest('[data-locate]');
    if (button) select(button.dataset.locate, true);
  });
  search.addEventListener('input', () => findMatches());
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); findMatches(true); }
    if (event.key === 'Escape') { search.value = ''; findMatches(); }
  });
  document.getElementById('tech-search-next').addEventListener('click', () => findMatches(true));
  country.addEventListener('change', () => { state.country = country.value; findMatches(); });
  changed.addEventListener('change', () => { state.changed = changed.checked; applyFilters(); });
  document.getElementById('tech-zoom-in').addEventListener('click', () => setZoom(state.scale * 1.2));
  document.getElementById('tech-zoom-out').addEventListener('click', () => setZoom(state.scale / 1.2));
  document.getElementById('tech-reset').addEventListener('click', () => { setZoom(.85); viewport.scrollTo(0, 0); updateMinimap(); });
  document.getElementById('tech-overview').addEventListener('click', () => { setZoom(Math.min((viewport.clientWidth - 25) / state.width, (viewport.clientHeight - 25) / state.height)); viewport.scrollTo(0, 0); updateMinimap(); });
  document.getElementById('tech-fullscreen').addEventListener('click', fullscreen);
  viewport.addEventListener('scroll', updateMinimap, { passive: true });
  viewport.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    setZoom(state.scale * Math.exp(-event.deltaY * .002), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, { passive: false });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); setZoom(state.scale * (event.key === '-' ? 1 / 1.2 : 1.2)); }
  });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('.tt-node')) return;
    state.drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', event => {
    if (!state.drag) return;
    const dx = event.clientX - state.drag.x, dy = event.clientY - state.drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) state.drag.moved = true;
    viewport.scrollLeft = state.drag.left - dx;
    viewport.scrollTop = state.drag.top - dy;
  });
  /** Release a completed drag even when the pointer leaves the map. */
  function endDrag() { state.drag = null; viewport.classList.remove('dragging'); }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  document.getElementById('tech-minimap').addEventListener('click', event => {
    const rect = event.currentTarget.getBoundingClientRect();
    viewport.scrollTo({ left: (event.clientX - rect.left) / rect.width * state.width * state.scale - viewport.clientWidth / 2, top: (event.clientY - rect.top) / rect.height * state.height * state.scale - viewport.clientHeight / 2 });
  });
  window.addEventListener('resize', updateMinimap);
  document.addEventListener('fullscreenchange', updateMinimap);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') atlas.classList.remove('expanded');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
  });
  window.addEventListener('hashchange', () => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const faction = hash.get('faction') ?? 'allies';
    if (faction !== state.faction.id) switchFaction(faction, hash.get('node'), false);
    else if (hash.has('node')) select(hash.get('node'), true, false);
  });
  const hash = new URLSearchParams(location.hash.slice(1));
  switchFaction(hash.get('faction') ?? 'allies', hash.get('node'), false);
})();
