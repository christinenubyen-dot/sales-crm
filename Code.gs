/**
 * Sales CRM — Google Sheets backend (Google Apps Script Web App)
 * --------------------------------------------------------------
 * Stores the dashboard's entire data blob in one cell of a sheet and
 * serves it back over HTTP. Deploy this as a Web App (see setup guide).
 *
 * The whole CRM state is JSON, so we keep it simple and reliable: one
 * tab named "crm_data", cell A1 holds the JSON string. (A human-readable
 * snapshot is also written to readable tabs so you can glance at the data
 * inside Sheets — but A1 of "crm_data" is the source of truth.)
 */

// MUST match SHEETS_API_TOKEN in the dashboard HTML.
// Change this to your own random string.
var SECRET_TOKEN = "change-me-to-a-long-random-string";

var DATA_SHEET = "crm_data";

function doGet(e) {
  return handle(e, (e.parameter && e.parameter.action) || "load",
                   (e.parameter && e.parameter.token) || "", null);
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return handle(e, body.action || "save", body.token || "", body.data || null);
}

function handle(e, action, token, data) {
  if (token !== SECRET_TOKEN) {
    return json({ ok: false, error: "unauthorized" });
  }
  try {
    if (action === "save") {
      saveData(data);
      return json({ ok: true });
    }
    // default: load
    return json({ ok: true, data: loadData() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getDataSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DATA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DATA_SHEET);
    sh.getRange("A1").setValue("");
  }
  return sh;
}

function loadData() {
  var raw = getDataSheet().getRange("A1").getValue();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (err) { return null; }
}

function saveData(data) {
  if (!data) throw new Error("no data");
  var sh = getDataSheet();
  sh.getRange("A1").setValue(JSON.stringify(data));
  sh.getRange("A2").setValue("Last updated: " + new Date().toISOString());
  writeReadableTabs(data);   // optional human-friendly mirror
}

/**
 * Optional: mirror the data into readable tabs so the Sheet is browsable.
 * The dashboard never reads these — they're just for your eyes.
 */
function writeReadableTabs(data) {
  mirror_("people", data.people, ["id","name","company","role","status","notes"]);
  mirror_("retailers", data.retailers, ["id","name","region","stage","stocked","contacts"]);
  mirror_("touchpoints", data.touchpoints, ["id","date","type","who","company","channel","value","desc"]);
}

function mirror_(tabName, rows, cols) {
  if (!rows) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  sh.clearContents();
  var out = [cols];
  rows.forEach(function (r) {
    out.push(cols.map(function (c) {
      var v = r[c];
      return (v === undefined || v === null) ? "" : (typeof v === "object" ? JSON.stringify(v) : v);
    }));
  });
  sh.getRange(1, 1, out.length, cols.length).setValues(out);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
