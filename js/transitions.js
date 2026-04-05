/**
 * CapeLoad Page Transitions — simple fade
 * No strips, no panels, no stagger. Just opacity.
 */
(function () {
  var FADE_OUT = 180;
  var FADE_IN  = 220;

  var overlay = document.createElement('div');
  overlay.id = 'cl-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:#0a0b15',
    'opacity:1',
    'pointer-events:none',
    'transition:opacity ' + FADE_IN + 'ms ease'
  ].join(';');
  document.body.appendChild(overlay);

  function fadeOut(cb) {
    overlay.style.pointerEvents = 'all';
    overlay.style.transition = 'opacity ' + FADE_OUT + 'ms ease';
    overlay.style.opacity = '1';
    setTimeout(cb, FADE_OUT + 10);
  }

  function fadeIn() {
    overlay.style.transition = 'opacity ' + FADE_IN + 'ms ease';
    overlay.style.opacity = '0';
    setTimeout(function () { overlay.style.pointerEvents = 'none'; }, FADE_IN + 10);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link || link.target === '_blank') return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/.test(href)) return;
    if (href.includes('wa.me')) return;
    if (/^https?:\/\/(?!capeload\.vercel\.app|capeload\.co\.za|localhost|127\.)/.test(href)) return;
    e.preventDefault();
    var dest = link.href;
    fadeOut(function () { window.location.href = dest; });
  }, true);

  function runFadeIn() {
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fadeIn(); });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runFadeIn();
  } else {
    window.addEventListener('DOMContentLoaded', runFadeIn);
  }

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { overlay.style.opacity = '1'; setTimeout(fadeIn, 40); }
  });
})();
