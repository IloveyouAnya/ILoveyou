(function () {
  'use strict';
  var heartEl = document.getElementById('heart'),
      centerEl = document.getElementById('center'),
      anya = document.getElementById('anya'),
      ily = document.getElementById('iloveyou'),
      glow = document.getElementById('glow');
  var labels = [], shown = 0, device = '', started = false;

  /* ---------- detect phone / computer ---------- */
  function detectDevice() {
    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    var ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    return (coarse || ua || innerWidth < 700) ? 'mobile' : 'desktop';
  }

  /* ---------- heart outline ---------- */
  function H(t) {
    return [16 * Math.pow(Math.sin(t), 3),
            13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)];
  }
  function metrics() {
    var w = innerWidth, h = innerHeight, mob = device === 'mobile';
    var s = Math.min(w * (mob ? 0.95 : 0.9) / 33, h * (mob ? 0.7 : 0.76) / 29.5);
    var f = mob ? Math.max(8, s * 0.8) : Math.max(9, s * 0.62);
    return { w: w, h: h, s: s, f: f };
  }
  function measureWord(f) {
    var m = document.createElement('div');
    m.className = 'l'; m.textContent = 'I love you';
    m.style.fontSize = f + 'px'; m.style.left = '-9999px';
    heartEl.appendChild(m);
    var w = m.offsetWidth; heartEl.removeChild(m);
    return w || f * 5.3;
  }

  /* ---------- fill the heart with NON-overlapping "I love you" ---------- */
  function build() {
    heartEl.innerHTML = '';
    labels = [];
    var m = metrics(), s = m.s, f = m.f, w = measureWord(f);
    var mx = m.w / 2, my = m.h / 2;

    /* centre texts (sized first so the words can keep clear of them) */
    var big = Math.min(m.w * 0.36, m.h * 0.3), small = Math.max(18, s * 2.1), f2 = Math.max(13, s * 1.0);
    centerEl.style.left = mx + 'px';
    centerEl.style.top = my + 'px';
    anya.style.fontSize = small + 'px';
    anya.style.setProperty('--k', (big / small).toFixed(3));
    ily.style.fontSize = f2 + 'px';
    var ilyY = -(small * 0.62 + f2 * 0.8);
    ily.style.top = ilyY + 'px';
    var halfW = Math.max(anya.offsetWidth, ily.offsetWidth) / 2 + f * 0.6,
        zTop = my + ilyY - f2 * 0.75 - f * 0.3,
        zBot = my + small * 0.62 + f * 0.3;

    var TILT = 11 * Math.PI / 180, textH = f * 0.85,
        bw = w * Math.cos(TILT) + textH * Math.sin(TILT),
        bh = w * Math.sin(TILT) + textH * Math.cos(TILT);
    w = bw;
    var N = 400, boxH = bh, pitch = bh * 1.02, gap = f * 0.25;

    function layout(cy, useZone) {
      var pts = [];
      for (var k = 0; k <= N; k++) {
        var p = H(k / N * Math.PI * 2);
        pts.push([mx + p[0] * s, cy - p[1] * s]);
      }
      function inside(x, y) {
        var c = false;
        for (var i = 0, j = N - 1; i < N; j = i++) {
          var a = pts[i], b = pts[j];
          if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
        }
        return c;
      }
      function fits(x, y) { var h = boxH / 2; return inside(x, y) && inside(x, y - h) && inside(x, y + h); }
      var out = [], yTop = cy - 12.3 * s, yBot = cy + 17 * s;
      for (var ry = yTop + boxH / 2; ry < yBot - boxH / 2; ry += pitch) {
        var xs = [];
        for (var i = 0; i < N; i++) {
          var a = pts[i], b = pts[i + 1];
          if ((ry - a[1]) * (ry - b[1]) < 0) xs.push(a[0] + (ry - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort(function (p, q) { return p - q; });
        for (var j = 0; j + 1 < xs.length; j += 2) {
          var L = xs[j], R = xs[j + 1];
          while (L < R && !fits(L, ry)) L += 1;
          while (R > L && !fits(R, ry)) R -= 1;
          var span = R - L, cnt = Math.floor((span + gap) / (w + gap));
          if (cnt < 1) continue;
          var start = L + (span - (cnt * w + (cnt - 1) * gap)) / 2;
          for (var q = 0; q < cnt; q++) {
            var x = start + w / 2 + q * (w + gap), x0 = x - w / 2, x1 = x + w / 2, y0 = ry - boxH / 2, y1 = ry + boxH / 2;
            if (useZone && x1 > mx - halfW && x0 < mx + halfW && y1 > zTop && y0 < zBot) continue;
            if (!(inside(x0, y0) && inside(x1, y0) && inside(x0, y1) && inside(x1, y1) && inside(x, y0) && inside(x, y1))) continue;
            out.push({ x: x, y: ry });
          }
        }
      }
      return out;
    }

    /* put the heart's visual centre exactly at the screen centre */
    var cy0 = my - 2.5 * s, first = layout(cy0, false), sumY = 0;
    first.forEach(function (o) { sumY += o.y; });
    var cy = cy0 + (my - sumY / first.length);
    var spots = layout(cy, false), maxD = 1;
    spots.forEach(function (o) { o.d = Math.hypot(o.x - mx, o.y - my); if (o.d > maxD) maxD = o.d; });

    spots.forEach(function (o) {
      var e = document.createElement('div');
      e.className = 'l'; e.textContent = 'I love you';
      var pink = Math.random() < 0.5;
      e.style.setProperty('--c', pink
        ? 'hsl(' + (322 + Math.random() * 20) + ',' + (88 + Math.random() * 12) + '%,' + (66 + Math.random() * 12) + '%)'
        : 'hsl(' + ((352 + Math.random() * 10) % 360) + ',' + (88 + Math.random() * 12) + '%,' + (44 + Math.random() * 10) + '%)');
      var tilt = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 7);
      e.style.setProperty('--t', tilt.toFixed(1) + 'deg');
      e.style.setProperty('--dx', (mx - o.x) + 'px');          /* start at the centre... */
      e.style.setProperty('--dy', (my - o.y) + 'px');
      e.style.setProperty('--r', (tilt + (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 220)).toFixed(0) + 'deg');
      e.style.setProperty('--dur', (0.9 + 0.9 * o.d / maxD).toFixed(2) + 's');
      e.style.fontSize = f + 'px';
      o.el = e;
      o.a = (Math.atan2(o.y - my, o.x - mx) + Math.PI) / (2 * Math.PI);
      o.key = o.d / maxD + o.a * 0.35 + (Math.random() - 0.5) * 0.04;
      labels.push(o);
    });

    /* appearance order: a swirl that spirals out from the centre */
    labels.sort(function (a, b) { return a.key - b.key; });

    var frag = document.createDocumentFragment();
    labels.forEach(function (o, i) {
      o.el.style.left = o.x + 'px'; o.el.style.top = o.y + 'px';
      if (i < shown) o.el.classList.add('on');
      frag.appendChild(o.el);
    });
    heartEl.appendChild(frag);
  }

  /* ---------- sparkles ---------- */
  var cv = document.getElementById('bg'), c2 = cv.getContext('2d'), P = [],
      dpr = Math.min(2, window.devicePixelRatio || 1);
  function sizeCanvas() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  function spawn(x, y, mode) {
    var a = Math.random() * 6.283,
        v = mode === 2 ? 2 + Math.random() * 5 : mode === 1 ? 0.6 + Math.random() * 1.6 : 0;
    P.push({
      x: x, y: y, vx: Math.cos(a) * v * dpr,
      vy: mode ? Math.sin(a) * v * dpr : -(0.2 + Math.random() * 0.7) * dpr,
      r: (1 + Math.random() * 2.2) * dpr, h: 335 + Math.random() * 30,
      l: 0, max: mode === 2 ? 90 : mode === 1 ? 45 : 300 + Math.random() * 300, b: mode
    });
  }
  function burst() { for (var i = 0; i < (device === 'mobile' ? 110 : 160); i++) spawn(cv.width / 2, cv.height / 2, 2); }
  function tick() {
    c2.clearRect(0, 0, cv.width, cv.height);
    var cap = device === 'mobile' ? 60 : 110;
    if (P.length < cap && Math.random() < 0.35) spawn(Math.random() * cv.width, cv.height + 10, 0);
    var blur = (device === 'mobile' ? 5 : 10) * dpr;
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i]; p.l++; p.x += p.vx; p.y += p.vy;
      if (p.b) { p.vx *= 0.96; p.vy *= 0.96; }
      if (p.l >= p.max) { P.splice(i, 1); continue; }
      var a = Math.sin(Math.PI * p.l / p.max);
      c2.beginPath(); c2.arc(p.x, p.y, p.r, 0, 6.283);
      c2.fillStyle = 'hsla(' + p.h + ',100%,68%,' + (a * 0.85) + ')';
      c2.shadowColor = 'hsl(' + p.h + ',100%,60%)'; c2.shadowBlur = blur; c2.fill();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- sequence: runs once when the page opens ---------- */
  var FILL_MS = 4200;
  function reveal(i) {
    var o = labels[i];
    if (!o) return;
    o.el.classList.add('show');
    if (i % 3 === 0) for (var k = 0; k < 2; k++) spawn(o.x * dpr, o.y * dpr, 1);
  }
  function fill() {
    burst();
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / FILL_MS);
      var target = Math.round(labels.length * Math.pow(p, 1.1));
      while (shown < target && shown < labels.length) reveal(shown++);
      glow.style.opacity = (0.15 + p * 0.85).toFixed(2);
      glow.style.transform = 'translate(-50%,-50%) scale(' + (0.5 + p * 0.7).toFixed(2) + ')';
      if (p < 1) { requestAnimationFrame(step); return; }
      while (shown < labels.length) reveal(shown++);
      setTimeout(finish, 1400);
    })(t0);
  }
  function finish() {
    ily.classList.add('on');
    heartEl.classList.add('beat');
    burst();
  }
  function play() {
    if (started) return; started = true;
    anya.classList.add('in');
    setTimeout(function () { anya.classList.add('shrink'); }, 1800);
    setTimeout(fill, 3700);
  }

  /* ---------- start + fit to the screen ---------- */
  function setup() {
    device = detectDevice();
    document.documentElement.setAttribute('data-device', device);
    build(); sizeCanvas();
  }
  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(setup, 120); }
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);

  var booted = false;
  function boot() { if (booted) return; booted = true; setup(); tick(); play(); }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('600 16px Poppins'), document.fonts.load('700 16px "Dancing Script"')])
      .then(boot, boot);
    setTimeout(boot, 1500);
  } else boot();
})();
