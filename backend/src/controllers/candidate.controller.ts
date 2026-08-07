import { Request, Response } from 'express';
import { db, FieldValue } from '../config/firebase';

export const registerCandidate = async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, college, yearOfStudy, branch, linkedInProfile, declarationAccepted, domainIds } = req.body;

    if (!fullName || !email || !mobileNumber || !college || !yearOfStudy || !branch || !declarationAccepted) {
      return res.status(400).json({ error: 'All mandatory fields must be filled.' });
    }

    if (!domainIds || domainIds.length < 1 || domainIds.length > 3) {
      return res.status(400).json({ error: 'You must select between 1 and 3 domains.' });
    }

    // Check if candidate already exists by email
    const existingSnap = await db.collection('candidates').where('email', '==', email).limit(1).get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingCandidate = existingDoc.data();

      if (email === 'mayureshjagu1306@gmail.com') {
        // Special testing email: Delete their old records
        const sessionsSnap = await db.collection('sessions').where('candidateId', '==', existingDoc.id).get();
        const batch = db.batch();
        for (const s of sessionsSnap.docs) {
          // Delete answers for this session
          const answersSnap = await db.collection('answers').where('sessionId', '==', s.id).get();
          for (const a of answersSnap.docs) batch.delete(a.ref);
          // Delete violations for this session
          const violationsSnap = await db.collection('violations').where('sessionId', '==', s.id).get();
          for (const v of violationsSnap.docs) batch.delete(v.ref);
          batch.delete(s.ref);
        }
        batch.delete(existingDoc.ref);
        await batch.commit();
      } else {
        return res.status(200).json({
          message: 'Welcome back! Resuming your assessment.',
          candidateId: existingDoc.id
        });
      }
    }

    // Create Candidate
    const candidateRef = await db.collection('candidates').add({
      fullName,
      email,
      mobileNumber,
      college,
      yearOfStudy,
      branch,
      linkedInProfile: linkedInProfile || null,
      declarationAccepted,
      domainIds,
      createdAt: FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: 'Registration successful',
      candidateId: candidateRef.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidatesSnap = await db.collection('candidates').orderBy('createdAt', 'desc').get();
    const candidates = [];

    for (const doc of candidatesSnap.docs) {
      const candidateData = doc.data();

      // Get domain details
      const domainDetails = [];
      if (candidateData.domainIds && Array.isArray(candidateData.domainIds)) {
        for (const domainId of candidateData.domainIds) {
          const domainDoc = await db.collection('domains').doc(domainId).get();
          if (domainDoc.exists) {
            domainDetails.push({ domainId, domain: { id: domainId, ...domainDoc.data() } });
          }
        }
      }

      // Get session
      const sessionSnap = await db.collection('sessions').where('candidateId', '==', doc.id).limit(1).get();
      const session = sessionSnap.empty ? null : { id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() };

      candidates.push({
        id: doc.id,
        ...candidateData,
        domains: domainDetails,
        session
      });
    }

    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
