import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageSquare,
  Shield,
  Activity,
  MapPin,
  Clock,
  ShoppingBag,
  Volume2,
  VolumeX,
  Thermometer,
  Radio,
  Headphones,
  Ruler,
  Sliders,
  Cpu
} from 'lucide-react';
import ArcReactor from './ArcReactor';

const JARVIS_KNOWLEDGE = [
  {
    keywords: ['humano', 'conectar con un humano', 'asesor', 'persona', 'whatsapp', 'atencion', 'hablar con alguien', 'soporte', 'contacto'],
    answer: '🛰️ ENLACE DIRECTO CON ASESOR HUMANO:\n\nHe establecido el puente de comunicación con el equipo de soporte y ventas en WhatsApp. Puede pulsar el botón inferior para abrir la conversación directa con nuestro asesor en línea.',
    offerWhatsApp: true
  },
  {
    keywords: ['tamaño', 'medida', 'precio', 'dimensiones', 'cuanto cuesta', 'costo', 'precios', 'medidas', 'tamaños'],
    answer: '📊 ESPECIFICACIONES DE TAMAÑOS Y PRECIOS:\n\n• 01. Mini (14 x 21 cm) ➔ Q 25.00\n• 02. Pequeño (21 x 27 cm) ➔ Q 35.00\n• 03. Portada Álbum (30 x 30 cm) ➔ Q 55.00\n• 04. Mediano (30 x 45 cm) ➔ Q 65.00 ⭐ (Más Vendido)\n• 05. Grande (45 x 60 cm) ➔ Q 125.00\n• 06. Gigante (60 x 100 cm) ➔ Q 210.00\n\nTodos los cuadros rígidos incluyen cinta de montaje industrial Tessa de fijación instantánea sin clavos.'
  },
  {
    keywords: ['personalizado', 'mi propia foto', 'custom', 'mi diseño', 'medidas especiales', 'tiempo', 'foto', 'personalizados'],
    answer: '⚡ PROTOCOLO DE FABRICACIÓN PERSONALIZADA:\n\n• Fabricamos cualquier fotografía familiar, diseño o póster con tu propia imagen.\n• Materiales disponibles: Madera MDF 5.5 mm, PVC espumado 5 mm o Solo Vinil (50% valor).\n• Medidas: Estándares o especiales con cotizador por cm².\n• Tiempo de manufactura: Máximo 3 días hábiles.\n• Pago: 50% de anticipo y 50% contra entrega.\n\nPuedo transferirle directamente con producción en WhatsApp para recibir su archivo en alta resolución.',
    offerWhatsApp: true
  },
  {
    keywords: ['material', 'materiales', 'impresion', 'calidad', 'tessa', 'como se cuelga', 'instalacion', 'resistencia'],
    answer: '🛡️ MATRIZ DE MATERIALES & ESPECIFICACIONES:\n\n1. Impresión HD con laminado de alta protección UV y resistencia a la humedad.\n2. Sustratos disponibles: Madera MDF 5.5mm rígida, PVC Espumado 5mm impermeable o Solo Vinil Adhesivo.\n3. Montaje Inmediato: Cinta doble cara industrial Tessa en el dorso. Adhiere a cualquier pared sin taladrar ni clavar.'
  },
  {
    keywords: ['envio', 'envios', 'guatemala', 'departamentos', 'pago', 'contra entrega', 'transferencia', 'donde envian', 'tarifa'],
    answer: '🚚 LOGÍSTICA DE DISTRIBUCIÓN NACIONAL:\n\n• Ciudad de Guatemala y municipios conurbados: Envíos express diarios.\n• Departamentos: Cobertura total por mensajería certificada.\n• Modalidades de Pago: Pago contra entrega (según localidad), transferencia bancaria o depósito.'
  },
  {
    keywords: ['carrito', 'compra', 'total', 'cuanto llevo', 'mi pedido', 'orden'],
    answer: 'cart_status' // dynamic handler
  },
  {
    keywords: ['eventos', 'convencion', 'comic con', 'anime con', 'fan fest', 'donde estan', 'tienda fisica'],
    answer: '🎪 DESPLIEGUE EN CONVENCIONES & EVENTOS:\n\nDeco Vintage tiene presencia activa en las convenciones más grandes de Guatemala (Comic Con, Anime Con, Fan Fest). ¡Sigue nuestras redes para conocer los próximos stands y lanzamientos exclusivos!'
  }
];

// High-tech sound synthesis using Web Audio API (no external mp3 needed)
const playTechSound = (type = 'chime') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'boot') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'blip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // AudioContext silently bypassed if unsupported
  }
};

export default function JarvisAgent({ isOpen, onClose, onQuickWhatsApp, cart = [] }) {
  const [messages, setMessages] = useState([
    {
      sender: 'jarvis',
      text: 'Sistemas en línea. Saludos, soy J.A.R.V.I.S., la inteligencia táctica de Deco Vintage. He inicializado los protocolos de asistencia para resolver dudas de tamaños oficiales, cotizar cuadros personalizados o enlazarle con atención humana directa. ¿En qué puedo asistirle hoy, señor?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const messagesEndRef = useRef(null);

  // Live real-time clock & telemetry updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('es-GT', { hour12: false }));
      setDateString(now.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play startup sound when HUD opens
  useEffect(() => {
    if (isOpen && soundEnabled) {
      playTechSound('boot');
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Calculate cart telemetry safely
  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) : 0;
  const cartTotal = Array.isArray(cart) ? cart.reduce((sum, item) => {
    const raw = item?.price ?? item?.size?.price ?? 25;
    const price = typeof raw === 'number' ? raw : (parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 25);
    return sum + price * (Number(item?.quantity) || 1);
  }, 0) : 0;

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    if (soundEnabled) playTechSound('blip');

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      if (soundEnabled) playTechSound('blip');
      const lower = text.toLowerCase();
      let matched = JARVIS_KNOWLEDGE.find(k => k.keywords.some(kw => lower.includes(kw)));

      let answer = '';
      let showWhatsApp = false;

      if (matched && matched.answer === 'cart_status') {
        if (cartCount === 0) {
          answer = `🛒 TELEMETRÍA DEL CARRITO:\n\nActualmente su matriz de compra está vacía (0 artículos). Puede explorar el catálogo y seleccionar cualquier diseño para agregarlo en sus 6 tamaños disponibles.`;
        } else {
          answer = `🛒 TELEMETRÍA DEL CARRITO ACTIVO:\n\nTiene ${cartCount} ${cartCount === 1 ? 'póster' : 'pósters'} en su orden con un valor acumulado de Q ${cartTotal.toFixed(2)}.\n\nPuede abrir el carrito en la esquina superior para finalizar su pedido directamente por WhatsApp.`;
          showWhatsApp = true;
        }
      } else if (matched) {
        answer = matched.answer;
        showWhatsApp = matched.offerWhatsApp || false;
      } else {
        answer = `Comprendo su solicitud. Para esa especificación detallada o cotizaciones especiales personalizadas, puedo transferirle de inmediato con nuestro asesor humano en WhatsApp. ¿Desea que abra el enlace seguro?`;
        showWhatsApp = true;
      }

      setMessages([...newMsgs, { sender: 'jarvis', text: answer, showWhatsApp }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      height: '660px',
      maxHeight: 'calc(100vh - 40px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '2px solid rgba(0, 242, 254, 0.65)',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 45px rgba(0, 242, 254, 0.35)',
      background: 'radial-gradient(circle at 50% 0%, #081528 0%, #03070f 70%, #020408 100%)',
      backdropFilter: 'blur(25px)',
      animation: 'fadeIn 0.25s ease'
    }}>
      
      {/* Sci-Fi Grid Overlay & Scanline */}
      <div className="jarvis-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.8), transparent)',
        boxShadow: '0 0 15px #00f2fe',
        animation: 'hudScanline 8s linear infinite',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      {/* =========================================================================
          1. J.A.R.V.I.S. ARC REACTOR HOLOGRAPHIC HEADER & TELEMETRY
          ========================================================================= */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '16px 18px 14px 18px',
        background: 'linear-gradient(180deg, rgba(6, 18, 34, 0.95) 0%, rgba(3, 8, 16, 0.9) 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
      }}>
        
        {/* Top Diagnostic Readout Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.68rem',
          fontFamily: 'monospace',
          color: 'rgba(0, 242, 254, 0.85)',
          marginBottom: '12px',
          borderBottom: '1px dashed rgba(0, 242, 254, 0.2)',
          paddingBottom: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#00f5a0',
              boxShadow: '0 0 8px #00f5a0',
              display: 'inline-block',
              animation: 'radarPing 2s infinite'
            }} />
            <span style={{ fontWeight: 800 }}>J.A.R.V.I.S. OS v4.2</span>
            <span style={{ color: 'var(--text-muted)' }}>// MARK VII</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: 'none',
                border: 'none',
                color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={soundEnabled ? 'Sonido HUD activado' : 'Sonido HUD silenciado'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                cursor: 'pointer',
                borderRadius: '4px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: 800
              }}
              title="Cerrar interfaz J.A.R.V.I.S."
            >
              <X size={12} />
              <span>SALIR</span>
            </button>
          </div>
        </div>

        {/* Center Arc Reactor + Holographic Well-Distributed Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          
          {/* Left Telemetry: Location & Live Clock */}
          <div style={{ flex: 1, fontSize: '0.72rem', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 800, marginBottom: '4px' }}>
              <MapPin size={12} color="var(--accent-cyan)" />
              <span style={{ letterSpacing: '0.03em' }}>GUATEMALA, GT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontFamily: 'monospace', fontWeight: 700 }}>
              <Clock size={11} />
              <span>{timeString || '14:38:00'} CST</span>
            </div>
          </div>

          {/* Central Animated Arc Reactor Core */}
          <ArcReactor size={70} />

          {/* Right Telemetry: Temperature & Cart Status */}
          <div style={{ flex: 1, textAlign: 'right', fontSize: '0.72rem', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, marginBottom: '4px' }}>
              <Thermometer size={12} color="#38bdf8" />
              <span>24°C // CORE 36.8°C</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>ORDEN:</span>
              <span style={{ color: '#00f5a0', fontFamily: 'monospace', fontWeight: 900 }}>{cartCount} ÍTEMS (Q {cartTotal.toFixed(2)})</span>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          2. MESSAGES SCROLL AREA (CLEAN, HIGH-CONTRAST & EASY TO READ)
          ========================================================================= */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        flex: 1,
        overflowY: 'auto',
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'rgba(3, 6, 12, 0.75)'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.sender === 'user' ? '82%' : '92%',
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: m.sender === 'user' 
                ? 'linear-gradient(135deg, #00f2fe 0%, #00a8ff 100%)' 
                : 'linear-gradient(135deg, rgba(8, 20, 36, 0.95) 0%, rgba(4, 10, 18, 0.95) 100%)',
              color: m.sender === 'user' ? '#040711' : '#f1f5f9',
              fontSize: '0.88rem',
              fontWeight: m.sender === 'user' ? 700 : 400,
              lineHeight: '1.55',
              whiteSpace: 'pre-line',
              border: m.sender === 'user' ? 'none' : '1px solid rgba(0, 242, 254, 0.25)',
              borderLeft: m.sender === 'user' ? 'none' : '3px solid #00f2fe',
              boxShadow: m.sender === 'user' 
                ? '0 6px 20px rgba(0, 242, 254, 0.35)' 
                : '0 6px 24px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 242, 254, 0.08)'
            }}
          >
            {/* Header Badge for Jarvis messages */}
            {m.sender === 'jarvis' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                color: 'var(--accent-cyan)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginBottom: '6px',
                borderBottom: '1px solid rgba(0, 242, 254, 0.15)',
                paddingBottom: '4px'
              }}>
                <Radio size={10} color="#00f5a0" />
                <span>J.A.R.V.I.S. // TRANSMISIÓN OFICIAL</span>
              </div>
            )}

            <div>{m.text}</div>

            {/* WhatsApp Human Handoff Cyber Button */}
            {m.showWhatsApp && (
              <button
                onClick={() => {
                  const msg = encodeURIComponent("¡Hola Deco Vintage! Vengo de chatear con Jarvis IA en la web y me gustaría recibir asesoría con un pedido.");
                  window.open(`https://wa.me/?text=${msg}`, '_blank');
                }}
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={15} />
                <span>CONECTAR CON ASESOR HUMANO (WHATSAPP)</span>
              </button>
            )}
          </div>
        ))}

        {/* Dynamic Thinking Status Waveform */}
        {isThinking && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            color: 'var(--accent-cyan)',
            fontSize: '0.78rem',
            fontFamily: 'monospace',
            width: 'fit-content'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px' }}>
              {[0.1, 0.3, 0.2, 0.4, 0.1].map((delay, i) => (
                <span
                  key={i}
                  style={{
                    width: '3px',
                    background: '#00f2fe',
                    borderRadius: '2px',
                    animation: `equalizerWave 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${delay}s`
                  }}
                />
              ))}
            </div>
            <span>J.A.R.V.I.S. PROCESANDO MATRIZ DE RESPUESTA...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =========================================================================
          3. STARK HUD QUICK ACTION CHIPS (EXACTLY 3 SOPHISTICATED TECH BUTTONS)
          ========================================================================= */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '10px 12px',
        background: 'rgba(5, 12, 22, 0.96)',
        borderTop: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        
        {/* Botón 1: Conectar con un Humano */}
        <button
          onClick={() => handleSend('Quiero conectar con un asesor humano')}
          style={{
            padding: '8px 6px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.08) 100%)',
            border: '1px solid rgba(37, 211, 102, 0.45)',
            color: '#25d366',
            fontSize: '0.73rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(37, 211, 102, 0.15)',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(37, 211, 102, 0.35)';
            e.currentTarget.style.borderColor = '#25d366';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(37, 211, 102, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.45)';
          }}
        >
          <Headphones size={15} color="#25d366" />
          <span style={{ letterSpacing: '0.02em', lineHeight: 1.2 }}>Conectar Humano</span>
        </button>

        {/* Botón 2: Tamaños y Precios */}
        <button
          onClick={() => handleSend('¿Cuáles son los 6 tamaños y precios de los pósters?')}
          style={{
            padding: '8px 6px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(0, 168, 255, 0.08) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.45)',
            color: 'var(--accent-cyan)',
            fontSize: '0.73rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(0, 242, 254, 0.15)',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 242, 254, 0.35)';
            e.currentTarget.style.borderColor = '#00f2fe';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.45)';
          }}
        >
          <Ruler size={15} color="var(--accent-cyan)" />
          <span style={{ letterSpacing: '0.02em', lineHeight: 1.2 }}>Tamaños y Precios</span>
        </button>

        {/* Botón 3: Personalizados */}
        <button
          onClick={() => handleSend('¿Cómo hago un pedido personalizado con mi foto?')}
          style={{
            padding: '8px 6px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            color: '#c084fc',
            fontSize: '0.73rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(168, 85, 247, 0.35)';
            e.currentTarget.style.borderColor = '#c084fc';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(168, 85, 247, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
          }}
        >
          <Sliders size={15} color="#c084fc" />
          <span style={{ letterSpacing: '0.02em', lineHeight: 1.2 }}>Personalizados</span>
        </button>
      </div>

      {/* =========================================================================
          4. FUTURISTIC HUD INPUT BAR
          ========================================================================= */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(4, 9, 18, 0.95) 0%, rgba(2, 5, 10, 0.98) 100%)',
        borderTop: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 242, 254, 0.04)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '10px',
          padding: '8px 14px',
          boxShadow: 'inset 0 0 10px rgba(0, 242, 254, 0.05)'
        }}>
          <Sparkles size={15} color="var(--accent-cyan)" />
          <input
            type="text"
            placeholder="Escriba su consulta para J.A.R.V.I.S...."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={() => handleSend()}
          style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #0077ff 100%)',
            border: 'none',
            color: '#030712',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.5)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Transmitir comando a Jarvis"
        >
          <Send size={17} />
        </button>
      </div>

    </div>
  );
}
