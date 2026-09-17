function getAppData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra este projeto por Extensões > Apps Script na planilha de referência.');

  var schema = ensureOperationalSchema_();
  var userEmail = getUserEmail();
  var shPerm = ss.getSheetByName('Permissoes');
  var permData = lerDadosWeb_(shPerm);
  var authorizedUsers = [];
  var currentProfile = getPermissaoUsuario_(userEmail);

  for (var i = 1; i < permData.length; i++) {
    var rowEmail = String(permData[i][0] || '').toLowerCase().trim();
    if (!rowEmail) continue;
    var rowRole = String(permData[i][1] || '').trim();
    var rowOwnRoom = normalizarTurmaPermissao_(permData[i][2]);
    var explicitCanEdit = String(permData[i][3] || '').toUpperCase().trim() === 'SIM';
    var rowIsEEB = permissaoEhGestao_(rowRole, rowOwnRoom, explicitCanEdit);
    var rowCanEdit = rowIsEEB || explicitCanEdit;
    if (rowIsEEB) rowOwnRoom = 'TODAS';

    authorizedUsers.push({
      email: rowEmail,
      role: rowRole || (rowIsEEB ? 'EEB / GESTÃO' : 'VISUALIZADOR'),
      ownRoom: rowOwnRoom,
      canEdit: rowCanEdit,
      isEEB: rowIsEEB
    });
  }

  var shAlunos = ss.getSheetByName('Lista_Alunos');
  var alunosData = lerDadosWeb_(shAlunos);
  var studentsByRoom = {};
  for (var j = 1; j < alunosData.length; j++) {
    var t = String(alunosData[j][0] || '').trim();
    var num = alunosData[j][1];
    var nomeExib = String(alunosData[j][2] || '').trim();
    var nomeComp = String(alunosData[j][3] || '').trim();
    if (!t || !nomeExib) continue;
    if (!studentsByRoom[t]) studentsByRoom[t] = [];
    studentsByRoom[t].push({ num: num, nome: nomeExib, nome_completo: nomeComp });
  }

  // Apenas ocorrências oficialmente aprovadas entram nesta lista e no ranking.
  var histData = lerDadosWeb_(schema.shHist);
  var historyList = [];
  for (var k = histData.length - 1; k >= 1; k--) {
    if (!histData[k][0] || !histData[k][2]) continue;
    historyList.push({
      id: histData[k][0],
      timestamp: String(histData[k][1]),
      roomCode: String(histData[k][2]).trim(),
      studentName: histData[k][3],
      rule: histData[k][4],
      points: Number(histData[k][5]) || 1,
      userEmail: histData[k][6],
      role: histData[k][7],
      obs: histData[k][8],
      requestId: histData[k][9] || '',
      reporterRoom: String(histData[k][10] || '').trim()
    });
  }

  // Todos podem ver ocorrências aprovadas, mas somente EEB/Gestão recebe
  // dados de identificação do registrador no navegador.
  var historyListForClient = currentProfile.isEEB
    ? historyList
    : historyList.map(function(item) {
        return {
          id: item.id,
          timestamp: item.timestamp,
          roomCode: item.roomCode,
          studentName: item.studentName,
          rule: item.rule,
          points: item.points,
          obs: item.obs
        };
      });

  var shBonif = ss.getSheetByName('Historico_Bonificacoes');
  var bonifData = lerDadosWeb_(shBonif);
  var bonificacoesList = [];
  for (var b = bonifData.length - 1; b >= 1; b--) {
    if (!bonifData[b][0] || !bonifData[b][2]) continue;
    bonificacoesList.push({
      id: bonifData[b][0],
      timestamp: String(bonifData[b][1]),
      roomCode: String(bonifData[b][2]).trim(),
      studentOrRoom: bonifData[b][3],
      category: bonifData[b][4],
      points: Number(bonifData[b][5]) || 0,
      userEmail: bonifData[b][6],
      role: bonifData[b][7],
      obs: bonifData[b][8]
    });
  }

  var falseData = lerDadosWeb_(schema.shFalse);
  var falseReportsList = [];
  for (var f = falseData.length - 1; f >= 1; f--) {
    if (!falseData[f][0]) continue;
    falseReportsList.push({
      id: falseData[f][0],
      timestamp: String(falseData[f][1]),
      originalOccurrenceId: falseData[f][2],
      originalTimestamp: String(falseData[f][3]),
      accusedRoom: String(falseData[f][4] || '').trim(),
      studentName: falseData[f][5],
      rule: falseData[f][6],
      reporterEmail: falseData[f][7],
      reporterRoom: String(falseData[f][8] || '').trim(),
      penaltyPoints: Number(falseData[f][9]) || 0,
      reviewerEmail: falseData[f][10],
      reason: falseData[f][11]
    });
  }

  var queueData = lerDadosWeb_(schema.shQueue);
  var allReports = [];
  for (var q = queueData.length - 1; q >= 1; q--) {
    if (!queueData[q][0]) continue;
    allReports.push(filaDenunciaToObject_(queueData[q]));
  }

  var reviewQueueList = currentProfile.isEEB ? allReports : [];
  var myReportsList = currentProfile.canEdit
    ? allReports.filter(function(item) {
        return item.reporterEmail === userEmail;
      }).slice(0, 20)
    : [];

  var pendingReviewCount = 0;
  if (currentProfile.isEEB) {
    for (var p = 0; p < allReports.length; p++) {
      if (allReports[p].status === REPORT_STATUS_PENDING) pendingReviewCount++;
    }
  }

  var falseReportsForClient = currentProfile.isEEB
    ? falseReportsList
    : falseReportsList.map(function(item) {
        return {
          id: item.id,
          timestamp: item.timestamp,
          originalTimestamp: item.originalTimestamp,
          reporterRoom: item.reporterRoom,
          penaltyPoints: item.penaltyPoints
        };
      });

  return {
    userEmail: userEmail,
    profileFound: currentProfile.found === true,
    isEEB: currentProfile.isEEB,
    userCanEdit: currentProfile.canEdit,
    userRoleDesc: currentProfile.role,
    userOwnRoom: currentProfile.ownRoom,
    studentsByRoom: studentsByRoom,
    historyList: historyListForClient,
    reviewQueueList: reviewQueueList,
    myReportsList: myReportsList,
    pendingReviewCount: pendingReviewCount,
    bonificacoesList: bonificacoesList,
    falseReportsList: falseReportsForClient,
    falseReportPenaltyPoints: FALSE_REPORT_PENALTY_POINTS,
    reportStatuses: {
      pending: REPORT_STATUS_PENDING,
      approved: REPORT_STATUS_APPROVED,
      denied: REPORT_STATUS_DENIED,
      falseReport: REPORT_STATUS_FALSE
    },
    authorizedUsers: currentProfile.isEEB ? authorizedUsers : [],
    roomMapping: {
      '1º SIST_ENERGIA': '1º SISTEMAS DE ENERGIA RENOVÁVEL EM INT 1',
      '1º FAB_MECÂNICA': '1º FABRICAÇÃO MECÂNICA EM INT 1',
      '2º SIST_ENERGIA': '2º SISTEMAS DE ENERGIA RENOVÁVEL EM INT 1',
      '2º FAB_MECÂNICA': '2º FABRICAÇÃO MECÂNICA EM INT 1',
      '3º INFORMÁTICA': '3º INFORMÁTICA EM INT 1',
      '3º SEG_TRABALHO': '3º SEGURANÇA DO TRABALHO EM INT 1'
    }
  };
}
