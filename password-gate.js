/* Shared password gate — styled modal + 30-day local unlock */
(function (global) {
  'use strict';

  var PASSWORD_SALT = 'mariellopez-portfolio-v2';
  var PASSWORD_HASH = '22af7702635f2377642213e8635eeec686ecfb169865653ac3ccfb2baa59dd10';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var CASE_ACCESS_KEY = 'portfolio_case_access_v3';
  var LOCKOUT_AFTER = 8;
  var LOCKOUT_MS = 15000;
  var failCount = 0;
  var lockUntil = 0;

  var modal = null;
  var inputEl = null;
  var errorEl = null;
  var titleEl = null;
  var submitBtn = null;
  var cancelBtn = null;
  var backdropEl = null;
  var pending = null;
  var lastFocus = null;

  function isGranted(key) {
    key = key || CASE_ACCESS_KEY;
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || typeof data.expires !== 'number' || Date.now() > data.expires) {
        localStorage.removeItem(key);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function grant(key) {
    key = key || CASE_ACCESS_KEY;
    try {
      localStorage.setItem(key, JSON.stringify({ expires: Date.now() + TTL_MS }));
    } catch (e) {}
  }

  function hashesEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function hashPassword(input) {
    var data = new TextEncoder().encode(PASSWORD_SALT + '\0' + String(input).trim());
    return window.crypto.subtle.digest('SHA-256', data).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  try {
    localStorage.removeItem('portfolio_case_access');
    localStorage.removeItem('portfolio_case_access_v2');
  } catch (e) {}

  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'pw-modal';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="pw-modal__backdrop" data-pw-dismiss></div>' +
      '<div class="pw-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pw-modal-title">' +
        '<p class="pw-modal__eyebrow">Protected work</p>' +
        '<h2 class="pw-modal__title" id="pw-modal-title">Enter password</h2>' +
        '<p class="pw-modal__copy">A password is required to enter this page.</p>' +
        '<form class="pw-modal__form" novalidate>' +
          '<label class="pw-modal__label" for="pw-modal-input">Password</label>' +
          '<input class="pw-modal__input" id="pw-modal-input" type="password" name="password" autocomplete="current-password" spellcheck="false" placeholder="Password" required />' +
          '<p class="pw-modal__error" data-pw-error role="status" aria-live="polite"></p>' +
          '<div class="pw-modal__actions">' +
            '<button type="button" class="pw-modal__btn pw-modal__btn--ghost" data-pw-cancel>Cancel</button>' +
            '<button type="submit" class="pw-modal__btn pw-modal__btn--primary">Continue</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    (document.body || document.documentElement).appendChild(modal);

    inputEl = modal.querySelector('#pw-modal-input');
    errorEl = modal.querySelector('[data-pw-error]');
    titleEl = modal.querySelector('#pw-modal-title');
    submitBtn = modal.querySelector('button[type="submit"]');
    cancelBtn = modal.querySelector('[data-pw-cancel]');
    backdropEl = modal.querySelector('[data-pw-dismiss]');
    var form = modal.querySelector('.pw-modal__form');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitCurrent();
    });

    cancelBtn.addEventListener('click', function () {
      closeModal(false);
    });

    backdropEl.addEventListener('click', function () {
      closeModal(false);
    });

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal(false);
      }
    });

    return modal;
  }

  function setError(message) {
    if (!errorEl || !inputEl) return;
    errorEl.textContent = message || '';
    errorEl.classList.toggle('is-visible', !!message);
    inputEl.classList.toggle('is-invalid', !!message);
  }

  function closeModal(ok) {
    if (!modal || modal.hidden) {
      if (pending) {
        var resolveEarly = pending;
        pending = null;
        resolveEarly(!!ok);
      }
      return;
    }

    modal.classList.remove('is-open');
    if (document.body) document.body.classList.remove('pw-modal-open');

    var finish = function () {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      if (inputEl) {
        inputEl.value = '';
        setError('');
      }
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus(); } catch (e) {}
      }
      lastFocus = null;
      if (pending) {
        var resolve = pending;
        pending = null;
        resolve(!!ok);
      }
    };

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) finish();
    else setTimeout(finish, 220);
  }

  function openModal(options) {
    options = options || {};
    ensureModal();

    if (pending) {
      var stale = pending;
      pending = null;
      stale(false);
    }

    titleEl.textContent = options.title || 'Enter password';
    setError('');
    inputEl.value = '';
    lastFocus = document.activeElement;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    if (document.body) document.body.classList.add('pw-modal-open');

    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      inputEl.focus();
    });

    return new Promise(function (resolve) {
      pending = resolve;
    });
  }

  function submitCurrent() {
    if (!pending || !inputEl) return;

    if (Date.now() < lockUntil) {
      setError('Too many attempts. Please wait a moment.');
      return;
    }

    var value = inputEl.value;
    if (!value) {
      setError('Please enter a password.');
      inputEl.focus();
      return;
    }

    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      setError('Unable to validate access in this browser.');
      return;
    }

    submitBtn.disabled = true;
    cancelBtn.disabled = true;

    hashPassword(value)
      .then(function (hash) {
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
        if (hashesEqual(hash, PASSWORD_HASH)) {
          failCount = 0;
          grant(CASE_ACCESS_KEY);
          closeModal(true);
          return;
        }
        failCount += 1;
        if (failCount >= LOCKOUT_AFTER) {
          lockUntil = Date.now() + LOCKOUT_MS;
          failCount = 0;
          setError('Too many attempts. Please wait a moment.');
        } else {
          setError('Incorrect password. Try again.');
        }
        inputEl.select();
        inputEl.focus();
      })
      .catch(function () {
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
        setError('Unable to validate access. Try again.');
      });
  }

  function unlock(key, options) {
    key = key || CASE_ACCESS_KEY;
    options = options || {};

    if (isGranted(key)) return Promise.resolve(true);

    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      window.alert('Unable to validate access.');
      return Promise.resolve(false);
    }

    return openModal(options).then(function (ok) {
      return !!ok && isGranted(key);
    });
  }

  function resolveHref(link) {
    return link.getAttribute('data-protected-href') || link.getAttribute('href') || link.href;
  }

  function resolveTarget(link, href) {
    var explicit = link.getAttribute('target');
    if (explicit) return explicit;
    if (/^https?:\/\//i.test(href) || String(href).indexOf('//') === 0) return '_blank';
    return '_self';
  }

  function bindProtectedLinks(root) {
    var scope = root || document;
    var links = scope.querySelectorAll('[data-password-gate]');
    if (!links.length) return;

    links.forEach(function (link) {
      if (link.getAttribute('data-pw-bound') === 'true') return;
      link.setAttribute('data-pw-bound', 'true');

      link.addEventListener('click', function (e) {
        var href = resolveHref(link);
        var target = resolveTarget(link, href);
        var needsGate = !isGranted();

        if (!needsGate && !link.hasAttribute('data-protected-href')) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        var go = function () {
          if (target === '_blank') {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          }
          if (window.PortfolioProgress && typeof window.PortfolioProgress.go === 'function') {
            window.PortfolioProgress.go(href);
            return;
          }
          if (window.PortfolioProgress) window.PortfolioProgress.start();
          window.location.href = href;
        };

        if (!needsGate) {
          go();
          return;
        }

        unlock(CASE_ACCESS_KEY, {
          title: 'Enter password'
        }).then(function (ok) {
          if (!ok) return;
          go();
        });
      }, true);
    });
  }

  global.PortfolioPassword = {
    CASE_ACCESS_KEY: CASE_ACCESS_KEY,
    isGranted: isGranted,
    unlock: unlock,
    bindProtectedLinks: bindProtectedLinks
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindProtectedLinks(document);
    });
  } else {
    bindProtectedLinks(document);
  }
})(window);
