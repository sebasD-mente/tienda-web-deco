# Tema de Memoria: Reglas de Producción del Arnés y Entorno Local

- **Tipo Taxonómico**: `feedback` / `project` / `user`
- **Última Actualización**: 2026-11-18
- **Propósito**: Registrar decisiones operativas del arnés, preferencias del usuario y particularidades multiplataforma que NO se deducen leyendo el código de la aplicación (cumpliendo el Gotcha #4).

---

## 1. Preferencias del Usuario y Modalidad de Trabajo (`user` / `feedback`)

- **Interacción 100% Natural con el Usuario (`Agent-Owned Harness`)**: Sebastián se comunica siempre en español y en lenguaje natural (ideas, decisiones de negocio, revisiones de estabilidad o solicitudes directas). El agente traduce de forma transparente los acuerdos hacia `feature_list.json`, `sprint-contract.md`, `progress.md` y `session-handoff.md`.
- **Cero Salto de Tareas (`Strict Sequential DAG` y `WIP = 1`)**: Las tareas registradas en `feature_list.json` (`N >= 1`) se ejecutan una por una respetando estrictamente sus dependencias (`dependencies`) y entregables físicos (`required_files`). Nunca se debe adelantar trabajo de una tarea cuyas dependencias no estén en `done`, ni crear documentos en `docs/` sin información real del proyecto (`Anti-Doc Bloat`).
- **Máxima Prioridad a la Estabilidad de Producción**: Cualquier cambio debe proteger el flujo de despliegue en contenedor Docker/Dokploy y advertir de inmediato si existe algún riesgo para el sitio en producción.

## 2. Ejecución Multiplataforma de `init.sh` (`project` / `feedback`)

- **Punto de Entrada Único POSIX (`init.sh`)**: Se mantiene un único punto de entrada canónico POSIX (`init.sh`, protegido con `eol=lf` en `.gitattributes`) para todas las plataformas, evitando divergencias entre Windows local y contenedores Linux/CI:
  - **Linux / macOS / CI**: `bash ./init.sh`
  - **Windows PowerShell (vía Git Bash)**: `& "C:\Program Files\Git\bin\bash.exe" ./init.sh`

## 3. Reglas Operativas de Memoria Persistente (`project` / `reference`)

- **Invariante de Guardado en Dos Pasos (`Two-Step Save Invariant`, Gotchas #1 y #15)**:
  1. **Paso 1**: Escribir o actualizar primero el archivo detallado en `memory/topics/<tema>.md`.
  2. **Paso 2**: Añadir o actualizar únicamente **una línea de gancho (`<= 120` caracteres)** en `memory/INDEX.md` apuntando al archivo de `memory/topics/`.
- **Orden de Prioridad de Instrucciones (Gotcha #2)**:
  - `Organización` -> `Usuario Global` -> `Proyecto (AGENTS.md)` -> `Subdirectorio (AGENTS.md)` -> `Local Override (AGENTS.local.md / CLAUDE.local.md)`.
