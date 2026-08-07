import { Request, Response } from 'express';
import prisma from '../config/db';
import { v4 as uuidv4 } from 'uuid';

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

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { domains: true }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const existingSession = await prisma.assessmentSession.findUnique({
      where: { candidateId }
    });

    if (existingSession && existingSession.status === 'COMPLETED') {
      return res.status(403).json({ error: 'Assessment already completed.' });
    }

    if (existingSession && existingSession.status === 'TERMINATED') {
      return res.status(403).json({ error: 'Assessment was terminated due to policy violations.' });
    }

    if (existingSession && existingSession.status === 'IN_PROGRESS') {
      // Resume existing session
      const answers = await prisma.candidateAnswer.findMany({
        where: { sessionId: existingSession.id },
        include: { question: true }
      });
      
      const formattedQuestions = answers.map(ans => ({
        id: ans.question.id,
        text: ans.question.text,
        options: ans.question.options,
        selectedOpt: ans.selectedOpt
      }));

      return res.json({
        sessionId: existingSession.id,
        status: existingSession.status,
        startTime: existingSession.startTime,
        questions: formattedQuestions
      });
    }

    // New Session Allocation Logic
    const domainIds = candidate.domains.map(d => d.domainId);
    let selectedQuestions: any[] = [];

    const numDomains = domainIds.length;
    const questionsPerDomain = numDomains === 1 ? 30 : numDomains === 2 ? 15 : 10;

    for (const domainId of domainIds) {
      const allDomainQs = await prisma.question.findMany({ where: { domainId } });
      const shuffled = shuffleArray(allDomainQs);
      selectedQuestions.push(...shuffled.slice(0, questionsPerDomain));
    }

    // Final shuffle to mix domains
    selectedQuestions = shuffleArray(selectedQuestions);

    const session = await prisma.assessmentSession.create({
      data: {
        candidateId,
        status: 'IN_PROGRESS',
        deviceInfo: req.headers['user-agent']
      }
    });

    const answerRecords = selectedQuestions.map(q => ({
      sessionId: session.id,
      questionId: q.id
    }));

    await prisma.candidateAnswer.createMany({
      data: answerRecords
    });

    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      selectedOpt: null
    }));

    res.status(201).json({
      sessionId: session.id,
      status: session.status,
      startTime: session.startTime,
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

    const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });

    if (!session || session.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await prisma.candidateAnswer.update({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId
        }
      },
      data: { selectedOpt }
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

    const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });

    if (!session || session.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid or already submitted session' });
    }

    // Calculate score
    const answers = await prisma.candidateAnswer.findMany({
      where: { sessionId },
      include: { question: true }
    });

    let score = 0;
    for (const ans of answers) {
      if (ans.selectedOpt === ans.question.correctOption) {
        score += ans.question.marks;
      }
    }

    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        score
      }
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

    const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Invalid session' });
    }

    await prisma.violation.create({
      data: {
        sessionId,
        type,
        description: 'Frontend violation detected'
      }
    });

    const updatedSession = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { violationsCount: { increment: 1 } }
    });

    if (updatedSession.violationsCount >= 3) {
      // Auto submit
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { status: 'TERMINATED', endTime: new Date() }
      });
      return res.json({ terminated: true });
    }

    res.json({ terminated: false, violationsCount: updatedSession.violationsCount });
  } catch (error) {
    console.error('Log violation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
