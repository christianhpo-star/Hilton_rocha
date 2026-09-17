function formatTimestampWeb_(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
  }
  return String(valor || '');
}
