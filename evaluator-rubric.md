# Evaluator Rubric (Rúbrica de Evaluación Independiente — Solo para Agente Checker Aislado)

> REGLA DE AISLAMIENTO (`zero-inheritance` + `one-shot`): Prohibido rellenar esta rúbrica en la misma sesión de chat que implementó los cambios (Maker) o reutilizar vía `send_message` a un Evaluador previo.
> Esta evaluación debe ser ejecutada exclusivamente por un Agente Evaluador (Checker) efímero de un solo uso (`one-shot`) en una ventana de contexto limpia (`zero-inheritance`) o por un revisor humano.

## Protocolo de Aislamiento Físico del Checker (`Zero-Inheritance` y `One-Shot`)

1. **Ventana de Contexto Nueva y Aislada (`Zero-Inheritance`)**: La evaluación debe ejecutarse en una sesión de chat independiente o mediante un Sub-agente Evaluador aislado que **NO herede el historial de conversación ni el razonamiento interno del Maker**.
2. **Entradas Objetivas Únicamente**: El Evaluador solo puede inspeccionar el contrato (`sprint-contract.md` y `feature_list.json`), los archivos en disco / diferencias (`git status`, `git diff`), la ejecución real en vivo de `bash ./init.sh` y esta rúbrica.
3. **Postura Escéptica y Regla de Calibración**:
   - *"Tu trabajo es encontrar fallos con evidencia; aprobar un trabajo con defectos ocultos es tu fracaso."*
   - **Regla Dura de Calibración en Verificación**: Dar **0 puntos** en la Dimensión 2 (`Verificación`) si el Evaluador no ejecutó `bash ./init.sh` en su propia sesión aislada y pegó la salida exacta verificada.
4. **Instancia Efímera de Un Solo Uso (`One-Shot / one-shot`) — Prohibida la Re-Auditoría en la Misma Sesión**:
   - **Un Checker = Una Sola Auditoría (`one-shot` / *Stateless per Pass*)**: Queda explícitamente anulada para el rol Evaluador cualquier regla genérica de continuar sub-agentes existentes. Cada auditoría inicial o re-auditoría tras corregir un hallazgo **DEBE** invocar una instancia completamente nueva (`invoke_subagent` `one-shot` con ventana virgen); el Maker tiene estrictamente prohibido enviar `send_message` al `conversationId` de un Evaluador ya utilizado.
   - **Prohibido ofrecer re-auditoría y orden imperativa de rechazo ante `send_message`**: El Evaluador tiene prohibido despedirse ofreciendo *"envíame un mensaje cuando lo corrijas para re-auditar"* y debe cerrar su dictamen recordando que cualquier re-auditoría exige una **nueva instancia `one-shot` desde cero**. Si recibe un `send_message` pidiendo re-evaluar cambios o volver a calificar esta rúbrica en la misma sesión, tiene **orden imperativa de rechazar la solicitud sin calificar** respondiendo con Bolígrafo Rojo (`ERROR` / `POR QUÉ` / `SOLUCIÓN (FIX)`) que exija lanzar un `invoke_subagent` nuevo (`one-shot`).

---

## Protocolo de Calibración del Evaluador (3–5 Rondas contra Juicio Humano)

De fábrica, los modelos son jueces indulgentes incluso en sesiones separadas: detectan matices dudosos y luego racionalizan por qué "es aceptable aprobar". Para alinear el Agente Checker con el estándar real de **Deco Vintage Guate**, ejecuta **entre 3 y 5 rondas de calibración** siguiendo estos 5 pasos:

1. **Ejecutar en un sprint completado**: Corre el Agente Evaluador aislado sobre una tarea o sprint real terminado.
2. **Comparar contra juicio humano**: Puntúa tú mismo las 6 dimensiones (`0-2`) sin sesgo y contrasta punto por punto dónde divergió el Checker respecto a tu revisión humana.
3. **Endurecer criterios ambiguos**: En cada dimensión donde hubo divergencia (por ejemplo, aprobar pruebas superficiales o pasar por alto alcance extra), reescribe la pregunta o umbral de aprobación/fallo haciéndolo más específico y verificable por máquina.
4. **Re-ejecutar y verificar alineación**: Vuelve a lanzar el Evaluador en limpio sobre el caso auditado para comprobar que la nueva redacción corrige la desviación sin generar falsos positivos arbitrarios.
5. **Repetir y registrar (`3–5 rondas`)**: Repite el ciclo durante **3 a 5 rondas** hasta que las calificaciones y veredictos del Evaluador coincidan consistentemente con la revisión humana, dejando trazabilidad de cada ajuste en la tabla siguiente.

### Registro de Calibración del Evaluador (`Calibration Log`)

| Ronda | Tarea / Hito Evaluado | Puntuación Checker vs. Humano | Divergencia Detectada | Ajuste Aplicado a la Rúbrica / Verificador |
| :--- | :--- | :--- | :--- | :--- |
| **0 (Baseline)** | Adaptación del Arnés Maestro en `deco-vintage-web` | `N/A` (pendiente primera auditoría en Modo Crítico / Loop) | Ninguna | Protocolo `One-Shot Ephemeral Checker`, `Zero-Inheritance` y 65 tests Zero-Trust activos en Puerta 3 |

---

## Tabla de Calificación Objetiva (0 a 12 Puntos) — Pendiente Primera Auditoría `One-Shot`

| Dimensión | Pregunta de Control | Puntuación (0, 1 o 2) | Evidencia / Notas |
| :--- | :--- | :---: | :--- |
| **1. Corrección** | ¿El resultado implementado cumple al 100% con el comportamiento pedido en `sprint-contract.md` y respeta las directrices de negocio en `memory/`? (0=No, 1=Parcial, 2=Completo) | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **2. Verificación** | ¿Pasaron realmente las 65 pruebas, chequeos estáticos Zero-Trust, `vite build` y `bash ./init.sh` ejecutados por el propio Checker aislado? *(Regla dura: 0 si no ejecutó `init.sh` en vivo)* | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **3. Disciplina de Alcance** | ¿El cambio se mantuvo estrictamente dentro de `sprint-contract.md` y `WIP = 1` sin tocar archivos `Hands off` ni comprometer `Dockerfile` / `entrypoint.sh`? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **4. Fiabilidad** | ¿Se manejan casos borde, rutas de error `Fail-Closed`, anti-SSRF/traversal y limpieza de temporales sin introducir fragilidad? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **5. Mantenibilidad** | ¿Se respetan las 6 capas de `ARCHITECTURE.md`, topes de concisión y cero enlaces muertos? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **6. Preparación de Entrega** | ¿Están completamente sincronizados `feature_list.json`, `progress.md`, `loop-state.md` y `session-handoff.md`? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |

**Puntuación Total:** `Pendiente / 12`

## Veredicto Final del Checker Independiente
- [ ] **ACEPTAR** (Puntuación 11-12 y ninguna dimensión en 0)
- [ ] **REVISAR / DEVOLVER AL GENERADOR** (Puntuación 7-10 o falta evidencia ejecutable)
- [ ] **BLOQUEAR** (Puntuación <= 6 o rompió la línea base)

## Seguimiento y Correcciones Exigidas (Con formato ERROR / POR QUÉ / SOLUCIÓN)

Ninguna (rúbrica limpia lista para ser ejecutada en contexto aislado `zero-inheritance` cuando se active el Modo Crítico / Loop `/goal`).
