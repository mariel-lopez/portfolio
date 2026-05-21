(function () {
  'use strict';

  var DURATION = 650;
  var STAGGER = 45;
  var MAX_STAGGER = 360;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;

  var overlay = document.getElementById('pt-overlay');
  var wipe = document.getElementById('pt-gradient-wipe');

  if (!overlay || !wipe) return;

  var surfaceSelector =
    '.home-hero-mono.navbar, .page, .about-main, .project-page-container, .site-bottom';

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

  function runEnter() {
    var nodes = surfaces();

    if (reduce) {
      setPhase('enter-settle');
      return wait(120).then(function () {
        setPhase('idle');
        clearDelays(nodes);
        html.style.overflow = '';
      });
    }

    setPhase('enter');
    html.style.overflow = 'hidden';

    return wait(40)
      .then(function () {
        setPhase('enter-wipe');
        return wait(DURATION);
      })
      .then(function () {
        setPhase('enter-settle');
        staggerIn(nodes);
        return wait(Math.max(420, DURATION - 180));
      })
      .then(function () {
        setPhase('idle');
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
    var nodes = surfaces();

    if (reduce) {
      setPhase('leave');
      return wait(100).then(function () {
        window.location.href = href;
      });
    }

    setPhase('leave');
    html.style.overflow = 'hidden';

    try {
      sessionStorage.setItem('pt-scroll:' + location.pathname, String(window.scrollY));
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
    setPhase('idle');
    clearDelays(surfaces());
    html.style.overflow = '';
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!isInternalNavLink(a, e)) return;
    e.preventDefault();
    runLeave(a.href);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runEnter);
  } else {
    runEnter();
  }
})();
