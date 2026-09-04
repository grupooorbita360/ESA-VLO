// ============================================================
// CONTENIDO DEL CALL GUIDE — ESA Verification Assistant
// ============================================================
// Este es el ÚNICO archivo que se edita para cambiar scripts,
// preguntas u opciones. No hace falta tocar index.html, style.css
// ni app.js para actualizar el contenido de una llamada.
//
// Cada sección puede tener:
//   - script: texto que el agente lee/parafrasea
//   - transition: frase puente hacia la siguiente sección
//   - notes: tips para el agente (array de texto)
//   - discovery: { question, options: [] }  -> pregunta abierta con opciones
//   - sondeo: { question, options: [] }      -> profundización condicional
// Deja cualquier campo vacío ("" o []) si esa sección todavía no lo necesita.
// ============================================================

const CONTENT = {
  // Lista de agentes para el selector de la barra superior.
  // Edita este arreglo para agregar o quitar agentes.
  agents: ["Selecciona un agente", "Agente 1", "Agente 2", "Agente 3"],

  // Puntos de control críticos que se muestran en el panel derecho.
  // sectionId: "" significa que todavía no tiene sección asignada —
  // se queda marcado como pendiente hasta que se defina dónde vive.
  criticalCheckpoints: [
    { id: "kvc", label: "KVC check", sectionId: "" },
    { id: "quiniela", label: "Quiniela", sectionId: "" },
    { id: "credit-card", label: "Tarjeta de crédito", sectionId: "" },
    { id: "tc", label: "T&C + Penalidades", sectionId: "terms" },
  ],

  sections: [
    {
      id: "intro",
      title: "1. Intro",
      script:
        "Buenas tardes/noches, [nombre del cliente], le habla [nombre del agente] de Executive Services. Le contactamos para confirmar algunos detalles de su próxima experiencia con Fly & Buy antes de su viaje — esto nos toma solo unos minutos y nos ayuda a que todo esté listo para ustedes.",
      transition: "Antes que nada, cuénteme un poco de este viaje...",
      notes: [
        "Tono cálido, no de call center — suena a que ya los conocen, no a que están siendo auditados.",
        "Si el cliente suena apurado: ir directo a la siguiente pregunta sin alargar la introducción.",
      ],
      discovery: null,
      sondeo: null,
    },
    {
      id: "probing",
      title: "2. Probing Questions",
      script: "",
      transition: "",
      notes: [],
      discovery: null,
      sondeo: null,
    },
    {
      id: "discovery",
      title: "3. Discovery Question",
      script: "",
      transition: "",
      notes: [
        "Escuche. Marque únicamente lo que el cliente mencione de forma natural — no lo convierta en interrogatorio.",
      ],
      discovery: {
        question:
          "Cuénteme un poco sobre este viaje. ¿Qué los hizo elegir este destino?",
        options: [
          "Vacaciones",
          "Aniversario",
          "Cumpleaños",
          "Luna de miel",
          "Viaje familiar",
          "Primera visita",
          "Huésped recurrente",
          "Otro",
        ],
      },
      sondeo: {
        question: "¿Qué fue lo que más le platicaron cuando adquirió el paquete?",
        options: [
          "Beneficios de membresía",
          "Descuentos en hoteles",
          "Certificado de viaje",
          "Presentación/tour de producto",
          "No recuerda bien",
          "Otro",
        ],
      },
    },
    { id: "product-design", title: "4. Product Design", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "presentation", title: "5. Presentation", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "personal-info", title: "6. Personal Info", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "hotel-info", title: "7. Hotel Info", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "terms", title: "8. T&C + Penalidades", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "additional-services", title: "9. Servicios adicionales", script: "", transition: "", notes: [], discovery: null, sondeo: null },
    { id: "close", title: "10. Cierre", script: "", transition: "", notes: [], discovery: null, sondeo: null },
  ],
};
