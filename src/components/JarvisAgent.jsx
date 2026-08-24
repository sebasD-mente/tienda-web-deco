import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Check, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

const JARVIS_KNOWLEDGE = [
  {
    keywords: ['tamaño', 'medida', 'precio', 'dimensiones', 'cuanto cuesta', 'costo', 'precios'],
    answer: 'En Deco Vintage manejamos 6 tamaños estándar sobre madera MDF de 5.5 mm:\n\n• Mini (14 x 21 cm) ➔ Q25.00\n• Pequeño (21 x 27 cm) ➔ Q35.00\n• Portada de Álbum (30 x 30 cm) ➔ Q55.00\n• Mediano (30 x 45 cm) ➔ Q65.00 ⭐ (Más vendido)\n• Grande (45 x 60 cm) ➔ Q125.00\n• Gigante (60 x 100 cm) ➔ Q210.00\n\n¿Te gustaría ver alguno en el Simulador de Pared 3D?'
  },
  {
    keywords: ['material', 'materiales', 'mdf', 'latex', 'impresion', 'calidad', 'tessa', 'como se cuelga', 'instalacion'],
    answer: 'Nuestros pósters combinan 3 pilares técnicos de alta gama:\n\n1. Impresión HP Línea Látex: Colores ultra vibrantes y resistencia superior a la luz y humedad.\n2. Soporte Rígido: Vinil montado sobre madera MDF de 5.5 mm (olvídate del papel arrugado).\n3. Instalación Inmediata: Incluyen cinta industrial doble cara marca Tessa (se pegan en segundos sin clavos ni agujeros en la pared).'
  },
  {
    keywords: ['personalizado', 'mi propia foto', 'custom', 'mi diseño', 'medidas especiales', 'tiempo'],
    answer: '¡Sí! Realizamos pedidos personalizados con tu propio diseño o fotografía:\n\n• Se fabrican sobre MDF 5.5 mm o PVC de 5 mm.\n• Tiempo de entrega: Máximo 3 días hábiles.\n• Modalidad de pago: 50% de anticipo y 50% contra entrega.\n\n¿Quieres que te comunique con un asesor humano por WhatsApp para enviar tu imagen?'
  },
  {
    keywords: ['envio', 'envios', 'guatemala', 'departamentos', 'pago', 'contra entrega', 'transferencia'],
    answer: 'Hacemos envíos seguros a toda Guatemala:\n\n• Envíos en Ciudad Capital y municipios aledaños.\n• Envíos a Departamentos por mensajería certificada.\n• Métodos de pago: Transferencia bancaria, depósito y pago contra entrega (según ubicación).'
  },
  {
    keywords: ['eventos', 'convencion', 'comic con', 'anime con', 'fan fest', 'donde estan'],
    answer: 'Deco Vintage participa activamente en los eventos más importantes del país como Comic Con Guatemala, Anime Con y Fan Fest. ¡Atento a nuestras redes sociales para conocer las próximas fechas y stands!'
  }
];

export default function JarvisAgent({ isOpen, onClose, onQuickWhatsApp }) {
  const [messages, setMessages] = useState([
    {
      sender: 'jarvis',
      text: 'Saludos. Soy Jarvis, el asistente de inteligencia artificial de Deco Vintage Guate. ¿En qué te puedo asesorar hoy? Puedo informarte sobre materiales HP Látex, los 6 tamaños oficiales, pedidos personalizados o guiar tu compra.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let matched = JARVIS_KNOWLEDGE.find(k => k.keywords.some(kw => lower.includes(kw)));

      let answer = matched ? matched.answer : `Entendido. Para esa consulta específica o cotizaciones personalizadas complejas, puedo transferirte directamente con nuestro equipo de atención por WhatsApp. ¿Deseas abrir el chat?`;

      setMessages([...newMsgs, { sender: 'jarvis', text: answer }]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      height: '520px',
      maxHeight: 'calc(100vh - 100px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '2px solid rgba(0, 242, 254, 0.4)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.25)',
      background: '#070a10',
      backdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.25s ease'
    }}>
      
      {/* Jarvis Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 20, 32, 0.95) 0%, rgba(7, 10, 16, 0.95) 100%)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--grad-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
          }}>
            <Bot size={20} color="#070a10" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>JARVIS AI</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5a0' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Deco Vintage Intelligence
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(5, 7, 12, 0.85)'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '12px 16px',
              borderRadius: '16px',
              background: m.sender === 'user' ? 'var(--grad-cyan)' : 'rgba(16, 23, 36, 0.95)',
              color: m.sender === 'user' ? '#070a10' : '#f0f6fc',
              fontSize: '0.88rem',
              fontWeight: m.sender === 'user' ? 600 : 400,
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              border: m.sender === 'user' ? 'none' : '1px solid rgba(0, 242, 254, 0.15)'
            }}
          >
            {m.text}
          </div>
        ))}

        {isThinking && (
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} className="pulse-gold" />
            <span>Jarvis consultando especificaciones técnicas...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Question Chips */}
      <div style={{
        padding: '8px 12px',
        background: 'rgba(10, 14, 22, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => handleSend('¿Cuáles son los 6 tamaños y precios?')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          📐 Tamaños & Precios
        </button>
        <button
          onClick={() => handleSend('¿Qué materiales usan y cómo se instalan?')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🛠️ Materiales MDF
        </button>
        <button
          onClick={() => handleSend('¿Cómo hago un pedido personalizado con mi foto?')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          ✨ Personalizados
        </button>
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#070a10',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          placeholder="Pregunta a Jarvis..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSend()}
          style={{
            background: 'var(--grad-cyan)',
            border: 'none',
            color: '#070a10',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  );
}
