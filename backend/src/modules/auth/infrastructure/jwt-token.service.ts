import jwt from 'jsonwebtoken';
import { ROLES } from '../../../shared/domain/role';
import { z } from '../../../shared/zod';
import type { IssuedToken, SessionClaims, TokenService } from '../application/ports';

/** Forma esperada del contenido de un token; cualquier otra cosa se rechaza. */
const TokenContentSchema = z.object({
  sub: z.string(),
  role: z.enum(ROLES),
  siteId: z.string().nullable(),
});

/**
 * Tokens JWT firmados con HS256. Un JWT es un texto firmado que el cliente
 * envía en cada petición; la firma demuestra que lo emitió esta API y que
 * nadie lo modificó.
 */
export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  issue(claims: SessionClaims): IssuedToken {
    const token = jwt.sign({ role: claims.role, siteId: claims.siteId }, this.secret, {
      subject: claims.userId,
      expiresIn: this.expiresInSeconds,
      algorithm: 'HS256',
    });
    return { token, expiresInSeconds: this.expiresInSeconds };
  }

  read(token: string): SessionClaims | null {
    try {
      const content = TokenContentSchema.parse(jwt.verify(token, this.secret, { algorithms: ['HS256'] }));
      return { userId: content.sub, role: content.role, siteId: content.siteId };
    } catch {
      // Firma inválida, token expirado o contenido inesperado: no hay sesión.
      return null;
    }
  }
}
