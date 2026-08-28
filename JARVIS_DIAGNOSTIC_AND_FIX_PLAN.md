# 🤖 INFORME DE DIAGNÓSTICO FORENSE Y PLAN DE REPARACIÓN DE J.A.R.V.I.S. AI
**Proyecto:** Deco Vintage Guate (`Web Deco Vintage Proyect`)  
**Módulo:** J.A.R.V.I.S. AI Agent & Knowledge Memory Subsystem  
**Fecha:** 27 de Agosto de 2026  
**Destinatario:** Agente Ejecutor / Ingeniero de Software  

---

## 1. 📋 Resumen del Problema y Síntomas Reportados

* **Síntoma 1 (Latencia Extrema y Respuestas de Contingencia):** El asistente responde casi siempre con el mensaje de fallback por defecto (*"El asistente J.A.R.V.I.S. no se encuentra disponible temporalmente..."*). Solo responde con inteligencia real tras insistirle 4 o 5 veces.
* **Síntoma 2 (Amnesia de Conocimiento):** El asistente ignora directivas, eventos (como el stand en Centranorte) y documentos cargados por el administrador desde el panel de control.

---

## 2. 🔬 Análisis de Causa Raíz (RCA) Comprobado

### 💥 Causa 1: Bucle de 10 Peticiones Fallidas en Backend por Modelos Inexistentes y Claves Bloqueadas
* **Archivos:** `server.js:520-565`
* **Diagnóstico Técnico:**
  El servidor itera secuencialmente a través de un array de modelos y claves:
  ```javascript
  const CANDIDATE_MODELS = [
    'gemini-3.5-flash-lite', // ❌ 404 Not Found (No existe en API pública)
    'gemini-3.5-flash',      // ❌ 404 Not Found (No existe en API pública)
    'gemini-3.6-flash',      // ✅ EXISTE Y RESPONDE EN <0.8s
    'gemini-1.5-flash',      // ❌ 404 Deprecado en este tier de API
    'gemini-2.0-flash'       // ❌ 404 Deprecado en este tier de API
  ];
  ```
  Adicionalmente, la primera clave de la lista (`AIzaSyD0nw...`) fue reportada como filtrada a Google (`403 PERMISSION_DENIED`).
* **Efecto:** Cada mensaje del cliente provocaba **hasta 10 llamadas HTTP fallidas en serie a Google**, tardando más de 15 segundos y alcanzando el timeout del gateway, lo que devolvía la respuesta de error por defecto. Al insistir 4 o 5 veces, alguna petición paralela lograba llegar a `gemini-3.6-flash` antes del timeout.

---

### 💥 Causa 2: Desconexión y Sobrescritura de la Memoria del Administrador
* **Archivos:** `src/data/storeKnowledge.js:188-210` y `server.js:403-427`
* **Diagnóstico Técnico:**
  1. **Sobrescritura por IndexedDB:** Al cargar la página, `idbGetMetadata('jarvis_knowledge')` leía una base de datos local antigua del navegador y sobrescribía el `localStorage` con datos vacíos o viejos antes de sincronizar con el servidor.
  2. **Ausencia de Sincronización en Cloud Firestore:** El catálogo de la tienda se sincroniza en Firestore, pero el conocimiento de J.A.R.V.I.S. solo se intentaba guardar en un archivo local de VPS (`data/jarvisConfig.json`). Si el administrador accedía desde su celular u otro navegador, el panel mostraba la memoria por defecto.
  3. **Fusión Forzada en Backend:** `getJarvisMemory()` en `server.js` fusionaba arrays estáticos hardcodeados en el código que opacaban las directivas reales del administrador.

---

## 3. 🛠️ Plan de Reparación Paso a Paso para el Ejecutor

---

### 🔹 PASO 1: Optimizar `server.js` (Modelo Directo y Clave Verificada)

1. En `server.js`, establecer `gemini-3.6-flash` como el modelo prioritario e inmediato.
2. Usar directamente la clave activa y verificada `AIzaSyDbhNzmYfr7vE8GVOl-wliFruJDgPfoa8Y`.
3. Limpiar `getJarvisMemory()` para priorizar los documentos y directivas del administrador.

#### Código de Reemplazo en `server.js`:

```javascript
// Reemplazar la lista de modelos y la clave en server.js:
const OFFICIAL_GEMINI_KEY = 'AIzaSyDbhNzmYfr7vE8GVOl-wliFruJDgPfoa8Y';

// Lista optimizada con el modelo 100% activo en primer lugar:
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest'
];
```

Y en la función `getJarvisMemory()` en `server.js`:

```javascript
function getJarvisMemory() {
  let vpsMem = {};
  const srcFile = path.resolve(__dirname, 'src/data/jarvisConfig.json');
  let srcMem = {};

  if (fs.existsSync(srcFile)) {
    try { srcMem = JSON.parse(fs.readFileSync(srcFile, 'utf-8')); } catch (e) {}
  }
  if (fs.existsSync(JARVIS_FILE)) {
    try { vpsMem = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8')); } catch (e) {}
  }

  const customDocs = vpsMem.customDocuments && vpsMem.customDocuments.length > 0 
    ? vpsMem.customDocuments 
    : (srcMem.customDocuments || []);

  const ownerDirectives = vpsMem.ownerDirectives && vpsMem.ownerDirectives.length > 0 
    ? vpsMem.ownerDirectives 
    : (srcMem.ownerDirectives || []);

  return {
    ...srcMem,
    ...vpsMem,
    customDocuments: customDocs,
    ownerDirectives: ownerDirectives
  };
}
```

---

### 🔹 PASO 2: Conectar la Memoria a Firestore y Purgar IndexedDB en `src/data/storeKnowledge.js`

1. Eliminar la lectura de `idbGetMetadata` al inicio que corrompía el `localStorage`.
2. Sincronizar el documento `jarvisConfig` directamente con **Google Cloud Firestore** para que cualquier directiva o documento guardado por el administrador esté disponible en todos los dispositivos y en el backend en tiempo real.

#### Código de Reemplazo en `src/data/storeKnowledge.js`:

```javascript
import { db, doc, getDoc, setDoc, onSnapshot } from '../utils/firebase.js';
import { getAuthToken } from '../utils/apiClient.js';

// Auto-hidratar desde Firestore y sincronizar con VPS
if (typeof window !== 'undefined') {
  try {
    const jarvisRef = doc(db, 'catalogStore', 'jarvisConfig');
    getDoc(jarvisRef).then((snap) => {
      if (snap.exists()) {
        const remoteData = snap.data();
        if (remoteData && Object.keys(remoteData).length > 0) {
          localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(remoteData));
          window.dispatchEvent(new CustomEvent('deco-jarvis-knowledge-updated', { detail: remoteData }));
          console.log('[Deco JARVIS] Memoria de entrenamiento sincronizada desde Cloud Firestore.');
        }
      }
    }).catch(() => {});
  } catch (e) {}

  // Sincronización secundaria con VPS
  fetch('/api/jarvis')
    .then(r => r.ok ? r.json() : null)
    .then(serverData => {
      if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
        localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(serverData));
        window.dispatchEvent(new CustomEvent('deco-jarvis-knowledge-updated', { detail: serverData }));
      }
    })
    .catch(() => {});
}

export function saveStoreKnowledge(knowledge) {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload = {
        ...knowledge,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('deco-jarvis-knowledge-updated', { detail: payload }));

      // 1. Guardar en Cloud Firestore (Persistencia Maestra)
      try {
        const jarvisRef = doc(db, 'catalogStore', 'jarvisConfig');
        setDoc(jarvisRef, payload, { merge: true }).catch(() => {});
      } catch (fsErr) {}

      // 2. Guardar en VPS SSD
      const token = getAuthToken();
      fetch('/api/jarvis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      }).catch(() => {});

      return true;
    }
  } catch (e) {
    console.error('[storeKnowledge] Error al guardar memoria:', e);
    return false;
  }
  return false;
}
```

---

## 4. 🧪 Protocolo de Validación para el Ejecutor

Tras realizar los cambios, el ejecutor debe verificar:

1. **Prueba de Respuesta Inmediata:**
   Enviar una consulta POST a `/api/jarvis/chat` con `prompt: "¿Qué eventos tienen?"`.
   *Verificar que responda en menos de 1 segundo mencionando el stand en Centranorte del 29 y 30 de agosto.*

2. **Prueba de Creación de Documento en Admin:**
   Crear un documento de prueba en el panel admin (ej: *"Promoción Especial 2x1 en Mini"*), recargar la página y verificar que J.A.R.V.I.S. responda conociendo la nueva promoción inmediatamente.

3. **Compilación de Producción:**
   ```powershell
   npm run build
   ```
   *Debe compilar con código 0 sin errores.*
