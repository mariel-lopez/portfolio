/* Shared password gate — 30-day local unlock for case studies */
(function (global) {
  'use strict';

  var PASSWORD_HASH = '143705b2daf4782f008a1fc7aedddf3ee66e8b42d295cf07cdc015ab93b90be9';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var CASE_ACCESS_KEY = 'portfolio_case_access';

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

  function unlock(key, options) {
    key = key || CASE_ACCESS_KEY;
    options = options || {};

    if (isGranted(key)) return Promise.resolve(true);

    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      window.alert('Unable to validate access.');
      return Promise.resolve(false);
    }

    var input = window.prompt(options.prompt || 'Enter password to access this page:');
    if (input === null) return Promise.resolve(false);

    return hashPassword(input).then(function (hash) {
      if (hash === PASSWORD_HASH) {
        grant(key);
        return true;
      }
      window.alert('Incorrect password.');
      return false;
    });
  }

  global.PortfolioPassword = {
    CASE_ACCESS_KEY: CASE_ACCESS_KEY,
    isGranted: isGranted,
    grant: grant,
    unlock: unlock
  };
})(window);
