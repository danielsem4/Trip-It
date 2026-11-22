-- AlterTable
ALTER TABLE "GeocodeCache" ADD COLUMN     "tags" JSONB;

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "photoCheckedAt" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT;
