"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting to parse and seed CSV...');
    const csvPath = path_1.default.resolve(__dirname, '../../Questions_Template.csv');
    if (!fs_1.default.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        process.exit(1);
    }
    const rawData = fs_1.default.readFileSync(csvPath, 'utf-8');
    const lines = rawData.split('\n').filter(line => line.trim().length > 0);
    // Skip the header row
    const dataLines = lines.slice(1);
    // Clean old questions so we get a fresh slate without duplicates
    await prisma.question.deleteMany();
    console.log('Cleared old questions.');
    let successCount = 0;
    let failCount = 0;
    for (const rawLine of dataLines) {
        let cleanLine = rawLine.trim();
        // Some CSV programs wrap the whole line in a string and append commas: "Domain,Q,A,B,C,D,Ans,Marks",,,,,
        if (cleanLine.startsWith('"') && cleanLine.includes('",,')) {
            cleanLine = cleanLine.substring(1, cleanLine.lastIndexOf('"'));
        }
        const parts = cleanLine.split(',');
        if (parts.length < 8) {
            console.warn(`Skipping invalid row: ${cleanLine}`);
            failCount++;
            continue;
        }
        let domainName = parts[0].trim();
        if (domainName === 'Marketing and PR Team') {
            domainName = 'Marketing & PR Team';
        }
        const text = parts[1].trim();
        const options = [parts[2].trim(), parts[3].trim(), parts[4].trim(), parts[5].trim()];
        // Correct Option mapping (A->0, B->1, C->2, D->3)
        const ansLetter = parts[6].trim().toUpperCase();
        let correctOption = 0;
        if (ansLetter === 'A')
            correctOption = 0;
        else if (ansLetter === 'B')
            correctOption = 1;
        else if (ansLetter === 'C')
            correctOption = 2;
        else if (ansLetter === 'D')
            correctOption = 3;
        const marks = parseInt(parts[7].trim(), 10) || 1;
        try {
            const domain = await prisma.domain.findUnique({
                where: { name: domainName }
            });
            if (!domain) {
                console.warn(`⚠️ Domain not found: ${domainName}. Skipping question...`);
                failCount++;
                continue;
            }
            await prisma.question.create({
                data: {
                    domainId: domain.id,
                    text,
                    options,
                    correctOption,
                    marks
                }
            });
            successCount++;
        }
        catch (err) {
            console.error(`Failed to insert question: ${text}`, err);
            failCount++;
        }
    }
    console.log(`🎉 Seeding completed! Successfully inserted: ${successCount}. Failed: ${failCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
