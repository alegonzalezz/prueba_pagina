# Duolim v2 — sitio estático

## Estructura
- `index.html` — página completa
- `style.css` — estilos
- `script.js` — conecta los dos formularios con Google Apps Script
- `apps-script-code.gs` — código que va en script.google.com (no se sube a GitHub)

## Pasos para publicar

### 1. Google Apps Script (recibe los formularios y manda el mail por Gmail)
1. Andá a [script.google.com](https://script.google.com) → proyecto nuevo.
2. Borrá el contenido del editor y pegá el archivo `apps-script-code.gs`.
3. Cambiá `DESTINATARIO` por el mail donde querés recibir las consultas.
4. (Opcional) Si querés guardar los leads en una Sheet, creá una Google Sheet vacía, copiá su ID de la URL y pegalo en `SHEET_ID`.
5. Guardá, elegí la función `testEnvio` en el desplegable y ejecutá para probar que llega el mail.
6. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: vos
   - Acceso: cualquier usuario
7. Copiá la URL que termina en `/exec`.

### 2. Conectar el sitio con el script
1. Abrí `script.js`.
2. Reemplazá `SCRIPT_URL` por la URL del paso anterior.

### 3. Subir a GitHub Pages
1. Creá un repo nuevo en GitHub (o usá uno existente).
2. Subí `index.html`, `style.css` y `script.js` a la raíz del repo (no subas el `.gs`, ese va solo en Apps Script).
3. Settings → Pages → Source: rama `main`, carpeta `/root`.
4. En unos minutos el sitio queda en `https://tu-usuario.github.io/tu-repo/`.

### 4. Cada vez que edites el Apps Script
Tenés que volver a "Implementar → Gestionar implementaciones → editar → nueva versión" para que los cambios salgan en la URL pública.

## Notas de diseño
- Tipografías: Space Grotesk (títulos) + IBM Plex Sans (texto) + IBM Plex Mono (labels/datos), cargadas desde Google Fonts.
- Sin frameworks ni build step — se edita y se sube directo.
- El formulario usa `mode: "no-cors"`, así que no podés leer la respuesta real del servidor desde el navegador. Confirmá los envíos revisando el mail o la Sheet.
