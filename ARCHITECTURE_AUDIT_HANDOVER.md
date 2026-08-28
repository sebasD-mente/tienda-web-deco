# 🏛️ AUDITORÍA TÉCNICA, ARQUITECTURA Y HANDOVER DE VULNERABILIDADES
**Proyecto:** Deco Vintage Guate (`Web Deco Vintage Proyect`)  
**Fecha de Auditoría:** 27 de Agosto de 2026  
**Objetivo del Documento:** Proveer a cualquier agente de IA o ingeniero de software un contexto técnico exhaustivo, diagnóstico de arquitectura, vulnerabilidades críticas detectadas y guía paso a paso de resolución.

---

## 1. 📌 Ficha Técnica del Proyecto

* **Dominio Público:** `https://decovintage.online` / `https://www.decovintage.online`
* **Servidor VPS:** Hostinger (`145.223.120.56`) con 100 GB SSD
* **Panel de Despliegue PaaS:** Dokploy (`http://145.223.120.56:3000`)
* **Repositorio Git:** `sebasD-mente/tienda-web-deco` (Rama: `main`)
* **Stack Tecnológico:**
  * **Frontend:** React 18, Vite 5, Lucide Icons, Canvas API, CSS3 Vanilla (Stark OS / Glassmorphism)
  * **Backend:** Node.js 20, Express 5.2, Sharp 0.35 (Motor de compresión WebP)
  * **Base de Datos Primaria:** Google Cloud Firestore (`tienda-web-deco-vintage`)
  * **Base de Datos Secundaria:** VPS SSD Local File (`data/catalogStore.json`)
  * **Inteligencia Artificial:** Google Gemini AI SDK (`@google/generative-ai`) integrado en J.A.R.V.I.S.

---

## 2. 🗺️ Topología Arquitectónica Actual

```
                        +---------------------------------------------+
                        |                 CLIENTE                     |
                        |      (React 18 SPA en Navegador Web)        |
                        +----------------------+----------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v (Lectura / Sincronización)                         v (API REST / Uploads)
       +-----------------------------+                     +-----------------------------+
       |   Google Cloud Firestore    |                     |    VPS Hostinger (Dokploy)  |
       |     (Base de Datos)         |                     |   Node.js 20 + Express +    |
       |  Doc: 'masterCatalog'       |                     |    Sharp Image Engine       |
       +-----------------------------+                     +--------------+--------------+
                                                                          |
                                                                          v (Guarda WebP)
                                                           +-----------------------------+
                                                           |     Disco 100 GB SSD        |
                                                           |   /public/posters/uploads/  |
                                                           +-----------------------------+
```

---

## 3. 🚨 Hallazgos Críticos y Vulnerabilidades (Priorizadas por Severidad)

### 🔴 PRIORIDAD 0 (P0): Pérdida de Imágenes por Contenedor Docker Efímero en Dokploy
* **Archivos Afectados:** `Dockerfile` y `server.js:35-40`
* **Causa Raíz:** En `Dockerfile`, la aplicación corre en un contenedor sin volumen montado. El backend escribe imágenes físicas a `/app/public/posters/uploads` y datos a `/app/data`.
* **Impacto:** Con cada nuevo despliegue en Dokploy (`git push` a `main`), Dokploy destruye el contenedor previo y levanta uno nuevo desde la imagen base de Git. **Cualquier imagen subida o catálogo guardado después del último commit se destruye irreversiblemente.**
* **Solución Técnica:**
  En el panel de Dokploy -> Configuración de la Aplicación -> **Volumes**:
  * Montar: `/var/dokploy/data/deco/uploads` ➜ `/app/public/posters/uploads`
  * Montar: `/var/dokploy/data/deco/data` ➜ `/app/data`

---

### 🔴 PRIORIDAD 0 (P0): Condición de Carrera y Sobrescritura de Datos en `catalogStorage.js`
* **Archivos Afectados:** `src/utils/catalogStorage.js:73-144`
* **Causa Raíz:** La función `syncCatalogFromServer()` descarga ciegamente los datos de Firestore al iniciar la aplicación:
  ```javascript
  const snap = await getDoc(catalogRef);
  if (snap.exists()) {
    memoryPosters = firestoreCatalog.posters;
    // Sobrescritura automática del VPS:
    apiSaveCatalog({ posters: memoryPosters, ... }).catch(() => {});
    return true;
  }
  ```
  Si una escritura a Firestore falló previamente o tiene datos desactualizados, al abrir la página web se cargan los datos viejos de Firestore y **se sobrescribe el catálogo más reciente del disco del VPS**, provocando pérdida silenciosa de cambios.
* **Solución Técnica:**
  Comparar siempre la propiedad `updatedAt` (ISO Timestamp) de ambos orígenes (Firestore vs VPS Server). Solo sincronizar si la fecha entrante es estrictamente más reciente que la local (`new Date(incoming.updatedAt) > new Date(current.updatedAt)`).

---

### 🔴 PRIORIDAD 0 (P0): Bug de Runtime en Verificación de Auth (`activeTokens` no definido)
* **Archivos Afectados:** `server.js:144-151`
* **Causa Raíz:**
  ```javascript
  app.post('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    if (token && activeTokens.has(token)) { // 💥 ERROR: activeTokens NO EXISTE
      return res.status(200).json({ valid: true, user: ADMIN_USER });
    }
  ```
* **Impacto:** Todo llamado a `/api/auth/verify` arroja un error `HTTP 500 (ReferenceError: activeTokens is not defined)` debido a que el sistema migró a tokens HMAC sin actualizar esta función.
* **Solución Técnica:**
  Reemplazar por:
  ```javascript
  if (token && verifyAuthToken(token)) {
    return res.status(200).json({ valid: true, user: ADMIN_USER });
  }
  ```

---

### 🟠 PRIORIDAD 1 (P1): Límite de 1MB en Firestore y Estructura Monolítica
* **Archivos Afectados:** `src/utils/catalogStorage.js:54-68`
* **Causa Raíz:** Todo el catálogo (obras, categorías, franquicias, configuración) se persiste en un único documento: `doc(db, 'catalogStore', 'masterCatalog')`.
  * Firestore tiene un límite duro de **1 MiB (1,048,576 bytes)** por documento.
  * Si la subida de una imagen al VPS falla y el póster conserva su string base64 (`data:image/webp;base64,...`), solo 2 o 3 pósters superarán 1MB y Firestore rechazará todas las escrituras posteriores de forma silenciosa.
* **Solución Técnica:**
  1. Validar estrictamente en `persistToFirestore` que ninguna imagen o thumb contenga `data:image/` antes de enviar a Firestore.
  2. Planificar la migración a colección de documentos (`collection(db, 'posters')`).

---

### 🟠 PRIORIDAD 1 (P1): Exposición de Escritura Pública en Firestore
* **Archivos Afectados:** `src/utils/firebase.js` y `src/utils/catalogStorage.js`
* **Causa Raíz:** El frontend React ejecuta `setDoc` directamente en Firestore desde el navegador sin sesión de Firebase Auth.
* **Impacto:** Las reglas de seguridad de Firestore (`firestore.rules`) tienen que estar abiertas al público (`allow write: if true;`), permitiendo que cualquier usuario desde la consola del navegador pueda modificar o eliminar el catálogo completo de la tienda.
* **Solución Técnica:**
  Centralizar las escrituras hacia Firestore a través del backend Node.js autenticado con `requireAuth` o mediante Firebase Admin SDK en el servidor.

---

### 🟡 PRIORIDAD 2 (P2): Falta de Limpieza de Archivos Huérfanos en VPS
* **Archivos Afectados:** `server.js` y `src/utils/catalogStorage.js`
* **Causa Raíz:** Cuando un póster se elimina del catálogo, el registro se borra del JSON y de Firestore, pero los archivos físicos `.webp` permanecen en `/public/posters/uploads/full/` y `/public/posters/uploads/thumb/`.
* **Solución Técnica:**
  Crear endpoint `DELETE /api/catalog/image` o vincular la eliminación del póster en el servidor con `fs.unlinkSync` de los archivos correspondientes.

---

### 🟡 PRIORIDAD 2 (P2): Credenciales Administrativas en Texto Plano
* **Archivos Afectados:** `server.js:22-24`
* **Causa Raíz:** Valores por defecto de contraseña en texto plano en el código fuente.
* **Solución Técnica:**
  Mover todas las credenciales a variables de entorno en Dokploy (`ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `GEMINI_API_KEY`) y eliminar los fallbacks con datos reales del código fuente.

---

## 4. 🛠️ Guía de Implementación para el Agente (Código Exacto)

### Modificación 1: `server.js` (Reparación de Verificación de Auth y Manejo de Errores)
```javascript
// Reemplazar líneas 144-151 en server.js:
app.post('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token && verifyAuthToken(token)) {
    return res.status(200).json({ valid: true, user: ADMIN_USER });
  }
  return res.status(401).json({ valid: false });
});
```

### Modificación 2: `src/utils/catalogStorage.js` (Sanitización contra Base64 y Reconciliación con Timestamps)
```javascript
// En persistToFirestore, filtrar base64 para no romper el límite de 1MB de Firestore:
async function persistToFirestore(payload) {
  try {
    const cleanPosters = (payload.posters || []).map(p => {
      const copy = { ...p };
      // Si por alguna razón tiene base64, no enviarlo a Firestore
      if (copy.image && copy.image.startsWith('data:image/')) {
        copy.image = '/posters/uploads/placeholder.webp';
      }
      if (copy.thumb && copy.thumb.startsWith('data:image/')) {
        copy.thumb = '/posters/uploads/placeholder.webp';
      }
      return copy;
    });

    const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
    await setDoc(catalogRef, {
      updatedAt: payload.updatedAt || new Date().toISOString(),
      posters: cleanPosters,
      categories: payload.categories || [],
      franchises: payload.franchises || [],
      settings: payload.settings || {}
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[Deco Storage] Firestore sync warning:', fsErr.message);
  }
}
```

---

## 5. 📋 Protocolo de Validación y Pruebas

Cualquier agente o desarrollador que realice cambios debe ejecutar:

1. **Prueba de Compilación Frontend:**
   ```powershell
   npm run build
   ```
   *Debe compilar con código de salida 0 y generar los chunks en `dist/` sin errores.*

2. **Prueba de Autenticación de Servidor:**
   Ejecutar una petición POST a `/api/auth/login` y verificar con el token resultante en `/api/auth/verify` que la respuesta sea `HTTP 200 { "valid": true }`.

3. **Prueba de Subida de Imagen:**
   Crear un póster en el panel admin, confirmar que devuelve URLs relativas `/posters/uploads/...` y verificar que no existan strings `data:image/` en el `catalogStore.json`.
