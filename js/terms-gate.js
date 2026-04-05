/*!
 * CapeLoad Terms Gate v1.0
 * Blocking first-visit modal — user must agree to Terms & Privacy before continuing.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cl_terms_agreed';
  var VERSION = '1';

  function hasAgreed() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      return parsed.version === VERSION;
    } catch (e) { return false; }
  }

  function recordAgreement() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: VERSION,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('cl-tg-styles')) return;
    var style = document.createElement('style');
    style.id = 'cl-tg-styles';
    style.textContent = [
      '#cl-tg-overlay {',
      '  position: fixed; inset: 0; z-index: 200000;',
      '  background: rgba(0,0,0,0.88); backdrop-filter: blur(6px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 24px;',
      '  font-family: "Inter", Arial, sans-serif;',
      '  opacity: 0; transition: opacity 0.3s;',
      '}',
      '#cl-tg-overlay.cl-tg-visible { opacity: 1; }',

      '#cl-tg-modal {',
      '  background: #13141f;',
      '  border: 1px solid rgba(255,255,255,0.1);',
      '  border-radius: 18px;',
      '  padding: 36px 32px 28px;',
      '  max-width: 460px; width: 100%;',
      '  box-shadow: 0 32px 90px rgba(0,0,0,0.7);',
      '  transform: scale(0.94);',
      '  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);',
      '}',
      '#cl-tg-overlay.cl-tg-visible #cl-tg-modal { transform: scale(1); }',

      '#cl-tg-logo {',
      '  display: block; height: 52px; width: auto; margin: 0 auto 20px;',
      '}',

      '#cl-tg-modal h2 {',
      '  font-size: 20px; font-weight: 800; color: #f0f0f0;',
      '  text-align: center; margin: 0 0 8px;',
      '}',

      '#cl-tg-modal p {',
      '  font-size: 13px; color: #9a9aaa; text-align: center;',
      '  line-height: 1.55; margin: 0 0 24px;',
      '}',
      '#cl-tg-modal p a { color: #f15f22; text-decoration: underline; }',

      '.cl-tg-divider {',
      '  height: 1px; background: rgba(255,255,255,0.07); margin: 0 0 20px;',
      '}',

      '.cl-tg-check-row {',
      '  display: flex; align-items: flex-start; gap: 12px;',
      '  margin-bottom: 22px; cursor: pointer;',
      '}',

      '#cl-tg-checkbox {',
      '  appearance: none; -webkit-appearance: none;',
      '  width: 20px; height: 20px; flex-shrink: 0;',
      '  border: 2px solid rgba(255,255,255,0.2);',
      '  border-radius: 6px; background: transparent;',
      '  cursor: pointer; margin-top: 1px;',
      '  transition: background 0.15s, border-color 0.15s;',
      '  position: relative;',
      '}',
      '#cl-tg-checkbox:checked {',
      '  background: #f15f22; border-color: #f15f22;',
      '}',
      '#cl-tg-checkbox:checked::after {',
      '  content: "";',
      '  position: absolute; left: 5px; top: 2px;',
      '  width: 6px; height: 10px;',
      '  border: 2px solid #fff; border-top: none; border-left: none;',
      '  transform: rotate(45deg);',
      '}',

      '.cl-tg-check-label {',
      '  font-size: 13px; color: #9a9aaa; line-height: 1.5;',
      '}',
      '.cl-tg-check-label a { color: #f15f22; text-decoration: underline; }',

      '#cl-tg-agree {',
      '  width: 100%;',
      '  padding: 13px;',
      '  background: #f15f22; color: #fff;',
      '  border: none; border-radius: 10px;',
      '  font-size: 15px; font-weight: 700;',
      '  cursor: pointer; font-family: inherit;',
      '  transition: background 0.18s, opacity 0.18s, transform 0.15s;',
      '  box-shadow: 0 4px 18px rgba(241,95,34,0.35);',
      '}',
      '#cl-tg-agree:disabled {',
      '  opacity: 0.35; cursor: not-allowed; transform: none !important;',
      '}',
      '#cl-tg-agree:not(:disabled):hover {',
      '  background: #c44a18; transform: translateY(-1px);',
      '}',
      '#cl-tg-agree:not(:disabled):active { transform: scale(0.97); }',

      '.cl-tg-note {',
      '  font-size: 11px; color: #444; text-align: center;',
      '  margin-top: 14px; line-height: 1.4;',
      '}',

      '@media (max-width: 480px) {',
      '  #cl-tg-modal { padding: 28px 20px 22px; border-radius: 14px; }',
      '  #cl-tg-modal h2 { font-size: 18px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createGate() {
    if (document.getElementById('cl-tg-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'cl-tg-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Terms of Service agreement');

    overlay.innerHTML =
      '<div id="cl-tg-modal">' +
        '<img id="cl-tg-logo" src="images/logo-light.png" alt="CapeLoad Logistics">' +
        '<h2>Before you continue</h2>' +
        '<p>CapeLoad connects you with verified drivers across the Western Cape. By using this site you agree to our terms and acknowledge how we handle your information.</p>' +
        '<div class="cl-tg-divider"></div>' +
        '<label class="cl-tg-check-row" for="cl-tg-checkbox">' +
          '<input type="checkbox" id="cl-tg-checkbox">' +
          '<span class="cl-tg-check-label">I have read and agree to the ' +
            '<a href="terms.html" target="_blank" onclick="event.stopPropagation()">Terms of Service</a> and ' +
            '<a href="privacy.html" target="_blank" onclick="event.stopPropagation()">Privacy Policy</a>.' +
          '</span>' +
        '</label>' +
        '<button id="cl-tg-agree" disabled>Agree &amp; Continue</button>' +
        '<p class="cl-tg-note">You can review your cookie preferences at any time using the cookie icon at the bottom of the page.</p>' +
      '</div>';

    document.body.appendChild(overlay);

    // Prevent scrolling while gate is open
    document.body.style.overflow = 'hidden';

    var checkbox = document.getElementById('cl-tg-checkbox');
    var agreeBtn = document.getElementById('cl-tg-agree');

    checkbox.addEventListener('change', function () {
      agreeBtn.disabled = !checkbox.checked;
    });

    agreeBtn.addEventListener('click', function () {
      if (!checkbox.checked) return;
      recordAgreement();
      dismiss();
    });

    // Animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('cl-tg-visible'); });
    });
  }

  function dismiss() {
    var overlay = document.getElementById('cl-tg-overlay');
    if (!overlay) return;
    overlay.classList.remove('cl-tg-visible');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      // Show cookie banner after terms are agreed (if not yet consented)
      if (window.CookieConsent && typeof window.CookieConsent.showBanner === 'function') {
        var stored = localStorage.getItem('cl_cookie_consent');
        if (!stored) window.CookieConsent.showBanner();
      }
    }, 350);
  }

  function init() {
    injectStyles();
    if (hasAgreed()) return; // Already agreed — do nothing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createGate);
    } else {
      setTimeout(createGate, 100);
    }
  }

  init();
})();
