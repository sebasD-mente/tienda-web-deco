import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripProhibitedTerms,
  stripCliches,
  sanitizeVisionAnalysis,
  posterVisionRawSchema,
  VISION_CANDIDATE_MODELS
} from '../services/posterVisionService.js';

describe('🔬 Suite de Pruebas: Motor de Visión IA de Pósters (posterVisionService)', () => {
  const sampleCategories = [
    { id: 'SUPERHEROES', name: 'SUPERHÉROES' },
    { id: 'ANIME', name: 'ANIME & MANGA' },
    { id: 'FUTBOL', name: 'FÚTBOL' },
    { id: 'MUSICA', name: 'MÚSICA & BANDAS' },
    { id: 'AUTOS', name: 'AUTOS & VELOCIDAD' }
  ];

  const sampleFranchises = [
    { id: 'marvel', slug: 'marvel', name: 'Marvel Universe' },
    { id: 'portadas-de-discos', slug: 'portadas-de-discos', name: 'Portadas de Discos' },
    { id: 'formula-1', slug: 'formula-1', name: 'Fórmula 1' }
  ];

  it('1. Modelos candidatos deben ser exclusivamente de la serie Gemini 3/4 aprobada', () => {
    assert.ok(VISION_CANDIDATE_MODELS.length >= 2, 'Debe haber al menos 2 modelos para failover');
    const validNames = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
    for (const cand of VISION_CANDIDATE_MODELS) {
      assert.ok(validNames.includes(cand.name), `El modelo ${cand.name} debe pertenecer a la serie Gemini 3`);
    }
  });

  it('2. stripProhibitedTerms debe erradicar menciones a MDF, 5.5mm, HP Látex, Cinta Tesa, Vinil y Precios', () => {
    const dirtyText = 'Cuadro impreso en madera MDF 5.5mm con tintas HP Látex y cinta Tesa incluida por Q25 Quetzales.';
    const clean = stripProhibitedTerms(dirtyText);

    assert.ok(!clean.toLowerCase().includes('mdf'), 'No debe contener MDF');
    assert.ok(!clean.toLowerCase().includes('5.5mm'), 'No debe contener 5.5mm');
    assert.ok(!clean.toLowerCase().includes('látex') && !clean.toLowerCase().includes('latex'), 'No debe contener látex');
    assert.ok(!clean.toLowerCase().includes('tesa'), 'No debe contener tesa');
    assert.ok(!clean.toLowerCase().includes('quetzales'), 'No debe contener quetzales');
    assert.ok(!clean.includes('Q25'), 'No debe contener Q25');
  });

  it('3. stripCliches debe eliminar arranques acartonados ("Espectacular póster...", "Hermosa composición...")', () => {
    const cliche1 = 'Espectacular póster de Ayrton Senna celebrando en Mónaco con su clásico casco amarillo.';
    assert.equal(stripCliches(cliche1), 'Ayrton Senna celebrando en Mónaco con su clásico casco amarillo.');

    const cliche2 = 'Hermosa composición que retrata a Darth Vader con su sable carmesí en el pasillo de la nave.';
    assert.equal(stripCliches(cliche2), 'Retrata a Darth Vader con su sable carmesí en el pasillo de la nave.');

    const cliche3 = 'Increíble cuadro del Batimóvil rodando por Ciudad Gótica bajo la lluvia.';
    assert.equal(stripCliches(cliche3), 'Del Batimóvil rodando por Ciudad Gótica bajo la lluvia.');
  });

  it('4. sanitizeVisionAnalysis debe homologar categoría y franquicia contra listas reales de BD', () => {
    const raw = {
      title: 'Spider-Man',
      subtitle: 'Balanceo en Nueva York',
      description: 'Espectacular cuadro de Spider-Man surcando los rascacielos al atardecer sobre MDF 5.5mm con cinta Tesa. Ideal para habitaciones juveniles.',
      category: 'SUPERHEROES',
      franchiseId: 'marvel',
      tags: ['spiderman', 'marvel', 'comic'], // Inyección que debe ser eliminada
      sizes: ['MINI', 'PEQUENO']             // Inyección que debe ser eliminada
    };

    const sanitized = sanitizeVisionAnalysis(raw, sampleCategories, sampleFranchises);

    assert.equal(sanitized.title, 'Spider-Man');
    assert.equal(sanitized.subtitle, 'Balanceo en Nueva York');
    assert.equal(sanitized.category, 'SUPERHEROES');
    assert.equal(sanitized.franchiseId, 'marvel');
    assert.ok(!sanitized.description.includes('Espectacular cuadro de'));
    assert.ok(!sanitized.description.includes('MDF'));
    assert.ok(!sanitized.description.includes('Tesa'));

    // CANDADOS INQUEBRANTABLES: Cero tags y Cero sizes
    assert.equal(sanitized.tags, undefined, 'tags NUNCA debe emitirse');
    assert.equal(sanitized.sizes, undefined, 'sizes NUNCA debe emitirse');
    assert.equal(sanitized.selectedSizeIds, undefined, 'selectedSizeIds NUNCA debe emitirse');
  });

  it('5. sanitizeVisionAnalysis debe retornar franquicia vacía ("") si no pertenece a la lista de BD', () => {
    const raw = {
      title: 'Pintura Abstracta Minimalista',
      subtitle: 'Líneas Neutras Contemporáneas',
      description: 'Retrato de líneas arquitectónicas en tonos beige y carbón. Aporta serenidad a salas de estar modernas.',
      category: 'ARTE',
      franchiseId: 'franquicia-inventada-desconocida'
    };

    const sanitized = sanitizeVisionAnalysis(raw, sampleCategories, sampleFranchises);
    assert.equal(sanitized.franchiseId, '', 'Franquicia no listada en PostgreSQL debe retornar cadena vacía');
  });

  it('6. posterVisionRawSchema debe rechazar descripciones insuficientes o campos vacíos', () => {
    assert.throws(() => {
      posterVisionRawSchema.parse({
        title: '',
        subtitle: 'Sub',
        description: 'Corta',
        category: 'FUTBOL'
      });
    });
  });
});
