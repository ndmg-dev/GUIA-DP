import OpenAI from 'openai';
import { LlmProvider } from './LlmProvider';
import { DP_SYSTEM_PROMPT } from './systemPrompt';

/**
 * Implementação concreta do LlmProvider usando a API da OpenAI.
 *
 * O modelo vem de OPENAI_MODEL (padrão: gpt-4o-mini). A checagem da API key é
 * adiada para o momento do ask() — assim o servidor sobe normalmente (health e
 * FAQ funcionam) mesmo sem a key, e apenas /api/ask retorna um erro claro
 * enquanto OPENAI_API_KEY não estiver configurada.
 */
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  private client: OpenAI | null;
  private model: string;
  private hasKey: boolean;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.hasKey = Boolean(apiKey);
    this.model = model;
    // Só instancia o client se houver key; senão, ask() lança erro amigável.
    this.client = this.hasKey ? new OpenAI({ apiKey }) : null;

    if (!this.hasKey) {
      console.warn(
        '⚠️ OpenAiProvider ativo, mas OPENAI_API_KEY não está definida. ' +
          'O /api/ask falhará até você configurar a key no .env.',
      );
    }
  }

  async ask(question: string, context?: string): Promise<string> {
    if (!this.client) {
      throw new Error(
        'OPENAI_API_KEY não configurada. Defina no backend/.env para usar o provedor OpenAI.',
      );
    }

    const userContent = context
      ? `Contexto adicional:\n${context}\n\nPergunta do usuário:\n${question}`
      : question;

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: DP_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    return text || 'Não foi possível gerar uma resposta no momento.';
  }

  async *askStream(question: string, context?: string): AsyncIterable<string> {
    if (!this.client) {
      throw new Error(
        'OPENAI_API_KEY não configurada. Defina no backend/.env para usar o provedor OpenAI.',
      );
    }

    const userContent = context
      ? `Contexto adicional:\n${context}\n\nPergunta do usuário:\n${question}`
      : question;

    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: DP_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
