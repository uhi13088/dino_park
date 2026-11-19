-- Additive upgrade for early driving and designated parent eggs.
BEGIN;

CREATE TYPE "DriveRunStatus" AS ENUM ('RUNNING', 'REWARD', 'FAILED', 'CLAIMED', 'ABANDONED');

CREATE TABLE "drive_runs" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "missionId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "sector" INTEGER NOT NULL DEFAULT 0,
    "x" INTEGER NOT NULL DEFAULT 500,
    "collected" INTEGER NOT NULL DEFAULT 0,
    "damage" INTEGER NOT NULL DEFAULT 0,
    "required" INTEGER NOT NULL,
    "status" "DriveRunStatus" NOT NULL DEFAULT 'RUNNING',
    "reward" JSONB NOT NULL,
    "sectorStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    CONSTRAINT "drive_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drive_runs_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "drive_runs_activeSlot_key" ON "drive_runs"("activeSlot");
CREATE INDEX "drive_runs_parkId_missionId_status_idx" ON "drive_runs"("parkId", "missionId", "status");

ALTER TABLE "hatching_queue" ADD COLUMN "sourceDriveId" TEXT;
CREATE UNIQUE INDEX "hatching_queue_sourceDriveId_key" ON "hatching_queue"("sourceDriveId");
ALTER TABLE "hatching_queue" ADD CONSTRAINT "hatching_queue_sourceDriveId_fkey"
    FOREIGN KEY ("sourceDriveId") REFERENCES "drive_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
