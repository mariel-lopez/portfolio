(function (global) {
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function isExternalHref(href) {
    if (!href) return false;
    var value = String(href).trim();
    return /^https?:\/\//i.test(value) || value.indexOf('//') === 0;
  }

  function createIcon() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'external-link-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    var path1 = document.createElementNS(SVG_NS, 'path');
    path1.setAttribute('d', 'M7 7h10v10');
    var path2 = document.createElementNS(SVG_NS, 'path');
    path2.setAttribute('d', 'M7 17 17 7');
    svg.appendChild(path1);
    svg.appendChild(path2);
    return svg;
  }

  function createAnchor(href, label, options) {
    options = options || {};
    var anchor = document.createElement('a');
    var className = 'external-link';

    if (options.className) {
      className += ' ' + options.className;
    }

    anchor.className = className;
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    if (typeof label === 'string') {
      anchor.appendChild(document.createTextNode(label));
    } else if (label && label.nodeType === 1) {
      anchor.appendChild(label);
    }

    anchor.appendChild(createIcon());
    return anchor;
  }

  global.ExternalLink = {
    isExternalHref: isExternalHref,
    createIcon: createIcon,
    createAnchor: createAnchor
  };
})(typeof window !== 'undefined' ? window : this);
