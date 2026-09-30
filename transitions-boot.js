/* Creates transition layers before first paint — load synchronously in <head> */
!function () {
  var html = document.documentElement;
  var DURATION = 700;

  function applyOrigin(x, y) {
    var ox = typeof x === 'number' && isFinite(x) ? x : 50;
    var oy = typeof y === 'number' && isFinite(y) ? y : 38;
    html.style.setProperty('--pt-ox', ox + '%');
    html.style.setProperty('--pt-oy', oy + '%');
  }

  applyOrigin(50, 38);

  function rememberOrigin(x, y) {
    applyOrigin(x, y);
    try {
      sessionStorage.setItem('pt-ox', String(x));
      sessionStorage.setItem('pt-oy', String(y));
    } catch (e) {}
  }

  try {
    if (sessionStorage.getItem('pt-nav') === '1') {
      html.classList.add('pt-from-nav');
      sessionStorage.removeItem('pt-nav');
      var ox = parseFloat(sessionStorage.getItem('pt-ox'));
      var oy = parseFloat(sessionStorage.getItem('pt-oy'));
      sessionStorage.removeItem('pt-ox');
      sessionStorage.removeItem('pt-oy');
      applyOrigin(ox, oy);
    }
  } catch (e) {}

  html.setAttribute('data-pt-phase', html.classList.contains('pt-from-nav') ? 'enter' : 'idle');

  var root = document.createElement('div');
  root.id = 'pt-root';
  root.setAttribute('aria-hidden', 'true');

  var overlay = document.createElement('div');
  overlay.id = 'pt-overlay';

  var bloom = document.createElement('div');
  bloom.id = 'pt-bloom';

  var flare = document.createElement('div');
  flare.id = 'pt-flare';

  var wipe = document.createElement('div');
  wipe.id = 'pt-gradient-wipe';

  overlay.appendChild(bloom);
  overlay.appendChild(flare);
  root.appendChild(overlay);
  root.appendChild(wipe);

  var boot = function () {
    document.body.appendChild(root);
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  function markLeave() {
    try {
      sessionStorage.setItem('pt-nav', '1');
    } catch (e) {}
    html.setAttribute('data-pt-loading', '1');
    html.setAttribute('data-pt-phase', 'idle');
    void overlay.offsetWidth;
    requestAnimationFrame(function () {
      html.setAttribute('data-pt-phase', 'leave');
    });
  }

  window.PortfolioProgress = {
    setOrigin: rememberOrigin,
    start: markLeave,
    go: function (href) {
      markLeave();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(function () {
        window.location.href = href;
      }, reduce ? 80 : DURATION);
    }
  };
}();
