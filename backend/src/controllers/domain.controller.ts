import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDomains = async (req: Request, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
