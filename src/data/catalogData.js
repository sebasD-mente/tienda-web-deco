// Official 6 Sizes and Pricing Matrix (in Quetzales)
export const OFFICIAL_SIZES = [
  {
    id: 'MINI',
    name: 'Mini',
    dimensions: '14 x 21 cm',
    widthCm: 14,
    heightCm: 21,
    price: 25.00,
    badge: 'Ideal para coleccionar y escritorios'
  },
  {
    id: 'PEQUENO',
    name: 'Pequeño',
    dimensions: '21 x 27 cm',
    widthCm: 21,
    heightCm: 27,
    price: 35.00,
    badge: 'Espacios reducidos y cabeceras'
  },
  {
    id: 'PORTADA_ALBUM',
    name: 'Portada de Álbum',
    dimensions: '30 x 30 cm',
    widthCm: 30,
    heightCm: 30,
    price: 55.00,
    badge: 'Formato vinilo cuadrado para música'
  },
  {
    id: 'MEDIANO',
    name: 'Mediano',
    dimensions: '30 x 45 cm',
    widthCm: 30,
    heightCm: 45,
    price: 65.00,
    badge: '⭐ El más vendido para habitaciones'
  },
  {
    id: 'GRANDE',
    name: 'Grande',
    dimensions: '45 x 60 cm',
    widthCm: 45,
    heightCm: 60,
    price: 125.00,
    badge: 'Protagonista para salas y oficinas'
  },
  {
    id: 'GIGANTE',
    name: 'Gigante',
    dimensions: '60 x 100 cm',
    widthCm: 60,
    heightCm: 100,
    price: 210.00,
    badge: 'Impacto visual monumental'
  }
];

export const CATEGORIES = [
  { id: 'TODOS', name: 'TODAS LAS OBRAS' },
  { id: 'AUTOS', name: 'AUTOS' },
  { id: 'SUPERHEROES', name: 'SUPER HEROES' },
  { id: 'ANIME', name: 'ANIME' },
  { id: 'CINE', name: 'CINE' },
  { id: 'MUSICA', name: 'MUSICA' }
];

export const ROOM_ENVIRONMENTS = [
  {
    id: 'LIVING',
    name: 'Sala de Estar',
    wallColor: '#1a1f2c',
    bgGradient: 'radial-gradient(circle at center, #242c3d 0%, #121620 100%)'
  },
  {
    id: 'GAMER',
    name: 'Setup Gamer',
    wallColor: '#0e1320',
    bgGradient: 'radial-gradient(circle at center, #182038 0%, #080b12 100%)'
  },
  {
    id: 'OFFICE',
    name: 'Oficina Ejecutiva',
    wallColor: '#2b2623',
    bgGradient: 'radial-gradient(circle at center, #3d3530 0%, #171412 100%)'
  }
];

export const CATALOG_POSTERS = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. COLECCIÓN AUTOS & PATENTES TÉCNICAS (Tamaño exclusivo Grande 45x60 cm)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'porsche-gt3',
    title: 'Porsche 911 GT3 RS Patente Técnica',
    subtitle: 'Blueprint Automotriz Motorsport',
    category: 'AUTOS',
    image: '/posters/optimized/full/porche-gt3-patente.webp',
    thumb: '/posters/optimized/thumb/porche-gt3-patente.webp',
    tags: ['Porsche', 'GT3', 'Motorsport', 'Blueprint', 'Alemania'],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 38,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Diagrama técnico esquemático del icónico Porsche 911 GT3 RS. Impresión de alta definición con detalles milimétricos sobre base rígida de MDF 5.5mm.'
  },
  {
    id: 'skyline-r34',
    title: 'Nissan Skyline GT-R R34 Patente Técnica',
    subtitle: 'Leyenda JDM Godzilla',
    category: 'AUTOS',
    image: '/posters/optimized/full/skyline-patente.webp',
    thumb: '/posters/optimized/thumb/skyline-patente.webp',
    tags: ['Nissan', 'Skyline', 'R34', 'JDM', 'Godzilla'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 52,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'El rey absoluto de la cultura JDM. Esquema técnico patentado del Nissan Skyline R34 V-Spec, montado en soporte de madera listo para colgar.'
  },
  {
    id: 'toyota-supra',
    title: 'Toyota Supra MK4 2JZ Patente Técnica',
    subtitle: 'El Rey del 2JZ Twin Turbo',
    category: 'AUTOS',
    image: '/posters/optimized/full/toyota-supra-patente.webp',
    thumb: '/posters/optimized/thumb/toyota-supra-patente.webp',
    tags: ['Toyota', 'Supra', 'MK4', '2JZ', 'JDM'],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 44,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'La leyenda de las pistas y los cuartos de milla. Esquema de patente del motor y chasis del legendario Toyota Supra MK4.'
  },
  {
    id: 'delorean-dmc12',
    title: 'DeLorean DMC-12 Time Machine Patente',
    subtitle: 'Volver al Futuro & Cultura Ochentera',
    category: 'AUTOS',
    image: '/posters/optimized/full/delorean-dmc-12-patente.webp',
    thumb: '/posters/optimized/thumb/delorean-dmc-12-patente.webp',
    tags: ['Delorean', 'DMC12', 'BackToTheFuture', 'SciFi', 'Vintage'],
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 29,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'El condensador de flujo y el diseño técnico del auto más icónico del cine de ciencia ficción de los 80s.'
  },
  {
    id: 'bmw-m5',
    title: 'BMW M5 Patente Técnica',
    subtitle: 'Sedán Deportivo Alemán de Alta Potencia',
    category: 'AUTOS',
    image: '/posters/optimized/full/bmw-m5-patente.webp',
    thumb: '/posters/optimized/thumb/bmw-m5-patente.webp',
    tags: ['BMW', 'M5', 'Motorsport', 'Alemania', 'Blueprint'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 28,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Blueprint detallado del BMW M5. Ingeniería de alto rendimiento plasamada en una patente técnica sobre madera MDF de 5.5mm.'
  },
  {
    id: 'honda-civic-type-r',
    title: 'Honda Civic Type R Patente Técnica',
    subtitle: 'Hot Hatch Legendario VTEC',
    category: 'AUTOS',
    image: '/posters/optimized/full/honda-civic-type-r-patente.webp',
    thumb: '/posters/optimized/thumb/honda-civic-type-r-patente.webp',
    tags: ['Honda', 'Civic', 'TypeR', 'VTEC', 'JDM'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 31,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Esquema técnico del rey de la tracción delantera. Diseño minucioso de motor y aerodinámica del Civic Type R.'
  },
  {
    id: 'mazda-mx5',
    title: 'Mazda MX-5 Miata Patente Técnica',
    subtitle: 'El Roadster Más Vendido del Mundo',
    category: 'AUTOS',
    image: '/posters/optimized/full/mazda-mx5-patente.webp',
    thumb: '/posters/optimized/thumb/mazda-mx5-patente.webp',
    tags: ['Mazda', 'MX5', 'Miata', 'Roadster', 'JDM'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 25,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Plano esquemático del icónico Miata. Distribución de peso perfecta 50/50 y chasis ligero.'
  },
  {
    id: 'mercedez-amg',
    title: 'Mercedes-AMG GT Patente Técnica',
    subtitle: 'Superdeportivo V8 Biturbo de Affalterbach',
    category: 'AUTOS',
    image: '/posters/optimized/full/mercedez-amg-patente.webp',
    thumb: '/posters/optimized/thumb/mercedez-amg-patente.webp',
    tags: ['Mercedes', 'AMG', 'V8', 'Affalterbach', 'Supercar'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 36,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Elegancia y poder descomunal. Blueprint de la patente técnica del Mercedes-AMG GT.'
  },
  {
    id: 'subaru-impreza',
    title: 'Subaru Impreza WRC Patente Técnica',
    subtitle: 'Tracción Total Symmetrical AWD Boxer',
    category: 'AUTOS',
    image: '/posters/optimized/full/subaru-impreza-patente.webp',
    thumb: '/posters/optimized/thumb/subaru-impreza-patente.webp',
    tags: ['Subaru', 'Impreza', 'WRC', 'Boxer', 'Rally'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 34,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'La leyenda de las etapas de rally mundial. Diagrama técnico del Subaru Impreza AWD.'
  },
  {
    id: 'toyota-prado',
    title: 'Toyota Land Cruiser Prado Patente Técnica',
    subtitle: 'El Conquistador Todo Terreno 4WD',
    category: 'AUTOS',
    image: '/posters/optimized/full/toyota-prado-patente.webp',
    thumb: '/posters/optimized/thumb/toyota-prado-patente.webp',
    tags: ['Toyota', 'Prado', 'LandCruiser', '4x4', 'OffRoad'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 30,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'Robusto, indestructible y sofisticado. Esquema técnico patentado del Toyota Prado 4x4.'
  },
  {
    id: 'toyota-sr5',
    title: 'Toyota Hilux SR5 Patente Técnica',
    subtitle: 'El Todoterreno Clásico Legendario',
    category: 'AUTOS',
    image: '/posters/optimized/full/toyota-sr5-patente.webp',
    thumb: '/posters/optimized/thumb/toyota-sr5-patente.webp',
    tags: ['Toyota', 'SR5', 'Hilux', 'PickUp', 'Vintage'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 42,
    sizeBadge: '45 x 60 cm',
    availableSizes: ['GRANDE'],
    priceDisplay: 'Q 125.00',
    description: 'La camioneta 4x4 más icónica de los años 80 y 90. Plano técnico detallado de suspensión y chasis.'
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. COLECCIÓN SUPER HÉROES & MARVEL CÓMICS (Disponibles en todos los 6 tamaños)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'spiderman-amazing-fantasy-15',
    title: 'Amazing Fantasy #15 Debut 1962',
    subtitle: 'Primera Aparición Histórica de Spider-Man',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/6326644814-(3).webp',
    thumb: '/posters/optimized/thumb/6326644814-(3).webp',
    tags: ['Spider-Man', 'Marvel', 'AmazingFantasy', 'StanLee', 'VintageComic'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 64,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'La portada de cómic más codiciada del mundo. El debut original de Spider-Man creado por Stan Lee y Steve Ditko en 1962.'
  },
  {
    id: 'spiderman-316-venom',
    title: 'The Amazing Spider-Man #316 Venom Debut',
    subtitle: 'Todd McFarlane Clásico de 1989',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/origin-(3).webp',
    thumb: '/posters/optimized/thumb/origin-(3).webp',
    tags: ['Spider-Man', 'Venom', 'ToddMcFarlane', 'Marvel', 'CoverArt'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 47,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'La legendaria portada de Todd McFarlane donde Venom regresa triunfal. Impresión de alto gramaje con colores retro saturados.'
  },
  {
    id: 'spiderman-no-way-home',
    title: 'Spider-Man: No Way Home Trío Épico',
    subtitle: 'Tobey, Andrew y Tom vs Doc Ock',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/whatsapp-image-2022-12-13-at-5.15.33-pm.webp',
    thumb: '/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.15.33-pm.webp',
    tags: ['SpiderMan', 'NoWayHome', 'Multiverso', 'Marvel', 'Cinema'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 58,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'El encuentro cinematográfico más grande del multiverso arácnido. Póster cinematográfico con acabado de alta definición.'
  },
  {
    id: 'spiderman-miles-morales-hoodie',
    title: 'Miles Morales: Into The Spider-Verse',
    subtitle: 'Estilo Urbano con Capucha Roja',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/03a7036fdfcef43eeedce692adbcdba0-(1).webp',
    thumb: '/posters/optimized/thumb/03a7036fdfcef43eeedce692adbcdba0-(1).webp',
    tags: ['MilesMorales', 'SpiderVerse', 'Brooklyn', 'Sony', 'Art'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 39,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'El arte conceptual urbano de Miles Morales en su icónico traje con sudadera roja y zapatillas Nike Chicago.'
  },
  {
    id: 'spiderman-insomniac-advanced-suit',
    title: 'Spider-Man Advanced Suit PS5',
    subtitle: 'Arte Óleo con Araña Blanca',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/e8yxpkzvgaqvyyp-(3).webp',
    thumb: '/posters/optimized/thumb/e8yxpkzvgaqvyyp-(3).webp',
    tags: ['SpiderMan', 'Insomniac', 'PS5', 'Gaming', 'Art'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 34,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'Ilustración artística de estilo óleo y textura de pintura del Spider-Man de Insomniac Games con la emblemática araña blanca.'
  },
  {
    id: 'spiderman-spider-verse-all-spiders',
    title: 'Spider-Verse: All Spiders Assemble',
    subtitle: 'Portada Marvel Now Comics',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/gwsyhwshsh-(1).webp',
    thumb: '/posters/optimized/thumb/gwsyhwshsh-(1).webp',
    tags: ['SpiderVerse', 'MarvelComics', 'SpiderGwen', 'SpiderNoir', 'AllSpiders'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 42,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'Todas las variantes del Spider-Verse en una sola ilustración coral de combate interdimensional.'
  },
  {
    id: 'spiderman-green-goblin-battle',
    title: 'Spider-Man vs Duende Verde & Doc Ock',
    subtitle: 'Batalla Épica en Manhattan',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp',
    thumb: '/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp',
    tags: ['SpiderMan', 'GreenGoblin', 'DocOck', 'Villains', 'Marvel'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 29,
    sizeBadge: '6 Tamaños',
    availableSizes: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'],
    priceDisplay: 'Desde Q 25.00',
    description: 'Batalla aérea sobre los rascacielos de Nueva York entre Spider-Man y sus más grandes archienemigos.'
  }
];
