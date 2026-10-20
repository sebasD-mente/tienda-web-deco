/**
 * scripts/enrich-poster-tags.js
 *
 * [DEPRECADO / NEUTRALIZADO POR DIRECTIVA DE ARQUITECTURA COM-20261020-001]
 *
 * La política de inyección automática de etiquetas genéricas/redundantes fue
 * reemplazada por el estándar de Palabra Clave Única de Taller (Identificador Rápido).
 * Todas las obras mantienen `tags: []` por defecto salvo que el equipo de taller
 * asigne explícitamente un apodo operativo interno.
 *
 * Para limpieza de tags y re-vectorización láser preservando timestamps, utilice:
 *   node scripts/purge-tags-and-reindex.js --dry-run
 *   node scripts/purge-tags-and-reindex.js --apply
 */

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🛑 [AVISO DE SEGURIDAD — COM-20261020-001] SCRIPT NEUTRALIZADO');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('La política de enriquecimiento masivo de tags fue reemplazada por:');
console.log('👉 "Palabra Clave Única de Taller / Identificador Rápido" (COM-20261020-001).');
console.log('No se realizó ninguna escritura en la base de datos.');
console.log('Para higienizar tags y recalcular vectores RAG preservando timestamps, ejecute:');
console.log('   node scripts/purge-tags-and-reindex.js --dry-run');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

process.exit(0);