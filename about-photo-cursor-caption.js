(function () {
  var OFFSET_X = 14;
  var OFFSET_Y = 20;
  var PAD = 12;

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function positionCaption(figure, caption, clientX, clientY) {
    var rect = figure.getBoundingClientRect();
    var x = clientX - rect.left + OFFSET_X;
    var y = clientY - rect.top + OFFSET_Y;
    var w = caption.offsetWidth || 120;
    var h = caption.offsetHeight || 32;
    var maxX = figure.clientWidth - w - PAD;
    var maxY = figure.clientHeight - h - PAD;
    caption.style.left = clamp(x, PAD, Math.max(PAD, maxX)) + 'px';
    caption.style.top = clamp(y, PAD, Math.max(PAD, maxY)) + 'px';
  }

  function centerCaptionBottom(figure, caption) {
    figure.offsetHeight;
    var w = caption.offsetWidth || 160;
    var h = caption.offsetHeight || 36;
    caption.style.left =
      clamp((figure.clientWidth - w) / 2, PAD, figure.clientWidth - w - PAD) + 'px';
    caption.style.top =
      clamp(figure.clientHeight - h - PAD * 2, PAD, figure.clientHeight - h - PAD) + 'px';
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  document.querySelectorAll('.about-photo').forEach(function (figure) {
    var caption = figure.querySelector('.about-photo-caption');
    if (!caption) return;

    if (!canHover) return;

    if (!reducedMotion) {
      figure.addEventListener('mouseenter', function (e) {
        positionCaption(figure, caption, e.clientX, e.clientY);
      });
      figure.addEventListener('mousemove', function (e) {
        positionCaption(figure, caption, e.clientX, e.clientY);
      });
    } else {
      figure.addEventListener('mouseenter', function () {
        centerCaptionBottom(figure, caption);
      });
    }
  });
})();
