(function () {
  var LEAVE_MS = 320;
  var ENTER_MS = 500;
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Use overlay already in DOM (created by inline script before first paint),
     or create it now as a safe fallback. */
  var ov = document.getElementById('pt-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'pt-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.cssText =
      'position:fixed;inset:0;z-index:9990;' +
      'pointer-events:none;opacity:1;will-change:opacity;' +
      'background:var(--overlay-bg,#f5f5f2);';
    document.body.appendChild(ov);
  }

  /* Attach transition now that the overlay is confirmed in the DOM */
  ov.style.transition =
    'opacity ' + (reduce ? '0.1s' : (ENTER_MS / 1000) + 's') +
    ' cubic-bezier(0.22,1,0.36,1)';

  /* Fade in: reveal the arriving page */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      ov.style.opacity = '0';
    });
  });

  /* Fade out: cover the leaving page, then navigate */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;

    var href = (a.getAttribute('href') || '').trim();
    if (!href || a.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    try {
      var url = new URL(href, location.href);
      if (url.protocol === 'mailto:' || url.protocol === 'tel:') return;
      if (url.origin !== location.origin) return;
    } catch (_) {
      if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      return;
    }

    e.preventDefault();

    var leaveMs = reduce ? 0 : LEAVE_MS;
    ov.style.transition =
      'opacity ' + (reduce ? '0.1s' : (leaveMs / 1000) + 's') + ' ease-in';
    ov.style.opacity = '1';

    setTimeout(function () { window.location.href = href; }, leaveMs);
  });
}());
