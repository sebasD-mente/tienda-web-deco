import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { purgeExpiredEventsFromMemory, runFallbackEngine } from '../services/jarvisService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

describe('🤖 Suite J.A.R.V.I.S.: Preservación de Directivas, Expiración por Fecha Real y Consistencia', () => {
  it('1. purgeExpiredEventsFromMemory NUNCA debe borrar ownerDirectives aunque mencionen Comic-Con, Fan Fest o Cayalá', async () => {
    const sampleMemory = {
      ownerDirectives: [
        'En cada Comic-Con y Fan Fest ofrecer paquetes especiales de 3 pósters medianos.',
        'Atender siempre con amabilidad y recordar nuestros envíos a Cayalá y toda Guatemala.',
      ],
      customDocuments: [
        {
          id: 'doc-futuro-2027',
          title: 'Comic-Con Guatemala Edición Especial',
          category: 'Eventos',
          content: 'Participación oficial de Deco Vintage en el próximo gran evento geek.',
          eventDate: '2099-12-31',
        },
        {
          id: 'doc-permanente-cayala',
          title: 'Entregas en Zona 16 y Cayalá',
          category: 'Logística',
          content: 'Rutas de mensajería hacia Cayalá y alrededores.',
          eventDate: null,
        },
      ],
    };

    const result = await purgeExpiredEventsFromMemory(sampleMemory, { persist: false });

    assert.equal(
      result.ownerDirectives.length,
      2,
      'Las directivas del propietario jamás deben ser eliminadas por filtro de palabras clave'
    );
    assert.equal(
      result.customDocuments.length,
      2,
      'Los documentos vigentes o futuros no deben ser purgados por contener palabras como Comic-Con o Cayalá'
    );
  });

  it('2. purgeExpiredEventsFromMemory debe purgar únicamente documentos con eventDate explícito en el pasado o IDs vencidos', async () => {
    const sampleMemory = {
      ownerDirectives: ['Directiva permanente intacta'],
      customDocuments: [
        {
          id: 'doc-pasado-2020',
          title: 'Feria Pasada',
          category: 'Eventos',
          content: 'Evento ya concluido.',
          eventDate: '2020-01-15',
        },
        {
          id: 'doc-vigente-2099',
          title: 'Feria Futura',
          category: 'Eventos',
          content: 'Evento futuro activo.',
          eventDate: '2099-10-20',
        },
      ],
    };

    const result = await purgeExpiredEventsFromMemory(sampleMemory, { persist: false });
    assert.equal(result.customDocuments.length, 1);
    assert.equal(result.customDocuments[0].id, 'doc-vigente-2099');
  });

  it('3. runFallbackEngine y data/jarvisConfig.json deben usar el teléfono oficial 50238375078', () => {
    const fallbackRes = runFallbackEngine('Quiero hablar con un asesor humano', [], {}, { settings: {} });
    assert.equal(fallbackRes.actions.length, 1);
    assert.equal(fallbackRes.actions[0].phone, '50238375078');
    assert.ok(fallbackRes.actions[0].waUrl.includes('50238375078'));

    const jarvisSeed = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'jarvisConfig.json'), 'utf-8'));
    assert.equal(jarvisSeed.company.phone, '+502 3837-5078');
  });

  it('4. storeKnowledge.js debe exponer importJarvisMemoryFromJSON asíncrono con contrato { success } y syncKnowledgeFromServer', () => {
    const storeKnowledgeSrc = fs.readFileSync(path.join(projectRoot, 'src', 'data', 'storeKnowledge.js'), 'utf-8');
    assert.ok(
      storeKnowledgeSrc.includes('export async function importJarvisMemoryFromJSON'),
      'importJarvisMemoryFromJSON debe ser async'
    );
    assert.ok(
      storeKnowledgeSrc.includes('export function syncKnowledgeFromServer'),
      'Debe exportar syncKnowledgeFromServer con deduplicación en vuelo'
    );
  });
});
