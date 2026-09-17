function jaExisteOcorrenciaOficialNoDia_(shHist, dateKey, roomCode, studentName, rule) {
  var lastRow = shHist.getLastRow();
  if (lastRow < 2) return null;
  var rows = shHist.getRange(2, 1, lastRow - 1, 11).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    if (dataKey_(row[1]) === dateKey &&
        normalizarComparacao_(row[2]) === normalizarComparacao_(roomCode) &&
        normalizarComparacao_(row[3]) === normalizarComparacao_(studentName) &&
        normalizarComparacao_(row[4]) === normalizarComparacao_(rule)) {
      return { id: row[0], timestamp: String(row[1]) };
    }
  }
  return null;
}

function jaExisteDenunciaAtivaNoDia_(shQueue, dateKey, roomCode, studentName, rule, requestId) {
  var lastRow = shQueue.getLastRow();
  if (lastRow < 2) return null;
  var rows = shQueue.getRange(2, 1, lastRow - 1, 15).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    var rowRequestId = String(row[9] || '').trim();
    if (requestId && rowRequestId === requestId) {
      return {
        type: 'REQUEST',
        report: filaDenunciaToObject_(row)
      };
    }

    var status = String(row[10] || '').toUpperCase().trim();
    var blocksDuplicate = status === REPORT_STATUS_PENDING || status === REPORT_STATUS_APPROVED;
    if (!blocksDuplicate) continue;

    if (dataKey_(row[1]) === dateKey &&
        normalizarComparacao_(row[2]) === normalizarComparacao_(roomCode) &&
        normalizarComparacao_(row[3]) === normalizarComparacao_(studentName) &&
        normalizarComparacao_(row[4]) === normalizarComparacao_(rule)) {
      return {
        type: 'DAILY',
        report: filaDenunciaToObject_(row)
      };
    }
  }
  return null;
}

function salvarOcorrencia(dados) {
  dados = dados || {};
  var schema = ensureOperationalSchema_();
  var shHist = schema.shHist;
  var shQueue = schema.shQueue;

  var userEmail = getUserEmail() || String(dados.userEmail || '').toLowerCase().trim();
  var perfil = getPermissaoUsuario_(userEmail);

  if (!perfil.canEdit) {
    throw new Error('ACESSO NÃO AUTORIZADO: seu e-mail não possui permissão de registro.');
  }

  var roomCode = String(dados.roomCode || '').trim();
  var studentName = String(dados.studentName || '').trim();
  var rule = String(dados.rule || '').trim();
  var obs = String(dados.obs || 'Registro via WebApp').trim();
  var requestId = String(dados.requestId || '').trim();

  if (!roomCode || !studentName || !rule) {
    throw new Error('Turma, estudante e critério são obrigatórios.');
  }

  if (!perfil.isEEB && perfil.ownRoom && perfil.ownRoom !== 'TODAS' && roomCode === perfil.ownRoom) {
    throw new Error('REGRA DE IMPARCIALIDADE: o representante não pode registrar denúncias na própria turma (' + perfil.ownRoom + ').');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var now = new Date();
    var dateKey = Utilities.formatDate(now, APP_TIMEZONE, 'dd/MM/yyyy');
    var timestamp = Utilities.formatDate(now, APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');

    var existingQueue = jaExisteDenunciaAtivaNoDia_(shQueue, dateKey, roomCode, studentName, rule, requestId);
    if (existingQueue && existingQueue.type === 'REQUEST') {
      return {
        success: true,
        duplicateRequest: true,
        pending: existingQueue.report.status === REPORT_STATUS_PENDING,
        report: existingQueue.report,
        message: 'Esta denúncia já havia sido recebida. Nenhuma duplicidade foi criada.'
      };
    }

    if (existingQueue && existingQueue.type === 'DAILY') {
      return {
        success: false,
        code: 'DAILY_DUPLICATE',
        message: studentName + ' já possui hoje uma denúncia ativa no critério "' + rule + '". Aguarde a análise da EEB/Gestão.',
        existingId: existingQueue.report.id,
        existingTimestamp: existingQueue.report.timestamp,
        existingStatus: existingQueue.report.status
      };
    }

    var existingOfficial = jaExisteOcorrenciaOficialNoDia_(shHist, dateKey, roomCode, studentName, rule);
    if (existingOfficial) {
      return {
        success: false,
        code: 'DAILY_DUPLICATE',
        message: studentName + ' já possui hoje uma ocorrência aprovada no critério "' + rule + '".',
        existingId: existingOfficial.id,
        existingTimestamp: existingOfficial.timestamp,
        existingStatus: REPORT_STATUS_APPROVED
      };
    }

    var reportId = 'REP-' + String(now.getTime()) + '-' + Utilities.getUuid().substring(0, 8);
    var effectiveRequestId = requestId || Utilities.getUuid();
    var reporterRoom = perfil.isEEB ? 'TODAS' : perfil.ownRoom;

    var row = [
      reportId,
      timestamp,
      roomCode,
      studentName,
      rule,
      userEmail,
      perfil.role || 'REPRESENTANTE',
      reporterRoom,
      obs,
      effectiveRequestId,
      REPORT_STATUS_PENDING,
      '',
      '',
      '',
      ''
    ];

    shQueue.getRange(shQueue.getLastRow() + 1, 1, 1, 15).setValues([row]);
    var report = filaDenunciaToObject_(row);

    return {
      success: true,
      duplicateRequest: false,
      pending: true,
      report: report,
      timestamp: timestamp,
      id: reportId,
      message: 'Denúncia enviada para análise. Nenhum ponto foi alterado no ranking.'
    };
  } finally {
    lock.releaseLock();
  }
}

// Correção administrativa de uma ocorrência já aprovada.
function anularPunicao(idOcorrencia) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar têm permissão para anular ocorrências aprovadas.');
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
      message: 'Ocorrência aprovada anulada. Os pontos voltarão à turma no recálculo do ranking.'
    };
  } finally {
    lock.releaseLock();
  }
}

// Mantido para revisão excepcional de registros antigos que já tinham sido aprovados.
function marcarDenunciaFalsa(idOcorrencia, motivo) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar podem marcar uma ocorrência já aprovada como falsa.');
  }

  var schema = ensureOperationalSchema_();
  var shHist = schema.shHist;
  var shFalse = schema.shFalse;
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
      reviewId, reviewTimestamp, row[0], row[1], row[2], row[3], row[4],
      reporterEmail, reporterRoom, penaltyPoints, reviewerEmail, reason
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
        ? 'Ocorrência marcada como falsa. O ponto foi devolvido à turma acusada e ' + penaltyPoints + ' ponto foi descontado da turma ' + reporterRoom + ' do denunciante.'
        : 'Ocorrência marcada como falsa e ponto devolvido à turma acusada.'
    };
  } finally {
    lock.releaseLock();
  }
}
