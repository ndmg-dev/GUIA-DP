# Guia DP — Mendonça Galvão Contadores Associados
## Especificação de Arquitetura e MVP (para Claude Code)

---

## 1. Visão Geral do Produto

Aplicação **single page, one section** que funciona como um guia rápido do Departamento Pessoal (DP) para colaboradores e clientes da Mendonça Galvão Contadores Associados.

Fluxo de uso:
1. O usuário chega na página e vê um **FAQ** com as perguntas mais recorrentes do DP (ex: "Quando termina uma rescisão?", "Como funciona o adiantamento salarial?", "Quais documentos preciso para admissão?").
2. Se a pergunta do usuário não estiver no FAQ, ele digita a pergunta em um **campo de busca/chat**.
3. Essa pergunta é enviada para um **agente de IA especializado em DP e contabilidade**, que responde com base em um prompt de sistema (e, futuramente, uma base de conhecimento própria).
4. A conversa é **cacheada no Postgres**, permitindo reaproveitar respostas para perguntas semelhantes e reduzir custo/latência de chamadas ao modelo.

Não há autenticação de usuário no MVP — é uma ferramenta pública/interna de consulta rápida, sem login.

---

## 2. Design System

Baseado na referência visual do sistema interno "Cálculo Adiantamento" (Sistema de Adiantamento Salarial).

### 2.1 Paleta de cores

| Token | Hex (aprox.) | Uso |
|---|---|---|
| `--bg-primary` | `#0A0A0A` | Fundo geral da aplicação (preto quase puro) |
| `--bg-surface` | `#141414` | Fundo de cards / painéis |
| `--bg-surface-hover` | `#1C1C1C` | Hover de cards |
| `--border-subtle` | `#2A2A2A` | Bordas de cards, divisores |
| `--border-gold` | `#3A3220` | Bordas com destaque dourado sutil |
| `--accent-gold` | `#C9A227` | Título, ícones, destaques ("Selecione a empresa", ícones de step ativo) |
| `--accent-gold-strong` | `#E4C34E` | Hover / estado ativo do dourado |
| `--text-primary` | `#F5F5F5` | Texto principal (branco levemente off) |
| `--text-secondary` | `#9A9A9A` | Texto descritivo / secundário |
| `--text-muted` | `#6B6B6B` | Rodapé, labels pequenas |
| `--success` | `#3FA55E` | Estados de sucesso (ex: "AMBIENTE SEGURO") |
| `--code-bg` | `#0F0F0F` | Fundo de blocos "fórmula" / monoespaçado |

### 2.2 Tipografia

- Fonte sans-serif do sistema (ex: `Inter`, `Segoe UI`, ou `system-ui` como fallback).
- Título principal: peso 600–700, cor `--accent-gold`.
- Corpo de texto: peso 400, cor `--text-secondary`.
- Blocos de "fórmula"/código: fonte monoespaçada (`JetBrains Mono`, `Fira Code` ou `monospace`), tamanho menor, dentro de um card com `--code-bg`.

### 2.3 Padrões de componente observados na referência

- Cards com `border-radius` médio (~12px), borda 1px `--border-subtle`, fundo `--bg-surface`.
- Ícones circulares com fundo escuro e traço dourado.
- Barra superior com breadcrumb + ações à direita (ex: "Abrir em nova aba").
- Stepper horizontal com ícones (usado aqui apenas como inspiração, não é necessário no MVP).
- Selo "AMBIENTE SEGURO" com ícone de cadeado — reaproveitar como selo de confiança/privacidade no rodapé do guia de DP.

### 2.4 Aplicação ao Guia de DP (single section)

Estrutura visual de uma página só, com:
- **Header**: logo + nome "Mendonça Galvão Contadores Associados" + subtítulo "Guia do Departamento Pessoal".
- **Hero/Intro**: título dourado + parágrafo descritivo curto.
- **Busca**: input de destaque no topo do FAQ ("Digite sua dúvida sobre DP...").
- **Grid de FAQ**: cards estilo "Mecânica Bahia / Mecânica PE" — pergunta em destaque + resposta resumida, expansível (accordion).
- **Chat IA**: aparece inline quando a busca não encontra correspondência no FAQ, estilizado como um card de conversa (bolhas com `--bg-surface` para IA e leve variação para o usuário).
- **Footer**: nome do escritório + selo de segurança/privacidade, no mesmo estilo do rodapé da referência.

---

## 3. Arquitetura Técnica

### 3.1 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Estilo | CSS Modules ou Tailwind (com tokens do design system acima) |
| Backend | Node.js + Express (ou Fastify) + TypeScript |
| Banco de dados | PostgreSQL (cache de conversas/perguntas-respostas) |
| ORM | Prisma (recomendado, por causa das migrations e do schema tipado) |
| LLM | Provedor a definir — abstrair via camada `LlmProvider` (ver 3.4) |
| Deploy sugerido | Frontend: Vercel/Netlify · Backend: Railway/Render · DB: Neon/Supabase/Railway Postgres |

### 3.2 Diagrama de arquitetura (alto nível)

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   Frontend (React)  │ ───────────────────────▶ │   Backend (Node/Express) │
│  - FAQ estático      │                          │  - GET  /api/faq          │
│  - Busca             │ ◀─────────────────────── │  - POST /api/ask          │
│  - Chat IA           │                          │  - GET  /api/health       │
└─────────────────────┘                          └────────────┬─────────────┘
                                                                │
                                          ┌─────────────────────┼─────────────────────┐
                                          ▼                                           ▼
                                ┌───────────────────┐                     ┌───────────────────────┐
                                │  PostgreSQL        │                     │  LlmProvider (adapter) │
                                │  - faq_items        │                     │  - Anthropic / OpenAI  │
                                │  - conversation_cache│                    │  - prompt de sistema DP │
                                └───────────────────┘                     └───────────────────────┘
```

### 3.3 Fluxo de dados de uma pergunta

1. Frontend faz `POST /api/ask` com `{ question: string }`.
2. Backend normaliza a pergunta (lowercase, remove acentos/pontuação) e gera um hash/embedding simples para checagem de cache.
3. Backend busca em `conversation_cache` por pergunta igual/similar (MVP: correspondência exata do texto normalizado; evolução futura: `pgvector` para similaridade semântica).
4. Se encontrar → retorna resposta cacheada (`source: "cache"`).
5. Se não encontrar → chama o `LlmProvider` com o prompt de sistema especializado em DP/contabilidade + a pergunta do usuário.
6. Resposta da IA é salva em `conversation_cache` e retornada ao frontend (`source: "llm"`).

### 3.4 Abstração do provedor de LLM

Como o modelo "ficará a definir", a integração deve passar por uma interface única:

```ts
// backend/src/llm/LlmProvider.ts
export interface LlmProvider {
  ask(question: string, context?: string): Promise<string>;
}
```

Implementações concretas (ex: `AnthropicProvider`, `OpenAiProvider`) implementam essa interface. A escolha do provedor ativo vem de uma variável de ambiente (`LLM_PROVIDER=anthropic`), permitindo trocar o modelo sem alterar o restante do backend.

O **prompt de sistema** deve fixar o escopo do agente, por exemplo:

> "Você é um assistente especializado em Departamento Pessoal e contabilidade trabalhista brasileira, atuando para o escritório Mendonça Galvão Contadores Associados. Responda de forma objetiva, cite prazos legais quando pertinente (CLT), e deixe claro quando a resposta pode variar conforme a empresa/convenção coletiva. Não invente números de lei; se não tiver certeza, oriente o usuário a confirmar com o contador responsável."

---

## 4. Modelo de Dados (PostgreSQL)

```sql
-- Perguntas frequentes cadastradas manualmente (FAQ fixo)
CREATE TABLE faq_items (
  id            SERIAL PRIMARY KEY,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  category      VARCHAR(100),         -- ex: 'Rescisão', 'Admissão', 'Adiantamento'
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Cache de perguntas feitas à IA (e reaproveitadas)
CREATE TABLE conversation_cache (
  id                SERIAL PRIMARY KEY,
  question_raw      TEXT NOT NULL,
  question_normalized TEXT NOT NULL,   -- usada para lookup de cache
  answer            TEXT NOT NULL,
  llm_provider      VARCHAR(50),       -- 'anthropic', 'openai', etc.
  hit_count         INTEGER DEFAULT 1, -- quantas vezes essa resposta foi reaproveitada
  created_at        TIMESTAMPTZ DEFAULT now(),
  last_used_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversation_question_normalized ON conversation_cache (question_normalized);
```

> Evolução futura: adicionar coluna `embedding vector(1536)` (extensão `pgvector`) em `conversation_cache` para busca por similaridade semântica em vez de igualdade textual.

---

## 5. Endpoints da API (MVP)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/faq` | Retorna a lista de perguntas/respostas fixas, ordenadas por `order_index` |
| POST | `/api/ask` | Recebe `{ question }`, retorna `{ answer, source: 'cache'|'llm' }` |
| GET | `/api/health` | Health check simples |

---

## 6. Estrutura de Pastas Proposta

```
guia-dp-mendonca-galvao/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── FaqSearch.tsx
│   │   │   ├── FaqAccordion.tsx
│   │   │   ├── FaqCard.tsx
│   │   │   ├── AiChat.tsx
│   │   │   └── Footer.tsx
│   │   ├── hooks/
│   │   │   └── useAskAi.ts
│   │   ├── styles/
│   │   │   └── tokens.css        # variáveis do design system (seção 2)
│   │   ├── data/
│   │   │   └── faq.mock.ts       # fallback local antes de conectar API
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── faq.routes.ts
│   │   │   └── ask.routes.ts
│   │   ├── llm/
│   │   │   ├── LlmProvider.ts
│   │   │   └── AnthropicProvider.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── services/
│   │   │   └── conversationCache.service.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── .env.example
└── README.md
```

---

## 7. Conteúdo Inicial do FAQ (seed sugerido)

Perguntas recorrentes de DP a cadastrar em `faq_items` no MVP:

1. Quando termina uma rescisão de contrato de trabalho?
2. Como funciona o cálculo do adiantamento salarial?
3. Quais documentos são necessários para a admissão de um funcionário?
4. Quais os prazos para pagamento do 13º salário?
5. Como funciona o aviso prévio (trabalhado x indenizado)?
6. O que é e como calcular o FGTS?
7. Quais são as férias proporcionais e como são calculadas?
8. Como solicitar o exame demissional?
9. O que fazer em caso de afastamento por atestado médico?
10. Quais encargos incidem sobre a folha de pagamento (INSS, IRRF)?

> Este conteúdo deve ser validado pelo time contábil antes de ir para produção — o texto aqui é apenas placeholder estrutural.

---

## 8. Escopo do MVP

**Incluso:**
- Página única com FAQ estático + busca + fallback para IA.
- Backend com 3 endpoints (seção 5).
- Cache exato em Postgres.
- Design system aplicado (cores, tipografia, componentes de card).
- Um provedor de LLM configurado (a definir) por trás da interface `LlmProvider`.

**Fora do MVP (próximas fases):**
- Autenticação de usuários.
- Painel administrativo para editar o FAQ via UI.
- Busca semântica com embeddings (`pgvector`).
- Histórico de conversas por usuário.
- Multi-idioma.

---

## 9. Variáveis de Ambiente (`.env.example`)

```
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/guia_dp
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=
PORT=3333

# Frontend
VITE_API_BASE_URL=http://localhost:3333
```

---

## 10. Instruções para o Claude Code

> Copie este arquivo inteiro para o Claude Code como especificação inicial do projeto. Peça para ele:
> 1. Criar o monorepo com as pastas `frontend/` e `backend/` conforme a seção 6.
> 2. Implementar os tokens de design (seção 2.1) em `frontend/src/styles/tokens.css`.
> 3. Construir os componentes React da seção 6, com o FAQ vindo de `faq.mock.ts` no início (antes da API estar pronta).
> 4. Configurar o Prisma com o schema da seção 4 e rodar a migration inicial.
> 5. Implementar a interface `LlmProvider` e uma primeira implementação concreta (`AnthropicProvider`) usando o prompt de sistema da seção 3.4.
> 6. Implementar os 3 endpoints da seção 5, incluindo a lógica de cache descrita na seção 3.3.
> 7. Popular `faq_items` com o seed da seção 7.
> 8. Garantir que o layout final seja fiel à referência visual (fundo escuro, cards com borda sutil, acentos dourados, tipografia monoespaçada para trechos técnicos).
