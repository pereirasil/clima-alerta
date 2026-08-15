# Plano de Desenvolvimento

## Fase 1 - Arquitetura inicial

- Documentar arquitetura recomendada, stack, fontes de dados, seguranca, privacidade e estrategia de alertas.
- Substituir a tela padrao por uma tela de status do produto.
- Criar `.env.example` sem secrets.
- Validar lint/build da base web.

## Fase 2 - Backend

- Criar aplicacao NestJS.
- Implementar modulos base, health checks, configuracao, validacao e testes.
- Status: implementada nesta etapa com API versionada, Swagger, tratamento global de erros, Helmet, CORS configuravel, rate limiting e providers abstratos sem chamadas externas.

## Fase 3 - Banco

- Adicionar PostgreSQL, PostGIS, migracoes e entidades iniciais.
- Status: implementada com Docker Compose, migrations SQL, Drizzle ORM, health checks de banco/Redis e abstracao de cache.

## Fase 4 - Primeira fonte meteorologica

- Criar abstracao `WeatherProvider`.
- Integrar uma fonte revisada e documentada.
- Implementar cache Redis e teste de indisponibilidade.

## Fases seguintes

5. Previsao do tempo.
6. Localizacao.
7. Mapa.
8. Motor de alertas.
9. Notificacoes.
10. Terremotos detectados.
11. Tempestades/ciclones.
12. Incendios.
13. Demais fontes.
14. Painel administrativo.
15. Testes ampliados.
16. Hardening de seguranca.
17. Deploy.
