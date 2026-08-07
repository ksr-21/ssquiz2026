"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    const c = await prisma.candidate.findFirst({
        include: { domains: true }
    });
    if (!c) {
        console.log("No candidates found");
        return;
    }
    console.log("Found candidate", c.email);
    const domainIds = c.domains.map(d => d.domainId);
    const numDomains = domainIds.length;
    const questionsPerDomain = numDomains === 1 ? 30 : numDomains === 2 ? 15 : 10;
    console.log(`Candidate selected ${numDomains} domains. We need ${questionsPerDomain} questions per domain.`);
    let selectedQuestions = [];
    for (const domainId of domainIds) {
        const allDomainQs = await prisma.question.findMany({ where: { domainId } });
        selectedQuestions.push(...allDomainQs.slice(0, questionsPerDomain));
    }
    console.log("Selected questions count:", selectedQuestions.length);
    if (selectedQuestions.length > 0) {
        console.log("First question:", selectedQuestions[0]);
    }
}
test().finally(() => prisma.$disconnect());
