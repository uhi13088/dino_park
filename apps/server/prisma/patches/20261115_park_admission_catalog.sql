-- Add park admission state, construction timers, and collection records to the pre-PLAY-04 schema.
BEGIN;

ALTER TABLE "parks"
    ADD COLUMN IF NOT EXISTS "isOpen" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "admissionCareCompleted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "economySettledAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "onlineUntil" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "visitorRemainder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "maintenanceRemainder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "totalVisitors" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "totalAdmissionGold" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "firstVisitorsRewarded" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "completesAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "dinosaur_collections" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "firstCollectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dinosaur_collections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dinosaur_collections_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "dinosaur_collections_parkId_speciesId_key"
    ON "dinosaur_collections"("parkId", "speciesId");

COMMIT;
