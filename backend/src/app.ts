import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

import adminRoutes from './routes/admin.routes';
import domainRoutes from './routes/domain.routes';
import questionRoutes from './routes/question.routes';
import candidateRoutes from './routes/candidate.routes';
import assessmentRoutes from './routes/assessment.routes';

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/admin', adminRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/assessment', assessmentRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
