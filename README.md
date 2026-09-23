# 🌍 TerraSphere 3D - Interactive World & Disaster Explorer

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/MapLibre_GL-v5.24.0-cyan.svg" alt="MapLibre GL v5.24.0" />
  <img src="https://img.shields.io/badge/Live_Data-USGS_Earthquakes-red.svg" alt="USGS Live Feed" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
</p>

**TerraSphere 3D** adalah aplikasi web penjelajah bumi interaktif modern berbasis WebGL dan **MapLibre GL JS v5** dengan proyeksi bola dunia 3D (*spherical globe*). Aplikasi ini memungkinkan pengguna menjelajahi planet bumi secara utuh dengan transisi mulus dari **jarak sangat jauh (orbit luar angkasa ribuan kilometer)** hingga **jarak sangat dekat (tingkat jalanan kota, bangunan, dan landmark dunia)**.

Dilengkapi juga dengan pemantau bencana alam dunia real-time (**USGS Live Earthquakes Feed**), visualisasi **Cincin Api Pasifik (Ring of Fire)**, dan katalog bencana bersejarah terdahsyat di muka bumi.

---

## ✨ Fitur Utama

### 1. 🪐 Visualisasi Bola Bumi 3D & Rotasi Sinematik
- **Spherical 3D Globe Projection**: Bola bumi 3D sejati dengan mesh WebGL berlatar kosmos berbintang (*starfield canvas*).
- **Rotasi Bumi Otomatis 60 FPS**: Bumi berputar perlahan secara mandiri (3.5°/detik) dengan *smart pause/resume* saat pengguna berinteraksi atau memperbesar kamera.
- **Toggle Mode Proyeksi**: Beralih bebas antara **Bola Bumi 3D (Globe)** dan **Peta Datar (Mercator)**.

### 2. 🔍 Transisi Jarak Jauh hingga Jarak Dekat
- **Skala Jarak Cepat**:
  - 🚀 **Antariksa** (> 10.000 km): Menampilkan seluruh bumi mengapung di angkasa.
  - 🌏 **Benua** (~ 4.000 km): Skala benua (Asia, Eropa, Amerika, Afrika, Oseania).
  - 🗺️ **Negara** (~ 600 km): Skala kepulauan Indonesia atau batas negara.
  - 🏙️ **Kota** (~ 25 km): Kawasan metropolitan (Jabodetabek, Tokyo, New York).
  - 👣 **Jalanan** (~ 250 m): Tingkat jalan raya, perumahan, dan atap gedung.
- **Katalog Destinasi Siap Terbang**: Monas Jakarta, Bundaran HI, Ka'bah Makkah, Menara Eiffel Paris, Piramida Giza Mesir, Burj Khalifa Dubai, Puncak Mount Everest, Colosseum Roma, Grand Canyon, Raja Ampat, dll.

### 3. 🚨 Pusat Pemantau Bencana Alam Dunia (Disaster Monitor)
- **💥 Gempa Terkini Real-Time (USGS Feed)**: Terhubung langsung dengan seismometer global USGS, memetakan 100+ titik gempa aktif minggu ini secara real-time dengan lingkaran berpendar dinamis sesuai magnitudo.
- **🌋 Jalur Cincin Api Pasifik (Pacific Ring of Fire)**: Visualisasi zona subduksi lempeng tektonik aktif tempat 90% gempa bumi dan 75% gunung api aktif dunia berada.
- **🌊 Jejak Bencana Bersejarah Terdahsyat**:
  - Gempa & Tsunami Aceh (2004) - M 9.1-9.3
  - Letusan Dahsyat Krakatau (1883) & Supervolcano Tambora (1815)
  - Gempa & Likuifaksi Palu (2018)
  - Gempa & Tsunami Tohoku / Fukushima (2011)
  - Gempa Dahsyat Turki & Suriah (2023)
  - Gempa Terbesar Dunia: Valdivia, Chili (1960) - Rekor M 9.5
  - Letusan Gunung Vesuvius & Kota Kuno Pompeii (79 M)
  - Letusan Hunga Tonga Bawah Laut (2022)
  - Badai Siklon Katrina (2005) & Siklon Nargis (2008)
- **Tombol Transisi Jarak pada Bencana**: Beralih instan antara **Jarak Dekat (~500m)** untuk melihat kawah/patahan dan **Jarak Jauh (Orbit)** untuk melihat skala lempeng benua.

### 4. 🗺️ Multi-Lapisan Citra (Layer Switcher)
- **Satelit HD Realistis** (Esri World Imagery)
- **Peta Jalan (OpenStreetMap)**
- **Mode Malam (Dark Universe)**
- **Relief Topografi & Kontur Pegunungan**
- Toggle label nama kota dan jaringan jalanan.

### 5. 🛠️ Alat Interaktif & Flight HUD
- **Pencarian Lokasi Global**: Live geocoding OpenStreetMap Nominatim dengan animasi terbang sinematik (*flyTo*).
- **Pengukur Jarak (Distance Ruler)**: Menghitung jarak garis lurus di permukaan bumi via rumus Haversine (km/meter).
- **Live Flight HUD**: Indikator ketinggian kamera dinamis (*apparent altitude*), koordinat Lintang/Bujur, sudut kemiringan 3D (*Tilt*), dan arah kompas (*Bearing*).

---

## ⌨️ Pintasan Keyboard (Shortcuts)

| Tombol | Aksi |
| :--- | :--- |
| `Spasi` | Menyalakan / Menjeda rotasi otomatis bumi |
| `+` / `-` | Zoom In / Zoom Out |
| `G` | Beralih mode Bola Bumi 3D / Peta Datar |
| `B` | Membuka / Menutup panel Bencana Alam |
| `D` | Membuka / Menutup katalog Destinasi |
| `L` | Membuka / Menutup pilihan Lapisan Peta |
| `R` | Mengarahkan pandangan ke arah Utara (Reset Kompas) |
| `Esc` | Menutup semua panel aktif / membatalkan pengukur jarak |

---

## 🚀 Cara Menjalankan

### Opsi 1: Klik Ganda (Mudah)
Cukup klik ganda file `Buka_Aplikasi.bat` di folder project. Browser default akan terbuka otomatis ke `http://localhost:3000`.

### Opsi 2: Buka Langsung (Offline / Tanpa Server)
Buka file `index.html` langsung di browser pilihan Anda (Google Chrome, Microsoft Edge, atau Firefox).

### Opsi 3: Menjalankan Server Python Lokal
```bash
python server.py
# atau
python -m http.server 3000
```
Buka browser dan akses `http://localhost:3000`.

---

## 💻 Teknologi yang Digunakan
- **MapLibre GL JS v5.24.0** (WebGL 3D Spherical Globe Engine)
- **HTML5 Canvas** (Cosmos Starfield background)
- **Vanilla Modern JavaScript (ES6+)**
- **CSS3 Modern Glassmorphism & Aerospace Theme**
- **Lucide Icons & Google Fonts (Plus Jakarta Sans, Space Grotesk)**
- **USGS Earthquakes GeoJSON API** & **OpenStreetMap Nominatim Geocoding**
