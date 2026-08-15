# Clima Alerta API

Backend do Clima Alerta. A Fase 3.5/4 mantém PostgreSQL, PostGIS, Redis, migrations e health checks, e adiciona o primeiro provider meteorologico real via Open-Meteo.

## Comandos

```bash
npm install
npm run start:dev
npm run lint
npm test
npm run test:e2e
npm run test:infra
npm run build
npm audit
```

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/weather/current?latitude=-22.9068&longitude=-43.1729`
- `GET /api/v1/weather/hourly?latitude=-22.9068&longitude=-43.1729`
- `GET /api/v1/weather/daily?latitude=-22.9068&longitude=-43.1729`
- `GET /api/docs`

## Variaveis de ambiente

Veja `.env.example`. Somente variaveis usadas nesta fase foram adicionadas.

## Banco e cache

```bash
npm run db:migrate
npm run db:status
```

Docker Compose é opcional. Em macOS local, PostgreSQL/PostGIS e Redis podem rodar via Homebrew. Em producao, use `DATABASE_URL` e `REDIS_URL`, com `DATABASE_SSL=true` e/ou `REDIS_TLS=true` quando o provedor exigir TLS.

Use o Docker Compose da raiz se ele estiver disponivel no ambiente:

```bash
npm run infra:up
```

Para testes reais de infraestrutura:

```bash
CLIMA_ALERTA_RUN_INFRA_TESTS=true npm run test:infra
```

O Redis participa da readiness como `redis: up|down`. Para consultas de clima, o cache falha aberto: falhas de leitura/escrita no Redis sao registradas e a API tenta o provider meteorologico real.

## Weather

O provider padrao e `WEATHER_PROVIDER=open-meteo`. A API usa o endpoint `/v1/forecast` do Open-Meteo com `timezone=auto`, `temperature_unit=celsius`, `wind_speed_unit=kmh` e `precipitation_unit=mm`.

Teste unitario normal:

```bash
npm test
```

Teste real do provider externo:

```bash
npm run test:weather:integration
```

## Limites atuais

- Ha integracao meteorologica com Open-Meteo. INMET, NWS, USGS, NASA FIRMS e OpenAQ ainda nao foram integrados.
- Nao ha autenticacao de usuarios.
- Nao ha motor real de alertas nem notificacoes push.
