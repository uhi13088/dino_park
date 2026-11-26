BEGIN;

CREATE TABLE IF NOT EXISTS "scouts" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scouts_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "scouts_parkId_slot_key" ON "scouts"("parkId", "slot");
ALTER TABLE "scouts" ADD COLUMN IF NOT EXISTS "experience" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "scout_assignments" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "spotId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "legacyMissionId" TEXT,
    "reward" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completesAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    CONSTRAINT "scout_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scout_assignments_scoutId_fkey" FOREIGN KEY ("scoutId")
        REFERENCES "scouts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "scout_assignments_activeSlot_key" ON "scout_assignments"("activeSlot");
ALTER TABLE "scout_assignments" ADD COLUMN IF NOT EXISTS "legacyMissionId" TEXT;
CREATE INDEX IF NOT EXISTS "scout_assignments_scoutId_missionId_claimedAt_idx"
    ON "scout_assignments"("scoutId", "missionId", "claimedAt");

COMMIT;
