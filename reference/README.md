# Visuval Production Reference & Extracted Presets

Ce dossier contient l'ensemble des sources, shaders, géométries et configurations d'effets extraits et désobfusqués directement depuis les bundles de production de [visuval.io/app](https://visuval.io/app).

---

## 📁 Structure du répertoire

```
reference/
├── presets/                               # Sources désobfusquées originales des presets
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
│   └── download_all_presets.cjs          # Téléchargement et synchronisation depuis visuval.io
│
├── catalog_chunk.fully_decoded.js        # Décodage complet du chunk principal de catalogue (chunk.MIT4IWEV)
├── main.decoded.js                       # Bundle principal de l'application visuval.io désobfusqué
├── manifest.json                         # Métadonnées et signatures des bundles extraits
└── README.md                             # Documentation technique
```

---

## 🛠️ Utilisation des scripts

### 1. Télécharger et mettre à jour les presets depuis visuval.io
```bash
node reference/scripts/download_all_presets.cjs
```
Ce script :
1. Télécharge les scripts JavaScript originaux depuis `https://visuval.io/js/`.
2. Détecte la fonction de décodage hexadécimal et l'algorithme de déchiffrement (`javascript-obfuscator`).
3. Évalue les tables de chaînes dans un bac à sable isolé (`node:vm`).
4. Remplace tous les identifiants obfusqués par leurs valeurs réelles (`THREE.ShaderMaterial`, noms de variables d'uniforms, shaders GLSL, positions de caméras).
5. Enregistre les fichiers propres dans `reference/presets/*.original.js`.

---

## 🎯 Configurations clés extraites

### Preset `Wave Form` (`reference/presets/wave.original.js`)
* **Géométrie** : `THREE.PlaneGeometry(120, 120, 63, 63)` orientée à l'horizontale (`rotation.x = -Math.PI / 2`).
* **Particules** : 3 000 motes de poussière d'étoiles avec scintillement (`twinkle`) et dérive continue.
* **Caméra** : Position `[0, 14, 34]`, cible `[0, 0, 0]`.
* **Shaders** : 3 couches de vagues sinusoïdales multi-octaves continues (`wave1`, `wave2`, `wave3`) réactives aux basses et à l'énergie RMS.

### Preset `Circular` (`reference/presets/circular.original.js`)
* **Cœur stellaire** : `THREE.IcosahedronGeometry(3.0, 6)` avec déplacement de sommets par bruit tridimensionnel (`noise3`) et effet de Fresnel incandescent.
* **Coque Corona** : `THREE.IcosahedronGeometry(4.2, 4)` en rendu double-face additif.
* **Anneaux orbitaux** : 5 tores inclinés à des angles et vitesses différentes selon les bandes fréquentielles (Bass, Mid, Treble).
* **Particules & Nébuleuse** : 4 000 particules nébuleuses diffuses, 6 000 stardust en halo, 10 000 particules de ruban fréquentiel sur 3 anneaux.
* **Caméra** : Position `[0, 18, 30]`, cible `[0, 0, 0]`.

---

Ce dossier sert de référence absolue pour toute future modification, ajout de preset ou ajustement de shaders dans Visualizor.
