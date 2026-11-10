// Álvaro Martínez
// Comprobación automática de la API: lanza peticiones correctas e incorrectas
// y verifica que el código de respuesta es el esperado.
// Uso (con el servidor en marcha y la base recién sembrada): node scripts/check-api.js
const http = require('node:http');

const BASE = process.env.API_URL || 'http://localhost:3000';
const PASSWORD = 'Password123';

let total = 0;
let fallos = 0;

function comprobar(nombre, condicion, detalle = '') {
  total++;
  if (condicion) {
    console.log(`  OK     ${nombre}`);
  } else {
    fallos++;
    console.log(`  FALLO  ${nombre} ${detalle}`);
  }
}

// Compara el código de estado obtenido con el esperado
function estado(nombre, res, esperado) {
  comprobar(
    `${nombre} -> ${esperado}`,
    res.status === esperado,
    `(obtenido ${res.status}: ${JSON.stringify(res.json)})`
  );
}

// Comprueba un 200 cuyo cuerpo es una lista con n elementos
function elementos(nombre, res, n) {
  comprobar(
    `${nombre} -> 200 con ${n} elemento(s)`,
    res.status === 200 && Array.isArray(res.json) && res.json.length === n,
    `(obtenido ${res.status}: ${JSON.stringify(res.json)})`
  );
}

function titulo(texto) {
  console.log(`\n${texto}`);
}

async function pedir(metodo, ruta, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let cuerpo;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cuerpo = typeof body === 'string' ? body : JSON.stringify(body);
  }
  try {
    const res = await fetch(BASE + ruta, { method: metodo, headers, body: cuerpo });
    const texto = await res.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      /* respuestas sin cuerpo, como el 204 */
    }
    return { status: res.status, json };
  } catch (err) {
    return { status: 0, json: { error: err.message } };
  }
}

// Devuelve las cabeceras de una respuesta, pudiendo indicar el origen (para probar CORS)
function cabecerasDe(ruta, origen) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + ruta);
    const peticion = http.get(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: origen ? { Origin: origen } : {},
      },
      (res) => {
        res.resume();
        resolve(res.headers);
      }
    );
    peticion.on('error', reject);
  });
}

async function main() {
  const salud = await pedir('GET', '/api/health');
  if (salud.status !== 200) {
    throw new Error(`El servidor no responde en ${BASE}. Arráncalo con "npm run dev".`);
  }

  const iniciarSesion = async (email) => {
    const res = await pedir('POST', '/api/auth/login', { body: { email, password: PASSWORD } });
    if (res.status !== 200) {
      throw new Error(
        `No se pudo iniciar sesión con ${email} (estado ${res.status}). ` +
          'Escribe "rs" en la terminal del servidor y ejecuta "npx knex seed:run".'
      );
    }
    return res.json.token;
  };

  const ana = await iniciarSesion('ana@demo.com');
  const luis = await iniciarSesion('luis@demo.com');
  const admin = await iniciarSesion('admin@demo.com');
  console.log('Sesiones iniciadas: Ana (miembro), Luis (miembro) y Admin');

  let res;

  // ---------------------------------------------------------------- 1
  titulo('1. Servidor y seguridad básica');
  estado('GET /api/health', await pedir('GET', '/api/health'), 200);
  estado('GET /api/loquesea (ruta inexistente)', await pedir('GET', '/api/loquesea'), 404);
  estado(
    'POST con JSON mal formado',
    await pedir('POST', '/api/auth/login', { body: '{malo' }),
    400
  );
  estado(
    'POST con un cuerpo de 20 KB (límite de 10 KB)',
    await pedir('POST', '/api/auth/login', { body: { email: 'a'.repeat(20000) } }),
    413
  );
  const cabeceras = await cabecerasDe('/api/health');
  comprobar('Helmet: no aparece X-Powered-By', cabeceras['x-powered-by'] === undefined);
  comprobar(
    'Helmet: X-Content-Type-Options es nosniff',
    cabeceras['x-content-type-options'] === 'nosniff'
  );
  const permitido = await cabecerasDe('/api/health', 'http://localhost:5500');
  comprobar(
    'CORS: el origen del frontend recibe permiso',
    permitido['access-control-allow-origin'] === 'http://localhost:5500'
  );
  const ajeno = await cabecerasDe('/api/health', 'http://sitio-malicioso.com');
  comprobar(
    'CORS: un origen ajeno no recibe permiso',
    ajeno['access-control-allow-origin'] === undefined
  );

  // ---------------------------------------------------------------- 2
  titulo('2. Equipos: lectura y control de acceso');
  estado('GET /api/teams sin token', await pedir('GET', '/api/teams'), 401);
  elementos('GET /api/teams (Ana)', await pedir('GET', '/api/teams', { token: ana }), 1);
  elementos('GET /api/teams (Luis)', await pedir('GET', '/api/teams', { token: luis }), 2);
  elementos('GET /api/teams (Admin)', await pedir('GET', '/api/teams', { token: admin }), 2);
  estado('GET /api/teams/1 (Ana, su equipo)', await pedir('GET', '/api/teams/1', { token: ana }), 200);
  estado('GET /api/teams/2 (Ana, equipo ajeno)', await pedir('GET', '/api/teams/2', { token: ana }), 403);
  estado('GET /api/teams/2 (Admin, sin ser miembro)', await pedir('GET', '/api/teams/2', { token: admin }), 200);
  estado('GET /api/teams/99 (no existe)', await pedir('GET', '/api/teams/99', { token: admin }), 404);
  estado('GET /api/teams/abc (id no numérico)', await pedir('GET', '/api/teams/abc', { token: admin }), 404);
  elementos('GET /api/teams/1/members (Ana)', await pedir('GET', '/api/teams/1/members', { token: ana }), 2);

  // ---------------------------------------------------------------- 3
  titulo('3. Tareas y estadísticas: lectura');
  estado('GET /api/teams/1/tasks sin token', await pedir('GET', '/api/teams/1/tasks'), 401);
  res = await pedir('GET', '/api/teams/1/tasks', { token: ana });
  elementos('GET /api/teams/1/tasks (Ana)', res, 4);
  const tareas1 = Array.isArray(res.json) ? res.json.map((t) => t.id) : [];
  comprobar(
    'Cada tarea incluye assigned_name y team_name (resultado del JOIN)',
    Array.isArray(res.json) &&
      res.json.every((t) => 'assigned_name' in t && t.team_name === 'Equipo Alfa')
  );
  estado('GET /api/teams/2/tasks (Ana, equipo ajeno)', await pedir('GET', '/api/teams/2/tasks', { token: ana }), 403);
  res = await pedir('GET', '/api/teams/2/tasks', { token: admin });
  elementos('GET /api/teams/2/tasks (Admin)', res, 2);
  const tareaAjena = res.json?.[0]?.id; // tarea del equipo 2
  elementos('GET /api/teams/2/tasks (Luis)', await pedir('GET', '/api/teams/2/tasks', { token: luis }), 2);
  res = await pedir('GET', '/api/teams/1/stats', { token: ana });
  const base = res.json?.por_estado;
  comprobar(
    'GET /api/teams/1/stats (Ana) -> 200 con pendiente 1, en_curso 1, hecha 2 y total 4',
    res.status === 200 && base?.pendiente === 1 && base?.en_curso === 1 && base?.hecha === 2 && res.json.total === 4,
    `(obtenido ${res.status}: ${JSON.stringify(res.json)})`
  );

  // ---------------------------------------------------------------- 4
  titulo('4. Administración (solo rol admin)');
  estado('GET /api/admin/users sin token', await pedir('GET', '/api/admin/users'), 401);
  estado('GET /api/admin/users (Ana, miembro)', await pedir('GET', '/api/admin/users', { token: ana }), 403);
  res = await pedir('GET', '/api/admin/users', { token: admin });
  elementos('GET /api/admin/users (Admin)', res, 3);
  comprobar('La lista de usuarios no incluye contraseñas', !JSON.stringify(res.json).includes('password'));
  estado('GET /api/admin/otra (Ana, miembro)', await pedir('GET', '/api/admin/otra', { token: ana }), 403);
  estado('GET /api/admin/otra (Admin, ruta inexistente)', await pedir('GET', '/api/admin/otra', { token: admin }), 404);

  // ---------------------------------------------------------------- 5
  titulo('5. Autenticación');
  estado(
    'POST /api/auth/register con datos inválidos',
    await pedir('POST', '/api/auth/register', { body: { name: 'M', email: 'mal', password: '123' } }),
    400
  );
  res = await pedir('POST', '/api/auth/register', {
    body: { name: 'Marta', email: 'marta@demo.com', password: PASSWORD },
  });
  estado('POST /api/auth/register con datos válidos', res, 201);
  comprobar(
    'El registro devuelve rol miembro, un token y ninguna contraseña',
    res.json?.user?.role === 'miembro' &&
      typeof res.json?.token === 'string' &&
      !JSON.stringify(res.json).includes('password')
  );
  estado(
    'POST /api/auth/register con un email ya registrado',
    await pedir('POST', '/api/auth/register', {
      body: { name: 'Marta', email: 'marta@demo.com', password: PASSWORD },
    }),
    409
  );
  estado(
    'POST /api/auth/register con el mismo email en mayúsculas',
    await pedir('POST', '/api/auth/register', {
      body: { name: 'Marta', email: 'MARTA@demo.com', password: PASSWORD },
    }),
    409
  );
  res = await pedir('POST', '/api/auth/register', {
    body: { name: 'Pepe', email: 'pepe@demo.com', password: PASSWORD, role: 'admin' },
  });
  estado('POST /api/auth/register intentando ser admin', res, 201);
  comprobar('El rol "admin" enviado por el cliente se ignora', res.json?.user?.role === 'miembro');

  const mala = await pedir('POST', '/api/auth/login', {
    body: { email: 'ana@demo.com', password: 'incorrecta' },
  });
  const inexistente = await pedir('POST', '/api/auth/login', {
    body: { email: 'nadie@demo.com', password: PASSWORD },
  });
  estado('POST /api/auth/login con contraseña incorrecta', mala, 401);
  estado('POST /api/auth/login con un email que no existe', inexistente, 401);
  comprobar(
    'El mensaje de error es el mismo en los dos casos (no revela qué emails existen)',
    mala.json?.error !== undefined && mala.json?.error === inexistente.json?.error
  );
  estado(
    'POST /api/auth/login con datos inválidos',
    await pedir('POST', '/api/auth/login', { body: { email: 'mal' } }),
    400
  );
  estado(
    'POST /api/auth/login con el email en mayúsculas',
    await pedir('POST', '/api/auth/login', { body: { email: 'ANA@demo.com', password: PASSWORD } }),
    200
  );
  estado('GET /api/auth/me sin token', await pedir('GET', '/api/auth/me'), 401);
  res = await pedir('GET', '/api/auth/me', { token: ana });
  comprobar('GET /api/auth/me (Ana) -> 200 con su email', res.status === 200 && res.json?.email === 'ana@demo.com');
  estado('GET /api/auth/me con el token alterado', await pedir('GET', '/api/auth/me', { token: `${ana}x` }), 401);

  // ---------------------------------------------------------------- 6
  titulo('6. Equipos: crear y añadir miembros');
  estado(
    'POST /api/teams sin token',
    await pedir('POST', '/api/teams', { body: { name: 'Equipo Gamma' } }),
    401
  );
  res = await pedir('POST', '/api/teams', { token: ana, body: { name: 'Equipo Gamma' } });
  estado('POST /api/teams (Ana)', res, 201);
  comprobar('El equipo creado guarda a Ana como creadora (created_by 2)', res.json?.created_by === 2);
  const gamma = res.json?.id;
  estado('POST /api/teams con nombre demasiado corto', await pedir('POST', '/api/teams', { token: ana, body: { name: 'A' } }), 400);
  elementos('GET /api/teams (Ana) tras crear el suyo', await pedir('GET', '/api/teams', { token: ana }), 2);
  estado(
    `POST /api/teams/${gamma}/members (añadir a Luis)`,
    await pedir('POST', `/api/teams/${gamma}/members`, { token: ana, body: { email: 'luis@demo.com' } }),
    201
  );
  estado(
    'POST members repitiendo a Luis',
    await pedir('POST', `/api/teams/${gamma}/members`, { token: ana, body: { email: 'luis@demo.com' } }),
    409
  );
  estado(
    'POST members con un usuario que no existe',
    await pedir('POST', `/api/teams/${gamma}/members`, { token: ana, body: { email: 'nadie@demo.com' } }),
    404
  );
  estado(
    'POST members con un email inválido',
    await pedir('POST', `/api/teams/${gamma}/members`, { token: ana, body: { email: 'mal' } }),
    400
  );
  estado(
    'POST /api/teams/2/members (Ana, equipo ajeno)',
    await pedir('POST', '/api/teams/2/members', { token: ana, body: { email: 'luis@demo.com' } }),
    403
  );
  elementos('GET /api/teams (Luis) tras ser añadido', await pedir('GET', '/api/teams', { token: luis }), 3);
  elementos(`GET /api/teams/${gamma}/members`, await pedir('GET', `/api/teams/${gamma}/members`, { token: ana }), 2);

  // ---------------------------------------------------------------- 7
  titulo('7. Tareas: crear, editar, completar y eliminar');
  estado(
    'POST /api/teams/1/tasks sin token',
    await pedir('POST', '/api/teams/1/tasks', { body: { title: 'Prueba' } }),
    401
  );
  res = await pedir('POST', '/api/teams/1/tasks', {
    token: ana,
    body: { title: 'Revisar memoria', assigned_to: 3 },
  });
  estado('POST tarea asignada a Luis (debe enviar un email simulado)', res, 201);
  comprobar('La tarea nueva queda pendiente y asignada a Luis', res.json?.status === 'pendiente' && res.json?.assigned_to === 3);
  res = await pedir('POST', '/api/teams/1/tasks', { token: ana, body: { title: 'Tarea sin dueño' } });
  estado('POST tarea sin asignar (no envía email)', res, 201);
  comprobar('La tarea sin asignar tiene assigned_to null', res.json?.assigned_to === null);
  estado(
    'POST tarea asignada a alguien que no es del equipo',
    await pedir('POST', '/api/teams/2/tasks', { token: luis, body: { title: 'Prueba', assigned_to: 2 } }),
    400
  );
  estado(
    'POST tarea asignada a un usuario que no existe',
    await pedir('POST', '/api/teams/2/tasks', { token: luis, body: { title: 'Prueba', assigned_to: 99 } }),
    400
  );
  estado(
    'POST tarea con datos inválidos',
    await pedir('POST', '/api/teams/1/tasks', { token: ana, body: { title: '', status: 'terminada' } }),
    400
  );
  const cambio = { title: 'Logo final', assigned_to: 3 };
  res = await pedir('PUT', `/api/teams/1/tasks/${tareas1[0]}`, { token: ana, body: cambio });
  estado('PUT tarea reasignándola a Luis (debe enviar un email simulado)', res, 200);
  comprobar('La tarea editada tiene el título nuevo y está asignada a Luis', res.json?.title === 'Logo final' && res.json?.assigned_to === 3);
  estado(
    'PUT repitiendo el mismo cambio (el asignado no cambia: no envía email)',
    await pedir('PUT', `/api/teams/1/tasks/${tareas1[0]}`, { token: ana, body: cambio }),
    200
  );
  estado(
    'PUT sobre una tarea de otro equipo',
    await pedir('PUT', `/api/teams/1/tasks/${tareaAjena}`, { token: ana, body: { title: 'Intento' } }),
    404
  );
  estado(
    'PUT sobre una tarea que no existe',
    await pedir('PUT', '/api/teams/1/tasks/9999', { token: ana, body: { title: 'Intento' } }),
    404
  );
  res = await pedir('PATCH', `/api/teams/1/tasks/${tareas1[1]}/complete`, { token: ana });
  estado('PATCH completar una tarea', res, 200);
  comprobar('La tarea completada tiene estado hecha', res.json?.status === 'hecha');
  estado(
    'PATCH completar una tarea de otro equipo',
    await pedir('PATCH', `/api/teams/1/tasks/${tareaAjena}/complete`, { token: ana }),
    404
  );
  estado('DELETE de una tarea', await pedir('DELETE', `/api/teams/1/tasks/${tareas1[2]}`, { token: ana }), 204);
  estado('DELETE repetido (ya no existe)', await pedir('DELETE', `/api/teams/1/tasks/${tareas1[2]}`, { token: ana }), 404);
  estado(
    'DELETE en un equipo ajeno (Ana, equipo 2)',
    await pedir('DELETE', `/api/teams/2/tasks/${tareaAjena}`, { token: ana }),
    403
  );
  estado('DELETE con un id no numérico', await pedir('DELETE', '/api/teams/1/tasks/abc', { token: ana }), 404);
  estado(
    'POST tarea en el equipo 2 (Luis, miembro)',
    await pedir('POST', '/api/teams/2/tasks', { token: luis, body: { title: 'Tarea de Luis' } }),
    201
  );
  estado(
    'POST tarea en el equipo 2 (Admin, sin ser miembro)',
    await pedir('POST', '/api/teams/2/tasks', { token: admin, body: { title: 'Tarea del admin' } }),
    201
  );

  // ---------------------------------------------------------------- 8
  titulo('8. Estadísticas coherentes con las tareas');
  const lista = await pedir('GET', '/api/teams/1/tasks', { token: ana });
  const cuenta = { pendiente: 0, en_curso: 0, hecha: 0 };
  (lista.json || []).forEach((t) => {
    cuenta[t.status]++;
  });
  res = await pedir('GET', '/api/teams/1/stats', { token: ana });
  const stats = res.json?.por_estado;
  comprobar(
    `Las estadísticas del equipo 1 coinciden con el recuento real (${JSON.stringify(cuenta)})`,
    res.status === 200 &&
      stats?.pendiente === cuenta.pendiente &&
      stats?.en_curso === cuenta.en_curso &&
      stats?.hecha === cuenta.hecha &&
      res.json.total === (lista.json || []).length,
    `(obtenido ${JSON.stringify(res.json)})`
  );
  estado('GET /api/teams/1/stats sin token', await pedir('GET', '/api/teams/1/stats'), 401);
  estado('GET /api/teams/2/stats (Ana, equipo ajeno)', await pedir('GET', '/api/teams/2/stats', { token: ana }), 403);
  estado('GET /api/teams/2/stats (Admin)', await pedir('GET', '/api/teams/2/stats', { token: admin }), 200);
  estado('GET /api/teams/99/stats (no existe)', await pedir('GET', '/api/teams/99/stats', { token: admin }), 404);

  // ---------------------------------------------------------------- 9
  titulo('9. Límite de intentos de login (va el último porque bloquea tu IP)');
  let bloqueado = false;
  for (let i = 1; i <= 10 && !bloqueado; i++) {
    const intento = await pedir('POST', '/api/auth/login', {
      body: { email: 'ana@demo.com', password: 'incorrecta' },
    });
    bloqueado = intento.status === 429;
  }
  comprobar('Tras varios intentos fallidos, el login responde 429', bloqueado);
  estado(
    'Mientras dura el bloqueo, ni la contraseña correcta entra',
    await pedir('POST', '/api/auth/login', { body: { email: 'ana@demo.com', password: PASSWORD } }),
    429
  );

  console.log(`\nResultado: ${total - fallos} de ${total} comprobaciones correctas`);
  if (fallos > 0) {
    console.log(`Hay ${fallos} fallo(s): revisa las líneas marcadas con FALLO.`);
    process.exitCode = 1;
  }
  console.log('Ahora escribe "rs" en la terminal del servidor para quitar el bloqueo del login.');
}

main().catch((err) => {
  console.error('\nNo se pudo completar la comprobación:', err.message);
  process.exitCode = 1;
});
