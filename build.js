const fs = require('fs');

const metaRequireRegExp = /\/\/\s+@require\s+(\S+)\s*/;
const srcRegExp = /src\/\S+\.js$/;

const cacheMap = new Map();

function bundleRequireMeta (path) {
  if (cacheMap.has(path)) {
    console.log('bundling ' + path + ', already cached.');
    return cacheMap.get(path);
  }
  console.log('bundling ' + path + ', not cache.');
  let data = fs.readFileSync(path).toString();
  const metaRegExp = /\/\/\s+==UserScript==\s+[\S\s]*?\s+\/\/\s+==\/UserScript==/g;
  if (metaRegExp.test(data)) {
    const metadata = data.slice(0, metaRegExp.lastIndex);
    const remainData = data.slice(metaRegExp.lastIndex);
    const insertData = [];
    let result;
    while ((result = metaRequireRegExp.exec(metadata))) {
      if (!(result = new URL(result[1]).pathname.match(srcRegExp))) continue;
      insertData.push(bundleRequireMeta('./' + result[0]));
    }
    const nl = '\n'.repeat(2);
    data = insertData.join(nl) + nl + remainData;
  }
  cacheMap.set(path, data);
  return data;
}

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

fs.writeFileSync('./dist/require.js', bundleRequireMeta('./src/meta.js'));
