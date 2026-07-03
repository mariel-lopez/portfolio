(function () {
  if (!document.body.classList.contains('case-sobeys')) return;

  var IMAGE_SELECTOR = '.hero-image img, .case-study-image-card img';
  var lastTrigger = null;

  var overlay = document.createElement('div');
  overlay.className = 'sobeys-lightbox';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="sobeys-lightbox__backdrop" aria-hidden="true"></div>' +
    '<button type="button" class="sobeys-lightbox__close" aria-label="Close expanded image">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">' +
        '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>' +
      '</svg>' +
    '</button>' +
    '<div class="sobeys-lightbox__stage">' +
      '<img class="sobeys-lightbox__image" alt="">' +
    '</div>';

  document.body.appendChild(overlay);

  var closeBtn = overlay.querySelector('.sobeys-lightbox__close');
  var lightboxImg = overlay.querySelector('.sobeys-lightbox__image');
  var backdrop = overlay.querySelector('.sobeys-lightbox__backdrop');

  function isExpandable(img) {
    if (!img || !img.matches(IMAGE_SELECTOR)) return false;
    if (img.closest('.hero-image')) return true;
    var tab = img.closest('.tab-content');
    return Boolean(tab && tab.classList.contains('active'));
  }

  function setExpanded(trigger) {
    var label = trigger.getAttribute('aria-label') || ('Expand image: ' + (trigger.alt || 'case study image'));
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', label);
  }

  function initImages() {
    document.querySelectorAll(IMAGE_SELECTOR).forEach(setExpanded);
  }

  function open(img) {
    lastTrigger = img;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';

    overlay.hidden = false;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', img.alt || 'Expanded case study image');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sobeys-lightbox-open');
    closeBtn.focus();
  }

  function close() {
    overlay.hidden = true;
    overlay.removeAttribute('role');
    overlay.removeAttribute('aria-modal');
    overlay.removeAttribute('aria-label');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sobeys-lightbox-open');
    lightboxImg.removeAttribute('src');
    lightboxImg.alt = '';

    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  function onImageActivate(img) {
    if (!isExpandable(img)) return;
    open(img);
  }

  document.addEventListener('click', function (event) {
    var img = event.target.closest(IMAGE_SELECTOR);
    if (!img) return;
    if (!isExpandable(img)) return;
    event.preventDefault();
    onImageActivate(img);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      var img = event.target.closest(IMAGE_SELECTOR);
      if (!img || !isExpandable(img)) return;
      event.preventDefault();
      onImageActivate(img);
      return;
    }

    if (event.key === 'Escape' && !overlay.hidden) {
      event.preventDefault();
      close();
    }
  });

  closeBtn.addEventListener('click', function (event) {
    event.preventDefault();
    close();
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay || event.target === backdrop) {
      close();
    }
  });

  lightboxImg.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  initImages();
})();
