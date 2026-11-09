/* BRAND+ behaviour - shared by Discovery Lab and MoreHuman Ed (keep copies in sync).
   Progressive enhancement: with this file missing, every page is fully visible.
   No scroll-jacking: nothing here changes scroll position, speed or direction. */
(function () {
  var root = document.documentElement;
  // Read the shared reader settings (same origin, so both sites agree).
  try {
    var p = JSON.parse(localStorage.getItem('dl-a11y-v1') || '{}');
    if (p.textSize && !root.hasAttribute('data-text-size')) root.setAttribute('data-text-size', p.textSize);
    if (p.tint && !root.hasAttribute('data-tint')) root.setAttribute('data-tint', p.tint);
    if (p.dyslexia) root.setAttribute('data-dyslexia', 'on');
    if (p.motion === 'on') root.setAttribute('data-reduced-motion', 'on');
    else if (p.motion === 'off') root.setAttribute('data-reduced-motion', 'off');
  } catch (e) {}
  root.classList.add('bp-js');
  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function calm() {
    var m = root.getAttribute('data-reduced-motion');
    return m === 'on' || (m !== 'off' && mq && mq.matches);
  }
  var hasManualReveal = !!document.querySelector('.reveal');

  // 1. Scroll progress bar (position feedback, not animation)
  var bar = document.createElement('div'); bar.className = 'bp-progress'; bar.setAttribute('aria-hidden', 'true');
  bar.appendChild(document.createElement('i')); document.body.appendChild(bar);
  var tick = false;
  function prog() {
    tick = false;
    var h = root.scrollHeight - window.innerHeight;
    bar.firstChild.style.setProperty('--p', h > 0 ? Math.min(1, window.scrollY / h).toFixed(4) : 0);
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();

  // 2. Reveal on scroll + kinetic headings, once each
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('bp-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function splitWords(h) {
    if (h.classList.contains('bp-kinetic') || h.querySelector('.word, .bp-word')) return;
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'bp-word'; w.style.setProperty('--w', Math.min(i++, 14));
            var s = document.createElement('span'); s.textContent = t; w.appendChild(s); f.appendChild(w);
          });
          n.parentNode.replaceChild(f, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
    h.classList.add('bp-kinetic');
  }
  function enhance() {
    if (!io) return;
    var tags = '.nav-sec__head, .tile, .choice, .extras__card, .extras__grid > *, .prose';
    [].forEach.call(document.querySelectorAll(tags), function (el) {
      if (el.classList.contains('bp-seen')) return;
      el.classList.add('bp-seen');
      if (hasManualReveal) return;   // MoreHuman Ed already reveals its own sections
      var idx = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--bp-i', Math.min(idx, 6));
      el.classList.add('bp-reveal'); io.observe(el);
    });
    [].forEach.call(document.querySelectorAll(hasManualReveal ? 'main h2' : 'main h1, main h2'), function (h) {
      if (h.classList.contains('bp-seen')) return;
      h.classList.add('bp-seen');
      if (calm() || root.getAttribute('data-dyslexia') === 'on') return;
      splitWords(h); io.observe(h);
    });
    [].forEach.call(document.querySelectorAll('.tile, .choice, .card'), function (c) {
      if (c.dataset.bpSpot) return; c.dataset.bpSpot = '1'; c.classList.add('bp-spot');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
    [].forEach.call(document.querySelectorAll('img:not([loading])'), function (im) {
      if (im.getBoundingClientRect().top > window.innerHeight) im.loading = 'lazy';
      im.decoding = 'async';
    });
  }
  enhance();
  var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(enhance, 60); })
    .observe(document.body, { childList: true, subtree: true });

  // 3. Smart loading: warm up the next page once intent is clear (hover, focus, touch)
  var conn = navigator.connection || {};
  if (!conn.saveData && !/2g/.test(conn.effectiveType || '')) {
    var seen = {};
    var warm = function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.origin !== location.origin || seen[a.href]) return;
      if (a.pathname === location.pathname) return;
      seen[a.href] = 1;
      var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l);
    };
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('focusin', warm);
    document.addEventListener('touchstart', warm, { passive: true });
  }
})();
