import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// 📝 QUESTIONS TEMPLATE
// Fill this array with your real questions!
// ==========================================
const realQuestions = [
  {
    domainName: "Media & Communication Team",
    questions: [
      {
        text: "Which of the following is the most important element of a press release?",
        options: [
          "A catchy headline",
          "A long, detailed history of the company",
          "The CEO's personal background",
          "Complex industry jargon"
        ],
        correctOption: 0, // 0 = first option, 1 = second option, etc.
        marks: 5
      }
      // Add more questions here...
    ]
  },
  {
    domainName: "Technical Team",
    questions: [
      {
        text: "What does 'React' use to increase performance and efficiently update the UI?",
        options: [
          "Real DOM",
          "Virtual DOM",
          "Shadow DOM",
          "Document Object Model"
        ],
        correctOption: 1, // 1 = Virtual DOM
        marks: 5
      }
      // Add more questions here...
    ]
  }
];

async function main() {
  console.log('🌱 Starting to seed questions...');

  // Optional: Clear existing questions before adding new ones
  // await prisma.question.deleteMany(); 
  // console.log('Cleared old questions.');

  for (const group of realQuestions) {
    // 1. Find the Domain ID based on the Name
    const domain = await prisma.domain.findUnique({
      where: { name: group.domainName }
    });

    if (!domain) {
      console.error(`⚠️ Domain not found: ${group.domainName}. Make sure it exactly matches the database!`);
      continue;
    }

    // 2. Map JSON to Prisma format
    const formattedQuestions = group.questions.map(q => ({
      domainId: domain.id,
      text: q.text,
      options: q.options,
      correctOption: q.correctOption,
      marks: q.marks
    }));

    // 3. Bulk Insert
    await prisma.question.createMany({
      data: formattedQuestions
    });
    
    console.log(`✅ Successfully added ${formattedQuestions.length} questions for ${group.domainName}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
