/**
 * Execution OS — Google Sheets backend
 * Deploy as Web app: Execute as: Me, Who has access: Anyone (use EXECUTION_OS_SECRET for auth).
 * Set script properties: SPREADSHEET_ID, EXECUTION_OS_SECRET
 */

var LOG_HEADERS = [
  'date',
  'wake_time',
  'morning_energy',
  'reach_office_time',
  'leave_office_time',
  'sleep_time',
  'sleep_hours',
  'breakfast_type',
  'egg_count',
  'protein_scoops',
  'breakfast_notes',
  'workout_done',
  'workout_type',
  'warmup_done',
  'workout_log_json',
  'meditation_done',
  'meditation_minutes',
  'focus_work_minutes',
  'focus_work_description',
  'priority_1',
  'priority_2',
  'priority_3',
  'priority_1_status',
  'priority_2_status',
  'priority_3_status',
  'work_completed_notes',
  'evening_energy',
  'focus_score',
  'discipline_score',
  'key_insight',
  'improvement_note',
  'coffee_cups',
  'soft_drinks_ml',
  'packaged_foods_notes',
  'daily_steps',
  'last_updated_at',
  'sync_status',
];

/**
 * Run once from the editor (▶ Run) → View → Logs.
 * Checks property names and that SPREADSHEET_ID opens. Does not print secrets.
 */
function executionOsDiagnostics() {
  var p = PropertiesService.getScriptProperties();
  var sec = p.getProperty('EXECUTION_OS_SECRET');
  var id = p.getProperty('SPREADSHEET_ID');
  Logger.log('EXECUTION_OS_SECRET: ' + (sec ? 'set (length ' + String(sec).length + ')' : 'MISSING'));
  Logger.log('SPREADSHEET_ID: ' + (id ? 'set' : 'MISSING'));
  if (!sec) return;
  if (!id) return;
  try {
    var ss = SpreadsheetApp.openById(id);
    Logger.log('Spreadsheet open: OK — ' + ss.getName());
    var logs = ss.getSheetByName('Logs');
    Logger.log('Logs tab: ' + (logs ? 'found' : 'MISSING — run setupExecutionOsSheets or add tab'));
  } catch (err) {
    Logger.log('Spreadsheet open: FAILED — ' + (err && err.message ? err.message : err));
  }
}

function getProps_() {
  return PropertiesService.getScriptProperties();
}

function getSpreadsheet_() {
  var id = getProps_().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID script property');
  return SpreadsheetApp.openById(id);
}

function checkSecret_(provided) {
  var expected = getProps_().getProperty('EXECUTION_OS_SECRET');
  if (!expected) return false;
  return String(provided || '').trim() === String(expected).trim();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function rowToObject_(headers, row) {
  var o = {};
  var IST = 'Asia/Kolkata';
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '');
    if (!key) continue;
    var v = row[i];
    if (key === 'date' && v instanceof Date) {
      o[key] = Utilities.formatDate(v, IST, 'yyyy-MM-dd');
    } else if (v instanceof Date) {
      o[key] = Utilities.formatDate(v, IST, "yyyy-MM-dd'T'HH:mm:ss") + '+05:30';
    } else if (typeof v === 'boolean') {
      o[key] = v;
    } else if (v === '' || v === null || v === undefined) {
      o[key] = '';
    } else {
      o[key] = v;
    }
  }
  return o;
}

function objectToRow_(headers, log) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    var val = log[h];
    if (val === undefined || val === null) {
      row.push('');
    } else if (typeof val === 'boolean') {
      row.push(val);
    } else {
      row.push(val);
    }
  }
  return row;
}

function findLogRowIndex_(sheet, dateStr) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var col = 1;
  // getRange(r, c, numRows, numCols) — rows 2..last ⇒ numRows = last - 1
  var values = sheet.getRange(2, col, last - 1, col).getValues();
  for (var i = 0; i < values.length; i++) {
    var cell = values[i][0];
    var d = cell instanceof Date
      ? Utilities.formatDate(cell, 'Asia/Kolkata', 'yyyy-MM-dd')
      : String(cell || '');
    if (d === dateStr) return i + 2;
  }
  return -1;
}

function doGet(e) {
  try {
    if (!checkSecret_(e.parameter.secret)) {
      return jsonOut_({ ok: false, error: 'Unauthorized' });
    }
    var action = e.parameter.action;
    if (action === 'getLog') {
      var date = e.parameter.date;
      if (!date) return jsonOut_({ ok: false, error: 'Missing date' });
      var log = getLogByDate_(date);
      return jsonOut_({ ok: true, log: log });
    }
    if (action === 'getRecentLogs') {
      var logs = getRecentLogs_(14);
      return jsonOut_({ ok: true, logs: logs });
    }
    return jsonOut_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    try {
      body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    } catch (parseErr) {
      return jsonOut_({ ok: false, error: 'Invalid JSON' });
    }
    if (!checkSecret_(body.secret)) {
      return jsonOut_({ ok: false, error: 'Unauthorized' });
    }
    if (body.action === 'upsertLog' && body.log) {
      upsertLog_(body.log);
      return jsonOut_({ ok: true });
    }
    return jsonOut_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function getLogByDate_(dateStr) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('Logs');
  if (!sheet) return null;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIndex = findLogRowIndex_(sheet, dateStr);
  if (rowIndex < 0) return null;
  // Single row: numRows = 1 (NOT end row — third arg is row count)
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  return rowToObject_(headers, row);
}

/** Headers whose values must stay plain text IST in the sheet (no auto Date/UTC shift). */
var IST_PLAIN_TEXT_HEADERS = {
  wake_time: true,
  reach_office_time: true,
  leave_office_time: true,
  sleep_time: true,
  last_updated_at: true,
};

/** Parse any ISO-like instant → single IST string +05:30 for stable sheet display. */
function normalizeLogTimesForSheet_(log) {
  var keys = Object.keys(IST_PLAIN_TEXT_HEADERS);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = log[k];
    if (v === undefined || v === null || v === '') continue;
    var s = typeof v === 'string' ? v : String(v);
    var d = new Date(s);
    if (isNaN(d.getTime())) continue;
    log[k] = Utilities.formatDate(d, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss") + '+05:30';
  }
}

/** Force Plain text (@) so Sheets does not re-parse as spreadsheet-local Date/UTC. */
function formatTimeColumnsAsPlainText_(sheet, rowIndex, headers) {
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '');
    if (!IST_PLAIN_TEXT_HEADERS[h]) continue;
    sheet.getRange(rowIndex, c + 1).setNumberFormat('@');
  }
}

/** IST wall time as ISO-like string (+05:30) for last_updated_at */
function indiaTimestamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss") + '+05:30';
}

function upsertLog_(log) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('Logs');
  if (!sheet) throw new Error('Missing Logs sheet — run setupExecutionOsSheets()');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var dateStr = String(log.date || '');
  if (!dateStr) throw new Error('Missing log.date');
  var logCopy = JSON.parse(JSON.stringify(log));
  normalizeLogTimesForSheet_(logCopy);
  logCopy.last_updated_at = indiaTimestamp_();
  var row = objectToRow_(headers, logCopy);
  var rowIndex = findLogRowIndex_(sheet, dateStr);
  var targetRow;
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
    targetRow = rowIndex;
  } else {
    sheet.appendRow(row);
    targetRow = sheet.getLastRow();
  }
  formatTimeColumnsAsPlainText_(sheet, targetRow, headers);
}

function getRecentLogs_(days) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('Logs');
  if (!sheet) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var dateIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]) === 'date') {
      dateIdx = h;
      break;
    }
  }
  if (dateIdx < 0) return [];
  var IST = 'Asia/Kolkata';
  var today = new Date();
  var cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  var cutoffStr = Utilities.formatDate(cutoff, IST, 'yyyy-MM-dd');
  var last = sheet.getLastRow();
  if (last < 2) return [];
  // Rows 2 through last ⇒ numRows = last - 1
  var data = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var raw = data[i][dateIdx];
    var d = raw instanceof Date
      ? Utilities.formatDate(raw, IST, 'yyyy-MM-dd')
      : String(raw || '');
    if (d >= cutoffStr) {
      out.push(rowToObject_(headers, data[i]));
    }
  }
  out.sort(function (a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
  return out;
}

/**
 * Run once from the Apps Script editor after creating a blank spreadsheet.
 * Creates Logs, Reference, Analytics and seeds Reference values.
 */
function setupExecutionOsSheets() {
  var ss = getSpreadsheet_();
  var logs = ss.getSheetByName('Logs');
  if (!logs) logs = ss.insertSheet('Logs');
  logs.clear();
  logs.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);

  var ref = ss.getSheetByName('Reference');
  if (!ref) ref = ss.insertSheet('Reference');
  ref.clear();
  ref.getRange(1, 1, 4, 2).setValues([
    ['workout_types', 'BB, CST, Legs, Arms, Full body, Cardio, Warmup, Rest, Other'],
    ['priority_status', 'Done, Partial, Not Done'],
    ['breakfast_types', 'Eggs, protein_shake, Other, Missed'],
    ['note', 'Edit lists above as needed; app uses in-app constants.'],
  ]);

  var an = ss.getSheetByName('Analytics');
  if (!an) an = ss.insertSheet('Analytics');
  an.clear();
  an.getRange(1, 1).setValue('Reserved for future analytics');

  return 'OK — Logs headers and Reference seeded.';
}
