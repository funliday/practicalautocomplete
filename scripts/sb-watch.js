/* eslint-disable no-console */
const chokidar = require('chokidar');
const upath = require('upath');
const dotenv = require('dotenv');
const renderAssets = require('./render-assets');
const renderMd = require('./render-md');
const renderScripts = require('./render-scripts');
const renderSCSS = require('./render-scss');
const LOCALES = require('../src/json/locales.json');

dotenv.config();

const BASE_URL = process.env.BASE_URL;

const watcher = chokidar.watch('src', {
  persistent: true
});

let READY = false;

process.title = 'pug-watch';
process.stdout.write('Loading');

const _processFile = (filePath, watchEvent) => {
  if (!READY) {
    process.stdout.write('.');

    return;
  }

  console.log(`### INFO: File event: ${watchEvent}: ${filePath}`);

  if (filePath.match(/\.md$/)) {
    _handleMd(filePath, watchEvent);
  }

  if (filePath.match(/\.scss$/)) {
    if (watchEvent === 'change') {
      _handleSCSS(filePath, watchEvent);
    }

    return;
  }

  if (filePath.match(/src\/js\//)) {
    renderScripts();
  }

  if (filePath.match(/src\/assets\//)) {
    renderAssets();
  }
};

const _handleMd = (filePath, watchEvent) => {
  if (watchEvent !== 'change') {
    return;
  }

  const parts = filePath.split('/');

  const file = parts[4];
  const currentLocale = {
    lang: parts[3],
    name: LOCALES[parts[3]]
  };
  const baseUrl = new URL(
    upath.join('locales', currentLocale.lang, '/'),
    BASE_URL
  ).toString();

  renderMd(file, currentLocale, baseUrl);
};

const _handleSCSS = () => {
  renderSCSS();
};

watcher
  .on('add', filePath => _processFile(upath.normalize(filePath), 'add'))
  .on('change', filePath => _processFile(upath.normalize(filePath), 'change'))
  .on('ready', () => {
    READY = true;

    console.log(' READY TO ROLL!');
  });

_handleSCSS();
