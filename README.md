# ParkOne

Sistema de parqueadero con reconocimiento de placas (LPR) para una red de sedes. Cada sede tiene un mapa visual de sus espacios de carro y de moto. Al llegar un vehículo, el sistema lee la placa, la clasifica, le asigna un espacio, genera el cobro según las reglas de negocio y controla una barrera simulada en tiempo real.

Proyecto académico de Ingeniería de Software II, UAM.

## Equipo

| Integrante                         | Rol Scrum                  |
| ---------------------------------- | -------------------------- |
| Sebastián Felipe Marles Betancourt | Scrum Master · Desarrollo  |
| Luis Alejandro Gallego Herrera     | Product Owner · Desarrollo |

## Roles del sistema

| Rol           | Responsabilidades                                                                    |
| ------------- | ------------------------------------------------------------------------------------ |
| Administrador | Crea sedes y sus espacios, gestiona empleados, configura tarifas y franjas horarias. |
| Empleado      | Opera una sede: mapa de espacios, pagos en efectivo, lecturas manuales e historial.  |

## Stack

| Capa                    | Tecnología                        |
| ----------------------- | --------------------------------- |
| Backend                 | Node.js 20, TypeScript, Express 5 |
| Base de datos           | PostgreSQL 16, Prisma             |
| Documentación de la API | OpenAPI con Swagger UI            |
| Tiempo real             | Socket.IO                         |
| Frontend                | Angular 21, SCSS                  |
| Ejecución               | Docker Compose                    |

## Estructura del repositorio

```
backend/    API REST
frontend/   Aplicación web
database/   Script SQL completo (estructura y datos iniciales)
docs/       Documentación técnica y académica
```

## Flujo de trabajo (Gitflow)

- `main`: solo versiones liberadas, con tag.
- `develop`: integración del trabajo terminado.
- `feature/<id-historia>-<descripcion>`: una rama por historia; sale de `develop` y vuelve por pull request con la aprobación del otro integrante.
- `release/x.y.z` y `hotfix/x.y.z`: preparación de versiones y correcciones urgentes.

Ningún cambio entra directo a `main` ni a `develop`.

## Convenciones

- Código, nombres de ramas y alcance de los commits en inglés; interfaz y documentación en español.
- Commits con Conventional Commits y la historia al final, por ejemplo `feat(billing): genera cobro nocturno (HU-06)`.

## Cómo ejecutar

### Opción 1: todo con Docker (entrega y demo)

Requisito: Docker Desktop abierto.

```
copy .env.example .env
docker compose up -d --build
```

Antes del segundo comando, cambia `JWT_SECRET` en `.env` por un texto aleatorio de al menos 32 caracteres. La primera vez tarda unos minutos mientras construye las imágenes.

| Servicio | Dirección |
| --- | --- |
| Aplicación web | http://localhost:8080 |
| API y Swagger | http://localhost:4000/docs |
| PostgreSQL | localhost:5433 |

Al arrancar, la API aplica las migraciones y carga los datos iniciales. Para detener todo: `docker compose down`. Para borrar también los datos: `docker compose down -v`.

### Opción 2: desarrollo

Requisitos: Node.js 20.19 o superior y Docker Desktop abierto.

1. Variables de entorno:

   ```
   copy .env.example .env
   copy backend\.env.example backend\.env
   ```

2. Solo la base de datos en Docker:

   ```
   docker compose up -d db
   ```

3. API (terminal 2):

   ```
   cd backend
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. Frontend (terminal 3):

   ```
   cd frontend
   npm install
   npx ng serve
   ```

La aplicación queda en http://localhost:4200 y la API en http://localhost:4000/docs. No uses las dos opciones a la vez: ambas usan el puerto 4000.

### Script SQL

`database/parkone.sql` crea toda la base de datos (tablas, restricciones e índices) y carga los mismos datos iniciales, sin necesidad de Prisma:

```
docker exec -i parkone-db psql -U parkone -d parkone < database\parkone.sql
```

Se ejecuta sobre una base de datos vacía.

## Usuarios de prueba

Los crea `npm run db:seed`:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@parkone.co | Admin123* |
| Empleado (ParkOne Centro) | empleado@parkone.co | Empleado123* |

## Comandos útiles de la base de datos

| Comando (en `backend/`) | Qué hace |
| --- | --- |
| `npm run db:migrate` | Aplica las migraciones pendientes y regenera el cliente de Prisma. |
| `npm run db:seed` | Carga los datos de prueba. Se puede repetir sin duplicar nada. |
| `npm run db:studio` | Abre Prisma Studio en el navegador para ver y editar los registros. |
| `npm run db:reset` | Borra todos los datos y deja la base como recién instalada (útil antes de la demo). |

## Pruebas automatizadas

En `backend/`:

```
npm test
```

Ejecuta 27 pruebas sin base de datos (repositorios en memoria y reloj simulado): los 9 escenarios del documento de contexto, RN-02, RN-04, idempotencia del pago, cupos, anti-passback, clasificación de placas y calendario operativo.

## Estado

Versión 1.0.0 en preparación: todas las funcionalidades obligatorias (F-01 a F-10) están implementadas.
