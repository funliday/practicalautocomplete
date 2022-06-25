'use strict';

const _ = require('lodash');
const chokidar = require('chokidar');
const upath = require('upath');
const renderAssets = require('./render-assets');
const renderMd = require('./render-md');
const renderScripts = require('./render-scripts');
const renderSCSS = require('./render-scss');

const watcher = chokidar.watch('src', {
  persistent: true
});

let READY = false;

process.title = 'pug-watch';
process.stdout.write('Loading');
let allPugFiles = {};

watcher.on('add', filePath => _processFile(upath.normalize(filePath), 'add'));
watcher.on('change', filePath =>
  _processFile(upath.normalize(filePath), 'change')
);
watcher.on('ready', () => {
  READY = true;
  console.log(' READY TO ROLL!');
});

_handleSCSS();

function _processFile(filePath, watchEvent) {
  if (!READY) {
    if (filePath.match(/\.pug$/)) {
      if (
        !filePath.match(/includes/) &&
        !filePath.match(/mixins/) &&
        !filePath.match(/\/pug\/layouts\//)
      ) {
        allPugFiles[filePath] = true;
      }
    }
    process.stdout.write('.');
    return;
  }

  console.log(`### INFO: File event: ${watchEvent}: ${filePath}`);

  if (filePath.match(/\.md$/)) {
    return _handleMd(filePath, watchEvent);
  }

  if (filePath.match(/\.scss$/)) {
    if (watchEvent === 'change') {
      return _handleSCSS(filePath, watchEvent);
    }
    return;
  }

  if (filePath.match(/src\/js\//)) {
    return renderScripts();
  }

  if (filePath.match(/src\/assets\//)) {
    return renderAssets();
  }
}

function _handleMd(filePath, watchEvent) {
  if (watchEvent === 'change') {
    if (
      filePath.match(/includes/) ||
      filePath.match(/mixins/) ||
      filePath.match(/\/pug\/layouts\//)
    ) {
      return _renderAllMd();
    }
    return renderMd(filePath);
  }
  if (
    !filePath.match(/includes/) &&
    !filePath.match(/mixins/) &&
    !filePath.match(/\/pug\/layouts\//)
  ) {
    return renderMd(filePath);
  }
}

function _renderAllMd() {
  console.log('### INFO: Rendering All');
  _.each(allPugFiles, (value, filePath) => {
    renderMd(filePath);
  });
}

function _handleSCSS() {
  renderSCSS();
}
