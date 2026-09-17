function cadastrarNovoAluno(turma, nomeCompleto) {
  if (!checkIsEEB()) {
    throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para cadastrar alunos.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shAlunos = ss.getSheetByName("Lista_Alunos");
  var values = shAlunos.getDataRange().getValues();

  var countInRoom = 0;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === turma) countInRoom++;
  }

  var parts = nomeCompleto.trim().split(/\s+/);
  var formattedName = parts.length > 1 ? (parts[0] + " " + parts[parts.length - 1]).toUpperCase() : nomeCompleto.toUpperCase();
  var newNum = countInRoom + 1;
  shAlunos.appendRow([turma, newNum, formattedName, nomeCompleto.toUpperCase()]);

  return { success: true, turma: turma, num: newNum, nome: formattedName };
}

function removerAluno(turma, nomeExibicao) {
  if (!checkIsEEB()) throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para remover alunos da turma.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shAlunos = ss.getSheetByName("Lista_Alunos");
  var values = shAlunos.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(turma).trim() && String(values[i][2]).trim() === String(nomeExibicao).trim()) {
      shAlunos.deleteRow(i + 1);
      return { success: true, message: "Aluno removido com sucesso da turma." };
    }
  }
  return { success: false, message: "Aluno não encontrado na turma." };
}

function salvarPermissao(dados) {
  if (!checkIsEEB()) throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para gerenciar representantes.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shPerm = ss.getSheetByName("Permissoes");
  var values = shPerm.getDataRange().getValues();
  var targetEmail = String(dados.email).toLowerCase().trim();
  var updated = false;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === targetEmail) {
      shPerm.getRange(i + 1, 2).setValue(dados.role || "REPRESENTANTE");
      shPerm.getRange(i + 1, 3).setValue(dados.ownRoom || "");
      shPerm.getRange(i + 1, 4).setValue(dados.canEdit ? "SIM" : "NÃO");
      updated = true;
      break;
    }
  }
  if (!updated) {
    shPerm.appendRow([targetEmail, dados.role || "REPRESENTANTE", dados.ownRoom || "", dados.canEdit ? "SIM" : "NÃO"]);
  }
  return { success: true };
}

function salvarBonificacao(dados) {
  if (!checkIsEEB()) throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para conceder bonificações pedagógicas.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shBonif = ss.getSheetByName("Historico_Bonificacoes");
  if (!shBonif) {
    setupInitialSheets();
    shBonif = ss.getSheetByName("Historico_Bonificacoes");
  }
  var userEmail = getUserEmail() || dados.userEmail || "gestao@educacao.mg.gov.br";
  var now = new Date();
  var timestamp = Utilities.formatDate(now, "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  var nextId = new Date().getTime();
  var bonusPoints = Math.abs(Number(dados.points)) || 10;
  shBonif.appendRow([nextId, timestamp, dados.roomCode, dados.studentOrRoom || "Toda a Turma (Coletivo)", dados.category, bonusPoints, userEmail, dados.role || "EEB / GESTÃO", dados.obs || "Reconhecimento pedagógico por ação positiva"]);
  return { success: true, timestamp: timestamp, id: nextId, points: bonusPoints };
}

function anularBonificacao(idBonificacao) {
  if (!checkIsEEB()) throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para anular bonificações.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shBonif = ss.getSheetByName("Historico_Bonificacoes");
  if (!shBonif) return { success: false, message: "Aba Historico_Bonificacoes não encontrada." };
  var values = shBonif.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(idBonificacao)) {
      shBonif.deleteRow(i + 1);
      return { success: true, message: "Bonificação pedagógica anulada com sucesso!" };
    }
  }
  return { success: false, message: "Bonificação não encontrada." };
}
