"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const c = await prisma.candidate.findFirst({
        include: { domains: true }
    });
    console.log("Candidate:", c);
    const qs = await prisma.question.count();
    console.log("Questions count:", qs);
}
check().finally(() => prisma.$disconnect());
