import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getQuestionsByDomain = async (req: Request, res: Response) => {
  try {
    const domainId = req.params.domainId as string;
    const questionsSnap = await db.collection('questions').where('domainId', '==', domainId).get();
    const questions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const { domainId, text, options, correctOption, marks } = req.body;

    if (!domainId || !text || !options || options.length !== 4 || correctOption === undefined) {
      return res.status(400).json({ error: 'Invalid question data' });
    }

    const docRef = await db.collection('questions').add({
      domainId,
      text,
      options,
      correctOption,
      marks: marks || 1
    });

    res.status(201).json({ id: docRef.id, domainId, text, options, correctOption, marks: marks || 1 });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.collection('questions').doc(id).delete();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
