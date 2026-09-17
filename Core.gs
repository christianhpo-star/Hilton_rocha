/**
 * ==============================================================================
 * SISTEMA: "NOSSA TURMA, NOSSO COMPROMISSO" — EE PROFESSOR HILTON ROCHA
 * REGRA DE IMPARCIALIDADE: REPRESENTANTES AVALIAM TODAS AS OUTRAS TURMAS, MENOS A SUA
 * CONTROLE PEDAGÓGICO EEB / GESTÃO ESCOLAR E BARRAS DE PROGRESSO VISUAIS
 * ==============================================================================
 */

var APP_TIMEZONE = 'America/Sao_Paulo';
var FALSE_REPORT_PENALTY_POINTS = 1;

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
  return email ? email.toLowerCase() : "";
}

// Normaliza a turma cadastrada na aba Permissoes.
function normalizarTurmaPermissao_(valor) {
  var turma = String(valor || '').trim();
  return /^TODAS\b/i.test(turma) ? 'TODAS' : turma;
}

function perfilEhEEB_(role) {
  var papel = String(role || '').toUpperCase();
  return papel.indexOf('EEB') !== -1 || papel.indexOf('DIREÇÃO') !== -1 || papel.indexOf('DIRETOR') !== -1;
}

function getPermissaoUsuario_(email) {
  var normalizedEmail = String(email || '').toLowerCase().trim();
  var perfil = {
    email: normalizedEmail,
    role: 'VISUALIZADOR',
    ownRoom: '',
    canEdit: false,
    isEEB: false
  };

  if (!normalizedEmail) return perfil;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shPerm = ss && ss.getSheetByName('Permissoes');
  if (!shPerm || shPerm.getLastRow() < 2) return perfil;

  var values = shPerm.getRange(2, 1, shPerm.getLastRow() - 1, 4).getValues();
  for (var i = 0; i < values.length; i++) {
    var rowEmail = String(values[i][0] || '').toLowerCase().trim();
    if (rowEmail !== normalizedEmail) continue;

    perfil.role = String(values[i][1] || '').trim() || 'VISUALIZADOR';
    perfil.ownRoom = normalizarTurmaPermissao_(values[i][2]);
    perfil.canEdit = String(values[i][3] || '').toUpperCase() === 'SIM';
    perfil.isEEB = perfilEhEEB_(perfil.role);
    if (perfil.isEEB) {
      perfil.canEdit = true;
      perfil.ownRoom = 'TODAS';
    }
    return perfil;
  }
  return perfil;
}

// Verifica se o usuário atual é EEB ou Gestão usando a aba Permissoes como fonte de verdade.
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

// Migração mínima e segura para as funções novas. Não recria cadastros nem popula alunos.
function ensureOperationalSchema_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Planilha de referência não encontrada.');

  ['Permissoes', 'Lista_Alunos', 'Historico_Ocorrencias', 'Historico_Bonificacoes'].forEach(function(nome) {
    if (!ss.getSheetByName(nome)) throw new Error('Aba obrigatória não encontrada: ' + nome);
  });

  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  var headers = [
    { col: 10, name: 'ID Requisição' },
    { col: 11, name: 'Turma Registrador' }
  ];
  headers.forEach(function(h) {
    if (String(shHist.getRange(1, h.col).getValue() || '').trim() !== h.name) {
      shHist.getRange(1, h.col).setValue(h.name).setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    }
  });

  var shFalse = ss.getSheetByName('Historico_Denuncias_Falsas');
  if (!shFalse) {
    shFalse = ss.insertSheet('Historico_Denuncias_Falsas');
    shFalse.appendRow([
      'ID Revisão', 'Data/Hora Revisão', 'ID Ocorrência Original', 'Data/Hora Original',
      'Turma Acusada', 'Estudante', 'Regra', 'E-mail Denunciante', 'Turma Denunciante',
      'Pontos Penalidade', 'EEB / Revisor', 'Motivo'
    ]);
    shFalse.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#7F1D1D').setFontColor('#FFFFFF');
    shFalse.setFrozenRows(1);
  }
  return { shHist: shHist, shFalse: shFalse };
}

function setupInitialSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Aba Historico_Ocorrencias
  var shHist = ss.getSheetByName("Historico_Ocorrencias");
  if (!shHist) {
    shHist = ss.insertSheet("Historico_Ocorrencias");
    shHist.appendRow([
      "ID", "Data/Hora", "Turma Avaliada", "Estudante (1º e Último)", "Regra Descumprida", 
      "Pontos Descontados", "E-mail Registrador", "Perfil / Função", "Observação"
    ]);
    shHist.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
    shHist.setFrozenRows(1);
  }
  // Coluna técnica para idempotência. É adicionada sem alterar os dados existentes.
  if (String(shHist.getRange(1, 10).getValue() || '').trim() !== 'ID Requisição') {
    shHist.getRange(1, 10).setValue('ID Requisição').setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
  }
  if (String(shHist.getRange(1, 11).getValue() || '').trim() !== 'Turma Registrador') {
    shHist.getRange(1, 11).setValue('Turma Registrador').setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
  }

  // 2. Aba Permissoes (E-mail, Perfil, Turma do Representante, Pode Editar?)
  var shPerm = ss.getSheetByName("Permissoes");
  if (!shPerm) {
    shPerm = ss.insertSheet("Permissoes");
    shPerm.appendRow(["E-mail Institucional", "Perfil / Função", "Turma do Aluno (Sua Sala)", "Pode Editar?"]);
    shPerm.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
    shPerm.setFrozenRows(1);
  }


  // 3. Aba Lista_Alunos
  var shAlunos = ss.getSheetByName("Lista_Alunos");
  if (!shAlunos) {
    shAlunos = ss.insertSheet("Lista_Alunos");
    shAlunos.appendRow(["Turma", "Número", "Nome Exibição (1º e Último)", "Nome Completo"]);
    shAlunos.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
    shAlunos.setFrozenRows(1);
  }

  // 4. Aba Historico_Bonificacoes (Reconhecimento Pedagógico e Ações Positivas da Gestão)
  var shBonif = ss.getSheetByName("Historico_Bonificacoes");
  if (!shBonif) {
    shBonif = ss.insertSheet("Historico_Bonificacoes");
    shBonif.appendRow([
      "ID", "Data/Hora", "Turma Beneficiada", "Estudante / Sala", "Categoria Positiva", 
      "Pontos Bônus", "E-mail Registrador", "Perfil / Função", "Elogio / Justificativa Pedagógica"
    ]);
    shBonif.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#B45309").setFontColor("#FFFFFF");
    shBonif.setFrozenRows(1);
  }

  // 5. Auditoria de denúncias falsas e penalidade do denunciante.
  var shFalse = ss.getSheetByName('Historico_Denuncias_Falsas');
  if (!shFalse) {
    shFalse = ss.insertSheet('Historico_Denuncias_Falsas');
    shFalse.appendRow([
      'ID Revisão', 'Data/Hora Revisão', 'ID Ocorrência Original', 'Data/Hora Original',
      'Turma Acusada', 'Estudante', 'Regra', 'E-mail Denunciante', 'Turma Denunciante',
      'Pontos Penalidade', 'EEB / Revisor', 'Motivo'
    ]);
    shFalse.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#7F1D1D').setFontColor('#FFFFFF');
    shFalse.setFrozenRows(1);
  }
}

// Converte TODAS as células Date antes de enviar pelo google.script.run.
// Uma data digitada em Observação também pode virar Date e impedir a resposta inteira.
// Data/Hora recebe formato estável para os filtros mensais; demais datas preservam a exibição.
function lerDadosWeb_(aba) {
  var range = aba.getDataRange();
  var valores = range.getValues();
  var exibidos = range.getDisplayValues();
  return valores.map(function(linha, i) {
    return linha.map(function(valor, j) {
      if (valor instanceof Date) {
        return j === 1 && /^Historico_/.test(aba.getName())
          ? Utilities.formatDate(valor, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss')
          : exibidos[i][j];
      }
      return valor === undefined || valor === null ? '' : valor;
    });
  });
}
