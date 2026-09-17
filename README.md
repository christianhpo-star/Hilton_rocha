# Nossa Turma, Nosso Compromisso — EE Professor Hilton Rocha

Código-fonte do WebApp em Google Apps Script usado no projeto escolar **Nossa Turma, Nosso Compromisso**.

## Estrutura

- `Core.gs` — autenticação, permissões, utilitários e migração segura da planilha.
- `DataService.gs` — leitura e montagem dos dados enviados ao WebApp.
- `Occurrences.gs` — registro, limite diário, idempotência, anulação e denúncia falsa.
- `Management.gs` — estudantes, representantes e bonificações.
- `Index.html` / `Styles.html` — estrutura e estilos.
- `Nav.html` e `*View.html` — componentes visuais por módulo.
- `ClientCore.html` — lógica do navegador; arquivos `Client*.html` ficam reservados para modularização incremental.

## Regras implementadas nesta revisão

1. **Anulação restaura a pontuação da turma.** O ranking é calculado a partir das ocorrências ativas; ao anular, a ocorrência deixa de participar do cálculo.
2. **Limite diário por estudante e critério.** O mesmo estudante não pode receber duas ocorrências do mesmo critério no mesmo dia. Critérios diferentes continuam permitidos.
3. **Denúncia falsa.** EEB/Gestão pode marcar uma ocorrência como falsa. A ocorrência é retirada da pontuação da turma denunciada, fica registrada em auditoria e gera penalidade de **1 ponto** para a turma de origem do representante que realizou a denúncia, quando aplicável.
4. **Proteção contra duplicidade.** O backend usa `LockService`, `requestId` idempotente e a regra diária, evitando duplicidades inclusive em requisições concorrentes.
5. **Atualização mais rápida.** Após registrar, anular ou marcar denúncia falsa, a interface atualiza o estado local imediatamente, sem recarregar todos os dados da planilha.
6. **Permissões endurecidas.** Funções de EEB/Gestão dependem do perfil cadastrado na aba `Permissoes`; apenas possuir e-mail institucional não concede privilégios administrativos.

## Migração automática da planilha

Ao executar o WebApp, o código mantém os dados existentes e acrescenta apenas o necessário:

- colunas `ID Requisição` e `Turma Registrador` em `Historico_Ocorrencias`;
- aba `Historico_Denuncias_Falsas` para auditoria.

Os dados de estudantes e usuários autorizados **não são versionados neste repositório público**. Eles permanecem somente na planilha da escola.

## Publicação

O GitHub versiona o código-fonte, mas não altera sozinho uma implantação já publicada no Google Apps Script. Após sincronizar estes arquivos com o projeto Apps Script correspondente, é necessário publicar uma nova versão do WebApp para colocar as mudanças em produção.
