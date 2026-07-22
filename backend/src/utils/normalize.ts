/**
 * Normaliza o texto de uma pergunta para servir de chave de cache.
 *
 * MVP: correspondência exata do texto normalizado (seção 3.3 da spec).
 * - minúsculas
 * - remove acentos/diacríticos
 * - remove pontuação
 * - colapsa espaços
 *
 * Evolução futura: substituir por embeddings + pgvector para similaridade
 * semântica em vez de igualdade textual.
 */
export function normalizeQuestion(input: string): string {
  return input
    .normalize('NFD')
    // remove diacríticos (acentos) — faixa combinante U+0300–U+036F
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // troca qualquer coisa que não seja letra/número/espaço por espaço
    .replace(/[^a-z0-9\s]/g, ' ')
    // colapsa múltiplos espaços
    .replace(/\s+/g, ' ')
    .trim();
}
