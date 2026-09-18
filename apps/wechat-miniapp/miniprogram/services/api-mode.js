const { getEnvironment } = require('../config/environment');

function isApiEnabled() {
  const environment = getEnvironment();
  return Boolean(environment.apiBaseUrl && !environment.useDemoData);
}

module.exports = {
  isApiEnabled,
};
