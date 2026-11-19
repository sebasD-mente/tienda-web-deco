# Clean State Checklist (Lista de Verificación de Estado Limpio — 5 Dimensiones)

> **Fundamento (Ley de Evolución del Software de Lehman):** Sin una limpieza activa al final de cada sesión en **Deco Vintage Guate (`deco-vintage-web`)**, la entropía y la deuda operativa (capturas sueltas en raíz, archivos temporales, pruebas a medias, notas desactualizadas) crecen exponencialmente hasta degradar el arranque en frío del agente y las suites de higiene (`tests/repo-hygiene.test.js`).

Ninguna sesión del agente se considera terminada hasta que las **5 dimensiones** estén verificadas:

- [ ] **1. Dimensión de Build / Integridad**: El frontend (`vite build`), el servidor (`node --check server.js`) y los archivos estructurados (`feature_list.json`, esquemas JSON y documentos) validan sin errores de sintaxis (`0 CRLF` en scripts POSIX/ESM del arnés).
- [ ] **2. Dimensión de Pruebas (`Verification`)**: La ruta estándar de verificación (`bash ./init.sh` y `npm run harness:check`) se ejecutó y pasó al 100%, incluyendo los escáneres Zero-Trust y las 65 pruebas automatizadas preexistentes (cero regresiones).
- [ ] **3. Dimensión de Progreso (`State`)**: `progress.md`, `feature_list.json` y `session-handoff.md` fueron actualizados y reflejan la verdad exacta (ninguna tarea está marcada como `done` sin evidencia ejecutable real y hay como máximo 1 tarea en `in-progress`).
- [ ] **4. Dimensión de Artefactos (`Cleanup`)**: Se eliminaron todos los archivos temporales (`*.tmp`, `*.bak`, `*.swp`, capturas `*.png`/`*.jpg` en raíz, `scratch/`, `test_evidence/`) y no quedaron cambios a medio hacer sin documentar.
- [ ] **5. Dimensión de Inicio (`Restartability`)**: La próxima sesión puede ejecutar `bash ./init.sh` inmediatamente y empezar a trabajar en menos de 3 minutos sin rescate manual humano ni riesgo para el contenedor de producción (`Dockerfile` / `entrypoint.sh`).

## Comandos de Verificación Rápida de las 5 Dimensiones

```bash
# Dimensiones 1, 2 y 3 (Integridad, 3 Puertas, 65 Tests, Build y Estado con WIP <= 1):
bash ./init.sh
node scripts/validate-harness.mjs --min-score 100
npm run harness:check

# Dimensión 4 (Detección de artefactos huérfanos y estado del árbol de trabajo):
git status --short
```
