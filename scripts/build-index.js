const upath = require('upath');
const fs = require('fs');

(() => {
  const sourcePath = upath.resolve(
    upath.dirname(__filename),
    '../src/index.html'
  );
  const destPath = upath.resolve(
    upath.dirname(__filename),
    '../dist/index.html'
  );
  const destFolder = upath.resolve(upath.dirname(__filename), '../dist');

  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
  }

  fs.copyFileSync(sourcePath, destPath);
})();
