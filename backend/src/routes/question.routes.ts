import { Router } from 'express';
import { getQuestionsByDomain, addQuestion, deleteQuestion } from '../controllers/question.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/domain/:domainId', authenticateAdmin, getQuestionsByDomain);
router.post('/', authenticateAdmin, addQuestion);
router.delete('/:id', authenticateAdmin, deleteQuestion);

export default router;
