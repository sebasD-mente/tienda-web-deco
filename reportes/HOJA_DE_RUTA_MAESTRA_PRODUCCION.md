# 🚀 HOJA DE RUTA MAESTRA: ELEVACIÓN A PRODUCCIÓN DE GRADO EMPRESARIAL
**Proyecto:** Deco Vintage Guate (`decovintage.online`)  
**Ecosistema:** Deko Labs  
**Comandante del Producto:** Sebastián (Visionary & Creative Director)  
**Lead Architect & Orchestrator:** Antigravity (Principal Cloud Architect & DevSecOps Lead)  
**Escuadrón de Ejecución:** Agent IDE (Gemini 3.7 High) & Jules (GitHub Repo Agent)  
**Fecha de Inicio:** Septiembre 2026  
**Objetivo:** Transformar la plataforma en un activo digital 100% robusto, escalable, sin deudas técnicas, con IA optimizada (RAG) y resiliencia de taller.

---

## 🧭 1. Modelo Operativo del Escuadrón de IA

Para operar quirúrgicamente sin crear fricciones ni romper componentes existentes, asignamos responsabilidades exactas según las fortalezas de cada agente:

```
                                  ESTRUCTURA DE MANDO Y EJECUCIÓN
  
                       ┌──────────────────────────────────────────────┐
                       │           SEBASTIÁN (Product Owner)          │
                       │        Visión Creativa y Reglas de Negocio   │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          ANTIGRAVITY (Lead Architect)        │
                       │     Diseño Quirúrgico, Estrategia & QA       │
                       └──────────────┬────────────────┬──────────────┘
                                      │                │
                     (Órdenes Locales)│                │(Órdenes de Repo)
                                      ▼                ▼
         ┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
         │              AGENT IDE              │   │                JULES                │
         │         (Gemini 3.7 High)           │   │         (GitHub Repo Agent)         │
         │                                     │   │                                     │
         │ • Modificaciones de Código Local    │   │ • Auditoría de PRs y Commits        │
         │ • Inspección de Memoria y EventLoop │   │ • Verificación de Migraciones Git   │
         │ • Pruebas con Chrome DevTools MCP   │   │ • Limpieza de Assets y Dependencias │
         │ • Despliegue en Dokploy             │   │ • Versionado y Release Tags         │
         └─────────────────────────────────────┘   └─────────────────────────────────────┘
```

---

## 🗺️ 2. Hoja de Ruta Quirúrgica por Fases

---

### 🛡️ FASE 1: BLINDAJE OPERATIVO & CERO CAÍDAS (Prioridad P0)
> **Meta:** Blindar el motor de Node.js, la memoria RAM y el pool de conexiones de PostgreSQL para que el taller opere con carga pesada sin riesgo de apagón (*OOM Killer*).

| Paso | Tarea Quirúrgica | Archivos Afectados | Agente Asignado | Criterio de Aceptación |
| :---: | :--- | :--- | :---: | :--- |
| **1.1** | **Semáforo de Memoria en Sharp:** Implementar control de concurrencia (`p-limit(2)`) y liberación de buffers en RAM al procesar WebP. | `services/imageService.js` | **Agent IDE** | Subida concurrente de 5 imágenes no supera 180MB de RAM Heap. |
| **1.2** | **Desaturación de Prisma en Guardado Masivo:** Reemplazar `Promise.all` en `/api/catalog/save` por procesamiento en lotes de 3 o transacción unificada. | `routes/catalogRoutes.js` | **Agent IDE** | Guardar 50 pósters simultáneos consume máximo 2 conexiones de BD sin timeouts. |
| **1.3** | **Garbage Collector en Rate Limiter:** Añadir temporizador de barrido y desalojo de IPs inactivas en el `Map` in-memory. | `middleware/rateLimit.js` | **Agent IDE** | El `Map` no acumula más de las IPs activas en la última ventana de 60s. |
| **1.4** | **Restricción Estricta de CORS & Cabeceras:** Fijar `origin: ['https://decovintage.online']` y preparar middleware `helmet`. | `server.js` | **Jules** | Rechazo automático de orígenes no autorizados y cabeceras de seguridad activas. |

---

### 🗄️ FASE 2: PERSISTENCIA TOTAL & CERO ESTADO VOLÁTIL (Prioridad P1)
> **Meta:** Convertir la aplicación en 100% Stateless migrando todos los ajustes a PostgreSQL con inicializadores automáticos anti-pantalla blanca.

| Paso | Tarea Quirúrgica | Archivos Afectados | Agente Asignado | Criterio de Aceptación |
| :---: | :--- | :--- | :--- | :--- |
| **2.1** | **Modelado Relacional en Prisma:** Crear modelos `StoreSettings` y `JarvisMemory` en `schema.prisma`. | `prisma/schema.prisma` | **Jules** | Esquema validado con tipos estrictos y migraciones limpias. |
| **2.2** | **Migración & Seeder Automático:** Implementar inicializador en el arranque que cargue los valores por defecto si la tabla está vacía. | `services/catalogService.js`<br>`entrypoint.sh` | **Agent IDE** | Al reiniciar el contenedor o desplegar en Dokploy, los ajustes nunca son `null`. |
| **2.3** | **Paginación Determinista & Creación de Índices:** Añadir `@@index([createdAt])` y `@@index([precioMinimo])` y desempate por `id`. | `prisma/schema.prisma`<br>`services/catalogService.js` | **Agent IDE** | Paginación infinita en catálogo sin saltos de elementos ni duplicados. |
| **2.4** | **Contenedor No-Root de Producción:** Configurar la directiva `USER node` en Dockerfile y asegurar permisos de lectura/escritura. | `Dockerfile`<br>`entrypoint.sh` | **Jules** | El proceso de Node.js corre bajo UID no privilegiado en Dokploy. |

---

### 🤖 FASE 3: INTELIGENCIA ARTIFICIAL J.A.R.V.I.S. RAG (Prioridad P2)
> **Meta:** Erradicar el consumo excesivo de tokens (ahorro del 96.2%), bajar la latencia a menos de 1s y eliminar alucinaciones de stock.

| Paso | Tarea Quirúrgica | Archivos Afectados | Agente Asignado | Criterio de Aceptación |
| :---: | :--- | :--- | :--- | :--- |
| **3.1** | **Activación de `pgvector` en PostgreSQL:** Habilitar la extensión vectorial en la base de datos de Dokploy. | PostgreSQL Engine | **Agent IDE** | `CREATE EXTENSION IF NOT EXISTS vector;` ejecutado con éxito. |
| **3.2** | **Pipeline de Embeddings Automático:** Generar vector de 768 dimensiones con `text-embedding-004` al guardar/editar obras. | `services/catalogService.js`<br>`services/jarvisService.js` | **Agent IDE** | Cada póster nuevo o editado almacena su vector en PostgreSQL. |
| **3.3** | **Purga Radical del System Instruction:** Remover el bucle que inyectaba todo el catálogo en texto crudo; fijar prompt base en ~600 tokens. | `services/jarvisService.js` | **Agent IDE** | Cada turno de chat consume menos de 1,000 tokens en total. |
| **3.4** | **Búsqueda Semántica Dinámica:** Inyectar únicamente las 3 a 5 obras con menor distancia coseno (`<=>`) ante preguntas de inventario. | `services/jarvisService.js` | **Agent IDE** | Respuestas de J.A.R.V.I.S. en < 1.0 segundo con 100% de precisión de catálogo. |

---

### 🌟 FASE 4: CERTIFICACIÓN 360° & ENTREGA DE ORO (Prioridad P3)
> **Meta:** Validación final en vivo con pruebas de estrés, Core Web Vitals al 100% y navegación real.

| Paso | Tarea Quirúrgica | Herramienta / Método | Agente Asignado | Criterio de Aceptación |
| :---: | :--- | :--- | :--- | :--- |
| **4.1** | **Prueba de Estrés del Taller:** Simular subida masiva de 15 pósters en alta resolución y cambios de estado simultáneos. | Script de Carga k6 / Automa | **Agent IDE** | Cero errores 500/502, RAM estable bajo 250MB. |
| **4.2** | **Auditoría Core Web Vitals en Vivo:** Medir LCP, INP y CLS en el catálogo público con navegación real de cliente. | Chrome DevTools MCP | **Agent IDE** | LCP < 1.2s, INP < 100ms, CLS 0 en `decovintage.online`. |
| **4.3** | **Validación de Checkout & WhatsApp:** Comprobar cotizador de cuadros personalizados, generación de enlaces y fallbacks offline. | Pruebas E2E en Navegador | **Agent IDE** | Flujo de compra y atención 100% funcional. |
| **4.4** | **Etiquetado de Release & Manual de Operaciones:** Crear tag de versión `v2.0-enterprise` y documentación de entrega. | Git Releases / Markdown | **Jules** | Repositorio limpio con documentación actualizada para el equipo. |

---

## 📜 3. Protocolo Inquebrantable de Operación Quirúrgica

Para asegurar que **nunca más se introduzca deuda técnica ni se rompa nada en producción**, todo el equipo seguirá 3 reglas de oro:

1. **Regla del Aislamiento:** Nunca se modifican dos capas al mismo tiempo. Primero se repara la persistencia, se prueba en vivo, y solo tras verificarla se pasa a la siguiente.
2. **Regla del Contrato Intacto:** Ningún cambio en el backend puede alterar los nombres de propiedades o respuestas JSON que el frontend de React ya consume.
3. **Regla de la Evidencia Visual:** Ninguna tarea se da por completada sin inspección real en el navegador mediante Chrome DevTools y captura de pantalla de verificación.

---

## 🏁 4. Siguiente Paso Inmediato: Arranque de la Fase 1

El escuadrón está listo. Para dar el primer golpe quirúrgico, ejecutaremos la **Fase 1 (Blindaje Operativo)**:
* **Agent IDE** aplicará el control de memoria en Sharp (`services/imageService.js`) y la desaturación de transacciones en Prisma (`routes/catalogRoutes.js`).
* **Jules** revisará las restricciones de CORS y cabeceras en el repositorio.
