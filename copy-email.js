(function () {
  var DEFAULT_EMAIL = 'mariellopezdesign@gmail.com';
  var TOAST_VISIBLE_MS = 2000;
  var TOAST_ANIM_MS = 280;
  var TOAST_MESSAGE = 'Copied to clipboard';

  var hideTimer;
  var unmountTimer;

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

  function getToast() {
    var toast = document.getElementById('copy-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.hidden = true;
    toast.innerHTML =
      '<span class="copy-toast-icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20 6 9 17l-5-5"/>' +
        '</svg>' +
      '</span>' +
      '<span class="copy-toast-text"></span>';

    document.body.appendChild(toast);
    return toast;
  }

  function showCopyToast(message) {
    var toast = getToast();
    var text = toast.querySelector('.copy-toast-text');
    if (text) text.textContent = message || TOAST_MESSAGE;

    window.clearTimeout(hideTimer);
    window.clearTimeout(unmountTimer);

    toast.hidden = false;
    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });

    hideTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
      unmountTimer = window.setTimeout(function () {
        toast.hidden = true;
      }, TOAST_ANIM_MS);
    }, TOAST_VISIBLE_MS);
  }

  function onCopySuccess(trigger, statusEl) {
    showCopyToast(TOAST_MESSAGE);
    if (statusEl) statusEl.textContent = TOAST_MESSAGE;
    if (trigger) trigger.setAttribute('aria-label', TOAST_MESSAGE);

    window.setTimeout(function () {
      if (statusEl) statusEl.textContent = '';
      if (trigger) trigger.setAttribute('aria-label', 'Copy email address');
    }, TOAST_VISIBLE_MS + TOAST_ANIM_MS);
  }

  document.querySelectorAll('.footer-email-copy').forEach(function (btn) {
    var email = btn.getAttribute('data-email') || DEFAULT_EMAIL;
    var row = btn.closest('.footer-email-row');
    var status = row ? row.querySelector('.footer-email-copy-status') : null;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyText(email).then(function () {
        onCopySuccess(btn, status);
      });
    });
  });

  document.querySelectorAll('.nav-email-copy').forEach(function (link) {
    var email = link.getAttribute('data-email') || DEFAULT_EMAIL;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      copyText(email).then(function () {
        onCopySuccess(link, null);
      });
    });
  });
})();
