import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

describe('🧹 Suite de Higiene de Repositorio, Huérfanos y Contenedor (Harness²)', () => {
  it('1. No deben existir capturas PNG/JPG sueltas en la raíz ni carpetas scratch/ o test_evidence/', () => {
    const rootEntries = fs.readdirSync(projectRoot);
    const looseImages = rootEntries.filter((name) => /\.(png|jpg|jpeg|mp4|mov)$/i.test(name));
    assert.deepEqual(looseImages, [], `Imágenes sueltas encontradas en la raíz: ${looseImages.join(', ')}`);

    assert.equal(fs.existsSync(path.join(projectRoot, 'scratch')), false, 'La carpeta scratch/ no debe existir');
    assert.equal(fs.existsSync(path.join(projectRoot, 'test_evidence')), false, 'La carpeta test_evidence/ no debe existir');
    assert.equal(fs.existsSync(path.join(projectRoot, 'test')), false, 'La carpeta legacy test/ debe haberse consolidado en tests/');
  });

  it('2. No deben existir artefactos muertos de Firebase, Nginx ni credenciales vacías en la raíz', () => {
    const forbiddenRootFiles = [
      'firebase.json',
      '.firebaserc',
      'nginx.conf',
      'google-service-account.json',
    ];
    for (const file of forbiddenRootFiles) {
      assert.equal(
        fs.existsSync(path.join(projectRoot, file)),
        false,
        `El artefacto obsoleto '${file}' no debe existir en la raíz`
      );
    }
  });

  it('3. No deben existir módulos huérfanos (0 imports) en src/ ni scripts de alteración de tags', () => {
    const forbiddenFiles = [
      'src/data/categoriesData.js',
      'src/data/franchisesData.js',
      'src/data/postersData.js',
      'src/data/jarvisConfig.json',
      'src/utils/idbStorage.js',
      'src/utils/firebase.js',
      'scripts/enrich-poster-tags.js',
      'scripts/purge-tags-and-reindex.js',
    ];
    for (const relPath of forbiddenFiles) {
      assert.equal(
        fs.existsSync(path.join(projectRoot, relPath)),
        false,
        `El archivo huérfano u obsoleto '${relPath}' debe ser eliminado`
      );
    }
  });

  it('4. Dockerfile y entrypoint.sh deben estar libres de data_seed duplicado y tener migración Prisma fail-fast', () => {
    const dockerfile = fs.readFileSync(path.join(projectRoot, 'Dockerfile'), 'utf-8');
    assert.equal(dockerfile.includes('data_seed'), false, 'Dockerfile no debe copiar data_seed duplicado');

    const entrypoint = fs.readFileSync(path.join(projectRoot, 'entrypoint.sh'), 'utf-8');
    assert.equal(entrypoint.includes('catalogStore.json'), false, 'entrypoint.sh no debe sembrar catalogStore.json obsoleto');
    assert.equal(
      entrypoint.includes('npx prisma migrate deploy ||'),
      false,
      'entrypoint.sh no debe silenciar fallos de npx prisma migrate deploy con ||'
    );
    assert.ok(
      entrypoint.includes('mkdir -p /app/public/posters/uploads/custom'),
      'entrypoint.sh debe garantizar el directorio persistente /app/public/posters/uploads/custom'
    );
  });
});
