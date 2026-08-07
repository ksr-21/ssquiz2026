import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalCandidates = await prisma.candidate.count();
    const completedAssessments = await prisma.assessmentSession.count({
      where: { status: 'COMPLETED' }
    });
    
    // Additional stats can be aggregated here
    
    res.json({
      totalCandidates,
      completedAssessments,
      liveCandidates: 0, // Placeholder
      averageScore: 0, // Placeholder
      highestScore: 0, // Placeholder
      lowestScore: 0 // Placeholder
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
