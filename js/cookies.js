/**
 * CapeLoad Cookie Consent Manager
 * Full cookie consent & preference management system.
 * Usage:
 *   CookieConsent.on('analytics', () => { /* load GA *\/ });
 *   CookieConsent.showSettings();
 *   CookieConsent.acceptAll();
 *   CookieConsent.getConsent(); // → { categories: {...}, timestamp, version }
 *   CookieConsent.reset();      // clear consent & re-show banner (dev/testing)
 */
(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var CONSENT_COOKIE   = 'cl_cookie_consent';
  var CONSENT_VERSION  = '1';        // bump if categories change
  var EXPIRY_DAYS      = 365;

  /* ── Category definitions ────────────────────────────────────── */
  var CATEGORIES = {
    necessary: {
      label:       'Necessary',
      description: 'Essential for the website to work correctly. These cookies cannot be disabled.',
      required:    true
    },
    analytics: {
      label:       'Analytics',
      description: 'Help us understand how visitors interact with our website by collecting anonymous usage data. No personal information is stored.',
      required:    false
    },
    marketing: {
      label:       'Marketing',
      description: 'Used to track visitors and display relevant ads. We currently use these for remarketing campaigns to reach potential customers.',
      required:    false
    },
    preferences: {
      label:       'Preferences',
      description: 'Allow the website to remember your settings and choices, such as your preferred language, region, or booking details.',
      required:    false
    }
  };

  /* ── Cookie utilities ────────────────────────────────────────── */
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie =
      name + '=' + encodeURIComponent(value) +
      ';expires=' + d.toUTCString() +
      ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function deleteCookie(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax';
  }

  /* ── Consent state ───────────────────────────────────────────── */
  function getConsent() {
    var raw = getCookie(CONSENT_COOKIE);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(prefs) {
    var consent = {
      version:    CONSENT_VERSION,
      timestamp:  new Date().toISOString(),
      categories: prefs
    };
    setCookie(CONSENT_COOKIE, JSON.stringify(consent), EXPIRY_DAYS);
    hideBanner();
    applyConsent(prefs);
    fireCallbacks(prefs);
    try {
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: prefs }));
    } catch (e) {}
  }

  function acceptAll() {
    var prefs = {};
    Object.keys(CATEGORIES).forEach(function (k) { prefs[k] = true; });
    saveConsent(prefs);
    hideModal();
  }

  function rejectNonEssential() {
    var prefs = {};
    Object.keys(CATEGORIES).forEach(function (k) {
      prefs[k] = !!CATEGORIES[k].required;
    });
    saveConsent(prefs);
    hideModal();
  }

  /* ── Apply consent: manage any already-set non-consented cookies ─ */
  function applyConsent(prefs) {
    // If analytics revoked, clear any analytics cookies (GA, etc.)
    if (!prefs.analytics) {
      ['_ga', '_gid', '_gat', '_gat_gtag'].forEach(function (c) { deleteCookie(c); });
    }
    // If marketing revoked, clear common marketing cookies
    if (!prefs.marketing) {
      ['_fbp', '_fbc', 'fr', '__utmz'].forEach(function (c) { deleteCookie(c); });
    }
  }

  /* ── Callback / event system ─────────────────────────────────── */
  var _callbacks = {};

  function on(category, fn) {
    if (!_callbacks[category]) _callbacks[category] = [];
    _callbacks[category].push(fn);
    // Fire immediately if already consented
    var consent = getConsent();
    if (consent && consent.categories[category]) {
      try { fn(); } catch (e) {}
    }
  }

  function fireCallbacks(prefs) {
    Object.keys(prefs).forEach(function (cat) {
      if (prefs[cat] && _callbacks[cat]) {
        _callbacks[cat].forEach(function (fn) {
          try { fn(); } catch (e) {}
        });
      }
    });
  }

  /* ── Banner / Modal visibility ───────────────────────────────── */
  function hideBanner() {
    var el = document.getElementById('cl-banner');
    if (el) {
      el.classList.remove('cl-visible');
      // Remove from DOM after transition to avoid layout impact
      setTimeout(function () {
        if (el && el.parentNode && !el.classList.contains('cl-visible')) {
          el.parentNode.removeChild(el);
        }
      }, 500);
    }
  }

  function showBanner() {
    var el = document.getElementById('cl-banner');
    if (!el) { injectUI(); el = document.getElementById('cl-banner'); }
    if (el) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add('cl-visible');
        });
      });
    }
  }

  function showModal() {
    var modal = document.getElementById('cl-modal');
    if (!modal) { injectUI(); modal = document.getElementById('cl-modal'); }
    if (!modal) return;

    // Sync toggles to current consent
    var consent = getConsent();
    Object.keys(CATEGORIES).forEach(function (k) {
      var toggle = document.getElementById('cl-toggle-' + k);
      if (!toggle) return;
      if (CATEGORIES[k].required) {
        toggle.checked  = true;
        toggle.disabled = true;
      } else {
        toggle.checked  = consent ? !!consent.categories[k] : false;
        toggle.disabled = false;
      }
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add('cl-visible');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function hideModal() {
    var modal = document.getElementById('cl-modal');
    if (modal) modal.classList.remove('cl-visible');
    document.body.style.overflow = '';
  }

  /* ── Save from modal toggles ─────────────────────────────────── */
  function saveModalPrefs() {
    var prefs = {};
    Object.keys(CATEGORIES).forEach(function (k) {
      if (CATEGORIES[k].required) {
        prefs[k] = true;
      } else {
        var toggle = document.getElementById('cl-toggle-' + k);
        prefs[k] = toggle ? toggle.checked : false;
      }
    });
    saveConsent(prefs);
    hideModal();
  }

  /* ── CSS ─────────────────────────────────────────────────────── */
  var STYLES = [
    /* ── Banner ── */
    '#cl-banner{',
      'position:fixed;bottom:0;left:0;right:0;z-index:99998;',
      'transform:translateY(110%);opacity:0;',
      'transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),opacity 0.35s ease;',
      'pointer-events:none;',
    '}',
    '#cl-banner.cl-visible{',
      'transform:translateY(0);opacity:1;pointer-events:auto;',
    '}',
    '.cl-banner-inner{',
      'background:#13141f;',
      'border-top:1px solid rgba(241,95,34,0.22);',
      'padding:18px 24px;',
      'display:flex;align-items:center;gap:20px;flex-wrap:wrap;',
      'box-shadow:0 -8px 40px rgba(0,0,0,0.45);',
      'font-family:"Inter",Arial,sans-serif;',
    '}',
    '.cl-banner-text{',
      'display:flex;align-items:flex-start;gap:14px;flex:1;min-width:260px;',
    '}',
    '.cl-banner-icon{',
      'width:24px;height:24px;flex-shrink:0;margin-top:2px;color:#f15f22;',
    '}',
    '.cl-banner-text-body{flex:1;}',
    '.cl-banner-text-body strong{',
      'display:block;font-size:14px;font-weight:700;color:#f0f0f0;margin-bottom:4px;',
    '}',
    '.cl-banner-text-body span{',
      'font-size:12.5px;color:#9a9aaa;line-height:1.6;',
    '}',
    '.cl-banner-text-body a{',
      'color:#f15f22;text-decoration:underline;text-underline-offset:2px;',
    '}',
    '.cl-banner-actions{',
      'display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap;',
    '}',

    /* ── Modal ── */
    '#cl-modal{',
      'position:fixed;inset:0;z-index:99999;',
      'display:flex;align-items:center;justify-content:center;',
      'padding:20px;',
      'pointer-events:none;opacity:0;',
      'transition:opacity 0.25s ease;',
    '}',
    '#cl-modal.cl-visible{opacity:1;pointer-events:auto;}',
    '.cl-overlay{',
      'position:absolute;inset:0;',
      'background:rgba(0,0,0,0.72);',
      'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);',
    '}',
    '.cl-modal-box{',
      'position:relative;z-index:1;',
      'background:#13141f;',
      'border:1px solid rgba(255,255,255,0.08);',
      'border-radius:16px;',
      'width:100%;max-width:520px;max-height:88vh;',
      'display:flex;flex-direction:column;',
      'box-shadow:0 24px 80px rgba(0,0,0,0.6);',
      'font-family:"Inter",Arial,sans-serif;',
      'overflow:hidden;',
    '}',
    '.cl-modal-header{',
      'display:flex;align-items:center;gap:10px;',
      'padding:20px 22px 16px;',
      'border-bottom:1px solid rgba(255,255,255,0.07);',
      'flex-shrink:0;',
    '}',
    '.cl-modal-header svg{',
      'width:22px;height:22px;flex-shrink:0;color:#f15f22;',
    '}',
    '.cl-modal-header h2{',
      'flex:1;font-size:16px;font-weight:700;color:#f0f0f0;margin:0;',
    '}',
    '.cl-close-btn{',
      'background:none;border:none;cursor:pointer;',
      'width:30px;height:30px;border-radius:6px;',
      'display:flex;align-items:center;justify-content:center;',
      'color:#9a9aaa;transition:background 0.15s,color 0.15s;',
    '}',
    '.cl-close-btn:hover{background:rgba(255,255,255,0.08);color:#f0f0f0;}',
    '.cl-close-btn svg{width:16px;height:16px;}',
    '.cl-modal-body{',
      'padding:16px 22px;overflow-y:auto;flex:1;',
    '}',
    '.cl-modal-body > p{',
      'font-size:13px;color:#9a9aaa;line-height:1.65;margin-bottom:18px;',
    '}',
    '.cl-category{',
      'display:flex;align-items:flex-start;justify-content:space-between;gap:16px;',
      'padding:14px 0;',
      'border-bottom:1px solid rgba(255,255,255,0.05);',
    '}',
    '.cl-category:last-child{border-bottom:none;}',
    '.cl-cat-info{flex:1;}',
    '.cl-cat-name{',
      'font-size:13.5px;font-weight:600;color:#f0f0f0;',
      'display:flex;align-items:center;gap:8px;margin-bottom:4px;',
    '}',
    '.cl-always-on{',
      'font-size:10.5px;font-weight:600;letter-spacing:0.5px;',
      'background:rgba(241,95,34,0.12);color:#f15f22;',
      'border:1px solid rgba(241,95,34,0.25);',
      'border-radius:4px;padding:2px 7px;',
    '}',
    '.cl-cat-desc{font-size:12px;color:#9a9aaa;line-height:1.6;}',

    /* Toggle switch */
    '.cl-toggle{',
      'position:relative;display:inline-block;',
      'width:42px;height:24px;flex-shrink:0;margin-top:2px;',
    '}',
    '.cl-toggle input{opacity:0;width:0;height:0;position:absolute;}',
    '.cl-slider{',
      'position:absolute;inset:0;',
      'background:rgba(255,255,255,0.12);',
      'border-radius:24px;cursor:pointer;',
      'transition:background 0.22s ease;',
    '}',
    '.cl-slider::before{',
      'content:"";position:absolute;',
      'width:18px;height:18px;border-radius:50%;',
      'background:#fff;',
      'left:3px;top:3px;',
      'transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1);',
      'box-shadow:0 1px 4px rgba(0,0,0,0.35);',
    '}',
    '.cl-toggle input:checked + .cl-slider{background:#f15f22;}',
    '.cl-toggle input:checked + .cl-slider::before{transform:translateX(18px);}',
    '.cl-toggle input:disabled + .cl-slider{opacity:0.6;cursor:not-allowed;}',
    '.cl-toggle input:focus-visible + .cl-slider{outline:2px solid #f15f22;outline-offset:2px;}',
    '.cl-modal-footer{',
      'padding:14px 22px 18px;',
      'border-top:1px solid rgba(255,255,255,0.07);',
      'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;',
      'flex-shrink:0;',
    '}',

    /* Shared button styles */
    '.cl-btn{',
      'display:inline-flex;align-items:center;justify-content:center;',
      'padding:9px 18px;border-radius:8px;',
      'font-size:13px;font-weight:600;',
      'cursor:pointer;border:none;',
      'font-family:"Inter",Arial,sans-serif;',
      'transition:background 0.18s,transform 0.15s,box-shadow 0.18s;',
      'white-space:nowrap;',
    '}',
    '.cl-btn:active{transform:scale(0.96);}',
    '.cl-btn-ghost{',
      'background:transparent;color:#9a9aaa;',
      'border:1px solid rgba(255,255,255,0.12);',
    '}',
    '.cl-btn-ghost:hover{background:rgba(255,255,255,0.06);color:#f0f0f0;border-color:rgba(255,255,255,0.25);}',
    '.cl-btn-secondary{',
      'background:rgba(255,255,255,0.07);color:#f0f0f0;',
      'border:1px solid rgba(255,255,255,0.1);',
    '}',
    '.cl-btn-secondary:hover{background:rgba(255,255,255,0.13);}',
    '.cl-btn-primary{',
      'background:#f15f22;color:#fff;',
      'box-shadow:0 3px 14px rgba(241,95,34,0.3);',
    '}',
    '.cl-btn-primary:hover{background:#c44a18;box-shadow:0 5px 20px rgba(241,95,34,0.4);}',

    /* Scrollbar in modal body */
    '.cl-modal-body::-webkit-scrollbar{width:4px;}',
    '.cl-modal-body::-webkit-scrollbar-track{background:transparent;}',
    '.cl-modal-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px;}',

    /* ── Mobile ── */
    '@media(max-width:600px){',
      '.cl-banner-inner{padding:14px 16px;gap:14px;}',
      '.cl-banner-actions{width:100%;justify-content:stretch;}',
      '.cl-banner-actions .cl-btn{flex:1;justify-content:center;padding:10px 8px;font-size:12.5px;}',
      '.cl-modal-box{border-radius:12px 12px 0 0;max-height:92vh;',
        'position:fixed;bottom:0;left:0;right:0;max-width:100%;',
      '}',
      '#cl-modal{align-items:flex-end;padding:0;}',
      '.cl-modal-footer{justify-content:stretch;}',
      '.cl-modal-footer .cl-btn{flex:1;justify-content:center;}',
    '}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('cl-cookie-styles')) return;
    var style = document.createElement('style');
    style.id = 'cl-cookie-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  /* ── HTML builder ────────────────────────────────────────────── */
  function buildCategoryRows() {
    return Object.keys(CATEGORIES).map(function (k) {
      var cat = CATEGORIES[k];
      return [
        '<div class="cl-category">',
          '<div class="cl-cat-info">',
            '<div class="cl-cat-name">',
              cat.label,
              cat.required ? '<span class="cl-always-on">Always Active</span>' : '',
            '</div>',
            '<div class="cl-cat-desc">' + cat.description + '</div>',
          '</div>',
          '<label class="cl-toggle" aria-label="' + cat.label + ' cookies">',
            '<input type="checkbox" id="cl-toggle-' + k + '"' + (cat.required ? ' checked disabled' : '') + '>',
            '<span class="cl-slider"></span>',
          '</label>',
        '</div>'
      ].join('');
    }).join('');
  }

  function injectUI() {
    if (document.getElementById('cl-banner')) return;

    var wrap = document.createElement('div');
    wrap.innerHTML = [
      /* ── Banner ── */
      '<div id="cl-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">',
        '<div class="cl-banner-inner">',
          '<div class="cl-banner-text">',
            '<svg class="cl-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
              '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>',
              '<path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/>',
            '</svg>',
            '<div class="cl-banner-text-body">',
              '<strong>We use cookies</strong>',
              '<span>We use cookies to improve your experience, analyse site traffic, and serve relevant content. ',
                '<a href="privacy.html#cookies">Learn more in our Privacy Policy</a>.',
              '</span>',
            '</div>',
          '</div>',
          '<div class="cl-banner-actions">',
            '<button class="cl-btn cl-btn-ghost" id="cl-manage-btn">Manage Preferences</button>',
            '<button class="cl-btn cl-btn-secondary" id="cl-reject-btn">Reject Non-Essential</button>',
            '<button class="cl-btn cl-btn-primary" id="cl-accept-btn">Accept All</button>',
          '</div>',
        '</div>',
      '</div>',

      /* ── Modal ── */
      '<div id="cl-modal" role="dialog" aria-modal="true" aria-label="Cookie preferences">',
        '<div class="cl-overlay" id="cl-overlay"></div>',
        '<div class="cl-modal-box">',
          '<div class="cl-modal-header">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
              '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>',
              '<path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/>',
            '</svg>',
            '<h2>Cookie Preferences</h2>',
            '<button class="cl-close-btn" id="cl-modal-close" aria-label="Close preferences">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            '</button>',
          '</div>',
          '<div class="cl-modal-body">',
            '<p>Manage your cookie preferences below. You can enable or disable each category at any time. Necessary cookies are always active — they keep the website working properly.</p>',
            buildCategoryRows(),
          '</div>',
          '<div class="cl-modal-footer">',
            '<button class="cl-btn cl-btn-ghost" id="cl-reject-all-btn">Reject Non-Essential</button>',
            '<button class="cl-btn cl-btn-secondary" id="cl-save-prefs-btn">Save Preferences</button>',
            '<button class="cl-btn cl-btn-primary" id="cl-accept-all-btn">Accept All</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(wrap);

    /* ── Wire up events ── */
    document.getElementById('cl-accept-btn').addEventListener('click', acceptAll);
    document.getElementById('cl-reject-btn').addEventListener('click', rejectNonEssential);
    document.getElementById('cl-manage-btn').addEventListener('click', function () {
      hideBanner();
      showModal();
    });

    document.getElementById('cl-modal-close').addEventListener('click', function () {
      hideModal();
      if (!getConsent()) showBanner();
    });
    document.getElementById('cl-overlay').addEventListener('click', function () {
      hideModal();
      if (!getConsent()) showBanner();
    });

    document.getElementById('cl-accept-all-btn').addEventListener('click', acceptAll);
    document.getElementById('cl-reject-all-btn').addEventListener('click', rejectNonEssential);
    document.getElementById('cl-save-prefs-btn').addEventListener('click', saveModalPrefs);

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('cl-modal');
        if (modal && modal.classList.contains('cl-visible')) {
          hideModal();
          if (!getConsent()) showBanner();
        }
      }
    });
  }

  /* ── Public API ──────────────────────────────────────────────── */
  window.CookieConsent = {
    /**
     * Register a callback to fire when a category is consented to.
     * If consent already exists for that category, fires immediately.
     * @param {string} category - 'analytics' | 'marketing' | 'preferences' | 'necessary'
     * @param {function} fn
     */
    on: on,

    /** Open the preferences modal */
    showSettings: showModal,

    /** Show the consent banner */
    showBanner: showBanner,

    /** Accept all cookie categories */
    acceptAll: acceptAll,

    /** Reject all non-essential categories */
    rejectNonEssential: rejectNonEssential,

    /**
     * Return current consent object, or null if not yet given.
     * Shape: { version, timestamp, categories: { necessary, analytics, marketing, preferences } }
     */
    getConsent: getConsent,

    /**
     * Check if a specific category is consented to.
     * @param {string} category
     * @returns {boolean}
     */
    hasConsent: function (category) {
      var c = getConsent();
      return c ? !!c.categories[category] : false;
    },

    /**
     * Clear stored consent and re-show the banner.
     * Useful for testing or "withdraw consent" flows.
     */
    reset: function () {
      deleteCookie(CONSENT_COOKIE);
      // Re-inject UI if it was removed
      injectUI();
      showBanner();
    }
  };

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectUI();

    var consent = getConsent();
    if (!consent) {
      // Slight delay so it doesn't flash during page load
      setTimeout(showBanner, 900);
    } else {
      // Apply existing consent (fire registered callbacks, clean up revoked cookies)
      applyConsent(consent.categories);
      fireCallbacks(consent.categories);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
