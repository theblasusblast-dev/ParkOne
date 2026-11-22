import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { AppError } from '../../shared/app-error';
import { z } from '../../shared/zod';
import { ErrorResponseSchema } from '../openapi/common-schemas';

type ErrorBody = z.infer<typeof ErrorResponseSchema>['error'];

/**
 * Envía un error con la forma documentada en Swagger (ErrorResponse).
 * Usar el tipo del esquema garantiza que la respuesta real y la
 * documentación no se separen.
 */
function sendError(res: Response, status: number, error: ErrorBody): void {
  res.status(status).json({ error });
}

/** Cualquier ruta que no exista termina aquí con un 404 en formato estándar. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `No existe la ruta ${req.method} ${req.originalUrl}`));
};

/**
 * Convierte cualquier error en una respuesta JSON con la forma ErrorResponse.
 * Los errores esperados (AppError, validación, JSON mal formado) devuelven su
 * código; cualquier otro se registra en consola y responde 500 sin exponer
 * detalles internos.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.status, {
      code: err.code,
      message: err.message,
      ...(err.details === undefined ? {} : { details: err.details }),
    });
    return;
  }

  if (err instanceof z.ZodError) {
    sendError(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos.',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // P2002: PostgreSQL rechazó un valor repetido en una columna única. Pasa
  // cuando dos peticiones llegan al mismo tiempo y ambas superaron la
  // validación previa; la restricción de la base de datos es la última barrera.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    sendError(res, 409, {
      code: 'CONFLICT',
      message: 'Ya existe un registro con esos datos.',
    });
    return;
  }

  // express.json() marca así un cuerpo que no es JSON válido.
  if (err?.type === 'entity.parse.failed') {
    sendError(res, 400, {
      code: 'INVALID_JSON',
      message: 'El cuerpo de la solicitud no es un JSON válido.',
    });
    return;
  }

  console.error(err);
  sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error interno en el servidor.',
  });
};
