import type { PrismaClient } from '@prisma/client';
import type { UserAccountRepository } from '../application/ports';
import type { UserAccount } from '../domain/user-account';

/** Adaptador de persistencia: busca usuarios en PostgreSQL con Prisma. */
export class PrismaUserAccountRepository implements UserAccountRepository {
  constructor(private readonly db: PrismaClient) {}

  findByEmail(email: string): Promise<UserAccount | null> {
    return this.findOne({ email });
  }

  findById(id: string): Promise<UserAccount | null> {
    return this.findOne({ id });
  }

  private async findOne(where: { email: string } | { id: string }): Promise<UserAccount | null> {
    const user = await this.db.user.findUnique({
      where,
      include: { site: { select: { id: true, name: true } } },
    });
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active,
      passwordHash: user.passwordHash,
      site: user.site,
    };
  }
}
