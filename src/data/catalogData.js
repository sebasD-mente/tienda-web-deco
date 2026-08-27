// Official 6 Sizes and Pricing Matrix (in Quetzales)
export const OFFICIAL_SIZES = [
  { id: 'MINI', name: 'Mini', dimensions: '14 x 21 cm', widthCm: 14, heightCm: 21, price: 25.00, badge: 'Ideal para coleccionar y escritorios' },
  { id: 'PEQUENO', name: 'Pequeño', dimensions: '21 x 27 cm', widthCm: 21, heightCm: 27, price: 35.00, badge: 'Espacios reducidos y cabeceras' },
  { id: 'PORTADA_ALBUM', name: 'Portada de Álbum', dimensions: '30 x 30 cm', widthCm: 30, heightCm: 30, price: 55.00, badge: 'Formato vinilo cuadrado para música' },
  { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', widthCm: 30, heightCm: 45, price: 65.00, badge: '⭐ El más vendido para habitaciones' },
  { id: 'GRANDE', name: 'Grande', dimensions: '45 x 60 cm', widthCm: 45, heightCm: 60, price: 125.00, badge: 'Protagonista para salas y oficinas' },
  { id: 'GIGANTE', name: 'Gigante', dimensions: '60 x 100 cm', widthCm: 60, heightCm: 100, price: 210.00, badge: 'Impacto visual monumental' }
];

export const CATEGORIES = [
  {
    "id": "TODOS",
    "name": "TODAS LAS OBRAS"
  },
  {
    "id": "AUTOS",
    "name": "AUTOS"
  },
  {
    "id": "SUPERHEROES",
    "name": "SUPER HEROES"
  },
  {
    "id": "ANIME",
    "name": "ANIME"
  },
  {
    "id": "MUSICA",
    "name": "MUSICA"
  },
  {
    "id": "SERIESYPELICULAS",
    "name": "SERIES Y PELICULAS"
  },
  {
    "id": "OBRASDEARTE",
    "name": "OBRAS DE ARTE"
  },
  {
    "id": "INFANTILYDIBUJOSANIMADOS",
    "name": "INFANTIL Y DIBUJOS ANIMADOS"
  }
];

export const ROOM_ENVIRONMENTS = [
  { id: 'LIVING', name: 'Sala de Estar', wallColor: '#1a1f2c', bgGradient: 'radial-gradient(circle at center, #242c3d 0%, #121620 100%)' },
  { id: 'GAMER', name: 'Setup Gamer', wallColor: '#0e1320', bgGradient: 'radial-gradient(circle at center, #1c1538 0%, #080a14 100%)' },
  { id: 'OFFICE', name: 'Oficina / Estudio', wallColor: '#202428', bgGradient: 'radial-gradient(circle at center, #2c3238 0%, #14171a 100%)' },
  { id: 'BEDROOM', name: 'Habitación', wallColor: '#161922', bgGradient: 'radial-gradient(circle at center, #222938 0%, #0d1017 100%)' }
];

export const CATALOG_POSTERS = [
  {
    "id": "van-gogh-2098",
    "title": "Van Gogh",
    "subtitle": "La Noche Estrellada",
    "category": "OBRASDEARTE",
    "franchise": null,
    "image": "/posters/uploads/full/van-gogh-2098.webp",
    "thumb": "/posters/uploads/thumb/van-gogh-2098.webp",
    "tags": [
      "OBRASDEARTE"
    ],
    "isFeatured": true,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster decorativo que reproduce \"La Noche Estrellada\", la célebre obra maestra postimpresionista de Vincent van Gogh. La impresión resalta por sus característicos cielos nocturnos arremolinados en intensos tonos azules y las estrellas resplandecientes en amarillo vibrante, contrastando con la silueta oscura del ciprés en primer plano y el apacible pueblo en el valle. Una pieza de arte hipnótica, expresiva y atemporal, perfecta para llenar de color y sofisticación cualquier ambiente."
  },
  {
    "id": "five-nights-at-freddy-s-0980",
    "title": "Five Nights at Freddy's",
    "subtitle": "Celebrate!",
    "category": "INFANTILYDIBUJOSANIMADOS",
    "franchise": null,
    "image": "/posters/uploads/full/five-nights-at-freddy-s-0980-0986.webp",
    "thumb": "/posters/uploads/thumb/five-nights-at-freddy-s-0980-0986.webp",
    "tags": [
      "INFANTILYDIBUJOSANIMADOS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "El famoso póster del exitoso videojuego de terror Five Nights at Freddy's. El diseño presenta a los icónicos animatrónicos originales sobre el escenario de la pizzería: Bonnie con su guitarra roja, Freddy Fazbear en el centro con su micrófono, y Chica con su inconfundible babero \"LET'S EAT!!!\". Coronado con la palabra \"CELEBRATE!\" en letras burbujeantes de estilo retro. Una pieza de culto, nostálgica y escalofriante, imprescindible para la colección de cualquier fan de la saga."
  },
  {
    "id": "la-mona-lisa-3306",
    "title": "La Mona Lisa",
    "subtitle": "Obra Maestra del Renacimiento",
    "category": "OBRASDEARTE",
    "franchise": null,
    "image": "/posters/uploads/full/la-mona-lisa-3306-3312.webp",
    "thumb": "/posters/uploads/thumb/la-mona-lisa-3306-3312.webp",
    "tags": [
      "OBRASDEARTE"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "4 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster decorativo que reproduce fielmente la pintura más famosa de la historia: La Gioconda de Leonardo da Vinci. La impresión captura con gran detalle la icónica y enigmática sonrisa de la modelo, así como la suave técnica del sfumato sobre el misterioso y sereno paisaje de fondo. Una pieza de arte clásico, atemporal y sofisticada, perfecta para quienes buscan aportar la elegancia de un museo a sus propios espacios."
  },
  {
    "id": "goku-0051",
    "title": "Goku",
    "subtitle": "Todas las Fases",
    "category": "ANIME",
    "franchise": "dragon-ball",
    "image": "/posters/uploads/full/goku-0051-0057.webp",
    "thumb": "/posters/uploads/thumb/goku-0051-0057.webp",
    "tags": [
      "ANIME"
    ],
    "isFeatured": true,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Un póster espectacular y definitivo para los verdaderos fans de Dragon Ball. Este dinámico diseño estilo collage ilustra la evolución completa de Goku, comenzando desde su estado base en la parte inferior hasta coronarse con el imponente Ultra Instinto en la cima. La composición recorre todas sus icónicas transformaciones (Super Saiyajin clásico, fase 3, Dios y Blue), destacando las vibrantes auras de energía de cada nivel sobre un profundo fondo cósmico y estelar. Una inyección de poder puro para cualquier espacio."
  },
  {
    "id": "jurassic-park-9462",
    "title": "Jurassic Park",
    "subtitle": "El Escape del T-Rex",
    "category": "SERIESYPELICULAS",
    "franchise": null,
    "image": "/posters/uploads/full/jurassic-park-9462-9468.webp",
    "thumb": "/posters/uploads/thumb/jurassic-park-9462-9468.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "3 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Impresionante póster cinematográfico que recrea la escena más tensa e icónica de Jurassic Park. La ilustración, dominada por dramáticos tonos fríos y lluvia, captura el momento exacto en que el imponente T-Rex escapa del cerco eléctrico junto al vehículo volcado, contrastando espectacularmente con el rojo intenso de la bengala. Acompañado del clásico eslogan \"An Adventure 65 Million Years In The Making\" y los créditos originales de la película en la base, es una pieza de arte llena de suspenso indispensable para cualquier coleccionista del cine de los 90."
  },
  {
    "id": "jurassic-park-8621",
    "title": "Jurassic Park",
    "subtitle": "Póster Ilustrado de Colección",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/jurassic-park-8621-8629.webp",
    "thumb": "/posters/uploads/thumb/jurassic-park-8621-8629.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "6 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "PORTADA_ALBUM",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Espectacular póster ilustrado estilo collage que rinde tributo al gran clásico del cine Jurassic Park. El diseño rebosa de detalles nostálgicos, destacando al imponente T-Rex, los velociraptores y los icónicos vehículos de exploración de la Isla Nublar. Alrededor del inconfundible logo central se agrupan los personajes principales como Alan Grant, Ellie Sattler, Ian Malcolm sosteniendo una bengala y John Hammond presenciando el nacimiento de un dinosaurio. Una pieza de arte vibrante y detallada, perfecta para cualquier fanático de la cultura pop y la era jurásica."
  },
  {
    "id": "indiana-jones-6555",
    "title": "Indiana Jones",
    "subtitle": "Indiana Jones y la Última Cruzada",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/indiana-jones-6555-6562.webp",
    "thumb": "/posters/uploads/thumb/indiana-jones-6555-6562.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "4 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Un impresionante póster de arte ilustrado pintado a mano para \"Indiana Jones y la Última Cruzada\". Este diseño de \"bóveda\" detallado presenta retratos dinámicos de Harrison Ford como Indy y Sean Connery como su padre, el Dr. Henry Jones, Sr., en el centro. El marco de piedra que lo rodea incluye a Sallah, Marcus Brody, Elsa Schneider y Walter Donovan. En la parte inferior, una escena de acción ilustrada muestra la emocionante persecución en el desierto. El logotipo icónico de la película está en la base. Una pieza de colección esencial."
  },
  {
    "id": "indiana-jones-5273",
    "title": "Indiana Jones",
    "subtitle": "Indiana Jones y el Arca Perdida",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/indiana-jones-5273-5282.webp",
    "thumb": "/posters/uploads/thumb/indiana-jones-5273-5282.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "4 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Un impresionante póster de arte de película clásico de En busca del arca perdida (Raiders of the Lost Ark). Este diseño ilustrado detallado presenta a Indiana Jones en el centro con su látigo, flanqueado por viñetas de villanos nazis, personajes clave como Marion Ravenwood, y el Arca de la Alianza de oro sobre un fondo de jeroglíficos antiguos. Un tributo retro esencial a la aventura definitiva."
  },
  {
    "id": "el-se-or-de-los-anillos-5503",
    "title": "El Señor de los Anillos",
    "subtitle": "La Comunidad del Anillo",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/el-se-or-de-los-anillos-5503-5510.webp",
    "thumb": "/posters/uploads/thumb/el-se-or-de-los-anillos-5503-5510.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "4 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster cinematográfico clásico de la aclamada película \"La Comunidad del Anillo\". Un majestuoso diseño tipo collage que destaca a Frodo en el centro, con sutiles inscripciones del Anillo Único sobre su capa, rodeado por Gandalf, Aragorn y el resto de los protagonistas. En la base, los temibles Nazgûl cabalgan entre la niebla sobre el clásico logo dorado de la saga. Con una cálida paleta de tonos tierra, es una pieza épica imprescindible para la colección de cualquier fan del universo de Tolkien."
  },
  {
    "id": "breaking-bad-3656",
    "title": "Breaking Bad",
    "subtitle": "Química Perfecta",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/breaking-bad-3656-3661.webp",
    "thumb": "/posters/uploads/thumb/breaking-bad-3656-3661.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": true,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Espectacular póster ilustrado estilo collage que rinde homenaje a la aclamada serie. El diseño reúne a los personajes principales (Walter, Jesse, Hank, Skyler, Saul y Mike) junto al clásico logo \"Br Ba\" y la icónica casa rodante en el desierto. Coronada con la frase \"It was all in the chemistry\", esta es una pieza narrativa y de estética cinematográfica, ideal para los verdaderos coleccionistas y seguidores del universo de Heisenberg."
  },
  {
    "id": "breaking-bad-3918",
    "title": "Breaking Bad",
    "subtitle": "Descanso en Traje Hazmat",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/breaking-bad-3918-3925.webp",
    "thumb": "/posters/uploads/thumb/breaking-bad-3918-3925.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Un póster irreverente y con mucho estilo que muestra a Walter White y Jesse Pinkman en un merecido descanso. Vestidos con sus icónicos trajes protectores amarillos y las máscaras de gas con filtros rosas sobre la cabeza, ambos personajes aparecen sentados en el sofá disfrutando de unas cervezas, snacks y humo. Una pieza con un toque de humor, contraste surrealista y colores vibrantes, perfecta para darle personalidad a la pared de cualquier fanático de la serie."
  },
  {
    "id": "el-padrino-4985",
    "title": "El Padrino",
    "subtitle": "Linaje Corleone",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/el-padrino-4985-4989.webp",
    "thumb": "/posters/uploads/thumb/el-padrino-4985-4989.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster de colección de El Padrino que reune a la familia Corleone bajo un imponente diseño de arte premium con espectaculares salpicaduras de oro sobre fondo negro. El retrato de Vito (Marlon Brando) domina la parte superior, con Michael (Al Pacino) central y sentado, rodeados por Sonny, Tom Hagen y Connie, junto con detalles icónicos como la rosa roja y un auto clásico. Una pieza de prestigio y elegancia indispensable para cualquier fan de la saga."
  },
  {
    "id": "el-padrino-9715",
    "title": "El Padrino",
    "subtitle": "Clásico Don Vito Corleone",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/el-padrino-9715-9718.webp",
    "thumb": "/posters/uploads/thumb/el-padrino-9715-9718.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster de la aclamada obra maestra del cine, \"El Padrino\" (The Godfather). Presenta el icónico retrato de Marlon Brando como Don Vito Corleone, luciendo su elegante esmoquin y su distintiva rosa roja bajo una iluminación dramática. En la base destaca el legendario logo dorado de la película con los hilos de marioneta. Una pieza cinematográfica vintage y elegante, imprescindible en la pared de cualquier cinéfilo."
  },
  {
    "id": "pablo-escobar-0509",
    "title": "Pablo Escobar",
    "subtitle": "Sneakerhead",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/pablo-escobar-0509-0511.webp",
    "thumb": "/posters/uploads/thumb/pablo-escobar-0509-0511.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "4 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Llamativo póster en blanco y negro que fusiona la cultura pop con el estilo urbano (streetwear). La imagen presenta un retrato surrealista e irreverente de Pablo Escobar sosteniendo en alto una clásica caja negra de Nike con una zapatilla estilo Air Jordan 1 desgastada sobre ella. Una pieza de arte alternativa y con estética callejera, ideal para darle un toque único y moderno a cualquier habitación."
  },
  {
    "id": "pablo-escobar-0031",
    "title": "Pablo Escobar",
    "subtitle": "Sonrisa Histórica",
    "category": "SERIESYPELICULAS",
    "image": "/posters/uploads/full/pablo-escobar-0031-0034.webp",
    "thumb": "/posters/uploads/thumb/pablo-escobar-0031-0034.webp",
    "tags": [
      "SERIESYPELICULAS"
    ],
    "isFeatured": true,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Póster en blanco y negro que reproduce la célebre fotografía policial de Pablo Escobar. La imagen captura su icónica e inusual sonrisa mientras sostiene la placa original de la \"Cárcel Dtto. Judicial Medellín\" con el número de registro 128482. Una pieza de estética documental e histórica, perfecta para decoraciones de estilo urbano o para los seguidores de la cultura pop y el género true crime."
  },
  {
    "id": "iron-man-7158",
    "title": "Iron Man",
    "subtitle": "Héroe en Batalla (Estilo Cómic)",
    "category": "SUPERHEROES",
    "image": "/posters/uploads/full/iron-man-7158-7162.webp",
    "thumb": "/posters/uploads/thumb/iron-man-7158-7162.webp",
    "tags": [
      "SUPERHEROES"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Espectacular póster de Iron Man con un clásico arte estilo cómic. La ilustración captura a Tony Stark en plena acción, emergiendo entre humo y escombros de una zona de guerra. Su armadura roja y dorada presenta detalles realistas de daño de batalla, mientras apunta hacia el frente con su repulsor brillando intensamente. Una pieza dinámica y llena de energía, perfecta para los amantes de la acción gráfica de Marvel.",
    "franchise": "marvel"
  },
  {
    "id": "iron-man-2438",
    "title": "Iron Man",
    "subtitle": "La Obra de Arte de Stark",
    "category": "SUPERHEROES",
    "image": "/posters/uploads/full/iron-man-2438-2440.webp",
    "thumb": "/posters/uploads/thumb/iron-man-2438-2440.webp",
    "tags": [
      "SUPERHEROES"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Esta es la pieza definitiva para la colección de cualquier verdadero fan de Stark Industries. Este póster reproduce fielmente el icónico diseño de arte pop que aparece en la película \"Iron Man 2\". En la escena, Tony Stark, al verlo, se refiere a él como una \"obra de arte\" y decide colgarlo en su taller, retirando un cuadro tradicional. El diseño utiliza una paleta de colores de estilo retro (crema, rojo apagado y azul grisáceo) y líneas gráficas limpias, con el casco de Iron Man en primer plano y el texto \"IRON MAN\" en letras grandes y mayúsculas en la base. Perfecta para cualquier fan de la tecnología Stark.",
    "franchise": "marvel"
  },
  {
    "id": "iron-man-0231",
    "title": "Iron Man",
    "subtitle": "Geometría de Poder",
    "category": "SUPERHEROES",
    "image": "/posters/uploads/full/iron-man-0231-0234.webp",
    "thumb": "/posters/uploads/thumb/iron-man-0231-0234.webp",
    "tags": [
      "SUPERHEROES"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Impactante primer plano de Iron Man en un estilo de arte poligonal y geométrico de facetas. Construido a partir de cientos de formas triangulares de colores rojos y dorados vibrantes, con ojos azules cian brillantes. El fondo es un degradado burdeos profundo. Este póster captura la esencia del héroe con un toque minimalista e imponente, ideal para coleccionistas modernos.",
    "franchise": "marvel"
  },
  {
    "id": "iron-man-7668",
    "title": "Iron Man",
    "subtitle": "Resplandor del  Arc",
    "category": "SUPERHEROES",
    "image": "/posters/uploads/full/iron-man-7668-7673.webp",
    "thumb": "/posters/uploads/thumb/iron-man-7668-7673.webp",
    "tags": [
      "SUPERHEROES"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 25,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Impactante póster vertical de Iron Man con su armadura Mark VII. Presenta el icónico Reactor Arc circular y las ópticas de los ojos intensamente iluminados en azul brillante, contrastando con la armadura roja metálica y un fondo de esquemas tecnológicos oscuros. Una pieza poderosa para cualquier fan."
  },
  {
    "id": "porsche-gt3",
    "title": "Porsche 911 GT3 RS Patente Técnica",
    "subtitle": "Blueprint Automotriz Motorsport",
    "category": "AUTOS",
    "image": "/posters/optimized/full/porche-gt3-patente.webp",
    "thumb": "/posters/optimized/thumb/porche-gt3-patente.webp",
    "tags": [
      "Porsche",
      "GT3",
      "Motorsport",
      "Blueprint",
      "Alemania"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 38,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Diagrama técnico esquemático del icónico Porsche 911 GT3 RS. Impresión de alta definición con detalles milimétricos sobre base rígida de MDF 5.5mm."
  },
  {
    "id": "skyline-r34",
    "title": "Nissan Skyline GT-R R34 Patente Técnica",
    "subtitle": "Leyenda JDM Godzilla",
    "category": "AUTOS",
    "image": "/posters/optimized/full/skyline-patente.webp",
    "thumb": "/posters/optimized/thumb/skyline-patente.webp",
    "tags": [
      "Nissan",
      "Skyline",
      "R34",
      "JDM",
      "Godzilla"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 52,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "El rey absoluto de la cultura JDM. Esquema técnico patentado del Nissan Skyline R34 V-Spec, montado en soporte de madera listo para colgar."
  },
  {
    "id": "toyota-supra",
    "title": "Toyota Supra MK4 2JZ Patente Técnica",
    "subtitle": "El Rey del 2JZ Twin Turbo",
    "category": "AUTOS",
    "image": "/posters/optimized/full/toyota-supra-patente.webp",
    "thumb": "/posters/optimized/thumb/toyota-supra-patente.webp",
    "tags": [
      "Toyota",
      "Supra",
      "MK4",
      "2JZ",
      "JDM"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 44,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "La leyenda de las pistas y los cuartos de milla. Esquema de patente del motor y chasis del legendario Toyota Supra MK4."
  },
  {
    "id": "delorean-dmc12",
    "title": "DeLorean DMC-12 Time Machine Patente",
    "subtitle": "Volver al Futuro & Cultura Ochentera",
    "category": "AUTOS",
    "image": "/posters/optimized/full/delorean-dmc-12-patente.webp",
    "thumb": "/posters/optimized/thumb/delorean-dmc-12-patente.webp",
    "tags": [
      "Delorean",
      "DMC12",
      "BackToTheFuture",
      "SciFi",
      "Vintage"
    ],
    "isFeatured": false,
    "rating": 4.8,
    "reviewsCount": 29,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "El condensador de flujo y el diseño técnico del auto más icónico del cine de ciencia ficción de los 80s."
  },
  {
    "id": "bmw-m5",
    "title": "BMW M5 Patente Técnica",
    "subtitle": "Sedán Deportivo Alemán de Alta Potencia",
    "category": "AUTOS",
    "image": "/posters/optimized/full/bmw-m5-patente.webp",
    "thumb": "/posters/optimized/thumb/bmw-m5-patente.webp",
    "tags": [
      "BMW",
      "M5",
      "Motorsport",
      "Alemania",
      "Blueprint"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 28,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Blueprint detallado del BMW M5. Ingeniería de alto rendimiento plasamada en una patente técnica sobre madera MDF de 5.5mm."
  },
  {
    "id": "honda-civic-type-r",
    "title": "Honda Civic Type R Patente Técnica",
    "subtitle": "Hot Hatch Legendario VTEC",
    "category": "AUTOS",
    "image": "/posters/optimized/full/honda-civic-type-r-patente.webp",
    "thumb": "/posters/optimized/thumb/honda-civic-type-r-patente.webp",
    "tags": [
      "Honda",
      "Civic",
      "TypeR",
      "VTEC",
      "JDM"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 31,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Esquema técnico del rey de la tracción delantera. Diseño minucioso de motor y aerodinámica del Civic Type R."
  },
  {
    "id": "mazda-mx5",
    "title": "Mazda MX-5 Miata Patente Técnica",
    "subtitle": "El Roadster Más Vendido del Mundo",
    "category": "AUTOS",
    "image": "/posters/optimized/full/mazda-mx5-patente.webp",
    "thumb": "/posters/optimized/thumb/mazda-mx5-patente.webp",
    "tags": [
      "Mazda",
      "MX5",
      "Miata",
      "Roadster",
      "JDM"
    ],
    "isFeatured": false,
    "rating": 4.8,
    "reviewsCount": 25,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Plano esquemático del icónico Miata. Distribución de peso perfecta 50/50 y chasis ligero."
  },
  {
    "id": "mercedez-amg",
    "title": "Mercedes-AMG GT Patente Técnica",
    "subtitle": "Superdeportivo V8 Biturbo de Affalterbach",
    "category": "AUTOS",
    "image": "/posters/optimized/full/mercedez-amg-patente.webp",
    "thumb": "/posters/optimized/thumb/mercedez-amg-patente.webp",
    "tags": [
      "Mercedes",
      "AMG",
      "V8",
      "Affalterbach",
      "Supercar"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 36,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Elegancia y poder descomunal. Blueprint de la patente técnica del Mercedes-AMG GT."
  },
  {
    "id": "subaru-impreza",
    "title": "Subaru Impreza WRC Patente Técnica",
    "subtitle": "Tracción Total Symmetrical AWD Boxer",
    "category": "AUTOS",
    "image": "/posters/optimized/full/subaru-impreza-patente.webp",
    "thumb": "/posters/optimized/thumb/subaru-impreza-patente.webp",
    "tags": [
      "Subaru",
      "Impreza",
      "WRC",
      "Boxer",
      "Rally"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 34,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "La leyenda de las etapas de rally mundial. Diagrama técnico del Subaru Impreza AWD."
  },
  {
    "id": "toyota-prado",
    "title": "Toyota Land Cruiser Prado Patente Técnica",
    "subtitle": "El Conquistador Todo Terreno 4WD",
    "category": "AUTOS",
    "image": "/posters/optimized/full/toyota-prado-patente.webp",
    "thumb": "/posters/optimized/thumb/toyota-prado-patente.webp",
    "tags": [
      "Toyota",
      "Prado",
      "LandCruiser",
      "4x4",
      "OffRoad"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 30,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "Robusto, indestructible y sofisticado. Esquema técnico patentado del Toyota Prado 4x4."
  },
  {
    "id": "toyota-sr5",
    "title": "Toyota Hilux SR5 Patente Técnica",
    "subtitle": "El Todoterreno Clásico Legendario",
    "category": "AUTOS",
    "image": "/posters/optimized/full/toyota-sr5-patente.webp",
    "thumb": "/posters/optimized/thumb/toyota-sr5-patente.webp",
    "tags": [
      "Toyota",
      "SR5",
      "Hilux",
      "PickUp",
      "Vintage"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 42,
    "sizeBadge": "45 x 60 cm",
    "availableSizes": [
      "GRANDE"
    ],
    "priceDisplay": "Q 125.00",
    "description": "La camioneta 4x4 más icónica de los años 80 y 90. Plano técnico detallado de suspensión y chasis."
  },
  {
    "id": "spiderman-amazing-fantasy-15",
    "title": "Amazing Fantasy #15 Debut 1962",
    "subtitle": "Primera Aparición Histórica de Spider-Man",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/6326644814-(3).webp",
    "thumb": "/posters/optimized/thumb/6326644814-(3).webp",
    "tags": [
      "Spider-Man",
      "Marvel",
      "AmazingFantasy",
      "StanLee",
      "VintageComic"
    ],
    "isFeatured": true,
    "rating": 5,
    "reviewsCount": 64,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "La portada de cómic más codiciada del mundo. El debut original de Spider-Man creado por Stan Lee y Steve Ditko en 1962."
  },
  {
    "id": "spiderman-316-venom",
    "title": "The Amazing Spider-Man #316 Venom Debut",
    "subtitle": "Todd McFarlane Clásico de 1989",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/origin-(3).webp",
    "thumb": "/posters/optimized/thumb/origin-(3).webp",
    "tags": [
      "Spider-Man",
      "Venom",
      "ToddMcFarlane",
      "Marvel",
      "CoverArt"
    ],
    "isFeatured": true,
    "rating": 4.9,
    "reviewsCount": 47,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "La legendaria portada de Todd McFarlane donde Venom regresa triunfal. Impresión de alto gramaje con colores retro saturados."
  },
  {
    "id": "spiderman-no-way-home",
    "title": "Spider-Man: No Way Home Trío Épico",
    "subtitle": "Tobey, Andrew y Tom vs Doc Ock",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/whatsapp-image-2022-12-13-at-5.15.33-pm.webp",
    "thumb": "/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.15.33-pm.webp",
    "tags": [
      "SpiderMan",
      "NoWayHome",
      "Multiverso",
      "Marvel",
      "Cinema"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 58,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "El encuentro cinematográfico más grande del multiverso arácnido. Póster cinematográfico con acabado de alta definición."
  },
  {
    "id": "spiderman-miles-morales-hoodie",
    "title": "Miles Morales: Into The Spider-Verse",
    "subtitle": "Estilo Urbano con Capucha Roja",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/03a7036fdfcef43eeedce692adbcdba0-(1).webp",
    "thumb": "/posters/optimized/thumb/03a7036fdfcef43eeedce692adbcdba0-(1).webp",
    "tags": [
      "MilesMorales",
      "SpiderVerse",
      "Brooklyn",
      "Sony",
      "Art"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 39,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "El arte conceptual urbano de Miles Morales en su icónico traje con sudadera roja y zapatillas Nike Chicago."
  },
  {
    "id": "spiderman-insomniac-advanced-suit",
    "title": "Spider-Man Advanced Suit PS5",
    "subtitle": "Arte Óleo con Araña Blanca",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/e8yxpkzvgaqvyyp-(3).webp",
    "thumb": "/posters/optimized/thumb/e8yxpkzvgaqvyyp-(3).webp",
    "tags": [
      "SpiderMan",
      "Insomniac",
      "PS5",
      "Gaming",
      "Art"
    ],
    "isFeatured": false,
    "rating": 4.9,
    "reviewsCount": 34,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Ilustración artística de estilo óleo y textura de pintura del Spider-Man de Insomniac Games con la emblemática araña blanca."
  },
  {
    "id": "spiderman-spider-verse-all-spiders",
    "title": "Spider-Verse: All Spiders Assemble",
    "subtitle": "Portada Marvel Now Comics",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/gwsyhwshsh-(1).webp",
    "thumb": "/posters/optimized/thumb/gwsyhwshsh-(1).webp",
    "tags": [
      "SpiderVerse",
      "MarvelComics",
      "SpiderGwen",
      "SpiderNoir",
      "AllSpiders"
    ],
    "isFeatured": false,
    "rating": 5,
    "reviewsCount": 42,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Todas las variantes del Spider-Verse en una sola ilustración coral de combate interdimensional."
  },
  {
    "id": "spiderman-green-goblin-battle",
    "title": "Spider-Man vs Duende Verde & Doc Ock",
    "subtitle": "Batalla Épica en Manhattan",
    "category": "SUPERHEROES",
    "image": "/posters/optimized/full/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp",
    "thumb": "/posters/optimized/thumb/whatsapp-image-2022-12-13-at-5.17.42-pm-(1).webp",
    "tags": [
      "SpiderMan",
      "GreenGoblin",
      "DocOck",
      "Villains",
      "Marvel"
    ],
    "isFeatured": false,
    "rating": 4.8,
    "reviewsCount": 29,
    "sizeBadge": "5 Tamaños",
    "availableSizes": [
      "MINI",
      "PEQUENO",
      "MEDIANO",
      "GRANDE",
      "GIGANTE"
    ],
    "priceDisplay": "Desde Q 25.00",
    "description": "Batalla aérea sobre los rascacielos de Nueva York entre Spider-Man y sus más grandes archienemigos."
  }
];

export const INITIAL_FRANCHISES = [
  {
    "id": "dragon-ball",
    "name": "Dragon Ball",
    "img": "/franchises/dragon-ball.webp",
    "category": "ANIME"
  },
  {
    "id": "disney",
    "name": "Walt Disney",
    "img": "/franchises/disney.webp",
    "category": "CINE"
  },
  {
    "id": "nba",
    "name": "NBA",
    "img": "/franchises/nba.webp",
    "category": "AUTOS"
  },
  {
    "id": "back-to-future",
    "name": "Back to the Future",
    "img": "/franchises/back-to-future.webp",
    "category": "AUTOS"
  },
  {
    "id": "dc",
    "name": "DC Comics",
    "img": "/franchises/dc.webp",
    "category": "SUPERHEROES"
  },
  {
    "id": "star-wars",
    "name": "Star Wars",
    "img": "/franchises/star-wars.webp",
    "category": "CINE"
  },
  {
    "id": "marvel",
    "name": "MARVEL",
    "img": "/franchises/marvel.webp"
  }
];

export const STORE_SETTINGS = {
  "whatsappPhone": "50238375078",
  "updatedAt": "2026-08-27T14:50:43.127Z"
};
