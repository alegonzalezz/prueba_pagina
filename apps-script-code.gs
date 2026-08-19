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
    Logger.log("Body crudo recibido: " + e.postData.contents);

    const data = JSON.parse(e.postData.contents);

    Logger.log("¿Tiene adjunto?: " + !!data.adjunto);
    if (data.adjunto) {
      Logger.log("Adjunto -> filename: " + data.adjunto.filename +
        ", mimeType: " + data.adjunto.mimeType +
        ", largo base64: " + (data.adjunto.base64 ? data.adjunto.base64.length : 0));
    }

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

    // Armar las opciones del mail, agregando el adjunto si vino en el payload
    const opciones = {
      replyTo: email, // así podés responder directo al cliente
    };

    if (data.adjunto && data.adjunto.base64) {
      try {
        const bytes = Utilities.base64Decode(data.adjunto.base64);
        const blob = Utilities.newBlob(
          bytes,
          data.adjunto.mimeType || "application/octet-stream",
          data.adjunto.filename || "adjunto"
        );
        opciones.attachments = [blob];
        cuerpo += `\n\n(Se adjuntó el archivo: ${data.adjunto.filename})`;
        Logger.log("Adjunto armado correctamente como blob, tamaño: " + bytes.length + " bytes");
      } catch (attachErr) {
        Logger.log("Error al armar el adjunto: " + attachErr.toString());
      }
    }

    // Enviar el mail desde tu cuenta de Gmail
    GmailApp.sendEmail(DESTINATARIO, asunto, cuerpo, opciones);
    Logger.log("Mail enviado a " + DESTINATARIO + " con adjunto: " + !!opciones.attachments);

    // Guardar en Google Sheets (opcional)
    if (SHEET_ID) {
      guardarEnSheet(data, tipo);
    }

    return respuestaJSON({ result: "success" });
  } catch (error) {
    Logger.log("Error en doPost: " + error.toString());
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
      "Teléfono", "Servicio/Zona", "Mensaje", "Adjunto",
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
    data.adjunto ? data.adjunto.filename : "",
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

// Igual que testEnvio, pero simulando que llegó un adjunto (un .txt mínimo en base64)
// Útil para probar el armado del blob sin depender del formulario web.
function testEnvioConAdjunto() {
  const base64DeHola = Utilities.base64Encode("Hola, esto es un adjunto de prueba.");
  doPost({
    postData: {
      contents: JSON.stringify({
        tipo: "trabajo",
        nombre: "Juan Pérez",
        email: "juan@ejemplo.com",
        telefono: "11-1234-5678",
        zona: "CABA",
        mensaje: "Esto es una prueba de envío con adjunto.",
        adjunto: {
          base64: base64DeHola,
          mimeType: "text/plain",
          filename: "prueba.txt",
        },
      }),
    },
  });
}
