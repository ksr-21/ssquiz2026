import { Router } from 'express';
import { login, getDashboardStats } from '../controllers/admin.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/stats', authenticateAdmin, getDashboardStats);

export default router;
