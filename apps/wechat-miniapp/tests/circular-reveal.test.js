const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calculateCircularReveal = require('../miniprogram/utils/circular-reveal');

const miniprogramRoot = path.resolve(__dirname, '../miniprogram');

function read(relativePath) {
  return fs.readFileSync(path.join(miniprogramRoot, relativePath), 'utf8');
}

test('circular reveal starts at the measured button center', () => {
  const reveal = calculateCircularReveal(
    { left: 164, top: 710, width: 64, height: 64 },
    { windowWidth: 390, windowHeight: 844 },
  );

  assert.equal(reveal.centerX, 196);
  assert.equal(reveal.centerY, 742);
});

test('circular reveal dynamically covers every viewport corner', () => {
  [
    { width: 320, height: 568, rect: { left: 134, top: 492, width: 52, height: 52 } },
    { width: 375, height: 812, rect: { left: 156, top: 722, width: 64, height: 64 } },
    { width: 430, height: 932, rect: { left: 181, top: 830, width: 68, height: 68 } },
  ].forEach(({ width, height, rect }) => {
    const reveal = calculateCircularReveal(rect, { windowWidth: width, windowHeight: height });
    const coveredRadius = (reveal.scale * 64) / 2;
    const cornerDistances = [
      Math.hypot(reveal.centerX, reveal.centerY),
      Math.hypot(width - reveal.centerX, reveal.centerY),
      Math.hypot(reveal.centerX, height - reveal.centerY),
      Math.hypot(width - reveal.centerX, height - reveal.centerY),
    ];

    assert.ok(coveredRadius > Math.max(...cornerDistances));
  });
});

test('creation tab waits for the GPU reveal before switching pages', () => {
  const behavior = read('custom-tab-bar/index.js');
  const markup = read('custom-tab-bar/index.wxml');
  const styles = read('custom-tab-bar/index.wxss');

  assert.match(behavior, /createSelectorQuery\(\)[\s\S]*boundingClientRect/);
  assert.match(behavior, /router\.switchTab\(path\)[\s\S]*REVEAL_DURATION \+ 20/);
  assert.match(behavior, /if \(this\.data\.transitioning\) return/);
  assert.match(markup, /catchtap="blockTransitionInteraction"[\s\S]*catchtouchmove="blockTransitionInteraction"/);
  assert.match(markup, /translate3d\(-50%, -50%, 0\) scale\(\{\{transitionScale\}\}\)/);
  assert.match(styles, /position:\s*fixed[\s\S]*z-index:\s*1000/);
  assert.match(styles, /transform 560ms cubic-bezier\(0\.18, 0\.82, 0\.22, 1\)/);
});

test('creation page uses the matching transition color and a short entrance fade', () => {
  const behavior = read('pages/create/index.js');
  const markup = read('pages/create/index.wxml');
  const styles = read('pages/create/index.wxss');

  assert.match(behavior, /creationTransitionPending/);
  assert.match(behavior, /onReady\(\)[\s\S]*playEntranceTransition/);
  assert.match(behavior, /onShow\(\)[\s\S]*creationTransitionPending/);
  assert.match(markup, /publish-page--transition-arrival/);
  assert.match(styles, /background:\s*#66a8d4/);
  assert.match(styles, /opacity 260ms ease-out/);
});

test('standard tabs avoid cross-page overlays and switch without artificial delay', () => {
  const behavior = read('custom-tab-bar/index.js');
  const markup = read('custom-tab-bar/index.wxml');
  const syncBehavior = read('utils/sync-tab-bar.js');

  assert.match(behavior, /if \(index === CREATION_TAB_INDEX\)[\s\S]*router\.switchTab\(item\.path\)/);
  assert.doesNotMatch(behavior, /startTabTransition|TAB_SWITCH_DELAY|tabTransitionPending/);
  assert.doesNotMatch(markup, /tab-page-transition|pageTransitionVisible/);
  assert.match(syncBehavior, /setData\(\{ hidden: Boolean\(options\.hidden\), selected, ready: true \}\)/);
});
