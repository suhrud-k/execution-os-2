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
  'key_insight',
  'improvement_note',
  'coffee_cups',
  'soft_drinks_ml',
  'packaged_and_outside_foods_notes',
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
      if (
        h === 'packaged_foods_notes' &&
        log.packaged_and_outside_foods_notes !== undefined &&
        log.packaged_and_outside_foods_notes !== null
      ) {
        val = log.packaged_and_outside_foods_notes;
      } else {
        val = '';
      }
    }
    if (typeof val === 'boolean') {
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
    var action = String(e.parameter.action || '');
    /** MCP-style JSON API: separate auth param `token` (same value as EXECUTION_OS_SECRET). */
    if (action === 'get_logs') {
      return handleGetLogsMcp_(e);
    }
    if (!checkSecret_(e.parameter.secret)) {
      return jsonOut_({ ok: false, error: 'Unauthorized' });
    }
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

// --- MCP / machine-readable log API (get_logs) — Sheet → JSON for future MCP server ---

/** Log tab name (first row = headers; same as Execution OS Logs). */
var MCP_LOG_SHEET_NAME = 'Logs';

var MCP_BOOLEAN_FIELDS = {
  workout_done: true,
  warmup_done: true,
  meditation_done: true,
};

var MCP_NUMERIC_FIELDS = {
  morning_energy: true,
  sleep_hours: true,
  egg_count: true,
  protein_scoops: true,
  meditation_minutes: true,
  focus_work_minutes: true,
  evening_energy: true,
  coffee_cups: true,
  soft_drinks_ml: true,
  daily_steps: true,
};

var MCP_TIMESTAMP_FIELDS = {
  wake_time: true,
  reach_office_time: true,
  leave_office_time: true,
  sleep_time: true,
  last_updated_at: true,
};

/** Accept `token` (spec) or `secret` (same value as EXECUTION_OS_SECRET). */
function checkMcpToken_(e) {
  var t = e.parameter.token;
  if (t === undefined || t === null || String(t).trim() === '') {
    t = e.parameter.secret;
  }
  return checkSecret_(t);
}

function mcpJsonError_(message) {
  return jsonOut_({ success: false, error: message });
}

function mcpJsonSuccess_(payload) {
  var o = { success: true };
  for (var k in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) {
      o[k] = payload[k];
    }
  }
  return jsonOut_(o);
}

/** Strict YYYY-MM-DD calendar validation; returns normalized string or null. */
function parseISODateParam_(s) {
  if (s === undefined || s === null) return null;
  var str = String(s).trim();
  var m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  var y = Number(m[1]);
  var mo = Number(m[2]);
  var d = Number(m[3]);
  var test = new Date(Date.UTC(y, mo - 1, d));
  if (
    test.getUTCFullYear() !== y ||
    test.getUTCMonth() !== mo - 1 ||
    test.getUTCDate() !== d
  ) {
    return null;
  }
  return str;
}

/** Coerce a sheet `date` cell to YYYY-MM-DD or null. */
function rowDateToYYYYMMDD_(raw, IST) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date) {
    return Utilities.formatDate(raw, IST, 'yyyy-MM-dd');
  }
  var s = String(raw).trim();
  if (!s) return null;
  return parseISODateParam_(s) || null;
}

function normalizeMcpBoolean_(v) {
  if (v === true || v === false) return v;
  var s = String(v).trim().toUpperCase();
  if (s === 'TRUE' || s === '1' || s === 'YES') return true;
  if (s === 'FALSE' || s === '0' || s === 'NO') return false;
  return null;
}

function normalizeMcpNumber_(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  var s = String(v).trim().replace(/,/g, '');
  if (s === '') return null;
  var n = Number(s);
  return isFinite(n) ? n : null;
}

function normalizeMcpTimestamp_(v, IST) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    return Utilities.formatDate(v, IST, "yyyy-MM-dd'T'HH:mm:ss") + '+05:30';
  }
  var s = String(v).trim();
  if (!s) return null;
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, IST, "yyyy-MM-dd'T'HH:mm:ss") + '+05:30';
  }
  return s;
}

function normalizeWorkoutLogJsonForMcp_(raw) {
  if (raw === null || raw === undefined) {
    return { value: null, invalid: false };
  }
  var s = typeof raw === 'string' ? raw.trim() : String(raw);
  if (s === '') return { value: null, invalid: false };
  try {
    return { value: JSON.parse(s), invalid: false };
  } catch (err) {
    return { value: s, invalid: true };
  }
}

/**
 * Normalize one row object (from rowToObject_) for MCP consumers.
 * Blanks → null; typed fields per MCP_* maps; workout_log_json parsed or flagged.
 */
function normalizeLogObjectForMcp_(raw) {
  raw = JSON.parse(JSON.stringify(raw));
  delete raw.focus_score;
  delete raw.discipline_score;
  if (
    (raw.packaged_and_outside_foods_notes === undefined ||
      raw.packaged_and_outside_foods_notes === '') &&
    raw.packaged_foods_notes != null &&
    raw.packaged_foods_notes !== ''
  ) {
    raw.packaged_and_outside_foods_notes = raw.packaged_foods_notes;
  }
  delete raw.packaged_foods_notes;
  var IST = 'Asia/Kolkata';
  var wj = normalizeWorkoutLogJsonForMcp_(raw.workout_log_json);
  var out = {};
  var keys = Object.keys(raw);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key === 'workout_log_json') continue;
    var v = raw[key];
    if (v === '' || v === null || v === undefined) {
      out[key] = null;
      continue;
    }
    if (key === 'date') {
      out.date = rowDateToYYYYMMDD_(v, IST);
      continue;
    }
    if (MCP_BOOLEAN_FIELDS[key]) {
      out[key] = normalizeMcpBoolean_(v);
      continue;
    }
    if (MCP_NUMERIC_FIELDS[key]) {
      out[key] = normalizeMcpNumber_(v);
      continue;
    }
    if (MCP_TIMESTAMP_FIELDS[key]) {
      out[key] = normalizeMcpTimestamp_(v, IST);
      continue;
    }
    if (typeof v === 'boolean') {
      out[key] = v;
      continue;
    }
    if (typeof v === 'number') {
      out[key] = v;
      continue;
    }
    out[key] = String(v);
  }
  out.workout_log_json = wj.value;
  if (wj.invalid) {
    out.workout_log_json_invalid = true;
  }
  return out;
}

function handleGetLogsMcp_(e) {
  try {
    if (!checkMcpToken_(e)) {
      return mcpJsonError_('Invalid or missing token');
    }
    var start = parseISODateParam_(e.parameter.start);
    var end = parseISODateParam_(e.parameter.end);
    if (!start) {
      return mcpJsonError_('Invalid or missing start date (use YYYY-MM-DD)');
    }
    if (!end) {
      return mcpJsonError_('Invalid or missing end date (use YYYY-MM-DD)');
    }
    if (start > end) {
      return mcpJsonError_('start must be on or before end');
    }

    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(MCP_LOG_SHEET_NAME);
    if (!sheet) {
      return mcpJsonError_('Log sheet not found: ' + MCP_LOG_SHEET_NAME);
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return mcpJsonSuccess_({
        source: 'daily_log_sheet',
        action: 'get_logs',
        start: start,
        end: end,
        count: 0,
        skipped_rows: 0,
        logs: [],
      });
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var IST = 'Asia/Kolkata';
    var logs = [];
    var skipped = 0;

    for (var r = 0; r < data.length; r++) {
      var rawObj = rowToObject_(headers, data[r]);
      var rowDate = rowDateToYYYYMMDD_(rawObj.date, IST);
      if (!rowDate || !parseISODateParam_(rowDate)) {
        skipped++;
        continue;
      }
      if (rowDate < start || rowDate > end) {
        continue;
      }
      logs.push(normalizeLogObjectForMcp_(rawObj));
    }

    logs.sort(function (a, b) {
      return String(a.date || '').localeCompare(String(b.date || ''));
    });

    return mcpJsonSuccess_({
      source: 'daily_log_sheet',
      action: 'get_logs',
      start: start,
      end: end,
      count: logs.length,
      skipped_rows: skipped,
      logs: logs,
    });
  } catch (err) {
    return mcpJsonError_(String(err && err.message ? err.message : err));
  }
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
