# Guia de DP — Mendonça Galvão Contadores Associados

Aplicação **single page** que funciona como um guia rápido do Departamento
Pessoal (DP): um **FAQ** com as dúvidas mais recorrentes + um **assistente de IA**
especializado em DP/contabilidade trabalhista, com **cache das conversas no
PostgreSQL** para reaproveitar respostas.

Monorepo com `frontend/` (React + Vite + TS) e `backend/` (Node + Express +
Prisma), seguindo a especificação em [`spec-guia-dp-mendonca-galvao.md`](./spec-guia-dp-mendonca-galvao.md).

## Stack

| Camada    | Tecnologia                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 18 + Vite + TypeScript + CSS Modules             |
| Backend   | Node.js + Express + TypeScript                         |
| Banco     | PostgreSQL (via Docker Compose)                        |
| ORM       | Prisma                                                  |
| LLM       | Abstração `LlmProvider` — **OpenAI** (padrão), Anthropic ou Mock |

> **LLM:** o provedor ativo por padrão é a **OpenAI** (`LLM_PROVIDER=openai`,
> modelo `gpt-4o-mini` configurável via `OPENAI_MODEL`). Basta definir
> `OPENAI_API_KEY` no `backend/.env`. O servidor sobe normalmente mesmo sem a
> key (health e FAQ funcionam); apenas o `/api/ask` retorna erro claro até a key
> ser configurada. Também há um `AnthropicProvider` (`claude-opus-4-8`) e um
> `MockProvider` (roda sem key), trocáveis via `LLM_PROVIDER`.

## Estrutura

```
guia-dp-mendonca-galvao/
├── frontend/          # React + Vite (design system dark/dourado)
├── backend/           # Express + Prisma + camada LlmProvider
├── docker-compose.yml # Postgres local
├── .env.example
└── README.md
```

## Pré-requisitos

- Node.js 18+ e npm
- Docker + Docker Compose (para o Postgres)

## Setup passo a passo

### 1. Subir o PostgreSQL

```bash
docker compose up -d
```

Sobe um Postgres em `localhost:5432` (usuário/senha/db = `guia_dp`).

### 2. Configurar variáveis de ambiente

Crie os arquivos `.env` a partir do exemplo:

```bash
# Backend — copie o bloco "Backend" do .env.example para backend/.env
cp .env.example backend/.env

# Frontend — copie o bloco "Frontend" do .env.example para frontend/.env
cp .env.example frontend/.env
```

> O backend lê `backend/.env` (DATABASE_URL, LLM_PROVIDER, PORT…) e o frontend
> lê `frontend/.env` (apenas as variáveis com prefixo `VITE_`). O `.env.example`
> na raiz reúne ambos como referência.

### 3. Backend — instalar, migrar e semear o FAQ

```bash
cd backend
npm install
npm run prisma:generate     # gera o Prisma Client
npm run db:setup            # roda a migration inicial + popula o FAQ (seção 7)
npm run dev                 # sobe em http://localhost:3333
```

- `npm run db:setup` = `prisma migrate dev --name init` + seed do FAQ.
- Endpoints: `GET /api/health`, `GET /api/faq`, `POST /api/ask`.

### 4. Frontend — instalar e rodar

```bash
cd frontend
npm install
npm run dev                 # sobe em http://localhost:5173
```

Abra <http://localhost:5173>. Se o backend não estiver no ar, o FAQ ainda
aparece via fallback local (`faq.mock.ts`).

## Endpoints da API

| Método | Rota          | Descrição                                            |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | `/api/health` | Health check                                         |
| GET    | `/api/faq`    | Lista o FAQ ordenado por `order_index`               |
| POST   | `/api/ask`    | `{ question }` → `{ answer, source: 'cache'\|'llm' }` |

**Exemplo:**

```bash
curl -X POST http://localhost:3333/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Qual o prazo da rescisão?"}'
```

Primeira chamada retorna `source: "llm"`; repetir a mesma pergunta retorna
`source: "cache"` (correspondência exata do texto normalizado).

## Configurar o provedor de IA

O provedor ativo é controlado por `LLM_PROVIDER` no `backend/.env`.

**OpenAI (padrão):**

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # opcional
```

**Anthropic:**

```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**Mock (sem key, para demo):**

```
LLM_PROVIDER=mock
```

Reinicie o backend após alterar. Todas as respostas usam o prompt de sistema
especializado em DP/contabilidade trabalhista (seção 3.4).

## Scripts úteis

**Backend**

| Script                    | O que faz                              |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | Servidor com hot-reload (tsx watch)    |
| `npm run build`           | Compila TypeScript para `dist/`        |
| `npm run db:seed`         | (Re)popula o FAQ                       |
| `npm run prisma:migrate`  | Cria/aplica migrations                 |

**Frontend**

| Script            | O que faz                        |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (Vite)                |
| `npm run build`   | Type-check + build de produção   |
| `npm run preview` | Prévia do build                  |

## Modelo de dados

- `faq_items` — perguntas/respostas fixas (seed da seção 7).
- `conversation_cache` — cache das perguntas à IA (`question_normalized` indexada,
  `hit_count`, `last_used_at`).

## Fora do MVP (próximas fases)

Autenticação, painel admin do FAQ, busca semântica (`pgvector`), histórico por
usuário e multi-idioma — conforme seção 8 da spec.

## ⚠️ Aviso

Os textos do FAQ são **placeholders estruturais** e devem ser validados pelo
time contábil antes de ir para produção.
