BEGIN;

CREATE TABLE "park_growth_claims" (
    "parkId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "park_growth_claims_pkey" PRIMARY KEY ("parkId", "goalId"),
    CONSTRAINT "park_growth_claims_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "park_technology_research" (
    "parkId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completesAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "park_technology_research_pkey" PRIMARY KEY ("parkId", "technologyId", "level"),
    CONSTRAINT "park_technology_research_parkId_fkey" FOREIGN KEY ("parkId")
        REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

COMMIT;
