// ============================================================
// app.js — motor de la interfaz. NO editar texto de preguntas aquí,
// eso vive en content.js.
// ============================================================

let activeSectionId = CONTENT.sections[0].id;
const selectedOptions = {}; // { sectionId: { discovery: [...], sondeo: [...] } }

function renderNav() {
  const nav = document.getElementById("nav-list");
  nav.innerHTML = "";
  CONTENT.sections.forEach((section) => {
    const btn = document.createElement("button");
    btn.className = "nav-item" + (section.id === activeSectionId ? " active" : "");
    btn.textContent = section.title;
    btn.onclick = () => {
      activeSectionId = section.id;
      renderNav();
      renderContent();
    };
    nav.appendChild(btn);
  });
}

function toggleOption(sectionId, layer, option) {
  selectedOptions[sectionId] = selectedOptions[sectionId] || { discovery: [], sondeo: [] };
  const list = selectedOptions[sectionId][layer];
  const idx = list.indexOf(option);
  if (idx === -1) list.push(option);
  else list.splice(idx, 1);
  renderContent();
}

function renderOptions(sectionId, layer, block) {
  const chosen = (selectedOptions[sectionId] && selectedOptions[sectionId][layer]) || [];
  const wrap = document.createElement("div");
  wrap.className = "options";
  block.options.forEach((opt) => {
    const chip = document.createElement("button");
    chip.className = "option-chip" + (chosen.includes(opt) ? " selected" : "");
    chip.textContent = opt;
    chip.onclick = () => toggleOption(sectionId, layer, opt);
    wrap.appendChild(chip);
  });
  return wrap;
}

function renderContent() {
  const section = CONTENT.sections.find((s) => s.id === activeSectionId);
  const content = document.getElementById("content");
  content.innerHTML = "";

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = section.title;
  content.appendChild(title);

  const hasAnything = section.script || section.discovery || section.sondeo;
  if (!hasAnything) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Todavía no hay contenido para esta sección — se agrega en content.js.";
    content.appendChild(empty);
    return;
  }

  if (section.script) {
    const block = document.createElement("div");
    block.className = "block";
    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = "Script";
    const text = document.createElement("div");
    text.className = "script-text";
    text.textContent = section.script;
    block.appendChild(label);
    block.appendChild(text);
    content.appendChild(block);
  }

  if (section.discovery) {
    const block = document.createElement("div");
    block.className = "block";
    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = "Discovery";
    const q = document.createElement("div");
    q.className = "question-text";
    q.textContent = section.discovery.question;
    block.appendChild(label);
    block.appendChild(q);
    block.appendChild(renderOptions(section.id, "discovery", section.discovery));
    content.appendChild(block);
  }

  if (section.sondeo) {
    const block = document.createElement("div");
    block.className = "block";
    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = "Sondeo";
    const q = document.createElement("div");
    q.className = "question-text";
    q.textContent = section.sondeo.question;
    block.appendChild(label);
    block.appendChild(q);
    block.appendChild(renderOptions(section.id, "sondeo", section.sondeo));
    content.appendChild(block);
  }

  if (section.notes && section.notes.length) {
    const block = document.createElement("div");
    block.className = "block";
    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = "Notas para el agente";
    const ul = document.createElement("ul");
    ul.className = "notes-list";
    section.notes.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      ul.appendChild(li);
    });
    block.appendChild(label);
    block.appendChild(ul);
    content.appendChild(block);
  }

  if (section.transition) {
    const block = document.createElement("div");
    block.className = "block";
    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = "Transición";
    const t = document.createElement("div");
    t.className = "transition-text";
    t.textContent = section.transition;
    block.appendChild(label);
    block.appendChild(t);
    content.appendChild(block);
  }
}

renderNav();
renderContent();
