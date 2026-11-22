import type { Request, RequestHandler } from 'express';
import { AppError } from '../../../../shared/app-error';
import type { Role } from '../../../../shared/domain/role';
import type { GetCurrentUserUseCase } from '../../application/get-current-user.use-case';
import type { TokenService } from '../../application/ports';
import { toPublicProfile, type PublicProfile } from '../../domain/user-account';

// Agrega a la petición de Express el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      currentUser?: PublicProfile;
    }
  }
}

const authRequired = () =>
  new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión para usar este recurso.');

export interface AuthGuards {
  /** Exige un token válido y deja el usuario en req.currentUser. */
  authenticate: RequestHandler;
  /** Exige que el usuario tenga uno de los roles indicados. Va después de authenticate. */
  allow: (...roles: Role[]) => RequestHandler;
}

/**
 * Guardias que los demás módulos ponen delante de sus rutas, por ejemplo:
 *   router.post('/', guards.authenticate, guards.allow('ADMIN'), handler)
 */
export function createAuthGuards(tokens: TokenService, currentUser: GetCurrentUserUseCase): AuthGuards {
  const authenticate: RequestHandler = async (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw authRequired();

    const claims = tokens.read(token);
    if (!claims) {
      throw new AppError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión de nuevo.');
    }

    req.currentUser = toPublicProfile(await currentUser.execute(claims.userId));
    next();
  };

  const allow =
    (...roles: Role[]): RequestHandler =>
    (req, _res, next) => {
      const user = currentUserOf(req);
      if (!roles.includes(user.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Tu rol no tiene permiso para realizar esta acción.');
      }
      next();
    };

  return { authenticate, allow };
}

/** Usuario autenticado de la petición. Solo se usa en rutas protegidas. */
export function currentUserOf(req: Request): PublicProfile {
  if (!req.currentUser) throw authRequired();
  return req.currentUser;
}
