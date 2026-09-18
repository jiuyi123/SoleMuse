const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApiServer } = require('../src/app');

function createTestServer() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'solemuse-api-'));
  const server = createApiServer({ filePath: path.join(directory, 'db.sqlite') });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}/api/v1` })));
}

async function request(baseUrl, route, options = {}) {
  const result = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  const payload = await result.json();
  assert.equal(result.ok, true, JSON.stringify(payload));
  return payload.data;
}

test('本地 API 可以完成认证、作品创建和互动闭环', async (t) => {
  const { server, baseUrl } = await createTestServer();
  t.after(() => server.close());

  const auth = await request(baseUrl, '/auth/wechat/login', { method: 'POST', body: { code: 'test-code' } });
  const headers = { Authorization: `Bearer ${auth.session.accessToken}` };
  const profile = await request(baseUrl, '/users/me', { headers });
  assert.equal(profile.accountId, 'SM-000001');

  const presign = await request(baseUrl, '/uploads/presign', { method: 'POST', headers, body: { filename: 'shoe.jpg', mimeType: 'image/jpeg', size: 4 } });
  const uploadResponse = await fetch(`${baseUrl}${presign.uploadUrl.replace('/api/v1', '')}`, { method: 'POST', headers: { Authorization: headers.Authorization, 'content-type': 'application/octet-stream' }, body: Buffer.from([1, 2, 3, 4]) });
  const uploaded = await uploadResponse.json();
  assert.equal(uploadResponse.ok, true);
  assert.equal(uploaded.data.status, 'uploaded');
  const assetResponse = await fetch(uploaded.data.url);
  assert.equal(assetResponse.status, 200);

  const draft = await request(baseUrl, '/artworks', { method: 'POST', headers, body: {
    title: '', prompt: '', categoryId: '', tags: ['联调'], images: [], status: 'draft',
  } });
  assert.equal(draft.status, 'draft');
  await request(baseUrl, `/artworks/${draft.id}`, { method: 'PATCH', headers, body: {
    title: '本地联调作品', prompt: 'test prompt', categoryId: '运动鞋', images: ['/tmp/demo.jpg'],
  } });
  const published = await request(baseUrl, `/artworks/${draft.id}/publish`, { method: 'POST', headers });
  assert.equal(published.status, 'published');

  const like = await request(baseUrl, `/artworks/${published.id}/like`, { method: 'PUT', headers });
  assert.equal(like.liked, true);
  const comment = await request(baseUrl, `/artworks/${published.id}/comments`, { method: 'POST', headers, body: { content: '联调评论' } });
  assert.equal(comment.content, '联调评论');

  const preferences = await request(baseUrl, '/users/me/notification-preferences', { headers });
  assert.equal(preferences.likes, true);
  const search = await request(baseUrl, '/artworks?keyword=联调', { headers });
  assert.equal(search.items.length, 1);
});

test('本地 API 支持消息会话和关注操作', async (t) => {
  const { server, baseUrl } = await createTestServer();
  t.after(() => server.close());
  const auth = await request(baseUrl, '/auth/phone/login', { method: 'POST', body: { code: 'phone-code' } });
  const headers = { Authorization: `Bearer ${auth.session.accessToken}` };
  const follow = await request(baseUrl, '/users/prototype-user-shanhai/follow', { method: 'PUT', headers });
  assert.equal(follow.following, true);
  const conversation = await request(baseUrl, '/conversations/direct', { method: 'POST', headers, body: { participantId: 'prototype-user-shanhai' } });
  const message = await request(baseUrl, `/conversations/${conversation.id}/messages`, { method: 'POST', headers, body: { content: '你好' } });
  assert.equal(message.content, '你好');
  const detail = await request(baseUrl, `/conversations/${conversation.id}/messages`, { headers });
  assert.equal(detail.messages.at(-1).content, '你好');
});
