(function () {
  var themeToggle = document.querySelector('[data-theme-toggle]');
  var root = document.documentElement;

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.classList.toggle('dark-theme', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {}
    updateToggleUi();
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

  applyTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

  themeToggle?.addEventListener('click', function () {
    applyTheme(root.classList.contains('dark-theme') ? 'light' : 'dark');
  });
})();
