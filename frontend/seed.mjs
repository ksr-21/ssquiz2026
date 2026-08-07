import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCavsAFzU77yWfqNM6wdb_WrdjeyYYILPI",
  authDomain: "exam-app-ccc1c.firebaseapp.com",
  projectId: "exam-app-ccc1c",
  storageBucket: "exam-app-ccc1c.firebasestorage.app",
  messagingSenderId: "400532147089",
  appId: "1:400532147089:web:710e323d33977663daa830"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearExistingData() {
    console.log("Clearing existing corrupted data...");
    const domainsSnap = await getDocs(collection(db, 'domains'));
    for (const doc of domainsSnap.docs) {
        await deleteDoc(doc.ref);
    }
    const questionsSnap = await getDocs(collection(db, 'questions'));
    for (const doc of questionsSnap.docs) {
        await deleteDoc(doc.ref);
    }
    console.log("Cleared.");
}

async function run() {
    await clearExistingData();
    
    const fileContent = fs.readFileSync('../Questions_Template.csv', 'utf8');
    const lines = fileContent.split('\n');
    
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Remove trailing commas if any outside quotes
        if (line.endsWith(',,,,,,,')) {
           line = line.replace(/,+$/, '');
        }
        
        // Remove enclosing quotes if they exist
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        } else if (line.startsWith('"') && line.includes('",,,,,,,')) {
            line = line.replace(/",+$/, '');
            line = line.substring(1);
        }
        
        // Some lines might still be weirdly formatted but let's just do a basic split by comma, 
        // assuming options don't have commas (which they might). 
        // A better approach: split by comma but respect quotes if they are internal.
        // But let's just use a simple regex for CSV parsing line by line
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' && line[j+1] === '"') {
                current += '"';
                j++;
            } else if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);
        
        if (parts.length >= 8) {
            questions.push({
                domain: parts[0].trim(),
                question: parts[1].trim(),
                optionA: parts[2].trim(),
                optionB: parts[3].trim(),
                optionC: parts[4].trim(),
                optionD: parts[5].trim(),
                correct: parts[6].trim(),
                marks: parts[7].trim()
            });
        }
    }
    
    const domains = [...new Set(questions.map(q => q.domain))];
    console.log("Found domains:", domains);
    
    for (const d of domains) {
         const domainRef = collection(db, 'domains');
         const docRef = await addDoc(domainRef, { name: d });
         console.log("Added domain:", d, docRef.id);
         
         const qForDomain = questions.filter(q => q.domain === d);
         for (const q of qForDomain) {
             await addDoc(collection(db, 'questions'), {
                 domainId: docRef.id,
                 text: q.question,
                 options: [q.optionA, q.optionB, q.optionC, q.optionD],
                 correctAnswer: q.correct,
                 marks: parseInt(q.marks || '1')
             });
         }
         console.log(`Added ${qForDomain.length} questions for domain ${d}`);
    }
    console.log("Seeding complete!");
    process.exit(0);
}

run().catch(console.error);
