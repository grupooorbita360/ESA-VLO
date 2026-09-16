// ============================================================
// DATOS DE PRUEBA -- solo para el visor local (preview/index.html).
// Es contenido inventado, no el guion real de ningun programa; existe
// para poder probar la mecanica de la app (flujo continuo, panel fijo,
// progreso, Checkpoint, Mostrar_Si, Servicios) sin tocar el Sheet real
// ni copiar/pegar nada al editor de Apps Script.
// ============================================================

const MOCK_DB = {
  programasActivos: [
    { 'Product/Program': 'Programa Demo', Active: 'YES', Ruleset: 'DEMO_01', Presentation: '90 min', Services: 'YES' }
  ],

  dataInicial: {
    config: { 'Product/Program': 'Programa Demo', Active: 'YES', Ruleset: 'DEMO_01', Presentation: '90 min', Services: 'YES' },

    agentes: ['Agente Demo 1', 'Agente Demo 2'],

    clasificacion: [
      { Codigo: '🟢 Aprobado', Estado: 'Puede continuar', Significado: 'No se encontro condicion que lo impida.' },
      { Codigo: '🟠 Revisar', Estado: 'Puede continuar con atencion', Significado: 'Hay una condicion que conviene revisar.' },
      { Codigo: '🔴 Rechazado', Estado: 'No puede continuar', Significado: 'Se encontro una condicion que lo impide.' },
      { Codigo: '🔴 Queja potencial', Estado: 'Requiere atencion', Significado: 'Riesgo de inconformidad si no se atiende.' },
      { Codigo: '⚠️ Falta informacion', Estado: 'No se puede determinar', Significado: 'Falta un dato critico.' }
    ],

    incidentesCatalogo: [
      { Incidente_ID: 'INC-DEMO-01', Descripcion: 'Cliente no estaba de acuerdo con la presentacion', Categoria: 'Presentacion', Como_Tratarlo: 'Explicar el proposito antes de que decida.', Color_Sugerido: '🟠', Requiere_Seguimiento: 'Depende', Notifica_A: '-' },
      { Incidente_ID: 'INC-DEMO-02', Descripcion: 'Cliente exige hablar con supervisor', Categoria: 'Escalacion', Como_Tratarlo: 'Transferir o agendar callback.', Color_Sugerido: '🔴', Requiere_Seguimiento: 'Si', Notifica_A: 'Supervision' }
    ],

    // Catalogo_Hoteles: Code.gs ya filtra por Activo = SI antes de mandarlo
    // al cliente. Bullet_Points_Apoyo viene separado por " · " en una sola
    // celda -- el cliente lo parte en <li>.
    hoteles: [
      { Nombre: 'Hotel Demo Palace', Activo: 'SI', Bullet_Points_Apoyo: 'Alberca de olas cerrada en temporada baja · El shuttle al aeropuerto sale cada hora · Wifi gratis solo en areas comunes' },
      { Nombre: 'Hotel Demo Inactivo', Activo: 'NO', Bullet_Points_Apoyo: 'Este hotel no deberia aparecer nunca -- Activo = NO.' }
    ],
    servicios: [
      { Servicio_ID: 'DEMO_SVC', Nombre: 'Transporte Demo', Precio: '$99', 'Duracion/Detalle': 'Ida y vuelta', Activo: 'SI', Notas: '' }
    ],
    politicas: [],
    camposVariables: [
      { Variable_ID: 'CLIENT_NAME', Etiqueta: 'Nombre del cliente', Tipo: 'Texto', Se_llena: 'Al iniciar', Notas: '' }
    ],
    // Notes_[Programa]: de aqui salen los Titulo_Corto del resumen y las
    // notas VLO/MKT/RED, y el texto de los Green_Flag/Red_Flag automaticos.
    notes: [
      { 'Seccion / Campo': 'Q_TIEMPO_OK', Titulo_Corto: 'Buen momento', VLO: 'X', MKT: '', RED: '', Green_Flag: '', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_RELACION', Titulo_Corto: 'Relacion con socio', VLO: 'X', MKT: 'X', RED: '', Green_Flag: '', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_VIAJA_ASEGURADO / Q_TRANSPORTE_RESUELTO', Titulo_Corto: 'Oportunidades de servicio', VLO: 'X', MKT: 'X', RED: '', Green_Flag: '', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_FRECUENCIA_VIAJE', Titulo_Corto: 'Frecuencia de viaje', VLO: 'X', MKT: 'X', RED: '', Green_Flag: '5+ viajes', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_CONOCE_DESTINO', Titulo_Corto: 'Conoce destino', VLO: 'X', MKT: '', RED: '', Green_Flag: 'Si conoce bien el destino', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_OTRO_CLUB', Titulo_Corto: 'Otro club vacacional', VLO: 'X', MKT: 'X', RED: '', Green_Flag: 'Si es miembro de otro club', Red_Flag: '' },
      { 'Seccion / Campo': 'Q_ACEPTA_PRESENTACION', Titulo_Corto: 'Acepta presentacion', VLO: 'X', MKT: '', RED: 'X', Green_Flag: '', Red_Flag: 'No = renuente' }
      // Q_COMENTARIOS y EVAL_TRATO NO tienen fila aqui a proposito -- deben
      // quedar contestadas pero OMITIDAS del resumen (sin mapeo = se omite).
    ],

    // Preguntas_[Programa]: guion sintetico, 4 fases + Checkpoint + Cierre.
    // Tipo ya viene en el conjunto cerrado de 8 (post-migracion real).
    preguntas: [
      // Estas dos filas traen columnas Script_EN / Opciones_EN a proposito
      // (asi se llaman de verdad en Preguntas_USP, no "<Columna> (EN)"),
      // para probar que el toggle de idioma solo traduce el guion cuando
      // el Sheet lo trae -- el resto de las filas de abajo NO tienen
      // columna EN y deben seguir viendose en español aunque el toggle
      // este en EN (ese es el fallback).
      { Fase: '1. Apertura', Orden: 1, Question_ID: '', Tipo: 'SCRIPT', 'Script / Pregunta': 'Hola, soy [Tu nombre]. ¿Hablo con {{Client Name}}?', Script_EN: 'Hello, this is [Your Name]. Am I speaking with {{Client Name}}?', Opciones: '', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '1. Apertura', Orden: 2, Question_ID: 'Q_TIEMPO_OK', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Es buen momento para hablar?', Script_EN: 'Is this a good time to talk?', Opciones: 'Si, No', Opciones_EN: 'Yes, No', Mostrar_Si: '', Obligatorio: 'SI', Critico: '' },
      { Fase: '1. Apertura', Orden: 3, Question_ID: '', Tipo: 'SCRIPT', 'Script / Pregunta': 'Perfecto, {{Client Name}}, gracias por tu tiempo.', Opciones: '', Mostrar_Si: 'Q_TIEMPO_OK: Si', Obligatorio: '' },
      { Fase: '1. Apertura', Orden: 4, Question_ID: 'EVAL_IDIOMA', Tipo: 'EVALUACION_CONTINUA', 'Script / Pregunta': 'Campo persistente en panel, activo desde Apertura. Verde=fluido por evidencia de la llamada (default). Naranja=duda real (acento marcado, pide repetir seguido, etc).', Opciones: 'Verde (default), Naranja', Mostrar_Si: '', Obligatorio: '' },
      // HOTEL_NAME ya NO es una pregunta del guion -- se captura como campo
      // opcional en la pantalla inicial (junto a Agente/Programa/Contrato/
      // Cliente, ver iniciar() en JavaScript.html) y llega al panel "Tips
      // del hotel" via state.variables, no via una fila de Preguntas_USP.

      { Fase: '2. Verificacion', Orden: 1, Question_ID: 'Q_RELACION', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Cual es tu relacion con el socio?', Opciones: 'Amigo, Familiar directo', Mostrar_Si: '', Obligatorio: 'SI', Critico: 'SI' },
      // Obligatorio vacio + Critico SI a proposito: demuestra que son columnas
      // independientes -- esta fila cuenta como punto critico en el panel
      // aunque nunca se marco Obligatorio (ej. real: Q_ENTIENDE_CANCELACION).
      { Fase: '2. Verificacion', Orden: 1.5, Question_ID: 'Q_ENTIENDE_POLITICAS', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Quedaron claras las politicas de cancelacion?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '', Critico: 'SI' },
      { Fase: '2. Verificacion', Orden: 2, Question_ID: 'Q_COMENTARIOS', Tipo: 'LIBRE', 'Script / Pregunta': 'Cuentame algo mas sobre tu viaje.', Opciones: '', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 3, Question_ID: 'Q_HORARIO_PREFERIDO', Tipo: 'CAMPO_PASIVO', 'Script / Pregunta': 'Horario preferido (solo llenar si el cliente lo menciona).', Opciones: '', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 4, Question_ID: 'EVAL_TRATO', Tipo: 'EVALUACION_AGENTE', 'Script / Pregunta': '¿Como reacciono el cliente a la explicacion?', Opciones: '🟢 Conforme, 🟠 Con dudas, 🔴 Molesto', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 5, Question_ID: 'Q_INCIDENTES_RESUELTOS', Tipo: 'PANEL_INFO', 'Script / Pregunta': 'Revision de incidentes acumulados en la llamada (lista automatica, no se pregunta al cliente).', Opciones: 'Resuelto en la llamada, Queda pendiente', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 6, Question_ID: 'Q_VIAJA_ASEGURADO', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Normalmente viajan con algun seguro?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 7, Question_ID: 'Q_TRANSPORTE_RESUELTO', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Ya tienen resuelto el transporte?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 8, Question_ID: 'Q_INTERES_ACTIVIDADES', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Ya saben que actividades les gustaria hacer?', Opciones: 'Si ya se, Me gustaria que me recomendaran, Todavia no he pensado en eso', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 9, Question_ID: 'Q_FRECUENCIA_VIAJE', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Mas o menos cuantas veces han viajado con nosotros?', Opciones: '1-2, 3-4, 5+', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 10, Question_ID: 'Q_CONOCE_DESTINO', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Conocen bien este destino?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 11, Question_ID: 'Q_OTRO_CLUB', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Son miembros de algun otro club vacacional?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '2. Verificacion', Orden: 12, Question_ID: 'Q_ACEPTA_PRESENTACION', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Estan de acuerdo en asistir a la presentacion?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },

      { Fase: '3. Servicios adicionales', Orden: 1, Question_ID: 'Q_INTERES_SERVICIO', Tipo: 'PREGUNTA', 'Script / Pregunta': '¿Te interesa contratar transporte adicional?', Opciones: 'Si, No', Mostrar_Si: '', Obligatorio: '' },
      { Fase: '3. Servicios adicionales', Orden: 2, Question_ID: '', Tipo: 'PANEL_INFO', 'Script / Pregunta': "Panel: 'Oportunidades identificadas en esta llamada' -- calculado desde Q_VIAJA_ASEGURADO / Q_TRANSPORTE_RESUELTO / Q_INTERES_ACTIVIDADES.", Opciones: '', Mostrar_Si: '', Obligatorio: '' },

      { Fase: 'Checkpoint - Evaluacion Demo', Orden: 1, Question_ID: '', Tipo: 'PANEL_INFO', 'Script / Pregunta': 'Calificacion sugerida por las reglas, con la razon que la disparo. El agente confirma o ajusta.', Opciones: '🟢 Aprobado, 🟠 Revisar, 🔴 Rechazado, 🔴 Queja potencial, ⚠️ Falta informacion', Mostrar_Si: '', Obligatorio: '' },
      { Fase: 'Checkpoint - Evaluacion Demo', Orden: 2, Question_ID: '', Tipo: 'PANEL_INFO', 'Script / Pregunta': 'Green Flags y Red Flags detectados automaticamente en la llamada.', Opciones: '', Mostrar_Si: '', Obligatorio: '' },

      { Fase: '4. Cierre', Orden: 1, Question_ID: '', Tipo: 'SCRIPT', 'Script / Pregunta': 'Gracias por tu tiempo, {{Client Name}}. Que tengas un excelente dia.', Opciones: '', Mostrar_Si: '', Obligatorio: '' }
    ],

    // Reglas_[Programa]: cada fila trae su propia condicion (la mayoria de
    // los casos reales). R3 usa Operator "AND" -- su propia condicion no
    // cuenta, las reales viven en `condiciones` (Condiciones_Reglas).
    reglas: [
      { Rule_ID: 'R1', Program: 'DEMO', Region: '', Category: 'Relacion', Question_ID: 'Q_RELACION', Answer_Value: 'Familiar directo', Operator: 'EQ', Result: '🔴 Rechazado', Priority: 100, Next_Action: 'Detener cuestionario', Show_Alert: 'Si', ESA_Validation: 'No', Customer_Message: 'Gracias por tu tiempo, no podemos continuar con esta tarifa.', Internal_Reason: 'Familiar directo del socio no es elegible.', Active: 'TRUE', Version: 1 },
      { Rule_ID: 'R2', Program: 'DEMO', Region: '', Category: 'Relacion', Question_ID: 'Q_RELACION', Answer_Value: 'Amigo', Operator: 'EQ', Result: '🟢 Aprobado', Priority: 50, Next_Action: 'Continuar', Show_Alert: 'No', ESA_Validation: 'No', Customer_Message: 'Perfecto, continuemos.', Internal_Reason: 'Relacion no excluyente por si misma.', Active: 'TRUE', Version: 1 },
      { Rule_ID: 'R3', Program: 'DEMO', Region: '', Category: 'Servicios', Question_ID: 'Combinada', Answer_Value: 'Amigo + interesado en servicio', Operator: 'AND', Result: '🟠 Revisar', Priority: 70, Next_Action: 'Confirmar antes de cerrar', Show_Alert: 'Si', ESA_Validation: 'No', Customer_Message: 'Vamos a revisar el detalle antes de confirmar.', Internal_Reason: 'Ejemplo de regla con dos condiciones (AND) via Condiciones_Reglas.', Active: 'TRUE', Version: 1 }
    ],
    condiciones: [
      { Rule_ID: 'R3', Question_ID: 'Q_RELACION', Operator: 'EQ', Answer_Value: 'Amigo' },
      { Rule_ID: 'R3', Question_ID: 'Q_INTERES_SERVICIO', Operator: 'EQ', Answer_Value: 'Si' }
    ]
  },

  // Historico de ejemplo para "Buscar" en el campo Contrato.
  historico: {
    registro: { Fecha: '2026-01-15', Programa: 'Programa Demo', Contrato: 'DEMO-0001', Cliente: 'Cliente de Prueba', Agente: 'Agente Demo 1', Duracion: 12, Calificacion_Final: '🟢 Aprobado', Flags: '', Num_Incidentes: 0 },
    incidentes: []
  }
};

// ---- Mock de google.script.run -------------------------------------------
// Misma forma que el objeto real (withSuccessHandler/withFailureHandler
// encadenables), pero resuelve contra MOCK_DB con un pequeño delay para
// que se sienta como una llamada real al servidor.

function crearRunnerMock() {
  function llamar(nombre, args, exito, error) {
    setTimeout(() => {
      try {
        let resultado;
        switch (nombre) {
          case 'getProgramasActivos':
            resultado = MOCK_DB.programasActivos;
            break;
          case 'getDataInicial':
            // Code.gs filtra Catalogo_Hoteles por Activo = SI antes de mandarlo --
            // el mock imita eso para que "Hotel Demo Inactivo" nunca llegue al cliente.
            resultado = Object.assign({}, MOCK_DB.dataInicial, {
              hoteles: MOCK_DB.dataInicial.hoteles.filter(h => (h.Activo || '').toString().trim().toUpperCase() === 'SI')
            });
            break;
          case 'evaluarReglas': {
            const [, respuestas] = args;
            const disparadas = MOCK_DB.dataInicial.reglas.filter(regla => {
              if (regla.Active !== 'TRUE') return false;
              const opPropio = (regla.Operator || '').toString().trim().toUpperCase();
              const propia = (regla.Question_ID && opPropio !== 'AND')
                ? [{ Question_ID: regla.Question_ID, Operator: regla.Operator, Answer_Value: regla.Answer_Value }]
                : [];
              const adicionales = MOCK_DB.dataInicial.condiciones.filter(c => c.Rule_ID === regla.Rule_ID);
              const todas = propia.concat(adicionales);
              if (!todas.length) return false;
              return todas.every(c => {
                const real = respuestas[c.Question_ID];
                if (real === undefined) return false;
                const op = (c.Operator || 'EQ').toString().trim().toUpperCase();
                if (op === 'EQ') return real.toString().toUpperCase() === c.Answer_Value.toString().trim().toUpperCase();
                if (op === 'IN') return c.Answer_Value.toString().split(',').map(s => s.trim().toUpperCase()).includes(real.toString().toUpperCase());
                return false;
              });
            });
            disparadas.sort((a, b) => (Number(b.Priority) || 0) - (Number(a.Priority) || 0));
            resultado = disparadas;
            break;
          }
          case 'guardarLlamada':
            console.log('[mock] guardarLlamada recibio:', args[0]);
            resultado = 'OK';
            break;
          case 'buscarContratoHistorico':
            resultado = MOCK_DB.historico;
            break;
          default:
            throw new Error('Funcion mock no implementada: ' + nombre);
        }
        exito(resultado);
      } catch (e) {
        if (error) error(e);
        else console.error(e);
      }
    }, 200);
  }

  function crearProxy(exito, error) {
    return new Proxy({}, {
      get(target, nombreFn) {
        if (nombreFn === 'withSuccessHandler') return (cb) => crearProxy(cb, error);
        if (nombreFn === 'withFailureHandler') return (cb) => crearProxy(exito, cb);
        return (...args) => llamar(nombreFn, args, exito || (() => {}), error);
      }
    });
  }

  return crearProxy(() => {}, null);
}

window.google = { script: { run: crearRunnerMock() } };
