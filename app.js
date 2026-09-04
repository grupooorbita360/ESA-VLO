// ============================================================
// app.js — motor de la interfaz. NO editar texto de preguntas aquí,
// eso vive en content.js.
// ============================================================

let activeSectionId = CONTENT.sections[0].id;
const selectedOptions = {}; // { sectionId: { discovery: [...], sondeo: [...] } }
let agentName = "";
let contractNumber = "";

function renderTopbar() {
  const select = document.getElementById("agent-select");
  select.innerHTML = "";
  CONTENT.agents.forEach((a, i) => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });
  select.onchange = (e) => {
    agentName = e.target.value === CONTENT.agents[0] ? "" : e.target.value;
    renderPanel();
  };

  const input = document.getElementById("contract-input");
  input.oninput = (e) => {
    contractNumber = e.target.value;
    renderPanel();
  };
}

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
      renderPanel();
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
  renderPanel();
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

// ---- Panel derecho ----

function sectionHasAnswers(sectionId) {
  const s = selectedOptions[sectionId];
  return !!(s && (s.discovery.length || s.sondeo.length));
}

function getRiskyFlags() {
  const flags = [];
  CONTENT.sections.forEach((section) => {
    ["discovery", "sondeo"].forEach((layer) => {
      const block = section[layer];
      if (!block || !block.riskyOptions) return;
      const chosen = (selectedOptions[section.id] && selectedOptions[section.id][layer]) || [];
      block.riskyOptions.forEach((risky) => {
        if (chosen.includes(risky)) {
          flags.push(`${section.title}: "${risky}"`);
        }
      });
    });
  });
  return flags;
}

function renderRiskBanner(container) {
  const flags = getRiskyFlags();
  if (!flags.length) return;
  const banner = document.createElement("div");
  banner.className = "risk-banner";
  banner.textContent = "⚠ Revisar con cuidado: " + flags.join(" · ");
  container.appendChild(banner);
}

function renderSummary(container) {
  const label = document.createElement("div");
  label.className = "panel-block-title";
  label.textContent = "Resumen en vivo";
  container.appendChild(label);

  const entries = CONTENT.sections.filter((s) => sectionHasAnswers(s.id));
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "summary-empty";
    empty.textContent = "Se va llenando solo conforme avanza la llamada.";
    container.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "summary-list";
  entries.forEach((s) => {
    const all = [...selectedOptions[s.id].discovery, ...selectedOptions[s.id].sondeo];
    const item = document.createElement("div");
    item.className = "summary-item";
    const lbl = document.createElement("span");
    lbl.className = "summary-label";
    lbl.textContent = s.title;
    item.appendChild(lbl);
    item.appendChild(document.createTextNode(all.join(", ")));
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderChecklist(container) {
  const label = document.createElement("div");
  label.className = "panel-block-title";
  label.textContent = "Puntos críticos";
  container.appendChild(label);

  const list = document.createElement("div");
  list.className = "checklist";
  CONTENT.criticalCheckpoints.forEach((cp) => {
    const item = document.createElement("button");
    if (!cp.sectionId) {
      item.className = "checklist-item unassigned";
      item.innerHTML = `<span class="mark">·</span> ${cp.label} (sin sección aún)`;
    } else {
      const done = sectionHasAnswers(cp.sectionId);
      item.className = "checklist-item " + (done ? "done" : "pending");
      item.innerHTML = `<span class="mark">${done ? "✓" : "⚠"}</span> ${cp.label}`;
      item.onclick = () => {
        activeSectionId = cp.sectionId;
        renderNav();
        renderContent();
        renderPanel();
      };
    }
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderSuggestion(container) {
  const idx = CONTENT.sections.findIndex((s) => s.id === activeSectionId);
  const next = CONTENT.sections[idx + 1];
  if (!next) return;

  const label = document.createElement("div");
  label.className = "panel-block-title";
  label.textContent = "Sugerido a continuación";
  container.appendChild(label);

  const btn = document.createElement("button");
  btn.className = "suggestion-box";
  btn.textContent = next.title + " →";
  btn.onclick = () => {
    activeSectionId = next.id;
    renderNav();
    renderContent();
    renderPanel();
  };
  container.appendChild(btn);
}

function buildSummaryText() {
  const lines = [];
  lines.push(`Agente: ${agentName || "—"}`);
  lines.push(`Contrato: ${contractNumber || "—"}`);
  lines.push("");
  CONTENT.sections.forEach((s) => {
    if (!sectionHasAnswers(s.id)) return;
    const all = [...selectedOptions[s.id].discovery, ...selectedOptions[s.id].sondeo];
    lines.push(`${s.title}: ${all.join(", ")}`);
  });
  const flags = getRiskyFlags();
  if (flags.length) {
    lines.push("");
    lines.push("Banderas: " + flags.join(" · "));
  }
  return lines.join("\n");
}

function renderCopyButton(container) {
  const label = document.createElement("div");
  label.className = "panel-block-title";
  label.textContent = "Resumen para CRM";
  container.appendChild(label);

  const requiredDone = CONTENT.criticalCheckpoints
    .filter((cp) => cp.sectionId)
    .every((cp) => sectionHasAnswers(cp.sectionId));

  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.textContent = "Copiar resumen";
  btn.disabled = !requiredDone;
  btn.onclick = () => {
    navigator.clipboard.writeText(buildSummaryText()).then(() => {
      btn.textContent = "¡Copiado!";
      setTimeout(() => (btn.textContent = "Copiar resumen"), 1500);
    });
  };
  container.appendChild(btn);

  if (!requiredDone) {
    const hint = document.createElement("div");
    hint.className = "copy-hint";
    hint.textContent = "Se habilita cuando los puntos críticos con sección asignada estén cubiertos.";
    container.appendChild(hint);
  }
}

function renderPanel() {
  const panel = document.getElementById("right-panel");
  panel.innerHTML = "";
  renderRiskBanner(panel);
  renderSummary(panel);
  renderChecklist(panel);
  renderSuggestion(panel);
  renderCopyButton(panel);
}

renderTopbar();
renderNav();
renderContent();
renderPanel();
