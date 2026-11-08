const fs = require('node:fs');
const vm = require('node:vm');

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

function fullDeobfuscate(content) {
  const match = content.match(/^const\s+([a-zA-Z0-9_$]+)=([a-zA-Z0-9_$]+);\(function/);
  if (!match) return content;
  const decName = match[2];

  const arrayFnMatch = content.match(/function\s+([a-zA-Z0-9_$]+)\s*\(\)\s*\{\s*const\s+[a-zA-Z0-9_$]+\s*=\s*\[/);
  if (!arrayFnMatch) return content;
  const arrayFnName = arrayFnMatch[1];

  const arrayFnCode = extractFunction(content, arrayFnName);
  const decFnCode = extractFunction(content, decName);

  const iifeStart = content.indexOf(`(function(`);
  const callStart = content.indexOf(`}(`, iifeStart);
  const iifeEnd = content.indexOf(`));`, callStart);
  if (iifeStart === -1 || callStart === -1 || iifeEnd === -1) return content;
  const iifeCode = content.slice(iifeStart, iifeEnd + 3);

  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInContext(`${arrayFnCode}\n${decFnCode}\n${iifeCode}`, sandbox); // NOSONAR
  } catch (err) {
    console.error('Failed to run sandbox:', err.message);
    return content;
  }

  const decoder = sandbox[decName];
  if (typeof decoder !== 'function') return content;

  // Replace any call: identifier(0x..., '...')
  const pattern = /\b([a-zA-Z0-9_$]+)\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g;
  
  return content.replace(pattern, (fullMatch, fnIdentifier, arg1, arg2) => {
    try {
      const num = arg1.startsWith('0x') ? Number.parseInt(arg1, 16) : Number.parseInt(arg1, 10);
      const val = decoder(num, arg2);
      if (typeof val === 'string') {
        return JSON.stringify(val);
      }
      return fullMatch;
    } catch {
      return fullMatch;
    }
  });
}

const circRaw = fs.readFileSync('reference/presets/circular.original.js', 'utf8');
const decoded = fullDeobfuscate(circRaw);
fs.writeFileSync('reference/presets/circular.decoded.js', decoded);

console.log('Decoded length:', decoded.length);
// Search for buildPulseCore
const idx = decoded.indexOf('buildPulseCore');
if (idx !== -1) {
  console.log('--- buildPulseCore snippet ---');
  console.log(decoded.slice(idx, idx + 2000));
}
