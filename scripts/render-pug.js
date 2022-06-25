'use strict';
const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');
const cheerio = require('cheerio');
const MarkdownIt = require('markdown-it');
const LOCALES = require('../src/json/locales.json');

const md = new MarkdownIt();

module.exports = function renderPug(filePath) {
  const destPath = filePath
    .replace(/src\/pug\//, 'dist/')
    .replace(/\.pug$/, '.html');
  const srcPath = upath.resolve(upath.dirname(__filename), '../src');
  const localesPath = upath.resolve(srcPath, './markdown/locales');

  const locales = fs.readdirSync(localesPath);

  console.log(`### INFO: Rendering ${filePath} to ${destPath}`);

  const destPathDirname = upath.dirname(destPath);

  if (!sh.test('-e', destPathDirname)) {
    sh.mkdir('-p', destPathDirname);
  }

  locales.forEach(locale => {
    const currentLocale = Object.entries(LOCALES)
      .map(entry => ({
        lang: entry[0],
        name: entry[1]
      }))
      .find(entry => entry.lang === locale);

    const localePath = upath.resolve(localesPath, locale);

    const localeDestPath = upath.resolve(destPathDirname, 'locales', locale);

    if (!sh.test('-e', localeDestPath)) {
      sh.mkdir('-p', localeDestPath);
    }

    const files = fs.readdirSync(localePath);

    const navLinks = [];

    files.forEach(file => {
      let link;

      if (file === 'README.md') {
        link = upath.join('/', 'locales', locale, 'index.html');
      } else {
        link = upath.join('/', 'locales', locale, file.replace('.md', '.html'));
      }

      const markdownBody = fs.readFileSync(
        upath.resolve(localePath, file),
        'utf-8'
      );

      const $ = cheerio.load(md.render(markdownBody));

      const name = $('h1').text();

      navLinks.push({
        name,
        link
      });
    });

    files.forEach(file => {
      let localeFileDestPath;

      if (file === 'README.md') {
        localeFileDestPath = upath.resolve(localeDestPath, 'index.html');
      } else {
        localeFileDestPath = upath.resolve(
          localeDestPath,
          file.replace('.md', '.html')
        );
      }

      let markdownBody = fs.readFileSync(
        upath.resolve(localePath, file),
        'utf-8'
      );

      markdownBody = markdownBody
        .split('\n')
        .map(line => {
          return `${' '.repeat(24)}${line}`;
        })
        .join('\n');

      const pugBody = fs.readFileSync(filePath, 'utf-8');

      const injectMarkdownBody = pugBody.replace(
        '#{markdownContent}',
        markdownBody
      );

      const html = pug.render(injectMarkdownBody, {
        filename: filePath,
        basedir: srcPath,
        currentLocale,
        LOCALES,
        navLinks
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

      fs.writeFileSync(localeFileDestPath, prettified);
    });
  });
};
