// ============================================
// CONFIGURACIÓN - Editá estas constantes
// ============================================
const DESTINATARIO = "tu-email@gmail.com"; // A dónde llegan las consultas
const SHEET_ID = ""; // Opcional: ID de una Google Sheet para guardar los leads (dejar vacío si no querés usarlo)
const SHEET_NAME = "Consultas";

// ============================================
// Recibe el POST del formulario de React
// ============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const nombre = data.nombre || "";
    const empresa = data.empresa || "";
    const email = data.email || "";
    const telefono = data.telefono || "";
    const servicio = data.servicio || "";
    const mensaje = data.mensaje || "";
    const tipo = data.tipo || "cotizacion"; // "cotizacion" o "trabajo"

    // Armar el asunto y cuerpo según el tipo de formulario
    let asunto, cuerpo;

    if (tipo === "trabajo") {
      asunto = `Nueva postulación: ${nombre}`;
      cuerpo = `
        Nueva postulación laboral

        Nombre: ${nombre}
        Email: ${email}
        Teléfono: ${telefono}
        Zona: ${data.zona || "-"}
        Mensaje: ${mensaje}
      `;
    } else {
      asunto = `Nueva cotización: ${empresa || nombre}`;
      cuerpo = `
        Nueva solicitud de cotización

        Nombre: ${nombre}
        Empresa: ${empresa}
        Email: ${email}
        Teléfono: ${telefono}
        Servicio: ${servicio}
        Mensaje: ${mensaje}
      `;
    }

    // Enviar el mail desde tu cuenta de Gmail
    GmailApp.sendEmail(DESTINATARIO, asunto, cuerpo, {
      replyTo: email, // así podés responder directo al cliente
    });

    // Guardar en Google Sheets (opcional)
    if (SHEET_ID) {
      guardarEnSheet(data, tipo);
    }

    return respuestaJSON({ result: "success" });
  } catch (error) {
    return respuestaJSON({ result: "error", message: error.toString() });
  }
}

// ============================================
// Guarda cada consulta en una fila de la Sheet
// ============================================
function guardarEnSheet(data, tipo) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Fecha", "Tipo", "Nombre", "Empresa", "Email",
      "Teléfono", "Servicio/Zona", "Mensaje",
    ]);
  }

  sheet.appendRow([
    new Date(),
    tipo,
    data.nombre || "",
    data.empresa || "",
    data.email || "",
    data.telefono || "",
    data.servicio || data.zona || "",
    data.mensaje || "",
  ]);
}

// ============================================
// Helper para devolver JSON con headers correctos
// ============================================
function respuestaJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Función de prueba (podés ejecutarla manualmente
// desde el editor para probar que el mail funciona)
// ============================================
function testEnvio() {
  doPost({
    postData: {
      contents: JSON.stringify({
        tipo: "cotizacion",
        nombre: "Juan Pérez",
        empresa: "Empresa de Prueba SA",
        email: "juan@ejemplo.com",
        telefono: "11-1234-5678",
        servicio: "oficinas",
        mensaje: "Esto es una prueba de envío.",
      }),
    },
  });
}
