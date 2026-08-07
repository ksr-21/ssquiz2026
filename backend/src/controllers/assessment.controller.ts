import { Request, Response } from 'express';
import { db, FieldValue } from '../config/firebase';

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const startAssessment = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body;

    const candidateDoc = await db.collection('candidates').doc(candidateId).get();
    if (!candidateDoc.exists) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    const candidate = candidateDoc.data()!;

    // Check for existing session
    const existingSessionSnap = await db.collection('sessions').where('candidateId', '==', candidateId).limit(1).get();

    if (!existingSessionSnap.empty) {
      const sessionDoc = existingSessionSnap.docs[0];
      const existingSession = sessionDoc.data();

      if (existingSession.status === 'COMPLETED') {
        return res.status(403).json({ error: 'Assessment already completed.' });
      }

      if (existingSession.status === 'TERMINATED') {
        return res.status(403).json({ error: 'Assessment was terminated due to policy violations.' });
      }

      if (existingSession.status === 'IN_PROGRESS') {
        // Resume existing session
        const answersSnap = await db.collection('answers').where('sessionId', '==', sessionDoc.id).get();
        const formattedQuestions = [];

        for (const ansDoc of answersSnap.docs) {
          const ans = ansDoc.data();
          const questionDoc = await db.collection('questions').doc(ans.questionId).get();
          if (questionDoc.exists) {
            const q = questionDoc.data()!;
            formattedQuestions.push({
              id: questionDoc.id,
              text: q.text,
              options: q.options,
              selectedOpt: ans.selectedOpt ?? null
            });
          }
        }

        return res.json({
          sessionId: sessionDoc.id,
          status: existingSession.status,
          startTime: existingSession.startTime,
          questions: formattedQuestions
        });
      }
    }

    // New Session
    const domainIds = candidate.domainIds || [];
    let selectedQuestions: any[] = [];

    const numDomains = domainIds.length;
    const questionsPerDomain = numDomains === 1 ? 30 : numDomains === 2 ? 15 : 10;

    for (const domainId of domainIds) {
      const allDomainQsSnap = await db.collection('questions').where('domainId', '==', domainId).get();
      const allDomainQs = allDomainQsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const shuffled = shuffleArray(allDomainQs);
      selectedQuestions.push(...shuffled.slice(0, questionsPerDomain));
    }

    selectedQuestions = shuffleArray(selectedQuestions);

    // Create session
    const sessionRef = await db.collection('sessions').add({
      candidateId,
      status: 'IN_PROGRESS',
      startTime: FieldValue.serverTimestamp(),
      endTime: null,
      score: null,
      deviceInfo: req.headers['user-agent'] || null,
      violationsCount: 0
    });

    // Create answer records in batch
    const batch = db.batch();
    for (const q of selectedQuestions) {
      const ansRef = db.collection('answers').doc();
      batch.set(ansRef, {
        sessionId: sessionRef.id,
        questionId: q.id,
        selectedOpt: null,
        savedAt: FieldValue.serverTimestamp()
      });
    }
    await batch.commit();

    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      text: (q as any).text,
      options: (q as any).options,
      selectedOpt: null
    }));

    res.status(201).json({
      sessionId: sessionRef.id,
      status: 'IN_PROGRESS',
      startTime: new Date().toISOString(),
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveAnswer = async (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, selectedOpt } = req.body;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()!.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    // Find the answer doc by sessionId + questionId
    const ansSnap = await db.collection('answers')
      .where('sessionId', '==', sessionId)
      .where('questionId', '==', questionId)
      .limit(1)
      .get();

    if (ansSnap.empty) {
      return res.status(404).json({ error: 'Answer record not found' });
    }

    await ansSnap.docs[0].ref.update({
      selectedOpt,
      savedAt: FieldValue.serverTimestamp()
    });

    res.json({ message: 'Saved successfully' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitAssessment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()!.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid or already submitted session' });
    }

    // Calculate score
    const answersSnap = await db.collection('answers').where('sessionId', '==', sessionId).get();
    let score = 0;

    for (const ansDoc of answersSnap.docs) {
      const ans = ansDoc.data();
      if (ans.selectedOpt != null) {
        const questionDoc = await db.collection('questions').doc(ans.questionId).get();
        if (questionDoc.exists) {
          const q = questionDoc.data()!;
          if (ans.selectedOpt === q.correctOption) {
            score += q.marks || 1;
          }
        }
      }
    }

    await db.collection('sessions').doc(sessionId).update({
      status: 'COMPLETED',
      endTime: FieldValue.serverTimestamp(),
      score
    });

    res.json({ message: 'Submitted successfully', score });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logViolation = async (req: Request, res: Response) => {
  try {
    const { sessionId, type } = req.body;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()!.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid session' });
    }

    // Create violation record
    await db.collection('violations').add({
      sessionId,
      type,
      timestamp: FieldValue.serverTimestamp(),
      description: 'Frontend violation detected'
    });

    // Increment violations count
    const currentCount = sessionDoc.data()!.violationsCount || 0;
    const newCount = currentCount + 1;

    await db.collection('sessions').doc(sessionId).update({
      violationsCount: newCount
    });

    if (newCount >= 3) {
      await db.collection('sessions').doc(sessionId).update({
        status: 'TERMINATED',
        endTime: FieldValue.serverTimestamp()
      });
      return res.json({ terminated: true });
    }

    res.json({ terminated: false, violationsCount: newCount });
  } catch (error) {
    console.error('Log violation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
