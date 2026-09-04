/**
 * Deco Vintage Guate — SPA Route & URL Sync Helper
 * Pure, reliable bidirectional mapper between window.location.pathname and App state.
 */

export function getRouteFromPath(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
  if (!pathname) {
    return { page: 'home', categoryId: null, franchiseId: null };
  }

  // Remove trailing slash if present (except for root '/')
  const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const lower = clean.toLowerCase();

  if (lower === '' || lower === '/') {
    return { page: 'home', categoryId: null, franchiseId: null };
  }

  if (lower === '/catalogo' || lower === '/catalog') {
    return { page: 'catalog', categoryId: null, franchiseId: null };
  }

  if (lower === '/sobre-posters' || lower === '/about' || lower === '/sobre-nosotros' || lower === '/nuestros-posters') {
    return { page: 'about', categoryId: null, franchiseId: null };
  }

  if (lower === '/personalizados' || lower === '/custom' || lower === '/cuadros-personalizados' || lower === '/custom-posters') {
    return { page: 'custom', categoryId: null, franchiseId: null };
  }

  if (lower === '/admin' || lower === '/dashboard') {
    return { page: 'admin', categoryId: null, franchiseId: null };
  }

  if (lower.startsWith('/categoria/')) {
    const rawCat = clean.substring('/categoria/'.length).trim();
    const catId = decodeURIComponent(rawCat);
    return { page: 'category', categoryId: catId || 'SUPERHEROES', franchiseId: null };
  }

  if (lower.startsWith('/franquicia/')) {
    const rawFran = clean.substring('/franquicia/'.length).trim();
    const franId = decodeURIComponent(rawFran);
    return { page: 'franchise', categoryId: null, franchiseId: franId || 'avengers' };
  }

  return { page: 'home', categoryId: null, franchiseId: null };
}

export function getPathFromRoute(page, categoryId = null, franchiseId = null) {
  switch (page) {
    case 'catalog':
      return '/catalogo';
    case 'about':
    case 'about-posters':
      return '/sobre-posters';
    case 'custom':
    case 'custom-posters':
      return '/personalizados';
    case 'admin':
      return '/admin';
    case 'category':
      return categoryId ? `/categoria/${encodeURIComponent(categoryId)}` : '/catalogo';
    case 'franchise':
      return franchiseId ? `/franquicia/${encodeURIComponent(franchiseId)}` : '/catalogo';
    case 'home':
    default:
      return '/';
  }
}
