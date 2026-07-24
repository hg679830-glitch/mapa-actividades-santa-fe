/* Google Apps Script — recibe las respuestas del formulario y las agrega
   como filas nuevas a la hoja "Respuestas" del Google Sheet donde se pega
   este código (Extensiones → Apps Script).

   Ver README.md → "Conectar con Google Sheets" para la guía de instalación
   paso a paso. */

const SHEET_NAME = "Respuestas";

const COLUMNAS = [
  "timestamp",
  "nombre",
  "area_puesto",
  "autoriza_quien",
  "seccion",
  "actividad",
  "la_hace",
  "frecuencia",
  "solo_inicio_fin",
  "que_lo_impide",
  "descripcion",
  "mejora_propuesta",
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNAS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const rows = payload.rows || [];
    const sheet = getSheet_();
    if (rows.length > 0) {
      const values = rows.map((r) => COLUMNAS.map((c) => r[c] || ""));
      sheet
        .getRange(sheet.getLastRow() + 1, 1, values.length, COLUMNAS.length)
        .setValues(values);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, filas: rows.length })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, mensaje: "El endpoint solo acepta POST." })
  ).setMimeType(ContentService.MimeType.JSON);
}
