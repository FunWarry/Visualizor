# Visuval Production Reference & Extracted Presets

Ce dossier contient l'ensemble des sources, shaders, géométries, paramètres de caméra et de post-processing extraits et désobfusqués depuis [visuval.io/app](https://visuval.io/app).

---

## 📊 État des 71 Presets

Sur [visuval.io/app](https://visuval.io/app), les 71 presets sont architecturés en 2 groupes :

1. **Les 22 Presets Publics / Gratuits (`oe`)** :
   * Leurs bundles JavaScript complets sont distribués publiquement sur le CDN de visuval.io.
   * **100 % de ces 22 presets sont téléchargés, désobfusqués et archivés** dans [`reference/presets/`](./presets/) :
     * `wave.original.js`, `circular.original.js`, `bars3d.original.js`, `obsidian.original.js`, `ferrofluid.original.js`, `starfield.original.js`, `particles.original.js`, `milkdrop.original.js`, `geiss.original.js`, `tunnel.original.js`, `boxtunnel.original.js`, `ringtunnel.original.js`, `waterslide.original.js`, `biocells.original.js`, `matrix.original.js`, `liquid.original.js`, `upcloud.original.js`, `diodewall.original.js`, `spectogram.original.js`, `rainroom.original.js`, `face.original.js`, `forest.original.js`.

2. **Les 49 Presets Premium ("48 premium presets Unlock all" - `ae`)** :
   * Sur visuval.io, ces presets (`dna`, `cymatic`, `sun`, `blackhole`, `tesseract`, etc.) sont protégés côté serveur via authentification Firebase (`/preset/:id` avec Bearer token) et vérification d'intégrité SHA-256. Leurs endpoints CDN directs renvoient une erreur HTTP 404 sans compte payant.
   * **Cependant, leurs spécifications complètes ont été extraites** depuis le chunk de catalogue [`catalog_chunk.fully_decoded.js`](./catalog_chunk.fully_decoded.js) :
     * Nom de classe Three.js de chaque preset.
     * Configuration par défaut de caméra (`autoRotate`, `bloomIntensity`, `brightness`, `aaEnabled`).
     * Répartition dans les 7 catégories.
   * **Dans notre application locale Visualizor (`src/presets/`)**, **les 71 presets sont 100 % débloqués et disponibles sans aucune restriction**.

Voir [`full_71_presets_catalog.json`](./full_71_presets_catalog.json) pour la table de correspondance exhaustive des 71 presets.

---

## 📁 Structure du répertoire

```
reference/
├── presets/                               # Sources désobfusquées originales des 22 presets
│   ├── wave.original.js                  # Terrain 3D GPU ondulant + 3000 particules stardust
│   ├── circular.original.js              # Cœur stellaire noise3 + Corona + 5 anneaux orbitaux
│   ├── bars3d.original.js                # Barres 3D spectrales instanciées
│   ├── starfield.original.js             # Champ d'étoiles avec traînées de vitesse
│   ├── ferrofluid.original.js            # Déformation physique de pointes magnétiques
│   ├── obsidian.original.js              # Polyèdre noir physique à réfraction
│   ├── particles.original.js             # Essaim de particules orbitales
│   ├── milkdrop.original.js              # Visualiseur oscilloscopique Canvas 2D
│   ├── geiss.original.js                 # Déformation par champ de vecteurs
│   ├── tunnel.original.js                # Tunnel infini circulaire
│   ├── boxtunnel.original.js             # Corridor rectangulaire néon
│   ├── ringtunnel.original.js            # Anneaux lumineux le long de l'axe Z
│   ├── waterslide.original.js            # Courbe spline Catmull-Rom 3D
│   ├── biocells.original.js              # Membranes cellulaires organiques
│   ├── matrix.original.js                # Chute de glyphes numériques
│   ├── liquid.original.js                # Surface de fluide fBm
│   ├── upcloud.original.js               # Nuages volumétriques ascendants
│   ├── diodewall.original.js             # Matrice LED 768 points (multi-bandes)
│   ├── spectogram.original.js            # Histogramme spectral 3D à historique glissant
│   ├── rainroom.original.js              # Pluie de filaments verticaux et éclaboussures
│   ├── face.original.js                  # Maillage de visage filaire 3D
│   └── forest.original.js                # Arbres et canopée procédurale 3D
│
├── scripts/                              # Outils d'extraction et de désobfuscation
│   ├── deobfuscator.cjs                  # Moteur universel de décodage des chaînes obfusquées
│   ├── download_all_presets.cjs          # Téléchargement et synchronisation depuis visuval.io
│   └── generate_full_manifest.cjs        # Génération du catalogue des 71 presets
│
├── catalog_chunk.fully_decoded.js        # Décodage complet du catalogue et des 71 presets de visuval.io
├── full_71_presets_catalog.json          # Inventaire complet des 71 presets (catégorie, fichiers ts et js)
├── manifest.json                         # Métadonnées des bundles extraits
└── README.md                             # Documentation technique
```
