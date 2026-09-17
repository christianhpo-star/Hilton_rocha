function salvarOcorrencia(dados) {
  dados = dados || {};
  ensureOperationalSchema_();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  var userEmail = getUserEmail() || String(dados.userEmail || '').toLowerCase().trim();
  var perfil = getPermissaoUsuario_(userEmail);

  if (!perfil.canEdit) {
    throw new Error('ACESSO NÃO AUTORIZADO: seu e-mail não possui permissão de registro.');
  }

  var roomCode = String(dados.roomCode || '').trim();
  var studentName = String(dados.studentName || '').trim();
  var rule = String(dados.rule || '').trim();
  var obs = String(dados.obs || 'Lançado via WebApp').trim();
  var requestId = String(dados.requestId || '').trim();

  if (!roomCode || !studentName || !rule) {
    throw new Error('Turma, estudante e critério são obrigatórios.');
  }

  if (!perfil.isEEB && perfil.ownRoom && perfil.ownRoom !== 'TODAS' && roomCode === perfil.ownRoom) {
    throw new Error('REGRA DE IMPARCIALIDADE: o representante não pode registrar ocorrências na própria turma (' + perfil.ownRoom + ').');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var now = new Date();
    var dateKey = Utilities.formatDate(now, APP_TIMEZONE, 'dd/MM/yyyy');
    var timestamp = Utilities.formatDate(now, APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
    var lastRow = shHist.getLastRow();

    if (lastRow >= 2) {
      var existing = shHist.getRange(2, 1, lastRow - 1, 11).getValues();
      for (var i = existing.length - 1; i >= 0; i--) {
        var row = existing[i];

        if (requestId && String(row[9] || '').trim() === requestId) {
          return {
            success: true,
            duplicateRequest: true,
            timestamp: String(row[1]),
            id: row[0],
            occurrence: {
              id: row[0], timestamp: String(row[1]), roomCode: String(row[2]),
              studentName: row[3], rule: row[4], points: Number(row[5]) || 1,
              userEmail: row[6], role: row[7], obs: row[8], requestId: requestId,
              reporterRoom: String(row[10] || '').trim()
            }
          };
        }

        if (dataKey_(row[1]) === dateKey &&
            normalizarComparacao_(row[2]) === normalizarComparacao_(roomCode) &&
            normalizarComparacao_(row[3]) === normalizarComparacao_(studentName) &&
            normalizarComparacao_(row[4]) === normalizarComparacao_(rule)) {
          return {
            success: false,
            code: 'DAILY_DUPLICATE',
            message: studentName + ' já recebeu hoje uma ocorrência no critério "' + rule + '". É permitido apenas 1 registro diário por estudante em cada critério.',
            existingId: row[0],
            existingTimestamp: String(row[1])
          };
        }
      }
    }

    var nextId = String(now.getTime()) + '-' + Utilities.getUuid().substring(0, 8);
    var pointsDeducted = 1;
    var effectiveRequestId = requestId || Utilities.getUuid();
    var nextRow = shHist.getLastRow() + 1;

    shHist.getRange(nextRow, 1, 1, 11).setValues([[
      nextId,
      timestamp,
      roomCode,
      studentName,
      rule,
      pointsDeducted,
      userEmail,
      perfil.role || 'REPRESENTANTE',
      obs,
      effectiveRequestId,
      perfil.isEEB ? 'TODAS' : perfil.ownRoom
    ]]);

    return {
      success: true,
      duplicateRequest: false,
      timestamp: timestamp,
      id: nextId,
      occurrence: {
        id: nextId,
        timestamp: timestamp,
        roomCode: roomCode,
        studentName: studentName,
        rule: rule,
        points: pointsDeducted,
        userEmail: userEmail,
        role: perfil.role || 'REPRESENTANTE',
        obs: obs,
        requestId: effectiveRequestId,
        reporterRoom: perfil.isEEB ? 'TODAS' : perfil.ownRoom
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function anularPunicao(idOcorrencia) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar têm permissão para anular punições.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var rowIndex = findOccurrenceRowById_(shHist, idOcorrencia);
    if (rowIndex < 0) return { success: false, message: 'Ocorrência não encontrada.' };

    shHist.deleteRow(rowIndex);
    return {
      success: true,
      removedId: String(idOcorrencia),
      message: 'Punição anulada com sucesso. Os pontos voltarão à turma no recálculo do ranking.'
    };
  } finally {
    lock.releaseLock();
  }
}

function marcarDenunciaFalsa(idOcorrencia, motivo) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar podem marcar uma denúncia como falsa.');
  }

  ensureOperationalSchema_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shHist = ss.getSheetByName('Historico_Ocorrencias');
  var shFalse = ss.getSheetByName('Historico_Denuncias_Falsas');
  var reviewerEmail = getUserEmail();
  var reason = String(motivo || '').trim() || 'Denúncia considerada improcedente após análise do EEB/Gestão.';

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var rowIndex = findOccurrenceRowById_(shHist, idOcorrencia);
    if (rowIndex < 0) {
      return { success: false, message: 'Ocorrência não encontrada ou já retirada.' };
    }

    var row = shHist.getRange(rowIndex, 1, 1, 11).getValues()[0];
    var reporterEmail = String(row[6] || '').toLowerCase().trim();
    var storedReporterRoom = normalizarTurmaPermissao_(row[10]);
    var reporterProfile = getPermissaoUsuario_(reporterEmail);
    var reporterRoom = storedReporterRoom && storedReporterRoom !== 'TODAS'
      ? storedReporterRoom
      : (reporterProfile.ownRoom && reporterProfile.ownRoom !== 'TODAS' ? reporterProfile.ownRoom : '');
    var penaltyPoints = reporterRoom ? FALSE_REPORT_PENALTY_POINTS : 0;
    var now = new Date();
    var reviewTimestamp = Utilities.formatDate(now, APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
    var reviewId = 'FALSE-' + String(now.getTime()) + '-' + Utilities.getUuid().substring(0, 8);

    shFalse.getRange(shFalse.getLastRow() + 1, 1, 1, 12).setValues([[
      reviewId,
      reviewTimestamp,
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      reporterEmail,
      reporterRoom,
      penaltyPoints,
      reviewerEmail,
      reason
    ]]);

    shHist.deleteRow(rowIndex);

    return {
      success: true,
      removedId: String(idOcorrencia),
      restoredRoom: String(row[2] || ''),
      reporterEmail: reporterEmail,
      reporterRoom: reporterRoom,
      penaltyPoints: penaltyPoints,
      falseReport: {
        id: reviewId,
        timestamp: reviewTimestamp,
        originalOccurrenceId: row[0],
        originalTimestamp: String(row[1]),
        accusedRoom: String(row[2] || ''),
        studentName: row[3],
        rule: row[4],
        reporterEmail: reporterEmail,
        reporterRoom: reporterRoom,
        penaltyPoints: penaltyPoints,
        reviewerEmail: reviewerEmail,
        reason: reason
      },
      message: penaltyPoints > 0
        ? 'Denúncia marcada como falsa. O ponto foi devolvido à turma acusada e ' + penaltyPoints + ' ponto foi descontado da turma ' + reporterRoom + ' do denunciante.'
        : 'Denúncia marcada como falsa e ponto devolvido à turma acusada. O denunciante não possui turma de origem cadastrada para aplicação de penalidade.'
    };
  } finally {
    lock.releaseLock();
  }
}
