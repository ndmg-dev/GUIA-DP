import { prisma } from '../db/prisma';
import { normalizeQuestion } from '../utils/normalize';
import { getLlmProvider } from '../llm';

export type AskSource = 'cache' | 'llm';

export interface AskResult {
  answer: string;
  source: AskSource;
}

/**
 * Fluxo de dados de uma pergunta (seção 3.3 da spec):
 *  1. Normaliza a pergunta.
 *  2. Busca no cache por correspondência exata do texto normalizado.
 *  3. Hit  → incrementa hit_count/last_used_at e retorna (source: 'cache').
 *  4. Miss → chama o LlmProvider, salva no cache e retorna (source: 'llm').
 */
export async function askQuestion(rawQuestion: string): Promise<AskResult> {
  const question = rawQuestion.trim();
  const normalized = normalizeQuestion(question);

  // 2 + 3: procura no cache (MVP: igualdade exata do texto normalizado).
  const cached = await prisma.conversationCache.findFirst({
    where: { questionNormalized: normalized },
    orderBy: { lastUsedAt: 'desc' },
  });

  if (cached) {
    await prisma.conversationCache.update({
      where: { id: cached.id },
      data: {
        hitCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return { answer: cached.answer, source: 'cache' };
  }

  // 4: cache miss → chama o provedor de LLM.
  const provider = getLlmProvider();
  const answer = await provider.ask(question);

  // 5: persiste a resposta no cache.
  await prisma.conversationCache.create({
    data: {
      questionRaw: question,
      questionNormalized: normalized,
      answer,
      llmProvider: provider.name,
    },
  });

  return { answer, source: 'llm' };
}

/** Eventos emitidos pelo fluxo de streaming (protocolo NDJSON). */
export type StreamEvent =
  | { type: 'meta'; source: AskSource }
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Versão em streaming do fluxo da seção 3.3:
 *  - Cache hit  → emite a resposta cacheada de uma vez (source: 'cache').
 *  - Cache miss → faz streaming do LlmProvider (se suportar) acumulando o texto,
 *                 salva no cache ao final (source: 'llm').
 */
export async function* askQuestionStream(
  rawQuestion: string,
): AsyncGenerator<StreamEvent> {
  const question = rawQuestion.trim();
  const normalized = normalizeQuestion(question);

  const cached = await prisma.conversationCache.findFirst({
    where: { questionNormalized: normalized },
    orderBy: { lastUsedAt: 'desc' },
  });

  if (cached) {
    await prisma.conversationCache.update({
      where: { id: cached.id },
      data: { hitCount: { increment: 1 }, lastUsedAt: new Date() },
    });
    yield { type: 'meta', source: 'cache' };
    yield { type: 'token', text: cached.answer };
    yield { type: 'done' };
    return;
  }

  const provider = getLlmProvider();
  yield { type: 'meta', source: 'llm' };

  let full = '';

  if (provider.askStream) {
    for await (const delta of provider.askStream(question)) {
      full += delta;
      yield { type: 'token', text: delta };
    }
  } else {
    // Fallback: provedor sem streaming — envia a resposta inteira de uma vez.
    full = await provider.ask(question);
    yield { type: 'token', text: full };
  }

  // Só persiste no cache se houve resposta útil.
  if (full.trim()) {
    await prisma.conversationCache.create({
      data: {
        questionRaw: question,
        questionNormalized: normalized,
        answer: full,
        llmProvider: provider.name,
      },
    });
  }

  yield { type: 'done' };
}
