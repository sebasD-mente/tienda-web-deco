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
  { id: 'SUPERHEROES', name: 'Superhéroes & Cómics', icon: 'Shield' },
  { id: 'ANIME', name: 'Anime & Manga', icon: 'Flame' },
  { id: 'CINE', name: 'Cine de Culto & Sci-Fi', icon: 'Film' },
  { id: 'MUSICA', name: 'Música & Portadas de Álbum', icon: 'Music' }
];

export const CATALOG_POSTERS = [
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
  {
    id: 'batman-dark-knight',
    title: 'The Dark Knight: Gotham Protector',
    subtitle: 'Edición Cinematográfica Noir',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['Batman', 'DC', 'Gotham', 'Comic', 'Hero'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 65,
    description: 'El caballero de la noche vigilando Gotham. Negros absolutos y alto rango dinámico gracias a la tecnología HP Látex.'
  },
  {
    id: 'miles-morales',
    title: 'Spider-Man: Across The Spider-Verse',
    subtitle: 'Arte Visual & Neón Multiverso',
    category: 'SUPERHEROES',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['Spiderman', 'Marvel', 'MilesMorales', 'Comic'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 48,
    description: 'Una explosión de color y dinamismo. Disponible en todos los tamaños oficiales.'
  },
  {
    id: 'attack-on-titan',
    title: 'Shingeki no Kyojin: Wings of Freedom',
    subtitle: 'El Retumbar & Cuerpo de Exploración',
    category: 'ANIME',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['AOT', 'Eren', 'Levi', 'Anime', 'Manga'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 39,
    description: 'El símbolo del Cuerpo de Exploración. Obra de coleccionista para fanáticos del anime de culto.'
  },
  {
    id: 'cyberpunk-edgerunners',
    title: 'Cyberpunk Edgerunners: Night City Neon',
    subtitle: 'Estética Retro-Futurista',
    category: 'ANIME',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['Cyberpunk', 'Edgerunners', 'Anime', 'Neon', 'SciFi'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 33,
    description: 'Colores eléctricos y atmósfera distópica de Night City en alta definición.'
  },
  {
    id: 'interstellar-gargantua',
    title: 'Interstellar: Gargantua Black Hole',
    subtitle: 'Obra Maestra de Christopher Nolan',
    category: 'CINE',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['Interstellar', 'Nolan', 'SciFi', 'Cinema', 'Space'],
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 57,
    description: 'La singularidad de Gargantua en una composición cósmica imponente para salas o habitaciones.'
  },
  {
    id: 'pink-floyd-prism',
    title: 'Pink Floyd: The Dark Side of the Moon',
    subtitle: 'Portada Vinilo Clásico Cuadrada 30x30 cm',
    category: 'MUSICA',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['PinkFloyd', 'Rock', 'Music', 'Vinyl', 'Prism'],
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 42,
    description: 'El prisma más famoso de la historia de la música, perfecto para el formato Portada de Álbum 30x30 cm.'
  },
  {
    id: 'daft-punk-helmets',
    title: 'Daft Punk: Random Access Memories',
    subtitle: 'El Dúo Robótico Francés',
    category: 'MUSICA',
    image: '/posters/optimized/full/wallpaper.webp',
    thumb: '/posters/optimized/thumb/wallpaper.webp',
    tags: ['DaftPunk', 'Electronic', 'Music', 'RAM', 'Vinyl'],
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 36,
    description: 'Elegancia robótica en madera MDF de 5.5mm con calidad de galería de arte.'
  }
];
