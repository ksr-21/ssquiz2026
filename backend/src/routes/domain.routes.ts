import { Router } from 'express';
import { getDomains } from '../controllers/domain.controller';

const router = Router();

router.get('/', getDomains);

export default router;
