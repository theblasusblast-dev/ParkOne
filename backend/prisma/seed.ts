/**
 * Datos iniciales para desarrollo y para la demo.
 *
 * Se puede ejecutar varias veces sin duplicar nada: busca por campos únicos
 * (nombre de sede, código de espacio, correo) antes de crear.
 *
 * Usuarios de prueba:
 *   admin@parkone.co     / Admin123*     (administrador)
 *   empleado@parkone.co  / Empleado123*  (empleado de ParkOne Centro)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_RATES } from '../src/modules/rates/domain/default-rates';
import { buildSpotLayout } from '../src/modules/sites/domain/spot-layout';

const prisma = new PrismaClient();

const DEMO_SITE = {
  name: 'ParkOne Centro',
  department: 'Caldas',
  city: 'Manizales',
  carSpots: 12,
  motorcycleSpots: 8,
};

async function main(): Promise<void> {
  const site = await prisma.site.upsert({
    where: { name: DEMO_SITE.name },
    update: {},
    create: { name: DEMO_SITE.name, department: DEMO_SITE.department, city: DEMO_SITE.city },
  });

  const spots = buildSpotLayout(DEMO_SITE.carSpots, DEMO_SITE.motorcycleSpots);
  await prisma.parkingSpot.createMany({
    data: spots.map((spot) => ({ ...spot, siteId: site.id })),
    skipDuplicates: true,
  });

  const existingRates = await prisma.rate.count({ where: { siteId: site.id } });
  if (existingRates === 0) {
    await prisma.rate.createMany({
      data: DEFAULT_RATES.map((rate) => ({ ...rate, siteId: site.id })),
    });
  }

  const [adminHash, employeeHash] = await Promise.all([
    bcrypt.hash('Admin123*', 10),
    bcrypt.hash('Empleado123*', 10),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@parkone.co' },
    update: {},
    create: {
      fullName: 'Administrador ParkOne',
      email: 'admin@parkone.co',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'empleado@parkone.co' },
    update: {},
    create: {
      fullName: 'Empleado Centro',
      email: 'empleado@parkone.co',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      siteId: site.id,
    },
  });

  const [spotCount, rateCount, userCount] = await Promise.all([
    prisma.parkingSpot.count({ where: { siteId: site.id } }),
    prisma.rate.count({ where: { siteId: site.id } }),
    prisma.user.count(),
  ]);

  console.log(`Sede "${site.name}": ${spotCount} espacios, ${rateCount} tarifas.`);
  console.log(`Usuarios en el sistema: ${userCount}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
