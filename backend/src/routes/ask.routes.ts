import { Router } from 'express';
import {
  askQuestion,
  askQuestionStream,
} from '../services/conversationCache.service';

export const askRouter = Router();

/** Valida o corpo da requisição; retorna a pergunta ou envia o erro 400. */
function validateQuestion(body: unknown): { ok: true; question: string } | { ok: false; error: string } {
  const question = (body as { question?: unknown })?.question;
  if (typeof question !== 'string' || question.trim().length === 0) {
    return { ok: false, error: 'O campo "question" é obrigatório e deve ser um texto.' };
  }
  if (question.length > 2000) {
    return { ok: false, error: 'A pergunta é muito longa (máx. 2000 caracteres).' };
  }
  return { ok: true, question };
}

/**
 * POST /api/ask
 * Body: { question: string }
 * Retorna: { answer: string, source: 'cache' | 'llm' }  (seção 5)
 */
askRouter.post('/', async (req, res) => {
  const valid = validateQuestion(req.body);
  if (!valid.ok) return res.status(400).json({ error: valid.error });

  try {
    const result = await askQuestion(valid.question);
    res.json(result);
  } catch (err) {
    console.error('Erro ao processar /api/ask:', err);
    res
      .status(500)
      .json({ error: 'Não foi possível processar a pergunta no momento.' });
  }
});

/**
 * POST /api/ask/stream
 * Body: { question: string }
 * Resposta: NDJSON (um objeto JSON por linha):
 *   {"type":"meta","source":"cache"|"llm"}
 *   {"type":"token","text":"..."}   (0..N)
 *   {"type":"done"}
 *   {"type":"error","message":"..."} (em caso de falha)
 */
askRouter.post('/stream', async (req, res) => {
  const valid = validateQuestion(req.body);
  if (!valid.ok) return res.status(400).json({ error: valid.error });

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // evita buffering em proxies (nginx)
  res.flushHeaders?.();

  const write = (event: unknown) => res.write(JSON.stringify(event) + '\n');

  try {
    for await (const event of askQuestionStream(valid.question)) {
      write(event);
    }
  } catch (err) {
    console.error('Erro ao processar /api/ask/stream:', err);
    write({ type: 'error', message: 'Não foi possível processar a pergunta no momento.' });
  } finally {
    res.end();
  }
});
