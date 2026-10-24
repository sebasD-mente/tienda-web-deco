import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteFromPath, getPathFromRoute } from '../src/utils/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Fase 5 — Deep-Linking /poster/:id, OpenGraph Dinámico y Optimización de Catálogo', () => {
  it('src/utils/routes.js debe parsear y generar rutas /poster/:id y #poster/:id correctamente', () => {
    const fromPath = getRouteFromPath('/poster/iron-man-mk85');
    assert.equal(fromPath.page, 'home');
    assert.equal(fromPath.posterId, 'iron-man-mk85');

    const fromHash = getRouteFromPath('/', '#poster/batman-dark-knight');
    assert.equal(fromHash.page, 'home');
    assert.equal(fromHash.posterId, 'batman-dark-knight');

    const builtPath = getPathFromRoute('poster', null, null, 'spider-man-2099');
    assert.equal(builtPath, '/poster/spider-man-2099');
  });

  it('services/openGraphService.js debe inyectar metadatos OpenGraph seguros de la obra en index.html', async () => {
    const { buildPosterOpenGraphHtml } = await import('../services/openGraphService.js');
    const baseHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

    const samplePoster = {
      id: '11111111-2222-3333-4444-555555555555',
      legacyId: 'goku-ultra-instinto',
      title: 'Goku Ultra Instinto "Edición Especial"',
      subtitle: 'Dragon Ball Super',
      description: 'Arte impreso en HD sobre MDF 5.5mm.',
      minPrice: 65,
      image: '/posters/uploads/full/goku-ui.webp',
      isPublished: true
    };

    const html = buildPosterOpenGraphHtml(baseHtml, samplePoster, 'https://www.decovintage.online');

    assert.ok(html.includes('Goku Ultra Instinto &quot;Edición Especial&quot;'), 'Debe escapar comillas en el título OG');
    assert.ok(html.includes('https://www.decovintage.online/poster/goku-ultra-instinto'), 'Debe inyectar la URL canónica de la obra');
    assert.ok(html.includes('https://www.decovintage.online/posters/uploads/full/goku-ui.webp'), 'Debe inyectar la URL absoluta de la imagen de la obra');
    assert.ok(html.includes('Q65.00'), 'Debe incluir el precio base en los metadatos');
  });

  it('routes/catalogRoutes.js debe usar getCachedFullCatalog para visitantes públicos y exponer /settings/save', () => {
    const content = fs.readFileSync(path.join(ROOT, 'routes/catalogRoutes.js'), 'utf8');
    assert.ok(
      content.includes('getCachedFullCatalog'),
      'catalogRoutes.js debe importar y usar getCachedFullCatalog() para el catálogo público'
    );
    assert.ok(
      content.includes("'/settings/save'") || content.includes('"/settings/save"'),
      'catalogRoutes.js debe exponer el endpoint atómico POST /api/settings/save'
    );
  });

  it('ProductModal.jsx debe incluir botón para compartir/copiar enlace directo de la obra', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/components/ProductModal.jsx'), 'utf8');
    assert.ok(
      content.includes('/poster/') && content.includes('clipboard'),
      'ProductModal.jsx debe construir el enlace /poster/:id y permitir copiarlo al portapapeles'
    );
  });
});
