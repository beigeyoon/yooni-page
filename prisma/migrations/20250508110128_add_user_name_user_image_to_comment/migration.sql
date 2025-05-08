-- AlterTable
ALTER TABLE "comment" ADD COLUMN     "userImage" TEXT,
ADD COLUMN     "userName" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "post" ALTER COLUMN "id" DROP DEFAULT;
