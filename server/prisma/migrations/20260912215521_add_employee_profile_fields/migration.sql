-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "mustCompleteProfile" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;
