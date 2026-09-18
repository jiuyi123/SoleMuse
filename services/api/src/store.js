const fs = require('node:fs');
const path = require('node:path');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStore({ filePath, seed }) {
  if (/\.sqlite(?:3)?$/i.test(filePath)) {
    try {
      return require('./sqlite-store').createSqliteStore({ filePath, seed });
    } catch (error) {
      if (error.code !== 'ERR_UNKNOWN_BUILTIN_MODULE' && error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let state;
  if (fs.existsSync(filePath)) {
    state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    state = clone(seed);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  return {
    state,
    save() {
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
    },
    reset() {
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, clone(seed));
      this.save();
    },
  };
}

module.exports = { createStore };
