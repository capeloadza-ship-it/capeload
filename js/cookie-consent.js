/*!
 * CapeLoad Cookie Consent v1.0
 * POPIA/GDPR-compliant cookie consent management
 * Categories: necessary | analytics | marketing
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cl_cookie_consent';
  var VERSION = '1';

  var defaults = { necessary: true, analytics: false, marketing: false };

  // ── State ──────────────────────────────────────────────────────────────────
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.version !== VERSION) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function saveState(preferences) {
    var state = {
      version: VERSION,
      timestamp: Date.now(),
      preferences: Object.assign({}, defaults, preferences, { necessary: true })
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    return state;
  }

  // ── Apply consent (clear disallowed cookies, fire event) ──────────────────
  function applyConsent() {
    var prefs = CookieConsent.getPreferences();
    document.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));
    if (!prefs.analytics)  clearCookiesMatching(['_ga', '_gid', '_gat', 'cl_analytics']);
    if (!prefs.marketing)  clearCookiesMatching(['cl_marketing', '_fbp', '_fbc']);
  }

  function clearCookiesMatching(names) {
    document.cookie.split(';').forEach(function (c) {
      var name = c.trim().split('=')[0];
      if (names.some(function (n) { return name === n || name.indexOf(n) === 0; })) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  var CookieConsent = {
    /** Returns true if the user has consented to a given category. */
    hasConsent: function (category) {
      var state = loadState();
      if (!state) return category === 'necessary';
      return !!state.preferences[category];
    },
    /** Returns the full preferences object. */
    getPreferences: function () {
      var state = loadState();
      return state ? Object.assign({}, state.preferences) : Object.assign({}, defaults);
    },
    /** Accept all cookie categories. */
    acceptAll: function () {
      saveState({ necessary: true, analytics: true, marketing: true });
      hideBanner(); hideModal(); showFloatBtn(); applyConsent();
    },
    /** Accept only necessary cookies. */
    rejectNonEssential: function () {
      saveState({ necessary: true, analytics: false, marketing: false });
      hideBanner(); hideModal(); showFloatBtn(); applyConsent();
    },
    /** Save a custom preferences object. */
    savePreferences: function (prefs) {
      saveState(prefs);
      hideBanner(); hideModal(); showFloatBtn(); applyConsent();
    },
    /** Programmatically re-show the banner. */
    showBanner: function () { showBanner(); },
    /** Programmatically open the preferences modal. */
    showPreferences: function () { showModal(); },
    /** Reset consent (for testing / "withdraw consent" flows). */
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showBanner();
      var btn = document.getElementById('cl-cc-float');
      if (btn) btn.classList.remove('cl-visible');
    }
  };

  window.CookieConsent = CookieConsent;

  // ── Styles ─────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cl-cc-styles')) return;
    var style = document.createElement('style');
    style.id = 'cl-cc-styles';
    style.textContent = [
      '/* ── Cookie Consent Banner ── */',
      '#cl-cc-banner {',
      '  position:fixed;bottom:0;left:0;right:0;z-index:99999;',
      '  padding:18px 24px;background:#13141f;',
      '  border-top:1px solid rgba(255,255,255,0.08);',
      '  display:flex;align-items:center;flex-wrap:wrap;gap:14px;',
      '  font-family:"Inter",Arial,sans-serif;',
      '  box-shadow:0 -8px 40px rgba(0,0,0,0.55);',
      '  transform:translateY(100%);',
      '  transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);',
      '}',
      '#cl-cc-banner.cl-visible{transform:translateY(0);}',
      '#cl-cc-banner-text{flex:1;min-width:200px;}',
      '#cl-cc-banner-text p{font-size:13px;color:#9a9aaa;line-height:1.5;margin:0;}',
      '#cl-cc-banner-text a{color:#f15f22;}',
      '#cl-cc-banner-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}',

      '/* ── Shared button base ── */',
      '.cl-btn{',
      '  display:inline-flex;align-items:center;justify-content:center;',
      '  padding:9px 18px;border-radius:8px;',
      '  font-size:13px;font-weight:700;cursor:pointer;',
      '  font-family:"Inter",Arial,sans-serif;border:none;',
      '  white-space:nowrap;line-height:1;',
      '  transition:background 0.18s,transform 0.15s,border-color 0.18s,color 0.18s;',
      '  text-decoration:none;',
      '}',
      '.cl-btn:active{transform:scale(0.96);}',
      '.cl-btn-primary{background:#f15f22;color:#fff;}',
      '.cl-btn-primary:hover{background:#c44a18;}',
      '.cl-btn-outline{background:transparent;color:#e0e0e0;border:1.5px solid rgba(255,255,255,0.22);}',
      '.cl-btn-outline:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.4);}',
      '.cl-btn-ghost{background:transparent;color:#9a9aaa;border:none;}',
      '.cl-btn-ghost:hover{color:#e0e0e0;}',

      '/* ── Overlay & Modal ── */',
      '#cl-cc-overlay{',
      '  position:fixed;inset:0;z-index:100000;',
      '  background:rgba(0,0,0,0.72);backdrop-filter:blur(4px);',
      '  display:flex;align-items:center;justify-content:center;',
      '  padding:24px;',
      '  opacity:0;pointer-events:none;',
      '  transition:opacity 0.22s;',
      '}',
      '#cl-cc-overlay.cl-visible{opacity:1;pointer-events:all;}',
      '#cl-cc-modal{',
      '  background:#13141f;',
      '  border:1px solid rgba(255,255,255,0.08);',
      '  border-radius:16px;padding:32px;',
      '  max-width:520px;width:100%;',
      '  max-height:88vh;overflow-y:auto;',
      '  font-family:"Inter",Arial,sans-serif;',
      '  box-shadow:0 24px 80px rgba(0,0,0,0.65);',
      '  transform:scale(0.95);',
      '  transition:transform 0.22s cubic-bezier(0.16,1,0.3,1);',
      '}',
      '#cl-cc-overlay.cl-visible #cl-cc-modal{transform:scale(1);}',
      '#cl-cc-modal h2{font-size:20px;font-weight:800;color:#f0f0f0;margin:0 0 8px;}',
      '#cl-cc-modal>.cl-modal-intro{font-size:13px;color:#9a9aaa;margin:0 0 20px;line-height:1.5;}',
      '#cl-cc-modal>.cl-modal-intro a{color:#f15f22;}',

      '/* ── Category cards ── */',
      '.cl-category{',
      '  background:rgba(255,255,255,0.03);',
      '  border:1px solid rgba(255,255,255,0.07);',
      '  border-radius:12px;padding:14px 16px;',
      '  margin-bottom:10px;',
      '  display:flex;align-items:flex-start;gap:14px;',
      '}',
      '.cl-category-info{flex:1;}',
      '.cl-category-name{',
      '  font-size:14px;font-weight:700;color:#f0f0f0;',
      '  display:flex;align-items:center;gap:8px;margin-bottom:4px;',
      '}',
      '.cl-badge-required{',
      '  font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;',
      '  background:rgba(241,95,34,0.15);color:#f15f22;',
      '  padding:2px 7px;border-radius:100px;',
      '}',
      '.cl-category-desc{font-size:12px;color:#666;line-height:1.5;}',

      '/* ── Toggle switch ── */',
      '.cl-toggle{',
      '  position:relative;display:inline-block;',
      '  width:42px;height:24px;flex-shrink:0;margin-top:1px;',
      '}',
      '.cl-toggle input{opacity:0;width:0;height:0;position:absolute;}',
      '.cl-toggle-slider{',
      '  position:absolute;inset:0;cursor:pointer;',
      '  background:rgba(255,255,255,0.12);border-radius:100px;',
      '  transition:background 0.2s;',
      '}',
      '.cl-toggle-slider::before{',
      '  content:"";position:absolute;',
      '  height:18px;width:18px;left:3px;top:3px;',
      '  background:#fff;border-radius:50%;',
      '  transition:transform 0.2s;',
      '}',
      '.cl-toggle input:checked+.cl-toggle-slider{background:#f15f22;}',
      '.cl-toggle input:checked+.cl-toggle-slider::before{transform:translateX(18px);}',
      '.cl-toggle input:disabled+.cl-toggle-slider{cursor:not-allowed;opacity:0.5;}',

      '/* ── Modal footer ── */',
      '.cl-modal-actions{',
      '  display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;',
      '  margin-top:20px;padding-top:18px;',
      '  border-top:1px solid rgba(255,255,255,0.06);',
      '}',

      '/* ── Floating settings button ── */',
      '#cl-cc-float{',
      '  position:fixed;bottom:20px;left:20px;z-index:9997;',
      '  background:#13141f;border:1px solid rgba(255,255,255,0.1);',
      '  border-radius:50%;width:42px;height:42px;',
      '  display:none;align-items:center;justify-content:center;',
      '  cursor:pointer;font-size:18px;',
      '  box-shadow:0 4px 20px rgba(0,0,0,0.45);',
      '  transition:transform 0.2s,box-shadow 0.2s;',
      '  padding:0;',
      '}',
      '#cl-cc-float:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(0,0,0,0.55);}',
      '#cl-cc-float.cl-visible{display:flex;}',

      '/* ── Responsive ── */',
      '@media(max-width:600px){',
      '  #cl-cc-banner{padding:14px 16px;}',
      '  #cl-cc-banner-actions{width:100%;}',
      '  #cl-cc-banner-actions .cl-btn{flex:1;text-align:center;}',
      '  #cl-cc-modal{padding:24px 18px;border-radius:12px;}',
      '  .cl-modal-actions{justify-content:stretch;}',
      '  .cl-modal-actions .cl-btn{flex:1;text-align:center;}',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Banner ─────────────────────────────────────────────────────────────────
  function createBanner() {
    if (document.getElementById('cl-cc-banner')) return;
    var el = document.createElement('div');
    el.id = 'cl-cc-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<div id="cl-cc-banner-text">' +
        '<p>We use cookies to keep the site working and, with your consent, to understand how it\'s used. ' +
        'See our <a href="cookie-policy.html">Cookie Policy</a> for details.</p>' +
      '</div>' +
      '<div id="cl-cc-banner-actions">' +
        '<button class="cl-btn cl-btn-ghost" id="cl-cc-manage">Manage</button>' +
        '<button class="cl-btn cl-btn-outline" id="cl-cc-reject">Reject Non-Essential</button>' +
        '<button class="cl-btn cl-btn-primary" id="cl-cc-accept-all">Accept All</button>' +
      '</div>';
    document.body.appendChild(el);

    document.getElementById('cl-cc-accept-all').addEventListener('click', function () { CookieConsent.acceptAll(); });
    document.getElementById('cl-cc-reject').addEventListener('click', function () { CookieConsent.rejectNonEssential(); });
    document.getElementById('cl-cc-manage').addEventListener('click', function () { showModal(); });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('cl-visible'); });
    });
  }

  function showBanner() {
    var el = document.getElementById('cl-cc-banner');
    if (!el) { createBanner(); return; }
    el.classList.add('cl-visible');
  }

  function hideBanner() {
    var el = document.getElementById('cl-cc-banner');
    if (el) {
      el.classList.remove('cl-visible');
      // Remove from DOM after transition so it doesn't block clicks
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function buildModalHTML(prefs) {
    return (
      '<div id="cl-cc-modal" role="document">' +
        '<h2>Cookie Preferences</h2>' +
        '<p class="cl-modal-intro">' +
          'Choose which cookies you allow. Necessary cookies are always active as the site cannot function without them. ' +
          'See our <a href="cookie-policy.html">Cookie Policy</a> for full details.' +
        '</p>' +

        '<!-- Necessary -->' +
        '<div class="cl-category">' +
          '<div class="cl-category-info">' +
            '<div class="cl-category-name">Necessary <span class="cl-badge-required">Always On</span></div>' +
            '<div class="cl-category-desc">Session management, authentication tokens, and security. Cannot be disabled — the site will not work without them.</div>' +
          '</div>' +
          '<label class="cl-toggle" aria-label="Necessary cookies (always on)">' +
            '<input type="checkbox" checked disabled>' +
            '<span class="cl-toggle-slider"></span>' +
          '</label>' +
        '</div>' +

        '<!-- Analytics -->' +
        '<div class="cl-category">' +
          '<div class="cl-category-info">' +
            '<div class="cl-category-name">Analytics</div>' +
            '<div class="cl-category-desc">Helps us understand how visitors use the site — pages visited, errors, and performance. Data is aggregated and anonymised.</div>' +
          '</div>' +
          '<label class="cl-toggle" aria-label="Analytics cookies">' +
            '<input type="checkbox" id="cl-toggle-analytics"' + (prefs.analytics ? ' checked' : '') + '>' +
            '<span class="cl-toggle-slider"></span>' +
          '</label>' +
        '</div>' +

        '<!-- Marketing -->' +
        '<div class="cl-category">' +
          '<div class="cl-category-info">' +
            '<div class="cl-category-name">Marketing</div>' +
            '<div class="cl-category-desc">Used to personalise content, remember newsletter preferences, and measure the reach of promotional campaigns.</div>' +
          '</div>' +
          '<label class="cl-toggle" aria-label="Marketing cookies">' +
            '<input type="checkbox" id="cl-toggle-marketing"' + (prefs.marketing ? ' checked' : '') + '>' +
            '<span class="cl-toggle-slider"></span>' +
          '</label>' +
        '</div>' +

        '<div class="cl-modal-actions">' +
          '<button class="cl-btn cl-btn-ghost" id="cl-modal-reject">Reject Non-Essential</button>' +
          '<button class="cl-btn cl-btn-outline" id="cl-modal-save">Save Preferences</button>' +
          '<button class="cl-btn cl-btn-primary" id="cl-modal-accept-all">Accept All</button>' +
        '</div>' +
      '</div>'
    );
  }

  function createModal() {
    if (document.getElementById('cl-cc-overlay')) return;
    var prefs = CookieConsent.getPreferences();
    var overlay = document.createElement('div');
    overlay.id = 'cl-cc-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Cookie preferences');
    overlay.innerHTML = buildModalHTML(prefs);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { hideModal(); document.removeEventListener('keydown', onKey); }
    });

    document.getElementById('cl-modal-accept-all').addEventListener('click', function () { CookieConsent.acceptAll(); });
    document.getElementById('cl-modal-reject').addEventListener('click', function () { CookieConsent.rejectNonEssential(); });
    document.getElementById('cl-modal-save').addEventListener('click', function () {
      var analytics = document.getElementById('cl-toggle-analytics');
      var marketing = document.getElementById('cl-toggle-marketing');
      CookieConsent.savePreferences({
        necessary: true,
        analytics: analytics ? analytics.checked : false,
        marketing: marketing ? marketing.checked : false
      });
    });
  }

  function showModal() {
    createModal();
    // Sync toggle states to current preferences
    var prefs = CookieConsent.getPreferences();
    var a = document.getElementById('cl-toggle-analytics');
    var m = document.getElementById('cl-toggle-marketing');
    if (a) a.checked = !!prefs.analytics;
    if (m) m.checked = !!prefs.marketing;
    requestAnimationFrame(function () {
      var overlay = document.getElementById('cl-cc-overlay');
      if (overlay) overlay.classList.add('cl-visible');
    });
  }

  function hideModal() {
    var overlay = document.getElementById('cl-cc-overlay');
    if (overlay) {
      overlay.classList.remove('cl-visible');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
    }
  }

  // ── Floating settings button ───────────────────────────────────────────────
  function createFloatBtn() {
    if (document.getElementById('cl-cc-float')) return;
    var btn = document.createElement('button');
    btn.id = 'cl-cc-float';
    btn.setAttribute('aria-label', 'Cookie Settings');
    btn.setAttribute('title', 'Cookie Settings');
    btn.innerHTML = '&#x1F36A;'; // 🍪
    btn.addEventListener('click', function () { showModal(); });
    document.body.appendChild(btn);
  }

  function showFloatBtn() {
    createFloatBtn();
    var btn = document.getElementById('cl-cc-float');
    if (btn) btn.classList.add('cl-visible');
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    createFloatBtn();

    var state = loadState();
    if (!state) {
      // First visit — show consent banner after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
      } else {
        // Small delay so the page renders first
        setTimeout(createBanner, 300);
      }
    } else {
      // Returning visitor — show float button, re-apply saved consent
      showFloatBtn();
      applyConsent();
    }
  }

  init();
})();
