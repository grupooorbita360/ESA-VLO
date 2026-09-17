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
    const suf = sufijo(programa);

    // Preguntas_[Programa] sigue siendo una pestaña por programa. Reglas,
    // Servicios, Politicas, Campos_Variables y Notes ya son compartidas
    // (una sola pestaña para todos los programas) y se filtran por Program.
    const preguntas = sheetToObjects('Preguntas_' + suf);
    const reglas = sheetToObjects('Reglas').filter(r => r.Program === suf);
    const condiciones = sheetToObjects('Condiciones_Reglas').filter(c => {
      const r = reglas.find(rg => rg.Rule_ID === c.Rule_ID);
      return !!r;
    });
    const servicios = sheetToObjects('Servicios').filter(s => s.Program === suf);
    const politicas = sheetToObjects('Politicas').filter(p => p.Program === suf);
    const camposVariables = sheetToObjects('Campos_Variables').filter(c => c.Program === suf);
    const notes = sheetToObjects('Notes').filter(n => n.Program === suf);

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

// El sufijo (ej. "USP", "FB") sale de CONFIG_PRODUCTS.Sufijo -- nunca de un
// mapeo fijo en codigo, para que un programa nuevo solo necesite una fila
// nueva en el Sheet. Si esa columna faltara o viniera vacia para una fila,
// cleanKey(programa) es el ultimo respaldo.
function sufijo(programa) {
  const config = sheetToObjects('CONFIG_PRODUCTS').find(p => p['Product/Program'] === programa);
  const valor = config && config.Sufijo ? config.Sufijo.toString().trim() : '';
  return valor || cleanKey(programa);
}

// ---- Motor de reglas ----

function evaluarOperador(operator, valorReal, valorEsperado) {
  valorReal = (valorReal || '').toString().trim();
  const op = (operator || 'EQ').toString().trim().toUpperCase();
  if (op === 'EQ') {
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
 * Reglas_[Programa] trae su propia condicion (Question_ID/Operator/Answer_Value)
 * en la misma fila -- eso alcanza para la mayoria de las reglas (una sola condicion).
 * Condiciones_Reglas guarda condiciones ADICIONALES para las reglas que necesitan
 * mas de una (AND). Cuando el Operator de la propia fila es literalmente "AND",
 * su Question_ID/Answer_Value es solo una etiqueta legible para humanos -- las
 * condiciones reales de esa regla viven completas en Condiciones_Reglas.
 */
function condicionesDeRegla(regla, condicionesAdicionales) {
  const opPropio = (regla.Operator || '').toString().trim().toUpperCase();
  const propia = (regla.Question_ID && opPropio !== 'AND')
    ? [{ Question_ID: regla.Question_ID, Operator: regla.Operator, Answer_Value: regla.Answer_Value }]
    : [];
  return propia.concat(condicionesAdicionales);
}

/**
 * respuestas: objeto { Question_ID: valor_contestado, ... }
 * Devuelve la lista de reglas cuyas condiciones (TODAS, es un AND) se cumplen,
 * ordenada por Priority descendente -- la primera es la que manda.
 */
function evaluarReglas(programa, respuestas) {
  const suf = sufijo(programa);
  const reglas = sheetToObjects('Reglas').filter(r => r.Program === suf);
  const condiciones = sheetToObjects('Condiciones_Reglas');

  const disparadas = reglas.filter(regla => {
    if (!esVerdadero(regla.Active)) return false;
    const adicionales = condiciones.filter(c => c.Rule_ID === regla.Rule_ID);
    const todas = condicionesDeRegla(regla, adicionales);
    if (todas.length === 0) return false;
    return todas.every(c => {
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

// ============================================================
// MIGRACION UNICA -- correr una sola vez desde el editor de Apps Script
// (elegir "migracionUnicaMotorVLO" en el desplegable de funciones y
// Ejecutar), revisar Preguntas_USP / Reglas_USP / Condiciones_Reglas,
// y BORRAR TODO ESTE BLOQUE del proyecto una vez confirmado.
//
// Corrige en Motor-VLO-USP:
//  1. Operator "=" -> "EQ" en Reglas_USP y Condiciones_Reglas (el simbolo
//     "=" hacia que Sheets leyera la celda como formula rota -> #ERROR!).
//  2. Los dos Mostrar_Si que estaban en texto libre, al formato
//     "Question_ID: Valor" ya identificado.
//  3. La columna Tipo en Preguntas_USP, colapsando el vocabulario real al
//     conjunto cerrado de 8 tipos, y borrando las filas CONDICION_ENTRADA
//     (esa logica ya vive en codigo, leyendo CONFIG_PRODUCTS.Services).
// ============================================================
function migracionUnicaMotorVLO() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  migrarOperadorAEQ_(ss.getSheetByName('Reglas_USP'));
  migrarOperadorAEQ_(ss.getSheetByName('Condiciones_Reglas'));
  migrarMostrarSi_(ss.getSheetByName('Preguntas_USP'));
  migrarTipos_(ss.getSheetByName('Preguntas_USP'));
  Logger.log('Migracion completa. Revisa Preguntas_USP, Reglas_USP y Condiciones_Reglas, y borra esta funcion.');
}

function migrarOperadorAEQ_(sheet) {
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => h.toString().trim());
  const col = headers.indexOf('Operator');
  if (col === -1) return;
  for (let i = 1; i < values.length; i++) {
    if (values[i][col].toString().trim() === '=') {
      sheet.getRange(i + 1, col + 1).setValue('EQ');
    }
  }
}

function migrarMostrarSi_(sheet) {
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => h.toString().trim());
  const colQuestionId = headers.indexOf('Question_ID');
  const colScript = headers.indexOf('Script / Pregunta');
  const colMostrarSi = headers.indexOf('Mostrar_Si');
  if (colMostrarSi === -1) return;
  for (let i = 1; i < values.length; i++) {
    const qid = (values[i][colQuestionId] || '').toString().trim();
    const script = (values[i][colScript] || '').toString();
    if (qid === 'Q_SOLTERA_DIVORCIO') {
      sheet.getRange(i + 1, colMostrarSi + 1).setValue('Q_ESTADO_CIVIL_DETALLE: Soltera legal');
    }
    if (script.indexOf('Sigue diciendo No') !== -1) {
      sheet.getRange(i + 1, colMostrarSi + 1).setValue('Q_SEGUNDA_OFERTA: Si seguro');
    }
  }
}

function migrarTipos_(sheet) {
  if (!sheet) return;
  const mapaDirecto = {
    'SCRIPT': 'SCRIPT', 'SCRIPT_VARIABLE': 'SCRIPT', 'SCRIPT_KVC': 'SCRIPT',
    'SCRIPT_CONDICIONAL': 'SCRIPT', 'REBUTTAL': 'SCRIPT', 'CORRECCION_EXTERNA': 'SCRIPT',
    'CAMPO_PASIVO': 'CAMPO_PASIVO',
    'EVALUACION_AGENTE': 'EVALUACION_AGENTE',
    'EVALUACION_CONTINUA': 'EVALUACION_CONTINUA',
    'ACCION': 'ACCION', 'ACCION_SISTEMA': 'ACCION',
    'PANEL': 'PANEL_INFO', 'CALIFICACION_CALCULADA': 'PANEL_INFO',
    'FLAGS_CALCULADOS': 'PANEL_INFO', 'VERIFICACION_POR_INCIDENTE': 'PANEL_INFO'
  };
  // Estos deciden PREGUNTA vs LIBRE segun si la fila trae Opciones o no.
  const decidePorOpciones = ['VERIFICACION', 'EXPLORATORIO', 'DISCOVERY', 'SONDEO'];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => h.toString().trim());
  const colTipo = headers.indexOf('Tipo');
  const colOpciones = headers.indexOf('Opciones');
  if (colTipo === -1) return;

  const filasABorrar = [];
  for (let i = 1; i < values.length; i++) {
    const tipoActual = (values[i][colTipo] || '').toString().trim().toUpperCase();
    if (!tipoActual) continue;
    if (tipoActual === 'CONDICION_ENTRADA') { filasABorrar.push(i + 1); continue; }

    let nuevoTipo = mapaDirecto[tipoActual];
    if (!nuevoTipo && decidePorOpciones.indexOf(tipoActual) !== -1) {
      const tieneOpciones = (values[i][colOpciones] || '').toString().trim() !== '';
      nuevoTipo = tieneOpciones ? 'PREGUNTA' : 'LIBRE';
    }
    if (!nuevoTipo) continue; // LIBRE ya queda igual; tipo desconocido se deja para revisar a mano

    if (nuevoTipo !== tipoActual) sheet.getRange(i + 1, colTipo + 1).setValue(nuevoTipo);
  }

  // Borrar de abajo hacia arriba para no correr los indices de las filas restantes.
  filasABorrar.sort((a, b) => b - a).forEach(fila => sheet.deleteRow(fila));
}
