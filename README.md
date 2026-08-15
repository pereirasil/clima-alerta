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

Endpoints de notificacoes:

- `GET http://localhost:4000/api/v1/notifications/vapid-public-key`
- `POST http://localhost:4000/api/v1/notifications/subscriptions`
- `DELETE http://localhost:4000/api/v1/notifications/subscriptions/:id`
- `GET http://localhost:4000/api/v1/notifications/preferences`
- `PUT http://localhost:4000/api/v1/notifications/preferences`
- `POST http://localhost:4000/api/v1/notifications/test`

## Notificacoes Web Push

A Fase 6 implementa infraestrutura de notificacoes para Web Push, com fila Redis,
VAPID, preferencias persistidas e notification de teste. Ela nao implementa
alertas oficiais, terremotos, incendios, ciclones ou regras de emergencia.

Gere chaves VAPID localmente:

```bash
npx web-push generate-vapid-keys
```

Configure somente no backend:

```bash
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_SUBJECT=mailto:security@clima-alerta.local
```

`WEB_PUSH_VAPID_PRIVATE_KEY` nunca deve ser exposta no frontend. Em producao,
Web Push e Service Worker exigem HTTPS; `localhost` funciona para desenvolvimento.

Teste manual controlado:

1. `npm run infra:up`
2. `npm run db:migrate`
3. `npm run backend:dev`
4. `npm run dev`
5. Acesse `http://localhost:3000`.
6. Na secao Notificacoes, clique em `Ativar notificacoes`.
7. Aceite a permissao do navegador.
8. Clique em `Enviar notificacao de teste`.
9. Confirme que a notificacao recebida e de teste e abre o app ao clicar.

Privacidade: a subscription Web Push e armazenada criptografada; endpoint,
identidade anonima e user agent sao usados apenas como hashes. O usuario pode
desativar notificacoes pela propria interface. A retencao padrao de entregas e
30 dias.

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
