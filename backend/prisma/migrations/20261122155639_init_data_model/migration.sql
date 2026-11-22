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
