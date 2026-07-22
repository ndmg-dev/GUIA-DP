import { LlmProvider } from './LlmProvider';

/**
 * Provedor de LLM simulado — padrão do MVP.
 *
 * Permite rodar a aplicação de ponta a ponta sem nenhuma API key.
 * Produz uma resposta determinística e plausível, deixando explícito que
 * é um ambiente de demonstração. Substituível por AnthropicProvider (ou
 * outro) apenas trocando LLM_PROVIDER no .env.
 */
export class MockProvider implements LlmProvider {
  readonly name = 'mock';

  private buildAnswer(question: string): string {
    const q = question.trim();
    return [
      `Esta é uma resposta simulada (ambiente de demonstração — provedor "mock").`,
      ``,
      `Você perguntou: "${q}"`,
      ``,
      `Quando um provedor de IA real for configurado (ex.: LLM_PROVIDER=anthropic com uma ANTHROPIC_API_KEY válida), esta resposta será gerada por um modelo especializado em Departamento Pessoal e contabilidade trabalhista brasileira, com base na CLT.`,
      ``,
      `Enquanto isso, para dúvidas específicas do seu caso, confirme com o contador responsável da Mendonça Galvão Contadores Associados.`,
    ].join('\n');
  }

  async ask(question: string, _context?: string): Promise<string> {
    // Pequeno atraso simulando latência de rede/modelo.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.buildAnswer(question);
  }

  async *askStream(question: string, _context?: string): AsyncIterable<string> {
    // Simula streaming emitindo a resposta palavra a palavra.
    const words = this.buildAnswer(question).split(/(\s+)/);
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      yield word;
    }
  }
}
