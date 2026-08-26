/* Shared password gate — styled modal + 30-day local unlock */
(function (global) {
  'use strict';

  var PASSWORD_HASH = '143705b2daf4782f008a1fc7aedddf3ee66e8b42d295cf07cdc015ab93b90be9';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var CASE_ACCESS_KEY = 'portfolio_case_access';

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

  function hashPassword(input) {
    var data = new TextEncoder().encode(input);
    return window.crypto.subtle.digest('SHA-256', data).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

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

    document.body.appendChild(modal);

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
    document.body.classList.remove('pw-modal-open');

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
    document.body.classList.add('pw-modal-open');

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
        if (hash === PASSWORD_HASH) {
          grant(CASE_ACCESS_KEY);
          closeModal(true);
          return;
        }
        setError('Incorrect password. Try again.');
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

  function bindProtectedLinks(root) {
    var scope = root || document;
    var links = scope.querySelectorAll('[data-password-gate]');
    if (!links.length) return;

    links.forEach(function (link) {
      if (link.getAttribute('data-pw-bound') === 'true') return;
      link.setAttribute('data-pw-bound', 'true');

      link.addEventListener('click', function (e) {
        var href = link.getAttribute('data-protected-href') || link.href;
        var target = link.getAttribute('target') || (link.hasAttribute('data-protected-href') ? '_blank' : '_self');
        var needsGate = !isGranted();

        if (!needsGate && !link.hasAttribute('data-protected-href')) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        var go = function () {
          if (target === '_blank') {
            window.open(href, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = href;
          }
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
    grant: grant,
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
