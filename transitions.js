(function () {
  'use strict';

  var DURATION = 700;
  var STAGGER = 45;
  var MAX_STAGGER = 360;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  var leaving = false;

  var overlay = document.getElementById('pt-overlay');

  var surfaceSelector =
    '.home-hero-mono.navbar, .page, .about-main, .etc-main, .project-page-container, .site-bottom';

  function surfaces() {
    var list = Array.prototype.slice.call(document.querySelectorAll(surfaceSelector));
    list.forEach(function (el) {
      el.classList.add('pt-page-surface');
    });
    return list;
  }

  function setPhase(phase) {
    if (phase) html.setAttribute('data-pt-phase', phase);
    else html.setAttribute('data-pt-phase', 'idle');
  }

  function clearDelays(nodes) {
    nodes.forEach(function (el) {
      el.style.transitionDelay = '';
    });
  }

  function staggerIn(nodes) {
    if (reduce) {
      clearDelays(nodes);
      return;
    }
    nodes.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * STAGGER, MAX_STAGGER) + 'ms';
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function frames(n) {
    return new Promise(function (resolve) {
      function step() {
        n -= 1;
        if (n <= 0) resolve();
        else requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function finishNav() {
    html.classList.remove('pt-from-nav');
    html.removeAttribute('data-pt-loading');
  }

  function runEnter() {
    var nodes = surfaces();
    var fromNav = html.classList.contains('pt-from-nav');

    if (!fromNav || reduce) {
      setPhase('enter-settle');
      return wait(fromNav ? 140 : 0).then(function () {
        setPhase('idle');
        finishNav();
        clearDelays(nodes);
        html.style.overflow = '';
      });
    }

    setPhase('enter');
    html.style.overflow = 'hidden';

    return frames(2)
      .then(function () {
        setPhase('enter-wipe');
        return wait(DURATION);
      })
      .then(function () {
        setPhase('enter-settle');
        staggerIn(nodes);
        return wait(Math.max(380, DURATION - 200));
      })
      .then(function () {
        setPhase('idle');
        finishNav();
        clearDelays(nodes);
        html.style.overflow = '';

        if (location.hash) {
          var target = document.querySelector(location.hash);
          if (target) target.scrollIntoView({ block: 'start' });
        } else {
          window.scrollTo(0, 0);
        }
      });
  }

  function runLeave(href) {
    if (leaving) return Promise.resolve();
    leaving = true;

    if (window.PortfolioProgress && typeof window.PortfolioProgress.go === 'function') {
      window.PortfolioProgress.go(href);
      return Promise.resolve();
    }

    var nodes = surfaces();

    if (reduce) {
      setPhase('leave');
      try {
        sessionStorage.setItem('pt-nav', '1');
      } catch (e) {}
      return wait(100).then(function () {
        window.location.href = href;
      });
    }

    setPhase('idle');
    if (overlay) void overlay.offsetWidth;

    html.style.overflow = 'hidden';
    setPhase('leave');

    try {
      sessionStorage.setItem('pt-scroll:' + location.pathname, String(window.scrollY));
      sessionStorage.setItem('pt-nav', '1');
    } catch (e) {}

    return wait(DURATION).then(function () {
      window.location.href = href;
    });
  }

  function isInternalNavLink(a, e) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;

    var href = (a.getAttribute('href') || '').trim();
    if (!href || href.charAt(0) === '#') return false;

    try {
      var url = new URL(href, location.href);
      if (url.protocol === 'mailto:' || url.protocol === 'tel:') return false;
      if (url.origin !== location.origin) return false;
      if (url.pathname === location.pathname && url.search === location.search) return false;
      return true;
    } catch (_) {
      return !/^(mailto:|tel:|javascript:)/i.test(href);
    }
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    setPhase('idle');
    html.classList.remove('pt-from-nav');
    html.removeAttribute('data-pt-loading');
    clearDelays(surfaces());
    html.style.overflow = '';
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!isInternalNavLink(a, e)) return;
    e.preventDefault();
    runLeave(a.href);
  });

  window.PortfolioProgress = window.PortfolioProgress || {};
  window.PortfolioProgress.leave = runLeave;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runEnter);
  } else {
    runEnter();
  }
})();
