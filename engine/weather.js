/* Discovery Lab: a tiny corner weather chip (icon + temperature, nothing more).
   Privacy: the only thing sent is a coarse latitude/longitude for the visitor's time zone (a city-level point,
   never a precise position) to api.open-meteo.com, which needs no account or key. Precise location is only ever
   used if the visitor taps the chip and agrees to the browser's own location prompt. The chip can be hidden for good.
   No weather = no chip; the rest of the page never depends on it. Fahrenheit in the United States, Celsius elsewhere. */
(function () {
  var root = document.documentElement;
  if (!root.hasAttribute('data-age-band')) return;          // Discovery Lab pages only
  var KEY = 'dl-weather-v1', HIDE = 'dl-weather-hidden';
  try { if (localStorage.getItem(HIDE) === '1') return; } catch (e) {}
  var es = (root.lang || localStorage.getItem('dl-lang') || 'en').slice(0, 2) === 'es';

  // Coarse point for a time zone (city-level, deliberately not exact)
  var TZ = {
    'America/New_York': [40.7, -74.0], 'America/Detroit': [42.3, -83.0], 'America/Chicago': [41.9, -87.6],
    'America/Denver': [39.7, -105.0], 'America/Phoenix': [33.4, -112.1], 'America/Los_Angeles': [34.1, -118.2],
    'America/Anchorage': [61.2, -149.9], 'America/Boise': [43.6, -116.2], 'America/Indiana/Indianapolis': [39.8, -86.2],
    'America/Kentucky/Louisville': [38.3, -85.8], 'Pacific/Honolulu': [21.3, -157.9], 'America/Juneau': [58.3, -134.4],
    'America/Toronto': [43.7, -79.4], 'America/Vancouver': [49.3, -123.1], 'America/Edmonton': [53.5, -113.5], 'America/Winnipeg': [49.9, -97.1],
    'America/Halifax': [44.6, -63.6], 'America/Mexico_City': [19.4, -99.1], 'America/Monterrey': [25.7, -100.3], 'America/Bogota': [4.7, -74.1],
    'America/Lima': [-12.0, -77.0], 'America/Santiago': [-33.4, -70.7], 'America/Argentina/Buenos_Aires': [-34.6, -58.4], 'America/Sao_Paulo': [-23.5, -46.6],
    'America/Caracas': [10.5, -66.9], 'America/Guayaquil': [-2.2, -79.9], 'America/La_Paz': [-16.5, -68.1], 'America/Montevideo': [-34.9, -56.2],
    'America/Panama': [9.0, -79.5], 'America/Costa_Rica': [9.9, -84.1], 'America/Guatemala': [14.6, -90.5], 'America/Havana': [23.1, -82.4],
    'America/Santo_Domingo': [18.5, -69.9], 'America/Puerto_Rico': [18.5, -66.1], 'America/Asuncion': [-25.3, -57.6],
    'Europe/London': [51.5, -0.1], 'Europe/Dublin': [53.3, -6.3], 'Europe/Madrid': [40.4, -3.7], 'Atlantic/Canary': [28.1, -15.4], 'Europe/Lisbon': [38.7, -9.1],
    'Europe/Paris': [48.9, 2.4], 'Europe/Berlin': [52.5, 13.4], 'Europe/Rome': [41.9, 12.5], 'Europe/Amsterdam': [52.4, 4.9], 'Europe/Brussels': [50.8, 4.4],
    'Europe/Zurich': [47.4, 8.5], 'Europe/Vienna': [48.2, 16.4], 'Europe/Stockholm': [59.3, 18.1], 'Europe/Oslo': [59.9, 10.8], 'Europe/Copenhagen': [55.7, 12.6],
    'Europe/Helsinki': [60.2, 24.9], 'Europe/Warsaw': [52.2, 21.0], 'Europe/Athens': [38.0, 23.7], 'Europe/Istanbul': [41.0, 29.0], 'Europe/Moscow': [55.8, 37.6],
    'Africa/Cairo': [30.0, 31.2], 'Africa/Johannesburg': [-26.2, 28.0], 'Africa/Lagos': [6.5, 3.4], 'Africa/Nairobi': [-1.3, 36.8], 'Africa/Casablanca': [33.6, -7.6],
    'Asia/Dubai': [25.2, 55.3], 'Asia/Riyadh': [24.7, 46.7], 'Asia/Qatar': [25.3, 51.5], 'Asia/Kolkata': [28.6, 77.2], 'Asia/Calcutta': [28.6, 77.2], 'Asia/Karachi': [24.9, 67.0],
    'Asia/Dhaka': [23.8, 90.4], 'Asia/Bangkok': [13.8, 100.5], 'Asia/Jakarta': [-6.2, 106.8], 'Asia/Singapore': [1.4, 103.8], 'Asia/Kuala_Lumpur': [3.1, 101.7],
    'Asia/Manila': [14.6, 121.0], 'Asia/Hong_Kong': [22.3, 114.2], 'Asia/Shanghai': [31.2, 121.5], 'Asia/Taipei': [25.0, 121.5], 'Asia/Seoul': [37.6, 127.0],
    'Asia/Tokyo': [35.7, 139.7], 'Asia/Jerusalem': [31.8, 35.2], 'Asia/Tehran': [35.7, 51.4],
    'Australia/Sydney': [-33.9, 151.2], 'Australia/Melbourne': [-37.8, 145.0], 'Australia/Brisbane': [-27.5, 153.0], 'Australia/Perth': [-31.9, 115.9],
    'Australia/Adelaide': [-34.9, 138.6], 'Pacific/Auckland': [-36.9, 174.8], 'Pacific/Fiji': [-18.1, 178.4]
  };
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var US = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Boise|Juneau|Sitka|Nome|Adak|Yakutat|Menominee|Indiana\/|Kentucky\/|North_Dakota\/)|Pacific\/Honolulu|US\/)/.test(tz);
  var fahrenheit = US;

  var CSS = '.bp-wx{position:fixed;left:1rem;bottom:1rem;z-index:70;display:flex;align-items:center;gap:.15rem;font-family:var(--font-ui,system-ui);' +
    'background:#ffffffd9;backdrop-filter:blur(8px);border:1px solid #23282D2E;border-radius:999px;box-shadow:0 8px 24px -12px #23282D66;color:#23282D}' +
    '.bp-wx__main{display:flex;align-items:center;gap:.45rem;min-height:44px;padding:.2rem .5rem .2rem .7rem;font-weight:700;font-size:.95rem;border-radius:999px 0 0 999px;cursor:default}' +
    '.bp-wx__main svg{width:28px;height:28px;flex:none}' +
    '.bp-wx__x{min-width:44px;min-height:44px;border-radius:0 999px 999px 0;font-size:1rem;color:#48515A;opacity:.7}' +
    '.bp-wx__x:hover,.bp-wx__x:focus-visible{opacity:1}' +
    'button.bp-wx__main{cursor:pointer}' +
    '.bp-wx{animation:bpwx-in .8s ease .5s both}@keyframes bpwx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    'html[data-reduced-motion="on"] .bp-wx{animation:none}' +
    '@media (max-width:720px){.bp-wx{bottom:4.6rem}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // Little drawn icons: sun, moon, partly cloudy, cloud, rain, snow, fog, thunder
  var SUN = '<circle cx="16" cy="16" r="6" fill="#E3B230"/><g stroke="#E3B230" stroke-width="2" stroke-linecap="round"><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M7.5 24.5l2-2M22.5 9.5l2-2"/></g>';
  var MOON = '<path d="M21 20.5A9 9 0 0 1 11.5 6a9 9 0 1 0 9.5 14.5z" fill="#C9D2D8" stroke="#8A97A1" stroke-width="1.2"/>';
  var CLOUD = '<path d="M9 24a5 5 0 0 1-.6-9.96A7 7 0 0 1 22 12.5 5.2 5.2 0 0 1 22.5 24z" fill="#DDE3E7" stroke="#8A97A1" stroke-width="1.3" stroke-linejoin="round"/>';
  function svg(inner) { return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' + inner + '</svg>'; }
  function icon(code, day) {
    var s = day ? SUN : MOON, sm = '<g transform="translate(-3 -4) scale(.8)">' + s + '</g>';
    if (code === 0) return svg(s);
    if (code === 1 || code === 2) return svg(sm + '<g transform="translate(3 3) scale(.82)">' + CLOUD + '</g>');
    if (code === 3) return svg(CLOUD);
    if (code === 45 || code === 48) return svg(CLOUD + '<g stroke="#8A97A1" stroke-width="2" stroke-linecap="round"><path d="M8 27h16M11 30h10"/></g>');
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return svg(CLOUD + '<g stroke="#3A8C8A" stroke-width="2" stroke-linecap="round"><path d="M11 26l-1 3M16 26l-1 3M21 26l-1 3"/></g>');
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return svg(CLOUD + '<g fill="#8FB8C4"><circle cx="11" cy="27" r="1.5"/><circle cx="16" cy="29" r="1.5"/><circle cx="21" cy="27" r="1.5"/></g>');
    if (code >= 95) return svg(CLOUD + '<path d="M17 20l-4 6h3l-1 5 5-7h-3z" fill="#E3B230" stroke="#B88A00" stroke-width=".8" stroke-linejoin="round"/>');
    return svg(CLOUD);
  }
  var WORD = es ? { 0: 'Despejado', 1: 'Casi despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Niebla', 51: 'Llovizna', 61: 'Lluvia', 71: 'Nieve', 80: 'Chubascos', 95: 'Tormenta' }
                : { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 51: 'Drizzle', 61: 'Rain', 71: 'Snow', 80: 'Showers', 95: 'Thunderstorm' };
  function word(c) { var k = c >= 95 ? 95 : c >= 80 ? 80 : c >= 71 ? 71 : c >= 61 ? 61 : c >= 51 ? 51 : c >= 45 ? 45 : c; return WORD[k] || WORD[3]; }

  var chip;
  function show(code, day, temp, label, onclick) {
    if (!chip) {
      chip = document.createElement('div'); chip.className = 'bp-wx';
      document.body.appendChild(chip);
    }
    chip.textContent = '';
    var main = document.createElement(onclick ? 'button' : 'div'); main.className = 'bp-wx__main';
    if (onclick) { main.type = 'button'; main.addEventListener('click', onclick); }
    main.innerHTML = (code === null ? svg(CLOUD) : icon(code, day)) + '<span></span>';
    main.lastChild.textContent = temp;
    main.setAttribute('aria-label', label); main.title = label;
    var x = document.createElement('button'); x.type = 'button'; x.className = 'bp-wx__x'; x.textContent = '×';
    x.setAttribute('aria-label', es ? 'Ocultar el tiempo' : 'Hide weather');
    x.addEventListener('click', function () { try { localStorage.setItem(HIDE, '1'); } catch (e) {} chip.remove(); });
    chip.appendChild(main); chip.appendChild(x);
  }
  function fmt(c) { return fahrenheit ? Math.round(c * 9 / 5 + 32) + '°F' : Math.round(c) + '°C'; }

  function fetchWx(lat, lon, precise) {
    var cacheKey = KEY + ':' + lat.toFixed(1) + ',' + lon.toFixed(1);
    try {
      var c = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (c && Date.now() - c.t < 30 * 60 * 1000) return draw(c.d, precise);
    } catch (e) {}
    fetch('https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,is_day&latitude=' + lat.toFixed(2) + '&longitude=' + lon.toFixed(2))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        var d = { c: j.current.temperature_2m, w: j.current.weather_code, day: j.current.is_day === 1 };
        try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
        draw(d, precise);
      }).catch(function () { /* offline or blocked: no chip, nothing breaks */ });
  }
  function draw(d, precise) {
    var label = word(d.w) + ', ' + fmt(d.c) + (es ? ' (zona aproximada)' : ' (your approximate area)');
    show(d.w, d.day, fmt(d.c), label, precise ? null : refine);
  }
  // Tapping the chip offers a precise reading, using the browser's own permission prompt
  function refine() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (p) {
      fetchWx(p.coords.latitude, p.coords.longitude, true);
    }, function () {}, { maximumAge: 600000, timeout: 8000 });
  }

  var pt = TZ[tz];
  if (pt) fetchWx(pt[0], pt[1], false);
  else if (navigator.geolocation) {
    show(null, true, es ? 'Tiempo' : 'Weather', es ? 'Toca para ver el tiempo de tu zona' : 'Tap to see the weather where you are', refine);
  }
})();
