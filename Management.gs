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
  if (!checkIsEEB()) throw new Error("Apenas o EEB e a Gestão Escolar têm permissão para conceder reconhecimentos pedagógicos.");

  dados = dados || {};
  var roomCode = String(dados.roomCode || '').trim();
  var categoryKey = String(dados.categoryKey || '').trim();
  var category = BONUS_CATEGORIES[categoryKey];
  if (!roomCode) throw new Error('Selecione a turma que receberá o reconhecimento.');
  if (!category) throw new Error('Selecione uma categoria de reconhecimento válida.');

  var target = String(dados.studentOrRoom || 'Toda a Turma (Reconhecimento Coletivo)').trim();
  if (category.scope === 'COLLECTIVE') target = 'Toda a Turma (Reconhecimento Coletivo)';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shBonif = ss.getSheetByName("Historico_Bonificacoes");
  if (!shBonif) {
    setupInitialSheets();
    shBonif = ss.getSheetByName("Historico_Bonificacoes");
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var now = new Date();
    var timestamp = Utilities.formatDate(now, APP_TIMEZONE, "dd/MM/yyyy HH:mm:ss");
    var todayKey = dataKey_(now);
    var currentMonth = monthKey_(now);
    var values = shBonif.getDataRange().getValues();
    var usedThisMonth = 0;

    for (var i = 1; i < values.length; i++) {
      var rowRoom = String(values[i][2] || '').trim();
      var rowTarget = String(values[i][3] || '').trim();
      var rowCategory = String(values[i][4] || '').trim();
      if (rowRoom !== roomCode) continue;

      if (monthKey_(values[i][1]) === currentMonth) {
        usedThisMonth += Math.max(0, Number(values[i][5]) || 0);
      }

      if (
        dataKey_(values[i][1]) === todayKey &&
        normalizarComparacao_(rowTarget) === normalizarComparacao_(target) &&
        normalizarComparacao_(rowCategory) === normalizarComparacao_(category.label)
      ) {
        return {
          success: false,
          code: 'BONUS_DUPLICATE',
          message: 'Este mesmo reconhecimento já foi registrado hoje para este estudante/turma.'
        };
      }
    }

    // Registros antigos podem ter bônus superiores ao novo teto. Para novos lançamentos,
    // nunca permitimos ultrapassar +6 pontos efetivos por turma em um mesmo mês.
    var remaining = Math.max(0, BONUS_MONTHLY_CAP - Math.min(BONUS_MONTHLY_CAP, usedThisMonth));
    var standardPoints = Number(category.points) || 0;
    var effectivePoints = Math.min(standardPoints, remaining);
    var capped = effectivePoints < standardPoints;
    var userEmail = getUserEmail() || "gestao@educacao.mg.gov.br";
    var nextId = new Date().getTime();
    var obs = String(dados.obs || '').trim() || category.description;
    if (capped) {
      obs += ' | Impacto no ranking limitado pelo teto mensal de +' + BONUS_MONTHLY_CAP + ' pontos por turma.';
    }

    shBonif.appendRow([
      nextId,
      timestamp,
      roomCode,
      target,
      category.label,
      effectivePoints,
      userEmail,
      dados.role || "EEB / GESTÃO",
      obs
    ]);

    return {
      success: true,
      timestamp: timestamp,
      id: nextId,
      categoryKey: categoryKey,
      category: category.label,
      standardPoints: standardPoints,
      points: effectivePoints,
      capped: capped,
      recognitionOnly: effectivePoints === 0,
      monthlyUsedBefore: Math.min(BONUS_MONTHLY_CAP, usedThisMonth),
      monthlyUsedAfter: Math.min(BONUS_MONTHLY_CAP, usedThisMonth + effectivePoints),
      monthlyCap: BONUS_MONTHLY_CAP,
      message: effectivePoints > 0
        ? 'Reconhecimento registrado com +' + effectivePoints + ' ponto(s) no ranking.'
        : 'Reconhecimento registrado no mural. A turma já atingiu o teto mensal de pontos positivos.'
    };
  } finally {
    lock.releaseLock();
  }
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
      return { success: true, message: "Reconhecimento pedagógico anulado com sucesso." };
    }
  }
  return { success: false, message: "Reconhecimento não encontrado." };
}
