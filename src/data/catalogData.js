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
    description: 'El condensador de flujo y el diseño técnico del auto más icónico del cine de ciencia ficción de los 80s.'
  },
  {
    id: 'audi-r8',
    title: 'Audi R8 V10 Performance Patente Técnica',
    subtitle: 'Superdeportivo Alemán V10',
    category: 'AUTOS',
    image: '/posters/optimized/full/audi-r8-patente.webp',
    thumb: '/posters/optimized/thumb/audi-r8-patente.webp',
    tags: ['Audi', 'R8', 'V10', 'Supercar', 'Blueprint'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 21,
    description: 'Ingeniería alemana de competición llevada a la calle. Blueprint del chasis y motor V10 atmosférico del Audi R8.'
  },
  {
    id: 'bmw-m3-e30',
    title: 'BMW M3 E30 DTM Patente Técnica',
    subtitle: 'Clásico Touring Alemán',
    category: 'AUTOS',
    image: '/posters/optimized/full/bmw-m3-e30-patente.webp',
    thumb: '/posters/optimized/thumb/bmw-m3-e30-patente.webp',
    tags: ['BMW', 'M3', 'E30', 'DTM', 'Vintage'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 33,
    description: 'El deportivo touring más laureado de todos los tiempos. Patente técnica del mítico BMW M3 E30.'
  },
  {
    id: 'mustang-1967',
    title: 'Ford Mustang Fastback 1967 Patente Técnica',
    subtitle: 'Muscle Car Americano Legendario',
    category: 'AUTOS',
    image: '/posters/optimized/full/mustang-1967-patente.webp',
    thumb: '/posters/optimized/thumb/mustang-1967-patente.webp',
    tags: ['Ford', 'Mustang', 'MuscleCar', '1967', 'Vintage'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 27,
    description: 'El rugido del V8 inmortalizado en un plano esquemático de colección. Ideal para talleres, oficinas y amantes del motor clásico.'
  },
  {
    id: 'mazda-rx7',
    title: 'Mazda RX-7 FD3S Motor Rotativo Patente',
    subtitle: 'El Alma del Motor Wankel 13B',
    category: 'AUTOS',
    image: '/posters/optimized/full/mazda-rx7-patente.webp',
    thumb: '/posters/optimized/thumb/mazda-rx7-patente.webp',
    tags: ['Mazda', 'RX7', 'Wankel', 'Rotary', 'JDM'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 41,
    description: 'El diseño técnico del revolucionario motor rotativo Wankel 13B y las líneas aerodinámicas del RX-7 FD3S.'
  },
  {
    id: 'lancer-evo-9',
    title: 'Mitsubishi Lancer Evolution IX Patente Técnica',
    subtitle: 'Leyenda del Rally Mundial WRC',
    category: 'AUTOS',
    image: '/posters/optimized/full/evo-9-patente.webp',
    thumb: '/posters/optimized/thumb/evo-9-patente.webp',
    tags: ['Mitsubishi', 'Evo9', '4G63', 'Rally', 'JDM'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 26,
    description: 'Tracción total y motor 4G63 turbo. Patente esquemática del mítico Mitsubishi Lancer Evolution IX de rally.'
  },
  {
    id: 'ferrari-f40',
    title: 'Ferrari F40 Twin Turbo Patente Técnica',
    subtitle: 'La Última Obra Maestra de Enzo Ferrari',
    category: 'AUTOS',
    image: '/posters/optimized/full/ferrari-f40-patente.webp',
    thumb: '/posters/optimized/thumb/ferrari-f40-patente.webp',
    tags: ['Ferrari', 'F40', 'Supercar', 'Italia', 'Blueprint'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 49,
    description: 'El superdeportivo más puro de la historia con carrocería de kevlar y motor V8 biturbo. Un tributo digno para cualquier pared.'
  },
  {
    id: 'subaru-wrx-sti',
    title: 'Subaru Impreza WRX STI 22B Patente',
    subtitle: 'El Ícono Azul de Colin McRae',
    category: 'AUTOS',
    image: '/posters/optimized/full/subaru-wrx-22b-patente.webp',
    thumb: '/posters/optimized/thumb/subaru-wrx-22b-patente.webp',
    tags: ['Subaru', 'WRX', 'STI', '22B', 'Boxer'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 31,
    description: 'Plano técnico del motor Boxer Turbo y la suspensión del mítico 22B STi campeón del WRC.'
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. COLECCIÓN SUPER HÉROES & MARVEL CÓMICS
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
    description: 'Batalla aérea sobre los rascacielos de Nueva York entre Spider-Man y sus más grandes archienemigos.'
  }
];
