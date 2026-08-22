// ⚠️ Reemplazá esta URL por la que te da "Implementar" en tu Google Apps Script
// (tiene que terminar en /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkIL5xI9wCPHI5ST_cKHJGCQnt7xgVxd7yuzLNA10BshRZsRcpJIz60bnYeFLaATB4OA/exec";
const MAX_FILE_MB = 5;

// Convierte un File a un objeto { base64, mimeType, filename }
function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result viene como "data:<mime>;base64,<data>"
      const base64 = reader.result.split(",")[1];
      resolve({
        base64,
        mimeType: file.type || "application/octet-stream",
        filename: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wireForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const statusEl = form.querySelector("[data-status]");
  const fileInput = form.querySelector('input[type="file"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type=submit]");
    const originalLabel = submitBtn.textContent;

    // Validar tamaño de archivo antes de convertir
    const file = fileInput?.files?.[0];
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      statusEl.textContent = `❌ El archivo supera los ${MAX_FILE_MB}MB permitidos.`;
      statusEl.setAttribute("data-state", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    statusEl.textContent = "";
    statusEl.removeAttribute("data-state");

    try {
      // Tomar todos los campos excepto el de archivo (se maneja aparte)
      const formData = new FormData(form);
      formData.delete("adjunto");
      const data = Object.fromEntries(formData.entries());

      console.log(`[${formId}] archivo seleccionado:`, file ? `${file.name} (${file.type || "sin tipo"}, ${file.size} bytes)` : "ninguno");

      // Si hay archivo, convertirlo a base64 y agregarlo al payload
      if (file) {
        data.adjunto = await fileToPayload(file);
        console.log(`[${formId}] adjunto convertido a base64:`, {
          filename: data.adjunto.filename,
          mimeType: data.adjunto.mimeType,
          base64Length: data.adjunto.base64.length,
        });
      }

      console.log(`[${formId}] payload a enviar:`, data);

      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });

      console.log(`[${formId}] fetch enviado (mode: no-cors, no se puede leer la respuesta real)`);

      statusEl.textContent = "✅ Recibimos tu consulta. Te contactamos a la brevedad.";
      statusEl.setAttribute("data-state", "success");
      form.reset();
    } catch (err) {
      console.error(`[${formId}] error al enviar:`, err);
      statusEl.textContent = "❌ Hubo un error al enviar. Probá de nuevo o escribinos por mail.";
      statusEl.setAttribute("data-state", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

wireForm("form-cotizacion");
wireForm("form-trabajo");

// Modo oscuro: alterna data-theme en <html> y lo persiste en localStorage.
// El estado inicial ya lo resuelve el script inline en el <head>.
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
}

// Menú mobile: hamburguesa abre/cierra el nav y se cierra al elegir un link.
function setupNavToggle() {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!btn || !nav) return;

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", String(open));
  }

  btn.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("nav-open"));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setOpen(false);
  });
}

// Carrusel de servicios: flechas laterales + auto-avance cada 3s, con pausa
// mientras el usuario interactúa (hover, foco, touch o arrastre manual).
function setupServiceCarousels() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTOPLAY_MS = 3000;

  document.querySelectorAll(".service-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".service-track");
    const prevBtn = carousel.querySelector(".carousel-arrow.prev");
    const nextBtn = carousel.querySelector(".carousel-arrow.next");
    if (!track) return;

    function getStep() {
      const firstCard = track.querySelector(".service-card");
      if (!firstCard) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return firstCard.getBoundingClientRect().width + gap;
    }

    const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const atStart = () => track.scrollLeft <= 4;

    function goNext() {
      track.scrollTo({ left: atEnd() ? 0 : track.scrollLeft + getStep(), behavior: "smooth" });
    }

    function goPrev() {
      track.scrollTo({ left: atStart() ? track.scrollWidth : track.scrollLeft - getStep(), behavior: "smooth" });
    }

    let timer = null;
    function stopAutoplay() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      timer = setInterval(goNext, AUTOPLAY_MS);
    }
    function restartAutoplay() {
      startAutoplay();
    }

    prevBtn?.addEventListener("click", () => { goPrev(); restartAutoplay(); });
    nextBtn?.addEventListener("click", () => { goNext(); restartAutoplay(); });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);
    track.addEventListener("pointerdown", stopAutoplay);
    track.addEventListener("touchstart", stopAutoplay, { passive: true });
    track.addEventListener("touchend", () => setTimeout(startAutoplay, 1500), { passive: true });

    startAutoplay();
  });
}

// Modal de detalle: reutiliza el título y la descripción completa de la
// card (que en la grilla queda recortada a 2 líneas).
function setupServiceModal() {
  const modal = document.getElementById("service-modal");
  if (!modal) return;

  const titleEl = document.getElementById("service-modal-title");
  const descEl = document.getElementById("service-modal-desc");
  const listEl = document.getElementById("service-modal-list");
  const closeBtn = modal.querySelector(".service-modal-close");

  const highlights = [
    "Profesionales calificados y verificados",
    "Presupuesto claro, sin cargo ni compromiso",
    "Respuesta en menos de 24 horas hábiles",
  ];

  document.querySelectorAll(".btn-detail").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".service-card");
      titleEl.textContent = card?.querySelector("h3")?.textContent ?? "";
      descEl.textContent = card?.querySelector("p")?.textContent ?? "";
      listEl.innerHTML = "";
      highlights.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        listEl.appendChild(li);
      });
      modal.showModal();
    });
  });

  closeBtn?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
}

// Lee los servicios y sus categorías directamente del DOM de la sección
// #servicios, para no duplicar esa lista a mano en el formulario.
function buildServiceGroupsFromDOM() {
  const groups = [];
  document.querySelectorAll("#servicios .service-category").forEach((category) => {
    const groupLabel = category.querySelector("h3")?.textContent.trim() ?? "";
    const items = Array.from(category.querySelectorAll(".btn-detail[data-service]")).map((btn) => ({
      value: btn.dataset.service,
      label: btn.closest(".service-card")?.querySelector("h3")?.textContent.trim() ?? btn.dataset.service,
    }));
    if (items.length) groups.push({ label: groupLabel, items });
  });
  return groups;
}

// Selector múltiple con chips: elegís varios servicios, cada uno queda como
// chip removible, y se valida que haya al menos uno antes de enviar.
function setupServiceChips() {
  const field = document.querySelector("[data-services-field]");
  if (!field) return;

  const optionsContainer = field.querySelector("[data-chip-options]");
  const selectedContainer = field.querySelector("[data-chips-selected]");
  const errorEl = field.querySelector("[data-chips-error]");
  const hiddenInput = field.querySelector('input[type="hidden"][name="servicio"]');

  const selected = new Map(); // value -> label

  function render() {
    selectedContainer.innerHTML = "";
    selected.forEach((label, value) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = label;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", `Quitar ${label}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => toggle(value, label, false));

      chip.appendChild(removeBtn);
      selectedContainer.appendChild(chip);
    });
    selectedContainer.hidden = selected.size === 0;
    hiddenInput.value = Array.from(selected.values()).join(", ");
    if (selected.size > 0) errorEl.hidden = true;
  }

  function toggle(value, label, force) {
    const shouldSelect = force ?? !selected.has(value);
    if (shouldSelect) selected.set(value, label);
    else selected.delete(value);

    optionsContainer
      .querySelector(`.chip-option[data-value="${value}"]`)
      ?.setAttribute("aria-pressed", String(shouldSelect));
    render();
  }

  buildServiceGroupsFromDOM().forEach((group) => {
    const groupLabel = document.createElement("p");
    groupLabel.className = "chip-group-label";
    groupLabel.textContent = group.label;
    optionsContainer.appendChild(groupLabel);

    const groupEl = document.createElement("div");
    groupEl.className = "chip-group";
    group.items.forEach((item) => {
      const optBtn = document.createElement("button");
      optBtn.type = "button";
      optBtn.className = "chip-option";
      optBtn.dataset.value = item.value;
      optBtn.setAttribute("aria-pressed", "false");
      optBtn.textContent = item.label;
      optBtn.addEventListener("click", () => toggle(item.value, item.label));
      groupEl.appendChild(optBtn);
    });
    optionsContainer.appendChild(groupEl);
  });

  // El mensaje de error va al final de las opciones, no arriba de todo.
  optionsContainer.appendChild(errorEl);

  render();

  field.closest("form")?.addEventListener("submit", (e) => {
    if (selected.size === 0) {
      errorEl.hidden = false;
      e.preventDefault();
      e.stopPropagation();
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, { capture: true });
}

setupThemeToggle();
setupNavToggle();
setupServiceCarousels();
setupServiceModal();
setupServiceChips();
