# Backend Architecture

## Escopo da Fase 2

O backend inicial usa NestJS e TypeScript para criar uma API modular, versionada e testavel. Ele nao conecta PostgreSQL, PostGIS, Redis ou fontes externas nesta fase.

## Rotas

- `GET /api/v1/health`: retorna status honesto da API.
- `GET /api/docs`: documentacao OpenAPI/Swagger.

## Modulos

- `HealthModule`: endpoint operacional sem status falso de dependencias futuras.
- `WeatherModule`: registra a abstracao `WeatherProvider` com implementacao `NoopWeatherProvider`.
- `AlertsModule`: registra a abstracao `OfficialAlertProvider` com implementacao que retorna lista vazia.
- `LocationsModule`: reserva o dominio de localizacoes monitoradas para fases futuras.

## Seguranca

- Helmet habilitado.
- CORS configuravel por `CORS_ORIGINS`; nao usa `*` como padrao.
- Rate limiting global via `@nestjs/throttler`.
- Payload limitado por `PAYLOAD_LIMIT`.
- Erros padronizados e sem stack trace para o cliente.
- Logs estruturados sem body, query sensivel ou localizacao precisa.

## Configuracao

Variaveis usadas:

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `API_VERSION`
- `LOG_LEVEL`
- `CORS_ORIGINS`
- `RATE_LIMIT_TTL_MS`
- `RATE_LIMIT_LIMIT`
- `PAYLOAD_LIMIT`

## Decisoes

- O backend fica em `backend/` como pacote independente para evitar migrar a web antes da hora.
- Swagger usa a biblioteca oficial `@nestjs/swagger`.
- `js-yaml` foi fixado em `5.3.0` via `overrides` para corrigir vulnerabilidade transitiva reportada pelo `npm audit`.
- Providers futuros existem como contratos, nao como integracoes reais.
