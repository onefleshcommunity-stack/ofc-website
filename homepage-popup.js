/*!
 * One Flesh Community - Homepage event popup
 * ------------------------------------------------------------
 * Shows the flyer of the next event in a popup on the homepage.
 *   - "Register now" shows until that event's registerUntil time, then leaves
 *   - on the day of the event: an animated "IT'S TODAY!" banner + confetti
 *   - the day after the event, the popup stops showing by itself
 *
 * Setup: ONE line before </body> in index.html
 *     <script src="homepage-popup.js" defer></script>
 *
 * In events-data.json, the event that should pop up needs:
 *     "popup": true,
 *     "flyer": "bootcamp-flyer.jpg",
 *     "register": "bootcamp.html",
 *     "registerUntil": "2026-11-27T22:00:00"
 * If several events have "popup": true, the soonest upcoming one is shown.
 * Each visitor sees it once per visit (closing it hides it until their next visit).
 */
(function () {
  'use strict';

  var CFG = {
    dataUrl: 'events-data.json',
    delayMs: 1200,
    storagePrefix: 'ofc-popup:'
  };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var today = new Date(); today.setHours(0, 0, 0, 0);

  var CSS = [
    '.ofc-pop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(18,10,8,.78);',
    '-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;transition:opacity .35s ease;outline:none}',
    '.ofc-pop.is-open{opacity:1}',
    '.ofc-pop-card{position:relative;width:100%;max-width:430px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;background:#fffaf1;color:#3d1712;',
    'border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.5);transform:translateY(24px) scale(.96);transition:transform .45s cubic-bezier(.2,.9,.3,1.1)}',
    '.ofc-pop.is-open .ofc-pop-card{transform:none}',
    '.ofc-pop-flyer{display:block;width:100%;height:auto;max-height:58vh;max-height:58dvh;object-fit:contain;background:#f3e6c9}',
    '.ofc-pop-body{padding:16px 18px 20px;text-align:center}',
    '.ofc-pop-chip{display:inline-block;padding:4px 14px;border-radius:999px;background:#c8962e;color:#3d1712;font-weight:800;font-size:13px;margin-bottom:8px}',
    '.ofc-pop-title{margin:0 0 4px;font-size:22px;line-height:1.2;color:#8f2a22;font-weight:800}',
    '.ofc-pop-when{margin:0 0 14px;font-weight:600;font-size:15px}',
    '.ofc-pop-btn,.ofc-pop-btn:visited{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 20px;border-radius:12px;background:#8f2a22;color:#fff;',
    'font-weight:800;font-size:17px;text-decoration:none;box-shadow:0 5px 0 #5e1a15;transition:transform .12s ease,filter .15s ease}',
    '.ofc-pop-btn:hover{filter:brightness(1.08);transform:translateY(-1px);color:#fff}',
    '.ofc-pop-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #5e1a15}',
    '.ofc-pop-btn svg{width:18px;height:18px}',
    '.ofc-pop-note{margin:0;font-size:14px;opacity:.75}',
    '.ofc-pop-close{position:absolute;top:10px;right:10px;z-index:3;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.95);color:#3d1712;',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
    '.ofc-pop-close svg{width:16px;height:16px}',
    '.ofc-pop a:focus-visible,.ofc-pop button:focus-visible{outline:3px solid #c8962e;outline-offset:3px}',

    /* event-day ribbon */
    '.ofc-pop-today{position:relative;overflow:hidden;padding:12px 16px;text-align:center;color:#3d1712;font-weight:900;font-size:clamp(22px,6.5vw,30px);letter-spacing:.04em;',
    'background:linear-gradient(100deg,#e7b64a,#ffd978 45%,#e7b64a);animation:ofc-pop-pulse 1.4s ease-in-out infinite}',
    '.ofc-pop-today::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);',
    'transform:skewX(-20deg);animation:ofc-pop-shine 2.4s ease-in-out infinite}',
    '.ofc-pop-today span{display:inline-block;animation:ofc-pop-bounce 1.4s ease-in-out infinite}',
    '.ofc-pop-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2}',
    '.ofc-pop-confetti i{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;opacity:.95;animation:ofc-pop-fall linear infinite}',

    '@keyframes ofc-pop-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.1)}}',
    '@keyframes ofc-pop-shine{0%{left:-60%}60%,100%{left:130%}}',
    '@keyframes ofc-pop-bounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.05)}}',
    '@keyframes ofc-pop-fall{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(105vh) rotate(720deg)}}',
    '@media (prefers-reduced-motion:reduce){.ofc-pop *{animation:none!important;transition:none!important}.ofc-pop-confetti{display:none}}'
  ].join('');

  var ICON_X = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function toDate(iso) { return iso ? new Date(iso + 'T00:00:00') : null; }
  function store(get, key, val) {
    try { return get ? sessionStorage.getItem(key) : sessionStorage.setItem(key, val); } catch (e) { return null; }
  }
  function imageOk(src) {
    return new Promise(function (resolve) {
      var i = new Image();
      i.onload = function () { resolve(true); };
      i.onerror = function () { resolve(false); };
      i.src = src;
    });
  }

  function pick(events) {
    var list = (events || []).filter(function (e) { return e && e.popup && e.flyer && e.date; })
      .map(function (e) { return { ev: e, d: toDate(e.date) }; })
      .filter(function (x) { return x.d && x.d >= today; })       // event day included, the day after drops it
      .sort(function (a, b) { return a.d - b.d; });
    return list[0] || null;
  }

  function whenChip(diff) {
    if (diff === 0) return '';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1 && diff <= 14) return 'In ' + diff + ' days';
    return 'Upcoming event';
  }

  function confetti(box) {
    var colors = ['#c8962e', '#8f2a22', '#f5c34d', '#2f8f9d', '#7bb33a', '#e5322d'];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (3.2 + Math.random() * 3) + 's';
      p.style.animationDelay = (-Math.random() * 6) + 's';
      p.style.transform = 'rotate(' + Math.round(Math.random() * 360) + 'deg)';
      box.appendChild(p);
    }
  }

  function show(x) {
    var e = x.ev;
    var diff = Math.round((x.d - today) / 86400000);
    var isToday = diff === 0;
    var key = CFG.storagePrefix + (e.title || '') + (isToday ? ':today' : '');
    if (store(true, key)) return;                                  // already closed in this visit

    var regOpen = !!e.register && (!e.registerUntil || new Date() < new Date(e.registerUntil));

    var st = el('style'); st.appendChild(document.createTextNode(CSS)); document.head.appendChild(st);

    var wrap = el('div', 'ofc-pop');
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', e.title || 'Upcoming event'); wrap.tabIndex = -1;

    var card = el('div', 'ofc-pop-card');
    var close = el('button', 'ofc-pop-close'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.innerHTML = ICON_X;
    card.appendChild(close);

    if (isToday) {
      var t = el('div', 'ofc-pop-today');
      t.appendChild(el('span', '', '\uD83C\uDF89 IT\u2019S TODAY! \uD83C\uDF89'));
      card.appendChild(t);
    }

    var img = el('img', 'ofc-pop-flyer'); img.src = e.flyer; img.alt = 'Flyer for ' + (e.title || 'event');
    card.appendChild(img);

    var body = el('div', 'ofc-pop-body');
    var chip = whenChip(diff);
    if (chip) body.appendChild(el('span', 'ofc-pop-chip', chip));
    body.appendChild(el('h2', 'ofc-pop-title', e.title || ''));
    if (e.displayDate) body.appendChild(el('p', 'ofc-pop-when', e.displayDate));

    if (regOpen) {
      var a = el('a', 'ofc-pop-btn'); a.href = e.register;
      a.appendChild(el('span', '', e.registerLabel || 'Register now'));
      a.insertAdjacentHTML('beforeend', ICON_ARROW);
      body.appendChild(a);
    } else if (isToday) {
      body.appendChild(el('p', 'ofc-pop-note', 'See you there!'));
    } else if (e.register) {
      body.appendChild(el('p', 'ofc-pop-note', 'Registration is now closed.'));
    }
    card.appendChild(body);
    wrap.appendChild(card);

    if (isToday && !reduce) { var cf = el('div', 'ofc-pop-confetti'); confetti(cf); wrap.appendChild(cf); }

    var prevOverflow = document.body.style.overflow, lastFocus = document.activeElement, closed = false;
    function shut() {
      if (closed) return; closed = true;
      store(false, key, '1');
      document.removeEventListener('keydown', onKey);
      wrap.classList.remove('is-open');
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        document.body.style.overflow = prevOverflow;
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (err) {} }
      }, 350);
    }
    function onKey(ev) {
      if (ev.key === 'Escape') { shut(); return; }
      if (ev.key !== 'Tab') return;
      var f = wrap.querySelectorAll('button,a[href]');
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && (document.activeElement === first || document.activeElement === wrap)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
    close.addEventListener('click', shut);
    wrap.addEventListener('click', function (ev) { if (ev.target === wrap) shut(); });
    document.addEventListener('keydown', onKey);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(wrap);
    void wrap.offsetWidth;
    wrap.classList.add('is-open');
    try { wrap.focus({ preventScroll: true }); } catch (err) {}
  }

  function init() {
    fetch(CFG.dataUrl + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (events) {
        var x = pick(events);
        if (!x) return;
        return imageOk(x.ev.flyer).then(function (ok) {
          if (ok) setTimeout(function () { show(x); }, CFG.delayMs);
        });
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
