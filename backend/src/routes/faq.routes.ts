import { Router } from 'express';
import { prisma } from '../db/prisma';

export const faqRouter = Router();

/**
 * GET /api/faq
 * Retorna as perguntas/respostas fixas, ordenadas por order_index (seção 5).
 */
faqRouter.get('/', async (_req, res) => {
  try {
    const items = await prisma.faqItem.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    res.json(items);
  } catch (err) {
    console.error('Erro ao buscar FAQ:', err);
    res.status(500).json({ error: 'Erro ao buscar o FAQ.' });
  }
});
