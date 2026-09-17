# Nossa Turma, Nosso Compromisso — EE Professor Hilton Rocha

Código-fonte do WebApp em Google Apps Script usado no projeto escolar **Nossa Turma, Nosso Compromisso**.

## Estrutura

- `Core.gs` — autenticação, permissões, utilitários e migração segura da planilha.
- `DataService.gs` — leitura e montagem dos dados enviados ao WebApp.
- `Occurrences.gs` — envio de denúncias, limite diário, idempotência e correções de ocorrências aprovadas.
- `ReviewService.gs` — aprovação, negativa e classificação de denúncia falsa pela EEB/Gestão.
- `Management.gs` — estudantes, representantes e bonificações.
- `Index.html` / `Styles.html` — estrutura e design-base da interface.
- `StylesExperience.html` — camada visual da experiência moderna, mobile e home.
- `HomeView.html` — início personalizado com resumo da turma e feed.
- `MobileNav.html` — navegação inferior para celular.
- `DecisionModal.html` — modal de decisão pedagógica da EEB/Gestão.
- `Nav.html` e demais `*View.html` — componentes visuais por módulo.
- `ClientCore.html`, `ClientOccurrences.html`, `ClientReview.html`, `ClientRanking.html`, `ClientHistory.html` e `ClientBonus.html` — lógica do navegador modularizada por responsabilidade.
- `ClientExperience.html`, `ClientModal.html`, `ClientFeedback.html` e `ClientPolish.html` — dashboard, identidade das turmas, modal, microfeedback e refinamentos responsivos.

## Fluxo das denúncias

1. O representante envia a denúncia.
2. A denúncia entra na aba `Fila_Denuncias` com status **PENDENTE**.
3. Enquanto estiver pendente, **nenhum ponto é descontado**.
4. EEB/Gestão pode:
   - **APROVAR** — cria uma ocorrência em `Historico_Ocorrencias` e passa a contar no ranking;
   - **NEGAR** — mantém o registro para auditoria, sem alterar pontos;
   - marcar como **FALSA** — não entra no ranking e, quando aplicável, desconta **1 ponto da turma do denunciante**.
5. O representante consegue acompanhar o status das próprias denúncias sem visualizar denúncias de outros representantes.

## Regras e proteções

- **Uma denúncia ativa por estudante/dia/critério.** Critérios diferentes continuam permitidos.
- A checagem considera denúncias pendentes e ocorrências já aprovadas.
- `LockService` e `requestId` idempotente evitam duplicidades inclusive em requisições concorrentes.
- O ranking usa somente `Historico_Ocorrencias`, portanto denúncias pendentes ou negadas nunca alteram o placar.
- Funções administrativas dependem do perfil da aba `Permissoes`; apenas possuir e-mail institucional não concede acesso de EEB/Gestão.
- Denúncias falsas ficam registradas em `Historico_Denuncias_Falsas` para auditoria.

## Migração automática da planilha

Ao abrir o WebApp com esta versão, o código preserva os dados existentes e acrescenta somente o necessário:

- colunas `ID Requisição` e `Turma Registrador` em `Historico_Ocorrencias`, caso ainda não existam;
- aba `Fila_Denuncias` com status e dados de revisão;
- aba `Historico_Denuncias_Falsas`, caso ainda não exista.

Os dados de estudantes e usuários autorizados **não são versionados neste repositório público**. Eles permanecem somente na planilha da escola.

## Interface desta revisão

A experiência foi redesenhada para que a plataforma seja percebida como um aplicativo de acompanhamento da competição, e não somente como uma ferramenta de denúncia.

### Estudantes e representantes

- nova tela **Início**, com posição, pontuação, distância para a próxima colocação e denúncias pendentes;
- identidade visual própria para cada turma, com símbolo e cor usados na home e no ranking;
- feed de acontecimentos recentes sem exposição de nomes de estudantes;
- navegação inferior fixa no celular com `Início`, `Enviar`, `Ranking`, `Destaques` e `Regras`;
- fluxo visual `Você envia → EEB analisa → Ranking atualiza`;
- acompanhamento das próprias denúncias com status visual;
- cards de critérios maiores e adequados ao uso no celular;
- feedback visual e vibração curta em dispositivos compatíveis após ações importantes;
- skeletons de carregamento para evitar telas vazias durante a sincronização.

### EEB e Gestão

- home adaptada para mostrar a fila pedagógica geral;
- atalho flutuante da fila de revisão no celular, com contador de pendências;
- decisões de **aprovar, negar ou classificar como falsa** em modal contextual;
- antes da confirmação, o modal explica o impacto da decisão sobre o ranking e a penalidade;
- histórico e auditoria continuam separados das denúncias pendentes.

## Publicação

O GitHub versiona o código-fonte, mas não altera sozinho uma implantação já publicada no Google Apps Script. Após sincronizar estes arquivos com o projeto Apps Script correspondente, é necessário publicar uma nova versão do WebApp para colocar as mudanças em produção.
