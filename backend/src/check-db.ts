import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const c = await prisma.candidate.findFirst({
    include: { domains: true }
  });
  console.log("Candidate:", c);

  const qs = await prisma.question.count();
  console.log("Questions count:", qs);
}

check().finally(() => prisma.$disconnect());
