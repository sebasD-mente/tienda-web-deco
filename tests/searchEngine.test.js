import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchPosters, normalizeText } from '../src/utils/searchEngine.js';

describe('Search Engine Precision Suite — COM-20261020-002', () => {

  const sampleCatalog = [
    {
      id: 'porsche-911-gt3-rs',
      title: 'Porsche 911 GT3 RS',
      subtitle: 'Weissach Package',
      category: 'Vehículos',
      franchise: 'Porsche',
      tags: ['supercar', 'circuito'],
      description: 'El deportivo definitivo para pista con alerón de fibra de carbono.'
    },
    {
      id: 'star-wars-ep4',
      title: 'Star Wars: A New Hope',
      subtitle: 'Episodio IV',
      category: 'Películas',
      franchise: 'Star Wars',
      tags: ['jedi', 'ciencia ficcion'],
      description: 'Una aventura en una galaxia muy lejana contra el imperio galáctico.'
    },
    {
      id: 'cars-mcqueen',
      title: 'Cars',
      subtitle: 'Rayo McQueen #95',
      category: 'Animación',
      franchise: 'Pixar Cars',
      tags: ['carreras', 'piston cup'],
      description: 'Copa Pistón en Radiador Springs.'
    },
    {
      id: 'sabrina-carpenter',
      title: 'Sabrina Carpenter',
      subtitle: 'Short n Sweet',
      category: 'Música',
      franchise: 'Pop Stars',
      tags: ['cantante', 'vinilo'],
      description: 'Portada de álbum pop contemporáneo.'
    },
    {
      id: 'lionel-messi',
      title: 'Lionel Messi',
      subtitle: 'Campeón del Mundo',
      category: 'Deportes',
      franchise: 'Fútbol',
      tags: ['d10s', 'argentina', 'goat'],
      description: 'Momento histórico levantando la copa del mundo en Qatar.'
    },
    {
      id: 'taller-brincolin',
      title: 'Nube Mágica Infantil',
      subtitle: 'Diseño para Cuartos de Niños',
      category: 'Infantil',
      franchise: 'Original Deko',
      tags: ['brincolin', 'taller-especial'],
      description: 'Cuadro colorido para habitaciones infantiles.'
    },
    {
      id: 'spiderman-across',
      title: 'Spider-Man: Across the Spider-Verse',
      subtitle: 'Miles Morales & Gwen Stacy',
      category: 'Películas',
      franchise: 'Marvel',
      tags: ['superheroes', 'multiverse'],
      description: 'Viaje a través del multiverso arácnido.'
    }
  ];

  it('1. Búsqueda "Porsche" devuelve únicamente la obra de Porsche y CERO de Star Wars / Cars', () => {
    const results = searchPosters('Porsche', sampleCatalog);
    assert.ok(results.length >= 1, 'Debe devolver al menos 1 resultado');
    assert.strictEqual(results[0].id, 'porsche-911-gt3-rs');

    // Comprobación forense estricta: cero Star Wars, cero Cars
    const ids = results.map(r => r.id);
    assert.ok(!ids.includes('star-wars-ep4'), 'NO debe incluir Star Wars');
    assert.ok(!ids.includes('cars-mcqueen'), 'NO debe incluir Cars');
    assert.ok(!ids.includes('sabrina-carpenter'), 'NO debe incluir Sabrina Carpenter');
    assert.strictEqual(results.length, 1, 'Debe contener exclusivamente el póster de Porsche');
  });

  it('2. Búsqueda de token corto "rs" NO coincide con "staR waRS" ni con "caRS"', () => {
    const results = searchPosters('rs', sampleCatalog);
    assert.strictEqual(results.length, 1, 'Solo debe coincidir con la palabra exacta "RS"');
    assert.strictEqual(results[0].id, 'porsche-911-gt3-rs');

    const ids = results.map(r => r.id);
    assert.ok(!ids.includes('star-wars-ep4'), 'El token "rs" NO debe hacer falso match con Star Wars');
    assert.ok(!ids.includes('cars-mcqueen'), 'El token "rs" NO debe hacer falso match con Cars');
  });

  it('3. Búsqueda por subtitle ("Short n Sweet") encuentra la obra correspondiente', () => {
    const results = searchPosters('Short n Sweet', sampleCatalog);
    assert.ok(results.length >= 1, 'Debe encontrar la obra por subtítulo');
    assert.strictEqual(results[0].id, 'sabrina-carpenter');
  });

  it('4. Búsqueda por subtitle con acentos ("Campeón del Mundo" y "Campeon") encuentra la obra', () => {
    const resultsWithAccent = searchPosters('Campeón del Mundo', sampleCatalog);
    assert.ok(resultsWithAccent.length >= 1);
    assert.strictEqual(resultsWithAccent[0].id, 'lionel-messi');

    const resultsWithoutAccent = searchPosters('Campeon', sampleCatalog);
    assert.ok(resultsWithoutAccent.length >= 1);
    assert.strictEqual(resultsWithoutAccent[0].id, 'lionel-messi');
  });

  it('5. Búsqueda por Palabra Clave de Taller en tags ("brincolin") encuentra la obra con máxima prioridad', () => {
    const results = searchPosters('brincolin', sampleCatalog);
    assert.ok(results.length >= 1, 'Debe encontrar la obra con el tag brincolin');
    assert.strictEqual(results[0].id, 'taller-brincolin');
  });

  it('6. Errores ortográficos reales: "Porshe" encuentra Porsche', () => {
    const results = searchPosters('Porshe', sampleCatalog);
    assert.ok(results.length >= 1, 'Debe tolerar el error ortográfico "Porshe"');
    assert.strictEqual(results[0].id, 'porsche-911-gt3-rs');
  });

  it('7. Errores ortográficos reales: "Spideman" encuentra Spider-Man', () => {
    const results = searchPosters('Spideman', sampleCatalog);
    assert.ok(results.length >= 1, 'Debe tolerar el error ortográfico "Spideman"');
    assert.strictEqual(results[0].id, 'spiderman-across');
  });

  it('8. Filtro multi-token estricto: "Porsche 911" exige coincidencia de ambos tokens', () => {
    const results = searchPosters('Porsche 911', sampleCatalog);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'porsche-911-gt3-rs');

    // Búsqueda multi-token donde falta uno de los términos requeridos
    const noResults = searchPosters('Porsche Inexistente', sampleCatalog);
    assert.strictEqual(noResults.length, 0, 'No debe devolver obras si falta un token obligatorio');
  });

  it('9. La descripción no se evalúa (evita ruido narrativo)', () => {
    // La palabra "definitivo" solo está en la descripción de Porsche
    const results = searchPosters('definitivo', sampleCatalog);
    assert.strictEqual(results.length, 0, 'No debe buscar en description para evitar ruido');
  });

  it('10. Consultas vacías, nulas o con solo stop words devuelven arreglo vacío', () => {
    assert.deepStrictEqual(searchPosters('', sampleCatalog), []);
    assert.deepStrictEqual(searchPosters('   ', sampleCatalog), []);
    assert.deepStrictEqual(searchPosters(null, sampleCatalog), []);
    assert.deepStrictEqual(searchPosters('de los en', sampleCatalog), []);
  });

  it('11. Normalización de texto elimina acentos y puntuaciones', () => {
    assert.strictEqual(normalizeText('Spider-Man: Across the Spider-Verse!'), 'spider man across the spider verse');
    assert.strictEqual(normalizeText('¡Campeón del Mundo, 100% Álbum!'), 'campeon del mundo 100 album');
  });
});
