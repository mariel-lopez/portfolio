(function () {
  var themeToggle = document.querySelector('[data-theme-toggle]');
  var root = document.documentElement;

  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    root.classList.add('dark-theme');
  }

  function updateToggleUi() {
    if (!themeToggle) return;
    var isDark = root.classList.contains('dark-theme');
    themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }

  updateToggleUi();

  themeToggle?.addEventListener('click', function () {
    root.classList.toggle('dark-theme');
    var isDark = root.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateToggleUi();
  });
})();
