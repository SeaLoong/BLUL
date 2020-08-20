const fs = require('fs');
const http = require('http');
const https = require('https');

function readFile (path) {
  return new Promise((resolve, reject) => {
    if (path.startsWith('http')) {
      let data = '';
      const callback = res => {
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          data = data.toString();
          if (res.complete) resolve(data);
          else reject(data);
        });
      };
      if (path.startsWith('https')) https.get(path, callback);
      else http.get(path, callback);
    } else {
      try {
        resolve(fs.readFileSync(path).toString());
      } catch (e) {
        reject(e);
      }
    }
  });
}

function resolvePath (path, dir) {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) return path;
  if (path.startsWith('/')) path = dir + path;
  else path = dir + '/' + path;
  return new URL(path).toString();
}

function prettyMeta (metas) {
  const list = [];
  let maxLen = 0;
  for (const line of metas) {
    const its = line.split(' ');
    if (its.length < 2) continue;
    list.push(its);
    maxLen = Math.max(maxLen, its[1].length + 1);
  }
  const ret = [];
  for (const its of list) {
    let s = its[0] + ' ' + its[1];
    if (its.length > 2) {
      s += ' '.repeat(maxLen - its[1].length);
      for (let i = 2; i < its.length; i++) {
        s += its[i];
        if (i + 1 === its.length) break;
        s += ' ';
      }
    }
    ret.push(s);
  }
  return ret;
}

function wrap (metas, notMeta) {
  return '// ==UserScript==\n' + prettyMeta(metas).join('\n') + '\n// ==/UserScript==\n\n' + notMeta;
}

const multipleKeySet = new Set(['@match', '@exclude-match', '@include', '@exclude', '@require', '@resource', '@connect', '@grant', '@compatible', '@incompatible']);

function mergeMeta (metasArr) {
  const keyMap = new Map();
  for (let i = metasArr.length - 1; i >= 0; i--) {
    for (const line of metasArr[i]) {
      const its = line.split(' ');
      if (its.length < 2) continue;
      const tag = its[1];
      if (multipleKeySet.has(tag)) {
        if (!keyMap.has(tag)) keyMap.set(tag, new Set());
        keyMap.get(tag).add(line);
      } else if (!keyMap.has(tag)) {
        keyMap.set(tag, line);
      }
    }
  }
  const ret = [];
  for (const v of keyMap.values()) {
    if (v instanceof Set) {
      for (const it of v) {
        ret.push(it);
      }
    } else {
      ret.push(v);
    }
  }
  return ret;
}

const userScriptRegExp = /\/\/\s*==UserScript==\s*([\s\S]*?)\/\/\s*==\/UserScript==/;
const pathSet = new Set();
async function processMeta (path, dir, onlyMeta = false) {
  console.log('processMeta', path, dir, onlyMeta);
  if (pathSet.has(path + dir)) return [[], ''];
  pathSet.add(path + dir);
  const data = await readFile(path);
  const r = userScriptRegExp.exec(data);
  if (!r) return [[], data];
  const notMeta = data.slice(r.index + r[0].length);
  const meta = r[1].replace(/[\r\n]+/g, '\n').replace(/ +/g, ' ');
  const overrideMetas = [];
  const metas = [];
  const notMetas = [];
  for (let line of meta.split('\n')) {
    const its = line.split(' ');
    if (its.length < 2) continue;
    const tag = its[1];
    switch (tag) {
      case '@require':
      {
        if (its.length < 3) continue;
        const url = its[2];
        const m = await processMeta(url, dir, onlyMeta);
        overrideMetas.push(m[0]);
        if (onlyMeta) {
          line = line.replace(url, resolvePath(url, dir));
        } else {
          notMetas.push(m[1]);
          continue;
        }
        break;
      }
      case '@resource':
      {
        if (its.length < 4) continue;
        const url = its[3];
        line = line.replace(url, resolvePath(url, dir));
        break;
      }
    }
    if (line) metas.push(line);
  }
  overrideMetas.push(metas);
  notMetas.push(notMeta);
  pathSet.delete(path + dir);
  return [mergeMeta(overrideMetas), notMetas.join('\n')];
}

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

(async function () {
  let dist = await processMeta('./src/meta.js', 'https://raw.githubusercontent.com/SeaLoong/BLUL/master');
  fs.writeFileSync('./dist/require.github.js', wrap(dist[0], dist[1]));

  dist = await processMeta('./src/meta.js', 'https://raw.githubusercontent.com/SeaLoong/BLUL/master', true);
  fs.writeFileSync('./dist/meta.github.js', wrap(dist[0], dist[1]));

  dist = await processMeta('./src/meta.js', 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master');
  fs.writeFileSync('./dist/require.jsdelivr.js', wrap(dist[0], dist[1]));

  dist = await processMeta('./src/meta.js', 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master', true);
  fs.writeFileSync('./dist/meta.jsdelivr.js', wrap(dist[0], dist[1]));
})();
