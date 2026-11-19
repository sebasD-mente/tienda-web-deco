# graph.md (Especificación de Ingeniería de Grafos y Coordinación Multi-Agente)

Este documento define la cuarta capa de la Ingeniería de IA (**Graph Engineering**) sobre el arnés de **Deco Vintage Guate (`deco-vintage-web`)**. Establece cuándo un loop único debe escalar a un grafo explícito de nodos aislados, qué preguntas de diseño deben responderse antes de dibujarlo, por qué un grafo generaliza a un workflow, cómo se fusionan escrituras paralelas (`Fan-out / Fan-in` con *State Reducers* y `git worktree`), y cómo operan las aristas de retroceso y las aprobaciones humanas (`Interrupt` + `Timeout`).

---

## 1. Las 4 Capas Apiladas sobre el Harness

Ninguna capa reemplaza a la anterior; cada una envuelve a la inferior metiéndola dentro de sus propios nodos, y todas descansan sobre los cimientos del **Harness**:

1. **Prompt Engineering**: Da forma a la *instrucción* ("qué decirle al modelo").
2. **Context Engineering**: Da forma a la *información* ("qué sabe el modelo antes de decidir": `Write-Select-Compress-Isolate`).
3. **Loop Engineering**: Da forma al *runtime iterativo* ("cómo itera autónomamente con un Disyuntor de 4 Candados hasta alcanzar un objetivo").
4. **Graph Engineering**: Da forma al *sistema completo* ("cómo colaboran múltiples agentes especializados con contextos privados, herramientas deterministas, evaluadores y aprobaciones humanas").

```mermaid
flowchart TB
    subgraph Capas["Las 4 Capas Apiladas sobre el Harness"]
        G["4. Graph Engineering - El Sistema: Nodos, Aristas, Estado Compartido, Routing"]
        L["3. Loop Engineering - El Runtime: Iteracion autonoma dentro de cada Nodo"]
        C["2. Context Engineering - La Informacion: Contexto privado por Nodo"]
        P["1. Prompt Engineering - La Instruccion: Rol especifico de cada Nodo"]
        H["CIMIENTOS: HARNESS ENGINEERING - Instrucciones, Estado, Verificacion, Alcance, Ciclo de Vida"]
        G --> L --> C --> P --> H
    end
```

---

## 2. Fallos del Loop Único, las 4 Preguntas de Eigent, `Graph ≠ Workflow` y la Crítica de `iii.dev`

Cuando un único bucle cerrado opera a escala sin separación estructural, sufre tres patologías inevitables:
1. **Ley de Goodhart**: El loop optimiza el indicador proxy superficial en lugar del resultado real de ingeniería o negocio.
2. **Ceguera hacia Arriba**: Un loop nunca cuestiona *"¿Sigue siendo correcto este requisito o diseño?"*; solo itera ciegamente intentando forzar una premisa equivocada.
3. **Conflicto entre Loops**: Un bucle que optimiza velocidad o volumen sabotea al bucle que optimiza calidad arquitectónica o seguridad Zero-Trust.

### 2.1 Las 4 Preguntas Obligatorias de Diseño de Eigent y las Anclas (`Anchors`)
Antes de dibujar cualquier grafo (si no puedes responderlas, no lo dibujes), responde estas cuatro preguntas estructurales:
1. **¿Qué loops alimentan a qué loops?** (`research` alimenta especificaciones a `implement`; `implement` entrega artefactos verificables a `verify`; `verify` habilita `human_approval` y `merge`).
2. **¿Qué loops poseen los objetivos que otros loops persiguen?** (El contrato humano en `goal.md`, `feature_list.json` y `sprint-contract.md` posee el objetivo; `implement` nunca redefine su propia meta).
3. **¿Qué loops pueden vetar o revertir un cambio?** (`verify` bajo `zero-inheritance` y `human_approval` poseen poder de veto y reversión hacia `implement` o `research`).
4. **¿Qué indicadores pueden moverse y cuáles deben congelarse?** (Pueden moverse el progreso de tareas y el avance del *Ratchet*; permanecen **congelados** `Overall: 100/100`, `WIP <= 1`, las 6 capas, las 65+ pruebas y los archivos `Hands off`).

**Anclas (`Anchors`)**: Nuestras anclas innegociables al mundo real son `bash ./init.sh` (ejecución real en 3 puertas incluyendo `npm run harness:check`), la auditoría aislada `zero-inheritance` y la compuerta humana.

### 2.2 Distinción `Graph ≠ Workflow` (Anthropic) y la Advertencia de `iii.dev`
- **Workflow tradicional**: Todos sus nodos son funciones deterministas y sus aristas son código estático (`if / switch`).
- **Grafo (`Graph Engineering` como generalización del Workflow)**: Contenedor mixto donde coexisten **nodos de workflow deterministas** (`merge`, suites de test), **nodos de agente completos con su propio loop interno privado** (`research`, `implement`, `verify`) y **nodos humanos (`Interrupt`)** (`human_approval`), conectados mediante routing dinámico basado en el resultado de verificación.

> [!IMPORTANT]
> **La Voz Contraria (`iii.dev` — *La Topología NO es un Muro de Carga*)**
> *"La forma es la parte fácil, y es desechable. Las decisiones que soportan peso son de qué están hechos el loop o el grafo, y cómo se comportan después de que funcionan."*
> Lo que soporta peso real de ingeniería en Deco Vintage Guate es **reproducibilidad** (`bash ./init.sh`), **observabilidad** (`correlationId` en `docs/RELIABILITY.md`) y **recuperación** (continuar desde el último checkpoint en disco tras una caída).

---

## 3. Diseño del Grafo en 6 Pasos (`5-Node Workflow Graph`)

### Paso 1 — Estado Compartido (`GraphState`) y Estrategias de Fusión (`State Reducers`)
En la capa del grafo **solo se comparte la mesa de estado**; la ventana de contexto conversacional de cada nodo es estrictamente privada. Cada campo declara su **`State Reducer`** (`overwrite`, `append` o `sum`):

```json
{
  "thread_id": "sesion-001-feat-001",
  "active_feature": "feat-001",
  "requirements": "Especificación extraída por research desde ARCHITECTURE.md, sprint-contract.md, PROJECT.md y memory/INDEX.md",
  "code_or_deliverable": ["AGENTS.md", "ARCHITECTURE.md", "init.sh"],
  "parallel_branches": [],
  "error_layer": null,
  "review_verdict": "pass",
  "approval_status": "approved",
  "attempts": 1
}
```

| Campo de `GraphState` | Tipo / Valores Permitidos | Nodo Escritor | Estrategia de Fusión (`Reducer`) | Propósito en el Grafo |
| :--- | :--- | :--- | :--- | :--- |
| `requirements` | `string` | `research` | `overwrite` (único escritor por fase) | Requisitos exactos extraídos de `ARCHITECTURE.md`, `sprint-contract.md`, `memory/` y `docs/product-specs/`. |
| `code_or_deliverable` | `string[]` | `implement` | `append` (unión disjunta sin duplicados) | Lista de archivos creados o modificados verificables físicamente en disco. |
| `parallel_branches` | `object[]` | `fan-out` / `fan-in` | `append` (registro por rama / `worktree`) | Estado individual, ruta de `git worktree` y veredicto de cada sub-tarea paralela cuando aplica `Fan-out`. |
| `error_layer` | `"research" \| "implement" \| null` | `verify` | `overwrite` | Capa donde nació el fallo: `"research"` (premisa/requisito mal planteado) o `"implement"` (defecto técnico de ejecución). |
| `review_verdict` | `"pass" \| "fail"` | `verify` | `overwrite` (`ALL PASS` tras `fan-in`) | Veredicto objetivo tras ejecutar las 3 puertas (`bash ./init.sh`) y `evaluator-rubric.md`. |
| `approval_status` | `"pending" \| "approved" \| "rejected" \| "timeout_escalated"` | `human_approval` | `overwrite` | Resolución explícita del humano o disparo determinista de `Timeout` / escalado. |
| `attempts` | `number` (`max: 15`) | `verify` / `implement` | `sum` (`operator.add`, `+1` por fallo) | Contador acumulativo gobernado por el Disyuntor de 4 Candados de `goal.md`. |

### Paso 2 — Los 5 Nodos Especializados
Cada nodo opera bajo permisos mínimos (`Fail-Closed`):

1. **Nodo 1: `research` (Agente Explorador — Solo Lectura)**:
   - **Herramientas permitidas**: Exclusivamente lectura y búsqueda (`read_file`, `grep`, `glob`). Prohibida cualquier escritura en código.
   - **Responsabilidad**: Lectura quirúrgica de `ARCHITECTURE.md`, `sprint-contract.md`, `memory/INDEX.md` y contratos de `deco-vintage-web`, escribiendo `requirements`.
2. **Nodo 2: `implement` (Agente Constructor — *Maker* con Loop Interno)**:
   - **Herramientas permitidas**: Lectura, escritura dentro de `Fair game` y autoverificación local (`maker-prompt.md`).
   - **Responsabilidad**: Ejecuta su micro-loop interno privado (*escribir -> probar -> corregir*), construye los entregables físicos y actualiza `code_or_deliverable`.
3. **Nodo 3: `verify` (Agente Evaluador Independiente — *Checker* con `zero-inheritance`)**:
   - **Herramientas permitidas**: Lectura y ejecución real de `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100`.
   - **Responsabilidad**: **Ventana de contexto completamente nueva** (`one-shot`, jamás hereda el razonamiento de `implement`). Audita con `checker-prompt.md` y `evaluator-rubric.md`, escribiendo `review_verdict` y `error_layer`.
4. **Nodo 4: `human_approval` (*Human-in-the-Loop* / Compuerta de Interrupción Humana)**:
   - **Naturaleza**: Punto de interrupción humano (`Interrupt`) con formato estandarizado y regla `Fail-Closed` de `Timeout` (ver Paso 5).
5. **Nodo 5: `merge` (Código Determinista — Sin IA)**:
   - **Naturaleza**: Procedimiento determinista de cierre.
   - **Responsabilidad**: Tras `review_verdict == "pass"` (`11-12/12`) y `approval_status == "approved"`, actualiza `feature_list.json` (`done` + `evidence`), `progress.md` (`WIP = 0`) y `session-handoff.md`, valida `clean-state-checklist.md` y ejecuta `git commit`.

### Paso 3 y Paso 4 — Aristas Explícitas, Routing por `error_layer` y Aristas Antes Implícitas
- **Ruta A (`review_verdict == "fail"` y `error_layer == "implement"`)**: Retrocede de `verify` a `implement` (`attempts += 1`) para corregir defectos técnicos sin repetir `research`.
- **Ruta B — Arista Implícita Hecha Explícita (`review_verdict == "fail"` y `error_layer == "research"`)**: Si `verify` detecta un malentendido de requisitos, directrices de negocio o límites arquitectónicos, retrocede **directamente de `verify` a `research`**.
- **Ruta C (`review_verdict == "pass"`)**: Avanza de `verify` al interruptor `human_approval`.
- **Ruta D (Resolución o `Timeout` en `human_approval`)**: `"approved"` avanza a `merge`; `"rejected"` retrocede a `implement` (o `research` si cambia el alcance); `"timeout_escalated"` detiene la rama en estado seguro (`blocked`).

```mermaid
flowchart TD
    Start(["Inicio"]) --> R["Nodo 1: research (Agente Explorador - Solo Lectura)"]
    R --> I["Nodo 2: implement (Agente Constructor - Loop Interno)"]
    I --> V{"Nodo 3: verify (Checker Aislado - zero-inheritance)"}
    V -->|"Fallo Tecnico (error_layer = implement)"| I
    V -->|"Fallo de Requisitos/Diseno (error_layer = research)"| R
    V -->|"Pasa 3 Puertas (review_verdict = pass)"| H{"Nodo 4: human_approval (Interrupt + Timeout)"}
    H -->|"Rechazado por Humano"| I
    H -->|"Timeout sin Respuesta (Escalar / Bloquear)"| Esc(["Pausa Segura: Estado blocked + Escalado"])
    H -->|"Aprobado por Humano"| M["Nodo 5: merge (Determinista: Commit + Clean Handoff)"]
    M --> End(["Fin"])
```

### Paso 5 — Checkpoints en Disco, Formato del `Interrupt` Humano y Regla de `Timeout`
Al llegar a `human_approval`, el grafo se pausa emitiendo una solicitud con **formato obligatorio de 4 bloques**:
1. **Qué pasó y qué cambió**: Tarea activa, resumen del cambio y lista exacta de archivos en `code_or_deliverable`.
2. **Evidencia verificada**: Salidas reales de `bash ./init.sh`, `Overall: 100/100`, `65/65 tests` y desglose `0-12` de `evaluator-rubric.md`.
3. **Por qué se necesita decisión humana**: Motivo específico del `Interrupt` (migración Prisma, cambio en `Dockerfile`/`entrypoint.sh`, frontera externa o hito crítico).
4. **Consecuencias de aprobar o rechazar**: `"aprobar"` ejecuta `merge` y consolida el commit; `"rechazar"` devuelve al nodo origen según `error_layer`.

**Regla Determinista de `Timeout` / Escalado (`Fail-Closed`)**: Si no se registra respuesta humana tras `N` horas configuradas (por defecto `24h`), está prohibido asumir aprobación implícita: el nodo registra `approval_status = "timeout_escalated"` y preserva el checkpoint limpio en disco.

### Paso 6 — Ejecución con `thread_id` y Reglas de `Fan-out / Fan-in` con `git worktree`
1. **Regla de `Fan-out` (División Explícita)**: Registrar en `parallel_branches` las `N` sub-tareas independientes con *disjoint file ownership*.
2. **Aislamiento Físico con `git worktree`**: Toda rama paralela que escriba o compile código se ejecuta en un **`git worktree` separado** (ej. `.agents/worktrees/`).
3. **Regla de `Fan-in` (Criterio de Fusión)**: Conjunción estricta **`ALL PASS`** en las 3 Puertas antes de fusionar.
4. **Medición Empírica del Paralelismo**: Registrar tiempo *wall-clock*, tokens y calidad para verificar ahorro neto.

---

## 4. Los 3 Patrones de Delegación Multi-Agente

| Patrón | Cómo Comparten Contexto | Cuándo Usarlo | Regla de Oro Inquebrantable |
| :--- | :--- | :--- | :--- |
| **1. `Coordinator` (Coordinador)** | **Cero herencia (`zero-inheritance`)**: Los trabajadores inician con ventana limpia y reciben el prompt autocontenido redactado por el Coordinador. | Flujos multi-fase (`research -> implement -> verify`), como nuestra auditoría `Maker-Checker`. | **Sintetizar, nunca delegar la comprensión**: El Coordinador lee los hallazgos primero y redacta una especificación exacta y autocontenida. |
| **2. `Fork` (Bifurcación Paralela)** | **Herencia completa de prefijo**: Los hijos heredan el contexto ya cargado del padre reutilizando la `Prompt Cache`. | Dividir 2 o 3 sub-tareas independientes sobre el mismo contexto base. | **Estrictamente 1 solo nivel con bloqueo *at call time* (`Gotcha #8`)**: `fork` se mantiene en el pool del hijo pero el runtime bloquea su llamada recursiva. |
| **3. `Swarm` (Enjambre Plano)** | **Pizarra compartida**: Un equipo fijo de especialistas toma tareas independientes de `feature_list.json`. | Trabajo prolongado con ramas independientes en paralelo en el DAG. | **Plantilla plana (`Flat Roster`)**: Ningún miembro crea sub-agentes adicionales y cada uno opera con *disjoint file ownership* en su `git worktree`. |

---

## 5. Cuándo SÍ y Cuándo NO Dibujar un Grafo (El Impuesto de Orquestación)

> **Advertencia sobre el Impuesto de Orquestación (`Orchestration Tax` — Addy Osmani)**:
> *"Tú eres el GIL de tus agentes de IA. Arrancar 5 agentes en paralelo es gratis; revisar y fusionar lo que hicieron 5 agentes es carísimo, porque tu juicio es el único procesador en serie."*

**Solo construye un grafo si cumples al menos 3 de estos 5 criterios**:
1. [ ] **Independencia real de unidades** con *disjoint file ownership* aislables en `git worktree`.
2. [ ] **Ramificación o retroceso diferenciado** (`research` vs `implement` según `error_layer`).
3. [ ] **Valor de los Checkpoints** para interrumpir y reanudar sin empezar de cero.
4. [ ] **Aceptación automática por nodo** (`bash ./init.sh`, `evaluator-rubric.md`).
5. [ ] **Beneficio de colaboración > Coste de coordinación**.
