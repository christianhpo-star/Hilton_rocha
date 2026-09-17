# Nossa Turma, Nosso Compromisso — EE Professor Hilton Rocha

Código-fonte do WebApp em Google Apps Script usado no projeto escolar **Nossa Turma, Nosso Compromisso**.

## Estrutura

- `Core.gs` — autenticação, permissões, utilitários e migração segura da planilha.
- `DataService.gs` — leitura e montagem dos dados enviados ao WebApp.
- `Occurrences.gs` — envio de denúncias, limite diário, idempotência e correções de ocorrências aprovadas.
- `ReviewService.gs` — aprovação, negativa e classificação de denúncia falsa pela EEB/Gestão.
- `Management.gs` — estudantes, representantes e bonificações.
- `Index.html` / `Styles.html` — estrutura e design da interface.
- `Nav.html` e `*View.html` — componentes visuais por módulo.
- `ClientCore.html`, `ClientOccurrences.html`, `ClientReview.html`, `ClientRanking.html`, `ClientHistory.html` e `ClientBonus.html` — lógica do navegador modularizada por responsabilidade.

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

A interface do estudante foi reformulada para reforçar o caráter pedagógico do processo:

- linguagem de **envio para análise**, em vez de punição imediata;
- fluxo visual `Você envia → EEB analisa → Ranking atualiza`;
- acompanhamento das próprias denúncias com status visual;
- cards de critérios maiores e mais adequados ao uso no celular;
- feedback por notificações discretas em vez de depender apenas de `alert()`;
- navegação e ranking com visual mais moderno e responsivo;
- painel EEB com fila e contador de pendências.

## Publicação

O GitHub versiona o código-fonte, mas não altera sozinho uma implantação já publicada no Google Apps Script. Após sincronizar estes arquivos com o projeto Apps Script correspondente, é necessário publicar uma nova versão do WebApp para colocar as mudanças em produção.
