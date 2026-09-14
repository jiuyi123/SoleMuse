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

test('search page keeps the requested navigation and discovery order responsive', () => {
  const markup = read('subpackages/artwork/pages/search/index.wxml');
  const styles = read('subpackages/artwork/pages/search/index.wxss');
  const backIndex = markup.indexOf('<app-header back transparent />');
  const searchIndex = markup.indexOf('class="search-row"');
  const historyIndex = markup.indexOf('历史搜索');
  const hotIndex = markup.indexOf('热搜内容');

  assert.ok(backIndex >= 0 && backIndex < searchIndex && searchIndex < historyIndex && historyIndex < hotIndex);
  assert.match(markup, /class="search-box__input"/);
  assert.match(markup, /class="search-confirm"[\s\S]*aria-role="button"[\s\S]*>搜索<\/view>/);
  assert.match(styles, /\.search-row\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 56px/);
  assert.match(styles, /\.search-box\s*\{[^}]*width:\s*100%/);
  assert.match(styles, /\.search-confirm\s*\{[^}]*width:\s*56px;[^}]*justify-content:\s*flex-end/);
  assert.match(styles, /\.search-box__clear\s*\{[^}]*top:\s*50%;[^}]*right:\s*12px;[^}]*translateY\(-50%\)/);
  assert.match(styles, /\.keyword-list\s*\{[^}]*flex-wrap:\s*wrap;[^}]*justify-content:\s*flex-start/);
  assert.match(styles, /\.keyword-chip\s*\{[^}]*display:\s*inline-flex;[^}]*flex:\s*none;[^}]*width:\s*auto/);
  assert.match(styles, /@media \(min-width: 600px\)[\s\S]*\.hot-search-grid\s*\{\s*grid-template-columns:\s*repeat\(3/);
  assert.match(styles, /@media \(min-width: 900px\)[\s\S]*\.hot-search-grid\s*\{\s*grid-template-columns:\s*repeat\(4/);
  assert.match(markup, /<block wx:if="\{\{!hasSearched\}\}">[\s\S]*历史搜索[\s\S]*热搜内容[\s\S]*<\/block>/);
  assert.match(markup, /<view wx:else class="result-section">/);
  assert.match(markup, /class="filter-scroll"[\s\S]*最新发布[\s\S]*热度排序[\s\S]*共 \{\{artworks\.length\}\} 个结果/);
  assert.match(styles, /\.filter-list\s*\{[^}]*width:\s*max-content/);
  assert.match(styles, /\.result-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(min-width: 768px\)[\s\S]*\.result-grid\s*\{\s*grid-template-columns:\s*repeat\(3/);
  assert.match(styles, /@media \(min-width: 1200px\)[\s\S]*\.result-grid\s*\{\s*grid-template-columns:\s*repeat\(4/);
});

test('shared back control avoids native button sizing and stays square', () => {
  const markup = read('components/common/app-header/index.wxml');
  const styles = read('components/common/app-header/index.wxss');

  assert.doesNotMatch(markup, /<button[^>]*app-header__back/);
  assert.match(markup, /class="app-header__back"[\s\S]*aria-role="button"/);
  assert.match(styles, /\.app-header__back\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;/);
  assert.match(styles, /\.app-header__back-icon\s*\{[^}]*border-bottom:[^}]*border-left:/);
});

test('artwork cards expose only title, author identity and likes', () => {
  const markup = read('components/domain/artwork-card/index.wxml');
  assert.match(markup, /artwork-card__title/);
  assert.match(markup, /artwork-card__avatar/);
  assert.match(markup, /artwork-card__author/);
  assert.match(markup, /artwork-card__metrics/);
  assert.doesNotMatch(markup, /source-tag|artwork-card__stats|artwork-card__tags/);
});
