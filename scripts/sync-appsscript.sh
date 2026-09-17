#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-validate}"
if [[ "$MODE" != "validate" && "$MODE" != "sync" ]]; then
  echo "Uso: $0 [validate|sync]" >&2
  exit 2
fi

if [[ -z "${CLASPRC_JSON:-}" ]]; then
  echo "Erro: o secret CLASPRC_JSON nao foi disponibilizado." >&2
  exit 3
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
PROJECT_DIR="$TMP_DIR/project"
AUTH_FILE="$TMP_DIR/.clasprc.json"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$PROJECT_DIR"
printf '%s' "$CLASPRC_JSON" > "$AUTH_FILE"
chmod 600 "$AUTH_FILE"
cp "$ROOT_DIR/.clasp.json" "$PROJECT_DIR/.clasp.json"
cp "$ROOT_DIR/.claspignore" "$PROJECT_DIR/.claspignore"

cd "$PROJECT_DIR"
export clasp_config_auth="$AUTH_FILE"

clasp_cmd() {
  npx -y @google/clasp@3.4.1 "$@"
}

echo "==> Lendo o projeto Apps Script atual..."
clasp_cmd pull

if [[ ! -f appsscript.json ]]; then
  echo "Erro: o Apps Script nao retornou appsscript.json. Push cancelado para preservar a configuracao remota." >&2
  exit 4
fi

# Guardamos a lista de arquivos remotos antes de sobrepor o codigo do repositorio.
REMOTE_LIST="$TMP_DIR/remote-files.txt"
REPO_LIST="$TMP_DIR/repo-files.txt"
find . -maxdepth 1 -type f \( -name '*.gs' -o -name '*.html' \) -printf '%f\n' | sort > "$REMOTE_LIST"
find "$ROOT_DIR" -maxdepth 1 -type f \( -name '*.gs' -o -name '*.html' \) -printf '%f\n' | sort > "$REPO_LIST"

EXTRA_REMOTE="$(comm -23 "$REMOTE_LIST" "$REPO_LIST" || true)"
if [[ -n "$EXTRA_REMOTE" ]]; then
  echo "Aviso: existem arquivos no Apps Script que nao estao no GitHub. Eles serao preservados nesta sincronizacao:"
  echo "$EXTRA_REMOTE" | sed 's/^/  - /'
fi

# Sobrepoe apenas os fontes controlados pelo GitHub. O manifesto e arquivos remotos
# adicionais permanecem exatamente como foram puxados do projeto atual.
while IFS= read -r source_file; do
  cp "$ROOT_DIR/$source_file" "$PROJECT_DIR/$source_file"
done < "$REPO_LIST"

echo "==> Arquivos que o clasp considera para o envio:"
clasp_cmd status

if [[ "$MODE" == "validate" ]]; then
  echo "==> Validacao concluida. Nenhum arquivo foi enviado ao Apps Script."
  exit 0
fi

if [[ "${CONFIRM_SYNC:-}" != "SINCRONIZAR" ]]; then
  echo "Erro: para enviar, defina CONFIRM_SYNC=SINCRONIZAR." >&2
  exit 5
fi

echo "==> Sincronizando fontes do GitHub com o Apps Script..."
clasp_cmd push

echo "==> Sincronizacao concluida. Nenhuma nova versao/deployment foi criada."
