(function () {
  var CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  var DURATION = 1100;
  var SHUFFLE_INTERVAL = 48;
  var PUNCT = /[\s,.°·]/;

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  /* Longer scramble phase, then smooth settle into final text */
  function resolveProgress(t) {
    if (t < 0.4) return t * 0.2;
    var u = (t - 0.4) / 0.6;
    return 0.08 + (1 - Math.pow(1 - u, 2.6)) * 0.92;
  }

  function frameForTarget(target, progress) {
    var resolved = Math.floor(progress * target.length);
    var out = '';
    for (var i = 0; i < target.length; i++) {
      var ch = target.charAt(i);
      if (i < resolved || PUNCT.test(ch)) {
        out += ch;
      } else {
        out += randomChar();
      }
    }
    return out;
  }

  function animateTo(el, target, instant) {
    if (el._scrambleRaf) {
      cancelAnimationFrame(el._scrambleRaf);
      el._scrambleRaf = null;
    }

    if (instant || el.textContent === target) {
      el.textContent = target;
      return;
    }

    var start = performance.now();
    var lastShuffle = 0;
    var lastResolved = -1;

    function tick(now) {
      var t = Math.min((now - start) / DURATION, 1);
      var progress = resolveProgress(t);
      var resolvedCount = Math.floor(progress * target.length);
      var shouldShuffle =
        now - lastShuffle >= SHUFFLE_INTERVAL ||
        resolvedCount !== lastResolved;

      if (shouldShuffle) {
        el.textContent = frameForTarget(target, progress);
        lastShuffle = now;
        lastResolved = resolvedCount;
      }

      if (t < 1) {
        el._scrambleRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = target;
        el._scrambleRaf = null;
      }
    }

    el._scrambleRaf = requestAnimationFrame(tick);
  }

  function initLink(link, motionQuery) {
    var textEl = link.querySelector('.nav-local-place-text');
    if (!textEl) return;

    var coords = textEl.getAttribute('data-text-coords') || '40.7128° N, 74.0060° W';
    var label = textEl.getAttribute('data-text-label') || 'New York, New York, USA';

    function showCoords() {
      animateTo(textEl, coords, motionQuery.matches);
    }

    function showLabel() {
      animateTo(textEl, label, motionQuery.matches);
    }

    function isActive() {
      return link.matches(':hover') || link === document.activeElement;
    }

    link.addEventListener('mouseenter', showLabel);
    link.addEventListener('mouseleave', showCoords);
    link.addEventListener('focus', showLabel);
    link.addEventListener('blur', showCoords);

    motionQuery.addEventListener('change', function () {
      animateTo(textEl, isActive() ? label : coords, true);
    });
  }

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.nav-local-place-link').forEach(function (link) {
    initLink(link, motionQuery);
  });
})();
