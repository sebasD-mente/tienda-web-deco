# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)** en **Deco Vintage Guate (`deco-vintage-web`)**.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001`..`feat-005` Certificadas y Listas para Producción)
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Última tarea cerrada (`done`):** `feat-005` (*Pulido forense pre-despliegue: `sizeId: 'CUSTOM'` en `WebOrderPayload` y aislamiento de archivos indexados `image_N`*).
- **Siguiente tarea secuencial:** Pendiente de nuevo requerimiento del usuario en lenguaje natural.

## Alcance Incluido (`Fair game`)
- Para la próxima tarea activa: Definir aquí los archivos exactos antes de codificar.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido conectar bases de datos cruzadas o leer/editar `.env` / `.env.local`.
- Prohibido tocar `Dockerfile`, `entrypoint.sh`, migraciones históricas o debilitar validadores/tests.
- Prohibido autogenerar `posters.tags` o reutilizar instancias Checker previas vía `send_message` (`one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los `required_files` existen físicamente en disco con tamaño `> 0`.
2. `bash ./init.sh`, `node scripts/validate-harness.mjs --min-score 100` y `npm run harness:check` devuelven código `0` (`Overall: 100/100`, `85/85 tests PASS` y `vite build` limpio).
