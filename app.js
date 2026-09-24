/**
 * TerraSphere 3D - Penjelajah Bumi Jarak Jauh & Dekat
 * Core Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi ikon Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Inisialisasi latar belakang bintang kosmos
  initStarfield();

  // State Aplikasi
  const state = {
    currentLayer: 'satellite',
    projection: 'globe', // 'globe' atau 'mercator'
    autoSpin: true, // Aktif berputar otomatis sejak awal
    spinSpeed: 3.5, // Kecepatan rotasi: 3.5 derajat per detik (halus & sinematik)
    isMeasuring: false,
    measurePoints: [],
    activePresetTab: 'far',
    labelsVisible: true,
    roadsVisible: true,
    userInteracting: false
  };

  // =========================================================================
  // 1. Inisialisasi Peta MapLibre GL dengan Proyeksi Globe 3D
  // =========================================================================
  const mapStyle = {
    version: 8,
    projection: { type: 'globe' },
    sources: {
      'satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      },
      'osm': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors'
      },
      'dark': {
        type: 'raster',
        tiles: [
          'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© CARTO, © OpenStreetMap'
      },
      'topo': {
        type: 'raster',
        tiles: [
          'https://tile.opentopomap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 17,
        attribution: '© OpenTopoMap contributors'
      },
      'boundaries-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19
      },
      'transportation-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19
      },
      // GeoJSON source untuk alat ukur jarak
      'measure-geojson': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      },
      // Cincin Api Pasifik (Ring of Fire) Polyline
      'ring-of-fire': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Pacific Ring of Fire' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [174.0, -41.0], [178.0, -37.0], [-179.0, -25.0], [-175.0, -20.0],
                  [-178.0, -15.0], [168.0, -15.0], [155.0, -5.0], [145.0, -3.0],
                  [135.0, -3.0], [128.0, -3.5], [125.0, 1.5], [126.0, 7.0],
                  [122.0, 14.0], [121.5, 24.0], [128.0, 27.0], [130.5, 31.5],
                  [139.0, 35.0], [142.0, 40.0], [145.0, 45.0], [155.0, 50.0],
                  [160.0, 55.0], [166.0, 58.0], [178.0, 52.0], [-176.0, 52.0],
                  [-168.0, 53.0], [-155.0, 57.0], [-148.0, 60.0], [-135.0, 56.0],
                  [-128.0, 50.0], [-124.0, 45.0], [-122.0, 38.0], [-117.0, 32.0],
                  [-110.0, 24.0], [-105.0, 19.0], [-95.0, 15.0], [-88.0, 12.0],
                  [-83.0, 8.5], [-79.0, 2.0], [-79.0, -5.0], [-75.0, -15.0],
                  [-71.0, -25.0], [-71.0, -35.0], [-73.0, -45.0], [-70.0, -55.0],
                  [-60.0, -62.0]
                ]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'Sunda Arc Trench' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [93.0, 14.0], [95.0, 6.0], [98.0, 0.0], [102.0, -4.0],
                  [106.0, -7.0], [112.0, -9.0], [118.0, -10.0], [124.0, -10.0],
                  [130.0, -7.5], [133.0, -5.0], [136.0, -3.5]
                ]
              }
            }
          ]
        }
      },
      // Sumber Gempa Terkini USGS Real-Time
      'usgs-earthquakes': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      }
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        layout: { visibility: 'visible' }
      },
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
        layout: { visibility: 'none' }
      },
      {
        id: 'dark-layer',
        type: 'raster',
        source: 'dark',
        layout: { visibility: 'none' }
      },
      {
        id: 'topo-layer',
        type: 'raster',
        source: 'topo',
        layout: { visibility: 'none' }
      },
      {
        id: 'transport-layer',
        type: 'raster',
        source: 'transportation-labels',
        layout: { visibility: 'visible' }
      },
      {
        id: 'boundaries-layer',
        type: 'raster',
        source: 'boundaries-labels',
        layout: { visibility: 'visible' }
      },
      // Cincin Api Pasifik (Ring of Fire) Glow & Line
      {
        id: 'ring-of-fire-glow',
        type: 'line',
        source: 'ring-of-fire',
        layout: { visibility: 'visible' },
        paint: {
          'line-color': '#ff4757',
          'line-width': 7,
          'line-opacity': 0.35,
          'line-blur': 3
        }
      },
      {
        id: 'ring-of-fire-line',
        type: 'line',
        source: 'ring-of-fire',
        layout: { visibility: 'visible' },
        paint: {
          'line-color': '#ffa502',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      },
      // USGS Live Earthquakes Layers
      {
        id: 'usgs-quakes-pulse',
        type: 'circle',
        source: 'usgs-earthquakes',
        layout: { visibility: 'visible' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            4.5, 9,
            6.0, 18,
            7.5, 30
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'mag'],
            4.5, '#ffa502',
            6.0, '#ff4757',
            7.5, '#ff0033'
          ],
          'circle-opacity': 0.35,
          'circle-blur': 0.6
        }
      },
      {
        id: 'usgs-quakes-core',
        type: 'circle',
        source: 'usgs-earthquakes',
        layout: { visibility: 'visible' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            4.5, 4.5,
            6.0, 8.5,
            7.5, 14
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'mag'],
            4.5, '#ffa502',
            6.0, '#ff4757',
            7.5, '#ff0033'
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      },
      // Garis pengukuran jarak
      {
        id: 'measure-lines',
        type: 'line',
        source: 'measure-geojson',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#00f2fe',
          'line-width': 3,
          'line-dasharray': [2, 2]
        },
        filter: ['in', '$type', 'LineString']
      },
      // Titik pengukuran jarak
      {
        id: 'measure-points',
        type: 'circle',
        source: 'measure-geojson',
        paint: {
          'circle-radius': 7,
          'circle-color': '#00f2fe',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        },
        filter: ['in', '$type', 'Point']
      }
    ],
    sky: {
      'sky-color': '#030712',
      'horizon-color': '#0b1326',
      'fog-color': '#0f172a'
    }
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: mapStyle,
    center: [106.8272, -6.1754], // Mulai di atas Indonesia
    zoom: 1.6, // Tampilan awal: Seluruh dunia dari luar angkasa
    minZoom: 0.1,
    maxZoom: 20,
    maxPitch: 85,
    pitch: 0,
    bearing: 0,
    projection: { type: 'globe' } // 3D Globe Projection
  });

  // Tambahkan navigasi kontrol kecil jika perlu
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  // =========================================================================
  // 2. Data Preset Destinasi (Jarak Jauh, Menengah, Jarak Dekat)
  // =========================================================================
  const presetsData = {
    far: [
      {
        name: 'Bumi Utuh (Orbit Luar Angkasa)',
        location: 'Luar Angkasa • Ketinggian 20.000 km',
        badge: '🚀',
        tier: 'Jarak Sangat Jauh',
        center: [110.0, 0.0],
        zoom: 0.9,
        pitch: 0,
        bearing: 0
      },
      {
        name: 'Belahan Bumi Timur (Asia & Oseania)',
        location: 'Kawasan Pasifik & Asia',
        badge: '🌏',
        tier: 'Jarak Jauh',
        center: [105.0, 10.0],
        zoom: 2.2,
        pitch: 15,
        bearing: 0
      },
      {
        name: 'Belahan Bumi Barat (Amerika)',
        location: 'Samudra Atlantik & Pasifik',
        badge: '🌎',
        tier: 'Jarak Jauh',
        center: [-95.0, 25.0],
        zoom: 2.2,
        pitch: 15,
        bearing: 0
      },
      {
        name: 'Kutub Utara (Arktik)',
        location: 'Lapisan Es Lingkar Kutub Utara',
        badge: '❄️',
        tier: 'Jarak Jauh',
        center: [0.0, 85.0],
        zoom: 2.4,
        pitch: 25,
        bearing: 0
      },
      {
        name: 'Kutub Selatan (Antartika)',
        location: 'Benua Es Kutub Selatan',
        badge: '🐧',
        tier: 'Jarak Jauh',
        center: [0.0, -82.0],
        zoom: 2.4,
        pitch: 25,
        bearing: 0
      },
      {
        name: 'Gurun Sahara & Benua Afrika',
        location: 'Afrika Bagian Utara & Tengah',
        badge: '🏜️',
        tier: 'Jarak Jauh',
        center: [18.0, 15.0],
        zoom: 3.0,
        pitch: 20,
        bearing: 0
      }
    ],
    mid: [
      {
        name: 'Kepulauan Nusantara (Indonesia)',
        location: 'Sabang sampai Merauke',
        badge: '🇮🇩',
        tier: 'Jarak Menengah',
        center: [118.0, -2.5],
        zoom: 4.8,
        pitch: 25,
        bearing: 0
      },
      {
        name: 'Metropolitan Jabodetabek',
        location: 'Jakarta, Bogor, Depok, Tangerang, Bekasi',
        badge: '🏙️',
        tier: 'Jarak Menengah',
        center: [106.84, -6.22],
        zoom: 10.5,
        pitch: 35,
        bearing: 0
      },
      {
        name: 'Teluk Tokyo & Gunung Fuji',
        location: 'Honshu, Jepang',
        badge: '🗻',
        tier: 'Jarak Menengah',
        center: [139.25, 35.45],
        zoom: 9.6,
        pitch: 45,
        bearing: -20
      },
      {
        name: 'Kawasan Metropolitan New York',
        location: 'Pantai Timur Amerika Serikat',
        badge: '🗽',
        tier: 'Jarak Menengah',
        center: [-74.0, 40.71],
        zoom: 10.8,
        pitch: 40,
        bearing: 15
      },
      {
        name: 'Pegunungan Alpen Swiss',
        location: 'Eropa Tengah',
        badge: '🏔️',
        tier: 'Jarak Menengah',
        center: [8.5, 46.5],
        zoom: 8.5,
        pitch: 55,
        bearing: 30
      },
      {
        name: 'Gugusan Karang Great Barrier Reef',
        location: 'Queensland, Australia',
        badge: '🪸',
        tier: 'Jarak Menengah',
        center: [147.7, -18.3],
        zoom: 7.2,
        pitch: 35,
        bearing: 0
      }
    ],
    close: [
      {
        name: 'Monumen Nasional (Monas)',
        location: 'Gambir, Jakarta Pusat, Indonesia',
        badge: '🏛️',
        tier: 'Jarak Dekat (~200m)',
        center: [106.827153, -6.175392],
        zoom: 17.6,
        pitch: 60,
        bearing: -25
      },
      {
        name: 'Bundaran HI & Sudirman',
        location: 'Menteng, Jakarta Pusat, Indonesia',
        badge: '⛲',
        tier: 'Jarak Dekat (~250m)',
        center: [106.8231, -6.1950],
        zoom: 17.2,
        pitch: 60,
        bearing: 35
      },
      {
        name: 'Ka\'bah & Masjidil Haram',
        location: 'Makkah Al-Mukarramah, Arab Saudi',
        badge: '🕋',
        tier: 'Jarak Dekat (~150m)',
        center: [39.826206, 21.422487],
        zoom: 18.0,
        pitch: 50,
        bearing: 15
      },
      {
        name: 'Menara Eiffel & Champ de Mars',
        location: 'Paris, Prancis',
        badge: '🗼',
        tier: 'Jarak Dekat (~200m)',
        center: [2.294481, 48.858370],
        zoom: 17.8,
        pitch: 62,
        bearing: 40
      },
      {
        name: 'Piramida Agung Giza & Sphinx',
        location: 'Giza, Kairo, Mesir',
        badge: '📐',
        tier: 'Jarak Dekat (~300m)',
        center: [31.1342, 29.9792],
        zoom: 17.0,
        pitch: 58,
        bearing: -35
      },
      {
        name: 'Burj Khalifa & Downtown Dubai',
        location: 'Dubai, Uni Emirat Arab',
        badge: '🏢',
        tier: 'Jarak Dekat (~250m)',
        center: [55.2743, 25.1972],
        zoom: 17.5,
        pitch: 65,
        bearing: 55
      },
      {
        name: 'Puncak Gunung Everest',
        location: 'Himalaya, Perbatasan Nepal & Tibet',
        badge: '⛰️',
        tier: 'Jarak Dekat (~1.5km)',
        center: [86.9250, 27.9881],
        zoom: 14.8,
        pitch: 65,
        bearing: 125
      },
      {
        name: 'Colosseum & Forum Romawi',
        location: 'Roma, Italia',
        badge: '🏟️',
        tier: 'Jarak Dekat (~200m)',
        center: [12.4922, 41.8902],
        zoom: 17.8,
        pitch: 55,
        bearing: 25
      },
      {
        name: 'Grand Canyon National Park',
        location: 'Arizona, Amerika Serikat',
        badge: '🏜️',
        tier: 'Jarak Dekat (~2km)',
        center: [-112.1129, 36.1069],
        zoom: 14.5,
        pitch: 65,
        bearing: 75
      },
      {
        name: 'Kepulauan Karst Raja Ampat',
        location: 'Papua Barat Daya, Indonesia',
        badge: '🏝️',
        tier: 'Jarak Dekat (~3km)',
        center: [130.56, -0.52],
        zoom: 13.2,
        pitch: 45,
        bearing: 30
      }
    ]
  };

  // =========================================================================
  // 3. Update HUD Ketinggian & Koordinat Real-Time
  // =========================================================================
  const altitudeEl = document.getElementById('hud-altitude-val');
  const tierBadgeEl = document.getElementById('hud-tier-badge');
  const coordsEl = document.getElementById('hud-coords-val');
  const pitchEl = document.getElementById('hud-pitch-val');
  const tierBtns = document.querySelectorAll('.tier-btn');

  function calculateAltitude(zoom) {
    // Estimasi ketinggian realistis berdasarkan zoom level globe
    // Zoom 0 = ~35.000 km (Orbit Geostasioner / Luar Angkasa)
    // Zoom 19 = ~50 meter (Atap gedung / jalanan)
    const altKm = 35000 / Math.pow(2, zoom);
    return altKm;
  }

  function updateHUD() {
    const zoom = map.getZoom();
    const center = map.getCenter();
    const pitch = Math.round(map.getPitch());
    const bearing = Math.round(map.getBearing());

    // Hitung ketinggian kamera
    const altKm = calculateAltitude(zoom);

    let altFormatted = '';
    let tierText = '';
    let activeTier = '';

    if (altKm >= 5000) {
      altFormatted = `${Math.round(altKm).toLocaleString('id-ID')} km`;
      tierText = 'Luar Angkasa (Orbit Antariksa)';
      activeTier = 'space';
    } else if (altKm >= 1000) {
      altFormatted = `${Math.round(altKm).toLocaleString('id-ID')} km`;
      tierText = 'Orbit Rendah (Skala Benua)';
      activeTier = 'continent';
    } else if (altKm >= 50) {
      altFormatted = `${Math.round(altKm).toLocaleString('id-ID')} km`;
      tierText = 'Stratosfer (Skala Negara/Pulau)';
      activeTier = 'country';
    } else if (altKm >= 1.5) {
      altFormatted = `${altKm.toFixed(1).replace('.', ',')} km`;
      tierText = 'Ketinggian Pesawat (Skala Kota)';
      activeTier = 'city';
    } else {
      const altMeters = Math.max(25, Math.round(altKm * 1000));
      altFormatted = `${altMeters.toLocaleString('id-ID')} m`;
      tierText = 'Jarak Dekat (Tingkat Jalanan)';
      activeTier = 'street';
    }

    if (altitudeEl) altitudeEl.textContent = altFormatted;
    if (tierBadgeEl) tierBadgeEl.textContent = tierText;

    // Koordinat
    if (coordsEl) {
      const lat = center.lat.toFixed(4);
      const lng = center.lng.toFixed(4);
      const latDir = center.lat >= 0 ? 'LU' : 'LS';
      const lngDir = center.lng >= 0 ? 'BT' : 'BB';
      coordsEl.textContent = `${Math.abs(lat)}° ${latDir}, ${Math.abs(lng)}° ${lngDir}`;
    }

    // Sudut
    if (pitchEl) {
      pitchEl.textContent = `Kemiringan: ${pitch}° | Arah: ${bearing}°`;
    }

    // Update highlight tombol skala jarak kanan
    tierBtns.forEach(btn => {
      if (btn.dataset.tier === activeTier) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  let lastHUDTime = 0;
  function throttledUpdateHUD() {
    const now = performance.now();
    if (now - lastHUDTime > 90) {
      lastHUDTime = now;
      updateHUD();
    }
  }

  map.on('move', throttledUpdateHUD);
  map.on('zoom', updateHUD);
  map.on('rotate', throttledUpdateHUD);
  map.on('pitch', throttledUpdateHUD);

  // =========================================================================
  // 4. Rotasi Bumi Otomatis (Continuous 60FPS Silky Smooth Earth Spin)
  // =========================================================================
  const toggleSpinBtn = document.getElementById('toggle-spin-btn');
  let lastSpinTime = performance.now();
  let resumeSpinTimeout = null;

  function spinGlobeLoop(currentTime) {
    const dt = Math.min((currentTime - lastSpinTime) / 1000, 0.08); // Detik yang telah berlalu
    lastSpinTime = currentTime;

    if (state.autoSpin && !state.userInteracting && state.projection === 'globe') {
      const zoom = map.getZoom();
      // Hanya berputar saat melihat bumi dari luar angkasa / skala benua (zoom < 6.5)
      if (zoom < 6.5) {
        // Semakin zoom mendekat, kecepatan melambat secara natural
        const zoomFactor = Math.max(0.12, (6.5 - zoom) / 6.0);
        const degreesToRotate = state.spinSpeed * zoomFactor * dt;
        const center = map.getCenter();
        center.lng -= degreesToRotate;
        if (center.lng < -180) center.lng += 360;
        if (center.lng > 180) center.lng -= 360;
        map.jumpTo({ center });
      }
    }

    requestAnimationFrame(spinGlobeLoop);
  }

  // Mulai loop animasi rotasi 60 FPS
  requestAnimationFrame(spinGlobeLoop);

  function setAutoSpin(enable) {
    state.autoSpin = enable;
    if (enable) {
      toggleSpinBtn.classList.add('active');
      lastSpinTime = performance.now();
      showToast('Rotasi Bumi Otomatis Berjalan');
    } else {
      toggleSpinBtn.classList.remove('active');
      showToast('Rotasi Bumi Dijeda');
    }
  }

  toggleSpinBtn.addEventListener('click', () => {
    setAutoSpin(!state.autoSpin);
  });

  // Jeda rotasi bumi saat pengguna sedang berinteraksi/menggeser, dan lanjutkan otomatis setelah selesai
  function pauseSpinForInteraction() {
    state.userInteracting = true;
    clearTimeout(resumeSpinTimeout);
  }

  function scheduleResumeSpin() {
    clearTimeout(resumeSpinTimeout);
    resumeSpinTimeout = setTimeout(() => {
      state.userInteracting = false;
      lastSpinTime = performance.now();
    }, 1800);
  }

  map.on('mousedown', pauseSpinForInteraction);
  map.on('dragstart', pauseSpinForInteraction);
  map.on('touchstart', pauseSpinForInteraction);
  map.on('wheel', () => {
    pauseSpinForInteraction();
    scheduleResumeSpin();
  });

  map.on('mouseup', scheduleResumeSpin);
  map.on('touchend', scheduleResumeSpin);

  // =========================================================================
  // 5. Toggle Proyeksi Bola Bumi 3D (Globe) vs Peta Datar (Flat Map)
  // =========================================================================
  const toggleProjBtn = document.getElementById('toggle-projection-btn');

  toggleProjBtn.addEventListener('click', () => {
    if (state.projection === 'globe') {
      state.projection = 'mercator';
      map.setProjection({ type: 'mercator' });
      toggleProjBtn.classList.remove('active');
      toggleProjBtn.querySelector('.btn-label').textContent = 'Peta Datar';
      showToast('Beralih ke Mode Peta Datar (Mercator)');
    } else {
      state.projection = 'globe';
      map.setProjection({ type: 'globe' });
      toggleProjBtn.classList.add('active');
      toggleProjBtn.querySelector('.btn-label').textContent = 'Globe 3D';
      showToast('Beralih ke Mode Bola Bumi 3D');
    }
  });

  // =========================================================================
  // 6. Manajemen Lapisan Peta (Layer Switcher)
  // =========================================================================
  const layerMenuBtn = document.getElementById('layer-menu-btn');
  const layerDrawer = document.getElementById('layer-drawer');
  const closeLayerCard = document.getElementById('close-layer-card');
  const layerOptionBtns = document.querySelectorAll('.layer-option-btn');
  const toggleLabelsChk = document.getElementById('toggle-labels-chk');
  const toggleRoadsChk = document.getElementById('toggle-roads-chk');

  layerMenuBtn.addEventListener('click', () => {
    layerDrawer.classList.toggle('hidden');
    // Tutup presets drawer jika terbuka
    presetsPanel.classList.add('hidden');
  });

  closeLayerCard.addEventListener('click', () => {
    layerDrawer.classList.add('hidden');
  });

  function switchBaseLayer(layerKey) {
    state.currentLayer = layerKey;
    const baseLayers = ['satellite-layer', 'osm-layer', 'dark-layer', 'topo-layer'];

    baseLayers.forEach(lId => {
      const isTarget = lId === `${layerKey}-layer`;
      if (map.getLayer(lId)) {
        map.setLayoutProperty(lId, 'visibility', isTarget ? 'visible' : 'none');
      }
    });

    layerOptionBtns.forEach(btn => {
      if (btn.dataset.layer === layerKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    showToast(`Lapisan diubah: ${layerKey.toUpperCase()}`);
  }

  layerOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchBaseLayer(btn.dataset.layer);
    });
  });

  // Toggle Labels & Roads Overlays
  toggleLabelsChk.addEventListener('change', (e) => {
    state.labelsVisible = e.target.checked;
    if (map.getLayer('boundaries-layer')) {
      map.setLayoutProperty('boundaries-layer', 'visibility', e.target.checked ? 'visible' : 'none');
    }
  });

  toggleRoadsChk.addEventListener('change', (e) => {
    state.roadsVisible = e.target.checked;
    if (map.getLayer('transport-layer')) {
      map.setLayoutProperty('transport-layer', 'visibility', e.target.checked ? 'visible' : 'none');
    }
  });

  // =========================================================================
  // 7. Panel Preset Destinasi (Jarak Jauh s/d Jarak Dekat)
  // =========================================================================
  const presetsMenuBtn = document.getElementById('presets-menu-btn');
  const presetsPanel = document.getElementById('presets-panel');
  const closePresetsBtn = document.getElementById('close-presets-btn');
  const presetTabs = document.querySelectorAll('.preset-tab');
  const presetsListEl = document.getElementById('presets-list');

  presetsMenuBtn.addEventListener('click', () => {
    presetsPanel.classList.toggle('hidden');
    // Tutup layer drawer jika terbuka
    layerDrawer.classList.add('hidden');
  });

  closePresetsBtn.addEventListener('click', () => {
    presetsPanel.classList.add('hidden');
  });

  function renderPresets(category) {
    presetsListEl.innerHTML = '';
    const items = presetsData[category] || [];

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'preset-item';
      div.innerHTML = `
        <div class="preset-badge">${item.badge}</div>
        <div class="preset-details">
          <span class="preset-name">${item.name}</span>
          <span class="preset-location">${item.location}</span>
        </div>
        <div class="preset-zoom-badge">${item.tier}</div>
      `;

      div.addEventListener('click', () => {
        // Terbang ke lokasi
        map.flyTo({
          center: item.center,
          zoom: item.zoom,
          pitch: item.pitch,
          bearing: item.bearing,
          speed: 1.2,
          curve: 1.4,
          essential: true
        });
        showToast(`Terbang menuju: ${item.name}`);
        // Tutup di layar kecil
        if (window.innerWidth < 768) {
          presetsPanel.classList.add('hidden');
        }
      });

      presetsListEl.appendChild(div);
    });
  }

  presetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      presetTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activePresetTab = tab.dataset.tab;
      renderPresets(tab.dataset.tab);
    });
  });

  // Render awal presets jarak jauh
  renderPresets('far');

  // =========================================================================
  // 8. Tombol Cepat Skala Jarak (Tier Buttons di Sebelah Kanan)
  // =========================================================================
  tierBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tier = btn.dataset.tier;
      let targetZoom = 1.5;
      let targetPitch = 0;

      switch (tier) {
        case 'space':
          targetZoom = 0.9;
          targetPitch = 0;
          break;
        case 'continent':
          targetZoom = 3.2;
          targetPitch = 15;
          break;
        case 'country':
          targetZoom = 6.0;
          targetPitch = 25;
          break;
        case 'city':
          targetZoom = 11.5;
          targetPitch = 40;
          break;
        case 'street':
          targetZoom = 17.5;
          targetPitch = 55;
          break;
      }

      map.flyTo({
        zoom: targetZoom,
        pitch: targetPitch,
        speed: 1.1,
        curve: 1.3,
        essential: true
      });
    });
  });

  // =========================================================================
  // 9. Floating Control Buttons (Zoom, Tilt, North, Fullscreen)
  // =========================================================================
  document.getElementById('zoom-in-btn').addEventListener('click', () => {
    map.zoomIn({ duration: 500 });
  });

  document.getElementById('zoom-out-btn').addEventListener('click', () => {
    map.zoomOut({ duration: 500 });
  });

  const tiltBtn = document.getElementById('tilt-toggle-btn');
  tiltBtn.addEventListener('click', () => {
    const currentPitch = map.getPitch();
    const newPitch = currentPitch > 25 ? 0 : 60;
    map.easeTo({ pitch: newPitch, duration: 800 });
    tiltBtn.classList.toggle('active', newPitch > 0);
  });

  document.getElementById('reset-north-btn').addEventListener('click', () => {
    map.resetNorth({ duration: 800 });
  });

  const myLocationBtn = document.getElementById('my-location-btn');
  if (myLocationBtn) {
    myLocationBtn.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        showToast('Mencari posisi perangkat Anda (GPS)...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;

            if (state.autoSpin) {
              state.userInteracting = true;
              clearTimeout(resumeSpinTimeout);
            }

            map.flyTo({
              center: [lng, lat],
              zoom: 15.5,
              pitch: 50,
              speed: 1.2,
              curve: 1.3,
              essential: true
            });

            handleTargetLocationClick(lng, lat, 'Lokasi Anda Saat Ini', 'Berdasarkan sensor GPS perangkat Anda');
            showToast('Kamera terarah ke lokasi Anda saat ini!');
          },
          (err) => {
            showToast('Gagal mengakses GPS: ' + err.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        showToast('Browser Anda tidak mendukung deteksi lokasi GPS.');
      }
    });
  }

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  });

  // =========================================================================
  // 10. Pencarian Lokasi Global (Live Nominatim Geocoding)
  // =========================================================================
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-results');
  const clearSearchBtn = document.getElementById('clear-search');
  const searchSpinner = document.getElementById('search-spinner');

  let debounceTimer = null;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
      searchDropdown.classList.add('hidden');
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 380);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchDropdown.classList.add('hidden');
    searchInput.focus();
  });

  async function performSearch(query) {
    searchSpinner.classList.remove('hidden');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'id,en' }
      });
      const data = await res.json();
      searchSpinner.classList.add('hidden');

      if (data && data.length > 0) {
        renderSearchResults(data);
      } else {
        searchDropdown.innerHTML = '<div style="padding: 14px; font-size: 0.85rem; color: #94a3b8; text-align: center;">Lokasi tidak ditemukan. Coba kata kunci lain.</div>';
        searchDropdown.classList.remove('hidden');
      }
    } catch (err) {
      searchSpinner.classList.add('hidden');
      console.error('Search error:', err);
    }
  }

  function renderSearchResults(results) {
    searchDropdown.innerHTML = '';
    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-item';

      const displayName = res.display_name;
      const parts = displayName.split(',');
      const mainTitle = parts[0];
      const subTitle = parts.slice(1).join(',').trim();

      item.innerHTML = `
        <i data-lucide="map-pin" class="search-item-icon"></i>
        <div class="search-item-details">
          <span class="search-item-title">${mainTitle}</span>
          <span class="search-item-subtitle">${subTitle || res.type}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        const lat = parseFloat(res.lat);
        const lon = parseFloat(res.lon);

        // Tentukan level zoom berdasarkan tipe objek
        let targetZoom = 15;
        if (res.type === 'country' || res.addresstype === 'country') {
          targetZoom = 5.5;
        } else if (res.type === 'state' || res.addresstype === 'state') {
          targetZoom = 7.5;
        } else if (res.type === 'city' || res.addresstype === 'city') {
          targetZoom = 12.0;
        }

        map.flyTo({
          center: [lon, lat],
          zoom: targetZoom,
          pitch: 45,
          speed: 1.2,
          essential: true
        });

        // Tambahkan marker sementara
        new maplibregl.Marker({ color: '#00f2fe' })
          .setLngLat([lon, lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${mainTitle}</strong><br><small>${subTitle}</small>`))
          .addTo(map)
          .togglePopup();

        searchDropdown.classList.add('hidden');
        showToast(`Menuju: ${mainTitle}`);
      });

      searchDropdown.appendChild(item);
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: searchDropdown });
    }
    searchDropdown.classList.remove('hidden');
  }

  // Tutup dropdown jika klik di luar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchDropdown.classList.add('hidden');
    }
  });

  // =========================================================================
  // 11. Alat Ukur Jarak Antar Titik di Bola Dunia (Distance Ruler)
  // =========================================================================
  const measureBtn = document.getElementById('measure-btn');
  const measureBanner = document.getElementById('measure-banner');
  const clearMeasureBtn = document.getElementById('clear-measure-btn');
  const closeMeasureBtn = document.getElementById('close-measure-btn');
  const measurementHud = document.getElementById('measurement-hud');
  const measurementVal = document.getElementById('measurement-val');

  function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function updateMeasureGeoJSON() {
    const features = [];

    // Tambahkan titik-titik
    state.measurePoints.forEach(pt => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: pt
        }
      });
    });

    // Tambahkan garis jika ada >= 2 titik
    if (state.measurePoints.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: state.measurePoints
        }
      });

      // Hitung total jarak
      let totalDist = 0;
      for (let i = 0; i < state.measurePoints.length - 1; i++) {
        const p1 = state.measurePoints[i];
        const p2 = state.measurePoints[i + 1];
        totalDist += calculateHaversineDistance(p1[0], p1[1], p2[0], p2[1]);
      }

      measurementHud.style.display = 'flex';
      let distText = totalDist >= 1 ? `${totalDist.toFixed(2).replace('.', ',')} km` : `${Math.round(totalDist * 1000)} meter`;
      measurementVal.textContent = distText;
      showToast(`Jarak terukur: ${distText}`);
    } else {
      measurementHud.style.display = 'none';
    }

    const source = map.getSource('measure-geojson');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: features
      });
    }
  }

  function toggleMeasureMode(enable) {
    state.isMeasuring = enable;
    measureBtn.classList.toggle('active', enable);
    measureBanner.classList.toggle('hidden', !enable);

    if (enable) {
      map.getCanvas().style.cursor = 'crosshair';
      showToast('Mode Pengukur Aktif: Klik pada permukaan bumi untuk mengukur jarak.');
    } else {
      map.getCanvas().style.cursor = '';
      clearMeasurement();
    }
  }

  function clearMeasurement() {
    state.measurePoints = [];
    updateMeasureGeoJSON();
  }

  measureBtn.addEventListener('click', () => {
    toggleMeasureMode(!state.isMeasuring);
  });

  clearMeasureBtn.addEventListener('click', clearMeasurement);
  closeMeasureBtn.addEventListener('click', () => toggleMeasureMode(false));

  // Variabel marker dan popup penanda klik lokasi
  let activeClickMarker = null;
  let activeClickPopup = null;

  async function handleTargetLocationClick(lng, lat, customTitle, customSub) {
    // Hapus marker & popup sebelumnya jika ada
    if (activeClickMarker) {
      activeClickMarker.remove();
      activeClickMarker = null;
    }
    if (activeClickPopup) {
      activeClickPopup.remove();
      activeClickPopup = null;
    }

    // Buat elemen penanda target berdenyut (ripple pulse)
    const markerEl = document.createElement('div');
    markerEl.className = 'click-target-pin';
    activeClickMarker = new maplibregl.Marker({ element: markerEl })
      .setLngLat([lng, lat])
      .addTo(map);

    const latDir = lat >= 0 ? 'LU' : 'LS';
    const lngDir = lng >= 0 ? 'BT' : 'BB';
    const coordsFormatted = `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;

    let title = customTitle || 'Memuat nama tempat...';
    let subtitle = customSub || coordsFormatted;

    // Tampilkan popup awal
    activeClickPopup = new maplibregl.Popup({ offset: 18, maxWidth: '320px' })
      .setLngLat([lng, lat])
      .setHTML(`
        <div class="click-popup-content">
          <h4 id="click-pop-title">${title}</h4>
          <div class="popup-sub" id="click-pop-sub">${subtitle}</div>
          <div class="popup-coords">📍 Koordinat: ${coordsFormatted}</div>
          <div class="disaster-popup-actions">
            <button class="btn-popup-zoom" onclick="window.flyToLocation(${lng}, ${lat}, 16.5, 55)">Jarak Dekat (~500m)</button>
            <button class="btn-popup-orbit" onclick="window.flyToLocation(${lng}, ${lat}, 1.5, 0)">Luar Angkasa</button>
          </div>
        </div>
      `)
      .addTo(map);

    // Reverse Geocoding otomatis jika tidak ada customTitle
    if (!customTitle) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`, {
          headers: { 'Accept-Language': 'id,en' }
        });
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const mainTitle = parts[0];
          const subTitle = parts.slice(1, 3).join(',').trim();

          const titleEl = document.getElementById('click-pop-title');
          const subEl = document.getElementById('click-pop-sub');
          if (titleEl) titleEl.textContent = mainTitle;
          if (subEl) subEl.textContent = subTitle || data.type;
        } else {
          const titleEl = document.getElementById('click-pop-title');
          if (titleEl) titleEl.textContent = 'Wilayah Samudra / Terpencil';
        }
      } catch (err) {
        const titleEl = document.getElementById('click-pop-title');
        if (titleEl) titleEl.textContent = 'Titik Koordinat Terpilih';
      }
    }
  }

  // Handler klik pada peta: Mengarahkan kamera langsung ke lokasi yang dipencet
  map.on('click', (e) => {
    // Jika mode pengukur jarak sedang aktif
    if (state.isMeasuring) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      state.measurePoints.push(coords);
      updateMeasureGeoJSON();
      return;
    }

    // Jika mengklik titik gempa bumi USGS, biarkan handler gempa yang memprosesnya
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['usgs-quakes-core']
    });
    if (features && features.length > 0) return;

    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    const currentZoom = map.getZoom();

    // Tentukan zoom target yang presisi dan nyaman
    let targetZoom = currentZoom;
    if (currentZoom < 3.2) {
      targetZoom = 5.2; // Dari orbit luar angkasa menukik ke skala negara/wilayah
    } else if (currentZoom < 9.0) {
      targetZoom = currentZoom + 2.0;
    }

    // Jeda putaran bumi sementara agar lokasi terpantau jelas
    if (state.autoSpin) {
      state.userInteracting = true;
      clearTimeout(resumeSpinTimeout);
    }

    // Terbang dan arahkan kamera tepat ke lokasi yang dipencet
    map.flyTo({
      center: [lng, lat],
      zoom: targetZoom,
      speed: 1.2,
      curve: 1.3,
      essential: true
    });

    // Tampilkan penanda target dan kartu informasi tempat
    handleTargetLocationClick(lng, lat);
    showToast('Kamera terarah ke lokasi yang dipencet!');
  });

  // =========================================================================
  // 12. Modul Jejak & Pemantau Bencana Alam Dunia (Disaster Monitor)
  // =========================================================================
  const historicalDisasters = [
    {
      id: 'aceh-2004',
      name: 'Gempa Megathrust & Tsunami Aceh',
      type: 'tsunami',
      badge: '🌊',
      date: '26 Desember 2004',
      location: 'Banda Aceh & Samudra Hindia',
      coordinates: [95.854, 3.316],
      magnitude: 'M 9.1 - 9.3',
      depth: '30 km',
      impact: '230.000+ korban jiwa di 14 negara',
      zoomNear: 16.2,
      zoomFar: 4.5,
      pitch: 55,
      desc: 'Salah satu gempa terkuat dalam sejarah modern. Menimbulkan tsunami hingga 30 meter yang melintasi Samudra Hindia dan menyapu pesisir Aceh, Thailand, Sri Lanka, hingga Afrika timur.'
    },
    {
      id: 'krakatau-1883',
      name: 'Letusan Dahsyat Krakatau',
      type: 'volcano',
      badge: '🌋',
      date: '27 Agustus 1883',
      location: 'Selat Sunda, Indonesia',
      coordinates: [105.423, -6.102],
      magnitude: 'VEI 6 (Kataklismik)',
      depth: 'Kaldera Bawah Laut',
      impact: '36.417+ korban jiwa & tsunami 40m',
      zoomNear: 15.5,
      zoomFar: 4.8,
      pitch: 60,
      desc: 'Dentuman ledakan terdengar hingga 4.800 km jauhnya. Melontarkan 21 km³ material vulkanik, meruntuhkan 2/3 pulau ke laut, dan abunya membuat langit dunia meredup bertahun-tahun.'
    },
    {
      id: 'tambora-1815',
      name: 'Letusan Raksasa Supervolcano Tambora',
      type: 'volcano',
      badge: '🌋',
      date: '10 April 1815',
      location: 'Sumbawa, Nusa Tenggara Barat',
      coordinates: [117.996, -8.248],
      magnitude: 'VEI 7 (Terbesar Sejarah Modern)',
      depth: 'Kaldera Raksasa 7 km',
      impact: '71.000+ korban & "Tahun Tanpa Musim Panas"',
      zoomNear: 14.8,
      zoomFar: 5.0,
      pitch: 62,
      desc: 'Letusan gunung berapi paling mematikan dan terbesar dalam sejarah peradaban tertulis. Kaldera terbentuk selebar 7 km sedalam 1.200 meter dan mengubah iklim belahan bumi utara pada 1816.'
    },
    {
      id: 'palu-2018',
      name: 'Gempa & Tsunami Likuifaksi Palu',
      type: 'earthquake',
      badge: '💥',
      date: '28 September 2018',
      location: 'Palu & Donggala, Sulawesi Tengah',
      coordinates: [119.840, -0.898],
      magnitude: 'M 7.5',
      depth: '10 km (Dangkal)',
      impact: '4.340 korban jiwa & likuifaksi masif',
      zoomNear: 16.2,
      zoomFar: 5.5,
      pitch: 58,
      desc: 'Pergeseran sesar Palu-Koro memicu gempa dangkal berdaya rusak tinggi, tsunami di Teluk Palu, dan likuifaksi ekstrem di Petobo dan Balaroa di mana tanah berubah seperti lumpur cair.'
    },
    {
      id: 'tohoku-2011',
      name: 'Gempa Megathrust & Tsunami Tohoku',
      type: 'tsunami',
      badge: '🌊',
      date: '11 Maret 2011',
      location: 'Lepas Pantai Sendai, Honshu, Jepang',
      coordinates: [142.373, 38.297],
      magnitude: 'M 9.1',
      depth: '29 km',
      impact: '19.759 korban jiwa & krisis reaktor Fukushima',
      zoomNear: 15.2,
      zoomFar: 4.8,
      pitch: 55,
      desc: 'Gempa terkuat dalam catatan seismik Jepang. Gelombang tsunami hingga 40,5 meter menghantam daratan sejauh 10 km dan menyebabkan krisis nuklir di PLTN Fukushima Daiichi.'
    },
    {
      id: 'turki-2023',
      name: 'Gempa Dahsyat Turki & Suriah',
      type: 'earthquake',
      badge: '💥',
      date: '6 Februari 2023',
      location: 'Kahramanmaraş & Gaziantep, Turki',
      coordinates: [37.032, 37.174],
      magnitude: 'M 7.8 & M 7.5 (Gempa Kembar)',
      depth: '17.9 km',
      impact: '59.259+ korban jiwa di Turki & Suriah',
      zoomNear: 15.0,
      zoomFar: 4.5,
      pitch: 50,
      desc: 'Patahan Anatolia Timur mengalami pergeseran masif hingga 3 meter, meruntuhkan ribuan gedung bertingkat di 11 provinsi Turki dan wilayah perbatasan Suriah utara.'
    },
    {
      id: 'valdivia-1960',
      name: 'Gempa Terbesar Dunia: Valdivia 1960',
      type: 'earthquake',
      badge: '💥',
      date: '22 Mei 1960',
      location: 'Valdivia, Chili',
      coordinates: [-73.245, -39.814],
      magnitude: 'M 9.5 (Rekor Tertinggi Dunia)',
      depth: '33 km',
      impact: '1.655-6.000 korban & tsunami melintasi Pasifik',
      zoomNear: 15.0,
      zoomFar: 4.2,
      pitch: 50,
      desc: 'Gempa bumi dengan magnitudo terbesar yang pernah terukur oleh instrumen seismometer manusia. Tsunami yang dihasilkan menyeberangi Samudra Pasifik hingga menghantam Hawaii, Jepang, dan Filipina.'
    },
    {
      id: 'merapi-2010',
      name: 'Erupsi Dahsyat Gunung Merapi 2010',
      type: 'volcano',
      badge: '🌋',
      date: '26 Oktober - November 2010',
      location: 'Sleman & Magelang, Jawa Tengah & DIY',
      coordinates: [110.446, -7.540],
      magnitude: 'VEI 4',
      depth: 'Kubah Lava Aktif',
      impact: '353 korban jiwa & 350.000+ pengungsi',
      zoomNear: 15.8,
      zoomFar: 5.5,
      pitch: 62,
      desc: 'Letusan eksplosif terbesar Merapi dalam 100 tahun terakhir. Semburan awan panas (wedhus gembel) meluncur lebih dari 15 km menyusuri Sungai Gendol.'
    },
    {
      id: 'vesuvius-79',
      name: 'Letusan Vesuvius & Kota Pompeii',
      type: 'volcano',
      badge: '🌋',
      date: 'Tahun 79 Masehi',
      location: 'Teluk Napoli, Campania, Italia',
      coordinates: [14.429, 40.822],
      magnitude: 'VEI 5 (Erupsi Plinian)',
      depth: 'Stratovulkan',
      impact: 'Seluruh kota Pompeii & Herculaneum terkubur abu',
      zoomNear: 16.0,
      zoomFar: 5.0,
      pitch: 60,
      desc: 'Letusan dahsyat yang menyemburkan batu apung dan gas beracun setinggi 33 km, membekukan dan mengubur seluruh kehidupan kota Romawi kuno Pompeii di bawah lapisan tebal abu vulkanik.'
    },
    {
      id: 'tonga-2022',
      name: 'Letusan Hunga Tonga Bawah Laut',
      type: 'volcano',
      badge: '🌋',
      date: '15 Januari 2022',
      location: 'Kepulauan Tonga, Samudra Pasifik',
      coordinates: [-175.383, -20.546],
      magnitude: 'VEI 5-6 (Terbesar Abad 21)',
      depth: '150 meter Bawah Laut',
      impact: 'Gelombang kejut atmosfer keliling bumi 4 kali',
      zoomNear: 14.2,
      zoomFar: 3.5,
      pitch: 45,
      desc: 'Ledakan bawah laut terdahsyat abad ke-21. Menyemburkan kolom uap air dan abu hingga ketinggian mesosfer 58 km dan memicu gelombang tsunami trans-samudra.'
    },
    {
      id: 'katrina-2005',
      name: 'Badai Siklon Hurricane Katrina',
      type: 'storm',
      badge: '🌀',
      date: '29 Agustus 2005',
      location: 'New Orleans, Teluk Meksiko, AS',
      coordinates: [-90.071, 29.951],
      magnitude: 'Kategori 5 (280 km/jam)',
      depth: 'Tekanan Udara 902 mbar',
      impact: '1.833 korban jiwa & 80% New Orleans tenggelam',
      zoomNear: 14.8,
      zoomFar: 4.8,
      pitch: 45,
      desc: 'Salah satu bencana badai tropis termahal dan paling mematikan dalam sejarah AS. Tanggul pelindung danau jebol menyebabkan banjir dahsyat merendam kota New Orleans.'
    },
    {
      id: 'nargis-2008',
      name: 'Siklon Tropis Nargis',
      type: 'storm',
      badge: '🌀',
      date: '2 Mei 2008',
      location: 'Delta Sungai Irrawaddy, Myanmar',
      coordinates: [95.220, 16.050],
      magnitude: 'Kategori 4 (215 km/jam)',
      depth: 'Storm Surge 4 meter',
      impact: '138.373+ korban jiwa',
      zoomNear: 14.0,
      zoomFar: 4.5,
      pitch: 40,
      desc: 'Siklon tropis paling mematikan di Asia Tenggara modern. Gelombang pasang badai menyapu dataran delta padat penduduk yang minim sistem peringatan dini.'
    },
    {
      id: 'haiti-2010',
      name: 'Gempa Dahsyat Haiti 2010',
      type: 'earthquake',
      badge: '💥',
      date: '12 Januari 2010',
      location: 'Port-au-Prince, Haiti, Karibia',
      coordinates: [-72.533, 18.457],
      magnitude: 'M 7.0',
      depth: '13 km (Sangat Dangkal)',
      impact: '220.000+ korban jiwa & 1,5 juta tunawisma',
      zoomNear: 15.5,
      zoomFar: 5.0,
      pitch: 50,
      desc: 'Gempa dangkal berpusat tepat di bawah kawasan ibu kota yang padat, meluluhlantakkan ratusan ribu bangunan yang rentan gempa di sekeliling Teluk Gonave.'
    }
  ];

  // Helper fungsi terbang global untuk tombol pada popup
  window.flyToLocation = function(lon, lat, zoom, pitch, bearing) {
    map.flyTo({
      center: [lon, lat],
      zoom: zoom || 15.5,
      pitch: pitch !== undefined ? pitch : 55,
      bearing: bearing || 0,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });
  };

  const disasterMenuBtn = document.getElementById('disaster-menu-btn');
  const disasterPanel = document.getElementById('disaster-panel');
  const closeDisasterBtn = document.getElementById('close-disaster-btn');
  const disasterListEl = document.getElementById('disaster-list');
  const disasterFilterBtns = document.querySelectorAll('.disaster-filter-btn');
  const toggleUsgsLive = document.getElementById('toggle-usgs-live');
  const toggleRingOfFire = document.getElementById('toggle-ring-of-fire');
  const usgsCountBadge = document.getElementById('usgs-count-badge');

  // Toggle Panel Bencana Alam
  if (disasterMenuBtn) {
    disasterMenuBtn.addEventListener('click', () => {
      disasterPanel.classList.toggle('hidden');
      presetsPanel.classList.add('hidden');
      layerDrawer.classList.add('hidden');
    });
  }

  if (closeDisasterBtn) {
    closeDisasterBtn.addEventListener('click', () => {
      disasterPanel.classList.add('hidden');
    });
  }

  // Render Daftar Bencana Alam Bersejarah
  function renderDisasterList(filterType) {
    if (!disasterListEl) return;
    disasterListEl.innerHTML = '';

    const filtered = filterType === 'all' 
      ? historicalDisasters 
      : historicalDisasters.filter(d => d.type === filterType);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'disaster-card';
      card.innerHTML = `
        <div class="disaster-icon-box">${item.badge}</div>
        <div class="disaster-info-main">
          <span class="disaster-title">${item.name}</span>
          <span class="disaster-location-text">${item.location} • ${item.date}</span>
          <div class="disaster-meta-chips">
            <span class="meta-chip meta-chip-danger">${item.magnitude}</span>
            <span class="meta-chip">${item.depth}</span>
            <span class="meta-chip meta-chip-warning">${item.impact.split('&')[0].trim()}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openDisasterDetail(item);
        if (window.innerWidth < 768) {
          disasterPanel.classList.add('hidden');
        }
      });

      disasterListEl.appendChild(card);
    });
  }

  function openDisasterDetail(item) {
    map.flyTo({
      center: item.coordinates,
      zoom: item.zoomNear,
      pitch: item.pitch,
      bearing: 25,
      speed: 1.2,
      curve: 1.3,
      essential: true
    });

    const popupHtml = `
      <div class="disaster-popup-content">
        <h4>${item.badge} ${item.name}</h4>
        <div class="popup-sub">${item.location} • ${item.date}</div>
        <div class="popup-stat"><span>Kekuatan/Magnitudo:</span> <strong style="color: #ff6b6b">${item.magnitude}</strong></div>
        <div class="popup-stat"><span>Kedalaman/Tipe:</span> <strong>${item.depth}</strong></div>
        <div class="popup-stat"><span>Dampak Bencana:</span> <strong style="color: #ffa502">${item.impact}</strong></div>
        <div class="popup-desc">${item.desc}</div>
        <div class="disaster-popup-actions">
          <button class="btn-popup-zoom" onclick="window.flyToLocation(${item.coordinates[0]}, ${item.coordinates[1]}, ${item.zoomNear}, ${item.pitch})">Jarak Dekat (~500m)</button>
          <button class="btn-popup-orbit" onclick="window.flyToLocation(${item.coordinates[0]}, ${item.coordinates[1]}, ${item.zoomFar}, 15)">Jarak Jauh (Orbit)</button>
        </div>
      </div>
    `;

    new maplibregl.Popup({ offset: 25, maxWidth: '340px' })
      .setLngLat(item.coordinates)
      .setHTML(popupHtml)
      .addTo(map);

    showToast(`Pusat Bencana: ${item.name}`);
  }

  // Filter Kategori Bencana
  disasterFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      disasterFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDisasterList(btn.dataset.filter);
    });
  });

  // Pasang Marker Bencana Bersejarah di Globe
  function initDisasterMarkers() {
    historicalDisasters.forEach(disaster => {
      const el = document.createElement('div');
      el.className = 'disaster-map-marker';
      el.title = `${disaster.name} (${disaster.date})`;
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid #ff4757;
          box-shadow: 0 0 14px rgba(255, 71, 87, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          transition: transform 0.2s ease;
        ">
          ${disaster.badge}
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.firstElementChild.style.transform = 'scale(1.3)';
      });
      el.addEventListener('mouseleave', () => {
        el.firstElementChild.style.transform = 'scale(1)';
      });

      new maplibregl.Marker({ element: el })
        .setLngLat(disaster.coordinates)
        .addTo(map);

      el.addEventListener('click', () => {
        openDisasterDetail(disaster);
      });
    });
  }

  // Fetch Gempa Terkini Real-Time dari USGS (United States Geological Survey)
  async function fetchLiveEarthquakes() {
    if (usgsCountBadge) usgsCountBadge.textContent = 'Menghubungkan sensor USGS...';
    try {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson');
      const data = await response.json();

      const source = map.getSource('usgs-earthquakes');
      if (source && data) {
        source.setData(data);
      }

      if (usgsCountBadge && data.features) {
        usgsCountBadge.textContent = `${data.features.length} Gempa Aktif (7 Hari)`;
      }
    } catch (e) {
      console.warn('USGS feed error:', e);
      if (usgsCountBadge) usgsCountBadge.textContent = 'Gagal memuat feed USGS';
    }
  }

  // Klik pada titik gempa USGS Real-Time
  map.on('click', 'usgs-quakes-core', (e) => {
    if (!e.features.length) return;
    const feat = e.features[0];
    const props = feat.properties;
    const coords = feat.geometry.coordinates;
    const timeStr = new Date(props.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    new maplibregl.Popup({ offset: 15, maxWidth: '320px' })
      .setLngLat([coords[0], coords[1]])
      .setHTML(`
        <div class="disaster-popup-content">
          <h4>💥 Gempa Bumi Terkini (USGS Live)</h4>
          <div class="popup-sub">${props.place}</div>
          <div class="popup-stat"><span>Magnitudo:</span> <strong style="color: #ff4757; font-size: 1.15rem">M ${props.mag}</strong></div>
          <div class="popup-stat"><span>Kedalaman:</span> <strong>${coords[2] ? coords[2].toFixed(1) + ' km' : 'Dangkal'}</strong></div>
          <div class="popup-stat"><span>Waktu Tercatat:</span> <strong>${timeStr}</strong></div>
          <div class="popup-desc">Terdeteksi langsung oleh jaringan seismometer internasional USGS dalam 7 hari terakhir.</div>
          <div class="disaster-popup-actions">
            <button class="btn-popup-zoom" onclick="window.flyToLocation(${coords[0]}, ${coords[1]}, 15.0, 50)">Jarak Dekat (~500m)</button>
            <button class="btn-popup-orbit" onclick="window.flyToLocation(${coords[0]}, ${coords[1]}, 4.2, 15)">Jarak Jauh (Orbit)</button>
          </div>
        </div>
      `)
      .addTo(map);
  });

  map.on('mouseenter', 'usgs-quakes-core', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'usgs-quakes-core', () => {
    if (!state.isMeasuring) map.getCanvas().style.cursor = '';
  });

  // Toggle Layer USGS Live
  if (toggleUsgsLive) {
    toggleUsgsLive.addEventListener('change', (e) => {
      const vis = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('usgs-quakes-pulse')) map.setLayoutProperty('usgs-quakes-pulse', 'visibility', vis);
      if (map.getLayer('usgs-quakes-core')) map.setLayoutProperty('usgs-quakes-core', 'visibility', vis);
      showToast(e.target.checked ? 'Layer Gempa Real-Time Diaktifkan' : 'Layer Gempa Real-Time Dimatikan');
    });
  }

  // Toggle Layer Cincin Api Pasifik (Ring of Fire)
  if (toggleRingOfFire) {
    toggleRingOfFire.addEventListener('change', (e) => {
      const vis = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('ring-of-fire-glow')) map.setLayoutProperty('ring-of-fire-glow', 'visibility', vis);
      if (map.getLayer('ring-of-fire-line')) map.setLayoutProperty('ring-of-fire-line', 'visibility', vis);
      showToast(e.target.checked ? 'Cincin Api Pasifik Diaktifkan' : 'Cincin Api Pasifik Dimatikan');
    });
  }

  // Inisialisasi awal modul bencana
  renderDisasterList('all');
  initDisasterMarkers();
  map.on('load', () => {
    fetchLiveEarthquakes();
  });
  // Jika style sudah terlanjur loaded
  if (map.isStyleLoaded()) {
    fetchLiveEarthquakes();
  }

  // =========================================================================
  // 13. Starfield Cosmos Canvas Animation
  // =========================================================================
  function initStarfield() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    });

    const stars = [];
    const numStars = 220;

    function createStars() {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.4,
          alpha: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.02 + 0.005
        });
      }
    }

    createStars();

    function render() {
      ctx.clearRect(0, 0, width, height);

      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.speed = -star.speed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.alpha)})`;
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
        ctx.shadowColor = '#00f2fe';
        ctx.fill();
      });

      requestAnimationFrame(render);
    }

    render();
  }

  // =========================================================================
  // 13. Toast Notification Helper
  // =========================================================================
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    toastEl.style.opacity = '1';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        toastEl.classList.add('hidden');
      }, 300);
    }, 2800);
  }

  // =========================================================================
  // 14. Pintasan Keyboard Cepat (Keyboard Shortcuts)
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    // Jangan jalankan jika pengguna sedang mengetik di input pencarian
    if (document.activeElement === searchInput) return;

    if (e.code === 'Space') {
      e.preventDefault();
      setAutoSpin(!state.autoSpin);
    } else if (e.key === '+' || e.key === '=') {
      map.zoomIn({ duration: 300 });
    } else if (e.key === '-' || e.key === '_') {
      map.zoomOut({ duration: 300 });
    } else if (e.key.toLowerCase() === 'g') {
      toggleProjBtn.click();
    } else if (e.key.toLowerCase() === 'r') {
      map.resetNorth({ duration: 600 });
    } else if (e.key.toLowerCase() === 'l') {
      layerMenuBtn.click();
    } else if (e.key.toLowerCase() === 'd') {
      presetsMenuBtn.click();
    } else if (e.key.toLowerCase() === 'b') {
      if (disasterMenuBtn) disasterMenuBtn.click();
    } else if (e.key === 'Escape') {
      layerDrawer.classList.add('hidden');
      presetsPanel.classList.add('hidden');
      if (disasterPanel) disasterPanel.classList.add('hidden');
      searchDropdown.classList.add('hidden');
      if (state.isMeasuring) toggleMeasureMode(false);
    }
  });

  // Inisialisasi awal HUD
  updateHUD();
});
