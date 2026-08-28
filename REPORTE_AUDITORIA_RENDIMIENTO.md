# 🛡️ REPORTE DE AUDITORÍA DE RENDIMIENTO Y PLAN DE ACCIÓN
**Proyecto:** Deco Vintage Guate (`https://decovintage.online`)  
**Fecha:** 28 de Agosto, 2026  
**Protocolo Aplicado:** `diagnostico-causa-raiz-devops` (Cero Suposiciones, Causa Raíz por Capas)

---

## 1. 📊 Diagnóstico Empírico en Vivo (44 Obras Auditadas)

Tras auditar en vivo las 44 imágenes del catálogo en producción mediante pruebas automatizadas de red, se obtuvieron las siguientes métricas exactas:

* **Disponibilidad:** 44 de 44 imágenes responden `HTTP 200 OK` (no hay enlaces rotos).
* **El Cuello de Botella:** **43 de las 44 imágenes tardan entre 7.4 y 8.8 segundos en terminar de cargar.**
* **Peso Total de la Portada:** **~35 Megabytes** transferidos en el primer segundo (en lugar de los < 800 KB originales).

---

## 2. 🔍 Causa Raíz Identificada por Capas

### 🚨 Capa 1: El Bloqueador Crítico (`wallpaper.jpg` de 7.8 MB x 3)
* En `data/catalogStore.json`, 3 obras ubicadas al inicio de la portada (*Porsche 911 GT3 RS*, *Goku Super Saiyan God* y *Batman The Dark Knight*) tienen asignada la ruta `/posters/wallpaper.jpg`.
* **Peso del archivo:** **7,819 KB (7.8 MB)** cada uno.
* Al entrar a la web, el navegador dispara **23.4 MB de descarga simultánea** solo por esos 3 pósters, saturando el ancho de banda y poniendo en cola todas las demás imágenes (haciendo que incluso una imagen liviana de 3 KB tarde 8 segundos en descargarse).

### 🚨 Capa 2: Ausencia de la propiedad `thumb` en el Catálogo
* Las obras tienen definida la ruta `image: "/posters/uploads/full/..."` (archivos pesados de 300 KB a 600 KB), pero **carecen de la propiedad `thumb`**.
* En los componentes de React (`CategoryShelf.jsx`, `HeroCarousel.jsx`), la llamada es:
  ```jsx
  src={poster.thumb || poster.image}
  ```
* Al no existir `thumb`, el frontend descarga la versión FULL de las 44 obras en portada en lugar de las miniaturas de **15 KB - 25 KB** que ya existen en el disco (`/posters/uploads/thumb/`).

### 🚨 Capa 3: Trampa de Fallback en el Frontend (`OptimizedImage.jsx`)
* En `src/components/OptimizedImage.jsx` (Línea 11), el fallback por defecto ante cualquier reintento está configurado como:
  ```jsx
  fallbackSrc = '/posters/wallpaper.jpg' // (7.8 MB)
  ```
  Esto provoca descargas pesadas e innecesarias ante cualquier fallo menor de red.

---

## 3. 🛠️ Plan de Acción Quirúrgico (Sin Parches Rotos)

### Paso 1: Corregir y Poblar `data/catalogStore.json`
1. **Reemplazar las 3 rutas de `wallpaper.jpg`** por sus imágenes WebP optimizadas correspondientes (o por sus miniaturas en `/posters/optimized/` o `/posters/uploads/`).
2. **Restaurar el campo `thumb`** en todos los pósters del catálogo apuntando a sus miniaturas existentes:
   * Si `image` es `/posters/uploads/full/obra-123.webp` ➔ `thumb` debe ser `/posters/uploads/thumb/obra-123.webp`.
   * Si `image` es `/posters/optimized/full/obra.webp` ➔ `thumb` debe ser `/posters/optimized/thumb/obra.webp` (o su WebP optimizado ligero).

### Paso 2: Corregir el Fallback en `src/components/OptimizedImage.jsx`
* Cambiar la línea 11 para que no use el archivo de 7.8 MB como fallback:
  ```jsx
  // Antes: fallbackSrc = '/posters/wallpaper.jpg'
  // Ahora: Usar un placeholder ligero o cadena vacía para que active el skeleton/icono
  fallbackSrc = ''
  ```

### Paso 3: Habilitar Compresión Gzip en `server.js`
* Asegurar el uso de `compression()` en Express para servir el JSON del catálogo y assets comprimidos de forma ultrarrápida:
  ```javascript
  import compression from 'compression';
  app.use(compression());
  ```

---

## 4. 🧪 Criterios de Aceptación y Verificación en Producción

1. **Peso total en la carga inicial:** Reducción drástica de **~35 MB ➔ < 1.2 MB**.
2. **Tiempo de carga de imágenes:** Reducción de **8.5 segundos ➔ < 0.8 segundos**.
3. **Fluidez de navegación:** Renderizado inmediato de miniaturas a 60 FPS sin tirones de red ni bloqueos.
