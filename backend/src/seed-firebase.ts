import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

// Initialize Firebase Admin SDK
// Set FIREBASE_SERVICE_ACCOUNT_BASE64 env var or place serviceAccount.json in backend root
function initializeFirebase() {
  if (admin.apps.length > 0) return admin.app();

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  // Try loading from file
  const saPath = path.join(__dirname, '..', 'serviceAccount.json');
  if (fs.existsSync(saPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  console.error('ERROR: No Firebase credentials found!');
  console.error('Either set FIREBASE_SERVICE_ACCOUNT_BASE64 env var or place serviceAccount.json in backend/');
  process.exit(1);
}

const app = initializeFirebase();
const db = admin.firestore(app);

// Domain name mapping (CSV uses slightly different names)
const DOMAIN_MAP: Record<string, string> = {
  'Technical Team': 'Technical Team',
  'Creative Team': 'Creative Team',
  'Event Management Team': 'Event Management Team',
  'Marketing and PR Team': 'Marketing & PR Team',
  'Marketing & PR Team': 'Marketing & PR Team',
  'Media and Communication Team': 'Media & Communication Team',
  'Media & Communication Team': 'Media & Communication Team',
};

async function seedFirebase() {
  console.log('🔥 Seeding Firebase Firestore...\n');

  // 1. Create Default Admin
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const existingAdminSnap = await db.collection('admins').where('username', '==', 'admin').limit(1).get();
  if (existingAdminSnap.empty) {
    await db.collection('admins').add({
      username: 'admin',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN'
    });
    console.log('✅ Admin User created: admin / admin123');
  } else {
    console.log('✅ Admin User already exists');
  }

  // 2. Create Domains
  console.log('\nCreating domains...');
  const defaultDomains = [
    'Media & Communication Team',
    'Event Management Team',
    'Marketing & PR Team',
    'Technical Team',
    'Creative Team'
  ];

  const domainIdMap: Record<string, string> = {};

  for (const domainName of defaultDomains) {
    const existingSnap = await db.collection('domains').where('name', '==', domainName).limit(1).get();
    if (existingSnap.empty) {
      const ref = await db.collection('domains').add({ name: domainName });
      domainIdMap[domainName] = ref.id;
      console.log(`  ✅ Created: ${domainName} (${ref.id})`);
    } else {
      domainIdMap[domainName] = existingSnap.docs[0].id;
      console.log(`  ✅ Already exists: ${domainName} (${existingSnap.docs[0].id})`);
    }
  }

  // 3. Import Questions from CSV
  console.log('\nImporting questions from CSV...');
  const csvPath = path.join(__dirname, '..', '..', 'Questions_Template.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Questions_Template.csv not found, skipping question import.');
    console.log('\n🎉 Seeding Complete!');
    return;
  }

  const rawData = fs.readFileSync(csvPath, 'utf-8');
  const lines = rawData.split('\n').filter(l => l.trim());

  // Skip header
  let imported = 0;
  let skipped = 0;

  // Clear existing questions first
  console.log('  Clearing existing questions...');
  const existingQuestionsSnap = await db.collection('questions').get();
  const deleteBatch = db.batch();
  let deleteCount = 0;
  for (const doc of existingQuestionsSnap.docs) {
    deleteBatch.delete(doc.ref);
    deleteCount++;
    if (deleteCount % 400 === 0) {
      await deleteBatch.commit();
    }
  }
  if (deleteCount % 400 !== 0) {
    await deleteBatch.commit();
  }
  console.log(`  Deleted ${deleteCount} existing questions.`);

  // Parse CSV - each line is wrapped in quotes as a single field
  const batch = db.batch();
  let batchCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Remove surrounding quotes and trailing commas
    let cleaned = line.replace(/^"/, '').replace(/".*$/, '');
    if (!cleaned) {
      // Try without quote stripping for simple CSV
      cleaned = line;
    }

    const parts = cleaned.split(',').map(p => p.trim());
    if (parts.length < 8) {
      skipped++;
      continue;
    }

    const [rawDomain, questionText, optA, optB, optC, optD, correctLetter, marksStr] = parts;
    const domainName = DOMAIN_MAP[rawDomain] || rawDomain;
    const domainId = domainIdMap[domainName];

    if (!domainId) {
      console.log(`  ⚠️  Unknown domain: "${rawDomain}" → "${domainName}", skipping.`);
      skipped++;
      continue;
    }

    const correctMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const correctOption = correctMap[correctLetter.toUpperCase()];
    if (correctOption === undefined) {
      skipped++;
      continue;
    }

    const ref = db.collection('questions').doc();
    batch.set(ref, {
      domainId,
      text: questionText,
      options: [optA, optB, optC, optD],
      correctOption,
      marks: parseInt(marksStr) || 1
    });

    batchCount++;
    imported++;

    // Firestore batch limit is 500
    if (batchCount >= 450) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`  ✅ Imported ${imported} questions (${skipped} skipped)`);

  // Print summary
  console.log('\n📊 Final Summary:');
  for (const [name, id] of Object.entries(domainIdMap)) {
    const qSnap = await db.collection('questions').where('domainId', '==', id).get();
    console.log(`  ${name}: ${qSnap.size} questions`);
  }

  console.log('\n🎉 Firebase Seeding Complete!');
}

seedFirebase().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
