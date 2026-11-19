-- Additive for parks that already played the first expedition.
BEGIN;

CREATE TABLE IF NOT EXISTS "first_synthesis_jobs" (
    "parkId" TEXT NOT NULL,
    "parentIds" TEXT[] NOT NULL,
    "labId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "resultDinosaurId" TEXT,
    "exhibitedAt" TIMESTAMP(3),
    CONSTRAINT "first_synthesis_jobs_pkey" PRIMARY KEY ("parkId"),
    CONSTRAINT "first_synthesis_jobs_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

COMMIT;
