# 03 — Auditoria das turmas técnicas

Data da revisão: 17/09/2026.

## Problema investigado

Foi observado saldo aproximado de **-110 aulas** em turma técnica. O objetivo desta etapa foi verificar se havia realmente falta de lançamento ou se o desvio era produzido por uma referência curricular incorreta.

## Achado principal

Na versão anterior, os componentes técnicos `Sistemas de Energia Renovável III` e `Sistemas de Energia Renovável IV` receberam, sem documento comprobatório, a hipótese de **6 aulas semanais para cada componente**.

Essa hipótese gerava:

- 1º trimestre: referência 79 + 79 = 158 aulas; registrado = 62; saldo = -96;
- 2º trimestre: referência 82 + 82 = 164 aulas; registrado = 150; saldo = -14;
- consolidado: -96 + -14 = **-110**.

Portanto, o valor de -110 não pode ser tratado como prova de 110 aulas não ministradas ou não lançadas. Ele era consequência direta de uma distribuição semanal não documentada.

## Regra corrigida

Para os 2º anos de **Fabricação Mecânica** e **Sistemas de Energia Renovável**:

1. não inferir carga de componente técnico por analogia;
2. não usar automaticamente a coluna de 2º ano da matriz nova de 2026;
3. aguardar a matriz específica do Trilhas de Futuro nas Escolas/SENAI ou o horário homologado;
4. enquanto a fonte não estiver confirmada, exibir `sem referência` em vez de um falso déficit;
5. manter a jornada global apenas como controle de consistência da turma, não como distribuição automática entre componentes.

## Controle global

A jornada EMTI de 45 A/S pode ser usada apenas como verificação global proporcional:

| Turma | 1º tri registrado | Ref. global 45×66/5 | Dif. | 2º tri registrado | Ref. global 45×68/5 | Dif. |
|---|---:|---:|---:|---:|---:|---:|
| 2º Sistemas de Energia Renovável | 481 | 594 | -113 | 606 | 612 | -6 |
| 2º Fabricação Mecânica | 574 | 594 | -20 | 606 | 612 | -6 |

A proximidade do 2º trimestre com a referência global não autoriza distribuir automaticamente as aulas entre os componentes técnicos. O 1º trimestre de Sistemas de Energia Renovável continua sendo um ponto de investigação, mas sem atribuição causal até a conferência da matriz/horário e do funcionamento efetivo do curso naquele período.

## Consolidação de docentes

No consolidado 1º + 2º trimestre:

- turma + componente representa um único diário lógico;
- se houve troca de professor entre os trimestres, as aulas dos dois períodos são somadas;
- o professor responsável exibido é o docente atual do 2º trimestre;
- duplicidades idênticas no mesmo trimestre não são somadas duas vezes;
- se o próprio relatório atual trouxer dois nomes simultâneos para o mesmo diário, o sistema não escolhe arbitrariamente e mantém `A confirmar` até validação da escola.

## Pendência documental

Ainda é necessária a **matriz específica 2025 do Trilhas de Futuro nas Escolas/SENAI para Fabricação Mecânica e Sistemas de Energia Renovável**, ou o horário homologado dessas turmas. Até essa confirmação, qualquer carga automática por componente técnico seria uma estimativa e não deve ser usada para apontar déficit.
