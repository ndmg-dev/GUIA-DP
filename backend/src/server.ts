import 'dotenv/config';
import { createApp } from './app';
import { getLlmProvider } from './llm';

const PORT = Number(process.env.PORT ?? 3333);

const app = createApp();

// Inicializa o provedor de LLM já no boot (loga qual está ativo).
getLlmProvider();

app.listen(PORT, () => {
  console.log(`🚀 Backend do Guia de DP rodando em http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
  console.log(`   FAQ:     http://localhost:${PORT}/api/faq`);
});
