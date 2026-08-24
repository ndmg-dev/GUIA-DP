import express from 'express';
import cors from 'cors';
import { faqRouter } from './routes/faq.routes';
import { askRouter } from './routes/ask.routes';

export function createApp() {
  const app = express();

  // CORS_ORIGIN aceita uma lista separada por vírgula — o frontend próprio
  // (guia-dp.mendoncagalvao.com.br) e agora também o CRM, que embute este
  // sistema nativamente (chamada cross-origin direta do navegador: não há
  // dado sensível de cliente aqui, só FAQ + assistente de IA públicos).
  const origensPermitidas = (
    process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  )
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: origensPermitidas,
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
