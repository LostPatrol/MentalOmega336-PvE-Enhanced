/* Persist the three theme modes before the first stylesheet is painted. */
(function () {
  'use strict';

  // The same key is shared by every page when browser storage permits it.
  var STORAGE_KEY = 'mo-wiki-theme';
  // Cycling keeps the control compact on narrow page headers.
  var MODES = ['auto', 'light', 'dark'];
  // Visible labels also describe the next action to assistive technology.
  var LABELS = { auto: '跟随浏览器', light: '浅色', dark: '深色' };
  // Resolve internal file links relative to this shared asset, including detail pages.
  var script = document.currentScript;
  var wikiRoot = script ? new URL('../', script.src) : null;
  var mode = 'auto';
  var button;

  /** Accept only the supported theme modes. */
  function isMode(value) {
    return MODES.indexOf(value) !== -1;
  }

  /** Store preferences when available without blocking offline browsing. */
  function remember(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* Storage is optional. */ }
  }

  /** Apply a mode immediately and keep the control's label in sync. */
  function apply(value) {
    mode = isMode(value) ? value : 'auto';
    document.documentElement.setAttribute('data-theme', mode);
    if (!button) return;
    var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    button.textContent = '主题：' + LABELS[mode];
    button.setAttribute('aria-label', '当前主题：' + LABELS[mode] + '；点击切换为' + LABELS[next]);
    button.title = '点击切换：跟随浏览器 → 浅色 → 深色';
  }

  /** Carry the mode between local HTML files whose storage may be isolated. */
  function carryFileTheme(event) {
    if (location.protocol !== 'file:' || !wikiRoot || event.defaultPrevented || event.button > 1) return;
    var anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external') return;
    var href = anchor.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var target;
    try { target = new URL(anchor.href); } catch (error) { return; }
    if (target.protocol !== 'file:' || target.host !== wikiRoot.host || !target.pathname.startsWith(wikiRoot.pathname) || !/\.html$/i.test(target.pathname)) return;
    target.searchParams.set('theme', mode);
    anchor.href = target.href;
  }

  /** Add the accessible mode button after the shared header exists. */
  function mount() {
    var container = document.querySelector('.topbar .top-meta');
    if (!container) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'button theme-toggle';
    /** Cycle the mode and preserve it across reloads and navigation. */
    button.addEventListener('click', function () {
      apply(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
      remember(mode);
      // Keep an incoming local URL preference from overriding a later manual choice on reload.
      if (location.protocol === 'file:') {
        try {
          var url = new URL(location.href);
          url.searchParams.set('theme', mode);
          history.replaceState(null, '', url.href);
        } catch (error) { /* Some file viewers disallow history changes. */ }
      }
    });
    container.appendChild(button);
    apply(mode);
    document.addEventListener('click', carryFileTheme);
    document.addEventListener('auxclick', carryFileTheme);
  }

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (isMode(saved)) mode = saved;
  } catch (error) { /* File viewers can disable storage. */ }
  if (location.protocol === 'file:') {
    var incoming = new URL(location.href).searchParams.get('theme');
    if (isMode(incoming)) {
      mode = incoming;
      remember(mode);
    }
  }
  apply(mode);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}());
