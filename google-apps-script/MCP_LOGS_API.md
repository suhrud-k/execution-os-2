# MCP-oriented `get_logs` API (Google Apps Script)

Machine-readable JSON over the existing **Logs** sheet. Uses the same `EXECUTION_OS_SECRET` as the PWA (passed as query param `token`, or `secret` as an alias).

---

## 1. Assumptions review

- **Sheet**: Tab name configurable via `MCP_LOG_SHEET_NAME` (default `Logs`), row 1 = headers, one row per calendar day, no merged cells in data.
- **Schema**: Matches `LOG_HEADERS` in `Code.gs` (Execution OS 2.0). The API does not invent columns; it reads whatever headers exist in row 1.
- **Auth**: Shared secret in Script properties (`EXECUTION_OS_SECRET`). Not OAuth.
- **Timezone**: Date cells and timestamp normalization use **Asia/Kolkata** (IST), consistent with the rest of the script.

---

## 2. Minimum validation and normalization rules

| Rule | Behavior |
|------|----------|
| **Blanks** | `''`, `null`, `undefined` → JSON `null` in the response object. |
| **Booleans** | `workout_done`, `warmup_done`, `meditation_done`: `TRUE`/`FALSE` (any case), `1`/`0`, `YES`/`NO` → boolean; unrecognized → `null`. |
| **Numbers** | Listed numeric columns: parse as finite number; strip commas; invalid → `null`. |
| **Timestamps** | `wake_time`, `reach_office_time`, `leave_office_time`, `sleep_time`, `last_updated_at`: prefer ISO `yyyy-MM-dd'T'HH:mm:ss+05:30` when parseable; else keep trimmed string. |
| **`date`** | Must be valid `YYYY-MM-DD` to include the row in `logs`. Stored in output as that string. |
| **`workout_log_json`** | If valid JSON → parsed **object** (or array). If invalid → `workout_log_json` remains the **raw string** and `workout_log_json_invalid: true` is set. Empty → `null`, no flag. |
| **Other text** | Strings as-is after empty check. |

**Row eligibility for `logs`**

- Row is **skipped** (increment `skipped_rows`) if `date` is missing, empty, or not a valid `YYYY-MM-DD`.
- Rows with valid `date` outside `[start, end]` are **omitted** (not errors, not counted in `skipped_rows`).

**Partially invalid rows**

- If `date` is valid and in range, the row is returned; individual fields normalize to `null` or best-effort types (no row-level rejection for bad numbers).

---

## 3. Implementation plan

1. `doGet` routes `action=get_logs` to `handleGetLogsMcp_` **before** the legacy `secret` gate (MCP uses `token` or `secret`).
2. Validate token, `start`, `end` (strict ISO dates, `start <= end`).
3. Read header row + data rows; map each row with existing `rowToObject_`.
4. Filter by inclusive date range; count bad/missing dates as `skipped_rows`.
5. Normalize each included row with `normalizeLogObjectForMcp_`.
6. Sort `logs` ascending by `date`.
7. Return `mcpJsonSuccess_` / `mcpJsonError_` payloads.

---

## 4. Code location

All logic lives in **`Code.gs`**: `handleGetLogsMcp_`, `normalizeLogObjectForMcp_`, helpers, and `MCP_LOG_SHEET_NAME`.

---

## 5. Deployment

Same as the main web app:

1. Paste / sync `Code.gs` in the Apps Script project bound to your spreadsheet (or standalone with `SPREADSHEET_ID`).
2. **Deploy → Manage deployments → Web app** (or New deployment).
3. Execute as: **Me**; Who has access: **Anyone** (secret protects data).

No second deployment is required; `get_logs` shares the existing `/exec` URL.

---

## 6. Example test URLs

Replace `YOUR_DEPLOY_URL`, `YOUR_SECRET`, and dates.

```text
YOUR_DEPLOY_URL?action=get_logs&start=2026-03-30&end=2026-04-02&token=YOUR_SECRET
```

Alias (same secret as the React app):

```text
YOUR_DEPLOY_URL?action=get_logs&start=2026-03-30&end=2026-04-02&secret=YOUR_SECRET
```

---

## 7. Example successful JSON response

```json
{
  "success": true,
  "source": "daily_log_sheet",
  "action": "get_logs",
  "start": "2026-03-30",
  "end": "2026-04-02",
  "count": 2,
  "skipped_rows": 0,
  "logs": [
    {
      "date": "2026-03-30",
      "wake_time": "2026-03-30T07:15:00+05:30",
      "morning_energy": 4,
      "workout_done": true,
      "workout_log_json": { "exercises": [] },
      "meditation_done": false,
      "focus_work_minutes": null,
      "priority_1": "Ship MVP"
    }
  ]
}
```

(Fields omitted here for brevity; real responses include every header column.)

---

## 8. Example error JSON responses

```json
{ "success": false, "error": "Invalid or missing token" }
```

```json
{ "success": false, "error": "Invalid or missing start date (use YYYY-MM-DD)" }
```

```json
{ "success": false, "error": "start must be on or before end" }
```

```json
{ "success": false, "error": "Log sheet not found: Logs" }
```

---

## 9. Next step: `get_recent_logs(days)` (MCP style)

- Add `action=get_recent_logs&days=14&token=...`.
- Reuse `parseISODateParam_`-style validation for `days` (integer 1–366).
- Compute `end = today` (IST), `start = end - (days-1)` in calendar days.
- Call the same read path as `get_logs` with derived `start`/`end`, or factor a shared `readLogsInRange_(start, end)` used by both handlers.
- Return the same `{ success, source, action, count, skipped_rows, logs }` shape with `days`, `start`, `end` echoed for clarity.

---

## Legacy API unchanged

`getLog`, `getRecentLogs`, and `POST upsertLog` still use `ok: true|false` and `secret` as today. Only `get_logs` uses `success` and prefers `token`.
