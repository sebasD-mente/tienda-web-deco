import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoreKnowledge } from '../data/storeKnowledge';
import { getStoredPosters, getStoredCategories, getStoredFranchises } from './catalogStorage';

const API_KEY_STORAGE_KEY = 'deco_gemini_api_key_v1';

export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) return envKey.trim();
  try {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
  } catch (e) {
    // Ignore storage error
  }
  return '';
}

export function saveGeminiApiKey(apiKey) {
  try {
    if (!apiKey) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    }
    return true;
  } catch (e) {
    console.error('Failed to save API key:', e);
    return false;
  }
}

// Tool / Function declarations for Gemini Function Calling
const JARVIS_TOOL_DECLARATIONS = [
  {
    name: 'search_catalog',
    description: 'Busca obras, pósters y cuadros en el catálogo en vivo de Deco Vintage según términos, categorías, personajes, vehículos o temas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Término de búsqueda, personaje, franquicia o descripción (ej: Porsche, Batman, Dragon Ball, Anime, Cine, Autos)'
        },
        category: {
          type: 'STRING',
          description: 'Categoría opcional (ej: autos, anime, geek, cine, musica)'
        },
        maxResults: {
          type: 'NUMBER',
          description: 'Número máximo de obras a devolver (por defecto 4)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'add_to_cart',
    description: 'Añade una obra del catálogo al carrito de compras del cliente con el tamaño y cantidad seleccionada.',
    parameters: {
      type: 'OBJECT',
      properties: {
        posterId: {
          type: 'STRING',
          description: 'ID de la obra a agregar (ej: auto-1, anime-1) o título aproximado'
        },
        sizeId: {
          type: 'STRING',
          description: 'ID o nombre del tamaño elegido: mini, small, album, medium, large, giant',
          enum: ['mini', 'small', 'album', 'medium', 'large', 'giant']
        },
        quantity: {
          type: 'NUMBER',
          description: 'Cantidad de unidades (por defecto 1)'
        }
      },
      required: ['posterId', 'sizeId']
    }
  },
  {
    name: 'quote_custom_poster',
    description: 'Calcula la cotización exacta en Quetzales para un cuadro de medida personalizada en madera MDF 5.5mm, PVC 5mm o Vinil.',
    parameters: {
      type: 'OBJECT',
      properties: {
        widthCm: {
          type: 'NUMBER',
          description: 'Ancho en centímetros'
        },
        heightCm: {
          type: 'NUMBER',
          description: 'Alto en centímetros'
        },
        material: {
          type: 'STRING',
          description: 'Material deseado: mdf, pvc, vinil',
          enum: ['mdf', 'pvc', 'vinil']
        }
      },
      required: ['widthCm', 'heightCm']
    }
  },
  {
    name: 'generate_whatsapp_order',
    description: 'Prepara el pedido con el cálculo del 50% de anticipo y genera el mensaje de WhatsApp estructurado para el vendedor.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: {
          type: 'STRING',
          description: 'Nombre del cliente'
        },
        customerPhone: {
          type: 'STRING',
          description: 'Teléfono o WhatsApp del cliente (opcional)'
        },
        customNotes: {
          type: 'STRING',
          description: 'Resumen detallado de las obras, medidas y acabados pedidos'
        }
      },
      required: ['customNotes']
    }
  },
  {
    name: 'navigate_store',
    description: 'Navega a una sección específica de la tienda web Deco Vintage.',
    parameters: {
      type: 'OBJECT',
      properties: {
        section: {
          type: 'STRING',
          description: 'Sección de destino: catalogo, colecciones, personalizados, sobre_posters, carrito',
          enum: ['catalogo', 'colecciones', 'personalizados', 'sobre_posters', 'carrito']
        },
        filter: {
          type: 'STRING',
          description: 'Filtro de categoría o franquicia (opcional)'
        }
      },
      required: ['section']
    }
  }
];

export async function askJarvis({
  userMessage,
  conversationHistory = [],
  cart = [],
  onExecuteTool = null
}) {
  const cleanInput = (userMessage || '').trim();
  const apiKey = getGeminiApiKey();
  const knowledge = getStoreKnowledge();
  const posters = getStoredPosters();
  const categories = getStoredCategories();
  const franchises = getStoredFranchises();
  const catalog = { posters, categories, franchises };

  // If message is very short or simple greeting/keyword, handle with hyper-fast local intelligence
  if (cleanInput.length <= 2 || isSimpleGreetingOrKeyword(cleanInput)) {
    return handleLocalIntelligentFallback(cleanInput, knowledge, catalog, cart);
  }

  // Summary of available posters for LLM indexing
  const catalogSummary = (catalog.posters || []).slice(0, 50).map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    franchise: p.franchise || 'General',
    bestSeller: !!p.isBestSeller,
    price: p.priceDisplay || 'Desde Q 25.00'
  }));

  // Build high-context tactical system instructions
  const systemInstruction = `
Eres J.A.R.V.I.S., el Asistente Táctico y de Inteligencia Artificial Comercial de "Deco Vintage Guate" (Guatemala).
Tu personalidad es educada, sumamente eficiente, proactiva, elegante y enfocada en ayudar a los clientes a elegir los mejores cuadros decorativos rígidos para sus espacios (habitaciones, oficinas, salas de juegos, negocios).

DIRECTIVAS ACTIVAS DEL DUEÑO:
${(knowledge.ownerDirectives || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}

INFORMACIÓN CLAVE DEL NEGOCIO:
- Empresa: Deco Vintage Guate (Guatemala).
- Teléfono / WhatsApp de atención: 5998-0504.
- Especialidad: Fabricación de cuadros decorativos rígidos sobre madera MDF de 5.5 mm de espesor y PVC espumado impermeable.
- Impresión: Tintas ecológicas HP Látex de alta definición fotográfica, resistente a decoloración y sin olores.
- Instalación: Todos los cuadros incluyen cinta industrial de doble cara marca Tessa en el dorso para montaje rápido sin clavos ni agujeros.
- Cobertura: Envíos a todo el territorio nacional de Guatemala (los 22 departamentos).
- Tiempos de entrega: 2 a 4 días hábiles.
- POLÍTICA DE PAGO OBLIGATORIA: 50% de anticipo para iniciar producción y el 50% restante contra entrega o previo a despacho.

COLECCIONES DISPONIBLES ACTUALMENTE EN CATÁLOGO:
1. 🏎️ **AUTOS DEPORTIVOS (11 obras):** Porsche 911 GT3 RS, Nissan Skyline GT-R R34, Toyota Supra MK4, DeLorean DMC-12, BMW M5, Honda Civic Type R, Mazda Miata MX-5, Mercedes-AMG GT, Subaru Impreza WRC, Toyota Land Cruiser Prado, Toyota Hilux SR5.
2. 🦸 **SUPERHÉROES (11 obras):** Spider-Man (7 diseños: Amazing Fantasy #15, Venom #316, No Way Home, Miles Morales, PS5 Advanced Suit, Spider-Verse Assemble, Green Goblin Battle) e Iron Man (4 diseños: Héroe en Batalla, Obra de Arte Stark, Geometría de Poder, Resplandor Arc).
3. 🎬 **SERIES Y PELÍCULAS (10 obras):** Jurassic Park, Indiana Jones (Última Cruzada y Arca Perdida), El Señor de los Anillos, Breaking Bad (Química Perfecta y Traje Hazmat), El Padrino (Don Vito y Linaje Corleone), Pablo Escobar (Sneakerhead y Sonrisa Histórica).
4. 🎨 **CUADROS PERSONALIZADOS:** Si el cliente pregunta por Anime (Dragon Ball, Naruto, etc.), videojuegos o sus propias fotos familiares, indícale amablemente que podemos fabricarle CUALQUIER imagen que desee en MDF 5.5mm o PVC 5mm.

MATRIZ OFICIAL DE 6 TAMAÑOS Y PRECIOS:
1. Mini (14 x 21 cm) ➔ Q 25.00 (Espacios reducidos, escritorios)
2. Pequeño (21 x 27 cm) ➔ Q 35.00 (Entradas, repisas)
3. Portada Álbum (30 x 30 cm) ➔ Q 55.00 (Formato vinilo cuadrado para música)
4. Mediano (30 x 45 cm) ➔ Q 65.00 (EL MÁS VENDIDO / Tamaño estrella de cabecera o pared)
5. Grande (45 x 60 cm) ➔ Q 125.00 (Salas, piezas centrales)
6. Gigante (60 x 100 cm) ➔ Q 210.00 (Murales y piezas imponentes)

INSTRUCCIONES DE ACCIÓN:
1. Sé conciso, elegante y persuasivo.
2. Si el cliente pide buscar obras o menciona una temática (autos, porsche, spiderman, breaking bad, etc.), UTILIZA la herramienta 'search_catalog' para que el sistema le muestre las tarjetas interactivas de compra.
3. Si el cliente pide una temática no disponible en el stock prefabricado (ej: anime o fútbol), recomiéndale el servicio de Cuadros Personalizados con su propia foto.
4. Si el cliente quiere añadir un producto, usa 'add_to_cart'.
5. Si el cliente pide cotizar medidas personalizadas, usa 'quote_custom_poster'.
6. Cuando el cliente confirme que desea comprar o pregunte cómo pagar, usa 'generate_whatsapp_order' para pasar el pedido listo al vendedor con el cálculo del 50% de anticipo.
`.trim();

  // If no API Key configured, use local engine
  if (!apiKey) {
    return handleLocalIntelligentFallback(cleanInput, knowledge, catalog, cart);
  }

  // Use Gemini with a 5-second timeout and candidate fallback
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_GEMINI')), 5000)
    );

    const geminiExecution = async () => {
      const genAI = new GoogleGenerativeAI(apiKey);

      const contents = [];
      conversationHistory.slice(-6).forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });

      contents.push({
        role: 'user',
        parts: [{ text: cleanInput }]
      });

      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
      ];

      let result = null;
      let successfulModel = 'Google Gemini 3.6 Flash';

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
          });

          result = await model.generateContent({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600
            }
          });
          successfulModel = modelName;
          break;
        } catch (err) {
          console.warn(`Model ${modelName} attempt:`, err.message);
        }
      }

      if (!result) {
        throw new Error('All Gemini candidate models failed');
      }

      return { result, successfulModel };
    };

    const { result, successfulModel } = await Promise.race([geminiExecution(), timeoutPromise]);

    const response = result.response;
    const functionCalls = response.functionCalls();

    let executedActions = [];
    let toolResults = [];

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const actionResult = executeLocalTool(call.name, call.args, catalog, cart, onExecuteTool);
        executedActions.push(actionResult);
        toolResults.push({
          toolName: call.name,
          args: call.args,
          result: actionResult
        });
      }
    }

    let replyText = '';
    try {
      replyText = response.text();
    } catch (e) {
      replyText = '';
    }

    if (!replyText || replyText.trim().length === 0) {
      if (executedActions.some(a => a.type === 'catalog_matches')) {
        replyText = '🎯 He localizado estas opciones en nuestro catálogo oficial según su solicitud. Puede verlas o agregarlas directamente a su pedido:';
      } else if (executedActions.some(a => a.type === 'custom_quote')) {
        replyText = '📐 He calculado los parámetros de fabricación a la medida para su cuadro:';
      } else if (executedActions.some(a => a.type === 'whatsapp_order')) {
        replyText = '📦 Su pedido ha sido estructurado con el 50% de anticipo. Presione el botón a continuación para despacharlo directamente con nuestro asesor por WhatsApp:';
      } else {
        replyText = 'Protocolos ejecutados a la perfección. ¿En qué más puedo asistirle con su pedido, señor?';
      }
    }

    return {
      text: replyText,
      actions: executedActions,
      toolResults: toolResults,
      poweredBy: `Google Gemini (${successfulModel})`
    };

  } catch (error) {
    console.warn('Gemini call failed or timed out, seamlessly falling back to local brain:', error.message);
    return handleLocalIntelligentFallback(cleanInput, knowledge, catalog, cart);
  }
}

function isSimpleGreetingOrKeyword(text) {
  const t = text.toLowerCase().trim();
  const simpleList = [
    'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal',
    'saludos', 'hey', 'jarvis', 'ayuda', 'info', 'menu', 'inicio', 'gracias', 'ok'
  ];
  return simpleList.includes(t) || t.length <= 3;
}

// Local Tool Executor for Gemini Function Calls
function executeLocalTool(toolName, args, catalog, cart, onExecuteTool) {
  if (toolName === 'search_catalog') {
    const q = (args.query || '').toLowerCase().trim();
    const cat = (args.category || '').toLowerCase().trim();
    const posters = catalog.posters || [];

    const matches = posters.filter(p => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const franchise = (p.franchise || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';

      const fullText = `${title} ${desc} ${franchise} ${pCat} ${tags}`;

      const matchCategory = !cat || pCat === cat || fullText.includes(cat);
      const matchQuery = !q || fullText.includes(q) || q.split(' ').some(word => word.length > 2 && fullText.includes(word));

      return matchCategory && matchQuery;
    }).slice(0, args.maxResults || 4);

    if (onExecuteTool) onExecuteTool('search_results', matches);

    return {
      type: 'catalog_matches',
      count: matches.length,
      posters: matches
    };
  }

  if (toolName === 'add_to_cart') {
    const poster = (catalog.posters || []).find(p => 
      p.id === args.posterId || p.title.toLowerCase().includes((args.posterId || '').toLowerCase())
    );
    if (poster && onExecuteTool) {
      onExecuteTool('add_to_cart', {
        poster,
        sizeId: args.sizeId || 'medium',
        quantity: args.quantity || 1
      });
    }
    return {
      type: 'item_added',
      success: !!poster,
      posterTitle: poster ? poster.title : args.posterId
    };
  }

  if (toolName === 'quote_custom_poster') {
    const width = Number(args.widthCm) || 30;
    const height = Number(args.heightCm) || 45;
    const area = width * height;
    const rate = args.material === 'pvc' ? 0.058 : args.material === 'vinil' ? 0.024 : 0.048;
    const basePrice = Math.max(30.00, area * rate);
    const roundedPrice = Math.round(basePrice / 5) * 5;
    const advance = roundedPrice * 0.5;

    return {
      type: 'custom_quote',
      dimensions: `${width} x ${height} cm`,
      areaCm2: area,
      material: args.material || 'mdf',
      totalPrice: roundedPrice,
      advance50: advance
    };
  }

  if (toolName === 'generate_whatsapp_order') {
    const total = cart.reduce((s, i) => s + (i.price * (Number(i.quantity) || 1)), 0);
    const deposit = total * 0.5;
    const message = `🛍️ *PEDIDO COORDINADO CON ASISTENTE J.A.R.V.I.S.*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${args.customerName || 'Cliente Web'}\n` +
      `📞 *Contacto:* ${args.customerPhone || 'Por coordinar'}\n` +
      `📝 *Notas / Cuadros:* ${args.customNotes}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total:* Q${total > 0 ? total.toFixed(2) : 'A cotizar'}\n` +
      `💳 *50% Anticipo para inicio:* Q${deposit > 0 ? deposit.toFixed(2) : 'A cotizar'}\n\n` +
      `Hola, el asistente J.A.R.V.I.S. me ha preparado este pedido. Deseo confirmar y realizar el anticipo del 50%.`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/50259980504?text=${encoded}`;

    if (onExecuteTool) onExecuteTool('open_whatsapp', { url: waUrl, message });

    return {
      type: 'whatsapp_order_ready',
      url: waUrl,
      message
    };
  }

  if (toolName === 'navigate_store') {
    if (onExecuteTool) onExecuteTool('navigate', args);
    return { type: 'navigated', section: args.section };
  }

  return { type: 'unknown' };
}

// Ultra-fast and rich local intelligence fallback engine
function handleLocalIntelligentFallback(userMessage, knowledge, catalog, cart) {
  const q = (userMessage || '').toLowerCase().trim();
  const posters = catalog.posters || [];

  // 1. Single letter or very short greeting
  if (!q || q.length <= 2 || q === 'hola' || q === 'buenas' || q === 'hey' || q === 'jarvis') {
    return {
      text: `👋 Saludos, soy **J.A.R.V.I.S.**, el asistente táctico de Deco Vintage Guate.\n\nPuedo ayudarle a:\n• 🔍 **Buscar cuadros:** Escriba temas como *Autos, Anime, Marvel, Star Wars, Cine, Música*.\n• 📐 **Medidas y Precios:** Conozca los 6 tamaños en MDF 5.5mm (desde Q25.00).\n• 🎨 **Cuadros Personalizados:** Cotice cualquier medida especial con sus propias fotos.\n• 📦 **Gestionar su Pedido:** Dejarlo listo para coordinar el 50% de anticipo por WhatsApp.`,
      poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
    };
  }

  // 2. Pricing & Sizes
  if (q.includes('precio') || q.includes('cuanto') || q.includes('costo') || q.includes('medida') || q.includes('tamaño') || q.includes('vale')) {
    const sizesText = (knowledge.standardSizes || []).map(s => `• **${s.name} (${s.dimensions})**: Q ${s.price.toFixed(2)} — _${s.bestFor}_`).join('\n');
    return {
      text: `📊 **TABLA OFICIAL DE TAMAÑOS Y PRECIOS (MDF 5.5mm RÍGIDO):**\n\n${sizesText}\n\n✨ *Incluye cinta industrial Tessa en el dorso para colgar al instante sin clavos.* ¿Desea que le recomiende una obra para su espacio?`,
      poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
    };
  }

  // 3. Materials & Quality
  if (q.includes('material') || q.includes('mdf') || q.includes('calidad') || q.includes('tessa') || q.includes('pegamento') || q.includes('impresion') || q.includes('pvc')) {
    return {
      text: `🛡️ **ESPECIFICACIONES TÉCNICAS DE FABRICACIÓN:**\n\n1. **Base de Madera MDF 5.5mm:** Rígida, sólida y con acabado pulido.\n2. **Tintas HP Látex HD:** Definición fotográfica ecológica sin olores, resistente al agua y con protección UV anti-decoloración.\n3. **Cinta Tessa Industrial:** Doble contacto de alta adherencia colocada en el dorso.\n4. **Opciones Especiales:** También fabricamos en PVC espumado 5mm (100% impermeable) o solo vinil adhesivo (50% del valor).`,
      poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
    };
  }

  // 4. Shipping & Delivery
  if (q.includes('envio') || q.includes('entrega') || q.includes('departamento') || q.includes('guatemala') || q.includes('tiempo')) {
    return {
      text: `🚚 **COBERTURA & POLÍTICAS DE ENTREGA:**\n\n• **Cobertura:** Llegamos a todos los 22 departamentos de Guatemala.\n• **Tiempo de Entrega:** 2 a 4 días hábiles desde la confirmación.\n• **Política de Pago:** 50% de anticipo para iniciar manufactura y 50% saldo contra entrega o previo a envío.\n• **Contacto directo:** WhatsApp 5998-0504.`,
      poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
    };
  }

  // 5. Semantic Catalog Search (Category, franchise, keyword, or character)
  const searchTerms = q.split(' ').filter(w => w.length > 2);
  const found = posters.filter(p => {
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const franchise = (p.franchise || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
    const fullText = `${title} ${desc} ${franchise} ${cat} ${tags}`;

    if (fullText.includes(q)) return true;
    return searchTerms.some(term => fullText.includes(term));
  }).slice(0, 4);

  if (found.length > 0) {
    return {
      text: `🎯 He localizado estas obras destacadas que coinciden con su consulta en nuestro catálogo oficial:`,
      actions: [{ type: 'catalog_matches', count: found.length, posters: found }],
      poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
    };
  }

  // 6. General fallback
  const sampleBestSellers = posters.filter(p => p.isBestSeller).slice(0, 3);
  return {
    text: `Sistemas en línea. No encontré una coincidencia exacta para "${userMessage}", pero puedo mostrarle nuestras obras más vendidas o asistirle con cualquier medida personalizada:`,
    actions: sampleBestSellers.length > 0 ? [{ type: 'catalog_matches', count: sampleBestSellers.length, posters: sampleBestSellers }] : [],
    poweredBy: 'IA J.A.R.V.I.S. (Respuestas Rápidas)'
  };
}
