# Web Deco Vintage Proyect — Accumulated Project Experience (Google Harness²)

> Memoria técnica acumulativa de **Web Deco Vintage Proyect**.

<experience>
cue: Mutaciones en catálogo web, filtros de obras, carrito de compras y estado React
lesson: Reparar cualquier discrepancia de datos en el servicio o estado productor (2 capas atrás) en lugar de parchar componentes consumidores con valores por defecto silenciosos. Verificar siempre que vite build y npm run harness:check pasen con código 0 y comprobar la actualización reactiva en Chrome DevTools MCP.
evidence: Arnés físico de verificación y auditoría de DOM real.
confidence: high
</experience>

<experience>
cue: Verificación en vivo post-despliegue de Web Deco Vintage Proyect
lesson: Abrir https://decovintage.online mediante Chrome DevTools MCP con recarga limpia de caché, interactuar con búsqueda, filtros y carrito, y adjuntar captura de pantalla real antes de cerrar cualquier ticket.
evidence: Protocolo de pruebas en vivo de Deco Vintage Guate.
confidence: high
</experience>

<experience>
cue: Búsqueda multi-token en vivo con prefijos cortos ('Harry P') y stop-words accidentales ('Por') en el motor de búsqueda
lesson: Permitir prefijos cortos (>= 1 char) exclusivamente en Título, Subtítulo y Tags (allowShortPrefix: true) para no colapsar la escritura progresiva, aislando Franquicia y Categoría (allowShortPrefix: false, >= 3 chars) para prevenir falsos positivos por iniciales de categorías. Excluir stop-words de la concatenación de compuestos contiguos (buildCandidateWords) y evaluar tokens individuales que coincidan con stop-words como prefijos de palabras de contenido si la consulta es de un solo token ('Por' para 'Porsche') o en el último token activo sin espacio.
evidence: COM-20261023-001, Suite tests/searchEngine.test.js (14/14 tests en verde) y npm run harness:check (código 0).
confidence: high
</experience>

<experience>
cue: Uso del campo tags en pósters del catálogo de Deco Vintage (posters.tags)
lesson: PROHIBIDO autogenerar, enriquecer masivamente con IA o inyectar listas de tags genéricos en los pósters. En Deco Vintage, el campo tags se utiliza exclusivamente para la palabra clave o apodo interno con el que el equipo denomina cada obra dentro de la empresa, curado manualmente poco a poco para evitar falsos positivos y contaminación en el buscador.
evidence: Directriz soberana de negocio de Sebastián Jiménez durante Auditoría 360° (2026-10-23) y candado en tests/posterVisionService.test.js.
confidence: high
</experience>

<experience>
cue: Seguimiento de pedidos personalizados y consulta de estado de taller (consultar_estado_taller / tracker web)
lesson: Mantener en pausa cualquier modificación al flujo de seguimiento de taller en Web Deco Vintage Proyect hasta que finalice la fase de pruebas de Modulo_Ventas. Toda venta y seguimiento real (desde el primer abono hasta producción y entrega) se gestiona en la base de datos de Modulo_Ventas, con el cual se integrará futuramente vía contrato API aislado.
evidence: Directriz soberana de arquitectura de Sebastián Jiménez durante Auditoría 360° (2026-10-23).
confidence: high
</experience>

<experience>
cue: Resolución de imágenes en servicios de Visión IA (posterVisionService), persistencia de metadatos (catalogStorage) y cálculo de precios en pedidos personalizados (customOrderService)
lesson: Confinar estrictamente URLs remotas de visión a HTTPS sobre el host autorizado storage.googleapis.com y rutas locales a public/posters/uploads con extensiones de imagen válidas; desacoplar persistMetadata enviando posters: [] para no disparar 546 re-upserts/re-embeddings al guardar settings/categorías; y recalcular siempre en el servidor los precios unitarios y totales de órdenes personalizadas (calculateAuthoritativeOrderTotals) ignorando montos manipulados por el cliente.
evidence: COM-20261023-FASE2-BACKEND-SEGURIDAD, tests/backend-security-catalog.test.js y npm run harness:check (HARNESS_PASS).
confidence: high
</experience>

<experience>
cue: Gestión de memoria de entrenamiento de J.A.R.V.I.S. (purgeExpiredEventsFromMemory, storeKnowledge.js) y consultas de catálogo en /api/jarvis/chat
lesson: Nunca purgar ownerDirectives ni documentos customDocuments mediante listas de palabras clave genéricas ('comicon', 'fan fest', 'cayala'); purgar únicamente por IDs históricos vencidos o eventDate explícito en formato YYYY-MM-DD anterior a la fecha actual. Servir el catálogo en /api/jarvis/chat desde una caché en RAM (getCachedFullCatalog, TTL 5 min) invalidada automáticamente en cada mutación de pósters, categorías, franquicias o settings, y deduplicar la hidratación inicial de /api/jarvis en el cliente con una promesa en vuelo compartida (syncKnowledgeFromServer).
evidence: COM-20261023-FASE3-JARVIS-CORE, tests/jarvis-memory-cache.test.js y npm run harness:check (HARNESS_PASS).
confidence: high
</experience>

<experience>
cue: Sincronización de panel administrativo (AdminSettingsTab.jsx), restablecimiento de valores (resetCatalogToDefault) y flujo de checkout WhatsApp (CartDrawer.jsx)
lesson: Evitar invocaciones a setters de useState no declarados (setServerStatus) que disparan ReferenceError silenciosos en bloques try/catch; asegurar que resetCatalogToDefault restablezca únicamente BASE_SETTINGS y resincronice con PostgreSQL sin asignar nunca BASE_POSTERS vacío a _cachedPosters; y en el checkout (CartDrawer.jsx) capturar data.orderNumber (#CP-XXXX) devuelto por POST /api/custom-orders para inyectarlo en el mensaje de WhatsApp e invocar onClearCart() al finalizar.
evidence: COM-20261023-FASE4-FRONTEND-UX-ADMIN, tests/frontend-contracts.test.js y npm run harness:check (HARNESS_PASS).
confidence: high
</experience>


