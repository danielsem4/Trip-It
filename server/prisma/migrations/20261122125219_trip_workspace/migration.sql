-- CreateEnum
CREATE TYPE "TripSectionKind" AS ENUM ('ATTRACTIONS', 'RESTAURANTS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StayType" AS ENUM ('HOTEL', 'APARTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('TRAIN', 'BUS', 'CAR_RENTAL', 'TAXI', 'FERRY', 'TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "budgetAmount" DECIMAL(12,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ILS';

-- CreateTable
CREATE TABLE "TripSection" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "kind" "TripSectionKind" NOT NULL,
    "name" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "date" DATE,
    "time" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priceAmount" DECIMAL(12,2),
    "priceCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "airline" TEXT,
    "flightNumber" TEXT NOT NULL,
    "fromAirport" TEXT NOT NULL,
    "toAirport" TEXT NOT NULL,
    "departDate" DATE NOT NULL,
    "departTime" TEXT,
    "arriveDate" DATE,
    "arriveTime" TEXT,
    "terminal" TEXT,
    "confirmation" TEXT,
    "seat" TEXT,
    "notes" TEXT,
    "priceAmount" DECIMAL(12,2),
    "priceCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stay" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "type" "StayType" NOT NULL DEFAULT 'HOTEL',
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "checkInDate" DATE NOT NULL,
    "checkInTime" TEXT,
    "checkOutDate" DATE NOT NULL,
    "checkOutTime" TEXT,
    "confirmation" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "priceAmount" DECIMAL(12,2),
    "priceCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transport" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "type" "TransportType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "fromPlace" TEXT,
    "toPlace" TEXT,
    "date" DATE NOT NULL,
    "time" TEXT,
    "endDate" DATE,
    "endTime" TEXT,
    "provider" TEXT,
    "confirmation" TEXT,
    "notes" TEXT,
    "priceAmount" DECIMAL(12,2),
    "priceCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE,
    "notes" TEXT,
    "priceAmount" DECIMAL(12,2) NOT NULL,
    "priceCurrency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCurrencyRate" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DECIMAL(14,6) NOT NULL,

    CONSTRAINT "TripCurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripSection_tripId_idx" ON "TripSection"("tripId");

-- CreateIndex
CREATE INDEX "Place_sectionId_idx" ON "Place"("sectionId");

-- CreateIndex
CREATE INDEX "Flight_tripId_idx" ON "Flight"("tripId");

-- CreateIndex
CREATE INDEX "Stay_tripId_idx" ON "Stay"("tripId");

-- CreateIndex
CREATE INDEX "Transport_tripId_idx" ON "Transport"("tripId");

-- CreateIndex
CREATE INDEX "Expense_tripId_idx" ON "Expense"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripCurrencyRate_tripId_currency_key" ON "TripCurrencyRate"("tripId", "currency");

-- AddForeignKey
ALTER TABLE "TripSection" ADD CONSTRAINT "TripSection_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TripSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCurrencyRate" ADD CONSTRAINT "TripCurrencyRate_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every existing trip gets its two built-in place sections.
INSERT INTO "TripSection" ("tripId", "kind")
SELECT t."id", k."kind"
FROM "Trip" t
CROSS JOIN (VALUES ('ATTRACTIONS'::"TripSectionKind"), ('RESTAURANTS'::"TripSectionKind")) AS k("kind");
