import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const adminSnap = await db.collection('admins').where('username', '==', username).limit(1).get();

    if (adminSnap.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const adminDoc = adminSnap.docs[0];
    const adminData = adminDoc.data();

    const isMatch = await bcrypt.compare(password, adminData.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: adminDoc.id, username: adminData.username, role: adminData.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: adminDoc.id,
        username: adminData.username,
        role: adminData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const candidatesSnap = await db.collection('candidates').get();
    const totalCandidates = candidatesSnap.size;

    const completedSnap = await db.collection('sessions').where('status', '==', 'COMPLETED').get();
    const completedAssessments = completedSnap.size;

    res.json({
      totalCandidates,
      completedAssessments,
      liveCandidates: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
