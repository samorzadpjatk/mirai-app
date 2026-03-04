-- CreateTable
CREATE TABLE "TripResource" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "storagePath" TEXT,
    "fileName" TEXT,
    "iconName" TEXT,
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInsurance" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneDisplay" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "hospitalName" TEXT,
    "hospitalAddress" TEXT,
    "hospitalDistance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInsuranceStep" (
    "id" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "requiredInfo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exampleCall" TEXT,
    "additionalText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripInsuranceStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripResource_tripId_type_idx" ON "TripResource"("tripId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TripInsurance_tripId_key" ON "TripInsurance"("tripId");

-- CreateIndex
CREATE INDEX "TripInsuranceStep_insuranceId_stepNumber_idx" ON "TripInsuranceStep"("insuranceId", "stepNumber");

-- AddForeignKey
ALTER TABLE "TripResource" ADD CONSTRAINT "TripResource_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInsurance" ADD CONSTRAINT "TripInsurance_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInsuranceStep" ADD CONSTRAINT "TripInsuranceStep_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "TripInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
