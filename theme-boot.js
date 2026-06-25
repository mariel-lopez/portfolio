/* Apply saved theme before first paint — light mode is the default */
!function () {
  try {
    var root = document.documentElement;
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      if (saved !== 'light') {
        localStorage.setItem('theme', 'light');
      }
    }
  } catch (e) {
    document.documentElement.classList.remove('dark-theme');
  }
}();
