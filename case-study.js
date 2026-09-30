/* Case study helpers: TOC, reading progress, chapter current, tab keyboard */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var progress = document.querySelector('.case-read-progress');
  var toc = document.getElementById('case-toc');
  var tocToggle = document.getElementById('case-toc-toggle');
  var tocPanel = document.getElementById('case-toc-panel');
  var tocStorageKey = 'case-toc-minimized';
  var hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var closeTimer = null;
  var ticking = false;

  function prefersHover() {
    return hoverQuery.matches;
  }

  function isMinimized() {
    return !!(toc && toc.classList.contains('is-minimized'));
  }

  function setMinimized(minimized, immediate) {
    if (!toc || !tocToggle || !tocPanel) return;
    toc.classList.toggle('is-minimized', minimized);
    tocToggle.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    tocPanel.setAttribute('aria-hidden', minimized ? 'true' : 'false');
    tocPanel.inert = minimized;
    if (immediate) {
      toc.classList.add('is-instant');
      requestAnimationFrame(function () {
        toc.classList.remove('is-instant');
      });
    }
    if (!prefersHover()) {
      try {
        sessionStorage.setItem(tocStorageKey, minimized ? '1' : '0');
      } catch (e) {}
    }
  }

  function openToc() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    setMinimized(false);
  }

  function scheduleClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      closeTimer = null;
      if (!toc) return;
      if (toc.matches(':hover') || toc.contains(document.activeElement)) return;
      setMinimized(true);
    }, 180);
  }

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function pastThreshold() {
    var m = maxScroll();
    if (m <= 1) return false;
    return window.scrollY >= m * 0.15;
  }

  function syncChrome() {
    ticking = false;

    if (progress) {
      var max = Math.max(1, maxScroll());
      progress.value = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    }

    if (toc) {
      var visible = pastThreshold();
      toc.classList.toggle('is-visible', visible);
      toc.setAttribute('aria-hidden', visible ? 'false' : 'true');
      toc.inert = !visible;
    }
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(syncChrome);
    }
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  syncChrome();

  var nav = document.querySelector('.case-chapters');
  if (nav && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute('href').slice(1));
      })
      .filter(Boolean);

    if (sections.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            links.forEach(function (link) {
              if (link.getAttribute('href') === '#' + id) {
                link.setAttribute('aria-current', 'location');
              } else {
                link.removeAttribute('aria-current');
              }
            });
          });
        },
        { rootMargin: '-28% 0px -62% 0px', threshold: 0.01 }
      );
      sections.forEach(function (section) {
        observer.observe(section);
      });
    }
  }

  if (toc) {
    toc.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'mouse') return;
      openToc();
    });

    toc.addEventListener('pointerleave', function (event) {
      if (event.pointerType !== 'mouse') return;
      scheduleClose();
    });

    toc.addEventListener('focusin', openToc);

    toc.addEventListener('focusout', function (event) {
      if (toc.contains(event.relatedTarget)) return;
      scheduleClose();
    });

    toc.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      event.preventDefault();

      var href = link.getAttribute('href');
      if (href === '#top') {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }

      var target = document.getElementById(href.slice(1));
      if (!target) return;
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  if (tocToggle) {
    tocPanel.inert = true;

    if (!prefersHover()) {
      try {
        if (sessionStorage.getItem(tocStorageKey) === '1') setMinimized(true, true);
        else if (sessionStorage.getItem(tocStorageKey) === '0') setMinimized(false, true);
      } catch (e) {}
    }

    tocToggle.addEventListener('click', function (event) {
      if (prefersHover() && event.detail !== 0) return;
      setMinimized(!isMinimized());
    });
  }


  function tabsIn(root) {
    return Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  }

  function syncTabPager(root) {
    var tabs = tabsIn(root);
    var status = root.querySelector('[data-tab-status]');
    if (!tabs.length || !status) return;
    var i = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    if (i < 0) i = 0;
    var n = String(tabs.length).padStart(2, '0');
    var cur = String(i + 1).padStart(2, '0');
    status.textContent = cur + ' of ' + n;
  }

  function stepTabs(root, dir) {
    var tabs = tabsIn(root);
    if (!tabs.length) return;
    var i = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    if (i < 0) i = 0;
    var next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus();
    activateTab(next);
  }

  function activateTab(button) {
    var panelId = button.getAttribute('aria-controls');
    if (!panelId) return;

    var root = button.closest('[data-tabs]');
    if (root) {
      root.querySelectorAll('[role="tab"]').forEach(function (tab) {
        var on = tab === button;
        tab.classList.toggle('is-active', on);
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
      });
      root.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
        var on = panel.id === panelId;
        panel.hidden = !on;
      });
      syncTabPager(root);
      return;
    }

    if (typeof window.switchTab === 'function') {
      window.switchTab(button, panelId);
    }
  }

  document.querySelectorAll('[data-tabs] [role="tab"]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab);
    });
  });

  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var prev = root.querySelector('[data-tab-prev]');
    var next = root.querySelector('[data-tab-next]');
    if (prev) prev.addEventListener('click', function () { stepTabs(root, -1); });
    if (next) next.addEventListener('click', function () { stepTabs(root, 1); });
    syncTabPager(root);
  });

  var why = document.getElementById('case-why');
  if (why && !reduceMotion && prefersHover()) {
    var whyFrame = 0;
    why.addEventListener('pointermove', function (event) {
      var rect = why.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      if (whyFrame) return;
      whyFrame = requestAnimationFrame(function () {
        whyFrame = 0;
        why.style.setProperty('--why-x', x.toFixed(2) + '%');
        why.style.setProperty('--why-y', y.toFixed(2) + '%');
      });
    });
    why.addEventListener('pointerleave', function () {
      why.style.setProperty('--why-x', '50%');
      why.style.setProperty('--why-y', '22%');
    });
  }

  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    list.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
        return;
      }
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      var next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      activateTab(tabs[next]);
    });
  });
})();
