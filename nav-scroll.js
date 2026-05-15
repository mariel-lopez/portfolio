(function () {
  var nav = document.querySelector('.home-hero-mono.navbar');
  if (!nav) return;

  var revealPx = 10;
  var ticking = false;

  function sync() {
    ticking = false;
    nav.classList.toggle('scrolled', window.scrollY >= revealPx);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(sync);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  sync();
})();
