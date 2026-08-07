import { Request, Response } from 'express';
import prisma from '../config/db';

export const getQuestionsByDomain = async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;
    const questions = await prisma.question.findMany({
      where: { domainId }
    });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const { domainId, text, options, correctOption, marks } = req.body;
    
    // Basic validation
    if (!domainId || !text || !options || options.length !== 4 || correctOption === undefined) {
      return res.status(400).json({ error: 'Invalid question data' });
    }

    const question = await prisma.question.create({
      data: {
        domainId,
        text,
        options,
        correctOption,
        marks: marks || 1
      }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({
      where: { id }
    });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
