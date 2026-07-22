# Documentação do projeto

Este diretório reúne a documentação viva do **Guia de DP — Mendonça Galvão
Contadores Associados**: contexto de decisões e checkpoints de progresso do
desenvolvimento.

## Estrutura

```
docs/
└── checkpoints/
    └── AAAA-MM-DD-checkpoint-NN-titulo-curto.md
```

## Convenção de checkpoints

Cada checkpoint é um snapshot do estado do projeto num momento relevante
(fim de uma fase, antes de uma decisão importante, marco de entrega etc.).

**Nome do arquivo:** `AAAA-MM-DD-checkpoint-NN-titulo-curto.md`

- `AAAA-MM-DD` — data de criação do checkpoint.
- `NN` — número sequencial, sempre com 2 dígitos (`01`, `02`, ...).
- `titulo-curto` — slug curto descrevendo o marco (ex.: `mvp-openai-streaming`).

**Conteúdo esperado em cada checkpoint:**

1. Visão geral do projeto (pode ser reaproveitada entre checkpoints)
2. Stack técnica no momento
3. Decisões tomadas desde o checkpoint anterior (e o motivo)
4. Estrutura relevante do repositório
5. O que foi construído/alterado (backend, frontend, infra)
6. Linha do tempo da evolução (o que mudou e por quê)
7. Estado atual do ambiente (o que está rodando, configurado, testado)
8. Pendências e próximos passos
9. Instruções para rodar o projeto naquele ponto

## Checkpoints existentes

| Data | Arquivo | Marco |
|---|---|---|
| 2026-07-22 | [`checkpoints/2026-07-22-checkpoint-01-mvp-openai-streaming.md`](./checkpoints/2026-07-22-checkpoint-01-mvp-openai-streaming.md) | MVP completo: scaffold, FAQ + cache Postgres, integração OpenAI (gpt-4o-mini), streaming de respostas, markdown, logo oficial |

## Quando criar um novo checkpoint

Peça para gerar um novo checkpoint sempre que:
- Uma fase significativa do desenvolvimento for concluída.
- Uma decisão arquitetural importante for tomada.
- For um bom momento para retomar o contexto em uma sessão futura.
