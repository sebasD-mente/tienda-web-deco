// Store Knowledge Base for J.A.R.V.I.S. AI Agent

export const DEFAULT_STORE_KNOWLEDGE = {
  company: {
    name: "Deco Vintage Guate",
    country: "Guatemala",
    phone: "+502 0000-0000",
    specialty: "Fabricación de pósters rígidos de colección y cuadros decorativos premium impresos en madera MDF de 5.5mm con tecnología HP Látex.",
    motto: "El arte de decorar con tus pasiones: autos, anime, geek, cine y música con durabilidad para toda la vida."
  },
  materials: [
    {
      name: "Madera MDF Rígida 5.5mm (Estándar Premium)",
      description: "Base de fibra de madera de alta densidad de 5.5mm de espesor. No se dobla, no se arruga y no requiere marcos de vidrio costosos. Muy resistente y con acabado de bordes pulidos."
    },
    {
      name: "PVC Espumado 5mm (Línea Impermeable)",
      description: "Material ultraligero y 100% resistente al agua y a la humedad. Ideal para baños, exteriores techados o ambientes con humedad."
    },
    {
      name: "Solo Vinil Adhesivo Laminado",
      description: "Póster en vinil de alta definición sin base rígida. Tiene un costo del 50% respecto al cuadro completo rígido. Ideal si el cliente ya tiene su propio marco o quiere pegarlo en superficies lisas."
    },
    {
      name: "Tintas HP Látex Ecológicas y de Alta Definición",
      description: "Impresión de grado fotográfico profesional con micro-gotas HP Látex base agua. No despiden olores tóxicos, resisten rayones superficiales y cuentan con protección contra rayos UV para no decolorarse con los años."
    },
    {
      name: "Montaje con Cinta Industrial Tessa",
      description: "Todos los cuadros rígidos incluyen en el reverso tiras de cinta doble cara industrial de montaje rápido Tessa. No requiere taladros, clavos ni dañar la pared. Se adhiere firmemente a paredes lisas, concreto pintado, madera o tablayeso."
    }
  ],
  standardSizes: [
    { id: "mini", name: "Mini", dimensions: "14 x 21 cm", price: 25.00, bestFor: "Escritorios, repisas pequeñas y colecciones de múltiples piezas." },
    { id: "small", name: "Pequeño", dimensions: "21 x 27 cm", price: 35.00, bestFor: "Espacios compactos y galerías de pared en conjunto." },
    { id: "album", name: "Portada Álbum", dimensions: "30 x 30 cm", price: 55.00, bestFor: "Música, vinilos y arte cuadrado." },
    { id: "medium", name: "Mediano (Más Vendido)", dimensions: "30 x 45 cm", price: 65.00, bestFor: "Habitaciones, salas de estar y oficinas. Proporción clásica de póster." },
    { id: "large", name: "Grande", dimensions: "45 x 60 cm", price: 125.00, bestFor: "Paredes principales, cabeceras y salas de entretenimiento." },
    { id: "giant", name: "Gigante", dimensions: "60 x 100 cm", price: 210.00, bestFor: "Pieza central de alto impacto visual en salas amplias o estudios." }
  ],
  commercialPolicies: {
    advancePayment: "50% de anticipo obligatorio para iniciar la fabricación artesanal de cualquier pedido. El 50% restante se paga contra entrega (en zonas con cobertura) o previo al despacho departamental.",
    deliveryTime: "De 2 a 4 días hábiles de fabricación y entrega en toda Guatemala.",
    shippingCoverage: "Envíos a los 22 departamentos de Guatemala mediante mensajerías certificadas (Guatex / Forza / Cargo Expreso / Mensajería Directa en Ciudad de Guatemala).",
    customOrders: "El cliente puede enviar cualquier imagen, fotografía familiar, diseño o póster que desee fabricar. Evaluamos la resolución para garantizar nitidez óptima.",
    customPricingFormula: "Para medidas no estándar: se calcula por cm² a razón de Q 0.048 por cm² en MDF 5.5mm (mínimo Q 30.00)."
  },
  ownerDirectives: [
    "Ofrecer siempre al cliente la medida Mediano (30x45cm) como la más balanceada y recomendada.",
    "Mencionar que la cinta Tessa de montaje viene incluida sin costo adicional.",
    "Cuando el cliente tenga dudas de compra o confirme un pedido, generar de inmediato el enlace de WhatsApp estructurado para que el vendedor solo cobre el 50% de anticipo.",
    "Mantener siempre el tono formal, táctico, servicial y de alta tecnología propio de J.A.R.V.I.S. (llamando al usuario 'señor' o 'estimado cliente')."
  ]
};

const KNOWLEDGE_STORAGE_KEY = 'deco_jarvis_knowledge_v1';

export function getStoreKnowledge() {
  try {
    const saved = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STORE_KNOWLEDGE, ...parsed };
    }
  } catch (e) {
    console.warn('Error loading custom store knowledge:', e);
  }
  return DEFAULT_STORE_KNOWLEDGE;
}

export function saveStoreKnowledge(updatedKnowledge) {
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(updatedKnowledge));
    return true;
  } catch (e) {
    console.error('Error saving custom store knowledge:', e);
    return false;
  }
}

export function addOwnerDirective(directiveText) {
  const current = getStoreKnowledge();
  const directives = current.ownerDirectives || [];
  directives.push(directiveText);
  saveStoreKnowledge({ ...current, ownerDirectives: directives });
  return directives;
}

export function removeOwnerDirective(index) {
  const current = getStoreKnowledge();
  const directives = (current.ownerDirectives || []).filter((_, idx) => idx !== index);
  saveStoreKnowledge({ ...current, ownerDirectives: directives });
  return directives;
}
