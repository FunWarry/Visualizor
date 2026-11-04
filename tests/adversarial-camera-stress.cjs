#!/usr/bin/env node
const esbuild = require('esbuild');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const entryPath = path.resolve(__dirname, 'adversarial-camera-stress.ts');
const outPath = path.resolve(__dirname, '.adversarial_camera_bundle.mjs');

try {
  esbuild.buildSync({
    entryPoints: [entryPath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: outPath,
    external: ['three'],
    packages: 'external',
    logLevel: 'error'
  });

  const result = spawnSync(process.execPath, [outPath], {
    stdio: 'inherit',
    env: process.env
  });

  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  process.exit(result.status !== null ? result.status : 1);
} catch (err) {
  console.error('Failed to run adversarial camera stress test suite:', err);
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }
  process.exit(1);
}
