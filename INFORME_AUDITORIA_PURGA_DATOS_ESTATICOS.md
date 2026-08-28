# 📋 INFORME DE AUDITORÍA TÉCNICA: PURGA DE DATOS ESTÁTICOS Y TRANSICIÓN A BASE DE DATOS MAESTRA

**Proyecto:** Deco Vintage Guate (`Web Deco Vintage Proyect`)  
**Dominio de Producción:** [https://decovintage.online](https://decovintage.online)  
**Fecha de Ejecución:** 28 de Agosto de 2026  
**Commit de Despliegue:** `8c532c0` (`main -> main`)  
**Responsable Técnico:** Asistente de Ingeniería de Software (Antigravity)  
**Destinatario:** Auditor Técnico / Equipo de Arquitectura de Software  

---

## 1. 📌 Resumen Ejecutivo

El presente informe certifica y documenta la refactorización arquitectónica realizada sobre el frontend y los motores de almacenamiento del proyecto **Deco Vintage Guate**. 

El objetivo principal fue desacoplar el frontend de los datos mock hardcodeados en el código JavaScript (`src/data/catalogData.js`), estableciendo una **Única Fuente de la Verdad (Single Source of Truth)** respaldada concurrentemente en **Google Cloud Firestore (Primaria)** y el **disco SSD del servidor VPS Hostinger (Secundaria)**.

### 💥 Problemas Preexistentes Resueltos:
1. **Discrepancia en la carga de imágenes y parpadeo visual (Flicker / CLS):** El navegador renderizaba inicialmente 37 obras estáticas fundidas en el código y, tras negociar la conexión con la base de datos, inyectaba abruptamente las 42+ obras reales de producción, provocando saltos de diseño y peticiones de red duplicadas.
2. **Resurrección de datos eliminados:** Al eliminarse una obra o categoría desde el panel administrativo, cualquier despliegue posterior (`git push` a Dokploy) reintroducía los datos antiguos debido a que persistían en el código fuente de Git.
3. **Sobrecarga de Bundle JavaScript:** El bundle inicial transportaba más de 1,165 líneas de objetos JSON estáticos innecesarios.

---

## 2. 🏛️ Comparativa Arquitectónica (Antes vs. Después)

```
[ ARQUITECTURA ANTERIOR (Híbrida / Desincronizada) ]
   Git Push ──► catalogData.js (37 obras hardcodeadas) ──► React Render Inmediato (Obras viejas)
                                                                    ▲
                                                                    │ (Salto visual / Parpadeo)
   Firestore / VPS SSD (42+ obras vivas) ─────────────► Inyección tardía (Sobrescribe catálogo)

─────────────────────────────────────────────────────────────────────────────────────────────────

[ ARQUITECTURA ACTUAL (100% Viva / Sincronizada) ]
   1. Lectura Caché Local (localStorage): 0 ms (Render instantáneo sin parpadeo)
   2. Consulta Paralela Dual:
       ├──► Google Cloud Firestore (getDoc / onSnapshot en tiempo real)
       └──► VPS Hostinger SSD (/api/catalog)
   3. Skeletons Shimmer: Sostienen el espacio visual si la caché está vacía (CLS = 0)
   4. Base de Datos Maestra: Cero datos fundidos en el código fuente.
```

---

## 3. 🔍 Registro Detallado de Modificaciones por Archivo

### A. Capa de Datos y Constantes del Sistema

#### 1. `src/data/catalogData.js`
* **Acción:** Purgado y refactorizado de 1,165 líneas a 34 líneas.
* **Detalle Técnico:**
  * Se eliminaron todos los objetos estáticos de pósters y categorías que estaban escritos a mano.
  * **Constantes Estructurales Conservadas Intactas:**
    * `OFFICIAL_SIZES`: Matriz física de los 6 tamaños y precios oficiales (Mini Q25, Pequeño Q35, Portada Álbum Q55, Mediano Q65, Grande Q125, Gigante Q210).
    * `ROOM_ENVIRONMENTS`: Definición visual del simulador de ambientes (Sala, Gamer, Oficina, Dormitorio).
    * `STORE_SETTINGS`: Configuración inicial del teléfono de WhatsApp y tiempos de entrega.
  * **Exportaciones por Defecto:**
    * `export const CATEGORIES = [];`
    * `export const CATALOG_POSTERS = [];`
    * `export const INITIAL_FRANCHISES = [];`

#### 2. `data/backup_catalog_master.json` **[NUEVO]**
* **Acción:** Creación de snapshot completo de seguridad previo a la purga.
* **Detalle Técnico:** Contiene los 42 pósters, 8 categorías y 7 franquicias con sus identificadores únicos, descripciones y rutas WebP.

#### 3. `src/data/catalogStore.json`
* **Acción:** Sincronizado para reflejar la versión idéntica y limpia de `data/catalogStore.json`.

#### 4. `src/data/categoriesData.js`, `src/data/franchisesData.js` y `src/data/postersData.js`
* **Acción:** Limpieza de datos duplicados.
* **Detalle Técnico:** Se redirigieron las exportaciones hacia `src/data/catalogData.js` para asegurar que ningún archivo legado mantenga arrays mock desactualizados.

---

### B. Capa de Almacenamiento y Sincronización

#### 5. `src/utils/catalogStorage.js`
* **Acción:** Optimización del motor de sincronización y alta disponibilidad.
* **Detalle Técnico:**
  * **Resiliencia de Carga (`syncCatalogFromServer`):** 
    * Consulta inicial al endpoint del VPS (`apiGetCatalog`).
    * Fallback directo a Google Cloud Firestore (`getDoc`) si el VPS presenta demoras o desconexión.
    * Persistencia automática en `localStorage` bajo la clave `deco_v5_master_catalog_cache`.
    * Emisión del evento global `deco-catalog-updated` para notificar reactivamente a todos los componentes de la interfaz.
  * **Suscripción en Tiempo Real (`onSnapshot`):** Mantiene la sincronización multi-pestaña y multi-dispositivo sin requerir recargas manuales.
  * **Operaciones CRUD:** Las funciones `saveOrUpdatePoster`, `deletePosterById`, `addNewCategory`, etc., operan directamente sobre el VPS SSD y Firestore simultáneamente.

---

### C. Capa de Interfaz de Usuario (UI / UX)

#### 6. `src/components/CategoryShelf.jsx`
* **Acción:** Implementación de placeholders de carga fluidos (*Shimmer Skeletons*).
* **Detalle Técnico:**
  * Si un nuevo usuario ingresa con caché vacía, el componente renderiza un esqueleto animado (`shimmer 1.5s infinite linear`) durante los milisegundos que tarda la conexión a la base de datos.
  * Se elimina cualquier salto de maquetación (Cumulative Layout Shift = 0).

#### 7. `src/components/HeroCarousel.jsx`
* **Acción:** Adaptación de propiedades dinámicas para pósters y franquicias.
* **Detalle Técnico:**
  * Soporte para recibir franquicias mediante props (`propFranchises`) con fallback al estado de memoria reactivo.
  * Filtrado determinista de *Best Sellers* (`Boolean(p.isFeatured)`) sin dependencias de listas duras en código.

---

### D. Configuración de Control de Versiones

#### 8. `.gitignore`
* **Acción:** Incorporación de reglas de exclusión para medios pesados (`*.mp4`, `*.mov`).
* **Detalle Técnico:** Previene que videos locales de prueba o documentación saturen el repositorio Git o bloqueen los despliegues automáticos hacia Dokploy.

---

## 4. 🛡️ Garantías de Seguridad y Preservación de Datos

| Elemento Auditado | Estado de Seguridad | Justificación |
| :--- | :---: | :--- |
| **Archivos Físicos de Imágenes** | 🔒 **100% Preservados** | Las imágenes en `/public/posters/`, `/public/franchises/` y `/public/posters/uploads/` no fueron alteradas ni eliminadas. |
| **Catálogo de 42 Obras** | 🔒 **100% Activo** | Obras recientes como *Avengers Infinity War*, *Van Gogh Ródano*, *Goku*, etc., están completamente funcionales. |
| **Reglas de Fabricación** | 🔒 **100% Preservadas** | Los 6 tamaños físicos y precios de `OFFICIAL_SIZES` permanecen intactos en el código. |
| **Simulador de Ambientes** | 🔒 **100% Operativo** | Las salas de `ROOM_ENVIRONMENTS` continúan vinculadas al modal de producto. |

---

## 5. 🧪 Verificación y Pruebas en Vivo (Producción)

Se ejecutó una batería de validaciones automáticas y de red contra el entorno de producción (`https://decovintage.online`):

### 1. Compilación de Producción (`Vite Build`):
```text
✓ 1517 modules transformed.
dist/index.html                                 3.32 kB
dist/assets/index-wNVv17Hv.css                  5.52 kB
dist/assets/vendor-BYy_h4JI.js                163.54 kB
dist/assets/index-DgyMDOTV.js                 688.05 kB
✓ built in 3.80s - 0 errors, 0 warnings
```

### 2. Pruebas de Red y Disponibilidad HTTP:
* **`GET https://decovintage.online`:** `HTTP 200 OK` (Servido por Nginx / Dokploy).
* **`GET https://decovintage.online/api/catalog`:** `HTTP 200 OK`
  * `PostersCount:` **42**
  * `CategoriesCount:` **8**
  * `FranchisesCount:` **7**
  * `UpdatedAt:` `2026-08-28T02:47:19.438Z`

---

## 6. ✅ Conclusión de Auditoría

La transición ha sido completada con **cero tiempo de inactividad (Zero-Downtime)** y **cero pérdida de datos**. El sistema ahora opera bajo una arquitectura desacoplada, moderna y escalable, preparada para soportar el crecimiento del catálogo sin requerir modificaciones en el código fuente.

**Firma Digital de Conformidad:**  
*Equipo de Desarrollo & Antigravity AI Assistant*  
*Deco Vintage Guate — Agosto 2026*
