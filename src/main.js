// ─── DAILY LOCATIONS ──────────────────────────────────────────────────────────
// Seed locations by day-of-year. Replace/extend as needed.
// Each entry: { lat, lng, label }
const LOCATIONS = [
  { lat: 48.8566,  lng: 2.3522,   label: "Paris, France" },
  { lat: 35.6762,  lng: 139.6503, label: "Tokyo, Japan" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney, Australia" },
  { lat: 40.7128,  lng: -74.0060, label: "New York, USA" },
  { lat: -22.9068, lng: -43.1729, label: "Rio de Janeiro, Brazil" },
  { lat: 51.5074,  lng: -0.1278,  label: "London, UK" },
  { lat: 55.7558,  lng: 37.6173,  label: "Moscow, Russia" },
  { lat: 1.3521,   lng: 103.8198, label: "Singapore" },
  { lat: -34.6037, lng: -58.3816, label: "Buenos Aires, Argentina" },
  { lat: 30.0444,  lng: 31.2357,  label: "Cairo, Egypt" },
  { lat: 19.4326,  lng: -99.1332, label: "Mexico City, Mexico" },
  { lat: 28.6139,  lng: 77.2090,  label: "New Delhi, India" },
  { lat: 41.9028,  lng: 12.4964,  label: "Rome, Italy" },
  { lat: 37.5665,  lng: 126.9780, label: "Seoul, South Korea" },
  { lat: -26.2041, lng: 28.0473,  label: "Johannesburg, South Africa" },
  { lat: 52.5200,  lng: 13.4050,  label: "Berlin, Germany" },
  { lat: 25.2048,  lng: 55.2708,  label: "Dubai, UAE" },
  { lat: 59.9139,  lng: 10.7522,  label: "Oslo, Norway" },
  { lat: 43.6532,  lng: -79.3832, label: "Toronto, Canada" },
  { lat: -4.4419,  lng: 15.2663,  label: "Kinshasa, DR Congo" },
  { lat: 13.5127,  lng: 2.1128,   label: "Niamey, Niger" },
  { lat: 39.9042,  lng: 116.4074, label: "Beijing, China" },
  { lat: -1.2921,  lng: 36.8219,  label: "Nairobi, Kenya" },
  { lat: 33.8869,  lng: 9.5375,   label: "Tunisia" },
  { lat: 64.1466,  lng: -21.9426, label: "Reykjavik, Iceland" },
  { lat: 14.6937,  lng: -17.4441, label: "Dakar, Senegal" },
  { lat: -15.7801, lng: -47.9292, label: "Brasília, Brazil" },
  { lat: 21.0285,  lng: 105.8542, label: "Hanoi, Vietnam" },
  { lat: 4.3947,   lng: 18.5582,  label: "Bangui, Central African Republic" },
  { lat: -41.2865, lng: 174.7762, label: "Wellington, New Zealand" },
  { lat: 60.1699,  lng: 24.9384,  label: "Helsinki, Finland" },
  { lat: 47.4979,  lng: 19.0402,  label: "Budapest, Hungary" },
  { lat: -33.4489, lng: -70.6693, label: "Santiago, Chile" },
  { lat: 50.8503,  lng: 4.3517,   label: "Brussels, Belgium" },
  { lat: 45.8150,  lng: 15.9819,  label: "Zagreb, Croatia" },
  { lat: 9.0579,   lng: 7.4951,   label: "Abuja, Nigeria" },
];

// ─── DAILY SEED ───────────────────────────────────────────────────────────────
function getDailyLocation() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return LOCATIONS[dayOfYear % LOCATIONS.length];
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── SCORE CALCULATION ────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function calcScore(distanceKm) {
  // Max 5000 pts; drops exponentially. ~0 at 5000 km.
  return Math.round(5000 * Math.exp(-distanceKm / 2000));
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
function saveResult(score) {
  const key = getTodayKey();
  const prev = JSON.parse(localStorage.getItem('dailygeo_history') || '{}');
  prev[key] = score;
  localStorage.setItem('dailygeo_history', JSON.stringify(prev));

  // Streak
  const streak = calcStreak(prev);
  localStorage.setItem('dailygeo_streak', streak);

  const best = Math.max(...Object.values(prev));
  localStorage.setItem('dailygeo_best', best);
}

function calcStreak(history) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (history[k] !== undefined) streak++;
    else break;
  }
  return streak;
}

function alreadyPlayedToday() {
  const prev = JSON.parse(localStorage.getItem('dailygeo_history') || '{}');
  return getTodayKey() in prev;
}

// ─── GOOGLE MAPS LOADER ───────────────────────────────────────────────────────
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    window._gmapsReady = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=_gmapsReady`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const DAILY = getDailyLocation();

// Screens
const splashEl = document.getElementById('splash');
const gameEl = document.getElementById('game');
const resultEl = document.getElementById('result');

// State
let guessMarker = null;
let guessLatLng = null;
let guessMap = null;

// ─── SPLASH SETUP ─────────────────────────────────────────────────────────────
document.getElementById('today-label').textContent = formatDate();
document.getElementById('hud-date').textContent = formatDate();
document.getElementById('streak-count').textContent =
  localStorage.getItem('dailygeo_streak') || '0';
const bestScore = localStorage.getItem('dailygeo_best');
document.getElementById('best-score').textContent =
  bestScore ? bestScore : '—';

// ─── PLAY BUTTON ──────────────────────────────────────────────────────────────
document.getElementById('play-btn').addEventListener('click', async () => {
  const apiKey = window.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    alert('⚠️ Please set your Google Maps API key in index.html (window.GOOGLE_MAPS_API_KEY)');
    return;
  }

  splashEl.classList.add('hidden');
  gameEl.classList.remove('hidden');

  try {
    await loadGoogleMaps(apiKey);
    initStreetView();
    initGuessMap();
  } catch (e) {
    alert('Could not load Google Maps. Check your API key and network.');
    console.error(e);
  }
});

// ─── STREET VIEW ──────────────────────────────────────────────────────────────
function initStreetView() {
  new google.maps.StreetViewPanorama(
    document.getElementById('street-view'),
    {
      position: { lat: DAILY.lat, lng: DAILY.lng },
      addressControl: false,
      fullscreenControl: false,
      showRoadLabels: false,
      motionTracking: false,
      motionTrackingControl: false,
      zoomControl: true,
    }
  );
}

// ─── GUESS MAP ────────────────────────────────────────────────────────────────
function initGuessMap() {
  guessMap = new google.maps.Map(document.getElementById('guess-map'), {
    zoom: 2,
    center: { lat: 20, lng: 0 },
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    styles: darkMapStyle(),
  });

  guessMap.addListener('click', (e) => {
    guessLatLng = e.latLng;

    if (guessMarker) guessMarker.setMap(null);
    guessMarker = new google.maps.Marker({
      position: guessLatLng,
      map: guessMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#c8f55a',
        fillOpacity: 1,
        strokeColor: '#0a0a0a',
        strokeWeight: 2,
      },
    });

    document.getElementById('submit-guess-btn').disabled = false;
  });
}

// ─── TOGGLE MAP ───────────────────────────────────────────────────────────────
const mapPanel = document.getElementById('map-panel');
document.getElementById('toggle-map-btn').addEventListener('click', () => {
  mapPanel.classList.toggle('hidden');

  // Trigger resize so the map tiles load correctly
  if (!mapPanel.classList.contains('hidden') && guessMap) {
    setTimeout(() => {
      google.maps.event.trigger(guessMap, 'resize');
    }, 50);
  }
});

// ─── SUBMIT GUESS ─────────────────────────────────────────────────────────────
document.getElementById('submit-guess-btn').addEventListener('click', () => {
  if (!guessLatLng) return;

  const distKm = haversineKm(
    guessLatLng.lat(), guessLatLng.lng(),
    DAILY.lat, DAILY.lng
  );
  const score = calcScore(distKm);

  saveResult(score);
  showResult(guessLatLng, distKm, score);
});

// ─── RESULT SCREEN ────────────────────────────────────────────────────────────
function showResult(guessLL, distKm, score) {
  gameEl.classList.add('hidden');
  resultEl.classList.remove('hidden');

  document.getElementById('final-score').textContent = score.toLocaleString();
  const distLabel = distKm < 1
    ? `${Math.round(distKm * 1000)} m from the target`
    : `${Math.round(distKm).toLocaleString()} km from ${DAILY.label}`;
  document.getElementById('distance-text').textContent = distLabel;

  buildScoreGrid(score);
  buildCountdown();

  // Result map
  setTimeout(() => {
    const map = new google.maps.Map(document.getElementById('result-map'), {
      zoom: 3,
      center: {
        lat: (guessLL.lat() + DAILY.lat) / 2,
        lng: (guessLL.lng() + DAILY.lng) / 2,
      },
      mapTypeId: 'roadmap',
      disableDefaultUI: true,
      styles: darkMapStyle(),
    });

    // Guess marker
    new google.maps.Marker({
      position: guessLL,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#c8f55a',
        fillOpacity: 1,
        strokeColor: '#0a0a0a',
        strokeWeight: 2,
      },
      title: 'Your guess',
    });

    // Target marker
    new google.maps.Marker({
      position: { lat: DAILY.lat, lng: DAILY.lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ff5c5c',
        fillOpacity: 1,
        strokeColor: '#0a0a0a',
        strokeWeight: 2,
      },
      title: DAILY.label,
    });

    // Line between
    new google.maps.Polyline({
      path: [guessLL, { lat: DAILY.lat, lng: DAILY.lng }],
      geodesic: true,
      strokeColor: '#c8f55a',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      map,
    });

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(guessLL);
    bounds.extend({ lat: DAILY.lat, lng: DAILY.lng });
    map.fitBounds(bounds, 60);
  }, 100);
}

// ─── WORDLE-STYLE GRID ────────────────────────────────────────────────────────
function buildScoreGrid(score) {
  const grid = document.getElementById('score-grid');
  grid.innerHTML = '';
  const filled = Math.round((score / 5000) * 5);
  for (let i = 0; i < 5; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (i < filled) cell.classList.add('filled');
    else if (i === filled) cell.classList.add('half');
    else cell.classList.add('empty');
    grid.appendChild(cell);
  }
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function buildCountdown() {
  function update() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown').textContent =
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  update();
  setInterval(update, 1000);
}

// ─── SHARE ────────────────────────────────────────────────────────────────────
document.getElementById('share-btn').addEventListener('click', () => {
  const score = document.getElementById('final-score').textContent;
  const distance = document.getElementById('distance-text').textContent;
  const cells = [...document.querySelectorAll('.wordle-grid .cell')];
  const emoji = cells.map(c =>
    c.classList.contains('filled') ? '🟩' :
    c.classList.contains('half') ? '🟨' : '⬛'
  ).join('');

  const text =
    `◈ DailyGeo — ${formatDate()}\n` +
    `Score: ${score}/5000\n` +
    `${distance}\n` +
    `${emoji}\n` +
    `https://yourdailygeo.app`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied! ✓';
    setTimeout(() => { btn.textContent = 'Copy Result 📋'; }, 2000);
  });
});

// ─── DARK MAP STYLE ───────────────────────────────────────────────────────────
function darkMapStyle() {
  return [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#888' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#444' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#333' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];
}
