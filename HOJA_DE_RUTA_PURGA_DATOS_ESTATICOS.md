# 🚀 HOJA DE RUTA: PURGA DE DATOS FUNDIDOS EN CÓDIGO Y TRANSICIÓN A BASE DE DATOS MAESTRA
**Proyecto:** Deco Vintage Guate (`Web Deco Vintage Proyect`)  
**Fecha de Elaboración:** 27 de Agosto de 2026  
**Objetivo:** Plan de ejecución para desacoplar el frontend de los datos mock hardcodeados, otorgar autoridad total a Google Cloud Firestore y el VPS, y eliminar de raíz la discrepancia de obras y la "resurrección de datos borrados".

---

## 1. 📌 Contexto y Decisión Estratégica

Durante la auditoría del catálogo se identificó que el proyecto mantenía una arquitectura híbrida de transición:
1. **Los datos originales del prototipo** estaban "fundidos" (hardcodeados) en [src/data/catalogData.js](file:///c:/Users/sebas/Documents/Antigravity%20Files/Web%20Deco%20Vintage%20Proyect/src/data/catalogData.js) (con 1,165 líneas de código) y en `src/data/catalogStore.json` (con 37 obras).
2. **Las obras y categorías nuevas** creadas por el administrador se guardaban en **Google Cloud Firestore** (con 42+ obras).

### 💥 El Problema Detectado:
* **Discrepancia en la carga (Caso Avengers):** Al entrar a la tienda, la web cargaba primero las 37 obras del archivo viejo del código, y minutos después, cuando Firestore terminaba de negociar la conexión en segundo plano, inyectaba de golpe las obras nuevas como *Avengers Infinity War*.
* **Resurrección de Datos:** Si el administrador eliminaba o modificaba una categoría o cuadro en el panel web, cualquier despliegue futuro (`git push`) en Dokploy volvía a reintroducir los datos viejos porque seguían escritos dentro de los archivos JavaScript de Git.

### 🎯 La Decisión:
**Limpiar todos los registros fundidos en el código**, convirtiendo el frontend en un cliente visual limpio que se alimenta al **100% de la Base de Datos viva de Producción**.

---

## 2. 🌟 Beneficios Directos de la Purga

1. **Cero Discrepancias en el Catálogo:**
   * La tienda tendrá **una sola versión de la verdad** (Firestore / VPS montado). Todo el catálogo cargará completo desde el milisegundo cero.
2. **Eliminación Permanente de Obras y Categorías:**
   * Cualquier elemento que el administrador borre en el panel quedará borrado para siempre. Ningún despliegue de código podrá resucitarlo.
3. **Optimización de Rendimiento y Velocidad Móvil:**
   * Al eliminar más de 1,100 líneas de datos estáticos de `catalogData.js`, el peso del bundle JavaScript que descargan los celulares disminuye drásticamente, haciendo que la web cargue casi instantáneamente.
4. **Cero Mantenimiento Manual de JSONs:**
   * El catálogo podrá recibir 50, 500 o 2,000 obras sin que nadie tenga que hacer commits en Git ni editar archivos a mano.

---

## 3. 🛡️ Alcance Técnico: Qué se Purga vs Qué se Conserva

| Elemento | Acción | Justificación |
|---|:---:|---|
| `CATALOG_POSTERS` | 🧹 **Purgar a `[]`** | Las obras vendrán 100% de la base de datos viva (Firestore). |
| `CATEGORIES` | 🧹 **Purgar a `[]`** | Las categorías serán gestionadas dinámicamente por el administrador. |
| `INITIAL_FRANCHISES` | 🧹 **Purgar a `[]`** | Las franquicias serán gestionadas dinámicamente desde el panel. |
| `src/data/catalogStore.json` | 🧹 **Limpiar a estructura base** | Elimina datos congelados en el build de Docker. |
| `OFFICIAL_SIZES` | 🔒 **CONSERVAR** | Define la matriz física oficial de 6 tamaños y precios de fabricación (Mini Q25, Pequeño Q35, Mediano Q65, Grande Q125, etc.). |
| `ROOM_ENVIRONMENTS` | 🔒 **CONSERVAR** | Define los fondos y gradientes visuales del simulador de ambientes (Gamer, Sala, Oficina, Dormitorio). |

---

## 4. 🛠️ Plan de Ejecución Paso a Paso (Para Comenzar Mañana)

---

### 🔹 Paso 1: Congelación y Verificación de la Base de Datos Viva
* Asegurar que las **42+ obras actuales**, categorías y franquicias existentes en **Google Cloud Firestore** y el VPS estén consolidadas como el catálogo maestro definitivo antes de vaciar los archivos del código.

---

### 🔹 Paso 2: Limpieza de `src/data/catalogData.js`
* Reducir `catalogData.js` de 1,165 líneas a un módulo limpio que únicamente contenga las constantes del sistema (`OFFICIAL_SIZES`, `ROOM_ENVIRONMENTS`) y exporte arrays vacíos por defecto para inicialización (`CATALOG_POSTERS = []`, etc.).

---

### 🔹 Paso 3: Optimización del Motor de Carga en `src/utils/catalogStorage.js`
* Configurar `syncCatalogFromServer()` para que consulte inmediatamente a Firestore (`getDoc`) y al VPS (`apiGetCatalog`) en paralelo al abrir la tienda.
* Implementar un estado de carga suave (*Skeleton / Spinner*) para que los componentes esperen los ~100ms de respuesta de la base de datos en la primera visita de un usuario.
* Configurar la caché local (`localStorage`) con estrategia *Stale-While-Revalidate* (0ms en visitas posteriores).

---

### 🔹 Paso 4: Despliegue y Pruebas en Vivo
1. Compilar frontend: `npm run build`.
2. Realizar `git push` a `main` para que Dokploy despliegue la versión limpia.
3. Probar en vivo en `https://decovintage.online`:
   * Verificar que todas las obras (incluida *Avengers Infinity War*) aparezcan de inmediato al primer segundo.
   * Crear una obra de prueba en el panel admin y comprobar que se publica al instante sin tocar ningún archivo.
   * Eliminar una obra de prueba y verificar que no vuelve a aparecer tras recargar.

---

## 5. ✅ Estado de Cierre
Documento preparado y listo para guiar el inicio de las tareas en la siguiente sesión de trabajo.
