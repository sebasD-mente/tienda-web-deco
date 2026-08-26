import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\sebas\\.gemini\\antigravity-ide\\brain\\6f46b057-b595-465a-a2fa-e91713853e38\\.system_generated\\steps\\1165\\output.txt';
const raw = fs.readFileSync(logPath, 'utf-8');

// Extract JSON content between ```json and ``` or directly
const jsonMatch = raw.match(/```json\r?\n([\s\S]*?)\r?\n```/);
if (!jsonMatch) {
  console.error('Could not extract json from step 1165 output');
  process.exit(1);
}

const state = JSON.parse(jsonMatch[1]);
console.log('Extracted State:');
console.log('- Posters count:', state.posters?.length);
console.log('- Categories count:', state.categories?.length);
console.log('- Franchises count:', state.franchises?.length);
console.log('- Knowledge directives:', state.knowledge?.ownerDirectives?.length);
console.log('- Knowledge custom docs:', state.knowledge?.customDocuments?.length);

// 1. Update postersData.js
const postersCode = `// Master Catalog Data - Deco Vintage Guate
// Auto-synced from live administrative state (37 items)

export const POSTERS_DATA = ${JSON.stringify(state.posters, null, 2)};
`;
fs.writeFileSync(path.resolve('src/data/postersData.js'), postersCode, 'utf-8');
console.log('✅ Updated src/data/postersData.js');

// 2. Update categoriesData.js
const categoriesCode = `// Catalog Categories
export const CATEGORIES_DATA = ${JSON.stringify(state.categories, null, 2)};
`;
fs.writeFileSync(path.resolve('src/data/categoriesData.js'), categoriesCode, 'utf-8');
console.log('✅ Updated src/data/categoriesData.js');

// 3. Update franchisesData.js
const franchisesCode = `// Catalog Franchises
export const FRANCHISES_DATA = ${JSON.stringify(state.franchises, null, 2)};
`;
fs.writeFileSync(path.resolve('src/data/franchisesData.js'), franchisesCode, 'utf-8');
console.log('✅ Updated src/data/franchisesData.js');

// 4. Update jarvisConfig.json
fs.writeFileSync(path.resolve('src/data/jarvisConfig.json'), JSON.stringify(state.knowledge, null, 2), 'utf-8');
console.log('✅ Updated src/data/jarvisConfig.json');

// 5. Update storeKnowledge.js
const storeKnowledgeCode = `// Store Knowledge Base & Training Memory for J.A.R.V.I.S. AI Agent

export const DEFAULT_STORE_KNOWLEDGE = ${JSON.stringify(state.knowledge, null, 2)};

const KNOWLEDGE_STORAGE_KEY = 'deco_jarvis_knowledge_v2';

export function getStoreKnowledge() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_STORE_KNOWLEDGE,
            ...parsed,
            customDocuments: parsed.customDocuments || DEFAULT_STORE_KNOWLEDGE.customDocuments || [],
            referenceImages: parsed.referenceImages || DEFAULT_STORE_KNOWLEDGE.referenceImages || [],
            ownerDirectives: parsed.ownerDirectives || DEFAULT_STORE_KNOWLEDGE.ownerDirectives || [],
            quickPrompts: parsed.quickPrompts || DEFAULT_STORE_KNOWLEDGE.quickPrompts || DEFAULT_STORE_KNOWLEDGE.quickActions || []
          };
        }
      }
    }
  } catch (e) {
    console.warn('[storeKnowledge] Fallback to default knowledge memory:', e);
  }
  return DEFAULT_STORE_KNOWLEDGE;
}

export function saveStoreKnowledge(knowledge) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(knowledge));
      window.dispatchEvent(new CustomEvent('deco-jarvis-knowledge-updated', { detail: knowledge }));
      return true;
    }
  } catch (e) {
    console.error('[storeKnowledge] Failed to save knowledge to localStorage:', e);
    return false;
  }
  return false;
}

export function addCustomDocument(doc) {
  const current = getStoreKnowledge();
  const docs = current.customDocuments || [];
  const newDoc = {
    id: \`doc-\${Date.now()}\`,
    title: doc.title || 'Documento sin título',
    category: doc.category || 'General',
    content: doc.content || '',
    dateAdded: new Date().toLocaleDateString('es-GT')
  };
  docs.push(newDoc);
  current.customDocuments = docs;
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}

export function deleteCustomDocument(id) {
  const current = getStoreKnowledge();
  current.customDocuments = (current.customDocuments || []).filter(d => d.id !== id);
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}

export function addReferenceImage(img) {
  const current = getStoreKnowledge();
  const images = current.referenceImages || [];
  const newImg = {
    id: \`ref-\${Date.now()}\`,
    title: img.title || 'Imagen de Referencia',
    url: img.url || '',
    description: img.description || ''
  };
  images.push(newImg);
  current.referenceImages = images;
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}

export function deleteReferenceImage(id) {
  const current = getStoreKnowledge();
  current.referenceImages = (current.referenceImages || []).filter(i => i.id !== id);
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}

export function updateOwnerDirectives(directives) {
  const current = getStoreKnowledge();
  current.ownerDirectives = directives;
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}

export function saveQuickPrompts(prompts) {
  const current = getStoreKnowledge();
  current.quickPrompts = prompts;
  current.updatedAt = new Date().toISOString();
  return saveStoreKnowledge(current);
}
`;
fs.writeFileSync(path.resolve('src/data/storeKnowledge.js'), storeKnowledgeCode, 'utf-8');
console.log('✅ Updated src/data/storeKnowledge.js');

console.log('\n🎉 ALL PRODUCTION SOURCE FILES SUCCESSFULLY SYNCED!');
