import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageInlineData } from '../services/posterVisionService.js';
import { calculateAuthoritativeOrderTotals } from '../services/customOrderService.js';

describe('🛡️ Suite Backend Zero-Trust: SSRF, Path Traversal y Cálculo Autoritativo de Precios', () => {
  describe('1. Blindaje de resolveImageInlineData (Anti-SSRF y Anti-Path Traversal)', () => {
    it('Bloquea SSRF hacia localhost, IPs privadas, HTTP inseguro y dominios externos no autorizados', async () => {
      const ssrfVectors = [
        'http://127.0.0.1:3000/api/health',
        'https://localhost:3000/api/jarvis',
        'http://169.254.169.254/latest/meta-data/',
        'https://evil-attacker.com/malicious.webp',
        'http://storage.googleapis.com/bucket/image.webp', // HTTP plano no permitido
      ];

      for (const badUrl of ssrfVectors) {
        await assert.rejects(
          async () => resolveImageInlineData({ imageUrl: badUrl }),
          /SSRF bloqueado/i,
          `La URL "${badUrl}" debió ser bloqueada por el filtro anti-SSRF`
        );
      }
    });

    it('Bloquea Path Traversal y lectura de archivos fuera de public/posters/uploads', async () => {
      const traversalVectors = [
        'package.json',
        '/package.json',
        '.env',
        '../package.json',
        '/posters/uploads/../../package.json',
        '/posters/uploads/%2e%2e/%2e%2e/server.js',
        '/posters/uploads/image.webp\0.json',
      ];

      for (const badPath of traversalVectors) {
        await assert.rejects(
          async () => resolveImageInlineData({ imageUrl: badPath }),
          /(Ruta local no permitida|extensión de imagen no permitida|caracteres inválidos)/i,
          `El vector de ruta local "${badPath}" debió ser bloqueado`
        );
      }
    });
  });

  describe('2. Cálculo Financiero Autoritativo en Servidor (calculateAuthoritativeOrderTotals)', () => {
    it('Recalcula precios de tamaños estándar en MDF, PVC (+Q15) y Vinil (50%) ignorando precios manipulados del cliente', () => {
      const tamperedItems = [
        {
          title: 'Obra Manipulada 1',
          sizeMode: 'standard',
          selectedStandardSize: { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', price: 1 }, // Real: Q65
          baseMaterial: 'mdf',
          quantity: 2,
          unitPrice: 0.01,
          totalPrice: 0.02,
        },
        {
          title: 'Obra Manipulada 2',
          sizeMode: 'standard',
          selectedStandardSize: { name: 'Grande', dimensions: '45 x 60 cm' }, // Real: Q125 + Q15 PVC = Q140
          baseMaterial: 'pvc',
          quantity: 1,
          unitPrice: 5,
          totalPrice: 5,
        },
        {
          title: 'Obra Manipulada 3',
          sizeMode: 'standard',
          selectedStandardSize: { id: 'GIGANTE' }, // Real: Q210 * 0.5 Vinil = Q105
          baseMaterial: 'vinyl_only',
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
        },
      ];

      const result = calculateAuthoritativeOrderTotals(tamperedItems, 0.048);

      assert.equal(result.totalUnits, 4);
      assert.equal(result.items[0].unitPrice, 65);
      assert.equal(result.items[0].totalPrice, 130);
      assert.equal(result.items[1].unitPrice, 140);
      assert.equal(result.items[1].totalPrice, 140);
      assert.equal(result.items[2].unitPrice, 105);
      assert.equal(result.items[2].totalPrice, 105);
      assert.equal(result.totalPrice, 375); // 130 + 140 + 105
    });

    it('Recalcula medidas personalizadas por área (cm² * tarifa) con exactitud al centavo', () => {
      const customItems = [
        {
          sizeMode: 'custom',
          customWidth: 50,
          customHeight: 70, // 3500 cm² * 0.048 = Q168.00
          baseMaterial: 'mdf',
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
        },
      ];

      const result = calculateAuthoritativeOrderTotals(customItems, 0.048);
      assert.equal(result.items[0].customArea, 3500);
      assert.equal(result.items[0].unitPrice, 168);
      assert.equal(result.items[0].totalPrice, 336);
      assert.equal(result.totalPrice, 336);
      assert.equal(result.totalUnits, 2);
    });
  });
});
