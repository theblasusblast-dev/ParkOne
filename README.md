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

## Cómo ejecutar (desarrollo)

Requisitos: Node.js 20.19 o superior, Docker Desktop abierto.

1. Variables de entorno: copiar los archivos de ejemplo.

   ```
   copy .env.example .env
   copy backend\.env.example backend\.env
   ```

2. Base de datos (PostgreSQL 16 en Docker):

   ```
   docker compose up -d
   ```

3. API (en otra terminal):

   ```
   cd backend
   npm install
   npm run dev
   ```

La API queda en `http://localhost:4000` y la documentación interactiva (Swagger) en `http://localhost:4000/docs`.

## Estado

En construcción: base del backend lista; los módulos de negocio se agregan historia por historia.
