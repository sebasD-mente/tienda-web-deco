export const OFFICIAL_SIZES = [
  {
    id: 'MINI',
    name: 'Mini',
    dimensions: '14 x 21 cms',
    widthCm: 14,
    heightCm: 21,
    price: 25.00,
    aspectRatio: '2/3',
    badge: 'Accesible',
    description: 'Ideal para escritorios, repisas y combinaciones múltiples.'
  },
  {
    id: 'PEQUENO',
    name: 'Pequeño',
    dimensions: '21 x 27 cms',
    widthCm: 21,
    heightCm: 27,
    price: 35.00,
    aspectRatio: '3/4',
    badge: 'Popular',
    description: 'Tamaño estándar versátil para habitaciones y pasillos.'
  },
  {
    id: 'DISCO',
    name: 'Portada de Álbum',
    dimensions: '30 x 30 cms',
    widthCm: 30,
    heightCm: 30,
    price: 55.00,
    aspectRatio: '1/1',
    badge: 'Edición Vinilo 🎵',
    description: 'Formato cuadrado perfecto para portadas musicales y arte conceptual.'
  },
  {
    id: 'MEDIANO',
    name: 'Mediano',
    dimensions: '30 x 45 cms',
    widthCm: 30,
    heightCm: 45,
    price: 65.00,
    aspectRatio: '2/3',
    badge: 'Más Vendido ⭐',
    description: 'El equilibrio perfecto entre presencia visual y espacio.'
  },
  {
    id: 'GRANDE',
    name: 'Grande',
    dimensions: '45 x 60 cms',
    widthCm: 45,
    heightCm: 60,
    price: 125.00,
    aspectRatio: '3/4',
    badge: 'Gran Impacto 🚀',
    description: 'Protagonista de tu sala, cuarto gamer o estudio.'
  },
  {
    id: 'GIGANTE',
    name: 'Gigante',
    dimensions: '60 x 100 cms',
    widthCm: 60,
    heightCm: 100,
    price: 210.00,
    aspectRatio: '3/5',
    badge: 'Edición Mural 👑',
    description: 'Pieza de arte monumental de máxima escala y detalle HP Látex.'
  }
];

export const CATEGORIES = [
  { id: 'TODOS', name: 'Todos los Posters', icon: 'Sparkles' },
  { id: 'AUTOS', name: 'Autos & Leyendas del Motor', icon: 'Car' },
  { id: 'GEEK', name: 'Superhéroes & Cómics', icon: 'Shield' },
  { id: 'ANIME', name: 'Anime & Manga', icon: 'Flame' },
  { id: 'CINE', name: 'Cine de Culto & Series', icon: 'Film' },
  { id: 'MUSICA', name: 'Música & Portadas de Disco', icon: 'Disc' },
  { id: 'VINTAGE', name: 'Patentes & Blueprint Retro', icon: 'Compass' }
];

export const CATALOG_POSTERS = [
  // --- AUTOS & VELOCIDAD (Con las imágenes oficiales de Deco Vintage) ---
  {
    id: 'AUTO-01',
    title: 'Porsche 911 GT3 RS',
    subtitle: 'Blueprint Técnico & Patente de Ingeniería',
    category: 'AUTOS',
    image: '/posters/Porche gt3 patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Porsche', 'GT3 RS', 'Deportivo', 'Supercar', 'Alemán'],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 48,
    description: 'El legendario 911 GT3 RS en diagrama técnico de alta precisión. Impresión HP Látex sobre MDF de 5.5mm con tonos ultra oscuros y tipografía dorada.'
  },
  {
    id: 'AUTO-02',
    title: 'Nissan Skyline GT-R R34',
    subtitle: 'Godzilla JDM Blueprint Edition',
    category: 'AUTOS',
    image: '/posters/skyline patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Nissan', 'Skyline', 'R34', 'JDM', 'Turbo'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 76,
    description: 'El rey indiscutible de la era dorada JDM. Desglose detallado del motor RB26DETT y la icónica silueta del R34.'
  },
  {
    id: 'AUTO-03',
    title: 'Toyota Supra MK4 (A80)',
    subtitle: '2JZ Legend Tech Specification',
    category: 'AUTOS',
    image: '/posters/Toyota supra patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Toyota', 'Supra', '2JZ', 'JDM', 'Fast & Furious'],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 64,
    description: 'El mítico motor 2JZ-GTE y la aerodinámica trasera del Supra MK4 inmortalizada sobre base rígida de madera.'
  },
  {
    id: 'AUTO-04',
    title: 'DeLorean DMC-12 Time Machine',
    subtitle: 'Flux Capacitor & Chrono-Specs',
    category: 'AUTOS',
    image: '/posters/Delorean Dmc 12 patente.jpg',
    defaultSize: 'GRANDE',
    tags: ['DeLorean', 'Volver al Futuro', 'Cine', 'Retro', 'Sci-Fi'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 52,
    description: 'El auto más famoso del cine de ciencia ficción con todas las especificaciones del condensador de flujo y carrocería de acero inoxidable.'
  },
  {
    id: 'AUTO-05',
    title: 'BMW M5 E39 V8 Beast',
    subtitle: 'Bavarian Performance Engineering',
    category: 'AUTOS',
    image: '/posters/Bmw M5 patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['BMW', 'M5', 'E39', 'V8', 'Motorsport'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 31,
    description: 'El sedán deportivo por excelencia. Diagrama anatómico del motor atmosférico S62 V8 con acabados de alta definición.'
  },
  {
    id: 'AUTO-06',
    title: 'Mercedes-AMG GT Black Series',
    subtitle: 'Affalterbach Aerodynamic Masterpiece',
    category: 'AUTOS',
    image: '/posters/Mercedez amg patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Mercedes', 'AMG', 'Black Series', 'V8 Biturbo'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 29,
    description: 'Agresividad pura y aerodinámica extrema de Nürburgring en una pieza decorativa de lujo.'
  },
  {
    id: 'AUTO-07',
    title: 'Subaru Impreza WRX STI 22B',
    subtitle: 'World Rally Championship Legend',
    category: 'AUTOS',
    image: '/posters/Subaru Impreza patente.jpg',
    defaultSize: 'PEQUENO',
    tags: ['Subaru', 'WRX STI', 'Rally', 'Boxer', 'Colin McRae'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 41,
    description: 'El mítico ícono azul y dorado del Campeonato Mundial de Rally con su tracción integral simétrica y alerón característico.'
  },
  {
    id: 'AUTO-08',
    title: 'Honda Civic Type R (EK9)',
    subtitle: 'VTEC Championship White Heritage',
    category: 'AUTOS',
    image: '/posters/Honda Civic Type R patente.jpg',
    defaultSize: 'PEQUENO',
    tags: ['Honda', 'Civic', 'Type R', 'EK9', 'VTEC'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 37,
    description: 'El primer Civic en portar el emblema Type R. La pureza de las 9,000 RPM en formato decorativo rígido.'
  },
  {
    id: 'AUTO-09',
    title: 'Mazda MX-5 Miata (NA)',
    subtitle: 'Pop-up Headlights Roadster Icon',
    category: 'AUTOS',
    image: '/posters/Mazda MX5 patente.jpg',
    defaultSize: 'MINI',
    tags: ['Mazda', 'Miata', 'MX5', 'Pop-up', 'JDM'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 45,
    description: 'Los faros retráctiles y la distribución perfecta 50:50 del roadster más vendido del planeta.'
  },
  {
    id: 'AUTO-10',
    title: 'Toyota Land Cruiser Prado',
    subtitle: 'Heavy Duty Overland 4x4',
    category: 'AUTOS',
    image: '/posters/Toyota Prado patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Toyota', 'Prado', 'Overland', '4x4', 'Offroad'],
    isFeatured: false,
    rating: 4.7,
    reviewsCount: 23,
    description: 'La leyenda de la resistencia todoterreno. Desglose del chasis de largueros y suspensión reforzada.'
  },
  {
    id: 'AUTO-11',
    title: 'Toyota Pickup SR5 1985 (Marty McFly)',
    subtitle: 'Classic 4WD Black Edition',
    category: 'AUTOS',
    image: '/posters/Toyota SR5 patente.jpg',
    defaultSize: 'MEDIANO',
    tags: ['Toyota', 'SR5', 'Hilux', '4x4', 'Back to the Future'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 58,
    description: 'La camioneta negra más codiciada de los años 80 con faros KC y suspensión levantada.'
  },

  // --- SUPERHÉROES & GEEK ---
  {
    id: 'GEEK-01',
    title: 'The Dark Knight: Gotham Shadows',
    subtitle: 'Minimalist Neo-Noir Batman Art',
    category: 'GEEK',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'GRANDE',
    tags: ['Batman', 'DC', 'Gotham', 'Dark Knight', 'Cómics'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 88,
    description: 'El vigilante de Gotham en silueta cinemática de alto contraste. Tonos negros profundos gracias a la tinta látex.'
  },
  {
    id: 'GEEK-02',
    title: 'Spider-Man: Miles Morales Across The Verse',
    subtitle: 'Multiverse Neon Chroma Edition',
    category: 'GEEK',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'MEDIANO',
    tags: ['Spider-Man', 'Marvel', 'Miles Morales', 'Spiderverse', 'Neon'],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 65,
    description: 'Colores eléctricos y efecto glitch con la calidad más vibrante en soporte de madera MDF.'
  },
  {
    id: 'GEEK-03',
    title: 'Iron Man: Mark LXXXV Blueprint',
    subtitle: 'Stark Industries Arc Reactor Schematic',
    category: 'GEEK',
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'GRANDE',
    tags: ['Iron Man', 'Marvel', 'Avengers', 'Stark', 'Blueprint'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 42,
    description: 'Diagrama de ingeniería de la armadura nanotecnológica de Tony Stark con acabados dorados.'
  },

  // --- ANIME & MANGA ---
  {
    id: 'ANIME-01',
    title: 'Attack on Titan: The Colossal Stare',
    subtitle: 'Shingeki no Kyojin Wall Rose Edition',
    category: 'ANIME',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'GRANDE',
    tags: ['Attack on Titan', 'Eren', 'Shingeki', 'Anime', 'Manga'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 92,
    description: 'El impacto sobrecogedor del Titán Colosal en ilustración épica con soporte rígido listo para colgar.'
  },
  {
    id: 'ANIME-02',
    title: 'Cyberpunk Edgerunners: Night City Neon',
    subtitle: 'David & Lucy Under The Moon',
    category: 'ANIME',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'MEDIANO',
    tags: ['Cyberpunk', 'Anime', 'Neon', 'Edgerunners', 'Sci-Fi'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 51,
    description: 'La melancolía y el brillo neón de Night City en una pieza decorativa de estética futurista.'
  },

  // --- CINE DE CULTO ---
  {
    id: 'CINE-01',
    title: 'Pulp Fiction: Dancing Shadows',
    subtitle: 'Quentin Tarantino Cult Masterpiece',
    category: 'CINE',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'MEDIANO',
    tags: ['Pulp Fiction', 'Tarantino', 'Cine', 'Retro', 'Cult'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 38,
    description: 'Vincent Vega y Mia Wallace en la escena más icónica del cine de los 90.'
  },
  {
    id: 'CINE-02',
    title: 'Interstellar: Gargantua Singularity',
    subtitle: 'Christopher Nolan Space Epic',
    category: 'CINE',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'GIGANTE',
    tags: ['Interstellar', 'Nolan', 'Sci-Fi', 'Gargantua', 'Espacio'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 115,
    description: 'El agujero negro Gargantua a escala monumental en tamaño gigante (60x100cm).'
  },

  // --- MÚSICA & PORTADAS DE DISCO ---
  {
    id: 'MUSICA-01',
    title: 'Pink Floyd: Dark Side of the Moon',
    subtitle: 'Prism Dispersion Vinyl Edition',
    category: 'MUSICA',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'DISCO',
    tags: ['Pink Floyd', 'Rock', 'Vinilo', 'Música', 'Prisma'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 73,
    description: 'Formato especial Portada de Álbum (30x30cm) exacto al tamaño de un disco de vinilo clásico.'
  },
  {
    id: 'MUSICA-02',
    title: 'Daft Punk: Random Access Memories',
    subtitle: 'Helmets of Gold and Silver',
    category: 'MUSICA',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    defaultSize: 'DISCO',
    tags: ['Daft Punk', 'Electro', 'Disco 30x30', 'Música'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 34,
    description: 'Los legendarios cascos de Daft Punk en acabado reflectante sobre MDF de 5.5mm.'
  }
];

export const ROOM_ENVIRONMENTS = [
  {
    id: 'LIVING',
    name: '🛋️ Sala Contemporánea',
    bgGradient: 'linear-gradient(180deg, #181d26 0%, #0d1117 100%)',
    wallColor: '#1a222d',
    furnitureScale: 1.0,
    description: 'Pared oscura con sofá minimalista y lámpara de ambiente.'
  },
  {
    id: 'GAMER',
    name: '🎮 Setup Gamer & Streamer',
    bgGradient: 'linear-gradient(180deg, #150f24 0%, #08060f 100%)',
    wallColor: '#120d20',
    furnitureScale: 1.0,
    description: 'Pared acústica con iluminación neón cyan y magenta.'
  },
  {
    id: 'OFFICE',
    name: '💼 Oficina Ejecutiva',
    bgGradient: 'linear-gradient(180deg, #1f2421 0%, #0a0d0c 100%)',
    wallColor: '#181f1c',
    furnitureScale: 1.0,
    description: 'Pared elegante con escritorio de roble y decoración sobria.'
  }
];
