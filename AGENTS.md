# 🛡️ REGLA PERMANENTE DE PROYECTO: PROTOCOLO INQUEBRANTABLE DE VERIFICACIÓN Y PRECISIÓN (Deco Vintage Guate)

Este archivo establece las reglas permanentes e inviolables de desarrollo y despliegue para este proyecto:

---

## 1. 🚫 Cero Suposiciones
* **No inventar ni asumir:** Si algo no está comprobado con datos, inspecciones reales y pruebas en vivo, **NUNCA se debe afirmar como hecho**.
* **Transparencia total:** Si falta un dato, una credencial, una URL (como el Webhook de Dokploy) o una acción manual, se le debe decir directamente al usuario sin rodeos.
* **Prohibido alucinar diagnósticos:** Si un problema persiste, se investiga la causa real en el entorno real; nunca se inventan explicaciones teóricas ni justificaciones no comprobadas.

---

## 2. 🧭 Pruebas en Vivo Obligatorias
* **Navegación como cliente real:** Antes de entregar cualquier resultado o dar por terminado un trabajo, el agente **DEBE abrir el navegador real** a través del motor de automatización (Chrome DevTools MCP).
* **Verificación activa:**
  1. Ingresar a `https://decovintage.online`.
  2. Forzar recarga limpia / bypass de caché para simular a un usuario nuevo y recurrente.
  3. Interactuar activamente con la interfaz (clics, búsquedas, filtros, modales, carritos, formularios).
  4. Comprobar que los datos, imágenes, componentes y tiempos de respuesta funcionen al 100%.

---

## 3. 📸 Reportes con Evidencia Visual Real
* **Prohibido dar reportes a ciegas:** El agente **SOLO** podrá decir *"está listo"* cuando tenga frente a sí la captura de pantalla de la web en vivo funcionando correctamente.
* **Evidencia obligatoria:** Cada reporte de finalización debe incluir capturas de pantalla de alta resolución que demuestren de forma visual e irrefutable que el problema fue resuelto o que la funcionalidad está operativa en producción.
