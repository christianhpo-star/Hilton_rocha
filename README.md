# Nossa Turma, Nosso Compromisso — EE Professor Hilton Rocha

Código-fonte do WebApp em Google Apps Script usado no projeto escolar **Nossa Turma, Nosso Compromisso**.

## Arquivos

- `Code.gs` — backend do Apps Script: permissões, leitura da planilha, ocorrências, denúncias falsas, alunos e bonificações.
- `Index.html` — estrutura da interface.
- `Styles.html` — estilos da interface.
- `Scripts.html` — lógica executada no navegador.
- `Logo.html` — logomarca incorporada ao template.

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

Os dados de estudantes e usuários autorizados **não são versionados neste repositório**. Eles permanecem somente na planilha da escola.

## Publicação

Este repositório versiona o código-fonte. Um commit no GitHub, por si só, não atualiza uma implantação já publicada no Google Apps Script. Depois de sincronizar estes arquivos com o projeto Apps Script, publique uma nova versão do WebApp conforme o fluxo adotado pela escola.
