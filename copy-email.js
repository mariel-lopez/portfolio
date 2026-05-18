(function () {
  var DEFAULT_EMAIL = 'mariellopezdesign@gmail.com';
  var RESET_MS = 1800;

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        copyFallback(text);
      });
    }
    copyFallback(text);
    return Promise.resolve();
  }

  document.querySelectorAll('.footer-email-copy').forEach(function (btn) {
    var email = btn.getAttribute('data-email') || DEFAULT_EMAIL;
    var row = btn.closest('.footer-email-row');
    var status = row ? row.querySelector('.footer-email-copy-status') : null;
    var resetTimer;

    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-copied')) return;

      copyText(email).then(function () {
        window.clearTimeout(resetTimer);
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', 'Email copied!');
        if (status) status.textContent = 'Email copied!';

        resetTimer = window.setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', 'Copy email address');
          if (status) status.textContent = '';
        }, RESET_MS);
      });
    });
  });

  document.querySelectorAll('.nav-email-copy').forEach(function (link) {
    var email = link.getAttribute('data-email') || DEFAULT_EMAIL;
    var resetTimer;

    link.addEventListener('click', function (e) {
      e.preventDefault();

      copyText(email).then(function () {
        window.clearTimeout(resetTimer);
        link.classList.add('is-copied');
        link.setAttribute('aria-label', 'Email copied');

        resetTimer = window.setTimeout(function () {
          link.classList.remove('is-copied');
          link.setAttribute('aria-label', 'Copy email address');
        }, RESET_MS);
      });
    });
  });
})();
