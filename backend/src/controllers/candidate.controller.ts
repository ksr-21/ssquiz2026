import { Request, Response } from 'express';
import prisma from '../config/db';

export const registerCandidate = async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, college, yearOfStudy, branch, linkedInProfile, declarationAccepted, domainIds } = req.body;

    if (!fullName || !email || !mobileNumber || !college || !yearOfStudy || !branch || !declarationAccepted) {
      return res.status(400).json({ error: 'All mandatory fields must be filled.' });
    }

    if (!domainIds || domainIds.length < 1 || domainIds.length > 3) {
      return res.status(400).json({ error: 'You must select between 1 and 3 domains.' });
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email }
    });

    if (existingCandidate) {
      if (email === 'mayureshjagu1306@gmail.com') {
        // Special testing email: Delete their old records to allow a fresh start every time
        await prisma.assessmentSession.deleteMany({ where: { candidateId: existingCandidate.id } });
        await prisma.candidateDomain.deleteMany({ where: { candidateId: existingCandidate.id } });
        await prisma.candidate.delete({ where: { id: existingCandidate.id } });
      } else {
        // If the candidate already exists, allow them to log back in to resume their test.
        return res.status(200).json({
          message: 'Welcome back! Resuming your assessment.',
          candidateId: existingCandidate.id
        });
      }
    }

    // Create Candidate and their Domain selections
    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        email,
        mobileNumber,
        college,
        yearOfStudy,
        branch,
        linkedInProfile,
        declarationAccepted,
        domains: {
          create: domainIds.map((domainId: string) => ({
            domain: { connect: { id: domainId } }
          }))
        }
      },
      include: {
        domains: true
      }
    });

    res.status(201).json({
      message: 'Registration successful',
      candidateId: candidate.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        domains: { include: { domain: true } },
        session: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
