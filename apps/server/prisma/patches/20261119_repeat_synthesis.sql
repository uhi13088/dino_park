-- Repeat synthesis job history also owns each park's active synthesis slot.
BEGIN;

CREATE TABLE "repeat_synthesis_jobs" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "focus" TEXT NOT NULL,
    "parentIds" TEXT[] NOT NULL,
    "sequence" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL,
    "successChance" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "traits" JSONB,
    "refunds" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "resultDinosaurId" TEXT,
    CONSTRAINT "repeat_synthesis_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "repeat_synthesis_jobs_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "repeat_synthesis_jobs_activeSlot_key" ON "repeat_synthesis_jobs"("activeSlot");
CREATE UNIQUE INDEX "repeat_synthesis_jobs_parkId_requestId_key" ON "repeat_synthesis_jobs"("parkId", "requestId");
CREATE UNIQUE INDEX "repeat_synthesis_jobs_parkId_sequence_key" ON "repeat_synthesis_jobs"("parkId", "sequence");

COMMIT;
