# 04 — Histórico da auditoria DED em Foco

Data: 17/09/2026.

## Passo 1 — separar modalidade e série

Confirmado na base: 9 turmas, sendo 3 REG/NOITE e 6 INT/INTEGRAL. O cálculo não compartilha uma única matriz entre esses grupos.

## Passo 2 — revisar a escolha da matriz

A regra foi refinada para combinar **norma geral vigente + regra oficial de transição**.

- Resolução SEE nº 5.212/2025: norma geral das matrizes de 2026; art. 54 revoga formalmente a 5.084/2024 em 01/01/2026.
- Formação oficial SEE/MG/SRE-C de 03/06/2026: regra operacional específica — turmas iniciadas em 2025 seguem 5.084/2024 do 2º ao 3º; turmas iniciadas em 2026 seguem 5.212/2025.

As duas evidências são registradas. O painel segue a instrução específica de continuidade para as turmas em andamento, até eventual ato posterior da SEE/MG.

## Passo 3 — investigar o saldo técnico de ~110

O cenário 6 A/S + 6 A/S reproduz -110, mas essa distribuição não possui fonte localizada. A hipótese foi retirada do cálculo oficial.

A auditoria global encontrou, independentemente dessa hipótese:

- 2º SER T1: 481 x 594 = **-113**;
- 2º Fabricação T1: 574 x 594 = -20.

## Passo 4 — localizar a diferença

Decomposição T1:

- técnico SER III+IV = 62;
- técnico Fabricação III+IV = 162;
- diferença técnica comparativa = **-100**;
- demais componentes SER = 419;
- demais componentes Fabricação = 412;
- diferença dos demais = +7.

Conclusão: a anomalia está concentrada no bloco técnico do SER no T1, mas a quantidade normativa de III/IV continua pendente de fonte SENAI/horário.

## Passo 5 — revisar o calendário

O calendário estadual fornecido possui 200 dias-alvo, com 66/68/66 por trimestre e sábados letivos de 27/06 e 12/09.

08/12 é feriado municipal em Belo Horizonte. O sistema não reduz a obrigação para 199; registra **199 datas localizadas + 1 dia pendente de recomposição homologada**.

## Passo 6 — validar responsabilidade docente

- turma + componente = um diário lógico;
- troca entre T1/T2: responsável atual = docente do T2;
- duplicidade idêntica: contagem única;
- dois nomes simultâneos no T2: responsável fica `A confirmar`.

## Passo 7 — validar tecnicamente o HTML

A versão local foi testada em Chromium/Playwright:

- 10 telas abertas;
- carregamento inicial: 171 registros / 24 docentes / 9 turmas;
- reimportação das planilhas T1 e T2 preservou a mesma base lógica;
- recomposição em sessão de teste levou o 3º trimestre de 65/66 para 66/66;
- erros JavaScript/console: **0**.

O HTML preenchido não é publicado neste repositório porque o repositório é público e o arquivo contém dados internos/nomes de docentes.

## Passo 8 — cruzar evidência contemporânea do fechamento

Foi localizado relatório de visita pedagógica de 26/05/2026. O documento registra que ainda havia **duas turmas pendentes no DED+ por questões com o SENAI e troca de professores**, em processo de regularização.

A evidência é temporalmente coerente com a anomalia do T1, mas o relatório não identifica quais eram as duas turmas. Portanto, não se atribui automaticamente essa pendência ao 2º SER.

A versão local do painel passou a mostrar essa evidência com a ressalva acima e foi novamente testada: 171 registros / 24 docentes / 9 turmas, zero erros JavaScript.

## Branch e PR

- branch: `audit/ded-em-foco-curriculo-2026`;
- PR: `#1 — Auditoria DED em Foco — matrizes e calendário 2026`;
- estado: rascunho.

## Commits principais

Início da auditoria:

- `2df83ef` — critério inicial de matriz;
- `d7b0940` — calendário local;
- `3e67a98` — investigação inicial do saldo técnico;
- `d7887bb` — histórico inicial.

Refinamento:

- `636d30e` — registra conflito normativo e regra de transição EMTI;
- `2d110e7` — corrige 199 datas localizadas x meta legal de 200;
- `75bff13` — localiza diferença de 100 aulas no bloco técnico do 2º SER;
- `c91bfd9` — consolida histórico e testes;
- `3b8e609` — registra regressão Chromium/Playwright;
- `a5e473d` — registra evidência operacional de pendências SENAI no fechamento do T1.

## Gates antes de concluir o PR

- [ ] obter plano/horário SENAI/TFE do 2º ano;
- [ ] confirmar data homologada da recomposição de 08/12;
- [x] executar validação sintática;
- [x] executar regressão em navegador;
- [x] cruzar evidência contemporânea de fechamento;
- [x] manter dados nominais fora do repositório público;
- [ ] revisar novamente o PR depois das duas pendências documentais.
