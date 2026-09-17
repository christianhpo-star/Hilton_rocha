# 03 — Auditoria das turmas técnicas de 2º ano

Data da revisão: 17/09/2026.

## Problema investigado

Foi observado saldo de aproximadamente **-110 aulas** no 2º ano de Sistemas de Energia Renovável. A auditoria separou duas questões:

1. a hipótese de 6 A/S em SER III + 6 A/S em SER IV reproduz o valor? **Sim**;
2. existe fonte oficial localizada que prove 6 A/S para cada um desses dois componentes na turma atual? **Não**.

Por isso a hipótese 6+6 foi retirada do cálculo automático. Isso não significa que a anomalia do 1º trimestre tenha desaparecido.

## Controle global sem inventar a divisão técnica

A jornada total do EMTI permite um controle de integridade de **45 A/S** sem decidir quantas aulas pertencem a III ou IV.

| Turma | T1 registrado | Ref. global T1 (45×66/5) | Dif. | T2 registrado | Ref. global T2 (45×68/5) | Dif. |
|---|---:|---:|---:|---:|---:|---:|
| 2º Sistemas de Energia Renovável | 481 | 594 | **-113** | 606 | 612 | -6 |
| 2º Fabricação Mecânica | 574 | 594 | -20 | 606 | 612 | -6 |

O ponto importante é que o T1 do 2º SER apresenta **-113 no total da turma**, número muito próximo do saldo de ~110 que motivou a investigação, agora sem depender da hipótese 6+6.

## Localização da diferença dentro dos dados

A própria planilha permite separar os dois componentes técnicos agregados dos demais componentes:

| Recorte | 2º SER | 2º Fabricação | SER − Fabricação |
|---|---:|---:|---:|
| T1 — técnico III + IV | 62 | 162 | **-100** |
| T1 — demais componentes | 419 | 412 | **+7** |
| T2 — técnico III + IV | 150 | 168 | -18 |
| T2 — demais componentes | 456 | 438 | +18 |

### Leitura

No 1º trimestre, os componentes não técnicos das duas turmas são praticamente equivalentes: 419 no SER e 412 na Fabricação. Já o bloco técnico do SER tem 62 registros, contra 162 na Fabricação.

A diferença comparativa de **100 aulas está concentrada no bloco técnico**. Isso é evidência forte de que a investigação deve se concentrar no início, cronograma ou lançamento das aulas técnicas de Sistemas de Energia Renovável.

## O que ainda não pode ser afirmado

Os dados acima **não provam** que faltaram exatamente 100, 110 ou 113 aulas ministradas. Eles provam uma diferença de registros e localizam onde ela aparece.

Para concluir a quantidade normativa por componente, falta uma destas fontes:

1. plano/matriz de execução SENAI/TFE da coorte 2025-2027;
2. horário homologado do 2º SER no T1/T2;
3. cronograma do SENAI com data de início e carga dos blocos III/IV.

## Hipóteses operacionais que devem ser conferidas

- início técnico posterior ao início do trimestre;
- diferença de cronograma entre Fabricação e SER;
- aula prática em calendário específico do SENAI;
- lançamento incompleto no DED no T1;
- regularização posterior no T2.

Essas hipóteses são perguntas de auditoria, não conclusões.

## Evidência do 2º trimestre

No T2, ambas as turmas totalizam **606 aulas**, muito próximas da referência global proporcional de 612. Isso reforça a necessidade de investigar especificamente o histórico do T1 do SER, e não classificar toda a oferta técnica como estruturalmente subdimensionada.

## Regra implementada no painel

1. nenhuma carga técnica de III/IV é inferida por analogia;
2. o antigo `-110` não aparece como déficit curricular confirmado;
3. a anomalia global do T1 continua visível;
4. o painel mostra a decomposição técnico x demais componentes;
5. o cálculo por componente técnico só será habilitado após fonte específica.

## Docentes

A consolidação continua usando um único diário lógico por turma + componente. Troca de professor entre T1 e T2 preserva as aulas de ambos os períodos, mas o responsável exibido é o docente atual do T2. Duplicidades simultâneas no relatório atual não são somadas duas vezes e ficam `A confirmar` quando a escola precisa escolher o responsável.
