/* Creates transition layers before first paint — load synchronously in <head> */
!function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark-theme');
  } catch (e) {}

  var html = document.documentElement;
  html.setAttribute('data-pt-phase', 'enter');

  var root = document.createElement('div');
  root.id = 'pt-root';
  root.setAttribute('aria-hidden', 'true');

  var overlay = document.createElement('div');
  overlay.id = 'pt-overlay';

  var wipe = document.createElement('div');
  wipe.id = 'pt-gradient-wipe';

  root.appendChild(overlay);
  root.appendChild(wipe);

  var boot = function () {
    document.body.appendChild(root);
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
}();
