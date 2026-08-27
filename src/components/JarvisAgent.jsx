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
  Mic,
  MicOff,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  Plus,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { generateWhatsAppLink } from '../config/constants';
import ArcReactor from './ArcReactor';
import { askJarvis } from '../utils/jarvisBrain';
import { getStoreKnowledge } from '../data/storeKnowledge';

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

// Formats message text into clean, natural React nodes without raw asterisks or rigid markdown markers
function renderCleanMessageText(text) {
  if (!text) return null;

  // Strip stray technical headers or excessive asterisk blocks
  const cleaned = text
    .replace(/^###\s+/gm, '')
    .replace(/^##\s+/gm, '')
    .replace(/\*{3,}/g, '')
    .replace(/,\s*señor\b/gi, '')
    .replace(/\bseñor\b/gi, '')
    .replace(/,\s*caballero\b/gi, '')
    .replace(/\bcaballero\b/gi, '');

  const lines = cleaned.split('\n');

  return lines.map((line, lIdx) => {
    // Check for bold tokens **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const renderedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={pIdx} style={{ color: '#fff', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <div key={lIdx} style={{ minHeight: line.trim() === '' ? '6px' : 'auto', marginBottom: '2px' }}>
        {renderedLine}
      </div>
    );
  });
}

export default function JarvisAgent({ 
  isOpen, 
  onClose, 
  onQuickWhatsApp, 
  cart = [], 
  onAddToCart,
  onOpenProductModal,
  onNavigate
}) {
  const [knowledge, setKnowledge] = useState(() => getStoreKnowledge());
  const [messages, setMessages] = useState(() => [
    {
      id: 'init-1',
      sender: 'jarvis',
      text: getStoreKnowledge().initialGreeting || '¡Hola! 👋 Soy J.A.R.V.I.S., tu asesor de arte y decoración en Deco Vintage Guate. Estoy aquí para ayudarte a elegir el cuadro perfecto, cotizar medidas especiales o contarte sobre nuestros materiales y envíos a toda Guatemala. ¿Qué tienes en mente para decorar hoy?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [poweredModel, setPoweredModel] = useState('');

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync knowledge live on admin edits
  useEffect(() => {
    const handleKnowledgeUpdate = () => {
      const updated = getStoreKnowledge();
      setKnowledge(updated);
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'init-1' && updated.initialGreeting) {
          return [{ ...prev[0], text: updated.initialGreeting }];
        }
        return prev;
      });
    };

    window.addEventListener('deco-jarvis-knowledge-updated', handleKnowledgeUpdate);
    return () => window.removeEventListener('deco-jarvis-knowledge-updated', handleKnowledgeUpdate);
  }, []);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  // Live Telemetry Clock (Guatemala CST)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-GT', { hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Play boot sound and lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      if (soundEnabled) playTechSound('boot');
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      scrollToBottom();
      return () => {
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen, soundEnabled]);

  // Auto-scroll to bottom of messages reliably
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const t = setTimeout(scrollToBottom, 80);
      return () => clearTimeout(t);
    }
  }, [messages, isTyping, isOpen]);

  // Speech Recognition (Speech to Text)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-GT';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta entrada de voz.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech recognition error:', e);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    if (soundEnabled) playTechSound('blip');

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await askJarvis({
        userMessage: text,
        conversationHistory: messages,
        cart,
        onExecuteTool: (actionType, payload) => {
          if (actionType === 'add_to_cart' && onAddToCart) {
            onAddToCart(payload);
          }
          if (actionType === 'navigate' && onNavigate) {
            if (payload.section === 'catalogo') onNavigate('catalog');
            if (payload.section === 'personalizados') onNavigate('custom-posters');
            if (payload.section === 'sobre_posters') onNavigate('about-posters');
          }
        }
      });

      setPoweredModel(response.poweredBy || '');

      const jarvisMsg = {
        id: `j-${Date.now()}`,
        sender: 'jarvis',
        text: response.text,
        actions: response.actions || [],
        toolResults: response.toolResults || []
      };

      setMessages(prev => [...prev, jarvisMsg]);
      if (soundEnabled) playTechSound('blip');

    } catch (err) {
      console.error('Error asking Jarvis:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'jarvis',
          text: 'Se detectó una micro-interrupción en el enlace cuántico. Puedo responder a consultas de medidas oficiales, cotizar cuadros personalizados o enlazarle con atención humana en WhatsApp.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  if (!isOpen) return null;

  return (
    <div
      className="jarvis-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(3, 5, 10, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
        touchAction: 'none'
      }}
    >
      <div
        className="glass-card jarvis-hud-container"
        style={{
          width: '780px',
          maxWidth: '100%',
          height: '88vh',
          maxHeight: '740px',
          background: 'linear-gradient(180deg, rgba(8, 12, 22, 0.98) 0%, rgba(4, 6, 12, 0.99) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 0 50px rgba(0, 242, 254, 0.18), inset 0 0 20px rgba(0, 242, 254, 0.05)',
          borderRadius: '18px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Top Corner Accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '2px solid #00f2fe', borderLeft: '2px solid #00f2fe', zIndex: 10 }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '2px solid #00f2fe', borderRight: '2px solid #00f2fe', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '2px solid #00f2fe', borderLeft: '2px solid #00f2fe', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '2px solid #00f2fe', borderRight: '2px solid #00f2fe', zIndex: 10 }} />

        {/* 1. Header Táctico Stark Industries */}
        <div style={{
          padding: '16px 20px 14px',
          background: 'rgba(5, 8, 16, 0.96)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flexShrink: 0
        }}>
          {/* Controls Top Right */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 15
          }}>
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Status Badge Top Left */}
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0, 245, 160, 0.12)',
              border: '1px solid rgba(0, 245, 160, 0.35)',
              color: '#00f5a0',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.66rem',
              fontWeight: 800
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f5a0', boxShadow: '0 0 6px #00f5a0' }} />
              ONLINE
            </span>
          </div>

          {/* Centered Arc Reactor */}
          <div style={{ marginBottom: '8px', transform: 'scale(1.05)' }}>
            <ArcReactor size={56} active={isTyping} />
          </div>

          {/* Centered Titles */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.08em' }}>
              J.A.R.V.I.S. <span style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 800 }}>STARK OS 4.8</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', letterSpacing: '0.05em', fontWeight: 500 }}>
              Just A Rather Very Intelligent System
            </span>
            <span style={{
              fontSize: '0.72rem',
              color: '#00f2fe',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(0, 242, 254, 0.6)'
            }}>
              Red Neuronal Gemini
            </span>
          </div>
        </div>

        {/* 2. Barra de Telemetría en Tiempo Real */}
        <div style={{
          padding: '6px 20px',
          background: 'rgba(0, 242, 254, 0.03)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: '8px',
          fontFamily: 'monospace',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} color="var(--accent-cyan)" /> {currentTime} CST
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} color="var(--accent-cyan)" /> GUATEMALA, GT
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
              <ShoppingBag size={12} /> {cart.length} {cart.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'} EN CARRITO
            </span>
          </div>
        </div>

        {/* 3. Área de Mensajes con Scroll Fluido */}
        <div
          ref={chatScrollRef}
          className="jarvis-messages-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {messages.map((msg) => {
            const isJarvis = msg.sender === 'jarvis';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isJarvis ? 'flex-start' : 'flex-end',
                  maxWidth: '100%'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  maxWidth: isJarvis ? '92%' : '85%',
                  flexDirection: isJarvis ? 'row' : 'row-reverse'
                }}>
                  {/* Sender Avatar */}
                  {isJarvis && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}>
                      <ArcReactor size={26} pulsing={false} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div style={{
                    background: isJarvis ? 'rgba(14, 20, 35, 0.9)' : 'var(--grad-cyan)',
                    color: isJarvis ? '#e6edf3' : '#040609',
                    border: isJarvis ? '1px solid rgba(0, 242, 254, 0.25)' : 'none',
                    borderRadius: isJarvis ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    padding: '12px 16px',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                    boxShadow: isJarvis ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0, 242, 254, 0.3)'
                  }}>
                    <div style={{ wordBreak: 'break-word' }}>
                      {renderCleanMessageText(msg.text)}
                    </div>

                    {/* Interactive Action Cards */}
                    {msg.actions && msg.actions.map((act, actIdx) => {
                      if (act.type === 'catalog_matches' && act.posters && act.posters.length > 0) {
                        return (
                          <div key={actIdx} style={{
                            marginTop: '12px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '10px',
                            whiteSpace: 'normal'
                          }}>
                            {act.posters.map((p) => (
                              <div
                                key={p.id}
                                style={{
                                  background: 'rgba(6, 10, 18, 0.95)',
                                  border: '1px solid rgba(0, 242, 254, 0.35)',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
                                }}
                              >
                                <div style={{ position: 'relative', width: '100%', height: '115px', background: '#090d16' }}>
                                  <img
                                    src={p.thumb || p.image}
                                    alt={p.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.src = p.image || '/posters/wallpaper.jpg';
                                    }}
                                  />
                                  <span style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    left: '6px',
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    color: 'var(--accent-cyan)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.66rem',
                                    fontWeight: 800,
                                    border: '1px solid rgba(0, 242, 254, 0.3)'
                                  }}>
                                    {p.category}
                                  </span>
                                </div>
                                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                                    {p.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {p.subtitle || 'Póster Rígido MDF 5.5mm'}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '2px' }}>
                                    {p.priceDisplay || 'Desde Q 25.00'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onOpenProductModal) onOpenProductModal(p);
                                        onClose();
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '6px 4px',
                                        background: 'rgba(0, 242, 254, 0.15)',
                                        border: '1px solid rgba(0, 242, 254, 0.4)',
                                        color: '#00f2fe',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Eye size={12} />
                                      <span>Ver Obra</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (act.type === 'custom_quote') {
                        const q = act.quote || {
                          width: act.ancho || act.width || 30,
                          height: act.alto || act.height || 45,
                          area: (act.ancho || act.width || 30) * (act.alto || act.height || 45),
                          material: act.material || 'Madera MDF 5.5mm',
                          price: act.precio || act.price || 65,
                          advance: act.anticipo || act.advance || Math.round((act.precio || act.price || 65) / 2)
                        };
                        const waQuoteText = encodeURIComponent(`Hola Deco Vintage Guate, J.A.R.V.I.S. me ha cotizado un cuadro personalizado:\n• Medida: ${q.width}x${q.height} cm (${q.area} cm²)\n• Material: ${q.material}\n• Precio Total: Q ${q.price}.00\n• 50% de Anticipo: Q ${q.advance}.00\n\n*Deseo enviar mi imagen para iniciar fabricación.*`);
                        return (
                          <div key={actIdx} style={{
                            marginTop: '12px',
                            background: 'rgba(5, 12, 24, 0.95)',
                            border: '1px solid rgba(0, 245, 160, 0.4)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            boxShadow: '0 0 25px rgba(0, 245, 160, 0.15)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00f5a0', letterSpacing: '0.05em' }}>
                                📐 COTIZACIÓN A MEDIDA
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {q.area} cm²
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: '#e6edf3', marginBottom: '10px' }}>
                              <div><strong>Dimensiones:</strong> {q.width} x {q.height} cm</div>
                              <div><strong>Material:</strong> {q.material}</div>
                              <div><strong>Precio Total:</strong> <span style={{ color: '#00f5a0', fontWeight: 800 }}>Q {q.price}.00</span></div>
                              <div><strong>50% Anticipo:</strong> <span style={{ color: '#00f2fe', fontWeight: 800 }}>Q {q.advance}.00</span></div>
                            </div>
                            <a
                              href={generateWhatsAppLink(`Hola Deco Vintage Guate, J.A.R.V.I.S. me ha cotizado un cuadro personalizado:\n• Medida: ${q.width}x${q.height} cm (${q.area} cm²)\n• Material: ${q.material}\n• Precio Total: Q ${q.price}.00\n• 50% de Anticipo: Q ${q.advance}.00\n\n*Deseo enviar mi imagen para iniciar fabricación.*`)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'linear-gradient(90deg, #00f5a0 0%, #00d2ff 100%)',
                                color: '#040812',
                                padding: '9px 14px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(0, 245, 160, 0.3)'
                              }}
                            >
                              <MessageSquare size={14} />
                              <span>Enviar Diseño y Pagar 50% por WhatsApp</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        );
                      }

                      if (act.type === 'whatsapp_order' && (act.waUrl || act.link)) {
                        const targetUrl = act.waUrl || act.link;
                        return (
                          <div key={actIdx} style={{ marginTop: '12px' }}>
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(90deg, #00f5a0 0%, #00d2ff 100%)',
                                color: '#040812',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.84rem',
                                textDecoration: 'none',
                                boxShadow: '0 4px 16px rgba(0, 245, 160, 0.4)'
                              }}
                            >
                              <MessageSquare size={16} />
                              <span>Confirmar Pedido (50% Anticipo) por WhatsApp</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArcReactor size={26} pulsing={true} />
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(14, 20, 35, 0.9)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '4px 14px 14px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  PROCESANDO MATRIZ TÁCTICA...
                </span>
                <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe' }} />
                <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe', animationDelay: '0.2s' }} />
                <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Barra de Atajos Rápidos Tácticos Stark HUD */}
        <div style={{
          padding: '8px 20px',
          background: 'rgba(5, 8, 16, 0.95)',
          borderTop: '1px solid rgba(0, 242, 254, 0.15)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0
        }}>
          {(knowledge.quickPrompts || []).map((qp, idx) => (
            <button
              key={qp.id || idx}
              type="button"
              onClick={() => handleQuickPrompt(qp.prompt || qp.label)}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(5, 12, 24, 0.85) 100%)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                boxShadow: 'inset 0 0 8px rgba(0, 242, 254, 0.08), 0 2px 8px rgba(0,0,0,0.3)',
                color: '#e6edf3',
                padding: '6px 13px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(10, 25, 48, 0.95) 100%)';
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 242, 254, 0.4), inset 0 0 10px rgba(0, 242, 254, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(5, 12, 24, 0.85) 100%)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                e.currentTarget.style.color = '#e6edf3';
                e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(0, 242, 254, 0.08), 0 2px 8px rgba(0,0,0,0.3)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '1px',
                background: '#00f2fe',
                boxShadow: '0 0 6px #00f2fe',
                flexShrink: 0
              }} />
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* 5. Input de Entrada con Micrófono y Envío */}
        <div style={{
          padding: '12px 20px 16px 20px',
          background: 'rgba(6, 10, 18, 0.98)',
          borderTop: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            style={{
              background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
              border: isListening ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isListening ? '#ffffff' : 'var(--accent-cyan)',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={isListening ? 'Escuchando... clic para detener' : 'Hablar con J.A.R.V.I.S. (Micrófono)'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu consulta a J.A.R.V.I.S. (ej: recomiéndame cuadros de anime...)'}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '10px',
              padding: '11px 16px',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="btn-cyan"
            style={{
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '10px',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: !inputText.trim() || isTyping ? 0.4 : 1
            }}
            title="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </div>

      </div>

      <style>{`
        .jarvis-messages-body::-webkit-scrollbar {
          width: 5px;
        }
        .jarvis-messages-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .jarvis-messages-body::-webkit-scrollbar-thumb {
          background: rgba(0, 242, 254, 0.25);
          border-radius: 4px;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .typing-dot {
          animation: pulseDot 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
