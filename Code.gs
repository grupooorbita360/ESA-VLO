/**
 * ============================================================
 * ESA COPILOT / MOTOR VLO -- Code.gs
 * Lee TODO de las pestañas del Sheet -- ningun texto de guion,
 * regla, precio o politica vive en este archivo.
 * ============================================================
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Verification Copilot')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ---- Helpers ----

function sheetToObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  // Algunas pestañas tienen una fila de leyenda (fila 1 en cursiva) antes del encabezado real.
  // Detectamos el encabezado real como la primera fila donde la celda A no está vacía
  // Y la siguiente fila tampoco está vacía (evita confundir leyenda con encabezado).
  let headerRowIdx = 0;
  if (values.length > 1 && values[1].some(v => v !== '')) {
    // si la fila 0 parece leyenda (una sola celda con texto largo) usamos fila 1 como header
    const row0NonEmpty = values[0].filter(v => v !== '').length;
    if (row0NonEmpty === 1 && values[0][0] && values[0][0].toString().length > 40) {
      headerRowIdx = 1;
    }
  }
  const headers = values[headerRowIdx].map(h => h.toString().trim());
  const rows = [];
  for (let i = headerRowIdx + 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(c => c === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    rows.push(obj);
  }
  return rows;
}

function cleanKey(str) {
  return str.toString().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '_');
}

// Acepta los distintos formatos que puede tener una casilla "verdadera"
// en el Sheet: checkbox real (true), o texto TRUE/SI/YES.
function esVerdadero(valor) {
  if (valor === true) return true;
  const texto = (valor || '').toString().trim().toUpperCase();
  return texto === 'TRUE' || texto === 'SI' || texto === 'YES';
}

// ---- Carga inicial ----

function getProgramasActivos() {
  return sheetToObjects('CONFIG_PRODUCTS').filter(p => esVerdadero(p.Active));
}

function getDataInicial(programa) {
  try {
    const config = sheetToObjects('CONFIG_PRODUCTS').find(p => p['Product/Program'] === programa);
    if (!config) return { error: 'Programa no encontrado en CONFIG_PRODUCTS: ' + programa };

    const preguntas = sheetToObjects('Preguntas_' + sufijo(programa));
    const reglas = sheetToObjects('Reglas_' + sufijo(programa));
    const condiciones = sheetToObjects('Condiciones_Reglas').filter(c => {
      const r = reglas.find(rg => rg.Rule_ID === c.Rule_ID);
      return !!r;
    });
    const servicios = sheetToObjects('Servicios_' + sufijo(programa));
    const politicas = sheetToObjects('Politicas_' + sufijo(programa));
    const camposVariables = sheetToObjects('Campos_Variables_' + sufijo(programa));
    const notes = sheetToObjects('Notes_' + sufijo(programa));

    const agentes = sheetToObjects('LISTA_AGENTES').filter(a => esVerdadero(a.Activo)).map(a => a.Nombre);
    const hoteles = sheetToObjects('Catalogo_Hoteles').filter(h => esVerdadero(h.Activo));
    const incidentesCatalogo = sheetToObjects('Incidentes_Catalogo');
    const clasificacion = sheetToObjects('Clasificacion');

    return {
      config, preguntas, reglas, condiciones, servicios, politicas,
      camposVariables, notes, agentes, hoteles, incidentesCatalogo, clasificacion
    };
  } catch (e) {
    return { error: e.toString() };
  }
}

function sufijo(programa) {
  // "USP Referral" -> "USP" / "Fly & Buy" -> "FB"
  // Ajusta este mapeo si el nombre en CONFIG_PRODUCTS no calza directo con el sufijo de pestaña.
  const mapa = { 'USP Referral': 'USP', 'Fly & Buy': 'FB' };
  return mapa[programa] || cleanKey(programa);
}

// ---- Motor de reglas ----

function evaluarOperador(operator, valorReal, valorEsperado) {
  valorReal = (valorReal || '').toString().trim();
  const op = (operator || '=').toString().trim().toUpperCase();
  if (op === '=') {
    return valorReal.toUpperCase() === valorEsperado.toString().trim().toUpperCase();
  }
  if (op === 'IN') {
    const opciones = valorEsperado.toString().split(',').map(s => s.trim().toUpperCase());
    return opciones.includes(valorReal.toUpperCase());
  }
  if (op === 'GT') return parseFloat(valorReal) > parseFloat(valorEsperado);
  if (op === 'LT') return parseFloat(valorReal) < parseFloat(valorEsperado);
  if (op === 'BETWEEN') {
    const [min, max] = valorEsperado.toString().split('-').map(parseFloat);
    const v = parseFloat(valorReal);
    return v >= min && v <= max;
  }
  return false;
}

/**
 * respuestas: objeto { Question_ID: valor_contestado, ... }
 * Devuelve la lista de reglas cuyas condiciones (TODAS, es un AND) se cumplen,
 * ordenada por Priority descendente -- la primera es la que manda.
 */
function evaluarReglas(programa, respuestas) {
  const reglas = sheetToObjects('Reglas_' + sufijo(programa));
  const condiciones = sheetToObjects('Condiciones_Reglas');

  const disparadas = reglas.filter(regla => {
    if (!esVerdadero(regla.Active)) return false;
    const cond = condiciones.filter(c => c.Rule_ID === regla.Rule_ID);
    if (cond.length === 0) return false;
    return cond.every(c => {
      const valorReal = respuestas[c.Question_ID];
      if (valorReal === undefined) return false;
      return evaluarOperador(c.Operator, valorReal, c.Answer_Value);
    });
  });

  disparadas.sort((a, b) => (Number(b.Priority) || 0) - (Number(a.Priority) || 0));
  return disparadas;
}

// ---- Guardado ----

function guardarLlamada(datos) {
  // datos: { programa, contrato, cliente, agente, duracion, calificacionFinal,
  //          flags, respuestas: {Question_ID: valor}, incidentes: [{Incidente_ID, Color, Resolucion, Pendiente}] }
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const registros = ss.getSheetByName('REGISTROS');

    const respuestasTexto = Object.keys(datos.respuestas || {})
      .map(qid => qid + ': ' + datos.respuestas[qid])
      .join(' | ');

    registros.appendRow([
      new Date(),
      datos.programa,
      datos.contrato,
      datos.cliente,
      datos.agente,
      datos.duracion,
      datos.calificacionFinal,
      datos.flags,
      (datos.incidentes || []).length,
      respuestasTexto
    ]);

    const log = ss.getSheetByName('Incidentes_Log');
    (datos.incidentes || []).forEach(inc => {
      log.appendRow([
        new Date(), datos.programa, datos.contrato, datos.agente,
        inc.Incidente_ID, inc.Color, inc.Resolucion, inc.Pendiente
      ]);
    });

    return 'OK';
  } catch (e) {
    return 'ERROR: ' + e.toString();
  }
}

// ---- Búsqueda histórica ----

function buscarContratoHistorico(contratoBuscado) {
  try {
    const registros = sheetToObjects('REGISTROS');
    const texto = contratoBuscado.toString().toUpperCase().trim();

    for (let i = registros.length - 1; i >= 0; i--) {
      const r = registros[i];
      if ((r.Contrato || '').toString().toUpperCase().includes(texto)) {
        const incidentes = sheetToObjects('Incidentes_Log')
          .filter(inc => (inc.Contrato || '').toString().toUpperCase() === r.Contrato.toString().toUpperCase());
        return { registro: r, incidentes: incidentes };
      }
    }
    return null;
  } catch (e) {
    return 'ERROR: ' + e.toString();
  }
}
