import { Router } from 'express';
import { startAssessment, saveAnswer, submitAssessment, logViolation } from '../controllers/assessment.controller';

const router = Router();

router.post('/start', startAssessment);
router.post('/save-answer', saveAnswer);
router.post('/submit', submitAssessment);
router.post('/violation', logViolation);

export default router;
