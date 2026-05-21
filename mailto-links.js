(function () {
  /* Run in capture phase so mailto always wins over other click handlers. */
  document.addEventListener(
    'click',
    function (e) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target.closest('a[href]');
      if (!link) return;

      var href = (link.getAttribute('href') || '').trim();
      if (!/^mailto:/i.test(href)) return;

      e.preventDefault();
      window.location.href = href;
    },
    true
  );
})();
