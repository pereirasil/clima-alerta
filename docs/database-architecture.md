# Database Architecture

## Escopo

A Fase 3 adiciona PostgreSQL com PostGIS como fundacao geoespacial. Nao ha seeds de providers, usuarios reais ou dados meteorologicos reais.

## Escolha do client

Escolha: Drizzle ORM + `pg` + migrations SQL proprias.

Motivos:

- Drizzle oferece schema TypeScript tipado e suporte direto a `geometry` do PostGIS.
- Prisma ainda representa tipos geograficos/PostGIS como `Unsupported`, exigindo mais raw SQL para fluxos centrais.
- TypeORM tem boa integracao NestJS, mas Drizzle mantem o acesso tipado com menos decoradores e menor acoplamento.
- `drizzle-kit` foi evitado porque o audit apontou vulnerabilidades moderadas transitivas; as migrations SQL proprias mantem controle e audit limpo.

## Modelos iniciais

- `data_sources`: fontes externas futuras, sem popular registros automaticamente.
- `locations`: coordenadas genericas e cidade/estado/pais opcionais, sem associar a identidade de usuario.
- `weather_snapshots`: snapshots controlados para fases futuras, sem historico infinito definido.
- `natural_events`: eventos naturais detectados futuramente.
- `official_alerts`: alertas oficiais separados de previsoes e eventos detectados.

## PostGIS

A migration `0001_initial_postgis_schema.sql` executa:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Campos geograficos usam SRID 4326 e indices GiST onde consultas espaciais futuras fazem sentido.

## Migrations

```bash
npm run db:migrate
npm run db:status
```

As migrations aplicadas ficam registradas na tabela `schema_migrations`.

## Ambiente local

```bash
npm run infra:up
npm run db:migrate
```

O backend roda fora do Docker durante desenvolvimento. O Docker Compose sobe apenas PostgreSQL/PostGIS e Redis.

## Reset local

Para destruir dados locais de desenvolvimento:

```bash
npm run infra:down
docker volume rm clima-alerta_clima_alerta_postgres_data clima-alerta_clima_alerta_redis_data
```

Esse reset remove dados locais. Nao use em ambientes compartilhados.
