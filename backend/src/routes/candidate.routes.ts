import { Router } from 'express';
import { registerCandidate, getCandidates } from '../controllers/candidate.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerCandidate);
router.get('/', authenticateAdmin, getCandidates);

export default router;
