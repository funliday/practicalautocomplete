'use strict';
const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');
const { marked } = require('marked');

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
    const localePath = upath.resolve(localesPath, locale);

    const localeDestPath = upath.resolve(destPathDirname, 'locales', locale);

    if (!sh.test('-e', localeDestPath)) {
      sh.mkdir('-p', localeDestPath);
    }

    const files = fs.readdirSync(localePath);

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
        locales
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
