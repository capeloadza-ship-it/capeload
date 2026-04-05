/**
 * CapeLoad Page Transitions
 * Curtain-strip reveal effect between pages.
 * 7 vertical strips sweep up covering the page, then retract to reveal the next.
 */
(function () {
  var STRIP_COUNT = 7;
  var COLORS = ['#f15f22','#0a0b15','#f15f22','#2b3990','#f15f22','#0a0b15','#f15f22'];
  var COVER_DURATION = 380;   // ms per strip stagger base
  var REVEAL_DURATION = 360;
  var STAGGER = 48;

  /* ── build overlay DOM ── */
  var overlay = document.createElement('div');
  overlay.id = 'cl-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:99999',
    'pointer-events:none',
    'display:flex',
    'overflow:hidden'
  ].join(';');

  var strips = [];
  for (var i = 0; i < STRIP_COUNT; i++) {
    var s = document.createElement('div');
    s.style.cssText = [
      'flex:1',
      'height:100%',
      'background:' + COLORS[i],
      'transform:scaleY(0)',
      'transform-origin:bottom',
      'will-change:transform',
      'transition:transform ' + COVER_DURATION + 'ms cubic-bezier(0.76,0,0.24,1) ' + (i * STAGGER) + 'ms'
    ].join(';');
    overlay.appendChild(s);
    strips.push(s);
  }

  /* logo centred over strips */
  var logoWrap = document.createElement('div');
  logoWrap.style.cssText = [
    'position:absolute',
    'inset:0',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.25s ease 0.3s'
  ].join(';');
  var logoImg = document.createElement('img');
  logoImg.src = (document.querySelector('script[src*="transitions"]') || {src:''}).src.replace(/js\/transitions\.js.*/, '') + 'images/logo-light.png';
  /* fallback – derive from current page location */
  if (!logoImg.src || logoImg.src === 'images/logo-light.png') {
    logoImg.src = window.location.origin + '/images/logo-light.png';
  }
  logoImg.style.cssText = 'height:90px;width:auto;';
  logoWrap.appendChild(logoImg);
  overlay.appendChild(logoWrap);

  document.body.appendChild(overlay);

  /* ── helpers ── */
  function cover(cb) {
    overlay.style.pointerEvents = 'all';
    var lastDelay = (STRIP_COUNT - 1) * STAGGER + COVER_DURATION;
    strips.forEach(function (s, i) {
      s.style.transitionDelay = (i * STAGGER) + 'ms';
      s.style.transformOrigin = 'bottom';
      s.style.transform = 'scaleY(1)';
    });
    logoWrap.style.opacity = '1';
    setTimeout(function () { cb && cb(); }, lastDelay + 60);
  }

  function reveal() {
    /* reverse stagger – retract from top, outer strips first */
    var order = [0, 6, 1, 5, 2, 4, 3]; // wave from edges in
    strips.forEach(function (s, i) {
      var pos = order.indexOf(i);
      s.style.transition = 'transform ' + REVEAL_DURATION + 'ms cubic-bezier(0.76,0,0.24,1) ' + (pos * STAGGER) + 'ms';
      s.style.transformOrigin = 'top';
      s.style.transform = 'scaleY(0)';
    });
    logoWrap.style.transition = 'opacity 0.15s ease 0s';
    logoWrap.style.opacity = '0';
    var lastDelay = 6 * STAGGER + REVEAL_DURATION;
    setTimeout(function () {
      overlay.style.pointerEvents = 'none';
      /* reset for next cover */
      strips.forEach(function (s, idx) {
        s.style.transition = 'none';
        s.style.transformOrigin = 'bottom';
        /* keep scaleY(0) — already there */
      });
      logoWrap.style.transition = 'opacity 0.25s ease 0.3s';
    }, lastDelay + 80);
  }

  /* ── intercept link clicks ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;
    /* skip external, mailto, tel, hash, new-tab */
    if (link.target === '_blank') return;
    if (/^(mailto:|tel:|#|javascript:|https?:\/\/((?!capeload\.vercel\.app|localhost|127\.0\.0\.1).))/.test(href)) return;
    if (href.startsWith('#')) return;
    /* skip wa.me */
    if (href.includes('wa.me')) return;

    e.preventDefault();
    var dest = link.href;

    cover(function () {
      window.location.href = dest;
    });
  }, true);

  /* ── reveal on page load ── */
  function runReveal() {
    /* small tick to ensure styles are painted */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        reveal();
      });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    /* strips start covered, reveal now */
    strips.forEach(function (s) { s.style.transform = 'scaleY(1)'; });
    logoWrap.style.opacity = '1';
    runReveal();
  } else {
    /* set covered state immediately to avoid flash */
    strips.forEach(function (s) { s.style.transform = 'scaleY(1)'; });
    logoWrap.style.opacity = '1';
    window.addEventListener('DOMContentLoaded', runReveal);
  }

  /* handle browser back/forward */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      strips.forEach(function (s) {
        s.style.transition = 'none';
        s.style.transform = 'scaleY(1)';
      });
      logoWrap.style.opacity = '1';
      setTimeout(runReveal, 50);
    }
  });
})();
