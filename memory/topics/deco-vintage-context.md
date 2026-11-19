# Tema de Memoria: Directrices Soberanas de Negocio y Producción — Deco Vintage Guate

- **Tipo Taxonómico**: `project` / `feedback` / `reference`
- **Última Actualización**: 2026-11-18
- **Propósito**: Preservar las reglas de negocio dictadas por Sebastián Jiménez y las fronteras con sistemas hermanos que NO son deducibles únicamente inspeccionando el código fuente (Gotcha #4).

---

## 1. Curación Manual Exclusiva de `posters.tags` (`project` / `feedback`)

- **Prohibición absoluta de autogeneración de tags**: Está terminantemente prohibido autogenerar con IA, enriquecer masivamente o inyectar listas de palabras clave genéricas en el campo `tags` de los pósters.
- **Razón de negocio**: En Deco Vintage Guate, `tags` se reserva exclusivamente para el apodo o clave interna con que el taller y el equipo identifican cada obra en la empresa, curado manualmente poco a poco para evitar falsos positivos y contaminación en el buscador.

## 2. Frontera Inter-Proyecto con `Modulo_Ventas` (`https://ventas.decovintage.online`) (`project`)

- **Aislamiento absoluto de bases de datos**: `Web Deco Vintage` y `Modulo_Ventas` operan sobre instancias y bases de datos PostgreSQL estrictamente separadas; está terminantemente prohibido conectar Prisma de un repositorio a la BD del otro.
- **Integración aprobada por Contrato API S2S (`feat-002` a `feat-004`)**: Ambos sistemas comparten exactamente la misma fórmula matemática de Medidas Especiales (`+ Q 25.00` por corte especial de madera MDF en `sizeMode === 'custom'`, soporte decimal `step="0.01"`) y sincronizan todos los pedidos web (Carrito, Cotizador Personalizado y Compra Rápida en Ficha) mediante HTTPS Server-to-Server autenticado con `x-webhook-secret` (`WEB_ORDERS_WEBHOOK_SECRET || CATALOG_WEBHOOK_SECRET`), nunca por base de datos compartida.
- **Tracker conversacional de taller (`consultar_estado_taller`)**: Mantener sin conexión directa a BD externa; el ciclo operativo interno desde anticipo hasta entrega vive en `Modulo_Ventas`.

## 3. Referencia de Producción y Verificación Post-Despliegue (`reference` / `feedback`)

- **Dominio oficial en producción**: `https://decovintage.online` (desplegado vía Docker + Dokploy sobre VPS Hostinger).
- **Protocolo post-despliegue**: Tras desplegar cambios visibles a producción, verificar `https://decovintage.online` mediante Chrome DevTools MCP con recarga limpia de caché, probando búsqueda, filtros y carrito, y adjuntando evidencia visual antes de dar por cerrado un despliegue en vivo.
- **Regla de reparación en origen**: Ante discrepancias de datos en catálogo, precios, filtros o carrito, reparar siempre en el servicio o helper canónico productor en lugar de parchar síntomas con valores por defecto silenciosos en componentes consumidores.
