// ⚠️ Reemplazá esta URL por la que te da "Implementar" en tu Google Apps Script
// (tiene que terminar en /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx8j-36QZ-gmAWZXt9cDNmCLV8siCu9kAz6p7ZYpe7tJPmTFdYiNq9sKUDbIerFiIfuGA/exec";

function wireForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const statusEl = form.querySelector("[data-status]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type=submit]");
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    statusEl.textContent = "";
    statusEl.removeAttribute("data-state");

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });

      statusEl.textContent = "✅ Recibimos tu consulta. Te contactamos a la brevedad.";
      statusEl.setAttribute("data-state", "success");
      form.reset();
    } catch (err) {
      console.error(err);
      statusEl.textContent = "❌ Hubo un error al enviar. Probá de nuevo o escribinos por mail.";
      statusEl.setAttribute("data-state", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = form === document.getElementById("form-trabajo")
        ? "Enviar postulación"
        : "Enviar solicitud";
    }
  });
}

wireForm("form-cotizacion");
wireForm("form-trabajo");
