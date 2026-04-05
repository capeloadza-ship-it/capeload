/**
 * CapeLoad Cookie Consent Manager
 * Categories: necessary, analytics, marketing
 * Storage: localStorage + cookie flag
 * Public API: window.CookieConsent
 */
(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────────────────
  var CONSENT_KEY = 'cl_cookie_consent';
  var CONSENT_VERSION = '1';

  var CATEGORIES = {
    necessary: {
      label: 'Strictly Necessary',
      description: 'Required for the website to function correctly. These cannot be disabled.',
      examples: 'Session tokens, authentication, security, load-balancing.',
      required: true
    },
    analytics: {
      label: 'Analytics',
      description: 'Help us understand how visitors interact with our site so we can improve it.',
      examples: 'Page views, traffic sources, user journeys, heatmaps.',
      required: false
    },
    marketing: {
      label: 'Marketing',
      description: 'Used to show you relevant advertisements and measure campaign performance.',
      examples: 'Ad targeting, remarketing pixels, social media tracking.',
      required: false
    }
  };

  // ── STORAGE ───────────────────────────────────────────────────────────────────
  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.version !== CONSENT_VERSION) return null;
      return data;
    } catch (e) { return null; }
  }

  function saveConsent(preferences) {
    var data = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: preferences
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch (e) {}
    applyConsent(preferences);
    dispatchConsentEvent(preferences);
  }

  function applyConsent(preferences) {
    window.CL_CONSENT = preferences;
    // Set a lightweight cookie so server-side code can detect consent
    var exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    document.cookie = 'cl_consent=1;path=/;expires=' + exp.toUTCString() + ';SameSite=Lax';
  }

  function dispatchConsentEvent(preferences) {
    try {
      document.dispatchEvent(new CustomEvent('cl:consent', { detail: preferences, bubbles: true }));
    } catch (e) {}
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────────
  window.CookieConsent = {
    /**
     * Check if the user has consented to a given category.
     * Necessary is always true; others default to false until consent is given.
     */
    hasConsent: function (category) {
      if (category === 'necessary') return true;
      var data = getConsent();
      return !!(data && data.preferences && data.preferences[category]);
    },

    /** Return the full saved preferences object, or null if not yet set. */
    getAll: function () {
      var data = getConsent();
      return data ? data.preferences : null;
    },

    /**
     * Set a cookie if the user has consented to the given category.
     * Returns true if the cookie was set, false if consent was missing.
     * @param {string} name
     * @param {string} value
     * @param {number} days  - expiry in days (omit for session cookie)
     * @param {string} category - 'necessary' | 'analytics' | 'marketing'
     */
    setCookie: function (name, value, days, category) {
      if (!this.hasConsent(category || 'necessary')) return false;
      var expires = '';
      if (days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        expires = ';expires=' + d.toUTCString();
      }
      document.cookie = name + '=' + encodeURIComponent(value) + expires + ';path=/;SameSite=Lax';
      return true;
    },

    /** Read a cookie by name. Returns null if not found. */
    getCookie: function (name) {
      var nameEQ = name + '=';
      var parts = document.cookie.split(';');
      for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.slice(nameEQ.length));
      }
      return null;
    },

    /** Delete a cookie by name. */
    deleteCookie: function (name) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
    },

    /** Programmatically open the preferences modal. */
    openPreferences: function () { openModal(); },

    /** Wipe stored consent and re-show the banner. */
    reset: function () {
      try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
      this.deleteCookie('cl_consent');
      window.CL_CONSENT = null;
      var manageBtn = document.getElementById('cl-manage-btn');
      if (manageBtn) manageBtn.remove();
      showBanner();
    }
  };

  // ── STYLES ────────────────────────────────────────────────────────────────────
  function injectStyles() {
    var css = [
      /* ── Banner ── */
      '#cl-cookie-banner{',
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;',
        'background:#13141f;border-top:1px solid rgba(255,255,255,.1);',
        'padding:20px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;',
        'box-shadow:0 -8px 40px rgba(0,0,0,.55);',
        'animation:cl-slide-up .35s ease;',
        'font-family:"Inter",Arial,sans-serif;',
      '}',
      '@keyframes cl-slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
      '#cl-cookie-banner .cl-btext{flex:1;min-width:220px;font-size:.875rem;color:#c0c0cc;line-height:1.55}',
      '#cl-cookie-banner .cl-btext strong{display:block;color:#f0f0f0;font-size:.9375rem;margin-bottom:4px}',
      '#cl-cookie-banner .cl-btext a{color:#f15f22;text-decoration:underline;text-underline-offset:2px}',
      '#cl-cookie-banner .cl-bactions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}',

      /* ── Buttons ── */
      '.cl-btn{',
        'font-family:"Inter",Arial,sans-serif;font-size:.8125rem;font-weight:600;',
        'padding:9px 18px;border-radius:7px;border:none;cursor:pointer;',
        'transition:opacity .2s,background .2s;white-space:nowrap;line-height:1.4;',
      '}',
      '.cl-btn:hover{opacity:.82}',
      '.cl-btn-primary{background:#f15f22;color:#fff}',
      '.cl-btn-secondary{background:transparent;color:#f0f0f0;border:1px solid rgba(255,255,255,.2)}',
      '.cl-btn-ghost{background:transparent;color:#9a9aaa;padding:9px 12px;font-weight:500}',
      '.cl-btn-ghost:hover{color:#f0f0f0;opacity:1}',

      /* ── Modal overlay ── */
      '#cl-cookie-modal{',
        'position:fixed;inset:0;z-index:100000;',
        'background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;',
        'padding:20px;animation:cl-fade-in .2s ease;',
        'font-family:"Inter",Arial,sans-serif;',
      '}',
      '@keyframes cl-fade-in{from{opacity:0}to{opacity:1}}',
      '#cl-cookie-modal .cl-mbox{',
        'background:#13141f;border:1px solid rgba(255,255,255,.1);border-radius:14px;',
        'width:100%;max-width:540px;max-height:90vh;overflow-y:auto;',
        'box-shadow:0 24px 80px rgba(0,0,0,.65);animation:cl-modal-up .3s ease;',
      '}',
      '@keyframes cl-modal-up{from{transform:translateY(18px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}',
      '.cl-mhead{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 16px;border-bottom:1px solid rgba(255,255,255,.08)}',
      '.cl-mhead h2{font-size:1.1rem;font-weight:700;color:#f0f0f0}',
      '.cl-mclose{background:none;border:none;color:#9a9aaa;cursor:pointer;font-size:1.5rem;line-height:1;padding:2px 6px;transition:color .2s;font-family:inherit}',
      '.cl-mclose:hover{color:#f0f0f0}',
      '.cl-mbody{padding:20px 24px}',
      '.cl-mintro{font-size:.875rem;color:#9a9aaa;margin-bottom:20px;line-height:1.6}',
      '.cl-mintro a{color:#f15f22;text-decoration:underline;text-underline-offset:2px}',

      /* ── Category cards ── */
      '.cl-cat{background:#0f1020;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:16px;margin-bottom:12px}',
      '.cl-cat-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}',
      '.cl-cat-label{font-size:.9rem;font-weight:600;color:#f0f0f0}',
      '.cl-cat-always{font-size:.75rem;color:#f15f22;font-weight:600;padding:3px 8px;background:rgba(241,95,34,.12);border-radius:4px}',
      '.cl-cat-desc{font-size:.8125rem;color:#9a9aaa;line-height:1.55;margin-bottom:5px}',
      '.cl-cat-ex{font-size:.75rem;color:#555;line-height:1.5}',

      /* ── Toggle switch ── */
      '.cl-toggle{position:relative;width:44px;height:24px;flex-shrink:0}',
      '.cl-toggle input{opacity:0;width:0;height:0;position:absolute}',
      '.cl-ttrack{',
        'position:absolute;inset:0;background:rgba(255,255,255,.12);border-radius:12px;',
        'cursor:pointer;transition:background .25s;',
      '}',
      '.cl-ttrack::after{',
        'content:"";position:absolute;top:3px;left:3px;',
        'width:18px;height:18px;background:#fff;border-radius:50%;',
        'transition:transform .25s;box-shadow:0 1px 4px rgba(0,0,0,.35);',
      '}',
      '.cl-toggle input:checked+.cl-ttrack{background:#f15f22}',
      '.cl-toggle input:checked+.cl-ttrack::after{transform:translateX(20px)}',
      '.cl-toggle input:disabled+.cl-ttrack{cursor:not-allowed;opacity:.65}',

      /* ── Modal footer ── */
      '.cl-mfoot{padding:16px 24px 22px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}',

      /* ── Floating manage button ── */
      '#cl-manage-btn{',
        'position:fixed;bottom:16px;left:16px;z-index:99990;',
        'background:#13141f;border:1px solid rgba(255,255,255,.12);border-radius:8px;',
        'padding:7px 12px;font-family:"Inter",Arial,sans-serif;font-size:.75rem;font-weight:500;',
        'color:#9a9aaa;cursor:pointer;display:flex;align-items:center;gap:6px;',
        'transition:color .2s,border-color .2s;box-shadow:0 2px 12px rgba(0,0,0,.35);',
      '}',
      '#cl-manage-btn:hover{color:#f0f0f0;border-color:rgba(255,255,255,.25)}',
      '#cl-manage-btn svg{width:14px;height:14px;fill:currentColor;flex-shrink:0}',

      /* ── Responsive ── */
      '@media(max-width:600px){',
        '#cl-cookie-banner{flex-direction:column;align-items:stretch;padding:16px}',
        '#cl-cookie-banner .cl-bactions{justify-content:stretch}',
        '#cl-cookie-banner .cl-bactions .cl-btn{flex:1;text-align:center}',
        '.cl-mfoot{justify-content:stretch}',
        '.cl-mfoot .cl-btn{flex:1;text-align:center}',
      '}'
    ].join('');

    var el = document.createElement('style');
    el.id = 'cl-cookie-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── BANNER ────────────────────────────────────────────────────────────────────
  function showBanner() {
    if (document.getElementById('cl-cookie-banner')) return;

    var div = document.createElement('div');
    div.id = 'cl-cookie-banner';
    div.setAttribute('role', 'region');
    div.setAttribute('aria-label', 'Cookie consent');
    div.innerHTML =
      '<div class="cl-btext">' +
        '<strong>We use cookies</strong>' +
        'We use cookies to improve your experience, analyse site traffic, and serve relevant content. ' +
        'See our <a href="privacy.html">Privacy Policy</a> for details.' +
      '</div>' +
      '<div class="cl-bactions">' +
        '<button class="cl-btn cl-btn-ghost" id="cl-ban-reject">Reject All</button>' +
        '<button class="cl-btn cl-btn-secondary" id="cl-ban-manage">Manage Preferences</button>' +
        '<button class="cl-btn cl-btn-primary" id="cl-ban-accept">Accept All</button>' +
      '</div>';

    document.body.appendChild(div);

    document.getElementById('cl-ban-accept').addEventListener('click', function () {
      acceptAll(); hideBanner();
    });
    document.getElementById('cl-ban-reject').addEventListener('click', function () {
      rejectAll(); hideBanner();
    });
    document.getElementById('cl-ban-manage').addEventListener('click', function () {
      hideBanner(true); openModal();
    });
  }

  function hideBanner(instant) {
    var ban = document.getElementById('cl-cookie-banner');
    if (!ban) return;
    if (instant) { ban.remove(); return; }
    ban.style.animation = 'cl-slide-up .25s ease reverse forwards';
    setTimeout(function () { if (ban.parentNode) ban.remove(); }, 260);
  }

  // ── FLOATING MANAGE BUTTON ────────────────────────────────────────────────────
  function showManageButton() {
    if (document.getElementById('cl-manage-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'cl-manage-btn';
    btn.setAttribute('aria-label', 'Manage cookie preferences');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1zm1 16h-2v-2h2zm0-4h-2V7h2z"/>' +
      '</svg>Cookies';
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  // ── MODAL ─────────────────────────────────────────────────────────────────────
  function openModal() {
    if (document.getElementById('cl-cookie-modal')) return;

    var saved = getConsent();
    var prefs = (saved && saved.preferences) || { necessary: true, analytics: false, marketing: false };

    var catsHTML = Object.keys(CATEGORIES).map(function (key) {
      var cat = CATEGORIES[key];
      var checked = cat.required ? true : !!(prefs[key]);
      return (
        '<div class="cl-cat">' +
          '<div class="cl-cat-head">' +
            '<span class="cl-cat-label">' + cat.label + '</span>' +
            (cat.required
              ? '<span class="cl-cat-always">Always on</span>'
              : '<label class="cl-toggle" aria-label="Toggle ' + cat.label + '">' +
                  '<input type="checkbox" data-cat="' + key + '"' + (checked ? ' checked' : '') + '>' +
                  '<span class="cl-ttrack"></span>' +
                '</label>') +
          '</div>' +
          '<p class="cl-cat-desc">' + cat.description + '</p>' +
          '<p class="cl-cat-ex">e.g. ' + cat.examples + '</p>' +
        '</div>'
      );
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'cl-cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Cookie preferences');
    modal.innerHTML =
      '<div class="cl-mbox" role="document">' +
        '<div class="cl-mhead">' +
          '<h2>Cookie Preferences</h2>' +
          '<button class="cl-mclose" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="cl-mbody">' +
          '<p class="cl-mintro">' +
            'Choose which cookies you allow us to use. Strictly necessary cookies cannot be disabled as they are needed for the site to work. ' +
            'See our <a href="privacy.html">Privacy Policy</a> for more information.' +
          '</p>' +
          catsHTML +
        '</div>' +
        '<div class="cl-mfoot">' +
          '<button class="cl-btn cl-btn-ghost" id="cl-mod-reject">Reject Optional</button>' +
          '<button class="cl-btn cl-btn-secondary" id="cl-mod-save">Save Preferences</button>' +
          '<button class="cl-btn cl-btn-primary" id="cl-mod-accept">Accept All</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var closeBtn = modal.querySelector('.cl-mclose');
    closeBtn.focus();

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    modal.querySelector('#cl-mod-reject').addEventListener('click', function () {
      rejectAll(); closeModal();
    });
    modal.querySelector('#cl-mod-accept').addEventListener('click', function () {
      acceptAll(); closeModal();
    });
    modal.querySelector('#cl-mod-save').addEventListener('click', function () {
      var newPrefs = { necessary: true };
      var inputs = modal.querySelectorAll('input[data-cat]');
      for (var i = 0; i < inputs.length; i++) {
        newPrefs[inputs[i].dataset.cat] = inputs[i].checked;
      }
      saveConsent(newPrefs);
      closeModal();
    });

    document.addEventListener('keydown', onModalKey);
  }

  function closeModal() {
    var modal = document.getElementById('cl-cookie-modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
    showManageButton();
  }

  function onModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  // ── ACCEPT / REJECT ALL ───────────────────────────────────────────────────────
  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    showManageButton();
  }

  function rejectAll() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    showManageButton();
  }

  // ── INIT ──────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    var existing = getConsent();
    if (existing) {
      applyConsent(existing.preferences);
      showManageButton();
    } else {
      // Small delay so the banner doesn't block the initial paint
      setTimeout(showBanner, 900);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
