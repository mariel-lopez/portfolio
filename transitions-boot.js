/* Creates transition layers before first paint — load synchronously in <head> */
!function () {
  var html = document.documentElement;
  var DURATION = 700;

  try {
    if (sessionStorage.getItem('pt-nav') === '1') {
      html.classList.add('pt-from-nav');
      sessionStorage.removeItem('pt-nav');
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
