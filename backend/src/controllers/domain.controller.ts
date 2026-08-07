import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getDomains = async (req: Request, res: Response) => {
  try {
    const domainsSnap = await db.collection('domains').get();
    const domains = [];

    for (const doc of domainsSnap.docs) {
      const questionsSnap = await db.collection('questions').where('domainId', '==', doc.id).get();
      domains.push({
        id: doc.id,
        ...doc.data(),
        _count: { questions: questionsSnap.size }
      });
    }

    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
