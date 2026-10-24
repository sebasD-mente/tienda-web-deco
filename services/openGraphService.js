/**
 * services/openGraphService.js
 * Inyección dinámica y segura de etiquetas OpenGraph / Twitter Card en index.html
 * para que enlaces compartidos (/poster/:id) muestren la foto, título y precio real
 * de la obra en WhatsApp, Instagram, Facebook, Telegram y X.
 */

const DEFAULT_ORIGIN = 'https://www.decovintage.online';

/**
 * Escapa caracteres especiales HTML para prevenir XSS en atributos meta y <title>.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resuelve la URL absoluta de la imagen del póster para crawlers de redes sociales.
 * @param {string|null} rawImage
 * @param {string} originUrl
 * @returns {string}
 */
export function resolveAbsoluteImageUrl(rawImage, originUrl = DEFAULT_ORIGIN) {
  const cleanOrigin = String(originUrl || DEFAULT_ORIGIN).replace(/\/+$/, '');
  if (!rawImage || typeof rawImage !== 'string') {
    return `${cleanOrigin}/assets/og-cover.png`;
  }
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return rawImage;
  }
  const normalizedPath = rawImage.startsWith('/') ? rawImage : `/${rawImage}`;
  return `${cleanOrigin}${normalizedPath}`;
}

/**
 * Inyecta los metadatos OpenGraph y Twitter Card de un póster en la plantilla index.html.
 *
 * @param {string} baseHtml - Contenido original de index.html
 * @param {object} poster - Objeto póster normalizado por formatPosterForClient
 * @param {string} [originUrl='https://www.decovintage.online']
 * @returns {string} HTML enriquecido con los metadatos de la obra
 */
export function buildPosterOpenGraphHtml(baseHtml, poster, originUrl = DEFAULT_ORIGIN) {
  if (!baseHtml || !poster) return baseHtml || '';

  const cleanOrigin = String(originUrl || DEFAULT_ORIGIN).replace(/\/+$/, '');
  const posterSlug = encodeURIComponent(poster.legacyId || poster.id || '');
  const canonicalUrl = `${cleanOrigin}/poster/${posterSlug}`;

  const rawTitle = poster.title || poster.titulo || 'Póster de Colección';
  const rawSubtitle = poster.subtitle || poster.subtitulo || '';
  const minPriceNum = Number(poster.minPrice ?? poster.precioMinimo ?? 25);
  const priceTag = !Number.isNaN(minPriceNum) && minPriceNum > 0
    ? `Desde Q${minPriceNum.toFixed(2)}`
    : 'Desde Q25.00';

  const fullTitle = rawSubtitle
    ? `${rawTitle} — ${rawSubtitle} (${priceTag}) | Deco Vintage Guate`
    : `${rawTitle} (${priceTag}) | Deco Vintage Guate`;

  const rawDesc = poster.description || poster.descripcion ||
    `Póster rígido "${rawTitle}" impreso en alta definición HP Látex sobre madera MDF de 5.5mm. Incluye cinta Tesa de montaje rápido. ${priceTag}. Envíos a toda Guatemala.`;

  const safeTitle = escapeHtml(fullTitle);
  const safeDesc = escapeHtml(rawDesc);
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeImage = escapeHtml(resolveAbsoluteImageUrl(poster.image || poster.imageUrl || poster.thumb || poster.thumbUrl, cleanOrigin));

  let html = baseHtml;

  // 1. <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${safeTitle}</title>`
  );

  // 2. <meta name="description">
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );

  // 3. <link rel="canonical">
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeCanonical}" />`
  );

  // 4. OpenGraph tags
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImage}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${safeImage}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeHtml(rawTitle)}" />`
  );

  // 5. Twitter Card tags
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${safeCanonical}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImage}" />`
  );

  return html;
}
