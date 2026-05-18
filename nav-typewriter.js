(function () {
  var textEl = document.getElementById('typewriter');
  var rotatingEl = document.querySelector('.hero-rotating');
  if (!textEl || !rotatingEl) return;

  var phrases = [
    {
      text: 'Product designer @ IBM iX',
      link: {
        type: 'partial',
        href: 'https://www.ibm.com/consulting/ibmix',
        linkStart: 20,
        linkText: 'IBM iX'
      }
    },
    {
      text: 'Community builder',
      link: {
        type: 'full',
        href: 'https://luma.com/user/mariel'
      }
    },
    { text: 'City and travel photographer' },
    { text: 'Yoga and spin fanatic' }
  ];

  var TYPE_MS = 82;
  var DELETE_MS = 54;
  var PAUSE_TYPED_MS = 3000;
  var PAUSE_EMPTY_MS = 640;
  var FADE_MS = 560;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function createExternalLinkIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'hero-rotating-link-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M7 7h10v10');
    var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M7 17 17 7');
    svg.appendChild(path1);
    svg.appendChild(path2);
    return svg;
  }

  function createRotatingLink(href, label) {
    var anchor = document.createElement('a');
    anchor.className = 'hero-rotating-link';
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    var labelSpan = document.createElement('span');
    labelSpan.className = 'hero-rotating-link-label';
    labelSpan.textContent = label;
    anchor.appendChild(labelSpan);
    anchor.appendChild(createExternalLinkIcon());
    return anchor;
  }

  function renderPhrase(phrase, visibleLength) {
    textEl.textContent = '';
    var fullText = phrase.text;
    var link = phrase.link;

    if (!visibleLength) return;

    if (!link) {
      textEl.textContent = fullText.slice(0, visibleLength);
      return;
    }

    if (link.type === 'full') {
      if (visibleLength >= fullText.length) {
        textEl.appendChild(createRotatingLink(link.href, fullText));
      } else {
        textEl.textContent = fullText.slice(0, visibleLength);
      }
      return;
    }

    if (link.type === 'partial') {
      if (visibleLength <= link.linkStart) {
        textEl.textContent = fullText.slice(0, visibleLength);
        return;
      }

      textEl.appendChild(
        document.createTextNode(fullText.slice(0, link.linkStart))
      );
      textEl.appendChild(
        createRotatingLink(
          link.href,
          fullText.slice(link.linkStart, visibleLength)
        )
      );
    }
  }

  function setStaticPhrase() {
    renderPhrase(phrases[0], phrases[0].text.length);
    rotatingEl.style.opacity = '1';
  }

  if (motionQuery.matches) {
    setStaticPhrase();
    return;
  }

  var phraseIndex = 0;
  var charIndex = 0;
  var deleting = false;
  var timerId = null;

  function schedule(fn, delay) {
    timerId = window.setTimeout(fn, delay);
  }

  function fadeToNextPhrase(next) {
    rotatingEl.style.opacity = '0';
    schedule(function () {
      next();
      rotatingEl.style.opacity = '1';
    }, FADE_MS);
  }

  function tick() {
    var phrase = phrases[phraseIndex];
    var phraseLength = phrase.text.length;

    if (!deleting) {
      charIndex += 1;
      renderPhrase(phrase, charIndex);
      if (charIndex >= phraseLength) {
        deleting = true;
        schedule(tick, PAUSE_TYPED_MS);
        return;
      }
      schedule(tick, TYPE_MS);
      return;
    }

    charIndex -= 1;
    renderPhrase(phrase, charIndex);
    if (charIndex <= 0) {
      deleting = false;
      fadeToNextPhrase(function () {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        schedule(tick, PAUSE_EMPTY_MS);
      });
      return;
    }
    schedule(tick, DELETE_MS);
  }

  function stop() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  motionQuery.addEventListener('change', function (event) {
    stop();
    if (event.matches) {
      setStaticPhrase();
      return;
    }
    phraseIndex = 0;
    charIndex = 0;
    deleting = false;
    rotatingEl.style.opacity = '1';
    textEl.textContent = '';
    tick();
  });

  tick();
})();
