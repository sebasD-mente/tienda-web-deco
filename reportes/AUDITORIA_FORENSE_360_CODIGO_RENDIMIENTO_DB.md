# 🔬 AUDITORÍA FORENSE 360° DE CÓDIGO, RENDIMIENTO Y BASE DE DATOS (NIVEL STAFF)
**Evaluador:** Lead Cloud Architect & Staff Systems Engineer (Antigravity)  
**Objetivo:** Diagnóstico milimétrico del código fuente local (Backend Node.js, Frontend React, Prisma ORM, PostgreSQL y Motores de IA J.A.R.V.I.S.).  
**Modo de Operación:** **SOLO AUDITORÍA Y DIAGNÓSTICO (Cero modificaciones en código de producción).**  
**Archivo HTML Estructurado Generado:** [reportes/AUDITORIA_FORENSE_360_CODIGO_RENDIMIENTO_DB.html](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/reportes/AUDITORIA_FORENSE_360_CODIGO_RENDIMIENTO_DB.html)

---

## 📊 MATRIZ RESUMEN DE SALUD ARQUITECTÓNICA

| Vector de Inspección | Estado General | Hallazgos Críticos | Hallazgos Medios | Hallazgos Bajos / Optimización |
| :--- | :---: | :---: | :---: | :---: |
| **A. Base de Datos & Prisma (PostgreSQL)** | ⚠️ ALERTA | 1 | 2 | 1 |
| **B. Backend & Event Loop (Node.js / Express)** | ⚠️ ALERTA | 1 | 2 | 2 |
| **C. Inteligencia Artificial (J.A.R.V.I.S. & RAG)** | 🟡 ESTABLE | 0 | 2 | 1 |
| **D. Frontend & UX (React / Vite)** | ⚠️ ALERTA | 1 | 2 | 1 |
| **TOTALES** | — | **3** | **8** | **5** |

---

# 1. 🗄️ VECTOR A: CAPA DE BASE DE DATOS & PRISMA (PostgreSQL)

### 🔴 Hallazgo A.1: Doble Consulta Masiva al Catálogo y Saturación del Connection Pool
* **Ubicación Exacta:** [routes/jarvisRoutes.js:118](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/routes/jarvisRoutes.js#L118) y [services/jarvisService.js:774](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L774) vía [services/embeddingService.js:100-109](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/embeddingService.js#L100-L109).
* **Severidad:** **Crítica**
* **Causa Raíz & Diagnóstico:**  
  En cada turno de conversación de J.A.R.V.I.S. (`POST /api/jarvis/chat`):
  1. `routes/jarvisRoutes.js` ejecuta `getFullCatalog()`, el cual lanza **4 consultas simultáneas** a PostgreSQL mediante `Promise.all` (`groupBy` de categorías, `findMany` con conteo relacional en `Franchise`, `findUnique` en `StoreSettings` y `findMany` de **TODOS** los pósters con `sizes` y `franchise`).
  2. Inmediatamente después, `chatWithJarvis` llama a `findSimilarPosters()`, el cual vuelve a ejecutar **OTRA consulta idéntica** `prisma.poster.findMany({ where: { isPublished: true }, include: { sizes: true, franchise: true } })` para calcular similitud coseno.
  3. **Impacto:** Un solo mensaje de usuario abre y satura entre 5 y 6 conexiones a PostgreSQL descargando el catálogo completo dos veces consecutivas. Con 10 usuarios simultáneos en el chat, el pool por defecto de Prisma (5-10 conexiones) se agota instantáneamente, arrojando errores `Timed out fetching a new connection from the connection pool` y elevando el consumo de RAM.
* **Propuesta Quirúrgica:**  
  1. Implementar un caché en memoria con TTL corto (60-120 segundos) en el backend para `getFullCatalog()` con invalidación reactiva cuando se ejecuten mutaciones (`POST/PUT/DELETE /api/catalog/*`).
  2. Eliminar la duplicación de fetch en `jarvisRoutes.js` reutilizando el catálogo en memoria.
  3. En `embeddingService.js`, seleccionar estrictamente los campos `{ id: true, embedding: true }` en lugar de traer todas las relaciones anidadas `sizes` y `franchise` en cada cálculo semántico.

---

### 🟡 Hallazgo A.2: *Full Table Scans* en Catálogo por Falta de Índices Compuestos y Búsqueda `ILIKE`
* **Ubicación Exacta:** [prisma/schema.prisma:76-82](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/prisma/schema.prisma#L76-L82) y [services/catalogService.js:200-206](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/catalogService.js#L200-L206).
* **Severidad:** **Media**
* **Causa Raíz & Diagnóstico:**  
  1. En `schema.prisma`, el campo booleano `isPublished` **no tiene índice**. Sin embargo, el 100% de las consultas públicas en `getAllPosters` filtran por `isPublished: true` y `estado: { not: 'DESCONTINUADO' }`. Al no existir un índice compuesto (`isPublished`, `estado`, `categoria`), el motor de PostgreSQL debe recurrir a Sequential Scans o Bitmap Index Scans lentos.
  2. En `catalogService.js`, el parámetro `search` genera la condición `OR: [ { titulo: { contains: search, mode: 'insensitive' } }, ... ]`. Prisma traduce esto a `ILIKE '%termino%'`. Los índices B-Tree estándar de PostgreSQL **no pueden utilizarse** en búsquedas que inician con comodín (`%...`). Cuando el catálogo supere las 1,000 obras, cada búsqueda provocará un *Full Table Scan* completo en la CPU del VPS.
* **Propuesta Quirúrgica:**  
  1. En `schema.prisma`, agregar índices compuestos:
     ```prisma
     @@index([isPublished, estado, categoria])
     @@index([isPublished, estado, createdAt])
     ```
  2. Para búsquedas textuales de alta velocidad, habilitar la extensión nativa `pg_trgm` en PostgreSQL y crear un índice GIN sobre `(titulo gin_trgm_ops, subtitulo gin_trgm_ops, descripcion gin_trgm_ops)`.

---

### 🟡 Hallazgo A.3: *Table Churn* e Inestabilidad de Locks en Actualización de Tamaños (`poster_sizes`)
* **Ubicación Exacta:** [services/catalogService.js:367-370](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/catalogService.js#L367-L370).
* **Severidad:** **Media**
* **Causa Raíz & Diagnóstico:**  
  En `upsertPosterFromAdmin`, al editar un póster existente, la transacción ejecuta `await tx.posterSize.deleteMany({ where: { posterId: existingPoster.id } })` y luego recrea todos los tamaños en `tx.poster.update({ sizes: { create: sizesData } })`.
  Borrar todos los registros y volverlos a insertar en cada guardado provoca fragmentación de índices en PostgreSQL (*bloat*), genera churn masivo de IDs `cuid` y aumenta el riesgo de contención de locks (*deadlocks*) si dos administradores o procesos sincronizan el mismo producto concurrentemente.
* **Propuesta Quirúrgica:**  
  Implementar actualización idempotente de tamaños mediante `upsert` basado en la clave única compuesta `@@unique([posterId, sizeId])`, modificando únicamente los precios o dimensiones que hayan cambiado sin destruir los registros previos.

---

### 🔵 Hallazgo A.4: Despliegue de Migraciones Automáticas Ausente en `entrypoint.sh`
* **Ubicación Exacta:** [entrypoint.sh:75](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/entrypoint.sh#L75).
* **Severidad:** **Baja (DevOps / Automatización)**
* **Causa Raíz & Diagnóstico:**  
  El script de arranque del contenedor ejecuta directamente `exec node /app/server.js` sin invocar `npx prisma migrate deploy`. Si se despliega una nueva versión que incluya una migración en `prisma/migrations/`, la base de datos de producción no aplicará las nuevas tablas o columnas automáticamente, generando un crash de Prisma en runtime.
* **Propuesta Quirúrgica:**  
  Agregar un paso previo en `entrypoint.sh`:
  ```bash
  echo "[Boot] Sincronizando migraciones de PostgreSQL..."
  npx prisma migrate deploy || echo "[Boot] Advertencia: Fallo al aplicar migraciones automáticas."
  ```

---

# 2. ⚡ VECTOR B: CAPA DE BACKEND, ASINCRONÍA Y EVENT LOOP (Node.js / Express)

### 🔴 Hallazgo B.1: Ausencia de Handlers Globales de Proceso (`unhandledRejection` / `uncaughtException`)
* **Ubicación Exacta:** [server.js:1-156](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/server.js#L1-L156).
* **Severidad:** **Crítica**
* **Causa Raíz & Diagnóstico:**  
  `server.js` no cuenta con listeners para `process.on('unhandledRejection')` ni `process.on('uncaughtException')`. En Node.js v20+, cualquier excepción no capturada en una promesa asíncrona en segundo plano (por ejemplo, timeout de Google Cloud Storage, rechazo de red en Gemini o desconexión abrupta de PostgreSQL) **termina inmediatamente el proceso de Node con exit code 1**, tumbando el servidor web y dejando a todos los usuarios con un error 502 Bad Gateway hasta que Docker/Dokploy reinicie el contenedor.
* **Propuesta Quirúrgica:**  
  Implementar un blindaje a nivel de proceso en `server.js` con logging forense completo para capturar y recuperar fallos asíncronos sin matar el hilo principal del servidor Express.

---

### 🟡 Hallazgo B.2: Fuga de Timer Handles en `Promise.race` de J.A.R.V.I.S.
* **Ubicación Exacta:** [services/jarvisService.js:799-813](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L799-L813).
* **Severidad:** **Media**
* **Causa Raíz & Diagnóstico:**  
  El timeout de la llamada a Gemini se construye con `setTimeout(() => reject(...), 25000)`. El `setTimeout` de 25 segundos **nunca es limpiado con `clearTimeout`**. Aunque la IA responda exitosamente en 600ms, el temporizador permanece encolado en la cola de timers de Node.js durante 25 segundos completos, reteniendo referencias en memoria.
* **Propuesta Quirúrgica:**  
  Gestionar el ID del temporizador explícitamente y ejecutar `clearTimeout(timerId)` en un bloque `finally`, o utilizar la API estándar `AbortSignal.timeout(25000)` nativa de Node.js 20.

---

### 🟡 Hallazgo B.3: Bloqueo del Event Loop por Vector Math en JavaScript puro
* **Ubicación Exacta:** [services/embeddingService.js:116-128](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/embeddingService.js#L116-L128).
* **Severidad:** **Media**
* **Causa Raíz & Diagnóstico:**  
  La búsqueda semántica descarga todos los registros de pósters y ejecuta en JavaScript un bucle calculando el producto punto de vectores de 768 dimensiones. Para 1,000 obras, esto representa **768,000 multiplicaciones y sumas en coma flotante ejecutadas en el hilo único de Node.js**, bloqueando el procesamiento de peticiones HTTP de otros usuarios mientras dure el cálculo.
* **Propuesta Quirúrgica:**  
  Migrar el almacenamiento y búsqueda de vectores directamente a PostgreSQL con la extensión `pgvector` (`embedding vector(768)`). La búsqueda de los 4 posters más cercanos se realiza con un query indexado `ORDER BY embedding <=> $queryVector LIMIT 4` ejecutado en C nativo en la base de datos en menos de 2ms.

---

### 🔵 Hallazgos B.4 & B.5: Operaciones de Archivo Síncronas (`fs.*Sync`) y Body Limit Elevado (50MB)
* **Ubicación Exacta:** [services/jarvisService.js:147, 156, 175](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L147) y [server.js:88-90](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/server.js#L88-L90).
* **Severidad:** **Baja**
* **Causa Raíz & Diagnóstico:**  
  1. Uso de `fs.readFileSync` y `fs.unlinkSync` bloqueando el hilo de ejecución en I/O de disco.
  2. Configuración de `limit: '50mb'` en `/api/catalog/posters`, exponiendo el parser JSON a sobrecargas innecesarias.
* **Propuesta Quirúrgica:**  
  1. Reemplazar llamadas a `fs.promises.*` no bloqueantes.
  2. Reducir el límite de `/api/catalog/posters` a 2MB y canalizar las subidas de imágenes pesadas a través de `multer.memoryStorage()`.

---

# 3. 🧠 VECTOR C: CAPA DE INTELIGENCIA ARTIFICIAL (J.A.R.V.I.S. & RAG)

### 🟡 Hallazgo C.1: Falta de Backoff Exponencial y Jitter ante Errores `429 Too Many Requests`
* **Ubicación Exacta:** [services/jarvisService.js:787-857](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L787-L857).
* **Severidad:** **Media**
* **Causa Raíz & Diagnóstico:**  
  Cuando Google Gemini responde con un error de cuota o rate limit (`429 RESOURCE_EXHAUSTED`), el bucle pasa de inmediato al siguiente modelo (`gemini-3.5-flash-lite`, luego `gemini-flash-latest`) en ráfaga (menos de 20ms). Dado que los modelos de la misma clave comparten el límite de RPM/TPM del proyecto, todos fallan en cascada en menos de 100ms.
* **Propuesta Quirúrgica:**  
  Introducir una breve pausa con jitter exponencial (ej: `sleep(300 + Math.random() * 500)`) cuando se detecte un código 429 antes de saltar al siguiente modelo o clave candidata.

---

### 🟡 Hallazgo C.2: Desfase de Precio por cm² entre Base de Datos y J.A.R.V.I.S.
* **Ubicación Exacta:** [services/jarvisService.js:108](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L108) vs [prisma/schema.prisma:110](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/prisma/schema.prisma#L110).
* **Severidad:** **Media (Consistencia Comercial)**
* **Causa Raíz & Diagnóstico:**  
  En `calculateCustomPrice`, está codificado en duro `const baseRatePerCm2 = 0.046;`, mientras que en la tabla `store_settings` de PostgreSQL el valor oficial es `customCm2Price = 0.048`. Si el dueño del negocio actualiza el precio por centímetro cuadrado desde el panel de administración, J.A.R.V.I.S. continuará cotizando con el valor desactualizado de 0.046.
* **Propuesta Quirúrgica:**  
  Inyectar el valor dinámico `catalog.settings.customCm2Price` directamente en la función `calculateCustomPrice` en lugar de utilizar constantes fijas.

---

### 🔵 Hallazgo C.3: Simulación Estática en la Herramienta `consultar_estado_taller`
* **Ubicación Exacta:** [services/jarvisService.js:574-594](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/services/jarvisService.js#L574-L594).
* **Severidad:** **Baja (Deuda Técnica)**
* **Causa Raíz & Diagnóstico:**  
  La herramienta `consultar_estado_taller` genera un estado simulado fijo (`mockTaller`, siempre con 75% de avance y etapa `PRODUCCION_HP_LATEX`) debido a que aún no existe una tabla de órdenes de taller (`Order`) en PostgreSQL.
* **Propuesta Quirúrgica:**  
  Modelar la entidad `Order` en `schema.prisma` (`id`, `orderNumber`, `clientPhone`, `status`, `progressPercent`, `deliveryEstimate`) para que J.A.R.V.I.S. consulte datos de fabricación 100% reales.

---

# 4. 🎨 VECTOR D: CAPA DE FRONTEND & EXPERIENCIA DE USUARIO (React / Vite)

### 🔴 Hallazgo D.1: Importación Residual del SDK de Firebase / Firestore en el Cliente
* **Ubicación Exacta:** [src/data/storeKnowledge.js:194-223, 237-241](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/data/storeKnowledge.js#L194-L223) y [src/utils/firebase.js:1-35](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/utils/firebase.js#L1-L35).
* **Severidad:** **Crítica (Arquitectura & Rendimiento del Bundle)**
* **Causa Raíz & Diagnóstico:**  
  A pesar de que el backend y la arquitectura migraron al 100% a PostgreSQL con Prisma sobre el VPS, `src/data/storeKnowledge.js` **aún importa `firebase/firestore` y ejecuta `getDoc` y `setDoc` contra Google Firestore en el navegador**.
  1. **Peso Muerto en Bundle:** El SDK de Firebase (`@firebase/app`, `@firebase/firestore`) añade **más de 300 KB** al bundle de producción que se descarga en los dispositivos móviles de los clientes, afectando negativamente el Largest Contentful Paint (LCP) y el First Input Delay (FID/INP).
  2. **Violación de Single Source of Truth:** Genera llamadas de red redundantes y fallidas hacia un Firestore ya descontinuado.
* **Propuesta Quirúrgica:**  
  Eliminar las importaciones de Firebase en `storeKnowledge.js` y hacer que la memoria de J.A.R.V.I.S. se consulte y persista exclusivamente mediante los endpoints REST del backend (`/api/jarvis` y `/api/jarvis/save`). Desinstalar la dependencia `firebase` del `package.json`.

---

### 🟡 Hallazgo D.2: Re-renders Masivos en el Árbol Raíz de `App.jsx`
* **Ubicación Exacta:** [src/App.jsx:65-96](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/App.jsx#L65-L96).
* **Severidad:** **Media (Rendimiento UX e INP)**
* **Causa Raíz & Diagnóstico:**  
  `App.jsx` concentra en un único componente raíz los estados `cart`, `searchQuery`, `posters`, `categories`, `isCartOpen`, etc.  
  Cada vez que el usuario teclea en el buscador de la barra de navegación o altera la cantidad de un ítem en el carrito, `App.jsx` ejecuta un re-render de **todos** los componentes hijos montados (`Navbar`, `HeroCarousel`, `CategoryShelf`, `CatalogPage`, `Footer`, `JarvisAgent`).
* **Propuesta Quirúrgica:**  
  1. Aislar el estado del carrito en un Contexto React (`CartContext`) o tienda atómica (`zustand`), para que solo los componentes que consumen el carrito (Navbar Badge, CartDrawer) se re-rendericen.
  2. Desacoplar `searchQuery` en `Navbar` aplicando un debounce de 250ms antes de emitir la búsqueda al catálogo.

---

### 🟡 Hallazgos D.3 & D.4: Riesgo de *Cumulative Layout Shift* (CLS) y Validación en Checkout WhatsApp
* **Ubicación Exacta:** [src/components/OptimizedImage.jsx:82-103](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/components/OptimizedImage.jsx#L82-L103) y [src/components/CartDrawer.jsx:51-54](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/components/CartDrawer.jsx#L51-L54).
* **Severidad:** **Media / Baja**
* **Causa Raíz & Diagnóstico:**  
  1. `OptimizedImage.jsx` carece de `aspect-ratio` fijo y `srcset` responsive, arriesgando saltos visuales (*CLS*) y descargando imágenes completas de 1400px en celulares.
  2. `CartDrawer.jsx` valida el teléfono únicamente con `!customerPhone.trim()`, permitiendo letras o caracteres inválidos.
* **Propuesta Quirúrgica:**  
  1. Configurar `aspect-ratio: 3/4` en el contenedor de imagen e implementar `srcset` con la versión thumb (480px) y full (1400px).
  2. Validar teléfonos con expresión regular `/^[0-9+ ]{8,15}$/` y normalizar el prefijo de país 502 de Guatemala.

---

# 5. 🎯 PLAN DE ACCIÓN Y HOJA DE RUTA QUIRÚRGICA EN 3 FASES

1. **Fase 1: Estabilidad & Bundle (Alta Prioridad)**
   * Purgar Firebase de `storeKnowledge.js` e higienizar el bundle (-300KB).
   * Registrar handlers globales `unhandledRejection` en `server.js`.
   * Corregir Timer Leak en `Promise.race` (`clearTimeout`).
   * Sincronizar fórmula de precio por cm² en J.A.R.V.I.S. (0.048).
2. **Fase 2: Base de Datos & Conexiones (Media Prioridad)**
   * Implementar In-Memory Cache con TTL para `getFullCatalog()`.
   * Eliminar doble fetch en `/api/jarvis/chat`.
   * Añadir índices compuestos en `schema.prisma`.
   * Implementar actualización atómica e idempotente en `poster_sizes`.
3. **Fase 3: Optimización Frontend & Core Web Vitals (Mejora Continua)**
   * Implementar `srcset` y `aspect-ratio` en `OptimizedImage`.
   * Desacoplar estado del carrito (`CartContext`).
   * Validación telefónica estricta con código de país para WhatsApp.
   * Migrar búsqueda RAG a `pgvector` en PostgreSQL.

---
*Reporte generado y guardado permanentemente en el directorio `/reportes/`.*
