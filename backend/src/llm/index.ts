import { LlmProvider } from './LlmProvider';
import { MockProvider } from './MockProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAiProvider } from './OpenAiProvider';

/**
 * Factory do provedor de LLM (seção 3.4 da spec).
 *
 * O provedor ativo vem da variável de ambiente LLM_PROVIDER:
 *   - "openai"    → OpenAiProvider (requer OPENAI_API_KEY; modelo em OPENAI_MODEL)
 *   - "anthropic" → AnthropicProvider (requer ANTHROPIC_API_KEY)
 *   - "mock"      → MockProvider (roda sem API key)
 *
 * Trocar o modelo/provedor não exige alterar o restante do backend — todos
 * consomem a interface LlmProvider.
 */
let singleton: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (singleton) return singleton;

  const provider = (process.env.LLM_PROVIDER ?? 'mock').toLowerCase();

  switch (provider) {
    case 'openai':
      singleton = new OpenAiProvider(
        process.env.OPENAI_API_KEY ?? '',
        process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      );
      break;
    case 'anthropic':
      singleton = new AnthropicProvider(process.env.ANTHROPIC_API_KEY ?? '');
      break;
    case 'mock':
    default:
      if (provider !== 'mock') {
        console.warn(
          `⚠️ LLM_PROVIDER="${provider}" não reconhecido. Usando MockProvider.`,
        );
      }
      singleton = new MockProvider();
      break;
  }

  console.log(`🤖 Provedor de LLM ativo: ${singleton.name}`);
  return singleton;
}

export type { LlmProvider };
