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

function simulateCreateUploadCard(viewportWidth) {
  const pageWidth = Math.min(viewportWidth, 760);
  const pageGutter = 16;
  const cardPadding = 12;
  const cardContentWidth = pageWidth - pageGutter * 2 - cardPadding * 2;
  const uploadWidth = clamp(82, viewportWidth * 0.23, 90);
  const gap = 12;
  return { cardContentWidth, infoWidth: cardContentWidth - uploadWidth - gap, uploadWidth };
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

test('ranking page shows responsive periods, authors and complete interaction metrics', () => {
  const markup = read('pages/ranking/index.wxml');
  const styles = read('pages/ranking/index.wxss');
  const data = read('data/prototype-content.js');

  assert.doesNotMatch(markup, /<button[^>]*class="period/);
  assert.match(markup, /24小时热榜|\{\{item\.label\}\}/);
  assert.match(styles, /\.period-switch\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(markup, /class="author-avatar"[^>]*src="\{\{item\.avatarUrl\}\}"/);
  assert.match(markup, /author-avatar author-avatar--fallback/);
  assert.match(markup, /heart-filled\.svg/);
  assert.match(markup, /star-filled\.svg/);
  assert.match(markup, /\{\{item\.metrics\.comments\}\}/);
  assert.match(styles, /\.metric--like\s*\{[^}]*color:\s*#e55663/);
  assert.match(styles, /@media \(min-width: 768px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(min-width: 1100px\)[\s\S]*grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\)/);
  assert.match(data, /metrics:\s*\{\s*likes:[^}]*favorites:[^}]*comments:/);
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

test('artwork detail follows creator, gallery, content, comments and action-bar order', () => {
  const markup = read('subpackages/artwork/pages/detail/index.wxml');
  const styles = read('subpackages/artwork/pages/detail/index.wxss');
  const interactionMarkup = read('subpackages/artwork/pages/detail/components/bottom-interaction-bar/index.wxml');
  const interactionStyles = read('subpackages/artwork/pages/detail/components/bottom-interaction-bar/index.wxss');
  const creatorIndex = markup.indexOf('class="creator-summary"');
  const galleryIndex = markup.indexOf('class="gallery-section"');
  const titleIndex = markup.indexOf('class="artwork-title"');
  const promptIndex = markup.indexOf('>Prompt<');
  const descriptionIndex = markup.indexOf('>创作说明<');
  const commentsIndex = markup.indexOf('id="comments"');
  const bottomIndex = markup.indexOf('<bottom-interaction-bar');

  assert.ok(creatorIndex >= 0 && creatorIndex < galleryIndex);
  assert.ok(galleryIndex < titleIndex && titleIndex < promptIndex && promptIndex < descriptionIndex);
  assert.ok(descriptionIndex < commentsIndex && commentsIndex < bottomIndex);
  assert.match(markup, /wx:if="\{\{artwork\.images\.length > 1\}\}"[\s\S]*class="thumbnail-scroll"/);
  assert.match(markup, /最新[\s\S]*最多点赞/);
  assert.match(styles, /\.detail-header__inner\s*\{[^}]*grid-template-columns:\s*40px minmax\(0, 1fr\) auto/);
  assert.match(interactionStyles, /\.bottom-interaction-bar\s*\{[^}]*position:\s*fixed/);
  assert.match(interactionStyles, /\.bottom-interaction-bar\s*\{[^}]*border-radius:\s*0/);
  assert.match(interactionStyles, /\.action-group\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(interactionStyles, /\.interaction-button\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%/);
  assert.match(interactionStyles, /\.interaction-button\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center/);
  assert.match(interactionStyles, /\.interaction-button__icon-image\s*\{[^}]*width:\s*clamp\(24px, 6\.4vw, 28px\)/);
  assert.match(interactionStyles, /\.interaction-button\s*\{[^}]*font-size:\s*clamp\(14px, 3\.8vw, 16px\)/);
  assert.match(styles, /\.detail-header\s*\{[^}]*position:\s*fixed/);
  assert.doesNotMatch(markup, /class="detail-page" style="padding-top:/);
  assert.match(markup, /class="gallery-shade"/);
  assert.match(styles, /\.detail-header\s*\{[^}]*linear-gradient/);
  assert.match(styles, /\.detail-header--solid\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.94\)/);
  assert.match(styles, /\.artwork-swiper,[\s\S]*\.artwork-image\s*\{[^}]*height:\s*min\(100vw, 760px\);[^}]*aspect-ratio:\s*1 \/ 1/);
  assert.match(styles, /\.thumbnail-scroll\s*\{[^}]*margin-top:\s*-16px;[^}]*border-radius:\s*22px 22px 0 0/);
  assert.match(read('subpackages/artwork/pages/detail/index.js'), /onPageScroll\(event\)[\s\S]*headerSolid/);
  assert.match(markup, /class="creator-name">\{\{artwork\.author\.nickname\}\}/);
  assert.match(markup, /wx:if="\{\{authorBadges\.length\}\}" class="creator-badges"/);
  assert.match(markup, /class="artwork-publish-time">\{\{artwork\.publishedAtDisplay\}\} 发布/);
  assert.match(interactionMarkup, /class="interaction-button share-button" open-type="share"/);
  assert.match(interactionMarkup, /src="\/assets\/icons\/share-outline\.svg"/);
  assert.match(interactionMarkup, /heart-filled\.svg[^}]*heart-outline\.svg/);
  assert.match(interactionMarkup, /star-filled\.svg[^}]*star-outline\.svg/);
  assert.match(interactionStyles, /\.like-button\.interaction-button--active\s*\{[^}]*color:\s*#e66678/);
  assert.match(interactionStyles, /\.favorite-button\.interaction-button--active\s*\{[^}]*color:\s*#d99a17/);
  assert.match(interactionMarkup, /\{\{shareCount\}\}/);
  assert.match(interactionStyles, /\.bottom-interaction-bar--input-active\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 0/);
  assert.match(markup, /class="artwork-image"[\s\S]*mode="aspectFill"/);
});

test('artwork cards expose only title, author identity and likes', () => {
  const markup = read('components/domain/artwork-card/index.wxml');
  assert.match(markup, /artwork-card__title/);
  assert.match(markup, /artwork-card__avatar/);
  assert.match(markup, /artwork-card__author/);
  assert.match(markup, /artwork-card__metrics/);
  assert.doesNotMatch(markup, /source-tag|artwork-card__stats|artwork-card__tags/);
});

test('profile page uses the redesigned identity, social stats and scrollable content hierarchy', () => {
  const markup = read('pages/profile/index.wxml');
  const styles = read('pages/profile/index.wxss');
  const data = read('data/prototype-content.js');
  const logic = read('pages/profile/index.js');

  assert.match(markup, /profile-topbar[\s\S]*profile-identity[\s\S]*profile-stats/);
  assert.doesNotMatch(markup, /profile-signature/);
  assert.match(data, /关注[\s\S]*粉丝[\s\S]*获赞与收藏/);
  assert.doesNotMatch(markup, /profile-cover__image/);
  assert.match(markup, /IP：\{\{profile\.region\}\}/);
  assert.match(markup, /padding-top: \{\{statusBarHeight\}\}px/);
  assert.match(markup, /height: \{\{navigationHeight\}\}px; padding-right: \{\{headerRightInset\}\}px/);
  assert.match(markup, /profile-social-row[\s\S]*profile-stats[\s\S]*profile-edit/);
  assert.match(markup, /wx:if="\{\{isOwnProfile\}\}" class="profile-actions"[\s\S]*profile-edit[\s\S]*profile-settings/);
  assert.match(styles, /\.profile-settings\s*\{[^}]*width:\s*34px;[^}]*height:\s*34px/);
  assert.match(logic, /openSettings\(\) \{ router\.navigateTo\(ROUTES\.SETTINGS\); \}/);
  assert.match(markup, /class="profile-bio">\{\{profile\.bio\}\}<\/text>[\s\S]*specialty-list/);
  assert.match(styles, /\.profile-cover\s*\{[^}]*border-bottom:/);
  assert.doesNotMatch(styles, /\.profile-social-row\s*\{[^}]*border-(top|bottom):/);
  assert.doesNotMatch(styles, /\.(content-tabs|status-tabs|comment-filter-tabs)\s*\{[^}]*border-bottom:/);
  assert.match(logic, /作品[\s\S]*评论[\s\S]*点赞[\s\S]*收藏[\s\S]*印迹/);
  assert.match(markup, /已发布[\s\S]*草稿/);
  assert.match(markup, /comment-filter-tabs[\s\S]*全部[\s\S]*公开/);
  assert.match(markup, /comment-record__content[\s\S]*来自作品/);
  assert.match(markup, /artwork-grid[\s\S]*artwork-card/);
  assert.match(styles, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(markup, /class="profile-page-scroll" scroll-y[\s\S]*profile-overview[\s\S]*content-navigation[\s\S]*class="artwork-grid"/);
  assert.match(styles, /\.profile-page\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/);
  assert.match(styles, /\.profile-page-scroll\s*\{[^}]*height:\s*0;[^}]*flex:\s*1/);
  assert.match(styles, /\.content-navigation\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0/);
  assert.doesNotMatch(markup, /class="profile-content-scroll"/);
});

test('messages page follows the compact notification-center hierarchy', () => {
  const markup = read('pages/messages/index.wxml');
  const styles = read('pages/messages/index.wxss');
  const logic = read('pages/messages/index.js');
  const data = read('data/prototype-content.js');

  assert.match(markup, /message-header[\s\S]*message-channels[\s\S]*message-list/);
  assert.doesNotMatch(markup, /message-header__actions|message-header__search|message-header__plus/);
  assert.match(data, /赞和收藏[\s\S]*新增关注[\s\S]*评论和@/);
  assert.match(data, /message-reaction\.svg[\s\S]*message-follow\.svg[\s\S]*message-comment\.svg/);
  assert.match(markup, /message-row__title[\s\S]*message-row__time[\s\S]*message-row__summary/);
  assert.match(styles, /\.message-channels\s*\{[^}]*grid-template-columns:\s*repeat\(3/);
  assert.match(styles, /\.message-channel__icon\s*\{[^}]*width:\s*54px;[^}]*height:\s*54px/);
  assert.match(styles, /\.message-header__title\s*\{[^}]*font-size:\s*18px;[^}]*font-weight:\s*600/);
  assert.match(styles, /\.message-row\s*\{[^}]*min-height:\s*78px/);
  assert.match(logic, /getMessageChannels\(\)/);
  assert.match(logic, /activeFilter:\s*'inbox'/);
  assert.match(data, /type: 'direct'/);
  assert.match(data, /type: 'follow'/);
  assert.match(logic, /openChannel[\s\S]*ROUTES\.MESSAGE_CATEGORY/);
  assert.match(logic, /item\.type === 'direct' \|\| item\.type === 'system' \|\| item\.type === 'status'[\s\S]*ROUTES\.CHAT/);
});

test('direct messages open a responsive chat with service-backed sending', () => {
  const markup = read('subpackages/messages/pages/chat/index.wxml');
  const styles = read('subpackages/messages/pages/chat/index.wxss');
  const logic = read('subpackages/messages/pages/chat/index.js');
  const routes = read('constants/routes.js');
  const appConfig = read('app.json');

  assert.match(routes, /CHAT:\s*'\/subpackages\/messages\/pages\/chat\/index'/);
  assert.match(appConfig, /pages\/chat\/index/);
  assert.match(markup, /class="chat-thread"[\s\S]*chat-message--\{\{item\.sender\}\}[\s\S]*class="chat-composer"/);
  assert.match(markup, /item\.sender === 'self'[^>]*class="chat-avatar"[^>]*src="\{\{currentUserAvatar\}\}"/);
  assert.match(markup, /confirm-type="send"[\s\S]*bindconfirm="sendMessage"/);
  assert.match(styles, /\.chat-thread\s*\{[^}]*height:\s*0;[^}]*flex:\s*1/);
  assert.match(styles, /\.chat-composer\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(logic, /getConversation\(this\.data\.conversationId\)/);
  assert.match(logic, /sendConversationMessage\(this\.data\.conversationId, content\)/);
});

test('message categories are back-navigable subpages and artwork interactions keep their destinations', () => {
  const markup = read('subpackages/messages/pages/category/index.wxml');
  const styles = read('subpackages/messages/pages/category/index.wxss');
  const logic = read('subpackages/messages/pages/category/index.js');
  const routes = read('constants/routes.js');

  assert.match(routes, /MESSAGE_CATEGORY:\s*'\/subpackages\/messages\/pages\/category\/index'/);
  assert.match(markup, /<app-header title="\{\{title\}\}" back transparent/);
  assert.match(logic, /reaction:\s*'收到的赞和收藏'[\s\S]*follow:\s*'新增关注'[\s\S]*comment:\s*'评论和@'/);
  assert.match(logic, /getMessagesByCategory\(this\.data\.filter\)/);
  assert.match(logic, /item\.artworkId[\s\S]*ROUTES\.ARTWORK_DETAIL/);
  assert.match(logic, /item\.type === 'follow'[\s\S]*用户主页建设中/);
  assert.match(styles, /\.category-item\s*\{[^}]*margin:\s*0 10px/);
});

test('create page keeps a fixed capsule-safe header and compact controls responsive', () => {
  const markup = read('pages/create/index.wxml');
  const styles = read('pages/create/index.wxss');

  assert.doesNotMatch(markup, /editor-intro|SOLE MUSE STUDIO/);
  assert.match(markup, /class="publish-header" style="padding-top: \{\{statusBarHeight\}\}px;"/);
  assert.match(markup, /class="publish-header__bar" style="min-height: \{\{headerBarHeight\}\}px; padding-right: \{\{headerRightInset\}\}px;"/);
  assert.match(markup, /发布作品[\s\S]*分享你的 AI 鞋履设计创意/);
  assert.match(markup, /class="upload-card"[\s\S]*class="upload-placeholder/);
  assert.match(styles, /\.publish-header\s*\{[^}]*position:\s*fixed/);
  assert.match(markup, /class="page publish-content create-page" style="padding-top: \{\{statusBarHeight \+ headerBarHeight \+ 10\}\}px;"/);
  assert.match(styles, /\.publish-content\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*100vh;[^}]*flex-direction:\s*column/);
  assert.match(styles, /\.form-card\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*space-between;[^}]*gap:\s*clamp\(10px, 1\.6vh, 16px\)/);
  assert.match(styles, /\.upload-placeholder\s*\{[^}]*width:\s*clamp\(82px, 23vw, 90px\);[^}]*height:\s*clamp\(82px, 23vw, 90px\)/);
  assert.match(markup, /class="choice-scroll" scroll-x/);
  assert.doesNotMatch(markup, /<button[^>]*choice-chip/);
  assert.match(markup, /<view wx:for="\{\{categories\}\}"[^>]*aria-role="button"/);
  assert.match(markup, /<view wx:for="\{\{tagOptions\}\}"[^>]*aria-role="button"/);
  assert.equal((markup.match(/class="choice-chip choice-chip--custom"/g) || []).length, 2);
  assert.match(markup, /bindtap="addCustomCategory"/);
  assert.match(markup, /bindtap="addCustomTag"/);
  assert.match(markup, /class="paste-control" catchtap="pastePrompt"/);
  assert.match(styles, /\.form-field__prompt-heading\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.choice-list\s*\{[^}]*width:\s*max-content;[^}]*min-width:\s*100%;[^}]*flex-wrap:\s*nowrap;[^}]*justify-content:\s*flex-start;[^}]*gap:\s*5px/);
  assert.match(styles, /\.choice-chip\s*\{[^}]*min-height:\s*26px;[^}]*background:\s*#ffffff/);
  assert.match(markup, /class="description-toggle" bindtap="toggleDescription"/);
  assert.match(markup, /wx:if="\{\{descriptionExpanded\}\}" class="description-content"/);
  assert.match(styles, /\.bottom-action-bar\s*\{[^}]*position:\s*fixed;[^}]*env\(safe-area-inset-bottom\)/);
  assert.match(styles, /\.bottom-action-bar__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\);[^}]*gap:\s*12px/);
  assert.match(styles, /\.publish-content\s*\{[^}]*padding-bottom:\s*calc\(82px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(markup, /class="bottom-action-bar"/);
  assert.match(read('custom-tab-bar/index.wxml'), /wx:if="\{\{!hidden\}\}" class="tab-shell"/);
  assert.match(read('pages/create/index.js'), /syncTabBar\(this, 2, \{ hidden: true \}\)/);

  [320, 375, 390, 430].forEach((viewportWidth) => {
    const layout = simulateCreateUploadCard(viewportWidth);
    assert.ok(layout.uploadWidth >= 82 && layout.uploadWidth <= 90);
    assert.ok(layout.infoWidth >= 120, `${viewportWidth}px upload info is too narrow: ${layout.infoWidth}`);
  });
});
