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
  { id: 'TODOS', name: 'Todas las Obras', icon: 'Sparkles' },
  { id: 'AUTOS', name: 'Autos & Patentes Clásicas', icon: 'Car' },
  { id: 'SUPERHEROES', name: 'Superhéroes & Marvel Cómics', icon: 'Shield' },
  { id: 'ANIME', name: 'Anime & Manga', icon: 'Flame' },
  { id: 'CINE', name: 'Cine de Culto & Sci-Fi', icon: 'Film' },
  { id: 'MUSICA', name: 'Música & Portadas de Álbum', icon: 'Music' }
];

export const CATALOG_POSTERS = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. COLECCIÓN AUTOS & PATENTES TÉCNICAS
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
    description: 'El auto que viajó a través del tiempo. Diagrama patentado con alas de gaviota y condensador de flujo, impreso con tintas HP Látex de máxima durabilidad.'
  },
  {
    id: 'bmw-m5',
    title: 'BMW M5 E39 Patente Técnica',
    subtitle: 'El Sedán Deportivo Definitivo',
    category: 'AUTOS',
    image: '/posters/optimized/full/bmw-m5-patente.webp',
    thumb: '/posters/optimized/thumb/bmw-m5-patente.webp',
    tags: ['BMW', 'M5', 'E39', 'V8', 'Bavaria'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 21,
    description: 'El equilibrio perfecto entre elegancia ejecutiva y potencia V8. Cuadro rígido premium en MDF 5.5mm con acabado mate antirreflejo.'
  },
  {
    id: 'mercedes-amg',
    title: 'Mercedes-AMG GT Black Series Patente',
    subtitle: 'Monstruo de Nürburgring',
    category: 'AUTOS',
    image: '/posters/optimized/full/mercedez-amg-patente.webp',
    thumb: '/posters/optimized/thumb/mercedez-amg-patente.webp',
    tags: ['Mercedes', 'AMG', 'BlackSeries', 'Supercar'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 19,
    description: 'La cúspide de la ingeniería de Affalterbach. Impresión de gran formato con tintas ecológicas resistentes a la humedad.'
  },
  {
    id: 'subaru-impreza',
    title: 'Subaru Impreza WRX STI Patente',
    subtitle: 'Monarca Mundial de Rally WRC',
    category: 'AUTOS',
    image: '/posters/optimized/full/subaru-impreza-patente.webp',
    thumb: '/posters/optimized/thumb/subaru-impreza-patente.webp',
    tags: ['Subaru', 'WRX', 'STI', 'Rally', 'Boxer'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 27,
    description: 'La leyenda de Colin McRae y el Campeonato Mundial de Rally. Incluye cinta de montaje doble cara industrial Tessa sin necesidad de abrir agujeros.'
  },
  {
    id: 'honda-civic-type-r',
    title: 'Honda Civic Type R EK9 Patente',
    subtitle: 'Revolución VTEC High RPM',
    category: 'AUTOS',
    image: '/posters/optimized/full/honda-civic-type-r-patente.webp',
    thumb: '/posters/optimized/thumb/honda-civic-type-r-patente.webp',
    tags: ['Honda', 'Civic', 'TypeR', 'EK9', 'VTEC'],
    isFeatured: false,
    rating: 4.7,
    reviewsCount: 23,
    description: 'El origen de la mística Type R. Diagrama en vinilo montado sobre base rígida de 5.5 mm con bordes finamente biselados.'
  },
  {
    id: 'toyota-prado',
    title: 'Toyota Land Cruiser Prado Patente 4x4',
    subtitle: 'Indestructible Overlanding',
    category: 'AUTOS',
    image: '/posters/optimized/full/toyota-prado-patente.webp',
    thumb: '/posters/optimized/thumb/toyota-prado-patente.webp',
    tags: ['Toyota', 'LandCruiser', 'Prado', '4x4', 'Overland'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 31,
    description: 'La referencia off-road más respetada en Centroamérica. Esquema arquitectónico de chasis y transmisión.'
  },
  {
    id: 'toyota-sr5',
    title: 'Toyota Hilux SR5 1985 Patente Clásica',
    subtitle: 'La Camioneta Indestructible',
    category: 'AUTOS',
    image: '/posters/optimized/full/toyota-sr5-patente.webp',
    thumb: '/posters/optimized/thumb/toyota-sr5-patente.webp',
    tags: ['Toyota', 'Hilux', 'SR5', 'MartyMcFly', '4x4'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 40,
    description: 'La mítica SR5 negra de los años 80. Impresión de alta definición sobre madera sólida.'
  },
  {
    id: 'mazda-mx5',
    title: 'Mazda MX-5 Miata Patente Técnica',
    subtitle: 'Pura Pasión Jinba Ittai',
    category: 'AUTOS',
    image: '/posters/optimized/full/mazda-mx5-patente.webp',
    thumb: '/posters/optimized/thumb/mazda-mx5-patente.webp',
    tags: ['Mazda', 'Miata', 'MX5', 'Roadster', 'JDM'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 16,
    description: 'El roadster más vendido del mundo en un esquema patentado para coleccionistas.'
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. COLECCIÓN SUPERHÉROES & MARVEL CÓMICS (DISEÑOS REALES)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'amazing-fantasy-15',
    title: 'Amazing Fantasy #15 (Debut Histórico de Spider-Man 1962)',
    subtitle: 'La Portada de Cómic Más Legendaria de la Historia',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/6326644814-(3).webp',
    thumb: '/posters/optimized/thumb/6326644814-(3).webp',
    tags: ['SpiderMan', 'AmazingFantasy', 'Marvel', 'StanLee', 'Vintage', 'Comic'],
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 68,
    description: 'La portada histórica de agosto de 1962 donde el mundo conoció por primera vez a Peter Parker y Spider-Man. Impresión sobre MDF 5.5mm con fidelidad tipográfica y de color.'
  },
  {
    id: 'spiderman-venom-316',
    title: 'The Amazing Spider-Man #316: Venom is Back!',
    subtitle: 'Obra Maestra de Todd McFarlane (1989)',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/e8yxpkzvgaqvyyp-(3).webp',
    thumb: '/posters/optimized/thumb/e8yxpkzvgaqvyyp-(3).webp',
    tags: ['SpiderMan', 'Venom', 'ToddMcFarlane', 'Marvel', 'Comic', 'Symbiote'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 54,
    description: 'La icónica ilustración de Todd McFarlane con Venom dominando a Spider-Man sobre fondo rosa vibrante. Un clásico imprescindible para los amantes del cómic.'
  },
  {
    id: 'spiderman-no-way-home',
    title: 'Spider-Man: No Way Home (Los Tres Héroes Unidos)',
    subtitle: 'Tobey Maguire, Andrew Garfield & Tom Holland vs Doc Ock',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp',
    thumb: '/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp',
    tags: ['SpiderMan', 'NoWayHome', 'TobeyMaguire', 'AndrewGarfield', 'TomHolland', 'DocOck', 'Marvel', 'Cinema'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 72,
    description: 'Composición épica con los tres Spider-Man cinematográficos esquivando los tentáculos mecánicos de Doctor Octopus en medio de relámpagos dorados.'
  },
  {
    id: 'miles-morales-hoodie',
    title: 'Miles Morales: Into The Spider-Verse',
    subtitle: 'Estilo Urbano con Capucha & Zapatillas Jordan',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/whatsapp-image-2022-12-13-at-5.15.33-pm.webp',
    thumb: '/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.15.33-pm.webp',
    tags: ['MilesMorales', 'SpiderVerse', 'Marvel', 'Urban', 'Graffiti', 'AnimeStyle'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 49,
    description: 'Ilustración artística de Miles Morales con su icónica sudadera roja y traje negro, con trazos de graffiti y contraste amarillo eléctrico.'
  },
  {
    id: 'spiderman-ps4-art',
    title: 'Spider-Man Advanced Suit (Insomniac Art Edition)',
    subtitle: 'Diseño Salpicadura & Textura Óleo Cinematográfica',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/03a7036fdfcef43eeedce692adbcdba0-(1).webp',
    thumb: '/posters/optimized/thumb/03a7036fdfcef43eeedce692adbcdba0-(1).webp',
    tags: ['SpiderMan', 'Insomniac', 'PS5', 'Gaming', 'Art', 'Marvel'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 37,
    description: 'El traje Advanced con la araña blanca en un acabado artístico con textura de lienzo y salpicaduras de pintura roja y azul cobalto.'
  },
  {
    id: 'spiderman-spider-verse-assemble',
    title: 'Spider-Verse: All Spiders Assemble (Marvel Now!)',
    subtitle: 'Gwen Stacy, Spider-Ham, Spider-Man Noir & Spiders del Multiverso',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/origin-(3).webp',
    thumb: '/posters/optimized/thumb/origin-(3).webp',
    tags: ['SpiderVerse', 'SpiderGwen', 'SpiderManNoir', 'MarvelNow', 'Multiverse', 'Comic'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 43,
    description: 'Portada oficial de Marvel Now ilustrada por Olivier Coipel, reuniendo a Spider-Gwen, Miles Morales, Peter Parker y todo el ejército arácnido.'
  },
  {
    id: 'spiderman-classic-villains',
    title: 'The Amazing Spider-Man vs Green Goblin & Doc Ock',
    subtitle: 'Batalla Vertical Aérea en Manhattan',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/gwsyhwshsh-(1).webp',
    thumb: '/posters/optimized/thumb/gwsyhwshsh-(1).webp',
    tags: ['SpiderMan', 'GreenGoblin', 'DocOck', 'Vintage', 'ComicArt', 'Marvel'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 31,
    description: 'Dramática perspectiva aérea con Spider-Man balanceándose en picada entre los rascacielos mientras el Duende Verde y el Doctor Octopus atacan.'
  }
];
