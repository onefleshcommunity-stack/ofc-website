/*!
 * One Flesh Community - Events page showcase
 * ------------------------------------------------------------
 * Replaces the old "Next Up" banner + event cards with one showcase:
 *   - a lineup of every upcoming event (soonest first)
 *   - each event shows its flyer, or the OFC logo with a short message
 *     ("Details will be shared soon") while its flyer is not ready
 *   - click a flyer to see it full size
 *
 * Setup: ONE line before </body> in events.html
 *     <script src="events-flyers.js" defer></script>
 *
 * Adding a flyer later (no code changes):
 *   a) upload the image (e.g. bootcamp-flyer.jpg) to the repo root
 *   b) in events-data.json add   "flyer": "bootcamp-flyer.jpg"   to that event
 * Optional per event:  "placeholder": "your own short message"
 * Past events leave the lineup automatically. Undated events (e.g. the
 * monthly webinars) stay at the end of the lineup.
 *
 * To bring the old banner + cards back, set hideEventList to false below.
 */
(function () {
  'use strict';

  var CONFIG = {
    dataUrl: 'events-data.json',
    autoplayMs: 7000,                        // how long each flyer stays before moving on
    insertAfter: '.page-header',             // showcase is placed right after this element
    logo: 'logo.jpg',                        // shown while a flyer is not ready
    placeholderText: 'Details will be shared soon',
    hideEventList: true,                     // hide the old Next Up banner + cards
    failsafeMs: 8000                         // if data is slow/broken, show the old list again
  };

  var grid = document.getElementById('eventsGrid');
  if (!grid) return; // not the events page

  /* ---------------- Styles ---------------- */
  var ICON_IMG = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5"/><circle cx="7.2" cy="8" r="1.5"/><path d="M3 15l4.5-4.5 3.5 3.5 2.5-2.5L17 15"/></svg>';
  var ICON_EXPAND = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-5.5 5.5M3 17l5.5-5.5"/></svg>';
  var ICON_X = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>';
  var ICON_L = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 3.5L6 10l6.5 6.5"/></svg>';
  var ICON_R = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3.5L14 10l-6.5 6.5"/></svg>';

  var CSS = [
    '.ofc-ev-hide-old .ofc-ev-oldlist{display:none!important}',
    '.ofc-ev-hero{--ofc-gold:var(--gold,#c8962e);--ofc-ink:#3d1712;--ofc-maroon:#8f2a22;--ofc-line:rgba(0,0,0,.16);--ofc-line:color-mix(in srgb,currentColor 18%,transparent);padding:6px 0 48px}',
    '.ofc-ev-hero__inner{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(22px,4vw,52px);align-items:center}',

    /* stage */
    '.ofc-ev-stage{position:relative;display:block;width:100%;aspect-ratio:6/5;padding:0;margin:0;border:0;border-radius:22px;overflow:hidden;cursor:zoom-in;',
    'background:#ece3cf;color:inherit;font:inherit;box-shadow:0 18px 44px rgba(60,25,10,.2);opacity:0;transform:translateY(18px);-webkit-appearance:none;appearance:none}',
    '.ofc-ev-stage.is-static{cursor:default}',
    '.ofc-ev-hero.is-ready .ofc-ev-stage{animation:ofc-ev-rise .85s cubic-bezier(.2,.9,.3,1) forwards}',
    '.ofc-ev-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:clamp(12px,3%,24px);',
    'opacity:0;transform:scale(1.025);transition:opacity .7s ease,transform .9s ease;pointer-events:none}',
    '.ofc-ev-slide.is-active{opacity:1;transform:none}',
    '.ofc-ev-slide::before{content:"";position:absolute;inset:-40px;background:var(--ofc-bg) center/cover no-repeat;filter:blur(30px) saturate(1.15);opacity:.9}',
    '.ofc-ev-slide img.ofc-ev-flyerimg{position:relative;display:block;max-width:100%;max-height:100%;width:auto;height:auto;border-radius:12px;box-shadow:0 14px 34px rgba(0,0,0,.32)}',
    '.ofc-ev-zoom{position:absolute;right:14px;bottom:14px;display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;',
    'background:rgba(143,42,34,.92);color:#fff;font-size:13.5px;font-weight:700;opacity:0;transform:translateY(4px);transition:opacity .2s ease,transform .2s ease}',
    '.ofc-ev-zoom svg{width:15px;height:15px}',
    '.ofc-ev-stage:hover .ofc-ev-zoom,.ofc-ev-stage:focus-visible .ofc-ev-zoom{opacity:1;transform:none}',
    '.ofc-ev-stage.is-static .ofc-ev-zoom{display:none}',
    '@media (hover:none){.ofc-ev-zoom{display:none}}',

    /* placeholder (no flyer yet) */
    '.ofc-ev-slide.is-placeholder{flex-direction:column;gap:clamp(14px,3vw,22px);text-align:center;',
    'background:radial-gradient(circle at 50% 36%,#fdf7e8 0%,#f3e6c9 58%,#e8d6ae 100%)}',
    '.ofc-ev-slide.is-placeholder::before{display:none}',
    '.ofc-ev-ph__logo{position:relative;width:clamp(96px,26%,150px);height:auto;aspect-ratio:1/1;object-fit:cover;border-radius:50%;',
    'box-shadow:0 0 0 6px rgba(255,255,255,.85),0 16px 36px rgba(90,40,10,.28)}',
    '.ofc-ev-ph__msg{position:relative;margin:0;max-width:22ch;font-weight:700;font-size:clamp(18px,2.3vw,25px);line-height:1.3;color:var(--ofc-maroon);text-wrap:balance}',

    /* panel */
    '.ofc-ev-panel{opacity:0;min-width:0}',
    '.ofc-ev-hero.is-ready .ofc-ev-panel{animation:ofc-ev-fade .7s ease .25s forwards}',
    '.ofc-ev-body.is-in{animation:ofc-ev-textin .45s ease both}',
    '.ofc-ev-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-weight:700;font-size:15px}',
    '.ofc-ev-chip{padding:4px 12px;border-radius:999px;background:var(--ofc-gold);color:var(--ofc-ink);font-weight:800;font-size:13px}',
    '.ofc-ev-title{margin:12px 0 10px;font-size:clamp(28px,3.4vw,40px);line-height:1.1}',
    '.ofc-ev-desc{margin:0 0 22px;line-height:1.6;max-width:46ch;opacity:.86}',
    '.ofc-ev-btn{display:inline-flex;align-items:center;gap:9px;padding:13px 24px;border:0;border-radius:12px;cursor:pointer;-webkit-appearance:none;appearance:none;',
    'background:var(--ofc-gold);color:var(--ofc-ink);font:inherit;font-weight:800;font-size:16px;transition:transform .12s ease,filter .15s ease}',
    '.ofc-ev-btn svg{width:18px;height:18px}',
    '.ofc-ev-btn:hover{filter:brightness(1.06);transform:translateY(-1px)}',
    '.ofc-ev-btn:active{transform:translateY(1px)}',

    /* lineup */
    '.ofc-ev-tabs{list-style:none;margin:26px 0 0;padding:0;display:flex;flex-direction:column}',
    '.ofc-ev-tab{position:relative;display:flex;justify-content:space-between;align-items:baseline;gap:14px;width:100%;text-align:left;margin:0;',
    'padding:13px 4px 14px;border:0;border-top:1px solid var(--ofc-line);border-radius:0;box-shadow:none;background:none;color:inherit;font:inherit;cursor:pointer;',
    'opacity:.6;transition:opacity .2s ease;-webkit-appearance:none;appearance:none;text-transform:none;letter-spacing:normal}',
    '.ofc-ev-tabs li:last-child .ofc-ev-tab{border-bottom:1px solid var(--ofc-line)}',
    '.ofc-ev-tab:hover,.ofc-ev-tab[aria-current="true"]{opacity:1}',
    '.ofc-ev-tab__name{font-weight:700}',
    '.ofc-ev-tab__date{font-size:14px;opacity:.75;white-space:nowrap}',
    '.ofc-ev-tab__bar{position:absolute;left:0;top:-1px;width:100%;height:3px;background:var(--ofc-gold);transform:scaleX(0);transform-origin:left}',
    '.ofc-ev-hero.is-ready .ofc-ev-tab[aria-current="true"] .ofc-ev-tab__bar{animation:ofc-ev-prog var(--ofc-dur,7s) linear forwards}',
    '.ofc-ev-hero.is-manual .ofc-ev-tab[aria-current="true"] .ofc-ev-tab__bar{animation:none;transform:scaleX(1)}',
    '.ofc-ev-hero:hover .ofc-ev-tab[aria-current="true"] .ofc-ev-tab__bar,',
    '.ofc-ev-hero:focus-within .ofc-ev-tab[aria-current="true"] .ofc-ev-tab__bar,',
    '.ofc-ev-hero.is-paused .ofc-ev-tab[aria-current="true"] .ofc-ev-tab__bar{animation-play-state:paused}',

    /* keyframes */
    '@keyframes ofc-ev-rise{to{opacity:1;transform:none}}',
    '@keyframes ofc-ev-fade{to{opacity:1}}',
    '@keyframes ofc-ev-textin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes ofc-ev-prog{to{transform:scaleX(1)}}',
    '@keyframes ofc-ev-imgin{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}',

    /* event cards that have a flyer (only used if the old list is shown) */
    '.ofc-ev-hasflyer{cursor:pointer}',
    '.ofc-ev-hasflyer:focus-visible{outline:3px solid var(--gold,#c8962e);outline-offset:3px}',
    '.ofc-ev-cardchip{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:5px 13px;border:1.5px solid var(--gold,#c8962e);border-radius:999px;',
    'font-size:13px;font-weight:700;color:inherit;background:transparent;transition:background .2s ease,color .2s ease}',
    '.ofc-ev-cardchip svg{width:15px;height:15px}',
    '.ofc-ev-hasflyer:hover .ofc-ev-cardchip,.ofc-ev-hasflyer:focus-visible .ofc-ev-cardchip{background:var(--gold,#c8962e);color:#3d1712}',

    /* full-size viewer */
    '.ofc-ev-viewer{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(18,10,8,.93);',
    '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .28s ease;outline:none}',
    '.ofc-ev-viewer.is-open{opacity:1}',
    '.ofc-ev-viewer.is-open.is-closing{opacity:0;transition-duration:.24s}',
    '.ofc-ev-vstage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:64px 72px 24px}',
    '.ofc-ev-vfig{margin:0;display:flex;flex-direction:column;align-items:center;gap:12px;max-width:100%;max-height:100%}',
    '.ofc-ev-vimg{display:block;max-width:100%;max-height:calc(100vh - 150px);max-height:calc(100dvh - 150px);width:auto;height:auto;border-radius:14px;',
    'box-shadow:0 0 0 3px rgba(255,255,255,.9),0 24px 60px rgba(0,0,0,.55);animation:ofc-ev-imgin .35s ease both}',
    '.ofc-ev-vcap{color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:1.4}',
    '.ofc-ev-vclose,.ofc-ev-vnav{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;',
    'background:rgba(255,255,255,.94);color:#3d1712;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4);transition:transform .2s ease,background .2s ease}',
    '.ofc-ev-vclose{top:14px;right:14px}',
    '.ofc-ev-vnav{top:50%;margin-top:-22px}',
    '.ofc-ev-vnav.is-prev{left:14px}',
    '.ofc-ev-vnav.is-next{right:14px}',
    '.ofc-ev-vclose:hover,.ofc-ev-vnav:hover{background:#fff;transform:scale(1.07)}',
    '.ofc-ev-vclose svg{width:18px;height:18px}.ofc-ev-vnav svg{width:20px;height:20px}',
    '.ofc-ev-hero a:focus-visible,.ofc-ev-hero button:focus-visible,.ofc-ev-viewer button:focus-visible{outline:3px solid var(--gold,#c8962e);outline-offset:3px}',
    '.ofc-ev-viewer button:focus-visible{outline-color:#fff}',

    /* small screens */
    '@media (max-width:820px){',
    '.ofc-ev-hero__inner{grid-template-columns:minmax(0,1fr)}',
    '.ofc-ev-stage{aspect-ratio:1/1;border-radius:18px}',
    '.ofc-ev-tabs{flex-direction:row;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;margin-top:22px}',
    '.ofc-ev-tabs li{flex:0 0 min(72%,250px);scroll-snap-align:start}',
    '.ofc-ev-tab,.ofc-ev-tabs li:last-child .ofc-ev-tab{flex-direction:column;align-items:flex-start;gap:3px;border:1px solid var(--ofc-line);border-radius:12px;padding:13px 14px;overflow:hidden}',
    '.ofc-ev-tab__bar{top:0}',
    '.ofc-ev-vstage{padding:60px 12px 16px}',
    '.ofc-ev-vnav{top:auto;bottom:14px;margin-top:0}',
    '.ofc-ev-vnav.is-prev{left:calc(50% - 56px)}.ofc-ev-vnav.is-next{right:calc(50% - 56px)}',
    '.ofc-ev-vimg{max-height:calc(100vh - 210px);max-height:calc(100dvh - 210px)}}',

    '@media (prefers-reduced-motion:reduce){',
    '.ofc-ev-hero *,.ofc-ev-viewer *{animation:none!important;transition:none!important}',
    '.ofc-ev-stage,.ofc-ev-panel{opacity:1;transform:none}}'
  ].join('');

  /* ---------------- Helpers ---------------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var today = new Date(); today.setHours(0, 0, 0, 0);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function cap(s) { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function toDate(iso) { return iso ? new Date(iso + 'T00:00:00') : null; }
  function dateText(it) {
    if (it.ev.displayDate) return it.ev.displayDate;
    return it.d ? it.d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  }
  function relText(it) {
    if (!it.d) return '';
    var n = Math.round((it.d - today) / 86400000);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n > 1 && n <= 14) return 'In ' + n + ' days';
    return '';
  }
  function chipText(it) {                      // Today / In 7 days, else labels like Paid or Monthly
    var r = relText(it);
    if (r) return r;
    return it.ev.monLabel ? cap(it.ev.monLabel) : '';
  }
  function tabDate(it) {                       // short date for the lineup
    var e = it.ev;
    if (e.dayLabel) return /^\d/.test(e.dayLabel) ? e.dayLabel : cap(e.monLabel);
    return it.d ? it.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  }
  function placeholderMsg(it) { return it.ev.placeholder || CONFIG.placeholderText; }
  function hasSrc(it) { return !!it.src; }
  function imageExists(src) {
    return new Promise(function (resolve) {
      var i = new Image();
      i.onload = function () { resolve(true); };
      i.onerror = function () { resolve(false); };
      i.src = src;
    });
  }
  function injectStyles() {
    if (document.getElementById('ofc-ev-style')) return;
    var s = el('style'); s.id = 'ofc-ev-style';
    s.appendChild(document.createTextNode(CSS));
    document.head.appendChild(s);
  }

  /* ---------------- Old banner + cards ---------------- */
  function markOldList() {
    if (!CONFIG.hideEventList) return;
    var banner = document.getElementById('nextUpBanner');
    [banner, grid].forEach(function (n) {
      var sec = n && n.closest ? n.closest('section') : null;
      if (sec) sec.classList.add('ofc-ev-oldlist');
    });
  }
  function oldListHidden(on) {
    if (!CONFIG.hideEventList) return;
    document.documentElement.classList.toggle('ofc-ev-hide-old', !!on);
  }

  /* ---------------- State ---------------- */
  var flyers = [];   // items that have a flyer, in viewer order
  var hero = null;

  /* ---------------- Viewer (full-size flyer) ---------------- */
  var vw = null, vImg, vCap, vIdx = 0, vLast = null, vPrevOverflow = '', vClosing = false, touchX = null;

  function showInViewer(i) {
    var n = flyers.length;
    vIdx = (i + n) % n;
    var f = flyers[vIdx];
    vImg.style.animation = 'none'; void vImg.offsetWidth; vImg.style.animation = '';
    vImg.src = f.src;
    vImg.alt = 'Flyer for ' + f.title;
    var d = dateText(f);
    vCap.textContent = f.title + (d ? ' \u00B7 ' + d : '');
  }

  function openViewer(i, trigger) {
    if (vw || !flyers.length || i < 0) return;
    vLast = trigger || document.activeElement;
    vw = el('div', 'ofc-ev-viewer');
    vw.setAttribute('role', 'dialog');
    vw.setAttribute('aria-modal', 'true');
    vw.setAttribute('aria-label', 'Event flyer');
    vw.tabIndex = -1;
    vw.innerHTML =
      '<button type="button" class="ofc-ev-vclose" aria-label="Close flyer">' + ICON_X + '</button>' +
      '<div class="ofc-ev-vstage"><figure class="ofc-ev-vfig"><img class="ofc-ev-vimg" alt=""><figcaption class="ofc-ev-vcap"></figcaption></figure></div>' +
      (flyers.length > 1
        ? '<button type="button" class="ofc-ev-vnav is-prev" aria-label="Previous flyer">' + ICON_L + '</button>' +
          '<button type="button" class="ofc-ev-vnav is-next" aria-label="Next flyer">' + ICON_R + '</button>'
        : '');
    vImg = vw.querySelector('.ofc-ev-vimg');
    vCap = vw.querySelector('.ofc-ev-vcap');

    vw.querySelector('.ofc-ev-vclose').addEventListener('click', closeViewer);
    var prev = vw.querySelector('.is-prev'), next = vw.querySelector('.is-next');
    if (prev) prev.addEventListener('click', function () { showInViewer(vIdx - 1); });
    if (next) next.addEventListener('click', function () { showInViewer(vIdx + 1); });
    vw.addEventListener('click', function (e) {
      if (e.target === vw || e.target.classList.contains('ofc-ev-vstage')) closeViewer();
    });
    vw.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    vw.addEventListener('touchend', function (e) {
      if (touchX == null || flyers.length < 2) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) showInViewer(vIdx + (dx < 0 ? 1 : -1));
    }, { passive: true });

    showInViewer(i);
    vPrevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(vw);
    void vw.offsetWidth;
    vw.classList.add('is-open');
    try { vw.focus({ preventScroll: true }); } catch (e) {}
    document.addEventListener('keydown', onViewerKey);
    if (hero) hero.pause(true);
  }

  function closeViewer() {
    if (!vw || vClosing) return;
    vClosing = true;
    vw.classList.add('is-closing');
    document.removeEventListener('keydown', onViewerKey);
    setTimeout(function () {
      if (vw && vw.parentNode) vw.parentNode.removeChild(vw);
      document.body.style.overflow = vPrevOverflow || '';
      if (vLast && vLast.focus) { try { vLast.focus({ preventScroll: true }); } catch (e) {} }
      vw = null; vClosing = false;
      if (hero) hero.pause(false);
    }, 260);
  }

  function onViewerKey(e) {
    if (!vw) return;
    if (e.key === 'Escape') { closeViewer(); return; }
    if (e.key === 'ArrowLeft' && flyers.length > 1) { showInViewer(vIdx - 1); return; }
    if (e.key === 'ArrowRight' && flyers.length > 1) { showInViewer(vIdx + 1); return; }
    if (e.key !== 'Tab') return;
    var items = vw.querySelectorAll('button');
    var first = items[0], last = items[items.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || a === vw)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- Showcase (lineup of upcoming events) ---------------- */
  function buildHero(items) {
    var host = document.querySelector(CONFIG.insertAfter);
    if (!host || !items.length) return null;

    var n = items.length;
    var multi = n > 1;
    var flyerCount = items.filter(hasSrc).length;
    var autoplay = flyerCount > 1 && !reduce;
    var active = 0;

    var sec = el('section', 'ofc-ev-hero');
    sec.setAttribute('aria-label', 'Upcoming events');
    sec.style.setProperty('--ofc-dur', (CONFIG.autoplayMs / 1000) + 's');
    if (!autoplay) sec.classList.add('is-manual');

    var inner = el('div', 'wrap ofc-ev-hero__inner');

    // stage: flyer, or logo + message when the flyer is not ready
    var stage = el('button', 'ofc-ev-stage');
    stage.type = 'button';
    var slides = items.map(function (it) {
      var s;
      if (it.src) {
        s = el('div', 'ofc-ev-slide');
        s.style.setProperty('--ofc-bg', 'url("' + it.src + '")');
        var im = el('img', 'ofc-ev-flyerimg'); im.src = it.src; im.alt = 'Flyer for ' + it.title; im.decoding = 'async';
        s.appendChild(im);
      } else {
        s = el('div', 'ofc-ev-slide is-placeholder');
        var logo = el('img', 'ofc-ev-ph__logo'); logo.src = CONFIG.logo; logo.alt = 'One Flesh Community logo';
        logo.onerror = function () { logo.style.display = 'none'; };
        s.appendChild(logo);
        s.appendChild(el('p', 'ofc-ev-ph__msg', placeholderMsg(it)));
      }
      stage.appendChild(s);
      return s;
    });
    var zoom = el('span', 'ofc-ev-zoom'); zoom.innerHTML = ICON_EXPAND + '<span>View full flyer</span>';
    stage.appendChild(zoom);

    // panel: details + lineup
    var panel = el('div', 'ofc-ev-panel');
    var body = el('div', 'ofc-ev-body');
    var meta = el('div', 'ofc-ev-meta');
    var chip = el('span', 'ofc-ev-chip');
    var when = el('span', 'ofc-ev-when');
    meta.appendChild(chip); meta.appendChild(when);
    var title = el('h2', 'ofc-ev-title');
    var desc = el('p', 'ofc-ev-desc');
    var btn = el('button', 'ofc-ev-btn'); btn.type = 'button'; btn.innerHTML = ICON_IMG + '<span>View full flyer</span>';
    body.appendChild(meta); body.appendChild(title); body.appendChild(desc); body.appendChild(btn);
    panel.appendChild(body);

    var tabs = [];
    if (multi) {
      var ul = el('ul', 'ofc-ev-tabs');
      items.forEach(function (it, i) {
        var li = el('li');
        var t = el('button', 'ofc-ev-tab'); t.type = 'button';
        t.appendChild(el('span', 'ofc-ev-tab__bar'));
        t.appendChild(el('span', 'ofc-ev-tab__name', it.title));
        t.appendChild(el('span', 'ofc-ev-tab__date', tabDate(it)));
        t.addEventListener('click', function () { manual(); if (i !== active) setActive(i, true); });
        li.appendChild(t); ul.appendChild(li);
        tabs.push(t);
      });
      panel.appendChild(ul);
      ul.addEventListener('animationend', function (e) {
        if (e.animationName !== 'ofc-ev-prog' || !autoplay) return;
        var j = nextFlyerFrom(active);
        if (j >= 0 && j !== active) setActive(j, true);
      });
    }

    inner.appendChild(stage); inner.appendChild(panel);
    sec.appendChild(inner);
    host.parentNode.insertBefore(sec, host.nextSibling);

    function manual() { autoplay = false; sec.classList.add('is-manual'); }
    function nextFlyerFrom(i) {                 // autoplay only moves between events that have a flyer
      for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (items[j].src) return j; }
      return -1;
    }

    function setActive(i, animate) {
      active = i;
      var it = items[i], isFlyer = !!it.src;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      tabs.forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });

      var c = chipText(it), w = dateText(it);
      chip.textContent = c; chip.style.display = c ? '' : 'none';
      when.textContent = w; when.style.display = w ? '' : 'none';
      meta.style.display = (c || w) ? '' : 'none';
      title.textContent = it.title;
      desc.textContent = it.ev.description || '';
      desc.style.display = it.ev.description ? '' : 'none';

      stage.classList.toggle('is-static', !isFlyer);
      stage.tabIndex = isFlyer ? 0 : -1;
      stage.setAttribute('aria-disabled', isFlyer ? 'false' : 'true');
      stage.setAttribute('aria-label', isFlyer ? 'View full flyer: ' + it.title : it.title + ': ' + placeholderMsg(it));
      btn.style.display = isFlyer ? '' : 'none';
      if (!isFlyer && autoplay) manual();       // never sit on a "coming soon" slide on a timer
      if (animate) { body.classList.remove('is-in'); void body.offsetWidth; body.classList.add('is-in'); }
    }

    stage.addEventListener('click', function () {
      var it = items[active];
      if (it.src) openViewer(flyers.indexOf(it), stage);
    });
    btn.addEventListener('click', function () {
      var it = items[active];
      if (it.src) openViewer(flyers.indexOf(it), btn);
    });

    // swipe on the stage (touch)
    var sx = null;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx == null || !multi) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 45) { manual(); setActive((active + (dx < 0 ? 1 : -1) + n) % n, true); }
    }, { passive: true });

    setActive(0, false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { sec.classList.add('is-ready'); }); });

    return { pause: function (on) { sec.classList.toggle('is-paused', !!on); } };
  }

  /* ---------------- Event cards (only matter if the old list is shown) ---------------- */
  function decorateCards() {
    if (!flyers.length) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.event-card'), function (card) {
      if (card.classList.contains('ofc-ev-hasflyer')) return;
      var h3 = card.querySelector('h3');
      if (!h3) return;
      var name = h3.textContent.trim(), idx = -1;
      flyers.forEach(function (f, i) { if (f.title === name) idx = i; });
      if (idx < 0) return;

      card.classList.add('ofc-ev-hasflyer');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View flyer for ' + name);
      var chip = el('span', 'ofc-ev-cardchip'); chip.innerHTML = ICON_IMG + '<span>View flyer</span>';
      h3.parentNode.appendChild(chip);
      card.addEventListener('click', function () { openViewer(idx, card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(idx, card); }
      });
    });
  }

  /* ---------------- Start ---------------- */
  function byDate(a, b) {
    if (a.d && b.d) return (a.d - b.d) || (a.i - b.i);
    if (a.d) return -1;
    if (b.d) return 1;
    return a.i - b.i;                           // undated events keep their order, at the end
  }

  function start(events) {
    if (!Array.isArray(events)) { oldListHidden(false); return; }
    var all = events.filter(Boolean).map(function (e, i) {
      return { ev: e, i: i, title: e.title || '', src: e.flyer || null, d: toDate(e.date) };
    });
    var withFlyer = all.filter(hasSrc);
    return Promise.all(withFlyer.map(function (x) { return imageExists(x.src); })).then(function (ok) {
      withFlyer.forEach(function (x, i) { if (!ok[i]) x.src = null; }); // missing image = "details soon"
      var lineup = all.filter(function (x) { return !x.d || x.d >= today; }).sort(byDate);

      hero = buildHero(lineup);
      if (hero && CONFIG.hideEventList) {
        flyers = lineup.filter(hasSrc);
        oldListHidden(true);
      } else {
        flyers = all.filter(hasSrc).sort(byDate);
        oldListHidden(false);
        decorateCards();
        new MutationObserver(decorateCards).observe(grid, { childList: true });
      }
    });
  }

  function load() {
    fetch(CONFIG.dataUrl + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(start)
      .catch(function () { oldListHidden(false); });
  }

  function init() {
    injectStyles();
    markOldList();
    oldListHidden(true);                         // no flash of the old list while the data loads
    setTimeout(function () { if (!hero) oldListHidden(false); }, CONFIG.failsafeMs);
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
