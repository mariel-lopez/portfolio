(function () {
  var el = document.getElementById('nav-local-time');
  var clockEl = el && el.querySelector('.nav-local-clock');
  if (!el || !clockEl) return;

  var torontoTz = 'America/Toronto';
  var clockFmt = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: torontoTz
  });
  var datetimeFmt = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: torontoTz,
    hourCycle: 'h23'
  });

  function torontoDatetimeLocal(date) {
    var parts = datetimeFmt.formatToParts(date);
    var map = {};
    parts.forEach(function (part) {
      if (part.type !== 'literal') map[part.type] = part.value;
    });
    return map.year + '-' + map.month + '-' + map.day + 'T' +
      map.hour + ':' + map.minute + ':' + map.second;
  }

  function refresh() {
    var now = new Date();
    clockEl.textContent = clockFmt.format(now);
    el.setAttribute('datetime', torontoDatetimeLocal(now));
  }

  refresh();
  window.setInterval(refresh, 1000);
})();
