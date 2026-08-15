# Cache Architecture

## Escopo

Redis foi adicionado como infraestrutura de cache para fases futuras. Nao ha cache de previsao real nesta fase.

## Abstracao

O restante da aplicacao deve usar `CacheService`, nao o client Redis diretamente.

Operacoes iniciais:

- `get`
- `set`
- `delete`
- `exists`

## TTL

`set` exige TTL explicito em segundos. Isso evita cache indefinido para dados meteorologicos ou alertas futuros.

## Chaves

Padrao:

```text
clima-alerta:weather:{lat}:{lon}
clima-alerta:event:{provider}:{externalId}
clima-alerta:alerts:{region}
```

As chaves nao devem conter tokens, emails, enderecos completos ou dados pessoais sensiveis.

## Serializacao

O cache usa JSON. Dados recuperados passam por funcao de validacao fornecida pelo chamador; JSON invalido ou dado fora do contrato retorna `null`.

## Falha do Redis

Operacoes de cache sao fail-open nesta fase:

```text
Redis indisponivel -> log estruturado -> retorna miss/falha booleana
```

Funcionalidades criticas futuras devem avaliar se fail-open e seguro para cada caso.
