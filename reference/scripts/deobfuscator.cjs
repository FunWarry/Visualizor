const https = require('https');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function deobfuscate(content) {
  const match = content.match(/^const [a-zA-Z0-9_$]+=([a-zA-Z0-9_$]+);\(function/);
  if (!match) {
    return content;
  }
  const decName = match[1];
  const arrayFnMatch = content.match(/function\s+([a-zA-Z0-9_$]+)\s*\(\)\s*\{\s*const\s+[a-zA-Z0-9_$]+\s*=\s*\[/);
  if (!arrayFnMatch) {
    return content;
  }
  const arrayFnName = arrayFnMatch[1];

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

  const arrayFnCode = extractFunction(content, arrayFnName);
  const decFnCode = extractFunction(content, decName);

  const iifeStart = content.indexOf(`(function(`);
  const iifeEnd = content.indexOf(`);`, iifeStart);
  const iifeCode = content.slice(iifeStart, iifeEnd + 2);

  if (!arrayFnCode || !decFnCode || iifeStart === -1) {
    return content;
  }

  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInContext(`${arrayFnCode}\n${iifeCode}\n${decFnCode}`, sandbox);
  } catch (err) {
    console.error('Failed to run sandbox for deobfuscation:', err.message);
    return content;
  }

  const decoder = sandbox[decName];
  if (typeof decoder !== 'function') return content;

  // Replace all decoder calls: decoder(0x...) or decName(0x..., '...')
  const pattern = new RegExp(`\\b${decName}\\s*\\((0x[0-9a-fA-F]+|\\d+)(?:\\s*,\\s*['"\`]([^'"\`]+)['"\`])?\\)`, 'g');
  return content.replace(pattern, (fullMatch, arg1, arg2) => {
    try {
      const num = arg1.startsWith('0x') ? parseInt(arg1, 16) : parseInt(arg1, 10);
      const val = arg2 !== undefined ? decoder(num, arg2) : decoder(num);
      return JSON.stringify(val);
    } catch {
      return fullMatch;
    }
  });
}

module.exports = {
  fetchUrl,
  deobfuscate
};

