import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// For Vercel deployment, the service account JSON is stored as a base64-encoded env var
// For local dev, you can set FIREBASE_SERVICE_ACCOUNT_BASE64 or use a JSON file
function initializeFirebase() {
  if (getApps().length > 0) {
    return getApp();
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  // Fallback: initialize with project ID only (works in Firebase Cloud Functions)
  return initializeApp({
    projectId: 'exam-app-ccc1c',
  });
}

const app = initializeFirebase();
const db = getFirestore(app);

export { db, FieldValue };
