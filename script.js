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
