-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isSharingLocation" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_LocationSharingUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationSharingUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LocationSharingUsers_B_index" ON "_LocationSharingUsers"("B");

-- AddForeignKey
ALTER TABLE "_LocationSharingUsers" ADD CONSTRAINT "_LocationSharingUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationSharingUsers" ADD CONSTRAINT "_LocationSharingUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
