function filaDenunciaToObject_(row) {
  return {
    id: String(row[0] || ''),
    timestamp: String(row[1] || ''),
    roomCode: String(row[2] || '').trim(),
    studentName: row[3] || '',
    rule: row[4] || '',
    reporterEmail: String(row[5] || '').toLowerCase().trim(),
    reporterRole: row[6] || '',
    reporterRoom: String(row[7] || '').trim(),
    obs: row[8] || '',
    requestId: row[9] || '',
    status: String(row[10] || REPORT_STATUS_PENDING).toUpperCase().trim(),
    reviewedAt: String(row[11] || ''),
    reviewerEmail: row[12] || '',
    reviewReason: row[13] || '',
    officialOccurrenceId: row[14] || ''
  };
}

function atualizarDecisaoFila_(shQueue, rowIndex, status, reviewerEmail, reason, officialOccurrenceId) {
  var reviewedAt = Utilities.formatDate(new Date(), APP_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
  shQueue.getRange(rowIndex, 11, 1, 5).setValues([[
    status,
    reviewedAt,
    reviewerEmail,
    reason || '',
    officialOccurrenceId || ''
  ]]);
  return reviewedAt;
}

function aprovarDenunciaPendente(idDenuncia, observacaoRevisao) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar podem aprovar denúncias.');
  }

  var schema = ensureOperationalSchema_();
  var shQueue = schema.shQueue;
  var shHist = schema.shHist;
  var reviewerEmail = getUserEmail();
  var reason = String(observacaoRevisao || '').trim() || 'Denúncia confirmada após análise da EEB/Gestão.';

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var rowIndex = findReviewRowById_(shQueue, idDenuncia);
    if (rowIndex < 0) return { success: false, message: 'Denúncia não encontrada.' };

    var row = shQueue.getRange(rowIndex, 1, 1, 15).getValues()[0];
    var report = filaDenunciaToObject_(row);
    if (report.status !== REPORT_STATUS_PENDING) {
      return {
        success: false,
        code: 'ALREADY_REVIEWED',
        message: 'Esta denúncia já foi analisada com o status ' + report.status + '.',
        report: report
      };
    }

    var dateKey = dataKey_(row[1]);
    var officialDuplicate = jaExisteOcorrenciaOficialNoDia_(shHist, dateKey, row[2], row[3], row[4]);
    if (officialDuplicate) {
      return {
        success: false,
        code: 'OFFICIAL_DUPLICATE',
        message: 'Já existe uma ocorrência oficial aprovada para este estudante e critério nesta data. Negue esta denúncia duplicada.',
        existingId: officialDuplicate.id
      };
    }

    var occurrenceId = 'OCC-' + String(row[0] || '').replace(/^REP-/, '');
    shHist.getRange(shHist.getLastRow() + 1, 1, 1, 11).setValues([[
      occurrenceId,
      row[1],
      row[2],
      row[3],
      row[4],
      1,
      row[5],
      row[6],
      row[8],
      row[9],
      row[7]
    ]]);

    var reviewedAt = atualizarDecisaoFila_(
      shQueue, rowIndex, REPORT_STATUS_APPROVED, reviewerEmail, reason, occurrenceId
    );

    report.status = REPORT_STATUS_APPROVED;
    report.reviewedAt = reviewedAt;
    report.reviewerEmail = reviewerEmail;
    report.reviewReason = reason;
    report.officialOccurrenceId = occurrenceId;

    return {
      success: true,
      report: report,
      occurrence: {
        id: occurrenceId,
        timestamp: String(row[1]),
        roomCode: String(row[2] || '').trim(),
        studentName: row[3],
        rule: row[4],
        points: 1,
        userEmail: row[5],
        role: row[6],
        obs: row[8],
        requestId: row[9],
        reporterRoom: String(row[7] || '').trim()
      },
      message: 'Denúncia aprovada. A ocorrência entrou oficialmente no cálculo da turma.'
    };
  } finally {
    lock.releaseLock();
  }
}

function negarDenunciaPendente(idDenuncia, motivo) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar podem negar denúncias.');
  }

  var schema = ensureOperationalSchema_();
  var shQueue = schema.shQueue;
  var reviewerEmail = getUserEmail();
  var reason = String(motivo || '').trim() || 'Denúncia não confirmada após análise da EEB/Gestão.';

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var rowIndex = findReviewRowById_(shQueue, idDenuncia);
    if (rowIndex < 0) return { success: false, message: 'Denúncia não encontrada.' };

    var row = shQueue.getRange(rowIndex, 1, 1, 15).getValues()[0];
    var report = filaDenunciaToObject_(row);
    if (report.status !== REPORT_STATUS_PENDING) {
      return { success: false, code: 'ALREADY_REVIEWED', message: 'Esta denúncia já foi analisada.', report: report };
    }

    var reviewedAt = atualizarDecisaoFila_(
      shQueue, rowIndex, REPORT_STATUS_DENIED, reviewerEmail, reason, ''
    );
    report.status = REPORT_STATUS_DENIED;
    report.reviewedAt = reviewedAt;
    report.reviewerEmail = reviewerEmail;
    report.reviewReason = reason;

    return {
      success: true,
      report: report,
      message: 'Denúncia negada. Nenhum ponto foi alterado.'
    };
  } finally {
    lock.releaseLock();
  }
}

function marcarDenunciaFalsaPendente(idDenuncia, motivo) {
  if (!checkIsEEB()) {
    throw new Error('Apenas o EEB e a Gestão Escolar podem marcar uma denúncia como falsa.');
  }

  var schema = ensureOperationalSchema_();
  var shQueue = schema.shQueue;
  var shFalse = schema.shFalse;
  var reviewerEmail = getUserEmail();
  var reason = String(motivo || '').trim();
  if (!reason) throw new Error('Informe o motivo para classificar a denúncia como falsa.');

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var rowIndex = findReviewRowById_(shQueue, idDenuncia);
    if (rowIndex < 0) return { success: false, message: 'Denúncia não encontrada.' };

    var row = shQueue.getRange(rowIndex, 1, 1, 15).getValues()[0];
    var report = filaDenunciaToObject_(row);
    if (report.status !== REPORT_STATUS_PENDING) {
      return { success: false, code: 'ALREADY_REVIEWED', message: 'Esta denúncia já foi analisada.', report: report };
    }

    var reporterRoom = normalizarTurmaPermissao_(row[7]);
    var penaltyPoints = reporterRoom && reporterRoom !== 'TODAS' ? FALSE_REPORT_PENALTY_POINTS : 0;
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
      row[5],
      reporterRoom,
      penaltyPoints,
      reviewerEmail,
      reason
    ]]);

    var reviewedAt = atualizarDecisaoFila_(
      shQueue, rowIndex, REPORT_STATUS_FALSE, reviewerEmail, reason, ''
    );
    report.status = REPORT_STATUS_FALSE;
    report.reviewedAt = reviewedAt;
    report.reviewerEmail = reviewerEmail;
    report.reviewReason = reason;

    var falseReport = {
      id: reviewId,
      timestamp: reviewTimestamp,
      originalOccurrenceId: row[0],
      originalTimestamp: String(row[1]),
      accusedRoom: String(row[2] || '').trim(),
      studentName: row[3],
      rule: row[4],
      reporterEmail: row[5],
      reporterRoom: reporterRoom,
      penaltyPoints: penaltyPoints,
      reviewerEmail: reviewerEmail,
      reason: reason
    };

    return {
      success: true,
      report: report,
      falseReport: falseReport,
      penaltyPoints: penaltyPoints,
      message: penaltyPoints > 0
        ? 'Denúncia marcada como falsa. Ela não entrou no ranking e a turma ' + reporterRoom + ' perdeu ' + penaltyPoints + ' ponto.'
        : 'Denúncia marcada como falsa. Ela não entrou no ranking.'
    };
  } finally {
    lock.releaseLock();
  }
}
