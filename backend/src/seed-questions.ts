import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dummy Questions...');

  const domains = await prisma.domain.findMany();

  for (const domain of domains) {
    console.log(`Adding questions for ${domain.name}...`);
    for (let i = 1; i <= 30; i++) {
      await prisma.question.create({
        data: {
          domainId: domain.id,
          text: `Sample Question ${i} for ${domain.name}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOption: Math.floor(Math.random() * 4),
          marks: 1
        }
      });
    }
  }

  console.log('Successfully seeded dummy questions!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
