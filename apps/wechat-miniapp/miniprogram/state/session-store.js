const session = require('../core/auth/session');

let currentSession = null;
const listeners = [];

function hydrate() {
  currentSession = session.getSession();
  return currentSession;
}

function getSnapshot() {
  return currentSession;
}

function setSnapshot(nextSession) {
  currentSession = nextSession;
  if (nextSession) {
    session.setSession(nextSession);
  } else {
    session.clearSession();
  }
  listeners.forEach((listener) => listener(currentSession));
}

function subscribe(listener) {
  listeners.push(listener);
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

module.exports = {
  getSnapshot,
  hydrate,
  setSnapshot,
  subscribe,
};
