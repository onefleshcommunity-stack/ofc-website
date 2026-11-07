/*!
 * One Flesh Community - Homepage event popup (auto)
 * ------------------------------------------------------------
 * Same look and animation as the Hangout flyer popup, but it runs itself
 * from events-data.json:
 *   - shows the flyer of the next event that has  "popup": true
 *   - "Register now" shows until that event's  registerUntil  time, then it leaves
 *   - on the day of the event: an animated "IT'S TODAY!" banner + confetti
 *   - the day after the event, the popup stops showing by itself
 *
 * Setup: ONE line before </body> in index.html (replace flyer-popup.js with it)
 *     <script src="homepage-popup.js" defer></script>
 *
 * In events-data.json, the event that should pop up needs:
 *     "popup": true,
 *     "flyer": "bootcamp-flyer.jpg",
 *     "register": "bootcamp.html",
 *     "registerUntil": "2026-11-27T22:00:00"
 * If several events have "popup": true, the soonest upcoming one is shown.
 *
 * Testing (no need to change any dates):
 *     index.html?flyer=1      force the popup to show (ignores "already seen")
 *     index.html?flyer=today  force it to show with the "IT'S TODAY" animation
 */
(function () {
  'use strict';

  /* ---------------- Settings you may want to change ---------------- */
  var CONFIG = {
    dataUrl: 'events-data.json',
    startDelay: 1000,                 // ms after page load before it pops up
    oncePerSession: true,             // false = show on every page load
    storagePrefix: 'ofc_event_popup_v1:'
  };

  /* ---------------- Guards / testing switches ---------------- */
  var qs = '';
  try { qs = new URLSearchParams(window.location.search).get('flyer') || ''; } catch (e) {}
  var force = qs === '1' || qs === 'today';
  var fakeToday = qs === 'today';

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var today = new Date(); today.setHours(0, 0, 0, 0);

  function store(get, key, val) {
    try {
      if (get) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function toDate(iso) { return iso ? new Date(iso + 'T00:00:00') : null; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------- Styles (same family as the Hangout popup) ---------------- */
  var CSS = [
    '.ofc-fp{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;',
    'padding:18px;background:rgba(5,40,58,.76);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    'opacity:0;transition:opacity .35s ease;overflow:auto;overscroll-behavior:contain}',
    '.ofc-fp.is-open{opacity:1}',
    '.ofc-fp.is-open.is-closing{opacity:0;transition-duration:.3s}',

    '.ofc-fp__card{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;',
    'max-width:100%;margin:auto;perspective:900px;outline:none;',
    'opacity:0;transform:translateY(46px) scale(.85) rotate(-2.5deg)}',
    '.ofc-fp.is-open .ofc-fp__card{animation:ofc-fp-in .85s cubic-bezier(.2,1.25,.35,1) .05s forwards}',
    '.ofc-fp.is-open.is-closing .ofc-fp__card{animation:ofc-fp-out .3s ease-in forwards}',
    '@keyframes ofc-fp-in{to{opacity:1;transform:none}}',
    '@keyframes ofc-fp-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(22px) scale(.93)}}',

    '.ofc-fp__frame{position:relative;border-radius:20px;overflow:hidden;line-height:0;',
    'box-shadow:0 0 0 4px #fff,0 26px 60px rgba(0,25,45,.55);',
    'transition:transform .22s ease-out;will-change:transform}',
    '.ofc-fp__img{display:block;width:auto;height:auto;max-width:min(92vw,520px);',
    'max-height:calc(100vh - 190px);max-height:calc(100dvh - 190px)}',
    '.ofc-fp__frame::after{content:"";position:absolute;inset:0;pointer-events:none;',
    'background:linear-gradient(115deg,transparent 36%,rgba(255,255,255,.6) 50%,transparent 64%);',
    'transform:translateX(-120%)}',
    '.ofc-fp.is-open .ofc-fp__frame::after{animation:ofc-fp-shine 1.1s ease-out .95s 1 forwards}',
    '@keyframes ofc-fp-shine{to{transform:translateX(120%)}}',

    /* small chip above the flyer: "In 3 days" / "Tomorrow" */
    '.ofc-fp__chip{padding:6px 18px;border-radius:999px;background:#fff;color:#0c536d;',
    'font-family:"Titan One","Arial Black",Impact,sans-serif;font-size:16px;letter-spacing:.02em;',
    'box-shadow:0 4px 0 #a9d6e2,0 10px 18px rgba(0,25,45,.3)}',

    /* event-day banner */
    '.ofc-fp__today{position:relative;overflow:hidden;padding:11px 26px 10px;border-radius:18px;text-align:center;',
    'font-family:"Titan One","Arial Black",Impact,sans-serif;font-size:clamp(24px,7vw,34px);letter-spacing:.03em;line-height:1.1;color:#3b1d00;',
    'background:linear-gradient(180deg,#ffb54d 0%,#ff8a1f 100%);box-shadow:0 5px 0 #b84a00,0 14px 26px rgba(184,74,0,.4);',
    'animation:ofc-fp-wiggle 1.8s ease-in-out infinite}',
    '.ofc-fp__today::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;',
    'background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-20deg);',
    'animation:ofc-fp-sweep 2.2s ease-in-out infinite}',
    '.ofc-fp__today span{display:inline-block}',
    '@keyframes ofc-fp-wiggle{0%,100%{transform:rotate(-1.6deg) scale(1)}50%{transform:rotate(1.6deg) scale(1.05)}}',
    '@keyframes ofc-fp-sweep{0%{left:-60%}60%,100%{left:130%}}',

    '.ofc-fp__confetti{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:-1}',
    '.ofc-fp__confetti i{position:absolute;top:-16px;width:10px;height:15px;border-radius:2px;animation:ofc-fp-fall linear infinite}',
    '@keyframes ofc-fp-fall{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}',

    '.ofc-fp__cta{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 20px;',
    'opacity:0;transform:translateY(12px)}',
    '.ofc-fp.is-open .ofc-fp__cta{animation:ofc-fp-rise .5s ease .8s forwards}',
    '@keyframes ofc-fp-rise{to{opacity:1;transform:none}}',

    '.ofc-fp__btn{position:relative;display:inline-block;padding:13px 30px;border-radius:16px;',
    'font-family:"Titan One","Arial Black",Impact,sans-serif;font-weight:400;font-size:19px;letter-spacing:.02em;',
    'line-height:1.1;text-decoration:none;color:#3b1d00;cursor:pointer;',
    'background:linear-gradient(180deg,#ffa23a 0%,#ff8a1f 100%);',
    'box-shadow:0 5px 0 #b84a00,0 12px 20px rgba(184,74,0,.3);',
    'transition:transform .12s ease,box-shadow .12s ease}',
    '.ofc-fp__btn:hover{transform:translateY(-1px)}',
    '.ofc-fp__btn:active{transform:translateY(3px);box-shadow:0 2px 0 #b84a00,0 6px 12px rgba(184,74,0,.3)}',
    '.ofc-fp__btn::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;',
    'box-shadow:0 0 0 0 rgba(255,138,31,.55)}',
    '.ofc-fp.is-open:not(.is-closing) .ofc-fp__btn::after{animation:ofc-fp-ring 2.6s ease-out 2.2s infinite}',
    '@keyframes ofc-fp-ring{0%{box-shadow:0 0 0 0 rgba(255,138,31,.55)}70%,100%{box-shadow:0 0 0 16px rgba(255,138,31,0)}}',

    '.ofc-fp__note{margin:0;color:#fff;font-family:"Titan One","Arial Black",Impact,sans-serif;font-size:18px;letter-spacing:.02em;text-align:center}',

    '.ofc-fp__later{padding:10px 6px;border:0;background:none;cursor:pointer;',
    'font-family:"Nunito",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:700;font-size:15px;',
    'color:#fff;opacity:.88;text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(255,255,255,.45)}',
    '.ofc-fp__later:hover{opacity:1;text-decoration-color:#fff}',

    '.ofc-fp__close{position:absolute;top:-12px;right:-12px;z-index:2;width:42px;height:42px;padding:0;',
    'display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;cursor:pointer;',
    'background:#fff;color:#0c536d;box-shadow:0 6px 16px rgba(0,25,45,.4);',
    'transition:transform .25s ease,background .2s ease}',
    '.ofc-fp__close:hover{transform:rotate(90deg);background:#eaf7df}',
    '.ofc-fp__close svg{width:18px;height:18px;display:block}',

    '.ofc-fp a:focus-visible,.ofc-fp button:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    '.ofc-fp__close:focus-visible{outline-color:#ff8a1f}',

    '@media (max-width:480px){.ofc-fp{padding:14px}.ofc-fp__close{top:-10px;right:-6px}}',

    '@media (prefers-reduced-motion:reduce){',
    '.ofc-fp,.ofc-fp *,.ofc-fp *::after{animation:none!important;transition:none!important}',
    '.ofc-fp.is-open .ofc-fp__card,.ofc-fp.is-open .ofc-fp__cta{opacity:1;transform:none}',
    '.ofc-fp__frame::after,.ofc-fp__today::after,.ofc-fp__confetti{display:none}}'
  ].join('');

  var ICON_X = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>';

  /* ---------------- Which event to show ---------------- */
  function pick(events) {
    var list = (events || [])
      .filter(function (e) { return e && e.popup && e.flyer && e.date; })
      .map(function (e) { return { ev: e, d: toDate(e.date) }; })
      .filter(function (x) { return x.d && x.d >= today; })      // event day included; the day after drops it
      .sort(function (a, b) { return a.d - b.d; });
    return list[0] || null;
  }

  function chipText(diff) {
    if (diff === 1) return 'Tomorrow';
    if (diff > 1 && diff <= 14) return 'In ' + diff + ' days';
    return '';
  }

  /* ---------------- Build + open ---------------- */
  var root, card, frame, closing = false, lastFocus, prevOverflow, key = '';

  function ensureAssets() {
    if (!document.getElementById('ofc-fp-style')) {
      var s = document.createElement('style');
      s.id = 'ofc-fp-style';
      s.appendChild(document.createTextNode(CSS));
      document.head.appendChild(s);
    }
    if (!document.querySelector('link[href*="Titan+One"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@700&display=swap';
      document.head.appendChild(l);
    }
  }

  function confetti(box) {
    var colors = ['#ff8a1f', '#ffd24a', '#1aa0b8', '#8dc63f', '#e5322d', '#ffffff'];
    for (var i = 0; i < 44; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (3.4 + Math.random() * 3.2) + 's';
      p.style.animationDelay = (-Math.random() * 6) + 's';
      box.appendChild(p);
    }
  }

  function open(x) {
    var e = x.ev;
    var diff = fakeToday ? 0 : Math.round((x.d - today) / 86400000);
    var isToday = diff === 0;
    key = CONFIG.storagePrefix + (e.title || '') + (isToday ? ':today' : '');
    if (!force && CONFIG.oncePerSession && store(true, key)) return;

    var regOpen = !!e.register && (!e.registerUntil || new Date() < new Date(e.registerUntil));

    ensureAssets();
    root = el('div', 'ofc-fp');
    var label = (e.title || 'Upcoming event') + (e.displayDate ? ', ' + e.displayDate : '');

    card = el('div', 'ofc-fp__card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', label);
    card.tabIndex = -1;

    var closeBtn = el('button', 'ofc-fp__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close flyer');
    closeBtn.innerHTML = ICON_X;
    card.appendChild(closeBtn);

    if (isToday) {
      var t = el('div', 'ofc-fp__today');
      t.appendChild(el('span', '', '\uD83C\uDF89 IT\u2019S TODAY! \uD83C\uDF89'));
      card.appendChild(t);
    } else {
      var c = chipText(diff);
      if (c) card.appendChild(el('div', 'ofc-fp__chip', c));
    }

    frame = el('div', 'ofc-fp__frame');
    var img = el('img', 'ofc-fp__img');
    img.decoding = 'async';
    img.src = e.flyer;
    img.alt = 'Flyer for ' + label;
    frame.appendChild(img);
    card.appendChild(frame);

    var cta = el('div', 'ofc-fp__cta');
    if (regOpen) {
      var a = el('a', 'ofc-fp__btn', e.registerLabel || 'Register now');
      a.href = e.register;
      a.addEventListener('click', function () { store(false, key, '1'); });
      cta.appendChild(a);
      var later = el('button', 'ofc-fp__later', 'Maybe later');
      later.type = 'button';
      later.addEventListener('click', close);
      cta.appendChild(later);
    } else {
      cta.appendChild(el('p', 'ofc-fp__note', isToday ? 'See you there!' : 'Registration is now closed'));
      var ok = el('button', 'ofc-fp__later', 'Close');
      ok.type = 'button';
      ok.addEventListener('click', close);
      cta.appendChild(ok);
    }
    card.appendChild(cta);
    root.appendChild(card);

    if (isToday && !calm) { var cf = el('div', 'ofc-fp__confetti'); confetti(cf); root.appendChild(cf); }

    closeBtn.addEventListener('click', close);
    root.addEventListener('click', function (ev) { if (ev.target === root) close(); });
    document.addEventListener('keydown', onKey);

    /* Subtle 3D tilt that follows the pointer (desktop only) */
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine && !calm) {
      frame.addEventListener('pointermove', function (ev) {
        var r = frame.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        frame.style.transform = 'rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg)';
      });
      frame.addEventListener('pointerleave', function () { frame.style.transform = ''; });
    }

    lastFocus = document.activeElement;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(root);
    void root.offsetWidth;                         // commit the closed state so the transition runs
    root.classList.add('is-open');
    try { card.focus({ preventScroll: true }); } catch (err) {}
    store(false, key, '1');
  }

  function close() {
    if (closing || !root) return;
    closing = true;
    root.classList.add('is-closing');
    document.removeEventListener('keydown', onKey);
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      document.body.style.overflow = prevOverflow || '';
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (err) {} }
      root = null; closing = false;
    }, 320);
  }

  function onKey(e) {
    if (!root) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var items = root.querySelectorAll('a[href],button');
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1], active = document.activeElement;
    if (e.shiftKey && (active === first || active === card)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- Start: load data, wait for image + delay, then pop up ---------------- */
  function start() {
    fetch(CONFIG.dataUrl + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (events) {
        var x = pick(events);
        if (!x) return;                                 // nothing to show (e.g. the day after the event)
        var imgReady = false, timeUp = false;
        function tryOpen() { if (imgReady && timeUp) open(x); }
        var pre = new Image();
        pre.onload = function () { imgReady = true; tryOpen(); };
        pre.onerror = function () { /* image missing: stay silent rather than show a broken popup */ };
        pre.src = x.ev.flyer;
        setTimeout(function () { timeUp = true; tryOpen(); }, CONFIG.startDelay);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
