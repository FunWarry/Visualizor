const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const vm = require('node:vm');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function extractFunction(content, fnName) {
  const start = content.indexOf(`function ${fnName}(`);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return null;
}

function deobfuscate(content) {
  const decMatch = content.match(/^const\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+);/);
  if (!decMatch) return content;

  const aliasName = decMatch[1];
  const decName = decMatch[2];

  const iifeStart = content.indexOf('(function(');
  if (iifeStart === -1) return content;

  const callMatch = content.slice(iifeStart, iifeStart + 2000).match(/\}\s*\(\s*([a-zA-Z0-9_$]+)\s*,\s*0x[0-9a-fA-F]+/);
  if (!callMatch) return content;

  const arrName = callMatch[1];
  const iifeCallIdx = content.indexOf(callMatch[0], iifeStart);
  const iifeEnd = content.indexOf(');', iifeCallIdx) + 2;
  const iifeCode = content.slice(iifeStart, iifeEnd);

  const arrCode = extractFunction(content, arrName);
  const decCode = extractFunction(content, decName);

  if (!arrCode || !decCode) return content;

  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInContext(`${arrCode}\n${decCode}\n${iifeCode}`, sandbox); // NOSONAR
  } catch {
    return content;
  }

  const decoder = sandbox[decName];
  if (typeof decoder !== 'function') return content;

  const regex = new RegExp(`\\b(?:${decName}|${aliasName})\\s*\\(\\s*(0x[0-9a-fA-F]+)\\s*(?:,\\s*(['"\`])(.*?)\\2)?\\s*\\)`, 'g');
  return content.replace(regex, (m, hex, q, key) => {
    try {
      const num = Number.parseInt(hex, 16);
      const str = key !== undefined ? decoder(num, key) : decoder(num);
      return JSON.stringify(str);
    } catch {
      return m;
    }
  });
}

const ALL_PRESETS_MAP = {
  // Group 1 (oe in chunk.MIT4IWEV)
  'circular': 'circular.XD4ZXTUG.js',
  'particles': 'particles.AXGRXBPT.js',
  'bars3d': 'bars3d.OBPEGH22.js',
  'starfield': 'starfield.73TCXN4A.js',
  'ferrofluid': 'ferrofluid.DNQIBLWF.js',
  'obsidian': 'obsidian.3QDBXHLX.js',
  'milkdrop': 'milkdrop.K2H4SRFN.js',
  'geiss': 'geiss.EKZZIJ6J.js',
  'tunnel': 'tunnel.3D57GORS.js',
  'boxtunnel': 'boxtunnel.V5BCSZKL.js',
  'ringtunnel': 'ringtunnel.3LUFMBOJ.js',
  'waterslide': 'waterslide.76JXOFKW.js',
  'biocells': 'biocells.IIAICJ7M.js',
  'matrix': 'matrix.LF7QOVKS.js',
  'liquid': 'liquid.YL37U2WN.js',
  'upcloud': 'upcloud.IUZCJXPU.js',
  'diodewall': 'diodewall.EXABZYFA.js',
  'spectogram': 'spectogram.ZR3COXVB.js',
  'rainroom': 'rainroom.F7ZFLGTS.js',
  'face': 'face.BHBO7RHT.js',
  'forest': 'forest.J5ODFQOF.js',

  // Group 2 (ae in chunk.MIT4IWEV)
  'dna': 'dna.5W4NMMUO.js',
  'cymatic': 'cymatic.QEM2C4OD.js',
  'topographic': 'topographic.TEMU72U5.js',
  'sacred': 'sacred.QPZAUKWG.js',
  'fireflies': 'fireflies.UOHQK2JV.js',
  'fluid': 'fluid.LAM4XZDL.js',
  'vinyl': 'vinyl.ZFUVCBZE.js',
  'rings': 'rings.7D53QYHN.js',
  'plasma': 'plasma.L7RQZX5B.js',
  'lightning': 'lightning.IWI6CU56.js',
  'ocean': 'ocean.QIHV75LR.js',
  'singletree': 'singletree.KJZMLPHC.js',
  'hauntedforest': 'hauntedforest.SMQC5EBG.js',
  'sun': 'sun.W26SCL57.js',
  'blackhole': 'blackhole.5FCXJXW2.js',
  'tesseract': 'tesseract.R7X6VBOS.js',
  'fog': 'fog.XLL33PN2.js',
  'mandel': 'mandel.VZF7MHUN.js',
  'neontunnel': 'neontunnel.BCY3TN4K.js',
  'unfoldingmatter': 'unfoldingmatter.DXAMAZKI.js',
  'veintunnel': 'veintunnel.G2ZXCO7H.js',
  'water': 'water.CQKYIX7H.js',
  'kaleidoscope': 'kaleidoscope.RWLXMGLZ.js',
  'hologram': 'hologram.BTLJKXH7.js',
  'geodesic': 'geodesic.RIF2E5DH.js',
  'terrain': 'terrain.6FDNATMV.js',
  'smoke': 'smoke.6DQLCCXH.js',
  'stormcell': 'stormcell.FPSCU5DX.js',
  'jellyfish': 'jellyfish.RNKTLTY7.js',
  'mycelium': 'mycelium.L3KS7A3S.js',
  'volcano': 'volcano.P7KQ5CTH.js',
  'signallock': 'signallock.3G3RTKOM.js',
  'plasmaarcs': 'plasmaarcs.OO4B3ESJ.js',
  'galaxy': 'galaxy.XQKHZLVQ.js',
  'warp': 'warp.MYUQGXNW.js',
  'vodlines': 'vodlines.KD3I77IP.js',
  'gravityforce': 'gravityforce.3Z3MHCST.js',
  'pendulum': 'pendulum.HCAR7JXW.js',
  'fireball': 'fireball.AC6QSDXN.js',
  'ink': 'ink.XJKPGGIB.js',
  'bloom': 'bloom.ME3IBSVL.js',
  'meadow': 'meadow.2Q2XWVWF.js',
  'tiedye': 'tiedye.72G4RXOL.js',
  'halo': 'halo.FGLMOL3A.js',
  'waterneurons': 'waterneurons.FDH4XPZA.js',
  'lcddeck': 'lcddeck.XSS47YDP.js',
  'nightradar': 'nightradar.6JHHZDQ4.js',
  'lava': 'lava.6J74DCOC.js',
  'cyberspace': 'cyberspace.GGYUOEMG.js',
  'aurora': 'aurora.5CPKCDRD.js'
};

async function run() {
  const outDir = path.resolve(__dirname, '..', 'presets');
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = [];
  const entries = Object.entries(ALL_PRESETS_MAP);
  console.log(`Starting download and deobfuscation of ${entries.length} presets from visuval.io...`);

  // Extract wave preset from catalog_chunk
  const catalogChunkPath = path.resolve(__dirname, '..', 'catalog_chunk.fully_decoded.js');
  if (fs.existsSync(catalogChunkPath)) {
    const catalog = fs.readFileSync(catalogChunkPath, 'utf8');
    const waveIdx = catalog.indexOf('class m extends');
    if (waveIdx !== -1) {
      const waveEnd = catalog.indexOf('_0x4749d8(m,"dimension","3d")', waveIdx);
      const waveCode = catalog.slice(waveIdx, waveEnd + 30);
      fs.writeFileSync(path.resolve(outDir, 'wave.original.js'), waveCode, 'utf8');
      manifest.push({
        id: 'wave',
        name: 'Wave Form',
        file: 'wave.original.js',
        origin: 'chunk.MIT4IWEV.js'
      });
      console.log('✓ Extracted wave.original.js from catalog chunk');
    }
  }

  // Download all presets in parallel batches
  const batchSize = 6;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(batch.map(async ([presetId, fileName]) => { // NOSONAR
      const url = `https://visuval.io/js/${fileName}`;
      try {
        const raw = await fetchUrl(url);
        const decoded = deobfuscate(raw);
        const targetFile = `${presetId}.original.js`;
        fs.writeFileSync(path.resolve(outDir, targetFile), decoded, 'utf8');
        manifest.push({
          id: presetId,
          file: targetFile,
          originUrl: url,
          bundleSize: raw.length,
          decodedSize: decoded.length
        });
        console.log(`✓ [${presetId}] (${fileName}) -> ${targetFile}`);
      } catch (err) {
        console.error(`✗ Error downloading ${presetId} from ${url}:`, err.message);
      }
    }));
  }

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log(`\n🎉 All ${manifest.length} presets successfully extracted into reference/presets/!`);
}

run().catch(console.error);

