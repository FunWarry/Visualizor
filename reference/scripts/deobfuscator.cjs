const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
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

function extractFunction(text, fnName) {
  const start = text.indexOf(`function ${fnName}(`);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function deobfuscate(content) {
  const match = content.match(/^const\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+);/);
  if (!match) {
    return content;
  }
  const aliasName = match[1];
  const decName = match[2];

  const arrayFnMatch = content.match(/function\s+([a-zA-Z0-9_$]+)\s*\(\)\s*\{\s*(?:const|var|let)\s+[a-zA-Z0-9_$]+\s*=\s*\[/);
  if (!arrayFnMatch) {
    return content;
  }
  const arrayFnName = arrayFnMatch[1];

  const arrayFnCode = extractFunction(content, arrayFnName);
  const decFnCode = extractFunction(content, decName);

  const iifeStart = content.indexOf(`(function(`);
  if (iifeStart === -1) return content;
  const callMatch = content.slice(iifeStart, iifeStart + 2500).match(/\}\s*\(\s*([a-zA-Z0-9_$]+)\s*,\s*0x[0-9a-fA-F]+/);
  if (!callMatch) return content;
  const iifeCallIdx = content.indexOf(callMatch[0], iifeStart);
  const iifeEnd = content.indexOf(');', iifeCallIdx) + 2;
  const iifeCode = content.slice(iifeStart, iifeEnd);

  if (!arrayFnCode || !decFnCode) {
    return content;
  }

  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInContext(`${arrayFnCode}\n${decFnCode}\n${iifeCode}`, sandbox); // NOSONAR
  } catch (err) {
    return content;
  }

  const decoder = sandbox[decName];
  if (typeof decoder !== 'function') return content;

  // Collect all aliases transitively
  const aliases = new Set([decName, aliasName]);
  let prevSize = 0;
  while (aliases.size > prevSize) {
    prevSize = aliases.size;
    const list = Array.from(aliases).join('|');
    const aliasRegex = new RegExp(String.raw`(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:${list})\b`, 'g');
    let m;
    while ((m = aliasRegex.exec(content)) !== null) {
      aliases.add(m[1]);
    }
  }

  // Replace decoder calls with exact alias match first
  const aliasList = Array.from(aliases).join('|');
  const quoteGroup = String.raw`(['"`])`;
  const pattern = new RegExp(String.raw`\b(?:${aliasList})\s*\((0x[0-9a-fA-F]+|\d+)(?:\s*,\s*${quoteGroup}(.*?)\2)?\s*\)`, 'g');

  let result = content.replace(pattern, (fullMatch, arg1, q, arg2) => {
    try {
      const num = arg1.startsWith('0x') ? Number.parseInt(arg1, 16) : Number.parseInt(arg1, 10);
      const val = arg2 !== undefined ? decoder(num, arg2) : decoder(num);
      if (typeof val === 'string') {
        return JSON.stringify(val);
      }
      return fullMatch;
    } catch {
      return fullMatch;
    }
  });

  // Secondary universal pass for any remaining obfuscated hex/key calls
  const universalPattern = new RegExp(String.raw`\b[a-zA-Z0-9_$]+\s*\(\s*(0x[0-9a-fA-F]+)\s*,\s*${quoteGroup}(.*?)\2\s*\)`, 'g');
  result = result.replace(universalPattern, (fullMatch, hex, q, key) => {
    try {
      const num = Number.parseInt(hex, 16);
      const val = decoder(num, key);
      if (typeof val === 'string') {
        return JSON.stringify(val);
      }
    } catch {}
    return fullMatch;
  });

  return result;
}

module.exports = {
  fetchUrl,
  deobfuscate,
  extractFunction
};
