const http = require('node:http');
const path = require('node:path');
const { createApiServer } = require('./app');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const server = createApiServer({
  filePath: path.join(__dirname, '..', 'data', 'local-db.sqlite'),
});

server.listen(port, host, () => {
  console.log(`SoleMuse local API listening on http://${host}:${port}/api/v1`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
