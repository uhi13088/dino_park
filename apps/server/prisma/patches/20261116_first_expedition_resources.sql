-- Additive local upgrade from the pre-PLAY-04 schema. Apply once; schema.prisma remains canonical.
BEGIN;

-- AlterTable
ALTER TABLE "explorations" ADD COLUMN     "missionId" TEXT,
ADD COLUMN     "missionStep" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "hatching_queue" ADD COLUMN     "claimedDinosaurId" TEXT,
ADD COLUMN     "readyToStart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceExplorationId" TEXT;

-- CreateTable
CREATE TABLE "resource_inventory" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_jobs" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "material" TEXT NOT NULL,
    "lots" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costGold" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "production_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_inventory_parkId_material_quality_key" ON "resource_inventory"("parkId", "material", "quality");

-- CreateIndex
CREATE UNIQUE INDEX "production_jobs_activeSlot_key" ON "production_jobs"("activeSlot");

-- CreateIndex
CREATE INDEX "production_jobs_parkId_buildingId_idx" ON "production_jobs"("parkId", "buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "explorations_userId_missionId_key" ON "explorations"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "hatching_queue_sourceExplorationId_key" ON "hatching_queue"("sourceExplorationId");

-- AddForeignKey
ALTER TABLE "resource_inventory" ADD CONSTRAINT "resource_inventory_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
