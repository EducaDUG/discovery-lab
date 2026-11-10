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
  // Premium entrance: headings are typed in, then cards arrive from alternating sides.
  var tileBase = 0, PAN = ['right', 'down', 'left', 'up', 'in'];
  function typeIt(el, start, perChar, cap) {
    var text = el.textContent;
    if (!text.trim() || el.dataset.bpTyped) return start;
    el.dataset.bpTyped = '1';
    var chars = text.replace(/\s+/g, ' ').length, per = Math.min(perChar, cap / Math.max(chars, 1));
    el.setAttribute('aria-label', text.trim());
    el.textContent = '';
    var n = 0;
    text.split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span'); w.className = 'bp-w'; w.setAttribute('aria-hidden', 'true');
      tok.split('').forEach(function (c) {
        var ch = document.createElement('span'); ch.className = 'bp-ch'; ch.textContent = c;
        ch.style.transitionDelay = Math.round(start + n++ * per) + 'ms'; w.appendChild(ch);
      });
      el.appendChild(w);
    });
    el.classList.add('bp-typing');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('bp-typed'); }); });
    return start + n * per;
  }
  function entrance() {
    var animate = !calm() && root.getAttribute('data-dyslexia') !== 'on';
    var head = document.querySelector('.nav-title');
    var set = head ? [head.querySelector('.eyebrow'), head.querySelector('h1'), head.querySelector('.nav-title__blurb')]
      : [document.querySelector('.hero .eyebrow:not([hidden])'), document.querySelector('.hero [data-lang]:not([hidden]) h1, .hero h1'), document.querySelector('.hero [data-lang]:not([hidden]) .hero__lede, .hero__lede')];
    if (!head && !document.querySelector('.hero')) {   // standalone pages such as About: first visible h1 + its role line + lede
      var v = [].filter.call(document.querySelectorAll('main h1'), function (h) { return !h.closest('[hidden]'); })[0];
      if (v) { var box = v.parentNode; set = [box.querySelector('.profile__role, .eyebrow'), v, box.querySelector('.lede, p:not(.profile__role):not(.eyebrow)')]; }
    }
    if (!animate || !set[1] || set[1].dataset.bpTyped) { return; }
    if (set[0]) typeIt(set[0], 0, 18, 260);
    var th = typeIt(set[1], 140, 24, 620);
    var tb = set[2] ? typeIt(set[2], Math.max(th - 80, 300), 11, 640) : th;
    tileBase = Math.max(300, Math.min(tb - 250, 1000));
  }
  function enhance() {
    if (!io) return;
    entrance();
    var tags = '.nav-sec__head, .tile, .choice, .extras__card, .extras__grid > *, .prose, .facts, .bio, .connect, main > section';
    [].forEach.call(document.querySelectorAll(tags), function (el) {
      if (el.classList.contains('bp-seen')) return;
      el.classList.add('bp-seen');
      if (hasManualReveal) return;   // MoreHuman Ed already reveals its own sections
      var idx = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--bp-i', Math.min(idx, 6));
      if (el.getBoundingClientRect().top < window.innerHeight) el.style.setProperty('--bp-base', tileBase + 'ms');
      var D = [[-120, 30, -3], [0, -90, 0], [120, 30, 3], [0, 100, 0]];   // left, above, right, below
      var d = D[idx % 4];
      el.style.setProperty('--bp-x', d[0] + 'px'); el.style.setProperty('--bp-y', d[1] + 'px'); el.style.setProperty('--bp-r', d[2] + 'deg');
      var th = el.querySelector('.tile__thumb');
      if (th) th.dataset.pan = th.dataset.pan || PAN[idx % PAN.length];
      el.classList.add('bp-reveal'); io.observe(el);
    });
    [].forEach.call(document.querySelectorAll('main h2'), function (h) {
      if (h.classList.contains('bp-seen')) return;
      h.classList.add('bp-seen');
      if (calm() || root.getAttribute('data-dyslexia') === 'on') return;
      splitWords(h); io.observe(h);
    });
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    [].forEach.call(document.querySelectorAll('.tile, .choice, .card'), function (c) {
      if (c.dataset.bpSpot) return; c.dataset.bpSpot = '1'; c.classList.add('bp-spot');
      var tilt = fine && /(^| )(tile|choice)( |$)/.test(c.className);
      if (tilt) c.classList.add('bp-tilt');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (tilt) { c.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); }
      }, { passive: true });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    [].forEach.call(document.querySelectorAll('img:not([loading])'), function (im) {
      if (im.getBoundingClientRect().top > window.innerHeight) im.loading = 'lazy';
      im.decoding = 'async';
    });
  }
  enhance();
  window.dlEnhance = enhance;
  var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(enhance, 60); })
    .observe(document.body, { childList: true, subtree: true });

  // 2b. Outro: when a Discovery Lab page is left, its content eases away first, so the next page's entrance
  //     follows on smoothly instead of the screen cutting from full to empty (that cut reads as a flash).
  if (root.hasAttribute('data-age-band')) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.origin !== location.origin) return;
      if (a.pathname === location.pathname && a.search === location.search) return;
      if (window.dlRoute && window.dlRoute(a, e)) return;   // in-place navigation (no document reload)
      if (calm()) return;
      e.preventDefault();
      root.classList.add('bp-leaving');
      var go = a.href;
      setTimeout(function () { location.href = go; }, 260);
      setTimeout(function () { root.classList.remove('bp-leaving'); }, 4000);
    });
    window.addEventListener('pageshow', function () { root.classList.remove('bp-leaving'); });
  }

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

  // 4. Reader settings panel, only where a page opts in with data-panel (MoreHuman Ed)
  var me = document.currentScript || document.querySelector('script[src*="brandplus.js"]');
  if (me && me.hasAttribute('data-panel')) {
    var KEY = 'dl-a11y-v1';
    var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
    var save = function (o) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(load(), o))); } catch (e) {} };
    var es = document.documentElement.lang === 'es';
    var L = es ? { b: 'Lectura y movimiento', t: 'Ajustes de lectura', calm: 'Movimiento calmado', dys: 'Letra para dislexia', size: 'Tamaño del texto', tint: 'Fondo' }
               : { b: 'Reading and motion', t: 'Reading settings', calm: 'Calm motion', dys: 'Dyslexia-friendly font', size: 'Text size', tint: 'Background' };
    var wrap = document.createElement('div'); wrap.className = 'bp-set';
    var btn = document.createElement('button'); btn.className = 'bp-set__btn'; btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'bp-set-panel'); btn.textContent = 'Aa  ' + L.b;
    var pn = document.createElement('section'); pn.className = 'bp-set__panel'; pn.id = 'bp-set-panel'; pn.hidden = true; pn.setAttribute('aria-label', L.t);
    var h = document.createElement('h2'); h.textContent = L.t; pn.appendChild(h);
    function check(label, on, fn) {
      var r = document.createElement('label'); r.className = 'bp-set__row';
      var c = document.createElement('input'); c.type = 'checkbox'; c.checked = on; c.addEventListener('change', function () { fn(c.checked); });
      r.appendChild(c); r.appendChild(document.createTextNode(label)); pn.appendChild(r);
    }
    function seg(label, opts, cur, fn) {
      var l = document.createElement('div'); l.textContent = label; l.style.fontWeight = '700'; l.style.marginTop = '.4rem'; pn.appendChild(l);
      var g = document.createElement('div'); g.className = 'bp-set__seg'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
      opts.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.setAttribute('aria-pressed', String(cur() === o[0]));
        b.addEventListener('click', function () { fn(o[0]); [].forEach.call(g.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); });
        g.appendChild(b);
      });
      pn.appendChild(g);
    }
    var st = load();
    check(L.calm, st.motion === 'on' || (st.motion !== 'off' && mq && mq.matches), function (v) {
      save({ motion: v ? 'on' : 'off' }); root.setAttribute('data-reduced-motion', v ? 'on' : 'off'); });
    check(L.dys, !!st.dyslexia, function (v) { save({ dyslexia: v }); if (v) root.setAttribute('data-dyslexia', 'on'); else root.removeAttribute('data-dyslexia'); });
    seg(L.size, [['m', 'A'], ['l', 'A+'], ['xl', 'A++']], function () { return root.getAttribute('data-text-size') || 'm'; },
      function (v) { save({ textSize: v }); root.setAttribute('data-text-size', v); });
    seg(L.tint, [['paper', 'Paper'], ['warm', 'Warm'], ['cool', 'Cool']], function () { return root.getAttribute('data-tint') || 'paper'; },
      function (v) { save({ tint: v }); root.setAttribute('data-tint', v); });
    btn.addEventListener('click', function () { var o = pn.hidden; pn.hidden = !o; btn.setAttribute('aria-expanded', String(o)); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pn.hidden) { pn.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    wrap.appendChild(pn); wrap.appendChild(btn); document.body.appendChild(wrap);
  }
})();
