const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const prettier = require('prettier');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const LOCALES = require('../src/json/locales.json');

dotenv.config();

const BASE_URL = process.env.BASE_URL;

module.exports = function renderMd(filePath, currentLocale, baseUrl) {
  const destPath = upath.resolve(
    upath.dirname(__dirname),
    'dist/locales',
    currentLocale.lang,
    `${filePath}.html`
  );

  const canonicalUrl = new URL(
    upath.resolve('/locales', currentLocale.lang, `${filePath}.html`),
    BASE_URL
  ).toString();

  console.log(
    `### INFO: Rendering ${filePath} to ${destPath} in ${currentLocale.lang}`
  );

  const pugFilePath = upath.resolve(
    upath.dirname(__dirname),
    'src/pug',
    `${filePath}.pug`
  );

  let pugBody = fs.readFileSync(pugFilePath, 'utf-8');

  pugBody = pugBody.replace(
    /(include:markdown-it)(\(.*\))? ([-\w]+.md)/g,
    `$1$2 ../markdown/locales/${currentLocale.lang}/${filePath}/$3`
  );

  let html = pug.render(pugBody, {
    filename: pugFilePath,
    basedir: upath.resolve(upath.dirname(__dirname), 'src/pug'),
    currentLocale,
    LOCALES,
    baseUrl,
    currentPage: filePath,
    canonicalUrl
  });

  const $ = cheerio.load(html);

  const title = $('h1').text();

  $('head').append(`<title>${title} | Practical Autocomplete</title>`);

  html = $.html();

  const prettified = prettier.format(html, {
    printWidth: 1000,
    tabWidth: 4,
    singleQuote: true,
    proseWrap: 'preserve',
    endOfLine: 'lf',
    parser: 'html',
    htmlWhitespaceSensitivity: 'ignore'
  });

  fs.writeFileSync(destPath, prettified);
};
