import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseClientImageDataUrl } from '../services/jarvisService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Fase 6 — Búsqueda Visual Multimodal por Imagen en J.A.R.V.I.S. (Mejora #7)', () => {
  it('parseClientImageDataUrl debe validar correctamente imágenes base64 permitidas y rechazar formatos inválidos', () => {
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseClientImageDataUrl(validPng);
    assert.ok(parsed, 'Debe aceptar un dataUrl PNG válido');
    assert.equal(parsed.mimeType, 'image/png');
    assert.ok(parsed.data.length > 10);

    assert.equal(parseClientImageDataUrl(null), null);
    assert.equal(parseClientImageDataUrl('https://evil.com/ssrf.jpg'), null);
    assert.equal(parseClientImageDataUrl('data:text/html;base64,PHNjcmlwdD4='), null);
  });

  it('server.js y routes/jarvisRoutes.js deben soportar imageDataUrl en /api/jarvis/chat', () => {
    const serverContent = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    const routesContent = fs.readFileSync(path.join(ROOT, 'routes/jarvisRoutes.js'), 'utf8');

    assert.ok(
      serverContent.includes("'/api/jarvis/chat'"),
      'server.js debe configurar un límite de body específico para /api/jarvis/chat'
    );
    assert.ok(
      routesContent.includes('imageDataUrl'),
      'routes/jarvisRoutes.js debe extraer y propagar imageDataUrl a chatWithJarvis'
    );
  });

  it('JarvisAgent.jsx, jarvisBrain.js y apiClient.js deben estar conectados de extremo a extremo para adjuntar imágenes', () => {
    const uiContent = fs.readFileSync(path.join(ROOT, 'src/components/JarvisAgent.jsx'), 'utf8');
    const brainContent = fs.readFileSync(path.join(ROOT, 'src/utils/jarvisBrain.js'), 'utf8');
    const apiContent = fs.readFileSync(path.join(ROOT, 'src/utils/apiClient.js'), 'utf8');

    assert.ok(uiContent.includes('attachedImage') && uiContent.includes('imageInputRef'), 'JarvisAgent.jsx debe gestionar estado y selector de imagen adjunta');
    assert.ok(brainContent.includes('imageDataUrl'), 'jarvisBrain.js debe propagar imageDataUrl');
    assert.ok(apiContent.includes('imageDataUrl'), 'apiClient.js debe enviar imageDataUrl al backend');
  });
});
