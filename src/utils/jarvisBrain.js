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
          description: 'Término de búsqueda, personaje, franquicia o descripción (ej: Porsche, Batman, Dragon Ball, Anime, Cine)'
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
    description: 'Genera el enlace de WhatsApp estructurado con la orden cerrada lista para que el vendedor reciba el pago del 50% de anticipo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: {
          type: 'STRING',
          description: 'Nombre del cliente (opcional)'
        },
        customerPhone: {
          type: 'STRING',
          description: 'Teléfono o WhatsApp de contacto del cliente'
        },
        customNotes: {
          type: 'STRING',
          description: 'Detalles adicionales, medidas o especificaciones de los cuadros acordados'
        }
      },
      required: ['customNotes']
    }
  },
  {
    name: 'navigate_store',
    description: 'Redirige o filtra la vista de la tienda a una sección específica solicitada por el usuario.',
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
  const apiKey = getGeminiApiKey();
  const knowledge = getStoreKnowledge();
  const posters = getStoredPosters();
  const categories = getStoredCategories();
  const franchises = getStoredFranchises();
  const catalog = { posters, categories, franchises };

  // Summary of available posters for LLM indexing
  const catalogSummary = (catalog.posters || []).slice(0, 50).map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    franchise: p.franchise || 'General',
    bestSeller: !!p.isBestSeller,
    sizes: p.availableSizes ? Object.keys(p.availableSizes) : ['all']
  }));

  // Build high-context tactical system instructions
  const systemInstruction = `
Eres J.A.R.V.I.S., el Asistente Táctico y de Inteligencia Artificial Comercial de "Deco Vintage Guate" (Guatemala).
Tu personalidad es educada, sofisticada, sumamente eficiente, proactiva y enfocada en ayudar a los clientes a elegir los mejores cuadros decorativos rígidos para sus espacios (habitaciones, oficinas, salas de juegos, negocios).

CONOCIMIENTO FUNDAMENTAL DE DECO VINTAGE:
• Especialidad: Pósters rígidos impresos con tecnología HP Látex en alta definición sobre madera MDF de 5.5mm.
• Montaje: TODOS los cuadros rígidos incluyen cinta industrial de doble cara Tessa en el reverso (fijación instantánea sin clavos ni taladros).
• Materiales:
  1. Madera MDF 5.5mm (Estándar de máxima rigidez y durabilidad).
  2. PVC Espumado 5mm (100% impermeable a la humedad).
  3. Solo Vinil Adhesivo (50% del valor, sin base rígida).
• Tabla Oficial de Tamaños y Precios en Quetzales (GTQ):
  - Mini (14 x 21 cm) ➔ Q 25.00
  - Pequeño (21 x 27 cm) ➔ Q 35.00
  - Portada Álbum (30 x 30 cm) ➔ Q 55.00
  - Mediano (30 x 45 cm) ➔ Q 65.00 ⭐ (Más Vendido / Más Recomendado)
  - Grande (45 x 60 cm) ➔ Q 125.00
  - Gigante (60 x 100 cm) ➔ Q 210.00
• Políticas Comerciales Clave:
  - Anticipo del 50% OBLIGATORIO para iniciar fabricación artesanal.
  - Saldo del 50% restante contra entrega o previo a despacho.
  - Tiempo de entrega: 2 a 4 días hábiles en toda Guatemala.
  - Cobertura: Envíos a todo el país.
  - Cuadros Personalizados: Fabricamos cualquier foto familiar, diseño o arte que el cliente envíe.

DIRECTIVAS ACTIVAS DEL DUEÑO DE LA TIENDA:
${(knowledge.ownerDirectives || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}

ESTADO DEL CLIENTE EN TIEMPO REAL:
• Carrito actual del cliente: ${cart.length} obra(s) seleccionada(s). Total: Q${cart.reduce((s, i) => s + (i.price * (Number(i.quantity) || 1)), 0).toFixed(2)}.

INSTRUCCIONES DE ACCIÓN:
1. Sé conciso, elegante y persuasivo.
2. Si el cliente pide buscar obras o recomienda arte, UTILIZA la herramienta 'search_catalog' para que el sistema le muestre las tarjetas interactivas de compra.
3. Si el cliente quiere añadir un producto, usa 'add_to_cart'.
4. Si el cliente pide cotizar medidas personalizadas, usa 'quote_custom_poster'.
5. Cuando el cliente confirme que desea comprar o pregunte cómo pagar, usa 'generate_whatsapp_order' para pasar el pedido listo al vendedor con el cálculo del 50% de anticipo.
`.trim();

  // If no Gemini API Key is configured yet, use sophisticated local intelligence with clear advisory
  if (!apiKey) {
    return handleLocalIntelligentFallback(userMessage, knowledge, catalog, cart);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
    });

    // Format history for Gemini
    const contents = [];
    conversationHistory.slice(-8).forEach(msg => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 650
      }
    });

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

    const replyText = response.text() || 'Protocolos ejecutados. ¿Desea que continuemos con la coordinación de su pedido, señor?';

    return {
      text: replyText,
      actions: executedActions,
      toolResults: toolResults,
      poweredBy: 'Google Gemini 1.5 Flash'
    };

  } catch (error) {
    console.error('Error in Gemini Agent response:', error);
    // Fallback to local intelligent assistant if network/quota issue
    const fallback = handleLocalIntelligentFallback(userMessage, knowledge, catalog, cart);
    fallback.error = error.message;
    return fallback;
  }
}

// Local Tool Executor for Gemini Function Calls
function executeLocalTool(toolName, args, catalog, cart, onExecuteTool) {
  if (toolName === 'search_catalog') {
    const q = (args.query || '').toLowerCase();
    const cat = (args.category || '').toLowerCase();
    const posters = catalog.posters || [];

    const matches = posters.filter(p => {
      const matchText = (p.title + ' ' + (p.description || '') + ' ' + (p.franchise || '') + ' ' + (p.category || '')).toLowerCase();
      const matchCat = !cat || (p.category || '').toLowerCase() === cat;
      return matchCat && matchText.includes(q);
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
    const roundedPrice = Math.round(basePrice / 5) * 5; // round to multiple of 5
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
    const waUrl = `https://wa.me/?text=${encoded}`;

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

// Fallback when API key is pending
function handleLocalIntelligentFallback(userMessage, knowledge, catalog, cart) {
  const q = userMessage.toLowerCase();

  // Price queries
  if (q.includes('precio') || q.includes('cuanto cuesta') || q.includes('tamaño') || q.includes('medida')) {
    const sizes = knowledge.standardSizes.map(s => `• *${s.name} (${s.dimensions})*: Q${s.price.toFixed(2)} (${s.bestFor})`).join('\n');
    return {
      text: `📊 *MATRIZ OFICIAL DE TAMAÑOS Y PRECIOS (GTQ):*\n\n${sizes}\n\n✨ _Todos los cuadros rígidos en madera MDF 5.5mm incluyen cinta industrial de montaje rápido Tessa._ ¿Desea que le recomiende una medida según su pared, señor?`,
      poweredBy: 'Base de Conocimiento Local J.A.R.V.I.S.'
    };
  }

  // Material & Quality
  if (q.includes('material') || q.includes('calidad') || q.includes('mdf') || q.includes('hp') || q.includes('tessa')) {
    return {
      text: `🛡️ *ESPECIFICACIONES DE MATERIALES & MANUFACTURA:*\n\n1. **Madera MDF 5.5mm:** Máxima rigidez y estabilidad estructural.\n2. **Tintas HP Látex HD:** Definición fotográfica ecológica sin olores, resistente a rayones y protección UV contra decoloración.\n3. **Cinta Industrial Tessa:** Incluida en el dorso para instalación instantánea sin taladros ni clavos.\n4. **Opciones adicionales:** PVC Espumado 5mm (impermeable) o Solo Vinil (50% valor).`,
      poweredBy: 'Base de Conocimiento Local J.A.R.V.I.S.'
    };
  }

  // Search catalog
  const found = (catalog.posters || []).filter(p => 
    q.includes(p.title.toLowerCase()) || 
    (p.franchise && q.includes(p.franchise.toLowerCase())) ||
    (p.category && q.includes(p.category.toLowerCase()))
  ).slice(0, 3);

  if (found.length > 0) {
    return {
      text: `🎯 He localizado estas obras en nuestro catálogo en vivo que coinciden con su búsqueda. Puede verlas o agregarlas directamente a su pedido:`,
      actions: [{ type: 'catalog_matches', count: found.length, posters: found }],
      poweredBy: 'Base de Conocimiento Local J.A.R.V.I.S.'
    };
  }

  // Default helpful response
  return {
    text: `Sistemas en línea. Puedo asesorarle en tamaños oficiales (desde Q25.00), cotizar cuadros personalizados, recomendarle pósters según su espacio o preparar su pedido con el 50% de anticipo para el vendedor en WhatsApp. ¿Qué temática o medida desea consultar, señor?`,
    poweredBy: 'Base de Conocimiento Local J.A.R.V.I.S.'
  };
}
