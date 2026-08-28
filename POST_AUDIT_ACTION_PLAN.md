# 📋 INFORME DE AUDITORÍA POST-CORRECCIÓN Y PLAN DE ACCIÓN
**Proyecto:** Deco Vintage Guate (`Web Deco Vintage Proyect`)  
**Commit Analizado:** `ce15991` (*Fix activeTokens ReferenceError in /api/auth/verify and add base64 sanitization for Firestore*)  
**Fecha:** 27 de Agosto de 2026  
**Destinatario:** Agente de IA / Ingeniero de Software asignado  

---

## 1. 🔍 Resumen del Estado Actual

Se auditó minuciosamente el código tras la aplicación del commit `ce15991`. La aplicación **compila exitosamente en 3.7s (`npm run build`)** y se verificaron dos correcciones importantes:

* ✅ **CORREGIDO:** Bug en `server.js` línea 147 reemplazado por `verifyAuthToken(token)`. La verificación de sesiones de administrador en `/api/auth/verify` ya no crashea con `500 ReferenceError`.
* ✅ **CORREGIDO:** Sanitización en `src/utils/catalogStorage.js:56-65` para reemplazar cualquier imagen en formato `data:image/` por `/posters/wallpaper.jpg` antes de enviarla a Firestore, previniendo exceder el límite de 1MB por documento.

---

## 2. 🚨 Tareas Críticas Pendientes por Resolver (Backlog para el Agente)

---

### 🔴 TAREA 1 (Prioridad 0): Reconciliación por Timestamp (`updatedAt`) en `catalogStorage.js`

* **Archivo:** `src/utils/catalogStorage.js` (Función `syncCatalogFromServer`)
* **Problema Actual:**
  Actualmente, al iniciar la aplicación, `syncCatalogFromServer()` consulta Firestore y si encuentra datos, **sobrescribe incondicionalmente el catálogo del VPS** mediante `apiSaveCatalog()`. Si Firestore tiene datos viejos o incompletos por un fallo previo de red, los cambios más recientes guardados en el disco del VPS son destruidos silenciosamente.
* **Solución a Implementar:**
  Descargar ambos estados (Firestore y VPS) y aplicar el catálogo con la marca de tiempo `updatedAt` más reciente:

```javascript
// Reemplazo recomendado para syncCatalogFromServer en src/utils/catalogStorage.js:
export async function syncCatalogFromServer() {
  try {
    cleanObsoleteBrowserStorage();

    // 1. Obtener datos de Firestore
    let firestoreData = null;
    try {
      const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
      const snap = await getDoc(catalogRef);
      if (snap.exists()) {
        firestoreData = snap.data();
      }
    } catch (fsErr) {
      console.warn('[Deco Storage] Error al leer Firestore:', fsErr.message);
    }

    // 2. Obtener datos del VPS
    let vpsData = null;
    try {
      vpsData = await apiGetCatalog();
    } catch (vpsErr) {
      console.warn('[Deco Storage] Error al leer VPS:', vpsErr.message);
    }

    // 3. Determinar el catálogo ganador basado en updatedAt
    const fsTime = firestoreData?.updatedAt ? new Date(firestoreData.updatedAt).getTime() : 0;
    const vpsTime = vpsData?.updatedAt ? new Date(vpsData.updatedAt).getTime() : 0;

    let winner = null;
    let winnerSource = '';

    if (fsTime > 0 && fsTime >= vpsTime && Array.isArray(firestoreData.posters)) {
      winner = firestoreData;
      winnerSource = 'Firestore';
    } else if (vpsTime > 0 && Array.isArray(vpsData.posters)) {
      winner = vpsData;
      winnerSource = 'VPS SSD';
    } else if (firestoreData && Array.isArray(firestoreData.posters)) {
      winner = firestoreData;
      winnerSource = 'Firestore (Fallback)';
    }

    if (winner && Array.isArray(winner.posters)) {
      memoryPosters = winner.posters;
      memoryCategories = winner.categories || DEFAULT_CATEGORIES;
      memoryFranchises = winner.franchises || DEFAULT_FRANCHISES;
      memorySettings = winner.settings || DEFAULT_SETTINGS;

      if (memorySettings.whatsappPhone) {
        saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('deco-catalog-updated'));
      }
      console.log(`[Deco Storage] Catálogo maestro sincronizado desde ${winnerSource}: ${memoryPosters.length} obras.`);

      // Si una fuente estaba más atrasada, actualizarla para mantener ambas alineadas
      if (winnerSource === 'Firestore' && fsTime > vpsTime) {
        apiSaveCatalog({
          posters: memoryPosters,
          categories: memoryCategories,
          franchises: memoryFranchises,
          settings: memorySettings
        }).catch(() => {});
      } else if (winnerSource === 'VPS SSD' && vpsTime > fsTime) {
        persistToFirestore({
          posters: memoryPosters,
          categories: memoryCategories,
          franchises: memoryFranchises,
          settings: memorySettings,
          updatedAt: winner.updatedAt
        }).catch(() => {});
      }

      return true;
    }
  } catch (err) {
    console.warn('[Deco Storage] Error general de sincronización:', err.message);
  }
  return false;
}
```

---

### 🔴 TAREA 2 (Prioridad 0 - Infraestructura): Montaje de Volúmenes Persistentes en Dokploy

* **Entorno:** VPS Hostinger (`145.223.120.56:3000`)
* **Problema:** 
  El backend guarda las imágenes en `/app/public/posters/uploads` y los JSON en `/app/data`. Si el contenedor Docker no tiene volúmenes montados hacia el disco físico del host, **cada nuevo despliegue o rebuild en Dokploy borra todas las imágenes subidas por el administrador**.
* **Acción Requerida:**
  En el panel de Dokploy -> Tu Aplicación -> Pestaña **Volumes / Mounts**, agregar:
  1. `Host Path:` `/var/dokploy/data/deco/uploads` ➜ `Container Path:` `/app/public/posters/uploads`
  2. `Host Path:` `/var/dokploy/data/deco/data` ➜ `Container Path:` `/app/data`

---

### 🟡 TAREA 3 (Prioridad 1): Limpieza Física de Imágenes Huérfanas al Eliminar Obras

* **Archivos:** `server.js` y `src/utils/catalogStorage.js`
* **Problema:** 
  Al llamar a `deletePosterById(posterId)`, el registro se elimina del JSON y de Firestore, pero las imágenes `.webp` físicas en `/public/posters/uploads/full/` y `/public/posters/uploads/thumb/` se quedan ocupando espacio en el SSD.
* **Solución a Implementar:**
  1. Agregar endpoint en `server.js`:
  ```javascript
  app.post('/api/catalog/delete-image', requireAuth, (req, res) => {
    try {
      const { imagePath, thumbPath } = req.body;
      if (imagePath && imagePath.startsWith('/posters/uploads/')) {
        const fullFile = path.resolve(__dirname, 'public', imagePath.replace(/^\//, ''));
        if (fs.existsSync(fullFile)) fs.unlinkSync(fullFile);
      }
      if (thumbPath && thumbPath.startsWith('/posters/uploads/')) {
        const thumbFile = path.resolve(__dirname, 'public', thumbPath.replace(/^\//, ''));
        if (fs.existsSync(thumbFile)) fs.unlinkSync(thumbFile);
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
  ```
  2. Invocar este endpoint desde `deletePosterById()` en `catalogStorage.js`.

---

## 3. 🧪 Comandos de Validación para el Agente

Antes de dar por finalizada la tarea, ejecutar:

```powershell
# 1. Validar que la compilación de Vite sea impecable
npm run build

# 2. Verificar estado de Git
git status
```
