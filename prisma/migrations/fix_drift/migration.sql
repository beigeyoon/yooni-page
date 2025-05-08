ALTER TABLE "post" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "comment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();