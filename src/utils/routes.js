/**
 * Deco Vintage — Clean URL Routing Utility (SPA Navigation)
 * Maps browser URL paths (and legacy hashes) to application page states,
 * including shareable poster deep-links (/poster/:id).
 */

export function getRouteFromPath(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
  hash = typeof window !== 'undefined' ? window.location.hash : ''
) {
  // Support inline hash in pathname if present
  let pathOnly = pathname || '/';
  let inlineHash = hash || '';
  if (typeof pathOnly === 'string' && pathOnly.includes('#')) {
    const hashIndex = pathOnly.indexOf('#');
    if (!inlineHash) {
      inlineHash = pathOnly.slice(hashIndex);
    }
    pathOnly = pathOnly.slice(0, hashIndex) || '/';
  }

  // 1. Check Legacy Hash first (e.g. #admin, #catalogo, #categoria/ANIME, #poster/id)
  if (inlineHash && inlineHash.length > 1) {
    const cleanHash = inlineHash.replace(/^#\/?/, '').trim();
    const cleanHashLower = cleanHash.toLowerCase();

    if (cleanHashLower === 'admin' || cleanHashLower === 'dashboard') {
      return { page: 'admin', categoryId: null, franchiseId: null, posterId: null };
    }
    if (cleanHashLower === 'catalogo' || cleanHashLower === 'catalog') {
      return { page: 'catalog', categoryId: null, franchiseId: null, posterId: null };
    }
    if (
      cleanHashLower === 'sobre-los-posters' ||
      cleanHashLower === 'sobre-posters' ||
      cleanHashLower === 'sobre-nosotros' ||
      cleanHashLower === 'nuestros-posters' ||
      cleanHashLower === 'about' ||
      cleanHashLower === 'about-posters'
    ) {
      return { page: 'about', categoryId: null, franchiseId: null, posterId: null };
    }
    if (
      cleanHashLower === 'personalizados' ||
      cleanHashLower === 'cuadros-personalizados' ||
      cleanHashLower === 'custom' ||
      cleanHashLower === 'custom-posters'
    ) {
      return { page: 'custom', categoryId: null, franchiseId: null, posterId: null };
    }
    if (cleanHashLower.startsWith('poster/')) {
      const rawPosterId = cleanHash.slice('poster/'.length).split('/')[0];
      let decodedPosterId = rawPosterId;
      try {
        decodedPosterId = decodeURIComponent(rawPosterId);
      } catch (e) {}
      return { page: 'home', categoryId: null, franchiseId: null, posterId: decodedPosterId || null };
    }
    if (cleanHashLower.startsWith('categoria/') || cleanHashLower.startsWith('category/')) {
      const parts = cleanHash.split('/');
      const rawCat = decodeURIComponent(parts[1] || '').toUpperCase();
      return { page: 'category', categoryId: rawCat || 'SUPERHEROES', franchiseId: null, posterId: null };
    }
    if (cleanHashLower.startsWith('franquicia/') || cleanHashLower.startsWith('franchise/')) {
      const parts = cleanHash.split('/');
      const rawFran = decodeURIComponent(parts[1] || '').toLowerCase();
      return { page: 'franchise', categoryId: null, franchiseId: rawFran || 'avengers', posterId: null };
    }
  }

  // 2. Check Clean Pathname
  const cleanPath = (pathOnly || '/').replace(/\/+$/, '') || '/';
  const lowerPath = cleanPath.toLowerCase();

  if (lowerPath === '/admin' || lowerPath === '/dashboard') {
    return { page: 'admin', categoryId: null, franchiseId: null, posterId: null };
  }

  if (lowerPath === '/catalogo' || lowerPath === '/catalog') {
    return { page: 'catalog', categoryId: null, franchiseId: null, posterId: null };
  }

  if (
    lowerPath === '/sobre-los-posters' ||
    lowerPath === '/sobre-posters' ||
    lowerPath === '/sobre-nosotros' ||
    lowerPath === '/nuestros-posters' ||
    lowerPath === '/about' ||
    lowerPath === '/about-posters'
  ) {
    return { page: 'about', categoryId: null, franchiseId: null, posterId: null };
  }

  if (
    lowerPath === '/personalizados' ||
    lowerPath === '/cuadros-personalizados' ||
    lowerPath === '/custom' ||
    lowerPath === '/custom-posters'
  ) {
    return { page: 'custom', categoryId: null, franchiseId: null, posterId: null };
  }

  if (lowerPath.startsWith('/poster/')) {
    const rawPosterId = cleanPath.replace(/^\/poster\//i, '').split('/')[0];
    let decoded = rawPosterId;
    try {
      decoded = decodeURIComponent(rawPosterId);
    } catch (e) {}
    return {
      page: 'home',
      categoryId: null,
      franchiseId: null,
      posterId: decoded || null
    };
  }

  if (lowerPath.startsWith('/categoria/') || lowerPath.startsWith('/category/')) {
    const rawCat = cleanPath.replace(/^\/(categoria|category)\//i, '');
    let decoded = rawCat;
    try {
      decoded = decodeURIComponent(rawCat);
    } catch (e) {}
    return {
      page: 'category',
      categoryId: decoded.toUpperCase() || 'SUPERHEROES',
      franchiseId: null,
      posterId: null
    };
  }

  if (lowerPath.startsWith('/franquicia/') || lowerPath.startsWith('/franchise/')) {
    const rawFran = cleanPath.replace(/^\/(franquicia|franchise)\//i, '');
    let decoded = rawFran;
    try {
      decoded = decodeURIComponent(rawFran);
    } catch (e) {}
    return {
      page: 'franchise',
      categoryId: null,
      franchiseId: decoded.toLowerCase() || 'avengers',
      posterId: null
    };
  }

  return { page: 'home', categoryId: null, franchiseId: null, posterId: null };
}

export function getPathFromRoute(page, categoryId = null, franchiseId = null, posterId = null) {
  if (page === 'poster' && posterId) {
    return `/poster/${encodeURIComponent(posterId)}`;
  }
  switch (page) {
    case 'admin':
      return '/admin';
    case 'catalog':
      return '/catalogo';
    case 'about':
    case 'about-posters':
      return '/sobre-los-posters';
    case 'custom':
    case 'custom-posters':
      return '/personalizados';
    case 'category':
      return categoryId ? `/categoria/${encodeURIComponent(categoryId)}` : '/catalogo';
    case 'franchise':
      return franchiseId ? `/franquicia/${encodeURIComponent(franchiseId)}` : '/catalogo';
    case 'home':
    default:
      return '/';
  }
}
