const app = require('./app');
const { port } = require('./config/env');

// Este archivo solo arranca el servidor; la app se define en app.js
app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});
