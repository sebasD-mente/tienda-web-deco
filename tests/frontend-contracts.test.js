import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

describe('💻 Suite de Integridad de Contratos React y Flujo de Checkout (Harness² Web Lens)', () => {
  it('1. AdminSettingsTab.jsx no debe contener llamadas al setter huérfano inexistente setServerStatus', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'admin', 'AdminSettingsTab.jsx'),
      'utf-8'
    );
    assert.equal(
      content.includes('setServerStatus'),
      false,
      'AdminSettingsTab.jsx no debe invocar setServerStatus sin declaración de useState'
    );
  });

  it('2. resetCatalogToDefault en catalogStorage.js no debe sobrescribir _cachedPosters con BASE_POSTERS vacío', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'utils', 'catalogStorage.js'),
      'utf-8'
    );
    const resetFnMatch = content.match(/export async function resetCatalogToDefault\(\)\s*\{[\s\S]*?\}/);
    assert.ok(resetFnMatch, 'Debe existir resetCatalogToDefault en catalogStorage.js');
    assert.equal(
      resetFnMatch[0].includes('_cachedPosters    = [...BASE_POSTERS]') ||
      resetFnMatch[0].includes('_cachedPosters = [...BASE_POSTERS]'),
      false,
      'resetCatalogToDefault NUNCA debe vaciar _cachedPosters asignándole BASE_POSTERS'
    );
  });

  it('3. CartDrawer.jsx debe capturar orderNumber (CP-XXXX) de /api/custom-orders, incluirlo en el mensaje de WhatsApp y limpiar el carrito', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'CartDrawer.jsx'),
      'utf-8'
    );
    assert.ok(
      content.includes('registeredOrderNumber') && content.includes('data.orderNumber'),
      'CartDrawer.jsx debe capturar data.orderNumber al registrar el pedido en /api/custom-orders'
    );
    assert.ok(
      content.includes('onClearCart()'),
      'CartDrawer.jsx debe invocar onClearCart() tras completar el checkout por WhatsApp'
    );
  });
});
