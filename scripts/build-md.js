const fs = require('fs');
const upath = require('upath');
const dotenv = require('dotenv');
const sh = require('shelljs');
const renderMd = require('./render-md');
const LOCALES = require('../src/json/locales.json');

dotenv.config();

const BASE_URL = process.env.BASE_URL;

const srcPath = upath.resolve(upath.dirname(__dirname), 'src/markdown/locales');

const locales = fs.readdirSync(srcPath);

locales.forEach(locale => {
  const currentLocale = Object.entries(LOCALES)
    .map(entry => ({
      lang: entry[0],
      name: entry[1]
    }))
    .find(entry => entry.lang === locale);

  const localePath = upath.resolve(srcPath, locale);

  const baseUrl = new URL(
    upath.join('locales', currentLocale.lang, '/'),
    BASE_URL
  ).toString();

  const localeDestPath = upath.resolve(
    upath.dirname(__dirname),
    'dist/locales',
    locale
  );

  if (!sh.test('-e', localeDestPath)) {
    sh.mkdir('-p', localeDestPath);
  }

  const files = fs.readdirSync(localePath);

  files.forEach(file => {
    if (file === 'README.md') {
      renderMd(file, currentLocale, baseUrl);
    } else {
      renderMd(file, currentLocale, baseUrl);
    }
  });
});
