/**
 * Product backlog de ParkOne: fuente única de verdad.
 *
 * De este archivo salen los issues de GitHub, el tablero de GitHub Projects
 * (create-backlog.mjs) y el documento backlog.md para el documento de análisis.
 * Si una historia cambia, se cambia aquí y se vuelve a ejecutar el script.
 */

export const OWNER = 'theblasusblast-dev';
export const REPO = `${OWNER}/ParkOne`;
export const PROJECT_TITLE = 'ParkOne · Backlog';

export const PEOPLE = {
  sebastian: { name: 'Sebastián Felipe Marles Betancourt', login: 'theblasusblast-dev' },
  luis: { name: 'Luis Alejandro Gallego Herrera', login: 'ThecanonBlast' },
};

export const SPRINTS = {
  'Sprint 1': {
    start: '2026-11-21',
    end: '2026-11-23',
    goal: 'Base funcional: repositorio, modelo de datos y API completa documentada en Swagger.',
  },
  'Sprint 2': {
    start: '2026-11-24',
    end: '2026-11-26',
    goal: 'MVP demostrable: pantallas conectadas a la API y pruebas de las reglas de negocio.',
  },
  'Sprint 3': {
    start: '2026-11-27',
    end: '2026-11-29',
    goal: 'Entrega: empaquetado, documentos, manuales, release v1.0.0 y video.',
  },
};

/**
 * Campos de cada ítem:
 *   id, kind ('story' | 'task'), title, area, sprint, owner, points (Fibonacci),
 *   priority, branch, start, end, statement ("Como… quiero… para…"),
 *   criteria (4 a 8), success y errors (pruebas derivadas de los criterios),
 *   done (opcional: pull requests que lo cerraron).
 */
export const BACKLOG = [];

// ───────────────────────────── Sprint 1 ─────────────────────────────
BACKLOG.push(
  {
    id: 'T-01', kind: 'task', area: 'devops', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Configuración del repositorio y Gitflow',
    points: 2, priority: 'Alta', branch: 'feature/T-01-repository-setup',
    start: '2026-11-21', end: '2026-11-21',
    statement: 'Como equipo, queremos un repositorio con Gitflow configurado, para integrar el trabajo de forma ordenada y verificable.',
    criteria: [
      'Existen las ramas main y develop en GitHub.',
      'main y develop solo aceptan cambios por pull request con una aprobación.',
      'El repositorio incluye .gitignore, .gitattributes, .editorconfig y plantilla de pull request.',
      'El README describe el proyecto, el equipo, el stack y el flujo de trabajo.',
    ],
    success: ['Una rama feature integrada a develop por pull request aprobado aparece en el historial con su merge commit.'],
    errors: ['Un push directo a develop o a main es rechazado por la regla de protección.'],
    done: { prs: [1] },
  },
  {
    id: 'T-02', kind: 'task', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Base del backend con Express, Swagger y PostgreSQL en Docker',
    points: 3, priority: 'Alta', branch: 'feature/T-02-backend-foundation',
    start: '2026-11-21', end: '2026-11-22',
    statement: 'Como equipo de desarrollo, queremos una API base con documentación interactiva y base de datos local, para construir cada historia sobre una estructura común.',
    criteria: [
      'docker compose up -d levanta PostgreSQL 16 y el contenedor queda en estado healthy.',
      'npm run dev inicia la API en el puerto 4000.',
      'GET /api/health responde 200 con el estado del servicio.',
      'Swagger UI está disponible en /docs con el esquema ErrorResponse y el botón Authorize.',
      'Toda ruta inexistente responde 404 con el formato ErrorResponse.',
      'Si una variable de entorno falta o es inválida, la API no arranca y explica cuál.',
    ],
    success: [
      'GET /api/health responde 200 con status "ok".',
      'http://localhost:4000/docs muestra la sección Sistema y permite ejecutar el health con Try it out.',
    ],
    errors: [
      'GET /api/no-existe responde 404 con code NOT_FOUND.',
      'Con PORT=abc en backend/.env, la API no arranca y muestra "Variables de entorno inválidas".',
    ],
    done: { prs: [2, 3] },
  },
  {
    id: 'T-03', kind: 'task', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Modelo de datos, migración inicial y seed de prueba',
    points: 5, priority: 'Alta', branch: 'feature/T-03-data-model',
    start: '2026-11-22', end: '2026-11-22',
    statement: 'Como equipo de desarrollo, queremos el modelo de datos con sus restricciones en PostgreSQL, para garantizar las reglas críticas incluso con peticiones simultáneas.',
    criteria: [
      'La migración inicial crea las tablas de sedes, usuarios, espacios, tarifas, eventos, cobros y pagos.',
      'Los cobros tienen restricción única por placa, sede y día operativo (RN-04).',
      'La referencia de pago es única (idempotencia).',
      'Una placa ocupa como máximo un espacio por sede (anti-passback).',
      'El seed crea una sede de prueba con 12 espacios de carro, 8 de moto, 4 tarifas y 2 usuarios, y puede ejecutarse varias veces sin duplicar.',
      'GET /api/health informa el estado de la conexión con la base de datos.',
    ],
    success: [
      'npm run db:seed informa 20 espacios y 4 tarifas.',
      'GET /api/health responde "database": "up".',
    ],
    errors: [
      'Asignar la misma placa a dos espacios de la misma sede falla con violación de restricción única.',
      'Con la base de datos detenida, GET /api/health responde 503 con "database": "down".',
    ],
    done: { prs: [4] },
  },
  {
    id: 'T-04', kind: 'task', area: 'docs', sprint: 'Sprint 1', owner: 'luis',
    title: 'Product backlog y tablero Scrum',
    points: 3, priority: 'Alta', branch: 'feature/T-04-scrum-backlog',
    start: '2026-11-22', end: '2026-11-22',
    statement: 'Como Product Owner, quiero el backlog priorizado y estimado en un tablero, para planear los sprints y dejar trazabilidad de cada requisito.',
    criteria: [
      'Cada historia está escrita como "Como… quiero… para…" con 4 a 8 criterios de aceptación.',
      'Cada ítem tiene sprint, fechas, responsable, estimación Fibonacci, prioridad y rama asociada.',
      'Cada ítem tiene pruebas de éxito y de error derivadas de sus criterios.',
      'El tablero de GitHub Projects muestra el estado de cada ítem.',
      'Los ítems terminados enlazan el pull request que los cerró.',
    ],
    success: ['El tablero ParkOne · Backlog muestra todos los ítems agrupables por sprint y estado.'],
    errors: ['Ningún ítem del tablero queda sin estimación, rama o responsable.'],
  },
);

BACKLOG.push(
  {
    id: 'HU-01', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Inicio de sesión y control por roles',
    points: 3, priority: 'Alta', branch: 'feature/HU-01-auth-roles',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como usuario del sistema, quiero iniciar sesión con mi correo y contraseña, para acceder solo a las funciones de mi rol.',
    criteria: [
      'POST /api/auth/login con credenciales válidas devuelve un token JWT y los datos del usuario (nombre, rol y sede).',
      'Credenciales inválidas responden 401 sin indicar cuál de los dos datos falló.',
      'Un usuario desactivado no puede iniciar sesión.',
      'GET /api/auth/me devuelve el usuario dueño del token.',
      'Una ruta protegida sin token responde 401, y con un rol no permitido responde 403.',
      'Las contraseñas se guardan con hash bcrypt, nunca en texto plano.',
      'Los endpoints están documentados en Swagger y se prueban con el botón Authorize.',
    ],
    success: [
      'Login con admin@parkone.co / Admin123* responde 200 con token y rol ADMIN.',
      'GET /api/auth/me con ese token devuelve los datos del administrador.',
    ],
    errors: [
      'Login con contraseña incorrecta responde 401 INVALID_CREDENTIALS.',
      'Un empleado que llama una ruta de administración recibe 403 FORBIDDEN.',
    ],
  },
  {
    id: 'HU-02', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Creación de sedes con generación automática de espacios',
    points: 5, priority: 'Alta', branch: 'feature/HU-02-sites-spots',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como administrador, quiero crear sedes indicando cuántos espacios son de carro y cuántos de moto, para que el sistema arme su mapa automáticamente.',
    criteria: [
      'POST /api/sites recibe nombre, departamento, ciudad, número de espacios de carro y número de espacios de moto.',
      'Al crear la sede se generan los espacios C-01… y M-01… en estado libre.',
      'La sede nueva recibe franjas por defecto (06:00 y 18:00) y tarifas iniciales, con la moto en $0.',
      'El nombre de la sede es único; un nombre repetido responde 409.',
      'Se exigen números enteros no negativos y al menos un espacio en total.',
      'GET /api/sites lista las sedes con su capacidad y ocupación por tipo de vehículo.',
      'Solo el administrador puede crear sedes.',
    ],
    success: [
      'Crear "ParkOne Norte" con 10 espacios de carro y 6 de moto genera 16 espacios.',
      'GET /api/sites muestra la sede nueva con 10 + 6 espacios libres.',
    ],
    errors: [
      'Crear una sede con un nombre existente responde 409.',
      'Crear una sede con 0 espacios de carro y 0 de moto responde 400.',
      'Un empleado que intenta crear una sede recibe 403.',
    ],
  },
  {
    id: 'HU-03', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Gestión de empleados',
    points: 3, priority: 'Alta', branch: 'feature/HU-03-employees',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como administrador, quiero crear y gestionar empleados asignados a una sede, para controlar quién opera cada parqueadero.',
    criteria: [
      'POST /api/employees crea un empleado con nombre, correo, contraseña inicial y sede.',
      'El correo es único; un correo repetido responde 409.',
      'La contraseña inicial tiene mínimo 8 caracteres.',
      'GET /api/employees lista los empleados con su sede y estado.',
      'PATCH /api/employees/{id} permite cambiar la sede o activar y desactivar al empleado.',
      'Un empleado desactivado no puede iniciar sesión.',
      'Solo el administrador accede a estos endpoints.',
    ],
    success: [
      'Crear un empleado responde 201 y ese empleado puede iniciar sesión.',
      'Cambiar la sede de un empleado se refleja en GET /api/employees.',
    ],
    errors: [
      'Crear un empleado con un correo existente responde 409.',
      'Crear un empleado con una sede inexistente responde 404.',
      'Un empleado desactivado que intenta iniciar sesión recibe 401.',
    ],
  },
  {
    id: 'HU-04', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Tarifas y franjas horarias por sede',
    points: 5, priority: 'Alta', branch: 'feature/HU-04-rates-bands',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como administrador, quiero configurar las tarifas y franjas horarias de cada sede, para adaptar el negocio sin cambiar código.',
    criteria: [
      'GET /api/sites/{id}/rates muestra las tarifas vigentes por tipo de vehículo y franja.',
      'PUT /api/sites/{id}/rates rechaza una tarifa nocturna mayor o igual a la diurna para un tipo que cobra (RN-02); un tipo con ambas en $0 no cobra (RN-01).',
      'Cada cambio crea una versión nueva y cierra la anterior; los cobros existentes conservan su valor (RN-07).',
      'GET /api/sites/{id}/rates/history muestra el historial de versiones.',
      'PATCH /api/sites/{id}/bands cambia las horas de inicio diurna y nocturna en formato HH:MM.',
      'Se rechazan valores negativos o con decimales.',
      'Solo el administrador puede modificar tarifas y franjas.',
    ],
    success: [
      'Cambiar el carro a $9.000 diurno y $6.000 nocturno crea una versión nueva; un cobro anterior sigue en $8.000.',
      'El historial muestra la versión anterior cerrada y la nueva vigente.',
    ],
    errors: [
      'Carro con diurna $5.000 y nocturna $6.000 responde 400 RATE_RULE_VIOLATION.',
      'Una franja con hora "25:00" responde 400.',
      'Un empleado que intenta cambiar tarifas recibe 403.',
    ],
  },
);

BACKLOG.push(
  {
    id: 'HU-05', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Lectura y clasificación de placas',
    points: 5, priority: 'Alta', branch: 'feature/HU-05-plate-reading',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado del carril, quiero que el sistema interprete y clasifique cada lectura de placa, para que el vehículo entre sin intervención en el caso normal.',
    criteria: [
      'La placa se normaliza: mayúsculas, sin espacios ni guiones.',
      'Se corrigen confusiones según la posición: letras en las posiciones 1 a 3 y dígitos en la 4 y la 5 (0/O, 1/I, 8/B, 5/S, 2/Z).',
      'AAA123 se clasifica como carro; AAA12A y AAA12 como moto (F-02).',
      'Si el último carácter es ambiguo, decide la región: "COLOMBIA" indica moto y un municipio indica carro (S-08).',
      'Si el formato y la región se contradicen, la lectura pasa a validación del empleado.',
      'Una lectura con confianza menor al umbral se reintenta; tras 3 intentos sin éxito pasa al empleado.',
      'El umbral de confianza es configurable.',
    ],
    success: [
      '"abc 123" con región "MANIZALES" y confianza 0,95 se acepta como ABC123, carro.',
      '"ABC121" con región "COLOMBIA" se interpreta como ABC12I, moto.',
    ],
    errors: [
      '"ABC123" con región "COLOMBIA" pasa a validación manual por contradicción.',
      'Tres lecturas con confianza 0,40 pasan a validación manual.',
      '"12ABCD" se reporta como placa no reconocida.',
    ],
  },
  {
    id: 'HU-06', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Ingreso con asignación de espacio y generación del cobro',
    points: 8, priority: 'Alta', branch: 'feature/HU-06-entry-charge',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado, quiero que al ingresar un vehículo el sistema le asigne un espacio y genere su cobro, para que el ingreso sea rápido y correcto.',
    criteria: [
      'Se registra el evento de ingreso con fecha, hora, sede, placa, tipo y confianza (F-01).',
      'Se asigna el primer espacio libre del tipo del vehículo y queda ocupado.',
      'Si no hay espacios libres de ese tipo, se responde LLENO y la barrera no abre (F-07).',
      'Si la placa ya ocupa un espacio en la sede, se alerta anti-passback y no se registra el ingreso.',
      'El día operativo (06:00 a 05:59, hora de Bogotá) y la franja se calculan con la hora del primer ingreso (RN-05, S-02).',
      'Se genera un único cobro por placa, sede y día operativo con la tarifa vigente; un reingreso con pase vigente no genera cobro (RN-03, RN-04).',
      'Un vehículo con tarifa $0 (moto) no genera cobro (RN-01).',
      'La respuesta indica el espacio asignado, si la barrera abre y por qué.',
    ],
    success: [
      'Un carro que entra a las 08:00 recibe C-01 y un cobro diurno de $8.000 en estado pendiente.',
      'Una moto entra, recibe M-01 y no genera cobro.',
      'Un carro con pase vigente reingresa sin cobro nuevo.',
    ],
    errors: [
      'Con todos los espacios de carro ocupados, un carro recibe LLENO y la barrera no abre.',
      'Una placa que ya está adentro recibe alerta anti-passback.',
    ],
  },
  {
    id: 'HU-07', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Lectura manual y placa extranjera',
    points: 3, priority: 'Alta', branch: 'feature/HU-07-manual-reading',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado, quiero digitar o corregir la placa cuando el sistema no la reconoce, para no detener el carril.',
    criteria: [
      'El empleado puede confirmar o corregir la placa leída y su tipo de vehículo.',
      'Para una placa extranjera, el empleado digita la placa sin validar formato y elige el tipo manualmente.',
      'El evento queda marcado como lectura manual, y como extranjera si aplica, con el empleado que intervino (F-06).',
      'Después de la validación manual, el ingreso sigue el mismo flujo de cupo y cobro de HU-06.',
      'Solo un empleado de la sede puede registrar lecturas manuales.',
    ],
    success: [
      'La lectura "A8C123" corregida a ABC123 ingresa y queda marcada como manual.',
      'La placa extranjera "XYZ9876" como carro ingresa marcada como extranjera.',
    ],
    errors: [
      'Una placa vacía responde 400.',
      'Un empleado de otra sede recibe 403.',
    ],
  },
  {
    id: 'HU-08', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Pago en efectivo con pase vigente',
    points: 5, priority: 'Alta', branch: 'feature/HU-08-cash-payment',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado de caja, quiero registrar el pago en efectivo de un cobro, para que el vehículo pueda salir y reingresar sin pagar otra vez ese día.',
    criteria: [
      'Se puede consultar el cobro pendiente de una placa con su franja y valor.',
      'POST /api/charges/{id}/payments registra el pago en efectivo por el valor exacto del cobro.',
      'El cobro pasa a pagado y deja pase vigente hasta el fin del día operativo (RN-03).',
      'Repetir el pago con la misma referencia no lo duplica y devuelve el mismo resultado (idempotencia).',
      'No se puede pagar un cobro ya pagado con otra referencia, ni uno anulado o vencido.',
      'El pago registra el empleado que lo recibió.',
      'Al confirmarse el pago se notifica en tiempo real a la pantalla del carril.',
    ],
    success: [
      'Pagar $8.000 del cobro pendiente lo deja pagado.',
      'Repetir la misma solicitud con la misma referencia responde el mismo pago sin crear otro.',
    ],
    errors: [
      'Pagar un valor distinto al del cobro responde 400.',
      'Pagar un cobro ya pagado con otra referencia responde 409.',
    ],
  },
);

BACKLOG.push(
  {
    id: 'HU-09', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'sebastian',
    title: 'Salida y barrera en tiempo real',
    points: 5, priority: 'Alta', branch: 'feature/HU-09-exit-barrier',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como conductor, quiero que la barrera de salida abra cuando no tengo deudas, para salir sin filas.',
    criteria: [
      'La barrera de salida abre si el cobro del día está pagado o no existe (RN-06, F-05).',
      'Con un cobro pendiente la barrera no abre y la respuesta explica el motivo y el valor.',
      'Si el vehículo sigue adentro cuando empieza un nuevo día operativo, se genera el cobro diurno del nuevo día y no abre hasta pagarlo (S-05).',
      'Al salir se libera el espacio que ocupaba.',
      'Cada salida queda registrada como evento con su decisión.',
      'El estado de la barrera (abierta o cerrada y su motivo) se emite en tiempo real por Socket.IO.',
    ],
    success: [
      'Una moto sale, la barrera abre y M-01 queda libre.',
      'Un carro con el cobro pagado sale y la barrera abre.',
    ],
    errors: [
      'Un carro con cobro pendiente intenta salir: la barrera queda cerrada con "Cobro pendiente: $8.000".',
      'Una placa sin ingreso registrado en la sede recibe un error que lo explica.',
    ],
  },
  {
    id: 'HU-10', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Gestión de espacios de parqueo',
    points: 3, priority: 'Alta', branch: 'feature/HU-10-spot-management',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado, quiero habilitar e inhabilitar espacios indicando el motivo, para reflejar el estado real del parqueadero.',
    criteria: [
      'PATCH /api/spots/{id} inhabilita un espacio libre con un motivo obligatorio.',
      'No se puede inhabilitar un espacio ocupado.',
      'Un espacio inhabilitado se puede volver a habilitar.',
      'Los espacios inhabilitados no cuentan como cupo disponible.',
      'GET /api/sites/{id}/spots devuelve el mapa: código, tipo, estado, motivo y, si está ocupado, placa, tiempo de uso y cobro.',
      'El empleado solo gestiona espacios de su sede.',
      'Los cambios se emiten en tiempo real al mapa.',
    ],
    success: [
      'Inhabilitar C-05 con el motivo "Mantenimiento" lo deja inhabilitado.',
      'Habilitar C-05 lo deja libre de nuevo.',
    ],
    errors: [
      'Inhabilitar sin motivo responde 400.',
      'Inhabilitar un espacio ocupado responde 409.',
      'Un empleado que gestiona un espacio de otra sede recibe 403.',
    ],
  },
  {
    id: 'HU-11', kind: 'story', area: 'backend', sprint: 'Sprint 1', owner: 'luis',
    title: 'Consultas e historial con filtros',
    points: 3, priority: 'Media', branch: 'feature/HU-11-history-queries',
    start: '2026-11-22', end: '2026-11-23',
    statement: 'Como empleado, quiero consultar el historial de pagos, cobros e ingresos de mi sede con filtros, para resolver reclamos y revisar la operación.',
    criteria: [
      'GET /api/events lista ingresos y salidas con filtros por placa y rango de fecha y hora (F-09).',
      'GET /api/charges lista cobros con filtros por placa, fecha, estado y franja diurna o nocturna.',
      'GET /api/payments lista los pagos de la sede.',
      'Los resultados se ordenan del más reciente al más antiguo y se paginan.',
      'El empleado solo ve datos de su sede; el administrador puede elegir la sede.',
      'Fechas inválidas en los filtros responden 400.',
    ],
    success: [
      'Filtrar por la placa ABC123 muestra solo sus eventos.',
      'Filtrar cobros por estado pendiente muestra solo los pendientes.',
    ],
    errors: [
      'Una fecha "2026-13-40" en los filtros responde 400.',
      'Un empleado que pide datos de otra sede recibe 403.',
    ],
  },
);

// ───────────────────────────── Sprint 2 ─────────────────────────────
BACKLOG.push(
  {
    id: 'T-05', kind: 'task', area: 'frontend', sprint: 'Sprint 2', owner: 'sebastian',
    title: 'Base del frontend Angular',
    points: 3, priority: 'Alta', branch: 'feature/T-05-frontend-foundation',
    start: '2026-11-24', end: '2026-11-24',
    statement: 'Como equipo, queremos la aplicación Angular conectada a la API, para construir las pantallas sobre una base común.',
    criteria: [
      'El proyecto Angular 21 con SCSS vive en frontend/ y arranca en el puerto 4200.',
      'La URL de la API se configura en un solo lugar.',
      'Un interceptor adjunta el token a cada petición y cierra la sesión ante un 401.',
      'Las rutas están protegidas por rol.',
      'Existe un layout base con la identidad visual de ParkOne.',
    ],
    success: ['ng serve muestra el layout de ParkOne en http://localhost:4200.'],
    errors: ['Un empleado que abre una ruta de administración es redirigido.'],
  },
  {
    id: 'HU-12', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'luis',
    title: 'Pantalla de inicio de sesión',
    points: 2, priority: 'Alta', branch: 'feature/HU-12-login-screen',
    start: '2026-11-24', end: '2026-11-24',
    statement: 'Como usuario, quiero una pantalla de inicio de sesión, para entrar al panel que corresponde a mi rol.',
    criteria: [
      'El formulario pide correo y contraseña y valida que no estén vacíos.',
      'El administrador entra al panel de administración y el empleado al mapa de su sede.',
      'Con credenciales incorrectas se muestra el mensaje que envía la API.',
      'Cerrar sesión borra el token y vuelve a la pantalla de inicio.',
    ],
    success: ['El empleado de prueba inicia sesión y ve el mapa de ParkOne Centro.'],
    errors: ['Una contraseña incorrecta muestra "Correo o contraseña incorrectos".'],
  },
  {
    id: 'HU-13', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'sebastian',
    title: 'Pantalla de carril con cámara simulada y barrera',
    points: 5, priority: 'Alta', branch: 'feature/HU-13-lane-screen',
    start: '2026-11-24', end: '2026-11-25',
    statement: 'Como empleado, quiero una pantalla de carril con cámara simulada y barrera visual, para operar y demostrar ingresos y salidas sin hardware.',
    criteria: [
      'El simulador permite escribir placa y región, elegir la calidad de lectura (nítida, sucia o nocturna) y el sentido (entrada o salida).',
      'La pantalla de la barrera muestra "Reconociendo… intento n/3" durante hasta 10 segundos.',
      'Los estados abierta, cerrada por cobro pendiente, LLENO y lectura manual se distinguen de un vistazo.',
      'Al ingresar se muestra el espacio asignado, por ejemplo "Diríjase al espacio C-07".',
      'Si el reconocimiento falla se muestra "Llamando al empleado" y se abre el formulario de lectura manual.',
      'La pantalla se actualiza en tiempo real sin recargar.',
    ],
    success: ['Una lectura nítida de un carro abre la barrera y muestra su espacio.'],
    errors: [
      'Una lectura nocturna que falla 3 veces muestra "Llamando al empleado".',
      'Un carro con cobro pendiente en la salida muestra la barrera cerrada con el motivo.',
    ],
  },
);

BACKLOG.push(
  {
    id: 'HU-14', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'luis',
    title: 'Mapa de espacios en tiempo real',
    points: 5, priority: 'Alta', branch: 'feature/HU-14-spot-map',
    start: '2026-11-24', end: '2026-11-25',
    statement: 'Como empleado, quiero ver el mapa de espacios de mi sede, para saber de un vistazo qué está libre, ocupado o inhabilitado.',
    criteria: [
      'Los espacios de carro aparecen a la izquierda y los de moto a la derecha; en pantallas pequeñas se apilan.',
      'Un espacio libre es gris, uno ocupado es verde y uno inhabilitado es rojo.',
      'Al pasar el mouse, un espacio ocupado muestra placa, tipo, tiempo de uso y cobro, y uno inhabilitado muestra su motivo.',
      'La búsqueda por placa resalta el espacio que ocupa.',
      'Se puede filtrar por estado del espacio y por tipo de vehículo.',
      'Desde el mapa se puede inhabilitar o habilitar un espacio con su motivo.',
      'El mapa se actualiza en tiempo real.',
    ],
    success: ['Al ingresar un carro desde el carril, su espacio cambia a verde sin recargar.'],
    errors: ['Intentar inhabilitar un espacio ocupado muestra el mensaje de error de la API.'],
  },
  {
    id: 'HU-15', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'sebastian',
    title: 'Pantalla de caja',
    points: 3, priority: 'Alta', branch: 'feature/HU-15-cashier-screen',
    start: '2026-11-25', end: '2026-11-25',
    statement: 'Como empleado de caja, quiero buscar una placa y registrar su pago desde una pantalla, para cobrar en segundos.',
    criteria: [
      'La búsqueda por placa muestra el cobro pendiente con su franja y valor.',
      'Un botón registra el pago en efectivo después de una confirmación.',
      'Después de pagar se muestra el pase vigente hasta el fin del día operativo.',
      'Si la placa no tiene cobro pendiente se informa claramente.',
    ],
    success: ['Buscar ABC123 y pagar deja el cobro pagado y habilita la salida.'],
    errors: ['Buscar una placa sin cobro pendiente muestra "Sin cobros pendientes".'],
  },
  {
    id: 'HU-16', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'luis',
    title: 'Panel de administración',
    points: 5, priority: 'Alta', branch: 'feature/HU-16-admin-panel',
    start: '2026-11-25', end: '2026-11-26',
    statement: 'Como administrador, quiero gestionar sedes, empleados, tarifas y franjas desde pantallas, para configurar el sistema sin usar la API.',
    criteria: [
      'Se puede crear una sede con su número de espacios de carro y de moto, y ver la lista de sedes.',
      'Se puede crear, editar y activar o desactivar empleados.',
      'Se pueden editar tarifas y franjas; el error de RN-02 se muestra en el formulario.',
      'Se ve el historial de versiones de las tarifas.',
      'Solo el administrador accede al panel.',
    ],
    success: ['Crear una sede desde el panel la muestra en la lista con su mapa generado.'],
    errors: ['Guardar una tarifa nocturna mayor que la diurna muestra el error y no guarda.'],
  },
  {
    id: 'HU-17', kind: 'story', area: 'frontend', sprint: 'Sprint 2', owner: 'luis',
    title: 'Pantalla de historial',
    points: 3, priority: 'Media', branch: 'feature/HU-17-history-screen',
    start: '2026-11-26', end: '2026-11-26',
    statement: 'Como empleado, quiero ver el historial de pagos, cobros e ingresos con filtros, para revisar la operación de mi sede.',
    criteria: [
      'Una tabla muestra ingresos y salidas con filtros por placa y fecha y hora.',
      'Los cobros se filtran por estado y por franja diurna o nocturna.',
      'Se muestra el historial de pagos de la sede.',
      'Las lecturas manuales y las placas extranjeras se distinguen visualmente.',
      'Los resultados se paginan.',
    ],
    success: ['Filtrar por una placa muestra su ingreso, su cobro y su pago.'],
    errors: ['Un rango de fechas invertido muestra un aviso y no consulta.'],
  },
  {
    id: 'T-06', kind: 'task', area: 'backend', sprint: 'Sprint 2', owner: 'sebastian',
    title: 'Pruebas automatizadas de las reglas de negocio',
    points: 5, priority: 'Alta', branch: 'feature/T-06-unit-tests',
    start: '2026-11-25', end: '2026-11-26',
    statement: 'Como equipo, queremos pruebas automatizadas de las reglas de negocio, para demostrar que el sistema cobra correctamente.',
    criteria: [
      'Los 9 escenarios del documento de contexto están cubiertos por pruebas.',
      'Hay una prueba del rechazo de tarifa nocturna mayor o igual a la diurna (RN-02).',
      'Hay una prueba del intento de doble cobro (RN-04).',
      'Hay una prueba del pago repetido con la misma referencia (idempotencia).',
      'Hay pruebas de la clasificación de placas, incluidas las ambigüedades y la región.',
      'npm test ejecuta toda la suite.',
    ],
    success: ['npm test termina con todas las pruebas en verde.'],
    errors: ['Si se cambia a propósito el inicio del día operativo, falla la prueba del escenario 7.'],
  },
);

// ───────────────────────────── Sprint 3 ─────────────────────────────
BACKLOG.push(
  {
    id: 'T-07', kind: 'task', area: 'devops', sprint: 'Sprint 3', owner: 'sebastian',
    title: 'Empaquetado con Docker Compose y script SQL',
    points: 3, priority: 'Alta', branch: 'feature/T-07-packaging',
    start: '2026-11-27', end: '2026-11-27',
    statement: 'Como equipo, queremos que el MVP arranque completo con un solo comando, para entregarlo como ejecutable y demostrarlo en cualquier equipo.',
    criteria: [
      'docker compose up levanta base de datos, API y frontend.',
      'Existe un script SQL completo de creación de la base de datos y datos iniciales.',
      'Existe el ícono de la aplicación.',
      'El README permite ejecutar el MVP desde cero.',
    ],
    success: ['En un clon limpio, docker compose up deja la aplicación disponible en el navegador.'],
    errors: ['Sin el archivo .env, Docker se detiene indicando qué variable falta.'],
  },
  {
    id: 'T-08', kind: 'task', area: 'docs', sprint: 'Sprint 3', owner: 'luis',
    title: 'Documento de análisis',
    points: 5, priority: 'Alta', branch: 'feature/T-08-analysis-document',
    start: '2026-11-27', end: '2026-11-28',
    statement: 'Como equipo, queremos el documento de análisis completo, para cumplir la entrega académica.',
    criteria: [
      'Incluye definición del proyecto: introducción, oportunidad de negocio, visión y stakeholders.',
      'Incluye alcance, requisitos funcionales y no funcionales, restricciones y roles Scrum.',
      'Incluye diagramas de casos de uso (con tabla por iteración), de clases y entidad-relación, elaborados por el equipo.',
      'Incluye historias de usuario, mockups y enlaces al tablero, al repositorio y al video.',
      'Incluye técnica de estimación, tabla de iteraciones, script SQL y documentación de endpoints.',
      'Cumple portada institucional UAM y normas APA 7.',
    ],
    success: ['El documento cubre cada punto de la estructura exigida en el enunciado.'],
    errors: ['Un punto faltante en la revisión cruzada se registra y corrige antes de la entrega.'],
  },
  {
    id: 'T-09', kind: 'task', area: 'docs', sprint: 'Sprint 3', owner: 'luis',
    title: 'Manuales de instalación, administración y usuario',
    points: 5, priority: 'Alta', branch: 'feature/T-09-manuals',
    start: '2026-11-27', end: '2026-11-28',
    statement: 'Como equipo, queremos los tres manuales del sistema, para que el cliente pueda instalarlo, administrarlo y usarlo.',
    criteria: [
      'El manual de instalación incluye la tabla de herramientas con logo, versión exacta y enlace oficial.',
      'El manual de instalación explica la configuración del .env, los puertos y el despliegue de la base de datos.',
      'El manual de administración cubre roles, usuarios, respaldos y mantenimiento.',
      'El manual de usuario describe cada funcionalidad con capturas reales y preguntas frecuentes.',
      'Los tres se entregan como PDF independientes.',
    ],
    success: ['Siguiendo solo el manual de instalación, el sistema arranca en un equipo nuevo.'],
    errors: ['Una captura que no coincide con la versión final se reemplaza antes de la entrega.'],
  },
  {
    id: 'T-10', kind: 'task', area: 'docs', sprint: 'Sprint 3', owner: 'sebastian',
    title: 'Propuesta de infraestructura productiva',
    points: 3, priority: 'Alta', branch: 'feature/T-10-production-proposal',
    start: '2026-11-27', end: '2026-11-28',
    statement: 'Como equipo, queremos la propuesta de infraestructura para producción, para mostrar cómo operaría el sistema real.',
    criteria: [
      'Incluye el diagrama del entorno productivo, elaborado por el equipo.',
      'Incluye la tabla MVP frente a producción.',
      'Incluye la estrategia de escalabilidad de una a N sedes.',
      'Incluye los 10 pasos de despliegue exigidos.',
      'Incluye seguridad, Ley 1581 de 2012 y costo mensual para una y cinco sedes.',
    ],
    success: ['La propuesta responde cada punto de la sección de producción del enunciado.'],
    errors: ['Un costo sin fuente de la calculadora del proveedor se corrige antes de la entrega.'],
  },
  {
    id: 'T-11', kind: 'task', area: 'devops', sprint: 'Sprint 3', owner: 'sebastian',
    title: 'Release v1.0.0, video y entrega',
    points: 2, priority: 'Alta', branch: 'release/1.0.0',
    start: '2026-11-29', end: '2026-11-29',
    statement: 'Como equipo, queremos liberar la versión 1.0.0 y preparar la entrega, para sustentar el MVP.',
    criteria: [
      'La rama release/1.0.0 se fusiona en main con el tag v1.0.0.',
      'Los commits de ambos integrantes son visibles en contributors.',
      'Existe un video de 3 a 5 minutos con los escenarios de la demo.',
      'La carpeta de entrega comprimida tiene la estructura exigida.',
    ],
    success: ['main muestra el tag v1.0.0 y el MVP arranca desde ese tag.'],
    errors: ['Un commit posterior al tag queda fuera de la entrega y se documenta como hotfix.'],
  },
);
