"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding Database...');
    // 1. Create Default Admin
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPassword,
            role: 'SUPER_ADMIN'
        }
    });
    console.log(`✅ Admin User created: ${admin.username} / admin123`);
    // 2. Create 5 Default Domains
    const defaultDomains = [
        'Media & Communication Team',
        'Event Management Team',
        'Marketing & PR Team',
        'Technical Team',
        'Creative Team'
    ];
    for (const domainName of defaultDomains) {
        await prisma.domain.upsert({
            where: { name: domainName },
            update: {},
            create: { name: domainName }
        });
    }
    console.log('✅ Default Domains created');
    console.log('Seeding Complete!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
