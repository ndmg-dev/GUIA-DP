import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider } from './LlmProvider';
import { DP_SYSTEM_PROMPT } from './systemPrompt';

/**
 * Implementação concreta do LlmProvider usando a API da Anthropic (Claude).
 *
 * NÃO é o provedor ativo no MVP (o padrão é o MockProvider). Fica pronto aqui
 * conforme a estrutura da seção 6 da spec — basta definir LLM_PROVIDER=anthropic
 * e ANTHROPIC_API_KEY no .env para ativar (ver llm/index.ts).
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-opus-4-8') {
    if (!apiKey) {
      throw new Error(
        'AnthropicProvider requer ANTHROPIC_API_KEY. Defina no .env ou use LLM_PROVIDER=mock.',
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async ask(question: string, context?: string): Promise<string> {
    const userContent = context
      ? `Contexto adicional:\n${context}\n\nPergunta do usuário:\n${question}`
      : question;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: DP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    // Concatena todos os blocos de texto da resposta.
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return text || 'Não foi possível gerar uma resposta no momento.';
  }

  async *askStream(question: string, context?: string): AsyncIterable<string> {
    const userContent = context
      ? `Contexto adicional:\n${context}\n\nPergunta do usuário:\n${question}`
      : question;

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: DP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
