-- CreateTable
CREATE TABLE "thought" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thought_pkey" PRIMARY KEY ("id")
);
