# Sincronização GitHub → Google Apps Script

Este repositório está vinculado ao projeto Apps Script da EE Professor Hilton Rocha pelo arquivo `.clasp.json`.

## Princípios de segurança

- O ID do script pode ficar versionado; ele identifica o projeto, mas não concede acesso.
- Credenciais Google nunca devem ser commitadas.
- O secret `CLASPRC_JSON` deve existir apenas em GitHub Actions → Secrets.
- O workflow é manual: nenhum `push` ao GitHub publica código automaticamente no Apps Script.
- A sincronização atualiza o código, mas não cria versão e não altera deployment do Web App.
- Antes de enviar, o workflow puxa o projeto Apps Script atual e preserva o `appsscript.json` remoto.
- Arquivos que existirem somente no Apps Script são preservados e apenas aparecem como aviso no log.

## Autorização única

### 1. Habilitar a Apps Script API

Na conta Google que é proprietária ou editora do projeto, abra:

`https://script.google.com/home/usersettings`

Ative **Google Apps Script API**.

### 2. Gerar a credencial do clasp no computador

É necessário Node.js 22 ou superior. No PowerShell:

```powershell
node --version
npx -y @google/clasp@3.4.1 login
```

O comando abre o navegador para a autorização Google. Autorize usando uma conta que tenha acesso de edição ao projeto Apps Script.

Depois, confirme que o arquivo foi criado:

```powershell
Test-Path "$HOME\.clasprc.json"
```

Para copiar o conteúdo para a área de transferência sem exibi-lo no terminal:

```powershell
Get-Content "$HOME\.clasprc.json" -Raw | Set-Clipboard
```

**Não envie esse conteúdo por chat e não faça commit dele.** Ele contém credenciais OAuth.

### 3. Criar o secret no GitHub

No repositório:

1. **Settings**
2. **Secrets and variables**
3. **Actions**
4. **New repository secret**
5. Nome: `CLASPRC_JSON`
6. Cole o conteúdo copiado de `.clasprc.json`
7. Salve

O repositório pode ser público; GitHub Actions Secrets não são publicados junto com o código.

## Usar a integração

Abra **Actions → Sincronizar Apps Script → Run workflow**.

### Primeiro teste

Escolha:

- Operação: `validar`
- Confirmação: deixe em branco

Essa opção acessa o Apps Script, puxa o projeto e mostra os arquivos que seriam considerados, mas **não envia nada**.

### Sincronizar código

Depois que a validação passar:

- Operação: `sincronizar`
- Confirmação: `SINCRONIZAR`

O workflow:

1. baixa o projeto Apps Script atual;
2. preserva o `appsscript.json` atual;
3. preserva arquivos remotos extras;
4. sobrepõe os `.gs` e `.html` existentes no GitHub;
5. executa `clasp push`;
6. não cria versão/deployment.

## Publicar a alteração no Web App

Depois da sincronização, o código já estará no editor Apps Script, mas o Web App publicado pode continuar apontando para a versão anterior.

Para produção, abra o Apps Script e use:

**Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**.

Isso mantém o endereço da implantação existente.

## Em caso de credencial expirada

Se o workflow retornar erro `401 Unauthorized` ou equivalente, execute novamente:

```powershell
npx -y @google/clasp@3.4.1 login
Get-Content "$HOME\.clasprc.json" -Raw | Set-Clipboard
```

Depois substitua o conteúdo do secret `CLASPRC_JSON` no GitHub.
