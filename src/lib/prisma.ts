import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

/* eslint-disable @typescript-eslint/no-explicit-any */
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;