const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const miniprogramRoot = path.join(projectRoot, 'miniprogram');

function read(relativePath) {
  return fs.readFileSync(path.join(miniprogramRoot, relativePath), 'utf8');
}

function clamp(minimum, preferred, maximum) {
  return Math.min(maximum, Math.max(minimum, preferred));
}

function simulateHomeArtworkGrid(viewportWidth) {
  const containerWidth = Math.min(viewportWidth, 1200);
  const gutter = clamp(16, viewportWidth * 0.04, 32);
  const contentWidth = containerWidth - gutter * 2;
  const columns = viewportWidth >= 1200 ? 4 : viewportWidth >= 768 ? 3 : 2;
  const gap = clamp(10, viewportWidth * 0.022, 22);
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  return { cardWidth, columns, contentWidth, gutter };
}

test('global layout uses a fluid gutter, bounded content and horizontal overflow protection', () => {
  const styles = read('app.wxss');
  assert.match(styles, /max-width:\s*1200px/);
  assert.match(styles, /padding:[^;]*clamp\(16px, 4vw, 32px\)/);
  assert.match(styles, /overflow-x:\s*hidden/);
});

test('home artwork grid keeps two mobile columns and adds columns on wider screens', () => {
  const expected = new Map([
    [320, 2],
    [375, 2],
    [390, 2],
    [430, 2],
    [768, 3],
    [1280, 4],
  ]);

  expected.forEach((columns, viewportWidth) => {
    const layout = simulateHomeArtworkGrid(viewportWidth);
    assert.equal(layout.columns, columns, `${viewportWidth}px should use ${columns} column(s)`);
    assert.ok(layout.gutter >= 16 && layout.gutter <= 32);
    assert.ok(layout.contentWidth <= viewportWidth);
    assert.ok(layout.cardWidth >= 130, `${viewportWidth}px card is too narrow: ${layout.cardWidth}`);
  });
});

test('image-heavy components preserve ratios and crop without distortion', () => {
  const styles = [
    read('components/domain/artwork-card/index.wxss'),
    read('pages/home/index.wxss'),
    read('pages/ranking/index.wxss'),
    read('subpackages/artwork/pages/detail/index.wxss'),
    read('styles/artwork-editor.wxss'),
  ].join('\n');

  assert.match(styles, /aspect-ratio:/);
  assert.match(styles, /object-fit:\s*cover/);
  assert.doesNotMatch(styles, /\.artwork-card__cover[^}]*height:\s*\d+(rpx|px)/);
});

test('responsive breakpoints cover tablet and desktop grids', () => {
  const home = read('pages/home/index.wxss');
  assert.match(home, /@media \(min-width: 768px\)/);
  assert.match(home, /@media \(min-width: 1200px\)/);
  assert.match(home, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(home, /repeat\(4, minmax\(0, 1fr\)\)/);
});

test('home chrome is fixed while tags and artwork remain in the scrolling page', () => {
  const markup = read('pages/home/index.wxml');
  const styles = read('pages/home/index.wxss');
  assert.match(styles, /\.home-fixed-header\s*\{[^}]*position:\s*fixed/);
  assert.match(markup, /class="home-fixed-header"/);
  assert.match(markup, /class="page tab-page home-page" style="padding-top: \{\{fixedHeaderHeight\}\}px;"/);
});

test('artwork cards expose only title, author identity and likes', () => {
  const markup = read('components/domain/artwork-card/index.wxml');
  assert.match(markup, /artwork-card__title/);
  assert.match(markup, /artwork-card__avatar/);
  assert.match(markup, /artwork-card__author/);
  assert.match(markup, /artwork-card__metrics/);
  assert.doesNotMatch(markup, /source-tag|artwork-card__stats|artwork-card__tags/);
});
