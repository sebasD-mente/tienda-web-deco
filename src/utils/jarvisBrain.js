import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoreKnowledge } from '../data/storeKnowledge.js';
import { getStoredPosters, getStoredCategories, getStoredFranchises } from './catalogStorage.js';

const API_KEY_STORAGE_KEY = 'deco_gemini_api_key_v1';

// Prioritize active, ultra-fast, high-quota Gemini Flash Lite & Flash models
const ACTIVE_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-lite-latest'
];

export function getGeminiApiKey() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY.trim();
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
      return process.env.VITE_GEMINI_API_KEY.trim();
    }
  } catch (e) {}
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (saved && saved.trim().length > 0) return saved.trim();
    }
  } catch (e) {}
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

// Official Tool Declarations for Gemini Cognitive Function Calling
const JARVIS_TOOL_DECLARATIONS = [
  {
    name: 'recomendar_obras',
    description: 'Despliega en el chat de 1 a 3 tarjetas visuales de las obras EXACTAS del catálogo cuando la persona pida recomendaciones de arte, busque cuadros específicos o cuando se hable de un personaje/película del cual tengamos una obra en catálogo y sea pertinente mostrarla como referencia visual.',
    parameters: {
      type: 'OBJECT',
      properties: {
        posterIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Lista de IDs exactos de las obras seleccionadas del catálogo oficial (ej: ["iron-man-2438"])'
        },
        motivo: {
          type: 'STRING',
          description: 'Breve explicación conversacional de por qué se adjunta esta obra'
        }
      },
      required: ['posterIds']
    }
  },
  {
    name: 'cotizar_personalizado',
    description: 'Calcula la cotización exacta en Quetzales y prepara la tarjeta interactiva para un cuadro con medidas especiales personalizadas. Invoca SIEMPRE esta función cuando el cliente mencione medidas (ej: "50x30", "40 por 60", "30 de diametro redondo", "1 metro por 80cm"). Si es circular/redondo de diámetro X, pasa anchoCm=X y altoCm=X.',
    parameters: {
      type: 'OBJECT',
      properties: {
        anchoCm: {
          type: 'NUMBER',
          description: 'Ancho en centímetros (ej: 50)'
        },
        altoCm: {
          type: 'NUMBER',
          description: 'Alto en centímetros (ej: 30)'
        },
        material: {
          type: 'STRING',
          description: 'Material elegido: mdf (madera 5.5mm estándar) o pvc (impermeable 5mm). Por defecto mdf.',
          enum: ['mdf', 'pvc', 'vinil']
        }
      },
      required: ['anchoCm', 'altoCm']
    }
  },
  {
    name: 'agregar_al_carrito',
    description: 'Añade una obra del catálogo al carrito de compras con el tamaño elegido.',
    parameters: {
      type: 'OBJECT',
      properties: {
        posterId: {
          type: 'STRING',
          description: 'ID exacto de la obra a agregar'
        },
        tamano: {
          type: 'STRING',
          description: 'ID del tamaño: MINI, PEQUENO, PORTADA_ALBUM, MEDIANO, GRANDE, GIGANTE',
          enum: ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE']
        },
        cantidad: {
          type: 'NUMBER',
          description: 'Cantidad de unidades (por defecto 1)'
        }
      },
      required: ['posterId', 'tamano']
    }
  },
  {
    name: 'generar_pedido_whatsapp',
    description: 'Estructura el pedido final con el desglose del 50% de anticipo y prepara el enlace directo de WhatsApp con el asesor comercial.',
    parameters: {
      type: 'OBJECT',
      properties: {
        detallePedido: {
          type: 'STRING',
          description: 'Resumen claro de las obras, medidas, materiales y total en Quetzales'
        },
        nombreCliente: {
          type: 'STRING',
          description: 'Nombre del cliente (opcional)'
        }
      },
      required: ['detallePedido']
    }
  },
  {
    name: 'navegar_tienda',
    description: 'Navega de forma asistida a una sección de la tienda web Deco Vintage.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seccion: {
          type: 'STRING',
          description: 'Sección a la que navegar: catalogo, personalizados, sobre_posters, carrito',
          enum: ['catalogo', 'personalizados', 'sobre_posters', 'carrito']
        }
      },
      required: ['seccion']
    }
  }
];

function buildSystemInstruction(knowledge, posters, categories) {
  const postersIndex = (posters || []).map((p) => {
    return `[ID: "${p.id}"] "${p.title}" - ${p.subtitle || ''} | Categoría: ${p.category} | Precio: ${p.priceDisplay || 'Desde Q 25.00'}\nDescripción detallada: ${p.description || ''}`;
  }).join('\n\n');

  const customDocs = (knowledge.customDocuments || []).map(doc => {
    return `DOCUMENTO: "${doc.title}" [Categoría: ${doc.category || 'General'}]\n${doc.content}`;
  }).join('\n\n');

  const directives = (knowledge.ownerDirectives || []).map((d) => `• ${d}`).join('\n');

  return `
Eres J.A.R.V.I.S., el asesor de inteligencia artificial y curador de arte de "Deco Vintage Guate" (Guatemala).
Tu personalidad es como la de J.A.R.V.I.S. en las películas de Iron Man: sumamente inteligente, analítico, amigable, cálido, empático y servicial. Hablas como un humano experto en arte y diseño que atiende a alguien con entusiasmo y cercanía en una tienda exclusiva.

══════════════════════════════════════════════════════════
REGLAS CRÍTICAS DE COMUNICACIÓN Y RAZONAMIENTO:
══════════════════════════════════════════════════════════
1. **RAZONA Y CONVERSA DE FORMA 100% DINÁMICA (CERO RESPUESTAS PREGRABADAS)**:
   - No utilices discursos enlatados ni respuestas prefabricadas. Escucha y analiza lo que la persona dice y responde de forma fresca y contextual.
   - Si te preguntan por algo que NO sabes o que no está en la base de datos de Deco Vintage, responde con honestidad y naturalidad: "No tengo esa información en mis registros de Deco Vintage, pero con gusto puedo ayudarte a..." sin inventar.

2. **NEUTRALIDAD DE GÉNERO (NUNCA USES "SEÑOR" NI ASUMAS GÉNERO)**:
   - Trata a la persona de "tú" con respeto, cercanía y calidez. NUNCA asumas género ni uses repetitivamente "señor", "caballero" o "dama".
   - Usa frases naturales: "¡Hola! Qué gusto saludarte", "Te cuento que...", "Si te gusta el cine clásico...", "Con mucho gusto te ayudo a elegir", "¿Qué espacio te gustaría decorar?".

3. **FORMATO LIMPIO Y CONVERSACIONAL (¡CERO ASTERISCOS EN EXCESO!)**:
   - NO escribas como un informe técnico aburrido ni llenes el texto de asteriscos (evita '***', listas plagadas de '**' o encabezados rígidos tipo '### 1.').
   - Escribe en párrafos naturales, fluidos y limpios, como se habla en un chat real.

4. **CONVERSACIÓN HUMANA Y CULTURAL PRIMERO**:
   - Cuando te pregunten sobre cine, actores, personajes o historias (ej: "¿Quién es Marlon Brando?", "¿Quién es Tony Stark?", "¿De qué trata El Padrino?"):
     -> Responde como un amigo cinéfilo y culto, explicando con entusiasmo quién es y su impacto histórico.
     -> Y si en nuestro catálogo tenemos una obra alusiva (ej: Marlon Brando -> "el-padrino-0012"), al final de tu charla menciona que tenemos esa pieza en catálogo e invoca 'recomendar_obras' para mostrar la tarjeta como referencia visual.

5. **CONSULTAS TÉCNICAS, DE MATERIALES Y LOGÍSTICA**:
   - Cuando pregunten sobre cómo se hacen los cuadros, la madera MDF 5.5mm, el PVC impermeable 5mm, tintas HP Látex, la cinta Tesa®, medidas o envíos:
     -> **NO MUESTRES TARJETAS DE PÓSTERS**.
     -> Responde de forma directa, conversacional y amena resolviendo la duda.

6. **BÚSQUEDAS ESPECÍFICAS DE OBRAS**:
   - Si la persona busca cuadros concretos (ej: "¿hay cuadros de iron man?", "cuadros de autos", "algo de Spider-Man"):
     -> Analiza el inventario de 36 obras, elige con precisión de 1 a 3 obras y llama a 'recomendar_obras', explicando con entusiasmo por qué esa pieza le va a encantar.

7. **CUADROS PERSONALIZADOS**:
   - Si piden algo que no está en el catálogo (artistas no listados, fotos familiares o de mascotas), ofréceles fabricarlo en madera MDF 5.5mm o PVC 5mm impermeable con calidad HP Látex en nuestro servicio de cuadros personalizados.

══════════════════════════════════════════════════════════
DATOS DE LA TIENDA DECO VINTAGE GUATE:
══════════════════════════════════════════════════════════
• Empresa: Deco Vintage Guate (Guatemala). WhatsApp: +502 5998-0504.
• Material Estándar: Madera MDF sólida de 5.5mm de espesor, rígida y con bordes pulidos (no se dobla ni necesita marcos costosos).
• Material Impermeable: PVC Espumado de 5mm (100% resistente al agua y humedad).
• Impresión: Tintas profesionales HP Látex micro-gota ecológicas base agua (+10 años de garantía en interiores, protección UV, sin olores). Enlace oficial: https://www.hp.com/lamerica_nsc_cnt_amer-es/printers/large-format/latex-printers.html
• Montaje: Tiras de cinta industrial doble cara Tesa® (tesa® 65610 Invisibond) ya colocadas en el reverso para pegar en 15 segundos sin taladros ni clavos. Enlace oficial: https://www.tesa.com/es-gt/industria/tesa-65610-invisibond-one-lift.html
• Envíos: A los 22 departamentos de Guatemala vía Guatex / Forza en 2 a 4 días hábiles.
• Política de Pago: 50% de anticipo para ingresar a fabricación y 50% contra entrega o previo al despacho departamental.

══════════════════════════════════════════════════════════
MEDIDAS Y PRECIOS:
══════════════════════════════════════════════════════════
• Mini (14 x 21 cm): Q 25.00
• Pequeño (21 x 27 cm): Q 35.00
• Portada de Álbum (30 x 30 cm): Q 55.00
• Mediano (30 x 45 cm): Q 65.00 (⭐ El más recomendado y favorito para salas y cuartos)
• Grande (45 x 60 cm): Q 125.00
• Gigante (60 x 100 cm): Q 210.00
• Medidas especiales: Q 0.048 por cm² en MDF 5.5mm (mínimo Q 30.00).

══════════════════════════════════════════════════════════
DIRECTIVAS ACTIVAS:
══════════════════════════════════════════════════════════
${directives}

══════════════════════════════════════════════════════════
DOCUMENTOS DE CONOCIMIENTO:
══════════════════════════════════════════════════════════
${customDocs || 'No hay documentos adicionales.'}

══════════════════════════════════════════════════════════
INVENTARIO COMPLETO (36 OBRAS):
══════════════════════════════════════════════════════════
${postersIndex}
`;
}

// Execute Agent Tools
function executeAgentTool(toolName, args, catalog) {
  const posters = catalog.posters || [];

  if (toolName === 'recomendar_obras') {
    const posterIds = Array.isArray(args.posterIds) ? args.posterIds : [];
    let matches = posters.filter(p => posterIds.includes(p.id));
    if (matches.length === 0 && posterIds.length > 0) {
      matches = posters.filter(p => posterIds.some(id => p.title.toLowerCase().includes(id.toLowerCase())));
    }
    return {
      type: 'catalog_matches',
      posters: matches,
      motivo: args.motivo || '',
      summary: `🎯 Obras seleccionadas por J.A.R.V.I.S.`
    };
  }

  if (toolName === 'cotizar_personalizado') {
    const ancho = parseFloat(args.anchoCm) || 30;
    const alto = parseFloat(args.altoCm) || 45;
    const rawMat = (args.material || 'mdf').toLowerCase();
    const isPvc = rawMat.includes('pvc');
    const isVinil = rawMat.includes('vinil');
    const mat = isPvc ? 'pvc' : (isVinil ? 'vinil' : 'mdf');
    const area = Math.round(ancho * alto);
    
    let basePrice = area * 0.048;
    if (mat === 'pvc') basePrice = area * 0.065;
    if (mat === 'vinil') basePrice = (area * 0.048) * 0.5;

    const finalPrice = Math.max(30.00, Math.round(basePrice));
    const advance = Math.round(finalPrice / 2);

    const quoteObj = {
      width: ancho,
      height: alto,
      area: area,
      material: isPvc ? 'PVC Espumado 5mm (Impermeable)' : (isVinil ? 'Vinil Adhesivo' : 'Madera MDF 5.5mm (Rígida)'),
      price: finalPrice,
      advance: advance
    };

    return {
      type: 'custom_quote',
      quote: quoteObj,
      ancho,
      alto,
      material: isPvc ? 'PVC 5mm' : (isVinil ? 'Vinil' : 'MDF 5.5mm'),
      precio: finalPrice,
      anticipo: advance,
      summary: `📐 Cotización personalizada: ${ancho}x${alto}cm en ${isPvc ? 'PVC' : (isVinil ? 'Vinil' : 'MDF')} ➔ Q${finalPrice}.00 (50% anticipo: Q${advance}.00)`
    };
  }

  if (toolName === 'agregar_al_carrito') {
    const poster = posters.find(p => p.id === args.posterId);
    return {
      type: 'add_to_cart',
      poster: poster || { id: args.posterId },
      tamano: args.tamano,
      cantidad: args.cantidad || 1,
      summary: `🛒 Agregado al carrito: ${poster ? poster.title : args.posterId} (${args.tamano})`
    };
  }

  if (toolName === 'generar_pedido_whatsapp') {
    const cleanPhone = '50259980504';
    const text = encodeURIComponent(
      `Hola Deco Vintage Guate, J.A.R.V.I.S. me ayudó a armar mi pedido:\n\n${args.detallePedido}\n\n*Deseo confirmar la disponibilidad y coordinar el 50% de anticipo.*`
    );
    const link = `https://wa.me/${cleanPhone}?text=${text}`;
    return {
      type: 'whatsapp_order',
      link: link,
      detalle: args.detallePedido,
      summary: `📲 Enlace de WhatsApp generado con el 50% de anticipo calculado.`
    };
  }

  if (toolName === 'navegar_tienda') {
    return {
      type: 'navigation',
      section: args.seccion,
      summary: `🧭 Navegando a la sección ${args.seccion}`
    };
  }

  return { type: 'unknown', summary: `Acción ${toolName} ejecutada.` };
}

// Sanitizes and formats history ensuring clean alternance of user/model messages
function sanitizeChatHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  
  const formatted = [];
  const recent = history.slice(-10);

  for (const msg of recent) {
    const text = (msg.text || '').trim();
    if (!text) continue;

    const role = (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'model';

    // Must start with user
    if (formatted.length === 0) {
      if (role === 'user') {
        formatted.push({ role: 'user', parts: [{ text }] });
      }
      continue;
    }

    const lastRole = formatted[formatted.length - 1].role;
    if (role !== lastRole) {
      formatted.push({ role, parts: [{ text }] });
    } else {
      // Append text to previous message if same role to maintain strict alternation
      formatted[formatted.length - 1].parts[0].text += `\n${text}`;
    }
  }

  // Gemini requires history before sendMessage to end on a 'model' turn so the new message is 'user'
  if (formatted.length > 0 && formatted[formatted.length - 1].role === 'user') {
    formatted.pop();
  }

  return formatted;
}

// Main J.A.R.V.I.S. Query Function (Pure dynamic cognitive reasoning, 0 pre-canned templates)
export async function askJarvis(queryOrOptions, history = []) {
  let userQuery = '';
  let conversationHistory = history;
  let onExecuteTool = null;

  if (typeof queryOrOptions === 'string') {
    userQuery = queryOrOptions;
    conversationHistory = history;
  } else if (queryOrOptions && typeof queryOrOptions === 'object') {
    userQuery = queryOrOptions.userMessage || queryOrOptions.prompt || queryOrOptions.query || '';
    conversationHistory = queryOrOptions.conversationHistory || history;
    onExecuteTool = queryOrOptions.onExecuteTool || null;
  }

  userQuery = (userQuery || '').trim();

  const apiKey = getGeminiApiKey();
  const knowledge = getStoreKnowledge();
  const posters = getStoredPosters();
  const categories = getStoredCategories();
  const catalog = { posters, categories };

  if (!apiKey) {
    return {
      text: 'No tengo configurada mi clave de acceso a la inteligencia artificial. Por favor ingresa a Administración para conectar la API Key de Google Gemini.',
      actions: []
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemInstruction(knowledge, posters, categories);
  const formattedHistory = sanitizeChatHistory(conversationHistory);

  let lastError = null;

  // Try fast active Gemini models with low latency (max 8s per attempt)
  for (const modelName of ACTIVE_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
      });

      const chat = model.startChat({
        history: formattedHistory
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_8S')), 8000)
      );

      const result = await Promise.race([chat.sendMessage(userQuery), timeoutPromise]);
      const response = result.response;
      const functionCalls = response.functionCalls();
      let replyText = response.text ? response.text() : '';
      const executedActions = [];

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          console.log(`[J.A.R.V.I.S. Tool Executed (${modelName})] ${call.name}:`, call.args);
          const actionResult = executeAgentTool(call.name, call.args, catalog);
          executedActions.push(actionResult);

          if (onExecuteTool && typeof onExecuteTool === 'function') {
            try {
              onExecuteTool(actionResult.type, actionResult);
            } catch (cbErr) {
              console.warn('[J.A.R.V.I.S.] Callback error:', cbErr);
            }
          }

          if (call.name === 'recomendar_obras' && call.args.motivo) {
            if (!replyText || replyText.trim().length === 0) {
              replyText = `¡Con gusto! ${call.args.motivo}\n\nAquí tienes la ficha para que puedas ver todos los detalles o agregarla a tu pedido:`;
            }
          }

          if (call.name === 'cotizar_personalizado') {
            const q = actionResult.quote;
            if (!replyText || replyText.trim().length === 0) {
              replyText = `¡Listo! He calculado la cotización exacta para tu cuadro personalizado de ${q.width} x ${q.height} cm en ${q.material}.\n\nAquí abajo tienes la tarjeta con el desglose del 50% de anticipo y el botón directo para enviar tu diseño por WhatsApp:`;
            }
          }
        }
      }

      // Default contextual text if model only returned tool calls without direct text
      if (!replyText || replyText.trim().length === 0) {
        if (executedActions.some(a => a.type === 'catalog_matches')) {
          replyText = 'Aquí tienes las opciones seleccionadas de nuestro catálogo según lo que me comentas:';
        } else if (executedActions.some(a => a.type === 'custom_quote')) {
          const q = executedActions.find(a => a.type === 'custom_quote')?.quote;
          replyText = q
            ? `Aquí tienes los datos de la cotización para tu cuadro de ${q.width}x${q.height} cm en ${q.material}:`
            : 'Aquí tienes los datos de la cotización para tu cuadro personalizado:';
        } else {
          replyText = '¿Hay algo más en lo que te pueda asesorar para decorar tu espacio?';
        }
      }

      // Clean any accidental "señor" or excessive formatting artifacts from replyText
      replyText = replyText
        .replace(/,\s*señor\b/gi, '')
        .replace(/\bseñor\b/gi, '')
        .replace(/,\s*caballero\b/gi, '')
        .replace(/\bcaballero\b/gi, '')
        .replace(/\*{3,}/g, '')
        .trim();

      return {
        text: replyText,
        actions: executedActions,
        poweredBy: modelName
      };

    } catch (modelErr) {
      console.warn(`[J.A.R.V.I.S.] Reintentando tras fallo en ${modelName}:`, modelErr.message);
      lastError = modelErr;
      // Immediately try next active model without delay
    }
  }

  // If ALL models failed (e.g. total lack of internet or invalid API key), respond dynamically with natural honesty (NO pre-canned templates)
  console.error('[J.A.R.V.I.S.] Todos los modelos de IA reportaron error:', lastError?.message);
  
  return {
    text: `Tuve una pequeña intermitencia momentánea al conectar con mi servidor de inteligencia artificial de Google. Por favor intenta enviarme tu mensaje nuevamente en unos segundos para que pueda responderte con normalidad.`,
    actions: [],
    isError: true,
    errorDetail: lastError?.message
  };
}
