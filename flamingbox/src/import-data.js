const fs = require('fs');
const path = require('path');

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function safeJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function walkChromiumNode(node, out, source) {
  if (!node) return;
  if (node.type === 'url' && node.url) {
    out.push({
      title: node.name || node.url,
      url: node.url,
      source,
      addedAt: new Date().toISOString()
    });
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkChromiumNode(child, out, source);
  }
}

function importChromiumBookmarks(base, source, out, warnings) {
  if (!exists(base)) return false;
  let imported = false;
  let profiles = [];
  try {
    profiles = fs.readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && (e.name === 'Default' || /^Profile \d+$/.test(e.name)))
      .map((e) => e.name);
  } catch (error) {
    warnings.push(`${source}: impossible de lire les profils (${error.message})`);
    return false;
  }

  for (const profile of profiles) {
    const file = path.join(base, profile, 'Bookmarks');
    const json = safeJson(file);
    if (!json?.roots) continue;
    for (const root of Object.values(json.roots)) walkChromiumNode(root, out, source);
    imported = true;
  }
  return imported;
}

function decodeMozLz4(buffer) {
  const magic = Buffer.from('mozLz40\0', 'binary');
  if (buffer.length < magic.length || !buffer.subarray(0, magic.length).equals(magic)) {
    throw new Error('format mozLz4 non reconnu');
  }

  const input = buffer.subarray(magic.length);
  const output = [];
  let i = 0;

  while (i < input.length) {
    const token = input[i++];
    let literalLength = token >> 4;
    if (literalLength === 15) {
      let value = 255;
      while (value === 255 && i < input.length) {
        value = input[i++];
        literalLength += value;
      }
    }

    for (let n = 0; n < literalLength && i < input.length; n++) output.push(input[i++]);
    if (i >= input.length) break;
    if (i + 1 >= input.length) throw new Error('bloc LZ4 tronqué');

    const offset = input[i] | (input[i + 1] << 8);
    i += 2;
    if (!offset || offset > output.length) throw new Error('offset LZ4 invalide');

    let matchLength = token & 0x0f;
    if (matchLength === 15) {
      let value = 255;
      while (value === 255 && i < input.length) {
        value = input[i++];
        matchLength += value;
      }
    }
    matchLength += 4;

    for (let n = 0; n < matchLength; n++) {
      output.push(output[output.length - offset]);
    }
  }

  return Buffer.from(output).toString('utf8');
}

function walkFirefoxNode(node, out) {
  if (!node) return;
  if (node.uri && /^https?:\/\//i.test(node.uri)) {
    out.push({
      title: node.title || node.uri,
      url: node.uri,
      source: 'Firefox',
      addedAt: new Date().toISOString()
    });
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkFirefoxNode(child, out);
  }
}

function importFirefox(appData, out, warnings) {
  const profilesRoot = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
  if (!exists(profilesRoot)) return false;
  let imported = false;

  try {
    const profiles = fs.readdirSync(profilesRoot, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const profile of profiles) {
      const backups = path.join(profilesRoot, profile.name, 'bookmarkbackups');
      if (!exists(backups)) continue;
      const files = fs.readdirSync(backups)
        .filter((name) => name.endsWith('.jsonlz4'))
        .sort()
        .reverse();
      if (!files.length) continue;

      try {
        const decoded = decodeMozLz4(fs.readFileSync(path.join(backups, files[0])));
        const json = JSON.parse(decoded);
        walkFirefoxNode(json, out);
        imported = true;
      } catch (error) {
        warnings.push(`Firefox ${profile.name}: ${error.message}`);
      }
    }
  } catch (error) {
    warnings.push(`Firefox: ${error.message}`);
  }

  return imported;
}

async function importBrowserData(app) {
  const bookmarks = [];
  const warnings = [];
  const sources = [];

  if (process.platform !== 'win32') {
    return { bookmarks, warnings: ['Import automatique disponible d’abord sous Windows.'], sources };
  }

  const local = process.env.LOCALAPPDATA || '';
  const roaming = process.env.APPDATA || '';

  if (importChromiumBookmarks(path.join(local, 'Google', 'Chrome', 'User Data'), 'Google Chrome', bookmarks, warnings)) sources.push('Google Chrome');
  if (importChromiumBookmarks(path.join(local, 'Chromium', 'User Data'), 'Chromium', bookmarks, warnings)) sources.push('Chromium');
  if (importChromiumBookmarks(path.join(local, 'Microsoft', 'Edge', 'User Data'), 'Microsoft Edge', bookmarks, warnings)) sources.push('Microsoft Edge');
  if (importFirefox(roaming, bookmarks, warnings)) sources.push('Firefox');

  const unique = [];
  const seen = new Set();
  for (const item of bookmarks) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    unique.push(item);
  }

  return { bookmarks: unique, warnings, sources };
}

module.exports = { importBrowserData };
