/* One Flesh Community - gentle scroll entrance for cards and headings.
   Add before </body> on any page:  <script src="ofc-polish.js" defer></script>
   If JavaScript is off (or the visitor prefers reduced motion) everything simply shows. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTOR = [
    '.section-head', '.card', '.pillar', '.org-top', '.org-mid', '.org-card', '.value-row', '.vision-block',
    '.timeline .point', '.gallery-grid .gitem', '.ofc-evcard', '.msg-card', '.contact-item', '.leader-card'
  ].join(',');

  var els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!els.length) return;
  document.documentElement.classList.add('js-reveal');
  els.forEach(function (n) { n.classList.add('rv'); });

  var io = new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty('--rv-d', (i++ % 4) * 70 + 'ms');   // small stagger within a row
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  els.forEach(function (n) { io.observe(n); });
})();
