# 🛡️ REGLA PERMANENTE DE PROYECTO: PROTOCOLO INQUEBRANTABLE DE VERIFICACIÓN Y PRECISIÓN (Deco Vintage Guate)

Este archivo establece las reglas permanentes e inviolables de desarrollo, arquitectura y despliegue para este proyecto:

---

## 1. 🚫 Cero Suposiciones & Cero Hacks
* **No inventar ni asumir:** Si algo no está comprobado con datos, inspecciones reales y pruebas en vivo, **NUNCA se debe afirmar como hecho**.
* **Prohibido parchar en código problemas de infraestructura:** Si un problema es de Docker, variables de entorno, permisos de Linux, PostgreSQL o Dokploy, se resuelve directamente en la causa raíz de la infraestructura. Prohibido agregar código parche o workarounds que acumulen deuda técnica.
* **Transparencia total:** Si falta un dato, una credencial, una URL o una acción manual, se le debe decir directamente al usuario sin rodeos.

---

## 2. 🎯 Protocolo Quirúrgico de Prompts y Despacho
* **Estructura Mandatoria de Prompts:** Todo prompt de ejecución para Agent IDE o Jules debe contener: Objetivo Aislado, Archivos Exactos, Prohibiciones Explícitas de Contrato (Frontend React), Criterios de Aceptación y Pasos de Verificación.
* **Aislamiento Atómico:** Se interviene una sola capa a la vez, comprobando que no existan efectos secundarios en la memoria RAM, Event Loop o pool de conexiones.

---

## 3. 🧭 Pruebas en Vivo Obligatorias
* **Navegación como cliente real:** Antes de entregar cualquier resultado o dar por terminado un trabajo, el agente **DEBE abrir el navegador real** a través del motor de automatización (Chrome DevTools MCP).
* **Verificación activa:**
  1. Ingresar a `https://decovintage.online`.
  2. Forzar recarga limpia / bypass de caché para simular a un usuario nuevo y recurrente.
  3. Interactuar activamente con la interfaz (clics, búsquedas, filtros, modales, carritos, formularios).
  4. Comprobar que los datos, imágenes, componentes y tiempos de respuesta funcionen al 100%.

---

## 4. 📸 Reportes con Evidencia Visual Real
* **Prohibido dar reportes a ciegas:** El agente **SOLO** podrá decir *"está listo"* cuando tenga frente a sí la captura de pantalla de la web en vivo funcionando correctamente.
* **Evidencia obligatoria:** Cada reporte de finalización debe incluir capturas de pantalla de alta resolución que demuestren de forma visual e irrefutable que el problema fue resuelto o que la funcionalidad está operativa en producción.
