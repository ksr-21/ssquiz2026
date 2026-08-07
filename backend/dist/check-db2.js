"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const c = await prisma.candidate.findFirst();
    if (c) {
        const session = await prisma.assessmentSession.findFirst({
            where: { candidateId: c.id },
            include: { answers: true }
        });
        console.log("Session:", session ? "Exists" : "None");
        if (session) {
            console.log("Answers count:", session.answers.length);
            console.log("Status:", session.status);
        }
    }
}
check().finally(() => prisma.$disconnect());
