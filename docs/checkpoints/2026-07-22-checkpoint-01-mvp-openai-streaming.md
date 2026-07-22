# Guia de DP — Mendonça Galvão Contadores Associados
## Registro de desenvolvimento e contexto do projeto

> Checkpoint #01 — consolida tudo o que foi construído, decidido e alterado
> desde o scaffold inicial do MVP até a integração da logo oficial.

---

## 1. Visão geral do projeto

Aplicação **single page** que funciona como guia rápido do Departamento Pessoal (DP) da **Mendonça Galvão Contadores Associados**:

1. Usuário chega e vê um **FAQ** com as dúvidas mais recorrentes de DP.
2. Se não encontrar a resposta, digita a pergunta em um **chat com IA** especializada em DP/contabilidade trabalhista.
3. As conversas são **cacheadas no PostgreSQL**, reaproveitando respostas para perguntas repetidas (economia de custo/latência).

Sem autenticação — ferramenta pública/interna de consulta rápida.

Especificação original: [`spec-guia-dp-mendonca-galvao.md`](../../spec-guia-dp-mendonca-galvao.md).

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + CSS Modules |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL via Docker Compose |
| ORM | Prisma |
| LLM | Abstração `LlmProvider` — **OpenAI** (ativo), Anthropic e Mock disponíveis |

---

## 3. Decisões tomadas ao longo da sessão

Estas escolhas foram feitas via perguntas diretas ao usuário, não assumidas:

| Decisão | Escolha | Motivo |
|---|---|---|
| Estilo | **CSS Modules + tokens.css** | Fiel à estrutura da spec, sem dependências extras, controle total sobre o visual dark/dourado |
| Banco (dev) | **Docker Compose local** | Auto-contido, zero conta em nuvem |
| LLM (inicial) | **Mock + interface pronta** | Rodar a app de ponta a ponta sem key, trocável depois |
| Ritmo de build | **Tudo de uma vez** | Construir o MVP completo e revisar no final |
| LLM (evolução) | **Trocado para OpenAI (gpt-4o-mini)** | Pedido explícito do usuário — integração real do agente |

---

## 4. Estrutura do monorepo

```
guia-dp-mendonca-galvao/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo-mendonca-galvao.png
│   │   ├── components/
│   │   │   ├── Header.tsx (+ .module.css)
│   │   │   ├── FaqSearch.tsx (+ .module.css)
│   │   │   ├── FaqAccordion.tsx (+ .module.css)
│   │   │   ├── FaqCard.tsx (+ .module.css)
│   │   │   ├── AiChat.tsx (+ .module.css)
│   │   │   └── Footer.tsx (+ .module.css)
│   │   ├── hooks/
│   │   │   └── useAskAi.ts
│   │   ├── styles/
│   │   │   ├── tokens.css
│   │   │   └── global.css
│   │   ├── data/
│   │   │   └── faq.mock.ts
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── App.tsx (+ .module.css)
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── faq.routes.ts
│   │   │   └── ask.routes.ts
│   │   ├── llm/
│   │   │   ├── LlmProvider.ts       (interface)
│   │   │   ├── MockProvider.ts
│   │   │   ├── AnthropicProvider.ts
│   │   │   ├── OpenAiProvider.ts
│   │   │   ├── systemPrompt.ts
│   │   │   └── index.ts             (factory)
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── services/
│   │   │   └── conversationCache.service.ts
│   │   ├── utils/
│   │   │   └── normalize.ts
│   │   ├── data/
│   │   │   └── faqSeed.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   └── checkpoints/
│       └── 2026-07-22-checkpoint-01-mvp-openai-streaming.md   ← este arquivo
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Backend — o que foi construído

### 5.1 Modelo de dados (Prisma)

- **`faq_items`** — perguntas/respostas fixas (10 itens semeados, seção 7 da spec: rescisão, adiantamento, admissão, 13º, aviso prévio, FGTS, férias, exame demissional, afastamento, encargos).
- **`conversation_cache`** — cache de perguntas à IA, com `question_normalized` indexado, `hit_count` e `last_used_at`.

### 5.2 Camada `LlmProvider` (abstração central)

Interface única que todos os provedores implementam:

```ts
export interface LlmProvider {
  readonly name: string;
  ask(question: string, context?: string): Promise<string>;
  askStream?(question: string, context?: string): AsyncIterable<string>;
}
```

**Implementações:**
- `MockProvider` — resposta simulada, roda sem key; `askStream` simula streaming palavra a palavra.
- `AnthropicProvider` — usa `claude-opus-4-8` via SDK oficial `@anthropic-ai/sdk`; suporta `ask` e `askStream`.
- `OpenAiProvider` — usa `gpt-4o-mini` (configurável via `OPENAI_MODEL`) via SDK oficial `openai`; suporta `ask` e `askStream` (streaming nativo).

**Factory** (`llm/index.ts`) seleciona o provedor via `LLM_PROVIDER` no `.env` (`openai` | `anthropic` | `mock`). **Provedor ativo atual: `openai`.**

Prompt de sistema (`systemPrompt.ts`), compartilhado por todos os provedores:

> "Você é um assistente especializado em Departamento Pessoal e contabilidade trabalhista brasileira, atuando para o escritório Mendonça Galvão Contadores Associados. Responda de forma objetiva, cite prazos legais quando pertinente (CLT), e deixe claro quando a resposta pode variar conforme a empresa/convenção coletiva. Não invente números de lei..."

### 5.3 Serviço de cache (`conversationCache.service.ts`)

Fluxo (seção 3.3 da spec):
1. Normaliza a pergunta (minúsculas, sem acentos/pontuação).
2. Busca no cache por igualdade exata do texto normalizado.
3. **Hit** → incrementa `hit_count`/`last_used_at`, retorna `source: "cache"`.
4. **Miss** → chama o `LlmProvider`, salva no cache, retorna `source: "llm"`.

Duas versões:
- `askQuestion()` — resposta única (usado por `/api/ask`).
- `askQuestionStream()` — gerador assíncrono que emite eventos (`meta` → `token`* → `done`), preservando a mesma lógica de cache. Usado por `/api/ask/stream`.

### 5.4 Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/faq` | Lista FAQ ordenado por `order_index` |
| POST | `/api/ask` | `{question}` → `{answer, source}` (resposta única) |
| POST | `/api/ask/stream` | `{question}` → NDJSON streaming (`meta`/`token`*/`done`/`error`) |

O endpoint de streaming usa `Content-Type: application/x-ndjson`, headers anti-buffering (`X-Accel-Buffering: no`), e emite um objeto JSON por linha.

---

## 6. Frontend — o que foi construído

### 6.1 Design system (`tokens.css`)

Paleta fiel à referência "Cálculo Adiantamento" (seção 2.1 da spec): fundo quase preto (`#0A0A0A`), cards `#141414`, acentos dourados (`#C9A227` / `#E4C34E`), texto off-white, selo verde de sucesso, tipografia mono para blocos técnicos.

### 6.2 Componentes

- **`Header`** — logo real da Mendonça Galvão (PNG, 195×131px, `object-fit: contain`, altura 58px) + subtítulo "Guia do Departamento Pessoal" com divisor vertical.
- **`FaqSearch`** — campo de busca com botão "Perguntar à IA", contador de resultados.
- **`FaqAccordion`** / **`FaqCard`** — grid de 2 colunas, cards expansíveis (accordion), categoria em dourado.
- **`AiChat`** — chat com bolhas (usuário à direita, IA à esquerda), renderização de **markdown** via `react-markdown` nas respostas da IA, indicador de "digitando" (3 pontinhos animados) dentro do balão vazio, selo de origem (`✨ gerada pela IA` / `↺ cache`).
- **`Footer`** — nome do escritório + selo "AMBIENTE SEGURO" com ícone de cadeado.

### 6.3 Hook `useAskAi`

Consome `POST /api/ask/stream` via `fetch` + `ReadableStream` reader, parseando NDJSON linha a linha. Adiciona a mensagem do usuário + um balão vazio da IA que é **preenchido token a token** conforme o stream chega (`onToken` concatena o texto).

### 6.4 Dados e API

- `faq.mock.ts` — fallback local com as mesmas 10 perguntas do seed, usado se a API falhar.
- `api.ts` — `fetchFaq()`, `askAi()` (não-streaming) e `askAiStream()` (streaming, com handlers `onMeta`/`onToken`/`onError`/`onDone`).

---

## 7. Evolução da conversa (linha do tempo)

1. **Leitura da spec** e criação do monorepo completo (backend + frontend) seguindo à risca a arquitetura descrita.
2. **Perguntas de alinhamento** (estilo, banco, LLM, ritmo) via `AskUserQuestion` antes de codar.
3. **Build completo do MVP**: Prisma schema, seed do FAQ, camada `LlmProvider` com Mock, serviço de cache, 3 endpoints, componentes React, design system.
4. **Verificação de builds**: backend (`tsc`) e frontend (`tsc + vite build`) compilando limpos; smoke test do `/api/health`.
5. **Ambiente local**: usuário subiu o Docker (Postgres), rodamos migration + seed (10 itens), backend e frontend testados end-to-end com dados reais do banco.
6. **Troca de provedor**: usuário pediu para usar a **OpenAI** (não Anthropic). Implementado `OpenAiProvider` (gpt-4o-mini) por trás da mesma interface, sem alterar rotas/serviço.
7. **Bug de key**: primeiro teste falhou porque o `tsx watch` não recarrega ao editar `.env` (só observa arquivos-fonte) — resolvido reiniciando o backend.
8. **Confirmação real**: pergunta ao vivo respondida pela OpenAI (`source: "llm"`), repetição servida do cache (`source: "cache"`).
9. **⚠️ Nota de segurança**: a API key da OpenAI do usuário foi exposta em texto puro na conversa — recomendei fortemente revogar e gerar uma nova no painel da OpenAI.
10. **Formatação markdown**: respostas da IA apareciam com `**asteriscos**` crus. Adicionado `react-markdown` + estilos CSS para negrito, listas, código, blockquote — só no balão da IA.
11. **Streaming**: implementado de ponta a ponta — `askStream` opcional na interface, streaming nativo OpenAI/Anthropic, simulado no Mock, endpoint NDJSON, hook e componente React consumindo e renderizando incrementalmente.
12. **Bug de scroll**: `scrollIntoView` estava rolando a **janela inteira** a cada token (usuário via a página pular pro FAQ/rodapé). Corrigido para rolar apenas o container interno do chat (`.thread`) via `scrollTop`.
13. **Logo real**: usuário anexou a logo da Mendonça Galvão ao repositório (`c7bc5219-46ca-4c5a-90cd-ab888018cc71.png`, 195×131px). Copiada para `frontend/src/assets/`, integrada no `Header` com `object-fit: contain` para não distorcer, substituindo o placeholder circular "MG". Texto duplicado do nome do escritório removido (a logo já contém o nome).

---

## 8. Estado atual do ambiente

- **Docker/Postgres**: ativo, com a migration inicial aplicada e o FAQ semeado (10 itens).
- **Backend**: rodando em modo dev (`npm run dev`, hot-reload via `tsx watch`) em `http://localhost:3333`.
- **Frontend**: rodando via Vite dev server em `http://localhost:5173`.
- **Provedor de LLM ativo**: `openai` (`gpt-4o-mini`), com `OPENAI_API_KEY` configurada no `backend/.env`.
- **Builds de produção**: backend (`tsc`) e frontend (`tsc -b && vite build`) testados e compilando sem erros ao longo de toda a sessão.

---

## 9. Pendências e próximos passos sugeridos

- ⚠️ **Rotacionar a `OPENAI_API_KEY`** — foi exposta em texto plano na conversa; gerar uma nova chave no painel da OpenAI e atualizar o `.env`.
- **Validar os textos do FAQ** com o time contábil — são placeholders estruturais (spec, seção 7).
- Fora do MVP (spec, seção 8): autenticação, painel admin do FAQ, busca semântica com `pgvector`, histórico de conversas por usuário, multi-idioma.
- Possíveis melhorias discutidas mas não implementadas: botão de limpar conversa, persistência de histórico de chat entre sessões.

---

## 10. Como rodar o projeto

```bash
# 1. Subir o Postgres
docker compose up -d

# 2. Configurar .env (copiar de .env.example)
cp .env.example backend/.env
cp .env.example frontend/.env
# preencher OPENAI_API_KEY em backend/.env

# 3. Backend
cd backend
npm install
npm run prisma:generate
npm run db:setup      # migration + seed
npm run dev            # http://localhost:3333

# 4. Frontend (novo terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

**Importante**: ao editar `backend/.env`, é preciso **reiniciar manualmente** o servidor (`Ctrl+C` + `npm run dev`) — o `tsx watch` não observa mudanças no `.env`.

---

*Checkpoint gerado a partir do histórico de desenvolvimento desta sessão.*
