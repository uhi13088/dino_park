-- Experimental hybrid lineage, synthesis, archive and trading tables.
BEGIN;

-- AlterTable
ALTER TABLE "dinosaurs" ADD COLUMN     "hybridSpecies" JSONB;

-- CreateTable
CREATE TABLE "experimental_hybrid_lineages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentSpeciesIds" TEXT[],
    "focus" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "species" JSONB NOT NULL,
    "artworkWidth" INTEGER NOT NULL,
    "artwork" BYTEA,
    "artworkState" TEXT NOT NULL DEFAULT 'idle',
    "artworkAttempts" INTEGER NOT NULL DEFAULT 0,
    "artworkToken" TEXT,
    "artworkLease" TIMESTAMP(3),
    "discoveredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experimental_hybrid_lineages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experimental_hybrid_jobs" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "lineageId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "parentIds" TEXT[],
    "attempt" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "successChance" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "traits" JSONB,
    "debits" JSONB NOT NULL,
    "refunds" JSONB NOT NULL,
    "goldCost" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "resultDinosaurId" TEXT,

    CONSTRAINT "experimental_hybrid_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experimental_hybrid_recipes" (
    "parkId" TEXT NOT NULL,
    "lineageId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "learnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experimental_hybrid_recipes_pkey" PRIMARY KEY ("parkId","lineageId")
);

-- CreateTable
CREATE TABLE "experimental_hybrid_listings" (
    "id" TEXT NOT NULL,
    "sellerParkId" TEXT NOT NULL,
    "buyerParkId" TEXT,
    "lineageId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "activeSlot" TEXT,
    "price" INTEGER NOT NULL,
    "sellerPaidGold" INTEGER NOT NULL DEFAULT 0,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "experimental_hybrid_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_lineages_key_key" ON "experimental_hybrid_lineages"("key");

-- CreateIndex
CREATE INDEX "experimental_hybrid_lineages_artworkState_artworkLease_idx" ON "experimental_hybrid_lineages"("artworkState", "artworkLease");

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_jobs_activeSlot_key" ON "experimental_hybrid_jobs"("activeSlot");

-- CreateIndex
CREATE INDEX "experimental_hybrid_jobs_parkId_lineageId_sequence_idx" ON "experimental_hybrid_jobs"("parkId", "lineageId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_jobs_parkId_requestId_key" ON "experimental_hybrid_jobs"("parkId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_jobs_parkId_sequence_key" ON "experimental_hybrid_jobs"("parkId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_listings_activeSlot_key" ON "experimental_hybrid_listings"("activeSlot");

-- CreateIndex
CREATE INDEX "experimental_hybrid_listings_sellerParkId_lineageId_listedA_idx" ON "experimental_hybrid_listings"("sellerParkId", "lineageId", "listedAt");

-- CreateIndex
CREATE INDEX "experimental_hybrid_listings_soldAt_cancelledAt_listedAt_idx" ON "experimental_hybrid_listings"("soldAt", "cancelledAt", "listedAt");

-- CreateIndex
CREATE UNIQUE INDEX "experimental_hybrid_listings_sellerParkId_requestId_key" ON "experimental_hybrid_listings"("sellerParkId", "requestId");

-- AddForeignKey
ALTER TABLE "experimental_hybrid_jobs" ADD CONSTRAINT "experimental_hybrid_jobs_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_jobs" ADD CONSTRAINT "experimental_hybrid_jobs_lineageId_fkey" FOREIGN KEY ("lineageId") REFERENCES "experimental_hybrid_lineages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_recipes" ADD CONSTRAINT "experimental_hybrid_recipes_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_recipes" ADD CONSTRAINT "experimental_hybrid_recipes_lineageId_fkey" FOREIGN KEY ("lineageId") REFERENCES "experimental_hybrid_lineages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_listings" ADD CONSTRAINT "experimental_hybrid_listings_sellerParkId_fkey" FOREIGN KEY ("sellerParkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_listings" ADD CONSTRAINT "experimental_hybrid_listings_buyerParkId_fkey" FOREIGN KEY ("buyerParkId") REFERENCES "parks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_hybrid_listings" ADD CONSTRAINT "experimental_hybrid_listings_lineageId_fkey" FOREIGN KEY ("lineageId") REFERENCES "experimental_hybrid_lineages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
