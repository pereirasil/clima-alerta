# Clima Alerta - Arquitetura Recomendada

## Decisoes da Fase 1

O projeto deve evoluir como um monorepo, mas a migracao fisica para `web/`, `mobile/`, `backend/` e `packages/` deve acontecer de forma controlada quando cada aplicacao for criada. A base atual permanece como a aplicacao web em Next.js para evitar churn prematuro.

## Stack definitiva

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Web | Next.js, React, TypeScript, Tailwind CSS | Interface responsiva, SSR quando fizer sentido e boa experiencia de desenvolvimento. |
| Mobile | React Native, Expo, TypeScript | Entrega iOS/Android com permissoes de localizacao e notificacoes push. |
| API | NestJS, Node.js, TypeScript | Modularidade, DI, validacao, testes e organizacao para dominio complexo. |
| Banco | PostgreSQL + PostGIS | Persistencia transacional e consultas geograficas. |
| Cache/Fila | Redis | Cache de dados externos, cooldown, deduplicacao e jobs. |
| Infra | Docker + CI/CD | Ambientes reprodutiveis e promocao segura entre dev, staging e producao. |

## Estrutura alvo

```text
clima-alerta/
├── web/
├── mobile/
├── backend/
├── packages/
│   ├── types/
│   └── shared/
├── docker/
├── docs/
└── README.md
```

## Modulos do backend

- `weather`: previsao, observacoes e normalizacao meteorologica.
- `alerts`: alertas oficiais, alertas derivados por regra, ciclo de vida e deduplicacao.
- `locations`: consentimento, favoritos, geocodificacao e regioes monitoradas.
- `events`: terremotos detectados, incendios, enchentes, ciclones e outros eventos naturais.
- `sources`: cadastro, licenca, status, confiabilidade e kill switch de fontes.
- `notifications`: preferencias, push tokens, cooldown e deep links.
- `users`: identidade, dispositivos, preferencias e exclusao de dados.
- `health`: saude de API, filas, providers e notificacoes.

## Estrategia de alertas

O motor de alertas deve receber dados externos normalizados e executar:

```text
ingestao -> validacao -> area afetada -> proximidade do usuario -> severidade
-> deduplicacao -> cooldown -> atualizacao/cancelamento/expiracao -> notificacao
```

Regras essenciais:

- `ALERTA OFICIAL` so aparece quando a fonte for uma autoridade reconhecida.
- Previsao meteorologica nao vira alerta oficial.
- Eventos sismicos sao deteccoes, nunca previsoes.
- Dados expirados podem aparecer apenas com rotulo de desatualizacao.
- Alertas devem ter fonte, validade, area, severidade, status e recomendacoes.

## Localizacao

- Solicitar permissao com explicacao clara de finalidade.
- Permitir cidade manual e locais favoritos sem geolocalizacao ativa.
- Armazenar apenas o necessario para monitoramento configurado.
- Evitar historico preciso de deslocamento.
- Permitir revogacao e exclusao de dados.

## Notificacoes

- Usar Expo Notifications no mobile e um servico backend para orquestracao.
- Separar preferencias por tipo e severidade.
- Aplicar cooldown por usuario, local, fonte e evento.
- Usar alta prioridade apenas para risco real, fonte confiavel e contexto permitido.
- Registrar envio, falha, abertura e expiracao sem expor localizacao sensivel em logs.

## Banco de dados

Entidades iniciais:

- usuarios, dispositivos, preferencias e consentimentos.
- localizacoes monitoradas e favoritos.
- fontes, status de fontes e politicas de cache.
- alertas, eventos, areas geograficas e historico de ciclo de vida.
- notificacoes e tentativas de envio.

PostGIS deve ser usado para poligonos de area afetada, busca por distancia e interseccao com locais monitorados.

## Seguranca e LGPD

- Secrets apenas em variaveis de ambiente do backend.
- Validacao de entrada em todos os endpoints.
- Rate limiting e protecao contra abuso.
- Logs estruturados com minimizacao de dados pessoais.
- Retencao definida por tipo de dado.
- Direito de exclusao, exportacao e revogacao de consentimento.
- Revisao de termos/licencas antes de ativar qualquer fonte.
