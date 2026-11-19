# Tema de Memoria: Directrices Soberanas de Negocio y Producción — Deco Vintage Guate

- **Tipo Taxonómico**: `project` / `feedback` / `reference`
- **Última Actualización**: 2026-11-18
- **Propósito**: Preservar las reglas de negocio dictadas por Sebastián Jiménez y las fronteras con sistemas hermanos que NO son deducibles únicamente inspeccionando el código fuente (Gotcha #4).

---

## 1. Curación Manual Exclusiva de `posters.tags` (`project` / `feedback`)

- **Prohibición absoluta de autogeneración de tags**: Está terminantemente prohibido autogenerar con IA, enriquecer masivamente o inyectar listas de palabras clave genéricas en el campo `tags` de los pósters.
- **Razón de negocio**: En Deco Vintage Guate, `tags` se reserva exclusivamente para el apodo o clave interna con que el taller y el equipo identifican cada obra en la empresa, curado manualmente poco a poco para evitar falsos positivos y contaminación en el buscador.

## 2. Frontera Inter-Proyecto con `Modulo_Ventas` (`project`)

- **Pausa en seguimiento de taller dentro de `Web Deco Vintage Proyect`**: Mantener en pausa modificaciones al flujo de seguimiento de estado de taller en este repositorio hasta que finalice la fase de pruebas del proyecto hermano `Modulo_Ventas`.
- **Razón arquitectónica**: Toda venta real y trazabilidad operativa (desde el primer abono hasta fabricación en MDF 5.5mm y entrega) es propiedad de la base de datos de `Modulo_Ventas`, con el cual este sitio se integrará futuramente mediante un contrato API aislado.

## 3. Referencia de Producción y Verificación Post-Despliegue (`reference` / `feedback`)

- **Dominio oficial en producción**: `https://decovintage.online` (desplegado vía Docker + Dokploy sobre VPS Hostinger).
- **Protocolo post-despliegue**: Tras desplegar cambios visibles a producción, verificar `https://decovintage.online` mediante Chrome DevTools MCP con recarga limpia de caché, probando búsqueda, filtros y carrito, y adjuntando evidencia visual antes de dar por cerrado un despliegue en vivo.
- **Regla de reparación en origen**: Ante discrepancias de datos en catálogo, filtros o carrito, reparar siempre 2 capas atrás (en el servicio o estado productor) en lugar de enmascarar el síntoma con valores por defecto silenciosos en componentes consumidores.
