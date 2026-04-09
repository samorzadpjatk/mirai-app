-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoPath" TEXT NOT NULL,
    "height" INTEGER,
    "offsetX" INTEGER,
    "offsetY" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSponsor" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSponsor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sponsor_isActive_idx" ON "Sponsor"("isActive");

-- CreateIndex
CREATE INDEX "Sponsor_createdAt_idx" ON "Sponsor"("createdAt");

-- CreateIndex
CREATE INDEX "TripSponsor_tripId_idx" ON "TripSponsor"("tripId");

-- CreateIndex
CREATE INDEX "TripSponsor_sponsorId_idx" ON "TripSponsor"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSponsor_tripId_sponsorId_key" ON "TripSponsor"("tripId", "sponsorId");

-- AddForeignKey
ALTER TABLE "TripSponsor" ADD CONSTRAINT "TripSponsor_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSponsor" ADD CONSTRAINT "TripSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
