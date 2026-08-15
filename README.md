# Clima Alerta

Plataforma em desenvolvimento para monitoramento meteorologico, eventos naturais e alertas preventivos baseados em localizacao.

Este projeto trata informacoes que podem influenciar decisoes de seguranca. Por isso, a regra central e simples: o sistema nao deve inventar dados, alertas, fontes ou grau de confiabilidade.

## Status

Fase atual: **Fase 3.5 + Fase 4 - infraestrutura local validavel e primeiro clima real**.

O repositorio contem web Next.js, backend NestJS, infraestrutura local para PostgreSQL/PostGIS e Redis, e integracao inicial com Open-Meteo via backend. Mobile, workers, notificacoes e alertas oficiais ainda nao foram implementados.

## Principios de seguranca

- Diferenciar previsao, observacao, deteccao e alerta oficial.
- Exibir fonte, horario, validade e confiabilidade quando houver dados.
- Nao apresentar previsao como alerta oficial.
- Nao prometer previsao de terremotos ou de desastres com exatidao.
- Usar consentimento explicito para localizacao.
- Nao armazenar historico de localizacao sem necessidade.
- Nunca expor API keys ou secrets no frontend.

## Stack recomendada

- Web: Next.js, React, TypeScript e Tailwind CSS.
- Mobile: React Native com Expo e TypeScript.
- Backend: NestJS, Node.js e TypeScript.
- Banco: PostgreSQL com PostGIS.
- Cache e filas: Redis.
- Infra: Docker, ambientes de desenvolvimento, staging e producao.
- Testes: unitarios, integracao, API, regras do motor de alertas e E2E para fluxos criticos.

## Documentacao

- [Arquitetura da Fase 1](./docs/phase-1-architecture.md)
- [Fontes de dados recomendadas](./docs/data-sources.md)
- [Plano de desenvolvimento](./docs/development-plan.md)

## Desenvolvimento web

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Desenvolvimento backend

```bash
npm --prefix backend run start:dev
```

Endpoints da Fase 2:

- `GET http://localhost:4000/api/v1/health`
- `GET http://localhost:4000/api/v1/health/live`
- `GET http://localhost:4000/api/v1/health/ready`
- `GET http://localhost:4000/api/docs`

Endpoints de clima real:

- `GET http://localhost:4000/api/v1/weather/current?latitude=-22.9068&longitude=-43.1729`
- `GET http://localhost:4000/api/v1/weather/hourly?latitude=-22.9068&longitude=-43.1729`
- `GET http://localhost:4000/api/v1/weather/daily?latitude=-22.9068&longitude=-43.1729`

## Infraestrutura local

```bash
npm run infra:up
npm run db:migrate
npm run db:status
npm run backend:test:infra
npm run test:weather:integration
npm run infra:down
```

`backend:test:infra` executa testes reais de PostGIS e Redis quando `CLIMA_ALERTA_RUN_INFRA_TESTS=true` estiver definido.

Docker e opcional. Em producao, configure banco/cache externos por variaveis de ambiente (`DATABASE_URL`, `REDIS_URL`, TLS/SSL quando aplicavel) e restrinja `CORS_ORIGINS`.

## Verificacao

```bash
npm run lint
npm test
npm run build
npm --prefix backend run lint
npm --prefix backend run test:e2e
npm --prefix backend run test:infra
npm --prefix backend run build
npm --prefix backend audit
```
