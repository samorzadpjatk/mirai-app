/*
  Warnings:

  - You are about to drop the `PushSubscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_userId_fkey";

-- DropTable
DROP TABLE "PushSubscription";

-- CreateTable
CREATE TABLE "MobilePushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilePushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobilePushSubscription_userId_token_key" ON "MobilePushSubscription"("userId", "token");

-- AddForeignKey
ALTER TABLE "MobilePushSubscription" ADD CONSTRAINT "MobilePushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
