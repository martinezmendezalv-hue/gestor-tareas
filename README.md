# Gestor de tareas por equipos

Aplicación web para gestionar tareas en equipo. Los usuarios se registran, crean equipos, añaden miembros y gestionan las tareas de cada equipo, con notificación por email al asignar una tarea y estadísticas por estado.

Autor: Álvaro Martínez

> **Estado del proyecto:** el backend (API REST) está terminado. El frontend, las pruebas automatizadas y el despliegue se añadirán en las siguientes fases.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Servidor | Node.js y Express |
| Base de datos | SQLite, con Knex para migraciones y consultas |
| Autenticación | JWT (`jsonwebtoken`) y contraseñas con `bcrypt` |
| Validación | `zod` |
| Seguridad | `helmet`, `cors` y `express-rate-limit` |

## Requisitos

- Node.js 20 o superior (LTS)
- npm (se instala con Node.js)
- Git

## Instalación

```bash
git clone https://github.com/martinezmendezalv-hue/gestor-tareas.git
cd gestor-tareas/backend
npm install
```

Crea el archivo de configuración a partir de la plantilla:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Genera una clave aleatoria para `JWT_SECRET` y pégala en el `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Crea las tablas y carga los datos de prueba:

```bash
npm run migrate
npm run seed
```

## Ejecución

```bash
# Desarrollo (se reinicia al guardar cambios)
npm run dev

# Normal
npm start
```

El servidor queda en `http://localhost:3000`. Para comprobar que funciona: `http://localhost:3000/api/health` debe responder `{"status":"ok"}`.

### Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor con nodemon |
| `npm start` | Arranca el servidor |
| `npm run migrate` | Aplica las migraciones pendientes |
| `npm run seed` | Borra los datos y carga los datos de prueba |
| `npm test` | Ejecuta las pruebas con Jest (se añaden en la Fase 6) |

## Variables de entorno

Se definen en `backend/.env`. El archivo `.env` **no se sube a Git**; `.env.example` es la plantilla.

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NODE_ENV` | Entorno: `development`, `test` o `production`. Elige la base de datos | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Clave con la que se firman los tokens. **Obligatoria** y secreta | |
| `JWT_EXPIRES` | Duración del token (por ejemplo `2h`) | `2h` |
| `CORS_ORIGIN` | Orígenes del frontend con permiso, separados por comas | `http://localhost:5500` |
| `LOGIN_MAX_ATTEMPTS` | Intentos de login fallidos permitidos cada 15 minutos | `5` |

## Datos de prueba

`npm run seed` crea estos usuarios, todos con la contraseña `Password123`. **Son solo para desarrollo:** nunca se ejecuta el seed en producción.

| Usuario | Email | Rol | Equipos |
|---|---|---|---|
| Admin | `admin@demo.com` | `admin` | Accede a todos |
| Ana | `ana@demo.com` | `miembro` | Equipo Alfa |
| Luis | `luis@demo.com` | `miembro` | Equipo Alfa y Equipo Beta |

## API

Todas las rutas empiezan por `/api`. Las respuestas son siempre JSON, y los errores tienen la forma `{ "error": "mensaje" }`.

### Autenticación

Las rutas protegidas exigen un token en la cabecera:

```
Authorization: Bearer <token>
```

El token se obtiene en `/api/auth/register` o `/api/auth/login` y caduca según `JWT_EXPIRES`.

### Roles y permisos

- **`admin`:** ve todos los equipos y usuarios.
- **`miembro`:** solo accede a los equipos a los que pertenece. Todo usuario nuevo es `miembro`: el rol no se puede elegir al registrarse.

### Endpoints

| Método | Ruta | Acceso | Descripción | Éxito | Errores |
|---|---|---|---|---|---|
| GET | `/api/health` | Público | Comprueba que la API está viva | 200 | |
| POST | `/api/auth/register` | Público | Registra un usuario y devuelve un token | 201 | 400, 409 |
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve un token | 200 | 400, 401, 429 |
| GET | `/api/auth/me` | Sesión | Devuelve el usuario de la sesión | 200 | 401 |
| GET | `/api/teams` | Sesión | Lista los equipos del usuario (el admin ve todos) | 200 | 401 |
| POST | `/api/teams` | Sesión | Crea un equipo; el creador entra como miembro | 201 | 400, 401 |
| GET | `/api/teams/:teamId` | Miembro del equipo o admin | Detalle de un equipo | 200 | 401, 403, 404 |
| GET | `/api/teams/:teamId/members` | Miembro del equipo o admin | Lista los miembros | 200 | 401, 403, 404 |
| POST | `/api/teams/:teamId/members` | Miembro del equipo o admin | Añade un miembro por email | 201 | 400, 401, 403, 404, 409 |
| GET | `/api/teams/:teamId/tasks` | Miembro del equipo o admin | Lista las tareas del equipo | 200 | 401, 403, 404 |
| POST | `/api/teams/:teamId/tasks` | Miembro del equipo o admin | Crea una tarea | 201 | 400, 401, 403, 404 |
| PUT | `/api/teams/:teamId/tasks/:taskId` | Miembro del equipo o admin | Edita una tarea | 200 | 400, 401, 403, 404 |
| PATCH | `/api/teams/:teamId/tasks/:taskId/complete` | Miembro del equipo o admin | Marca una tarea como hecha | 200 | 401, 403, 404 |
| DELETE | `/api/teams/:teamId/tasks/:taskId` | Miembro del equipo o admin | Elimina una tarea | 204 | 401, 403, 404 |
| GET | `/api/teams/:teamId/stats` | Miembro del equipo o admin | Número de tareas por estado | 200 | 401, 403, 404 |
| GET | `/api/admin/users` | Solo admin | Lista todos los usuarios | 200 | 401, 403 |

### Códigos de respuesta

| Código | Significado |
|---|---|
| 200 | Correcto |
| 201 | Recurso creado |
| 204 | Correcto, sin contenido (eliminar) |
| 400 | Datos inválidos: la respuesta indica qué campos fallan |
| 401 | Falta el token, es inválido o ha caducado; o las credenciales son incorrectas |
| 403 | Hay sesión, pero no hay permiso (rol insuficiente o no pertenece al equipo) |
| 404 | El recurso no existe |
| 409 | Conflicto: el email ya está registrado o el usuario ya es miembro |
| 413 | El cuerpo de la petición supera los 10 KB |
| 429 | Demasiados intentos de login fallidos |
| 500 | Error interno del servidor (el detalle solo se registra en el servidor) |

### Ejemplos

**Registro**

`POST /api/auth/register`

```json
{ "name": "Marta", "email": "marta@demo.com", "password": "Password123" }
```

Respuesta `201`:

```json
{
  "user": { "id": 4, "name": "Marta", "email": "marta@demo.com", "role": "miembro" },
  "token": "eyJhbGciOi..."
}
```

La contraseña debe tener al menos 8 caracteres. Nunca se devuelve ni se guarda en texto plano.

**Login**

`POST /api/auth/login`

```json
{ "email": "ana@demo.com", "password": "Password123" }
```

La respuesta tiene la misma forma que la del registro. Si el email o la contraseña son incorrectos, la respuesta es la misma (`401`, `Credenciales incorrectas`), para no revelar qué emails están registrados.

**Crear una tarea**

`POST /api/teams/1/tasks`

```json
{ "title": "Revisar memoria", "description": "Capítulo 1", "assigned_to": 3 }
```

| Campo | Obligatorio | Descripción |
|---|---|---|
| `title` | Sí | Título de la tarea |
| `description` | No | Descripción (vacía por defecto) |
| `status` | No | `pendiente` (por defecto), `en_curso` o `hecha` |
| `assigned_to` | No | `id` de un usuario **que pertenezca al equipo**, o `null` |

Respuesta `201`:

```json
{
  "id": 7,
  "title": "Revisar memoria",
  "description": "Capítulo 1",
  "status": "pendiente",
  "team_id": 1,
  "assigned_to": 3,
  "created_at": "2026-11-10 10:00:00",
  "updated_at": "2026-11-10 10:00:00"
}
```

Al asignar una tarea (al crearla, o al editarla cambiando el asignado) se envía una notificación por email al usuario asignado. En desarrollo el envío es simulado: se escribe en la consola del servidor.

**Listar las tareas de un equipo**

`GET /api/teams/1/tasks` devuelve cada tarea con el nombre del equipo y del usuario asignado:

```json
[
  {
    "id": 1,
    "title": "Diseñar logo",
    "description": "Primera propuesta",
    "status": "pendiente",
    "assigned_to": 2,
    "assigned_name": "Ana",
    "team_name": "Equipo Alfa"
  }
]
```

**Estadísticas del equipo**

`GET /api/teams/1/stats`

```json
{
  "team_id": 1,
  "team_name": "Equipo Alfa",
  "total": 4,
  "por_estado": { "pendiente": 1, "en_curso": 1, "hecha": 2 }
}
```

## Seguridad

- Contraseñas cifradas con **bcrypt** (10 rondas).
- Sesión con **JWT** de caducidad limitada, con `id` y `role` del usuario (nunca la contraseña).
- **Autorización** por rol (`admin` / `miembro`) y por pertenencia al equipo.
- **Consultas parametrizadas** con Knex: sin concatenar valores en el SQL, para evitar la inyección SQL.
- **Validación** de todas las entradas con zod; el rol nunca se acepta desde el cliente.
- **Helmet** para las cabeceras HTTP de seguridad (y sin la cabecera `X-Powered-By`).
- **CORS** restringido a los orígenes de `CORS_ORIGIN`.
- **Límite de tamaño** del cuerpo de las peticiones: 10 KB.
- **Límite de intentos** en el login: 5 fallidos cada 15 minutos por IP (los logins correctos no cuentan).
- Los errores internos no se muestran al cliente.

## Pruebas

Las pruebas automatizadas con Jest y Supertest se añadirán en la Fase 6 y se ejecutarán con `npm test`.

Mientras tanto, hay un script que comprueba todas las rutas con casos correctos e incorrectos y verifica los códigos de respuesta. Necesita el servidor en marcha y la base recién sembrada. Como la última prueba bloquea el login, hay que reiniciar el servidor al terminar:

```bash
npm run seed
node scripts/check-api.js
```

## Estructura del proyecto

```
gestor-tareas/
├── backend/
│   ├── src/
│   │   ├── app.js            Define la aplicación (la importan los tests)
│   │   ├── server.js         Arranca el servidor
│   │   ├── config/           env.js y db.js
│   │   ├── routes/           auth, teams, tasks, stats y admin
│   │   ├── controllers/      Lógica de cada ruta
│   │   ├── services/         tasks.service.js y email.service.js
│   │   ├── middleware/       auth, roles, teamAccess, validate, rateLimit, logger y errorHandler
│   │   └── utils/            password.js y schemas.js
│   ├── migrations/           Tablas: users, teams, team_members y tasks
│   ├── seeds/                Datos de prueba
│   ├── scripts/              check-api.js
│   ├── tests/                (Fase 6)
│   ├── knexfile.js
│   ├── .env.example
│   └── package.json
└── README.md
```
