import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CM2_RATE,
  WOOD_CUSTOM_CUT_SURCHARGE,
  PVC_SURCHARGE,
  VINYL_DISCOUNT_FACTOR,
  parseDecimalCm,
  calculateCanonicalPosterItemPrice,
} from '../utils/customPricing.js';
import { calculateAuthoritativeOrderTotals } from '../services/customOrderService.js';
import { calculateCustomPrice, runFallbackEngine } from '../services/jarvisService.js';
import { DEFAULT_STORE_KNOWLEDGE } from '../src/data/storeKnowledge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const GOLDEN_VECTORS = [
  { w: 42.2, h: 30, material: 'mdf', qty: 1, area: 1266, basePrint: 60.77, unitPrice: 85.77, totalPrice: 85.77 },
  { w: 42.2, h: 30, material: 'mdf', qty: 2, area: 1266, basePrint: 60.77, unitPrice: 85.77, totalPrice: 171.54 },
  { w: 42.2, h: 30, material: 'pvc', qty: 1, area: 1266, basePrint: 60.77, unitPrice: 75.77, totalPrice: 75.77 },
  { w: 42.2, h: 30, material: 'vinyl_only', qty: 1, area: 1266, basePrint: 60.77, unitPrice: 30.38, totalPrice: 30.38 },
  { w: 42.2, h: 58.5, material: 'mdf', qty: 1, area: 2468.7, basePrint: 118.50, unitPrice: 143.50, totalPrice: 143.50 },
  { w: 48.5, h: 68.25, material: 'mdf', qty: 3, area: 3310.13, basePrint: 158.89, unitPrice: 183.89, totalPrice: 551.67 },
  { w: 40, h: 50, material: 'mdf', qty: 1, area: 2000, basePrint: 96.00, unitPrice: 121.00, totalPrice: 121.00 },
];

describe('📐 Suite de Paridad Matemática Canónica: Cotizador Web, Backend Autoritativo y J.A.R.V.I.S. (feat-002)', () => {
  it('1. Constantes oficiales y parseDecimalCm soportan punto, coma decimal y valores inválidos', () => {
    assert.equal(DEFAULT_CM2_RATE, 0.048);
    assert.equal(WOOD_CUSTOM_CUT_SURCHARGE, 25.00);
    assert.equal(PVC_SURCHARGE, 15.00);
    assert.equal(VINYL_DISCOUNT_FACTOR, 0.50);

    assert.equal(parseDecimalCm(42.2), 42.2);
    assert.equal(parseDecimalCm('42.2'), 42.2);
    assert.equal(parseDecimalCm(' 48,5 '), 48.5);
    assert.equal(parseDecimalCm('68,25'), 68.25);
    assert.equal(parseDecimalCm(''), 0);
    assert.equal(parseDecimalCm(null), 0);
    assert.equal(parseDecimalCm(undefined), 0);
    assert.equal(parseDecimalCm('abc'), 0);
  });

  it('2. Los 7 Vectores Dorados coinciden exactamente al centavo (Q 0.00 de diferencia) en los 3 motores', () => {
    for (const vec of GOLDEN_VECTORS) {
      // Motor 1: Función pura canónica (utils/customPricing.js)
      const canonical = calculateCanonicalPosterItemPrice({
        sizeMode: 'custom',
        customWidth: vec.w,
        customHeight: vec.h,
        baseMaterial: vec.material,
        quantity: vec.qty,
        cm2Rate: 0.048,
      });

      assert.equal(canonical.customArea, vec.area, `Área canónica incorrecta en ${vec.w}x${vec.h}`);
      assert.equal(canonical.basePrint, vec.basePrint, `Impresión base incorrecta en ${vec.w}x${vec.h}`);
      assert.equal(canonical.unitPrice, vec.unitPrice, `Precio unitario canónico incorrecto en ${vec.w}x${vec.h} (${vec.material})`);
      assert.equal(canonical.totalPrice, vec.totalPrice, `Precio total canónico incorrecto en ${vec.w}x${vec.h} x${vec.qty}`);

      // Motor 2: Cálculo autoritativo de órdenes en servidor (services/customOrderService.js)
      const authoritative = calculateAuthoritativeOrderTotals([
        {
          sizeMode: 'custom',
          customWidth: String(vec.w).replace('.', ','), // También valida entrada con coma desde navegador móvil
          customHeight: vec.h,
          baseMaterial: vec.material,
          quantity: vec.qty,
          unitPrice: 1, // Manipulado por cliente -> debe ser ignorado
          totalPrice: 1,
        },
      ], 0.048);

      assert.equal(authoritative.items[0].customArea, vec.area);
      assert.equal(authoritative.items[0].unitPrice, vec.unitPrice);
      assert.equal(authoritative.items[0].totalPrice, vec.totalPrice);
      assert.equal(authoritative.totalPrice, vec.totalPrice);
      assert.equal(authoritative.totalUnits, vec.qty);

      // Motor 3: Calculadora de J.A.R.V.I.S. (services/jarvisService.js)
      const jarvisQuote = calculateCustomPrice(vec.w, vec.h, vec.material, 0.048, vec.qty);
      assert.equal(jarvisQuote.areaCm2, vec.area);
      assert.equal(jarvisQuote.basePrint, vec.basePrint);
      assert.equal(jarvisQuote.unitPrice, vec.unitPrice);
      assert.equal(jarvisQuote.totalPrice, vec.totalPrice);
    }
  });

  it('3. Tamaños estándar precortados NO llevan el recargo de +Q25.00 de corte especial MDF', () => {
    const stdMdf = calculateCanonicalPosterItemPrice({
      sizeMode: 'standard',
      standardSizePrice: 65,
      baseMaterial: 'mdf',
      quantity: 2,
    });
    assert.equal(stdMdf.unitPrice, 65);
    assert.equal(stdMdf.totalPrice, 130);

    const stdPvc = calculateCanonicalPosterItemPrice({
      sizeMode: 'standard',
      standardSizePrice: 65,
      baseMaterial: 'pvc',
      quantity: 1,
    });
    assert.equal(stdPvc.unitPrice, 80);

    const stdVinyl = calculateCanonicalPosterItemPrice({
      sizeMode: 'standard',
      standardSizePrice: 65,
      baseMaterial: 'vinyl_only',
      quantity: 1,
    });
    assert.equal(stdVinyl.unitPrice, 32.5);
  });

  it('4. runFallbackEngine de J.A.R.V.I.S. cotiza decimales con punto o coma y formatea con .toFixed(2)', () => {
    const resDot = runFallbackEngine('Hola, cuánto cuesta un cuadro de 42.2x30 cm en MDF?', [], {}, { settings: { customCm2Price: 0.048 } });
    assert.equal(resDot.actions.length, 1);
    assert.equal(resDot.actions[0].type, 'custom_quote');
    assert.equal(resDot.actions[0].quote.totalPrice, 85.77);
    assert.ok(resDot.replyText.includes('Q85.77'), 'El texto debe mostrar Q85.77 exacto');
    assert.equal(resDot.replyText.includes('85.77.00'), false, 'No debe concatenar .00 duplicado');

    const resComma = runFallbackEngine('Cotizar medida 48,5 por 68,25', [], {}, { settings: { customCm2Price: 0.048 } });
    assert.equal(resComma.actions.length, 1);
    assert.equal(resComma.actions[0].quote.totalPrice, 183.89);
    assert.ok(resComma.replyText.includes('Q183.89'));

    const resPromo = runFallbackEngine('Tienen promoción 2x1 hoy?', [], {}, { settings: {} });
    assert.equal(resPromo.actions.some(a => a.type === 'custom_quote'), false, '2x1 fuera de rango [5..300] no debe disparar cotización a medida');
  });

  it('5. Integridad de ubicación Docker (utils/customPricing.js), inputs decimales en CustomPostersPage.jsx y paridad de memoria J.A.R.V.I.S.', () => {
    assert.equal(
      fs.existsSync(path.join(projectRoot, 'utils', 'customPricing.js')),
      true,
      'utils/customPricing.js debe existir en utils/ de la raíz para incluirse en el contenedor de producción'
    );

    const customPageSrc = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'CustomPostersPage.jsx'), 'utf-8');
    assert.ok(customPageSrc.includes("from '../../utils/customPricing.js'"), 'CustomPostersPage.jsx debe importar el motor canónico de utils/customPricing.js');
    assert.ok(customPageSrc.includes('step="0.01"'), 'Inputs de medidas deben habilitar decimales step="0.01"');
    assert.ok(customPageSrc.includes('inputMode="decimal"'), 'Inputs de medidas deben declarar inputMode="decimal"');
    assert.ok(customPageSrc.includes('min="5"'), 'Inputs de medidas deben permitir min="5"');

    const jarvisConfigSeed = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'jarvisConfig.json'), 'utf-8'));
    const docSeed = jarvisConfigSeed.customDocuments.find(d => d.id === 'doc-personalizados');
    const docClient = DEFAULT_STORE_KNOWLEDGE.customDocuments.find(d => d.id === 'doc-personalizados');
    assert.ok(docSeed && docClient);
    assert.equal(docSeed.content, docClient.content, 'doc-personalizados debe estar sincronizado entre data/jarvisConfig.json y storeKnowledge.js');
    assert.equal(
      jarvisConfigSeed.commercialPolicies.customPricingFormula,
      DEFAULT_STORE_KNOWLEDGE.commercialPolicies.customPricingFormula,
      'customPricingFormula debe estar sincronizada entre data/jarvisConfig.json y storeKnowledge.js'
    );
    assert.ok(docSeed.content.includes('Q 25.00'), 'La documentación de J.A.R.V.I.S. debe reflejar el corte especial MDF de Q 25.00');
  });
});
