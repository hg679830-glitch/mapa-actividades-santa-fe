/* Mapa de Actividades y Autonomía Operativa · Unión de Crédito Santa Fe
   App de una sola página: sin servidor propio. Guarda avance en el navegador
   (localStorage) y al final envía las respuestas a un Google Sheet a través
   de un Google Apps Script (ver config.js). */

const STORAGE_KEY = "mapa_actividades_santa_fe_v1";

const FRECUENCIAS = ["Diario", "Semanal", "Quincenal", "Mensual", "Ocasional"];

const PAGES = [
  { key: "datos", kind: "datos", label: "Tus datos" },
  ...SURVEY_DATA.sections.map((s) => ({ key: s.key, kind: "seccion", label: s.name, section: s })),
  { key: "cierre", kind: "cierre", label: "Cierre" },
];

function blankActivity() {
  return { si_no: "", frecuencia: "", solo: "", impide: "", descripcion: "", mejora: "" };
}

function blankOtra() {
  return { actividad: "", frecuencia: "", solo: "", impide: "", descripcion: "", mejora: "" };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const answers = {};
  const otras = {};
  SURVEY_DATA.sections.forEach((s) => {
    answers[s.key] = s.activities.map(() => blankActivity());
    otras[s.key] = [];
  });
  return {
    meta: { nombre: "", area_puesto: "", autoriza_quien: "" },
    answers,
    otras,
    cierre: SURVEY_DATA.cierreQuestions.map(() => ""),
    submitted: false,
    pageIndex: 0,
  };
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function selectField(labelText, value, options, onChange) {
  const select = el("select", {
    onchange: (e) => onChange(e.target.value),
  });
  select.appendChild(el("option", { value: "" }, "— Selecciona —"));
  options.forEach((opt) => {
    const o = el("option", { value: opt }, opt);
    if (opt === value) o.selected = true;
    select.appendChild(o);
  });
  return el("div", { class: "field" }, [el("label", {}, labelText), select]);
}

function textField(labelText, value, onChange, multiline = false) {
  const input = el(multiline ? "textarea" : "input", {
    type: "text",
    oninput: (e) => onChange(e.target.value),
  });
  input.value = value || "";
  return el("div", { class: "field" }, [el("label", {}, labelText), input]);
}

function siNoToggle(value, onSi, onNo) {
  const btnSi = el("button", { type: "button", onclick: onSi }, "Sí");
  const btnNo = el("button", { type: "button", onclick: onNo }, "No");
  if (value === "Sí") btnSi.classList.add("sel-si");
  if (value === "No") btnNo.classList.add("sel-no");
  return el("div", { class: "si-no" }, [btnSi, btnNo]);
}

function renderTabs() {
  const container = document.getElementById("tabs");
  container.innerHTML = "";
  PAGES.forEach((p, i) => {
    const done = isPageTouched(p);
    const btn = el(
      "button",
      {
        class: "tab" + (i === state.pageIndex ? " active" : "") + (done ? " done" : ""),
        onclick: () => goToPage(i),
      },
      [el("span", { class: "num" }, String(i + 1).padStart(2, "0")), el("span", {}, p.label)]
    );
    container.appendChild(btn);
  });
}

function isPageTouched(page) {
  if (page.kind === "datos") {
    return !!(state.meta.nombre && state.meta.area_puesto);
  }
  if (page.kind === "seccion") {
    const arr = state.answers[page.key] || [];
    const otras = state.otras[page.key] || [];
    return arr.some((a) => a.si_no) || otras.some((o) => o.actividad.trim());
  }
  if (page.kind === "cierre") {
    return state.cierre.some((c) => c.trim());
  }
  return false;
}

function goToPage(i) {
  saveState();
  state.pageIndex = i;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderDatosPage() {
  const main = document.getElementById("main");
  main.appendChild(
    el("div", { class: "page-head" }, [
      el("div", { class: "eyebrow" }, "Paso 1 de " + PAGES.length),
      el("h2", {}, "Tus datos"),
      el("p", {}, "Llena tus datos y luego avanza por cada área en la que participas, aunque no sea formalmente tu puesto."),
    ])
  );

  const card = el("div", { class: "card instructions" });
  card.appendChild(el("h3", { style: "margin-bottom:10px;color:var(--oro-soft);font-size:16px;" }, "Antes de empezar"));
  const ol = el("ol");
  [
    ["Llena todas las áreas en las que participas.", "Aunque no sean 'tu área'. Si dudas, llénala."],
    ["Puedes dejarlo a medias.", "Tu avance se guarda automáticamente, pero solo en esta computadora y en este navegador (por ejemplo, Chrome de tu compu de la oficina). Para continuar donde te quedaste, vuelve a entrar a esta misma liga desde el mismo navegador y la misma computadora."],
    ["No lo abras en modo incógnito ni borres el historial de este sitio.", "Si lo haces, se pierde el avance guardado y tendrías que empezar de nuevo."],
    ["Esto no evalúa tu desempeño.", "Buscamos dónde se atoran los procesos, no quién trabaja más o menos."],
  ].forEach(([t, n]) => {
    ol.appendChild(el("li", {}, [t, el("div", { class: "note" }, n)]));
  });
  card.appendChild(ol);
  main.appendChild(card);

  const dataCard = el("div", { class: "card" });
  const grid = el("div", { class: "meta-grid" });
  grid.appendChild(
    textField("Nombre completo", state.meta.nombre, (v) => {
      state.meta.nombre = v;
      saveState();
      renderTabs();
    })
  );
  grid.appendChild(
    textField("Área o puesto", state.meta.area_puesto, (v) => {
      state.meta.area_puesto = v;
      saveState();
      renderTabs();
    })
  );
  dataCard.appendChild(grid);
  dataCard.appendChild(
    textField("¿A quién le pides autorización con más frecuencia?", state.meta.autoriza_quien, (v) => {
      state.meta.autoriza_quien = v;
      saveState();
    })
  );
  main.appendChild(dataCard);
}

function renderActivity(page, index, activityText) {
  const ans = state.answers[page.key][index];
  const box = el("div", { class: "activity" });
  const head = el("div", { class: "activity-head" }, [
    el("p", {}, activityText),
    siNoToggle(
      ans.si_no,
      () => {
        ans.si_no = ans.si_no === "Sí" ? "" : "Sí";
        saveState();
        renderMain();
      },
      () => {
        ans.si_no = ans.si_no === "No" ? "" : "No";
        saveState();
        renderMain();
      }
    ),
  ]);
  box.appendChild(head);

  const detail = el("div", { class: "activity-detail" + (ans.si_no === "Sí" ? " open" : "") });
  if (ans.si_no === "Sí") {
    detail.appendChild(
      selectField("¿Cada cuándo la haces?", ans.frecuencia, FRECUENCIAS, (v) => {
        ans.frecuencia = v;
        saveState();
      })
    );
    detail.appendChild(
      selectField("¿La puedes completar tú solo de inicio a fin?", ans.solo, ["Sí", "No"], (v) => {
        ans.solo = v;
        saveState();
        renderMain();
      })
    );
    if (ans.solo === "No") {
      detail.appendChild(
        textField("Si no, ¿qué te lo impide o qué hace que no la puedas terminar?", ans.impide, (v) => {
          ans.impide = v;
          saveState();
        }, true)
      );
    }
    detail.appendChild(
      textField("Descríbela con tus palabras: ¿qué implica hacerla de principio a fin?", ans.descripcion, (v) => {
        ans.descripcion = v;
        saveState();
      }, true)
    );
    detail.appendChild(
      textField("¿Cómo la harías más rápido o mejor? ¿Qué necesitas para poder hacerlo así?", ans.mejora, (v) => {
        ans.mejora = v;
        saveState();
      }, true)
    );
  }
  box.appendChild(detail);
  return box;
}

function renderOtraRow(page, index) {
  const otra = state.otras[page.key][index];
  const box = el("div", { class: "otras-row" });
  const top = el("div", { class: "row-top" }, [
    textField("Actividad", otra.actividad, (v) => {
      otra.actividad = v;
      saveState();
      renderTabs();
    }),
    el(
      "button",
      {
        class: "btn-remove",
        type: "button",
        onclick: () => {
          state.otras[page.key].splice(index, 1);
          saveState();
          renderMain();
          renderTabs();
        },
      },
      "Quitar"
    ),
  ]);
  box.appendChild(top);
  box.appendChild(
    selectField("¿Cada cuándo la haces?", otra.frecuencia, FRECUENCIAS, (v) => {
      otra.frecuencia = v;
      saveState();
    })
  );
  box.appendChild(
    selectField("¿La puedes completar tú solo de inicio a fin?", otra.solo, ["Sí", "No"], (v) => {
      otra.solo = v;
      saveState();
      renderMain();
    })
  );
  if (otra.solo === "No") {
    box.appendChild(
      textField("Si no, ¿qué te lo impide?", otra.impide, (v) => {
        otra.impide = v;
        saveState();
      }, true)
    );
  }
  box.appendChild(
    textField("Descríbela con tus palabras", otra.descripcion, (v) => {
      otra.descripcion = v;
      saveState();
    }, true)
  );
  box.appendChild(
    textField("¿Cómo la harías más rápido o mejor?", otra.mejora, (v) => {
      otra.mejora = v;
      saveState();
    }, true)
  );
  return box;
}

function renderSeccionPage(page) {
  const main = document.getElementById("main");
  const s = page.section;
  main.appendChild(
    el("div", { class: "page-head" }, [
      el("div", { class: "eyebrow" }, "Paso " + (state.pageIndex + 1) + " de " + PAGES.length),
      el("h2", {}, s.title),
      el("p", {}, s.note),
    ])
  );

  s.activities.forEach((actividad, i) => {
    main.appendChild(renderActivity(page, i, actividad));
  });

  const otrasCard = el("div", { class: "card" }, [
    el("h3", { style: "margin-bottom:14px;color:var(--oro-soft);font-size:15px;" }, "OTRAS ACTIVIDADES"),
    el(
      "p",
      { style: "color:var(--platino);font-size:13.5px;margin-bottom:16px;" },
      "Agrega aquí lo que hagas y no venga arriba. Aunque te parezca menor, aunque creas que solo tú lo haces."
    ),
  ]);
  state.otras[page.key].forEach((_, i) => otrasCard.appendChild(renderOtraRow(page, i)));
  otrasCard.appendChild(
    el(
      "button",
      {
        class: "btn-add",
        type: "button",
        onclick: () => {
          state.otras[page.key].push(blankOtra());
          saveState();
          renderMain();
        },
      },
      "+ Agregar otra actividad"
    )
  );
  main.appendChild(otrasCard);
}

function renderCierrePage() {
  const main = document.getElementById("main");
  main.appendChild(
    el("div", { class: "page-head" }, [
      el("div", { class: "eyebrow" }, "Paso " + (state.pageIndex + 1) + " de " + PAGES.length),
      el("h2", {}, "Cierre"),
      el("p", {}, "Estas las contesta todo el mundo."),
    ])
  );
  const card = el("div", { class: "card" });
  SURVEY_DATA.cierreQuestions.forEach((q, i) => {
    card.appendChild(
      textField(q, state.cierre[i], (v) => {
        state.cierre[i] = v;
        saveState();
        renderTabs();
      }, true)
    );
  });
  main.appendChild(card);

  const banner = el("div", { class: "status-banner", id: "status-banner" });
  main.appendChild(banner);

  const submitBtn = el(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      onclick: submitSurvey,
    },
    "Enviar respuestas"
  );
  main.appendChild(el("div", { class: "nav-buttons" }, [el("div"), submitBtn]));
}

function renderDone() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  main.appendChild(
    el("div", { class: "done-screen" }, [
      el("h2", {}, "¡Gracias! Tus respuestas quedaron registradas."),
      el("p", {}, "Ya puedes cerrar esta página. Si necesitas corregir algo o volver a llenarlo desde cero, usa el botón de abajo — se sobrescribe tu envío anterior con el nuevo."),
      el(
        "button",
        {
          class: "btn",
          type: "button",
          style: "margin-top:20px;",
          onclick: () => {
            if (!confirm("Esto borra tu avance guardado en este navegador y empieza el cuestionario en blanco. ¿Continuar?")) return;
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
          },
        },
        "Llenarlo de nuevo"
      ),
    ])
  );
}

function buildRows() {
  const rows = [];
  const timestamp = new Date().toISOString();
  const base = () => ({
    timestamp,
    nombre: state.meta.nombre,
    area_puesto: state.meta.area_puesto,
    autoriza_quien: state.meta.autoriza_quien,
  });

  SURVEY_DATA.sections.forEach((s) => {
    state.answers[s.key].forEach((ans, i) => {
      if (!ans.si_no) return;
      rows.push({
        ...base(),
        seccion: s.name,
        actividad: s.activities[i],
        la_hace: ans.si_no,
        frecuencia: ans.frecuencia,
        solo_inicio_fin: ans.solo,
        que_lo_impide: ans.impide,
        descripcion: ans.descripcion,
        mejora_propuesta: ans.mejora,
      });
    });
    state.otras[s.key].forEach((otra) => {
      if (!otra.actividad.trim()) return;
      rows.push({
        ...base(),
        seccion: s.name,
        actividad: "[OTRA] " + otra.actividad,
        la_hace: "Sí",
        frecuencia: otra.frecuencia,
        solo_inicio_fin: otra.solo,
        que_lo_impide: otra.impide,
        descripcion: otra.descripcion,
        mejora_propuesta: otra.mejora,
      });
    });
  });

  SURVEY_DATA.cierreQuestions.forEach((q, i) => {
    if (!state.cierre[i].trim()) return;
    rows.push({
      ...base(),
      seccion: "CIERRE",
      actividad: q,
      la_hace: "",
      frecuencia: "",
      solo_inicio_fin: "",
      que_lo_impide: "",
      descripcion: state.cierre[i],
      mejora_propuesta: "",
    });
  });

  return rows;
}

function showBanner(kind, text) {
  const banner = document.getElementById("status-banner");
  if (!banner) return;
  banner.className = "status-banner show status-" + kind;
  banner.textContent = text;
}

async function submitSurvey() {
  if (!state.meta.nombre || !state.meta.area_puesto) {
    alert("Falta tu nombre o tu área/puesto. Te llevamos al Paso 1 para completarlo.");
    goToPage(0);
    return;
  }
  if (!SCRIPT_URL || SCRIPT_URL.indexOf("PEGA_AQUI") !== -1) {
    showBanner("err", "Falta configurar la conexión con Google Sheets (config.js). Revisa el README.");
    return;
  }
  const rows = buildRows();
  if (rows.length === 0) {
    showBanner("err", "No hay respuestas para enviar todavía.");
    return;
  }
  showBanner("loading", "Enviando tus respuestas…");
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ rows }),
    });
    state.submitted = true;
    saveState();
    render();
  } catch (err) {
    showBanner("err", "No se pudo enviar. Revisa tu conexión a internet e intenta de nuevo.");
  }
}

function renderMain() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  const page = PAGES[state.pageIndex];
  if (page.kind === "datos") renderDatosPage();
  else if (page.kind === "seccion") renderSeccionPage(page);
  else if (page.kind === "cierre") renderCierrePage();

  if (page.kind !== "cierre") {
    const prevBtn = el(
      "button",
      { class: "btn", type: "button", onclick: () => goToPage(Math.max(0, state.pageIndex - 1)), disabled: state.pageIndex === 0 ? "disabled" : null },
      "← Anterior"
    );
    const nextBtn = el(
      "button",
      { class: "btn btn-primary", type: "button", onclick: () => goToPage(Math.min(PAGES.length - 1, state.pageIndex + 1)) },
      "Siguiente →"
    );
    main.appendChild(el("div", { class: "nav-buttons" }, [prevBtn, nextBtn]));
  }
}

function render() {
  if (state.submitted) {
    document.getElementById("tabs").innerHTML = "";
    renderDone();
    return;
  }
  renderTabs();
  renderMain();
}

render();
