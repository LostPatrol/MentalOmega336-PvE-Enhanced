/** Offline search, filters, and the refined player-facing card layout. */
(() => {
  'use strict';
  const DATA = window.MO_WIKI;
  const FACTIONS = {allies:'盟军',soviet:'苏军',epsilon:'厄普西隆',foehn:'焚风',neutral:'中立／未定'};
  const CHANGES = {added:'新增/解锁',attributes:'属性调整',weapons:'武器变化',shields:'护盾变化',abilities:'技能／机制',art:'美术变化',linked:'关联变化'};
  const NEW_MODE = document.body.dataset.mode === 'new' || document.body.dataset.page === 'new';
  const SPECIAL_MODE = document.body.dataset.page === 'special';
  const AI_MODE = document.body.dataset.page === 'ai';
  const BALANCE_MODE = document.body.dataset.page === 'balance';
  const SCOPE = SPECIAL_MODE ? 'special' : AI_MODE ? 'ai' : BALANCE_MODE ? 'balance' : NEW_MODE ? 'new' : 'catalog';

  const ADDED_LABEL = {infantry:'新增兵种',vehicles:'新增载具',aircraft:'新增飞机',buildings:'新增建筑',support:'新增支援技能'};
  // The default player order groups shared units after the four individual factions.
  const FACTION_ORDER = ['soviet','allies','epsilon','foehn'];
  // Reuse natural ID collation instead of constructing it for every sort comparison.
  const ID_COLLATOR = new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  // Flying vehicles and aircraft share the requested flying-unit position.
  const TYPE_ORDER = {infantry:0,'ground-vehicle':1,naval:2,'flying-vehicle':3,aircraft:3,buildings:4,defense:4,support:5};
  // Original/imported objects use this single explanation instead of change rows.
  const ORIGINAL_NOTICE = '此单位/技能为原创（不包括部分素材）或从其他版本移植';
  // Four rows fit the core comparisons; all other changes share the overflow count.
  const CARD_PREVIEW_LIMIT = 4;
  // Only these unit comparisons show a relative change in the final column.
  const PERCENT_LABELS = new Set(['造价','生命值','攻击']);
  const FACTION_PATHS = {
    allies:'<path d="M10 2.2 4 4.8v4.6c0 3.3 2.4 5.7 6 7.4 3.6-1.7 6-4.1 6-7.4V4.8z"/><path d="M10 6.2v5M7.6 8.5h4.8"/>',
    soviet:'<path d="m10 2.4 2.1 4.6 5 .5-3.8 3.4 1.1 4.9L10 13.3 5.6 15.8l1.1-4.9L2.9 7.5l5-.5z"/>',
    epsilon:'<path d="M10 4.2v6.6M5.8 6.6c0 3 1.7 4.8 4.2 4.8s4.2-1.8 4.2-4.8M6.6 17h6.8"/>',
    foehn:'<path d="M4 9h8.4a2.4 2.4 0 1 0-2.4-2.4M4 13h5.4A2.4 2.4 0 1 1 7 15.4"/>',
    neutral:'<circle cx="10" cy="10" r="6.4" stroke-dasharray="2.4 2.2"/>'
  };

  /** Escape configuration text before inserting it into a card. */
  function esc(value) { return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }

  /** Return a small inline icon without loading any remote font. */
  function icon(name) {
    const shapes = {arrow:'<path d="M4 10h12m-5-5 5 5-5 5"/>',search:'<circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/>'};
    return `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true">${shapes[name]??shapes.arrow}</svg>`;
  }

  /** Render the faction emblem used on cards, chips and detail pages. */
  function factionIcon(key) { return `<svg class="faction-icon" viewBox="0 0 20 20" aria-hidden="true">${FACTION_PATHS[key]??FACTION_PATHS.neutral}</svg>`; }

  /** Missing configuration reads as "无" for players; raw tables keep the source wording. */
  function number(value) {
    if(value===null||value===undefined||value===''||value==='未配置')return '无';
    if(/^无官方对应定义/.test(String(value)))return '未定义';
    const numeric=Number(value);
    return Number.isFinite(numeric)?numeric.toLocaleString('zh-CN'):String(value);
  }

  /** Read one explicit value from the compact object stats. */
  function stat(item,...keys) {
    for(const key of keys)if(item.stats?.[key]!==null&&item.stats?.[key]!==undefined&&item.stats?.[key]!=='')return item.stats[key];
    return null;
  }

  /** Sort by faction, unit class, and the displayed internal identity. */
  function defaultOrder(a,b) {
    const factionRank = item => item.factions?.length === 1 && FACTION_ORDER.includes(item.factions[0]) ? FACTION_ORDER.indexOf(item.factions[0]) : FACTION_ORDER.length;
    const typeRank = item => TYPE_ORDER[item.typeKey] ?? TYPE_ORDER[item.category] ?? 6;
    return factionRank(a) - factionRank(b) || typeRank(a) - typeRank(b) || ID_COLLATOR.compare(a.displayId ?? a.id,b.displayId ?? b.id);
  }

  const MISSING = new Set(['未配置','—','-','无','否','none','']);
  const MECH_LABELS = ['武器','护盾','技能','前置','部署','转换','形态','能力','光环','支援'];
  const GOOD_UP = ['生命','护盾','射程','速度','视野','伤害','连发','次数','限造'];
  const GOOD_DOWN = ['造价','建造','充能','冷却','耗电','电力','价格','资金','时间'];

  /** Split one reviewed summary sentence into a label and its before/after values. */
  function parseDelta(text) {
    const match = String(text??'').match(/^(.+?)：(.+?)\s*→\s*(.+?)。?$/);
    if(!match)return null;
    const label = match[1].trim(), before = match[2].trim(), after = match[3].replace(/。$/,'').trim();
    const numeric = /^-?[\d,]+(?:\.\d+)?$/.test(before.replace(/\s/g,'')) && /^-?[\d,]+(?:\.\d+)?$/.test(after.replace(/\s/g,''));
    let dir = 'text';
    if(MISSING.has(before) && !MISSING.has(after)) dir = 'add';
    else if(numeric) {
      const a = Number(before.replace(/,/g,'')), b = Number(after.replace(/,/g,''));
      dir = b > a ? 'up' : b < a ? 'down' : 'flat';
    }
    let diff = 0;
    if(numeric) diff = Number(after.replace(/,/g,'')) - Number(before.replace(/,/g,''));
    return {label, before: before === '未配置' ? '无' : before, after, dir, diff, numeric};
  }

  /** True when a change is a mechanic/flavour change rather than a plain number. */
  function isMechanic(delta) {
    return delta.dir === 'text' || delta.dir === 'add' || MECH_LABELS.some(word => delta.label.includes(word));
  }

  /** Pick the single change category shown on the card. */
  function classify(item, deltas) {
    const kinds = item.changeKinds ?? [];
    if(item.contextOnly) return [];
    if(item.isOriginal) return [{key:'added',label:'新增'}];
    if(kinds.includes('added')) return [];
    if(item.cardPresentation) return [
      ...(item.cardPresentation.numeric ? [{key:'num',label:'数值调整'}] : []),
      ...(item.cardPresentation.mechanic ? [{key:'mech',label:'机制调整'}] : [])
    ];
    if(item.player) return kinds.map(key => ({key:key === 'attributes' ? 'num' : key === 'art' ? 'special' : 'mech',label:CHANGES[key] ?? key})).slice(0,2);
    const tags = [];
    const numeric = deltas.some(delta => delta.numeric && !isMechanic(delta));
    const mechanic = deltas.some(isMechanic);
    if(numeric || (!deltas.length && kinds.includes('attributes'))) tags.push({key:'num',label:'数值调整'});
    if(mechanic || (!deltas.length && ['abilities','shields','weapons'].some(key => kinds.includes(key)))) tags.push({key:'mech',label:'机制调整'});
    if(!tags.length) tags.push({key:'special',label:'特殊调整'});
    return tags;
  }

  /** Judge a numeric change as a buff, a nerf or neither. */
  function score(delta) {
    const countCodes = value => String(value ?? '').split(/[,，]/).filter(Boolean).length;
    if(delta.label.includes('前置')) {
      if(delta.dir === 'add') return -1;
      const before = countCodes(delta.before), after = countCodes(delta.after);
      if(after < before) return 1;
      if(after > before) return -1;
      return 0;
    }
    if(delta.label.includes('护盾') && delta.dir === 'add') return 1;
    if(delta.label.includes('科技') && delta.numeric && ['up','down'].includes(delta.dir)) return delta.dir === 'down' ? 1 : -1;
    if(!delta.numeric || !['up','down'].includes(delta.dir)) return 0;
    const up = delta.dir === 'up';
    if(GOOD_UP.some(word => delta.label.includes(word))) return up ? 1 : -1;
    if(GOOD_DOWN.some(word => delta.label.includes(word))) return up ? -1 : 1;
    return 0;
  }

  /** Collapse the scored changes into the 增强 / 削弱 / 修正 verdict. */
  function judge(deltas) {
    let good = 0, bad = 0;
    for(const delta of deltas) { const value = score(delta); if(value > 0) good++; else if(value < 0) bad++; }
    if(good > 0 && bad === 0) return {key:'buff',label:'增强'};
    if(bad > 0 && good === 0) return {key:'nerf',label:'削弱'};
    return {key:'fix',label:'修正'};
  }

  const ARROW = '<svg class="dl-arrow" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h9m-3.4-3.4L11 7l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const TRI = dir => `<svg class="tri ${dir}" viewBox="0 0 14 14" aria-hidden="true">${dir === 'down' ? '<path d="M7 12 2 3h10z"/>' : '<path d="M7 2 12 11H2z"/>'}</svg>`;

  /** Identify prerequisite wording in both reviewed prose and generated field labels. */
  function isPrerequisite(text) { return /前置|前提|prerequisite/i.test(text); }

  /** Keep other summary clauses while moving prerequisite codes into the detail page. */
  function cardProse(text) {
    return String(text).split(/[，；。]/).filter(clause => clause.trim() && !isPrerequisite(clause)).join('，');
  }

  /** Render a short direction label from the actual official/current prerequisite comparison. */
  function prerequisiteLine(item) {
    if(item.isSpecial || item.isAI || item.isNewUnlock) return '';
    const mode = item.prerequisiteChange?.mode;
    if (!mode) return '';
    const label = { increased:'前置增加', decreased:'前置减少', adjusted:'前置调整' }[mode];
    return `<li class="dl-extra prerequisite-change prerequisite-${mode}">${label}</li>`;
  }

  /** Render one highlighted change as "before → after ▲ delta". */
  function deltaLine(delta) {
    const shieldClass = delta.shield ? ' shield' : '';
    const chip = delta.dir === 'add'
      ? `<span class="dl-tag">${delta.diff ? '+' + Math.abs(delta.diff).toLocaleString('zh-CN') : '新增'}</span>`
      : delta.diff ? `<span class="dl-delta ${delta.dir}${shieldClass}">${TRI(delta.dir)}<b>${Math.abs(delta.diff).toLocaleString('zh-CN')}</b></span>` : '';
    const baseline = Number(String(delta.before).replace(/,/g,''));
    const percent = PERCENT_LABELS.has(delta.label) && delta.numeric && baseline !== 0 && delta.diff
      ? `<span class="dl-delta dl-percent ${delta.dir}">${delta.diff > 0 ? '+' : '-'}${Math.round(Math.abs(delta.diff / baseline) * 100)}%</span>` : '';
    const displayValue = value => /^无官方对应定义/.test(String(value)) ? '未定义' : value;
    return `<li${shieldClass ? ' class="shield"' : ''}><span class="dl-label">${esc(delta.label)}</span><span class="dl-move"><b class="dl-before">${esc(displayValue(delta.before))}</b>${ARROW}<b class="dl-after${shieldClass}">${esc(displayValue(delta.after))}</b>${chip}${percent}</span></li>`;
  }

  /** Build a current-data card with faction colour, emblem and change highlights. */
  function renderCard(item) {
    const multi = (item.factions?.length ?? 0) > 1;
    const faction = multi ? 'neutral' : (item.factions?.[0] ?? 'neutral');
    const factionNames = (item.factions ?? ['neutral']).map(key => FACTIONS[key] ?? key).join(' · ');
    const factionDisplay = multi ? ((item.factions?.length ?? 0) > 2 ? '多阵营共有' : factionNames) : factionNames;
    const ai = item.isAI === true;
    const special = item.isSpecial === true;
    const globalMechanic = item.globalMechanic === true;
    const added = !special && !ai && item.isOriginal === true;
    const unlocked = !special && !ai && item.isUnlock === true;
    const deltas = (item.summary ?? []).map(parseDelta).filter(Boolean);
    const kinds = classify(item, deltas);
    const badges = ai
      ? '<span class="kind-tag kind-ai">AI专属</span>'
      : special
        ? `<span class="kind-tag kind-special-unit">${globalMechanic ? '全局机制' : '特殊'}</span>`
        : kinds.map(kind => `<span class="kind-tag kind-${kind.key}">${kind.label}</span>`).join('') + (unlocked ? '<span class="kind-tag kind-unlocked">解锁建造</span>' : '') + (added || item.contextOnly || item.player?.effectiveChanged === false || item.changeKinds?.includes('added') ? '' : `<span class="verdict verdict-${item.cardPresentation?.verdict.key ?? 'fix'}">${item.cardPresentation?.verdict.label ?? '修正'}</span>`);
    const isSupport = item.category === 'support';
    const cost = isSupport ? stat(item,'money','moneyAmount','Money.Amount','cost') : stat(item,'cost','Cost');
    const unit = (value, suffix) => value === '无' || value === '未定义' ? value : `${value}<span class="u">${suffix}</span>`;
    const shots = stat(item,'shots','SW.Shots');
    const values = isSupport ? [
      ['充能', unit(stat(item,'recharge','RechargeTime') !== null ? number(stat(item,'recharge','RechargeTime')) : '无', '分')],
      ['费用', cost !== null ? number(Math.abs(Number(cost))) : '无'],
      ['次数', shots == null || Number(shots) < 0 ? '无限' : number(shots)]
    ] : [
      ['造价', number(cost)],
      ['生命', number(stat(item,'hp','strength','Strength'))],
      ['攻击', number(item.currentWeapon?.damage ?? item.attack)],
      ['射程', (item.currentWeapon?.range ?? stat(item,'range','Range')) != null ? unit(number(item.currentWeapon?.range ?? stat(item,'range','Range')), '格') : '无']
    ];
    const rows = item.cardPresentation?.rows ?? [];
    const previewRows = rows.map(row => {
      if(row.comparison) return deltaLine({label:row.label,before:row.before,after:row.after,dir:'text',diff:0,numeric:false});
      if(!row.numeric) return `<li class="dl-extra compact-adjustment${row.tone === 'orange' ? ' weapon-type-change' : ''}">${esc(row.label)}</li>`;
      const delta = parseDelta(`${row.label}：${row.before} → ${row.after}`);
      return deltaLine({...delta,shield:row.shield === true});
    });
    const prerequisite = prerequisiteLine(item);
    if(prerequisite) previewRows.push(prerequisite);
    const notice = ai ? DATA.metadata.aiNotice : special ? (globalMechanic ? DATA.metadata.globalNotice : DATA.metadata.specialNotice) : '';
    // Campaign/special and AI variants are not player-buildable: the card keeps only the availability note.
    const preview = (ai || special)
      ? (notice ? `<li class="dl-extra special-notice">${esc(notice)}</li>` : '')
      : added ? `<li class="dl-extra original-notice">${ORIGINAL_NOTICE}</li>` : previewRows.slice(0,CARD_PREVIEW_LIMIT).join('') + (previewRows.length > CARD_PREVIEW_LIMIT ? `<li class="dl-extra remaining-changes">点击查看剩余${previewRows.length - CARD_PREVIEW_LIMIT}项调整</li>` : '');
    const tags = (item.changeKinds ?? []).filter(key => key !== 'added').slice(0, 2);
    const cardTags = (ai || special || added) ? '' : tags.map(key => `<span>${esc(CHANGES[key] ?? key)}</span>`).join('<span>·</span>') || (unlocked ? '<span>解锁建造</span>' : '<span>新增配置</span>');
return `<a class="unit-card${special ? ' is-special' : ''}${ai ? ' is-ai' : ''}" href="${esc(item.htmlPath)}" style="--faction-color:var(--${esc(faction)})" aria-label="${esc(item.name)} ${esc(item.displayId ?? item.id)}，查看改动详情"><div class="card-flags"><span class="faction-label" title="${esc(factionNames)}">${factionIcon(faction)}${esc(factionDisplay)}</span><div class="card-kinds">${badges}</div></div><div class="unit-identity"><div class="cameo-frame"><img src="${esc(item.icon)}" alt="${esc(item.name)}图标" width="80" height="64" loading="lazy"></div><div class="unit-title"><h3>${esc(item.name)}</h3><div class="unit-id">${item.replaces ? `${esc(item.replaces)} → ` : ''}${esc(item.displayId ?? item.id)}</div><div class="unit-type">${esc(item.typeLabel)}${ai ? ' · AI专属变种' : special ? (globalMechanic ? ' · 全局机制' : ' · 战役/特殊单位') : added ? ' · 新增' : unlocked ? ' · 解锁建造' : ''}</div></div></div><ul class="delta-preview${preview ? '' : ' is-empty'}">${preview}</ul><div class="card-stats">${values.map(([label,value]) => `<div><span>${esc(label)}</span><b>${value}</b></div>`).join('')}</div><div class="card-bottom"><div class="card-tags">${cardTags}</div>${icon('arrow')}</div></a>`;
  }

  /** Keep exactly one sidebar entry selected for the current page scope. */
  function syncNav(type) {
    if(SPECIAL_MODE || AI_MODE) return;
    const links = [...document.querySelectorAll(`.sidebar [data-nav="${SCOPE}"]`)];
    for(const link of links) link.classList.remove('active');
    if(NEW_MODE && !type) { document.querySelector('.sidebar [data-new-home]')?.classList.add('active'); return; }
    for(const link of links) if((link.dataset.filterType ?? '') === type) link.classList.add('active');
  }

  /** Open a collapsed section when a table-of-contents link points inside it. */
  function openHashTarget() {
    const hash = location.hash.slice(1);
    if(!hash || /^[a-z-]+=/.test(hash)) return;
    const target = document.getElementById(decodeURIComponent(hash));
    for(let parent = target?.parentElement; parent; parent = parent.parentElement) if(parent.tagName === 'DETAILS') parent.setAttribute('open','');
  }

  /** Initialize catalog state from its shareable file-friendly URL hash. */
  function catalog() {
    const grid = document.getElementById('card-grid');
    if(!grid || !DATA) return;
    const params = new URLSearchParams(location.hash.slice(1));
    const state = {q:params.get('q') ?? '',faction:params.get('faction') ?? '',type:(() => { const raw = params.get('type') ?? ''; return raw === 'aircraft' || raw === 'flying-vehicle' ? 'air' : raw; })(),change:NEW_MODE ? '' : (params.get('change') ?? ''),hidden:params.get('hidden') ?? (SPECIAL_MODE ? '1' : ''),ai:params.get('ai') ?? (AI_MODE ? '1' : ''),sort:params.get('sort') ?? 'featured'};
    const showSpecial = document.getElementById('show-special');
    if(showSpecial) showSpecial.checked = state.hidden === '1';
    const showAI = document.getElementById('show-ai');
    if(showAI) showAI.checked = state.ai === '1';
    const search = document.getElementById('search'),faction = document.getElementById('faction-filter'),type = document.getElementById('type-filter'),change = document.getElementById('change-filter'),sort = document.getElementById('sort-select');
    search.value = state.q;
    if(faction) faction.value = state.faction;
    if(type) type.value = state.type;
    if(change) change.value = state.change;
    if(sort) sort.value = state.sort;
    if(faction) state.faction = faction.value;
    if(type) state.type = type.value;
    if(change) state.change = change.value;
    if(sort) state.sort = sort.value || 'featured';

    /** Apply all dimensions together, then sort without mutating the source array. */
    function matches() {
      const query = state.q.trim().toLocaleLowerCase(),terms = query.split(/\s+/).filter(Boolean);
      const list = DATA.objects.filter(item => {
        if(NEW_MODE && !item.isNewUnlock) return false;
        if(BALANCE_MODE && (item.isSpecial || item.isAI || item.isNewUnlock)) return false;
        if(item.isAI) {
          if(state.ai !== '1') return false;
          if(!AI_MODE && (NEW_MODE || SPECIAL_MODE)) return false;
        } else if(item.isSpecial) {
          if(AI_MODE || NEW_MODE || state.change === 'added' || state.hidden !== '1') return false;
        } else if(SPECIAL_MODE || AI_MODE) return false;
        const haystack = `${item.name} ${item.displayId ?? item.id} ${(item.mergedIds ?? []).join(' ')} ${(item.aliases ?? []).join(' ')} ${item.englishName ?? ''}`.toLocaleLowerCase();
        return terms.every(term => haystack.includes(term)) && (!state.faction || item.factions?.includes(state.faction)) && (!state.type || (state.type === 'air' ? item.typeKey === 'flying-vehicle' || item.typeKey === 'aircraft' : item.category === state.type || item.typeKey === state.type)) && (!state.change || (state.change === 'added' ? item.isNewUnlock : item.changeKinds?.includes(state.change)));
      });
      if(state.sort === 'featured') list.sort(defaultOrder);
      if(state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name,'zh-CN') || a.id.localeCompare(b.id));
      if(state.sort === 'cost') list.sort((a,b) => (Number(stat(b,'cost','Cost')) || 0) - (Number(stat(a,'cost','Cost')) || 0));
      if(state.sort === 'hp') list.sort((a,b) => (Number(stat(b,'hp','strength','Strength')) || 0) - (Number(stat(a,'hp','strength','Strength')) || 0));
      return list;
    }

    /** Update controls, result cards, and URL from the same state. */
    function render(scroll = false) {
      const list = matches();
      grid.innerHTML = list.map(renderCard).join('') || `<div class="empty-state">${icon('search')}<h3>没有找到匹配的改动</h3><p>试试名称、内部 ID，或减少筛选条件。</p><button class="button" type="button" data-reset>清除筛选</button></div>`;
      const count = document.getElementById('result-count');
      if(count) count.textContent = `${list.length} 个结果`;
      const selected = Object.entries({q:state.q,faction:state.faction,type:state.type,change:NEW_MODE ? '' : state.change}).filter(([,value]) => value);
      const chips = document.getElementById('active-filters');
      if(chips) chips.innerHTML = selected.map(([key,value]) => `<button class="filter-chip" data-clear="${key}" type="button">${esc(key === 'q' ? `搜索：${value}` : key === 'faction' ? FACTIONS[value] : key === 'type' ? type.selectedOptions[0]?.textContent : CHANGES[value])}<span aria-hidden="true">×</span></button>`).join('');
      const categoryType = state.type === 'defense' ? 'buildings' : state.type;
      syncNav(categoryType);
      for(const link of document.querySelectorAll('.sidebar [data-nav="catalog"]')) {
        const category = link.dataset.filterType;
        const visible = DATA.objects.filter(item => (!item.isSpecial || (SCOPE === 'catalog' && state.hidden === '1')) && (!item.isAI || (SCOPE === 'catalog' && state.ai === '1')) && (!category || item.category === category));
        const badge = link.querySelector('.nav-count');
        if(badge) badge.textContent = visible.length;
      }
      const next = new URLSearchParams();
      for(const [key,value] of Object.entries(state)) if(value && !(key === 'sort' && value === 'featured') && !(key === 'change' && NEW_MODE)) next.set(key,value);
      try { history.replaceState(null,'',`${location.pathname}${location.search}${next.size ? '#' + next.toString() : ''}`); } catch { /* Rendering remains usable on browsers with restrictive local history. */ }
      if(scroll) document.getElementById('catalog')?.scrollIntoView({behavior:'smooth',block:'start'});
    }

    /** Clear the complete filter state and synchronize its controls. */
    function reset() {
      Object.assign(state,{q:'',faction:'',type:'',change:'',hidden:SPECIAL_MODE ? '1' : '',ai:AI_MODE ? '1' : ''});
      if(showSpecial) showSpecial.checked = SPECIAL_MODE;
      if(showAI) showAI.checked = AI_MODE;
      search.value = '';
      if(faction) faction.value = '';
      if(type) type.value = '';
      if(change) change.value = '';
      render();
    }
    search.addEventListener('input',() => { state.q = search.value; render(); });
    showSpecial?.addEventListener('change',() => { state.hidden = showSpecial.checked ? '1' : SPECIAL_MODE ? '0' : ''; render(); });
    showAI?.addEventListener('change',() => { state.ai = showAI.checked ? '1' : AI_MODE ? '0' : ''; render(); });
    for(const [control,key] of [[faction,'faction'],[type,'type'],[change,'change'],[sort,'sort']]) control?.addEventListener('change',() => { state[key] = control.value; render(); });
    document.addEventListener('click',event => {
      const resetButton = event.target.closest('[data-reset]');
      if(resetButton) { reset(); return; }
      const clear = event.target.closest('[data-clear]');
      if(clear) { state[clear.dataset.clear] = ''; ({q:search,faction,type,change}[clear.dataset.clear]).value = ''; render(); return; }
      const category = event.target.closest('[data-filter-type]');
      if(category) {
        // A link from the other scope is a normal navigation, not a local filter.
        if((category.dataset.nav ?? 'catalog') !== SCOPE) return;
        event.preventDefault();
        const rawType = category.dataset.filterType;
        state.type = rawType === 'aircraft' || rawType === 'flying-vehicle' ? 'air' : rawType;
        if(type) type.value = state.type;
        render(true);
        document.body.classList.remove('sidebar-open');
      }
    });
    window.addEventListener('hashchange',() => {
      const next = new URLSearchParams(location.hash.slice(1));
      state.q = next.get('q') ?? '';
      state.faction = next.get('faction') ?? '';
      state.type = next.get('type') ?? '';
      // Keep legacy change=added links aligned with the combined new/unlocked collection.
      state.change = NEW_MODE ? '' : (next.get('change') ?? '');
      state.hidden = next.get('hidden') ?? (SPECIAL_MODE ? '1' : '');
      if(showSpecial) showSpecial.checked = state.hidden === '1';
      search.value = state.q;
      if(faction) faction.value = state.faction;
      if(type) type.value = state.type;
      if(change) change.value = state.change;
      render();
    });
    document.addEventListener('keydown',event => {
      if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
      if(event.key === 'Escape' && document.activeElement === search) { search.value = ''; state.q = ''; render(); }
    });
    render();
  }

  /** Add navigation and lightweight search to standalone document pages. */
  function documents() {
    const input = document.getElementById('document-search');
    if(input) input.addEventListener('input',() => {
      const query = input.value.trim().toLocaleLowerCase();
      document.querySelectorAll('.searchable-section,.weapon-link').forEach(section => { section.hidden = !!query && !section.textContent.toLocaleLowerCase().includes(query); });
    });
    document.querySelector('[data-expand-all]')?.addEventListener('click',event => {
      const details = [...document.querySelectorAll('article details')],open = details.some(item => !item.open);
      for(const item of details) item.open = open;
      event.currentTarget.textContent = open ? '收起明细' : '展开明细';
    });
    document.addEventListener('click',event => { if(event.target.closest('.toc a')) setTimeout(openHashTarget,30); });
    window.addEventListener('hashchange',openHashTarget);
    openHashTarget();
  }

  /** Bind the small-screen navigation drawer. */
  function navigation() {
    const toggle = document.querySelector('.menu-toggle');
    toggle?.addEventListener('click',() => { const open = document.body.classList.toggle('sidebar-open'); toggle.setAttribute('aria-expanded',String(open)); });
    document.querySelector('.mobile-scrim')?.addEventListener('click',() => { document.body.classList.remove('sidebar-open'); toggle?.setAttribute('aria-expanded','false'); });
    document.addEventListener('keydown',event => { if(event.key === 'Escape') { document.body.classList.remove('sidebar-open'); toggle?.setAttribute('aria-expanded','false'); } });
  }

  navigation(); catalog(); documents();
})();
