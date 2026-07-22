import express from 'express';
import cors from 'cors';
import { faqRouter } from './routes/faq.routes';
import { askRouter } from './routes/ask.routes';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    }),
  );
  app.use(express.json());

  // GET /api/health — health check simples (seção 5).
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/faq', faqRouter);
  app.use('/api/ask', askRouter);

  return app;
}
