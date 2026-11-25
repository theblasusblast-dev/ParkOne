-- =====================================================================
-- ParkOne · Script SQL completo (PostgreSQL 16)
-- Crea la base de datos del MVP y carga los datos iniciales.
--
-- Estructura: la misma que genera la migración de Prisma
--   (backend/prisma/migrations/20261122155639_init_data_model).
-- Datos: los mismos que carga backend/prisma/seed.ts.
--
-- Uso (sobre una base de datos vacía):
--   psql -U parkone -d parkone -f parkone.sql
--
-- Usuarios de prueba:
--   admin@parkone.co    / Admin123*     (administrador)
--   empleado@parkone.co / Empleado123*  (empleado de ParkOne Centro)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Estructura
-- ---------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE');

-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('FREE', 'OCCUPIED', 'DISABLED');

-- CreateEnum
CREATE TYPE "Band" AS ENUM ('DAY', 'NIGHT');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'VOIDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH');

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "dayBandStart" VARCHAR(5) NOT NULL DEFAULT '06:00',
    "nightBandStart" VARCHAR(5) NOT NULL DEFAULT '18:00',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "siteId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "status" "SpotStatus" NOT NULL DEFAULT 'FREE',
    "disabledReason" TEXT,
    "currentPlate" VARCHAR(10),
    "occupiedSince" TIMESTAMPTZ(3),

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rates" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "band" "Band" NOT NULL,
    "amountCop" INTEGER NOT NULL,
    "validFrom" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMPTZ(3),

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_events" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "plate" VARCHAR(10) NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "plateRegion" TEXT,
    "manualRead" BOOLEAN NOT NULL DEFAULT false,
    "foreignPlate" BOOLEAN NOT NULL DEFAULT false,
    "barrierOpened" BOOLEAN NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "spotId" UUID,
    "operatorId" UUID,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "plate" VARCHAR(10) NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "operatingDay" DATE NOT NULL,
    "band" "Band" NOT NULL,
    "rateId" UUID NOT NULL,
    "amountCop" INTEGER NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "voidReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "chargeId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "amountCop" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "receivedById" UUID NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_name_key" ON "sites"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "parking_spots_siteId_vehicleType_status_idx" ON "parking_spots"("siteId", "vehicleType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_siteId_code_key" ON "parking_spots"("siteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_siteId_currentPlate_key" ON "parking_spots"("siteId", "currentPlate");

-- CreateIndex
CREATE INDEX "rates_siteId_vehicleType_band_validFrom_idx" ON "rates"("siteId", "vehicleType", "band", "validFrom");

-- CreateIndex
CREATE INDEX "access_events_siteId_occurredAt_idx" ON "access_events"("siteId", "occurredAt");

-- CreateIndex
CREATE INDEX "access_events_plate_idx" ON "access_events"("plate");

-- CreateIndex
CREATE INDEX "charges_siteId_status_idx" ON "charges"("siteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "charges_plate_siteId_operatingDay_key" ON "charges"("plate", "siteId", "operatingDay");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rates" ADD CONSTRAINT "rates_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "parking_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 2. Datos iniciales
-- ---------------------------------------------------------------------

-- Sede de prueba (franjas por defecto: diurna 06:00, nocturna 18:00)
INSERT INTO "sites" ("id", "name", "department", "city") VALUES
  ('97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'ParkOne Centro', 'Caldas', 'Manizales');

-- 12 espacios de carro (C-01 a C-12) y 8 de moto (M-01 a M-08), todos libres
INSERT INTO "parking_spots" ("id", "siteId", "code", "vehicleType") VALUES
  ('f4ff3983-611a-42ea-b80c-1ca7d49fe24e', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-01', 'CAR'),
  ('3e161912-3972-4bf6-858f-33d415c61067', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-02', 'CAR'),
  ('4952b5c6-14b8-493f-954d-67bc2388b402', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-03', 'CAR'),
  ('ec087b4a-42b7-4c8e-bf2d-948e0964f5ff', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-04', 'CAR'),
  ('dc037941-ef0d-4d64-915c-b5214d9fb2f7', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-05', 'CAR'),
  ('9c260777-461c-4f25-9dc3-e0050c59026f', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-06', 'CAR'),
  ('f9431c25-b244-4f75-959c-a50b466f4f2e', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-07', 'CAR'),
  ('0a42d075-eebe-409e-b09d-b4d54315bfef', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-08', 'CAR'),
  ('8309b95a-001e-4e45-b52f-07408f4fd6fe', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-09', 'CAR'),
  ('8886d6c0-5526-41c9-9538-fab8b2c32a32', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-10', 'CAR'),
  ('4212450b-7b65-4694-8df4-2fe94e8722a1', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-11', 'CAR'),
  ('ea32f2a1-1262-4e04-9e17-bb3381d23e56', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'C-12', 'CAR'),
  ('3456f8c9-33cc-434c-abb8-efe3cb730f31', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-01', 'MOTORCYCLE'),
  ('6be743f4-d972-477d-98f9-5c24fee06f22', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-02', 'MOTORCYCLE'),
  ('f327752f-2cad-4536-b4b4-fb31a97ff4c6', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-03', 'MOTORCYCLE'),
  ('3172b373-c8d6-41d0-bd82-fdb79e4c94d0', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-04', 'MOTORCYCLE'),
  ('69bc8316-3020-4975-9d89-25615fe76ef0', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-05', 'MOTORCYCLE'),
  ('0fcc183e-3ddb-4794-9a04-c5e010710fa9', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-06', 'MOTORCYCLE'),
  ('a37db2ea-cc15-4743-9770-14b23e5aab00', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-07', 'MOTORCYCLE'),
  ('1818eb3f-5f88-45e4-bb7a-480198e64d9c', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'M-08', 'MOTORCYCLE');

-- Tarifas iniciales: la nocturna menor que la diurna (RN-02); la moto en $0 (RN-01)
INSERT INTO "rates" ("id", "siteId", "vehicleType", "band", "amountCop") VALUES
  ('33ab682a-61e4-4628-bc39-5f1e377dfb59', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'CAR', 'DAY', 8000),
  ('5f9a364c-1d6a-429b-91dd-274cd8f6f8dd', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'CAR', 'NIGHT', 5000),
  ('2b405602-b561-4e33-afde-fe303e7dab2b', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'MOTORCYCLE', 'DAY', 0),
  ('354040af-bd60-4785-b2f1-45dfc0b4b59a', '97ff0eb0-d8f6-4323-b62a-4938594ffc26', 'MOTORCYCLE', 'NIGHT', 0);

-- Usuarios (contraseñas guardadas con bcrypt, nunca en texto plano)
INSERT INTO "users" ("id", "fullName", "email", "passwordHash", "role", "siteId") VALUES
  ('2b08962a-8b3f-4571-aeac-cdf77a4dd731', 'Administrador ParkOne', 'admin@parkone.co', '$2b$10$LRlOfETjc4.sCbTfGcFzhO3OvGlZtud3vl2kydXD3MxvWkgEy4Ad.', 'ADMIN', NULL),
  ('b09f33fc-2758-455f-9f17-8058c397cd87', 'Empleado Centro', 'empleado@parkone.co', '$2b$10$HCZnQnxldjqNbXEa7q0u/Owd3g1xKli4BWo4ncJXn4PqhRRe9IxW2', 'EMPLOYEE', '97ff0eb0-d8f6-4323-b62a-4938594ffc26');

COMMIT;
