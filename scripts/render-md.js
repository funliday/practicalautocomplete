const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const prettier = require('prettier');
const cheerio = require('cheerio');
const MarkdownIt = require('markdown-it');
const dotenv = require('dotenv');
const LOCALES = require('../src/json/locales.json');

dotenv.config();

const md = new MarkdownIt();

module.exports = function renderMd(filePath, currentLocale, baseUrl) {
  const destPath = upath.resolve(
    upath.dirname(__dirname),
    'dist/locales',
    currentLocale.lang,
    `${filePath}.html`
  );

  console.log(`### INFO: Rendering ${filePath} to ${destPath}`);

  const pugFilePath = upath.resolve(
    upath.dirname(__dirname),
    'src/pug',
    `${filePath}.pug`
  );

  let pugBody = fs.readFileSync(pugFilePath, 'utf-8');

  const groups = [...pugBody.matchAll(/#\{([-\w]+)\}/g)];

  let title;

  groups.forEach(group => {
    const groupName = group[1];

    let markdownBody = fs.readFileSync(
      upath.resolve(
        upath.dirname(__dirname),
        'src/markdown/locales',
        currentLocale.lang,
        filePath,
        `${groupName}.md`
      ),
      'utf-8'
    );

    if (!title) {
      const $ = cheerio.load(md.render(markdownBody));

      title = $('h1').text() || '';
    }

    markdownBody = markdownBody
      .split('\n')
      .map(line => `${' '.repeat(8)}${line}`)
      .join('\n');

    pugBody = pugBody.replace(`#{${groupName}}`, markdownBody);
  });

  const html = pug.render(pugBody, {
    filename: pugFilePath,
    basedir: upath.resolve(upath.dirname(__dirname), 'src/pug'),
    currentLocale,
    LOCALES,
    title,
    baseUrl
  });

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
