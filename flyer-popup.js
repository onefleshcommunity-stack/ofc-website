/*!
 * One Flesh Community - Hangout flyer popup
 * ------------------------------------------------------------
 * Drop-in: add this ONE line before </body> in index.html
 *     <script src="flyer-popup.js" defer></script>
 * and upload hangout-flyer.jpg next to it.
 *
 * Testing: open  index.html?flyer=1  to force the popup to show
 * (ignores the "already seen this session" and expiry checks).
 */
(function () {
  'use strict';

  /* ---------------- Settings you may want to change ---------------- */
  var CONFIG = {
    image: 'hangout-flyer.jpg',          // flyer image (same folder as index.html)
    link: 'hangout.html',                // where "Register now" goes
    startDelay: 1000,                    // ms after page load before it pops up
    showUntil: '2026-09-28T00:00:00',    // popup stops appearing after the event day
    showFrom: null,                      // optional, e.g. '2026-09-20T00:00:00'
    oncePerSession: true,                // false = show on every page load
    storageKey: 'ofc_hangout_flyer_seen_v1',
    alt: 'Community Hangout flyer from One Flesh Community. Food, fun, fellowship. ' +
         'Sunday, September 27 at 2 PM at Sea Breeze, Sakumono. ' +
         'Attendance is strictly by registration.'
  };

  /* ---------------- Guards ---------------- */
  var force = false;
  try { force = new URLSearchParams(window.location.search).get('flyer') === '1'; } catch (e) {}

  function store(get, val) {
    try {
      if (get) return window.sessionStorage.getItem(CONFIG.storageKey);
      window.sessionStorage.setItem(CONFIG.storageKey, val);
    } catch (e) { return null; }
  }

  if (!force) {
    var now = new Date();
    if (CONFIG.showUntil && now >= new Date(CONFIG.showUntil)) return;
    if (CONFIG.showFrom && now < new Date(CONFIG.showFrom)) return;
    if (CONFIG.oncePerSession && store(true)) return;
  }

  /* ---------------- Styles ---------------- */
  var CSS = [
    '.ofc-fp{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;',
    'padding:18px;background:rgba(5,40,58,.76);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    'opacity:0;transition:opacity .35s ease;overflow:auto;overscroll-behavior:contain}',
    '.ofc-fp.is-open{opacity:1}',
    '.ofc-fp.is-open.is-closing{opacity:0;transition-duration:.3s}',

    '.ofc-fp__card{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;',
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
    'max-height:calc(100vh - 160px);max-height:calc(100dvh - 160px)}',
    '.ofc-fp__frame::after{content:"";position:absolute;inset:0;pointer-events:none;',
    'background:linear-gradient(115deg,transparent 36%,rgba(255,255,255,.6) 50%,transparent 64%);',
    'transform:translateX(-120%)}',
    '.ofc-fp.is-open .ofc-fp__frame::after{animation:ofc-fp-shine 1.1s ease-out .95s 1 forwards}',
    '@keyframes ofc-fp-shine{to{transform:translateX(120%)}}',

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
    '.ofc-fp__frame::after{display:none}}'
  ].join('');

  /* ---------------- Build + open ---------------- */
  var root, card, frame, primary, lastFocus, prevOverflow, closing = false;

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

  function build() {
    root = document.createElement('div');
    root.className = 'ofc-fp';
    root.innerHTML =
      '<div class="ofc-fp__card" role="dialog" aria-modal="true" ' +
      'aria-label="Community Hangout, Sunday September 27 at 2 PM" tabindex="-1">' +
        '<button type="button" class="ofc-fp__close" aria-label="Close flyer">' +
          '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">' +
          '<path d="M4 4l12 12M16 4L4 16"/></svg>' +
        '</button>' +
        '<div class="ofc-fp__frame"><img class="ofc-fp__img" alt="" decoding="async"></div>' +
        '<div class="ofc-fp__cta">' +
          '<a class="ofc-fp__btn" href="#">Register now</a>' +
          '<button type="button" class="ofc-fp__later">Maybe later</button>' +
        '</div>' +
      '</div>';

    card = root.querySelector('.ofc-fp__card');
    frame = root.querySelector('.ofc-fp__frame');
    primary = root.querySelector('.ofc-fp__btn');

    var img = root.querySelector('.ofc-fp__img');
    img.src = CONFIG.image;
    img.alt = CONFIG.alt;
    primary.href = CONFIG.link;

    root.querySelector('.ofc-fp__close').addEventListener('click', close);
    root.querySelector('.ofc-fp__later').addEventListener('click', close);
    primary.addEventListener('click', function () { store(false, '1'); });
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', onKey);

    /* Subtle 3D tilt that follows the pointer (desktop only) */
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (fine && !calm) {
      frame.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = 'rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
      });
      frame.addEventListener('pointerleave', function () { frame.style.transform = ''; });
    }
  }

  function open() {
    ensureAssets();
    build();
    lastFocus = document.activeElement;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(root);
    void root.offsetWidth; // commit the closed state so the transition runs
    root.classList.add('is-open');
    try { card.focus({ preventScroll: true }); } catch (e) {}
    store(false, '1');
  }

  function close() {
    if (closing || !root) return;
    closing = true;
    root.classList.add('is-closing');
    document.removeEventListener('keydown', onKey);
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      document.body.style.overflow = prevOverflow || '';
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
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

  /* ---------------- Start: wait for image + delay, then pop up ---------------- */
  function start() {
    var imgReady = false, timeUp = false;
    function tryOpen() { if (imgReady && timeUp) open(); }
    var pre = new Image();
    pre.onload = function () { imgReady = true; tryOpen(); };
    pre.onerror = function () { /* image missing: stay silent rather than show a broken popup */ };
    pre.src = CONFIG.image;
    setTimeout(function () { timeUp = true; tryOpen(); }, CONFIG.startDelay);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
