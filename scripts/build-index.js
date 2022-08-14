const upath = require('upath');
const sh = require('shelljs');

(() => {
  const sourcePath = upath.resolve(
    upath.dirname(__filename),
    '../src/index.html'
  );
  const destPath = upath.resolve(upath.dirname(__filename), '../dist/.');

  sh.cp('-R', sourcePath, destPath);
})();
