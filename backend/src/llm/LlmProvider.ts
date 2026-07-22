/**
 * Interface única de provedor de LLM (seção 3.4 da spec).
 *
 * O provedor ativo é escolhido por variável de ambiente (LLM_PROVIDER),
 * permitindo trocar o modelo sem alterar o restante do backend.
 */
export interface LlmProvider {
  /** Identificador do provedor, gravado no cache ('mock', 'anthropic', ...). */
  readonly name: string;

  /**
   * Responde a uma pergunta de DP/contabilidade.
   * @param question Pergunta do usuário (texto cru).
   * @param context Contexto opcional (ex: base de conhecimento futura).
   */
  ask(question: string, context?: string): Promise<string>;

  /**
   * Versão em streaming: emite a resposta em pedaços (tokens/deltas) conforme
   * são gerados. Opcional — provedores que não suportam streaming omitem este
   * método, e o serviço faz fallback para ask().
   */
  askStream?(question: string, context?: string): AsyncIterable<string>;
}
