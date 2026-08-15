# Fontes de Dados Recomendadas

Esta lista e uma avaliacao inicial. Antes de producao, cada fonte precisa de revisao juridica, teste de disponibilidade, medicao de latencia e validacao dos termos atualizados.

| Fonte | Uso | Cobertura | Gratuita | API key | Limitacoes principais |
| --- | --- | --- | --- | --- | --- |
| Open-Meteo | Previsao, variaveis horarias/diarias, ar e modelos meteorologicos | Global | Sim para uso nao comercial; planos para uso comercial/alto volume | Nao para uso basico | Nao e autoridade de alerta oficial; exige atribuicao e cuidado com limites de uso. |
| NWS Alerts API | Alertas oficiais CAP/JSON-LD | Estados Unidos | Sim | Nao | Cobertura focada nos EUA; nao substitui fontes locais fora da area NWS. |
| USGS Earthquake GeoJSON | Terremotos detectados por rede sismica | Global, com forte cobertura USGS | Sim | Nao | Informa eventos detectados, nao previsao; magnitude/localizacao podem ser revisadas. |
| NASA FIRMS | Focos de incendio por satelite | Global | Sim com cadastro/chave para alguns endpoints | Sim em endpoints de API | Deteccao por satelite pode ter falsos positivos, atraso e limitacoes por nuvens/sensor. |
| OpenAQ | Qualidade do ar agregada de fontes publicas | Global parcial | API publica, com chave em v3 | Sim | Cobertura irregular; cada dado pode ter termos da fonte original. |
| INMET / dados oficiais Brasil | Observacoes, previsoes e avisos oficiais do Brasil quando disponiveis por canal publico | Brasil | Depende do servico | Depende do servico | Necessita validar endpoints, termos e estabilidade operacional antes da integracao. |

## Politica de uso

- Fontes oficiais tem prioridade sobre agregadores.
- Cada provider deve declarar licenca, cobertura, TTL, confiabilidade e tipo de dado.
- Nenhum provider deve ser chamado diretamente pela UI.
- A API interna deve normalizar os dados e preservar a fonte original.
- Quando uma fonte falhar, o produto deve mostrar indisponibilidade em vez de promover cache antigo como atual.

## URLs de referencia

- Open-Meteo: https://open-meteo.com/
- NWS Alerts: https://www.weather.gov/documentation/services-web-alerts
- USGS Earthquake GeoJSON: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/web-services/
- OpenAQ: https://docs.openaq.org/
