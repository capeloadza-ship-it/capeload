/**
 * CapeLoad Page Transitions — fast single-panel drop
 * Cover: orange panel drops from top in 200ms
 * Reveal: panel falls away to bottom in 280ms
 * One element, zero stagger, GPU-accelerated
 */
(function () {
  var COVER  = 200;
  var REVEAL = 280;

  /* ── overlay ── */
  var overlay = document.createElement('div');
  overlay.id = 'cl-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'pointer-events:none',
    'background:linear-gradient(160deg,#f15f22 0%,#c44a18 55%,#2b3990 100%)',
    'transform:translateY(-101%)',
    'will-change:transform'
  ].join(';');

  var logo = document.createElement('img');
  logo.src = '/images/logo-light.png';
  logo.style.cssText = [
    'position:absolute', 'top:50%', 'left:50%',
    'transform:translate(-50%,-50%)',
    'height:80px', 'width:auto',
    'opacity:0', 'transition:opacity 0.15s ease 0.08s'
  ].join(';');
  overlay.appendChild(logo);
  document.body.appendChild(overlay);

  /* ── helpers ── */
  function cover(cb) {
    overlay.style.pointerEvents = 'all';
    overlay.style.transition = 'transform ' + COVER + 'ms cubic-bezier(0.76,0,0.24,1)';
    overlay.style.transform = 'translateY(0)';
    logo.style.opacity = '1';
    setTimeout(cb, COVER + 20);
  }

  function reveal() {
    overlay.style.transition = 'transform ' + REVEAL + 'ms cubic-bezier(0.76,0,0.24,1)';
    overlay.style.transform = 'translateY(101%)';
    logo.style.transition = 'opacity 0.1s ease';
    logo.style.opacity = '0';
    setTimeout(function () {
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'none';
      overlay.style.transform = 'translateY(-101%)';
      logo.style.transition = 'opacity 0.15s ease 0.08s';
    }, REVEAL + 30);
  }

  /* ── intercept link clicks ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank') return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/.test(href)) return;
    if (href.includes('wa.me')) return;
    if (/^https?:\/\/(?!capeload\.vercel\.app|localhost|127\.)/.test(href)) return;
    e.preventDefault();
    var dest = link.href;
    cover(function () { window.location.href = dest; });
  }, true);

  /* ── reveal on page load ── */
  function runReveal() {
    overlay.style.transition = 'none';
    overlay.style.transform = 'translateY(0)';
    logo.style.opacity = '1';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { reveal(); });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runReveal();
  } else {
    window.addEventListener('DOMContentLoaded', runReveal);
  }

  /* ── browser back/forward ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.style.transition = 'none';
      overlay.style.transform = 'translateY(0)';
      logo.style.opacity = '1';
      setTimeout(runReveal, 40);
    }
  });
})();
