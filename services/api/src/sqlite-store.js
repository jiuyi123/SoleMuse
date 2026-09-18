const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const TABLES = [
  'users', 'user_profiles', 'auth_identities', 'phone_bindings', 'auth_sessions', 'media_assets',
  'artworks', 'artwork_images', 'artwork_ai_sources', 'artwork_revisions', 'categories', 'tags',
  'artwork_categories', 'artwork_tags', 'artwork_metrics', 'artwork_likes', 'artwork_favorites',
  'comments', 'comment_likes', 'user_follows', 'conversations', 'conversation_members', 'chat_messages',
  'notifications', 'notification_preferences', 'user_privacy_settings', 'user_search_histories', 'artwork_events',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function recordId(record, index) {
  return `${String(record.id || record.user_id || record.artwork_id || record.conversation_id || 'row')}-${index}`;
}

function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function createSqliteStore({ filePath, seed }) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  TABLES.forEach((table) => {
    const quotedTable = quoteIdentifier(table);
    database.exec(`CREATE TABLE IF NOT EXISTS ${quotedTable} (record_id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    database.exec(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`idx_${table}_updated_at`)} ON ${quotedTable}(updated_at)`);
  });

  const state = {};
  let hasData = false;
  TABLES.forEach((table) => {
    const rows = database.prepare(`SELECT payload FROM ${quoteIdentifier(table)} ORDER BY rowid`).all();
    state[table] = rows.map((row) => JSON.parse(row.payload));
    if (rows.length) hasData = true;
  });
  if (!hasData) {
    Object.assign(state, clone(seed));
  } else {
    TABLES.forEach((table) => {
      if (!state[table].length && seed[table]) state[table] = clone(seed[table]);
    });
  }

  const store = {
    state,
    save() {
      const timestamp = new Date().toISOString();
      database.exec('BEGIN');
      try {
        TABLES.forEach((table) => {
          const quotedTable = quoteIdentifier(table);
          database.exec(`DELETE FROM ${quotedTable}`);
          const statement = database.prepare(`INSERT INTO ${quotedTable} (record_id, payload, updated_at) VALUES (?, ?, ?)`);
          state[table].forEach((record, index) => statement.run(recordId(record, index), JSON.stringify(record), timestamp));
        });
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    reset() {
      TABLES.forEach((table) => { state[table] = clone(seed[table] || []); });
      this.save();
    },
    close() {
      database.close();
    },
    database,
  };

  store.save();
  return store;
}

module.exports = { TABLES, createSqliteStore };
