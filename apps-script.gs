/* Google Apps Script — recibe las respuestas del formulario y las escribe
   en una hoja con el nombre de la persona que lo llenó (una hoja por
   persona, dentro del Google Sheet donde se pega este código).

   Ver README.md → "Conectar con Google Sheets" para la guía de instalación
   paso a paso. */

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

// Google Sheets no permite [ ] * / \ ? : en el nombre de una hoja, ni más de 100 caracteres.
function nombreHojaValido_(nombre) {
  let limpio = (nombre || "Sin nombre").toString().trim();
  limpio = limpio.replace(/[\[\]\*\/\\\?:]/g, " ").replace(/\s+/g, " ").trim();
  if (!limpio) limpio = "Sin nombre";
  if (limpio.length > 95) limpio = limpio.substring(0, 95);
  return limpio;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const rows = payload.rows || [];
    if (rows.length === 0) {
      return respuesta_({ ok: true, filas: 0 });
    }

    const nombreHoja = nombreHojaValido_(rows[0].nombre);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(nombreHoja);
    if (sheet) {
      // Si esta persona ya había enviado el formulario antes, se reemplaza
      // con su envío más reciente (evita duplicar sus filas).
      sheet.clearContents();
    } else {
      sheet = ss.insertSheet(nombreHoja);
    }

    sheet.appendRow(COLUMNAS);
    sheet.setFrozenRows(1);
    const values = rows.map((r) => COLUMNAS.map((c) => r[c] || ""));
    sheet.getRange(2, 1, values.length, COLUMNAS.length).setValues(values);
    for (let col = 1; col <= COLUMNAS.length; col++) {
      sheet.autoResizeColumn(col);
    }

    return respuesta_({ ok: true, filas: rows.length, hoja: nombreHoja });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  }
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  return respuesta_({ ok: true, mensaje: "El endpoint solo acepta POST." });
}
