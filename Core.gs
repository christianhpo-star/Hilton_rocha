/**
 * ==============================================================================
 * SISTEMA: "NOSSA TURMA, NOSSO COMPROMISSO" — EE PROFESSOR HILTON ROCHA
 * Fluxo: representante envia -> EEB/Gestão analisa -> somente aprovada pontua.
 * ==============================================================================
 */

var APP_TIMEZONE = 'America/Sao_Paulo';
var FALSE_REPORT_PENALTY_POINTS = 1;
var REPORT_STATUS_PENDING = 'PENDENTE';
var REPORT_STATUS_APPROVED = 'APROVADA';
var REPORT_STATUS_DENIED = 'NEGADA';
var REPORT_STATUS_FALSE = 'FALSA';

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Nossa Turma, Nosso Compromisso — EE Prof. Hilton Rocha')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function getUserEmail() {
  var email = Session.getActiveUser().getEmail();
  return email ? email.toLowerCase() : '';
}

function normalizarTurmaPermissao_(valor) {
  var turma = String(valor || '').trim();
  return /^TODAS\b/i.test(turma) ? 'TODAS' : turma;
}

function normalizarPapel_(role) {
  var papel = String(role || '').trim();
  try {
    papel = papel.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {}
  return papel.toUpperCase().replace(/\s+/g, ' ').trim();
}

function perfilEhEEB_(role) {
  var papel = normalizarPapel_(role);
  return papel.indexOf('EEB') !== -1 ||
    papel.indexOf('GESTAO') !== -1 ||
    papel.indexOf('GESTOR') !== -1 ||
    papel.indexOf('DIRECAO') !== -1 ||
    papel.indexOf('DIRETOR') !== -1 ||
    papel.indexOf('ESPECIALISTA') !== -1 ||
    papel.indexOf('SUPERVISAO') !== -1 ||
    papel.indexOf('COORDENACAO') !== -1;
}

function permissaoEhGestao_(role, ownRoom, canEdit) {
  return perfilEhEEB_(role) || (normalizarTurmaPermissao_(ownRoom) === 'TODAS' && canEdit === true);
}

function getPermissaoUsuario_(email) {
  var normalizedEmail = String(email || '').toLowerCase().trim();
  var perfil = {
    email: normalizedEmail,
    role: 'VISUALIZADOR',
    ownRoom: '',
    canEdit: false,
    isEEB: false,
    found: false
  };

  if (!normalizedEmail) return perfil;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shPerm = ss && ss.getSheetByName('Permissoes');
  if (!shPerm || shPerm.getLastRow() < 2) return perfil;

  var values = shPerm.getRange(2, 1, shPerm.getLastRow() - 1, 4).getValues();
  for (var i = 0; i < values.length; i++) {
    var rowEmail = String(values[i][0] || '').toLowerCase().trim();
    if (rowEmail !== normalizedEmail) continue;

    var explicitCanEdit = String(values[i][3] || '').toUpperCase().trim() === 'SIM';
    perfil.found = true;
    perfil.role = String(values[i][1] || '').trim() || 'VISUALIZADOR';
    perfil.ownRoom = normalizarTurmaPermissao_(values[i][2]);
    perfil.isEEB = permissaoEhGestao_(perfil.role, perfil.ownRoom, explicitCanEdit);
    perfil.canEdit = perfil.isEEB || explicitCanEdit;

    if (perfil.isEEB) {
      perfil.canEdit = true;
      perfil.ownRoom = 'TODAS';
      if (!perfilEhEEB_(perfil.role)) perfil.role = 'EEB / GESTÃO';
    }
    return perfil;
  }
  return perfil;
}

function checkIsEEB() {
  return getPermissaoUsuario_(getUserEmail()).isEEB;
}

function dataKey_(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, APP_TIMEZONE, 'dd/MM/yyyy');
  }
  var texto = String(valor || '').trim();
  var match = texto.match(/^(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : texto.substring(0, 10);
}

function normalizarComparacao_(valor) {
  return String(valor || '').trim().toUpperCase();
}

function findOccurrenceRowById_(shHist, idOcorrencia) {
  var lastRow = shHist.getLastRow();
  if (lastRow < 2) return -1;
  var finder = shHist.getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(String(idOcorrencia))
    .matchEntireCell(true)
    .findNext();
  return finder ? finder.getRow() : -1;
}

function findReviewRowById_(shQueue, idDenuncia) {
  var lastRow = shQueue.getLastRow();
  if (lastRow < 2) return -1;
  var finder = shQueue.getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(String(idDenuncia))
    .matchEntireCell(true)
    .findNext();
  return finder ? finder.getRow() : -1;
}

function ensureReviewQueue_(ss) {
  var shQueue = ss.getSheetByName('Fila_Denuncias');
  if (!shQueue) {
    shQueue = ss.insertSheet('Fila_Denuncias');
    shQueue.appendRow([
      'ID Denúncia', 'Data/Hora Envio', 'Turma Avaliada', 'Estudante', 'Regra',
      'E-mail Denunciante', 'Perfil / Função', 'Turma Denunciante', 'Observação',
      'ID Requisição', 'Status', 'Data/Hora Revisão', 'EEB / Revisor',
      'Motivo / Observação Revisão', 'ID Ocorrência Oficial'
    ]);
    shQueue.getRange(1, 1, 1, 15)
      .setFontWeight('bold')
      .setBackground('#1D4ED8')
      .setFontColor('#FFFFFF');
    shQueue.setFrozenRows(1);
  }
  return shQueue;
}

// Migração mínima e segura: preserva dados já existentes e apenas acrescenta estrutura.
function ensureOperationalSchema_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Planilha de referência não encontrada.');

  ['Permissoes', 'Lista_Alunos', 'Historico_Ocorrencias', 'Historico_Bonificacoes'].forEach(function(nome) {
    if (!ss.getSheetByName(nome)) throw new Error('Aba obrigatória não encontrada: ' + nome);
  });

  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  [
    { col: 10, name: 'ID Requisição' },
    { col: 11, name: 'Turma Registrador' }
  ].forEach(function(h) {
    if (String(shHist.getRange(1, h.col).getValue() || '').trim() !== h.name) {
      shHist.getRange(1, h.col).setValue(h.name)
        .setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    }
  });

  var shFalse = ss.getSheetByName('Historico_Denuncias_Falsas');
  if (!shFalse) {
    shFalse = ss.insertSheet('Historico_Denuncias_Falsas');
    shFalse.appendRow([
      'ID Revisão', 'Data/Hora Revisão', 'ID Denúncia / Ocorrência Original', 'Data/Hora Original',
      'Turma Acusada', 'Estudante', 'Regra', 'E-mail Denunciante', 'Turma Denunciante',
      'Pontos Penalidade', 'EEB / Revisor', 'Motivo'
    ]);
    shFalse.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#7F1D1D').setFontColor('#FFFFFF');
    shFalse.setFrozenRows(1);
  }

  var shQueue = ensureReviewQueue_(ss);
  return { shHist: shHist, shFalse: shFalse, shQueue: shQueue };
}

function setupInitialSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  if (!shHist) {
    shHist = ss.insertSheet('Historico_Ocorrencias');
    shHist.appendRow([
      'ID', 'Data/Hora', 'Turma Avaliada', 'Estudante (1º e Último)', 'Regra Descumprida',
      'Pontos Descontados', 'E-mail Registrador', 'Perfil / Função', 'Observação',
      'ID Requisição', 'Turma Registrador'
    ]);
    shHist.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    shHist.setFrozenRows(1);
  }

  var shPerm = ss.getSheetByName('Permissoes');
  if (!shPerm) {
    shPerm = ss.insertSheet('Permissoes');
    shPerm.appendRow(['E-mail Institucional', 'Perfil / Função', 'Turma do Aluno (Sua Sala)', 'Pode Editar?']);
    shPerm.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    shPerm.setFrozenRows(1);
  }

  var shAlunos = ss.getSheetByName('Lista_Alunos');
  if (!shAlunos) {
    shAlunos = ss.insertSheet('Lista_Alunos');
    shAlunos.appendRow(['Turma', 'Número', 'Nome Exibição (1º e Último)', 'Nome Completo']);
    shAlunos.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    shAlunos.setFrozenRows(1);
  }

  var shBonif = ss.getSheetByName('Historico_Bonificacoes');
  if (!shBonif) {
    shBonif = ss.insertSheet('Historico_Bonificacoes');
    shBonif.appendRow([
      'ID', 'Data/Hora', 'Turma Beneficiada', 'Estudante / Sala', 'Categoria Positiva',
      'Pontos Bônus', 'E-mail Registrador', 'Perfil / Função', 'Elogio / Justificativa Pedagógica'
    ]);
    shBonif.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#B45309').setFontColor('#FFFFFF');
    shBonif.setFrozenRows(1);
  }

  ensureOperationalSchema_();
}

function lerDadosWeb_(aba) {
  var range = aba.getDataRange();
  var valores = range.getValues();
  var exibidos = range.getDisplayValues();
  return valores.map(function(linha, i) {
    return linha.map(function(valor, j) {
      if (valor instanceof Date) {
        return j === 1 && (/^Historico_/.test(aba.getName()) || aba.getName() === 'Fila_Denuncias')
          ? Utilities.formatDate(valor, APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss')
          : exibidos[i][j];
      }
      return valor === undefined || valor === null ? '' : valor;
    });
  });
}
