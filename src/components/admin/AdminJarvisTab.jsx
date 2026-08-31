import React, { useState, useRef } from 'react';
import { 
  MessageSquare, Zap, FileText, Image as ImageIcon, 
  Sparkles, Key, Plus, Trash2, Edit3, Save, Upload, 
  Download, ExternalLink, X, CheckCircle2, AlertCircle 
} from 'lucide-react';
import ArcReactor from '../ArcReactor';
import { optimizeImageFile } from '../../utils/imageOptimizer';
import { getGeminiApiKey, saveGeminiApiKey } from '../../utils/jarvisBrain';
import { getAuthToken } from '../../utils/apiClient';
import { 
  getStoreKnowledge, 
  saveStoreKnowledge, 
  saveQuickPrompts,
  addCustomDocument,
  updateCustomDocument,
  removeCustomDocument,
  addReferenceImage,
  removeReferenceImage,
  addOwnerDirective, 
  removeOwnerDirective,
  exportJarvisMemoryAsJSON,
  importJarvisMemoryFromJSON
} from '../../data/storeKnowledge';

export default function AdminJarvisTab({ onShowToast }) {
  const [jarvisSubTab, setJarvisSubTab] = useState('greeting'); // 'greeting' | 'prompts' | 'docs' | 'images' | 'directives' | 'apikey'
  const [knowledgeData, setKnowledgeData] = useState(() => getStoreKnowledge());
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  
  // Greeting State
  const [greetingInput, setGreetingInput] = useState(() => getStoreKnowledge().initialGreeting || '');
  
  // Quick Prompts State
  const [promptLabelInput, setPromptLabelInput] = useState('');
  const [promptTextInput, setPromptTextInput] = useState('');
  const [editingPromptId, setEditingPromptId] = useState(null);

  // Custom Docs State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalId, setDocModalId] = useState(null);
  const [docTitleInput, setDocTitleInput] = useState('');
  const [docCategoryInput, setDocCategoryInput] = useState('Políticas');
  const [docContentInput, setDocContentInput] = useState('');

  // Reference Images State
  const [refImageTitle, setRefImageTitle] = useState('');
  const [refImageDesc, setRefImageDesc] = useState('');
  const [isUploadingRefImage, setIsUploadingRefImage] = useState(false);
  const refImageInputRef = useRef(null);
  const jarvisMemoryInputRef = useRef(null);

  // Directives State
  const [newDirectiveText, setNewDirectiveText] = useState('');

  const reloadKnowledge = () => {
    setKnowledgeData(getStoreKnowledge());
  };

  // 1. Greeting Handlers
  const handleSaveGreeting = async () => {
    if (!greetingInput.trim()) return;
    await saveStoreKnowledge({ initialGreeting: greetingInput.trim() });
    reloadKnowledge();
    onShowToast('¡Saludo inicial de J.A.R.V.I.S. guardado!', 'success');
  };

  // 2. Quick Prompts Handlers
  const handleSavePrompt = async (e) => {
    e?.preventDefault();
    if (!promptLabelInput.trim() || !promptTextInput.trim()) {
      onShowToast('Completa el botón y el mensaje.', 'error');
      return;
    }

    const currentPrompts = [...(knowledgeData.quickPrompts || [])];
    if (editingPromptId) {
      const idx = currentPrompts.findIndex(p => p.id === editingPromptId);
      if (idx !== -1) {
        currentPrompts[idx] = { id: editingPromptId, label: promptLabelInput.trim(), prompt: promptTextInput.trim() };
      }
    } else {
      currentPrompts.push({
        id: 'prompt-' + Date.now().toString(36),
        label: promptLabelInput.trim(),
        prompt: promptTextInput.trim()
      });
    }

    await saveQuickPrompts(currentPrompts);
    setPromptLabelInput('');
    setPromptTextInput('');
    setEditingPromptId(null);
    reloadKnowledge();
    onShowToast('¡Botón de sugerencia rápida guardado!', 'success');
  };

  const handleEditPrompt = (p) => {
    setEditingPromptId(p.id);
    setPromptLabelInput(p.label);
    setPromptTextInput(p.prompt);
  };

  const handleDeletePrompt = async (id) => {
    const updated = (knowledgeData.quickPrompts || []).filter(p => p.id !== id);
    await saveQuickPrompts(updated);
    reloadKnowledge();
    onShowToast('Botón eliminado.', 'info');
  };

  // 3. Custom Documents Handlers
  const handleOpenNewDocModal = () => {
    setDocModalId(null);
    setDocTitleInput('');
    setDocCategoryInput('Políticas');
    setDocContentInput('');
    setShowDocModal(true);
  };

  const handleOpenEditDocModal = (doc) => {
    setDocModalId(doc.id);
    setDocTitleInput(doc.title);
    setDocCategoryInput(doc.category || 'General');
    setDocContentInput(doc.content);
    setShowDocModal(true);
  };

  const handleSaveDoc = async () => {
    if (!docTitleInput.trim() || !docContentInput.trim()) {
      onShowToast('Por favor completa el título y el contenido del documento.', 'error');
      return;
    }

    if (docModalId) {
      await updateCustomDocument(docModalId, {
        title: docTitleInput.trim(),
        category: docCategoryInput,
        content: docContentInput.trim()
      });
      onShowToast('¡Documento de conocimiento actualizado!', 'success');
    } else {
      await addCustomDocument({
        title: docTitleInput.trim(),
        category: docCategoryInput,
        content: docContentInput.trim()
      });
      onShowToast('¡Nuevo documento agregado a la memoria de J.A.R.V.I.S.!', 'success');
    }

    setShowDocModal(false);
    reloadKnowledge();
  };

  const handleDeleteDoc = async (id) => {
    const confirm1 = window.confirm('¿Estás seguro de eliminar este documento de la base de J.A.R.V.I.S.?');
    if (!confirm1) return;
    await removeCustomDocument(id);
    reloadKnowledge();
    onShowToast('Documento eliminado.', 'info');
  };

  // 4. Reference Images Handlers
  const handleUploadRefImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingRefImage(true);
      const res = await optimizeImageFile(file);
      await addReferenceImage({
        title: refImageTitle.trim() || file.name,
        description: refImageDesc.trim() || 'Referencia visual de producto',
        url: res.fullDataUrl
      });
      setRefImageTitle('');
      setRefImageDesc('');
      reloadKnowledge();
      onShowToast('¡Imagen de referencia agregada a J.A.R.V.I.S.!', 'success');
    } catch (err) {
      onShowToast('Error al procesar imagen: ' + err.message, 'error');
    } finally {
      setIsUploadingRefImage(false);
    }
  };

  const handleDeleteRefImage = async (id) => {
    await removeReferenceImage(id);
    reloadKnowledge();
    onShowToast('Imagen de referencia eliminada.', 'info');
  };

  // 5. Directives Handlers
  const handleAddDirective = async () => {
    if (!newDirectiveText.trim()) return;
    await addOwnerDirective(newDirectiveText.trim());
    setNewDirectiveText('');
    reloadKnowledge();
    onShowToast('¡Nueva directiva agregada a J.A.R.V.I.S.!', 'success');
  };

  const handleRemoveDirective = async (idx) => {
    await removeOwnerDirective(idx);
    reloadKnowledge();
    onShowToast('Directiva eliminada de J.A.R.V.I.S.', 'info');
  };

  // 6. Gemini API Key Handler
  const handleSaveGeminiKey = async (e) => {
    e?.preventDefault();
    const key = geminiKeyInput.trim();
    saveGeminiApiKey(key);
    
    // Also persist to VPS SSD backend
    const token = getAuthToken();
    try {
      await fetch('/api/jarvis/save-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ apiKey: key })
      });
    } catch (err) {
      console.warn('Could not sync key to VPS:', err.message);
    }
    
    onShowToast('¡Clave de Gemini guardada y sincronizada con el VPS!', 'success');
  };

  // 7. Memory Backup Handlers
  const handleImportJarvisMemory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const res = await importJarvisMemoryFromJSON(event.target.result);
        if (res.success) {
          reloadKnowledge();
          onShowToast('¡Memoria de J.A.R.V.I.S. restaurada!', 'success');
        } else {
          onShowToast('Error al importar memoria: ' + res.error, 'error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      onShowToast('Error al leer archivo: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* J.A.R.V.I.S. Header HUD */}
      <div className="glass-card" style={{
        padding: 'clamp(20px, 4vw, 28px)',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(6, 10, 20, 0.95) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        boxShadow: '0 0 30px rgba(0, 242, 254, 0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, rgba(6, 10, 20, 0.9) 100%)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
              padding: 0
            }}>
              <ArcReactor size={38} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Centro de Control & Entrenamiento <span className="text-gradient-cyan">J.A.R.V.I.S.</span>
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                Gestiona el comportamiento, saludos, sugerencias, manuales de conocimiento y directivas de tu agente de IA.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: geminiKeyInput ? 'rgba(0, 245, 160, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              border: geminiKeyInput ? '1px solid rgba(0, 245, 160, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
              color: geminiKeyInput ? '#00f5a0' : '#eab308',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: geminiKeyInput ? '#00f5a0' : '#eab308',
                boxShadow: geminiKeyInput ? '0 0 10px #00f5a0' : 'none'
              }} />
              {geminiKeyInput ? 'J.A.R.V.I.S. ONLINE (IA ACTIVA)' : 'J.A.R.V.I.S. MODO CATÁLOGO'}
            </span>
          </div>
        </div>

        {/* Sub-Navigation Tabs with Responsive Wrap & Clean Spacing */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '6px'
        }}>
          {[
            { id: 'greeting', label: '💬 Saludo Inicial', icon: MessageSquare },
            { id: 'prompts', label: '🔘 Botones Rápidos', icon: Zap },
            { id: 'docs', label: '📚 Documentos', icon: FileText, count: (knowledgeData.customDocuments || []).length },
            { id: 'images', label: '🖼️ Imágenes Ref', icon: ImageIcon, count: (knowledgeData.referenceImages || []).length },
            { id: 'directives', label: '⚡ Directivas del Dueño', icon: Sparkles, count: (knowledgeData.ownerDirectives || []).length },
            { id: 'apikey', label: '🔌 Conexión Clave API', icon: Key }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = jarvisSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJarvisSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.05)',
                  border: isActive ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isActive ? '#040609' : '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    background: isActive ? '#040609' : 'rgba(0, 242, 254, 0.2)',
                    color: isActive ? '#00f2fe' : '#ffffff',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 900
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: GREETING */}
      {jarvisSubTab === 'greeting' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
            Mensaje de Bienvenida Inicial
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Es el primer mensaje que pronuncia y muestra J.A.R.V.I.S. cuando un cliente abre el asistente por primera vez.
          </p>
          <textarea
            rows={4}
            value={greetingInput}
            onChange={(e) => setGreetingInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              marginBottom: '14px',
              boxSizing: 'border-box'
            }}
          />
          <button onClick={handleSaveGreeting} className="btn-cyan" style={{ padding: '8px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={15} />
            <span>Guardar Saludo</span>
          </button>
        </div>
      )}

      {/* SUBTAB 2: PROMPTS */}
      {jarvisSubTab === 'prompts' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
            Botones de Preguntas y Sugerencias Rápidas
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Botones interactivos que aparecen sobre el chat para que el cliente pregunte con un solo toque.
          </p>

          <form onSubmit={handleSavePrompt} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Etiqueta del Botón (Visible):
              </label>
              <input
                type="text"
                placeholder="ej: 📐 Medidas y Precios"
                value={promptLabelInput}
                onChange={(e) => setPromptLabelInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Mensaje que se enviará:
              </label>
              <input
                type="text"
                placeholder="ej: ¿Cuáles son las medidas y precios de los cuadros?"
                value={promptTextInput}
                onChange={(e) => setPromptTextInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button type="submit" className="btn-cyan" style={{ padding: '9px 16px', fontSize: '0.82rem', height: '38px' }}>
                <Plus size={15} />
                <span>{editingPromptId ? 'Actualizar' : 'Agregar'}</span>
              </button>
              {editingPromptId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPromptId(null);
                    setPromptLabelInput('');
                    setPromptTextInput('');
                  }}
                  className="btn-secondary"
                  style={{ padding: '9px 12px', fontSize: '0.82rem', height: '38px' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* List of prompts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(knowledgeData.quickPrompts || []).map((p) => (
              <div key={p.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                gap: '10px'
              }}>
                <div>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', marginRight: '8px' }}>{p.label}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>"{p.prompt}"</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleEditPrompt(p)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => handleDeletePrompt(p.id)} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DOCS */}
      {jarvisSubTab === 'docs' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
                Base de Conocimiento y Guías para J.A.R.V.I.S.
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Información técnica, políticas, eventos y preguntas frecuentes que la IA consultará para responder.
              </p>
            </div>
            <button onClick={handleOpenNewDocModal} className="btn-cyan" style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              <span>Nuevo Documento</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {(knowledgeData.customDocuments || []).map((doc) => (
              <div key={doc.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{doc.category || 'General'}</span>
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>{doc.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0', maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.content}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <button onClick={() => handleOpenEditDocModal(doc)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                    <Edit3 size={13} />
                    <span>Editar</span>
                  </button>
                  <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: REFERENCE IMAGES */}
      {jarvisSubTab === 'images' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
            Imágenes de Referencia de Calidad y Producto
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Fotos reales de acabados, cinta Tesa de montaje, madera MDF y stands de feria que J.A.R.V.I.S. puede compartir con clientes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Título de la imagen (ej. Acabado HP Látex)"
              value={refImageTitle}
              onChange={(e) => setRefImageTitle(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.85rem' }}
            />
            <input
              type="text"
              placeholder="Breve descripción o detalle"
              value={refImageDesc}
              onChange={(e) => setRefImageDesc(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.85rem' }}
            />
            <input
              type="file"
              ref={refImageInputRef}
              onChange={handleUploadRefImage}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => refImageInputRef.current?.click()}
              disabled={isUploadingRefImage}
              className="btn-cyan"
              style={{ padding: '9px 16px', fontSize: '0.82rem' }}
            >
              <Upload size={15} />
              <span>{isUploadingRefImage ? 'Subiendo...' : 'Seleccionar Foto'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {(knowledgeData.referenceImages || []).map((img) => (
              <div key={img.id} style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ height: '140px', background: '#03060c' }}>
                  <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.82rem' }}>{img.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{img.description}</div>
                  </div>
                  <button onClick={() => handleDeleteRefImage(img.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: DIRECTIVES */}
      {jarvisSubTab === 'directives' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
            Directivas y Reglas Estrictas del Propietario
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Instrucciones obligatorias de atención (ej: Siempre solicitar el 50% de anticipo, responder cordialmente, hablar de arte geek).
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Escribe una regla para J.A.R.V.I.S. (ej: 'No ofrecer descuentos mayores al 10% sin autorización')"
              value={newDirectiveText}
              onChange={(e) => setNewDirectiveText(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.88rem' }}
            />
            <button onClick={handleAddDirective} className="btn-cyan" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>Agregar</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(knowledgeData.ownerDirectives || []).map((dir, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>{dir}</span>
                </div>
                <button onClick={() => handleRemoveDirective(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: API KEY & MEMORY BACKUP */}
      {jarvisSubTab === 'apikey' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Key size={22} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Conexión con Google Gemini API
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Conecta tu clave de Google Gemini para potenciar el razonamiento cognitivo de J.A.R.V.I.S. con el modelo de alta velocidad <strong>Gemini 2.5 Flash</strong>.
            </p>

            <form onSubmit={handleSaveGeminiKey} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                style={{ flex: '1 1 280px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn-cyan" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                <Save size={15} />
                <span>Guardar Clave</span>
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              Copia de Seguridad de Memoria de J.A.R.V.I.S.
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Exporta o restaura todos los documentos, directivas, imágenes y configuración de entrenamiento de J.A.R.V.I.S.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={exportJarvisMemoryAsJSON} className="btn-cyan" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                <Download size={15} />
                <span>Descargar Memoria JSON</span>
              </button>
              <input type="file" ref={jarvisMemoryInputRef} onChange={handleImportJarvisMemory} accept=".json" style={{ display: 'none' }} />
              <button onClick={() => jarvisMemoryInputRef.current?.click()} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                <Upload size={15} />
                <span>Restaurar Memoria JSON</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* DOCUMENT MODAL */}
      {showDocModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 4, 10, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '680px',
            width: '100%',
            padding: '28px',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  {docModalId ? 'Editar Documento de Conocimiento' : 'Nuevo Documento de Conocimiento'}
                </h3>
              </div>
              <button onClick={() => setShowDocModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Título del Documento:
                </label>
                <input
                  type="text"
                  placeholder="ej: Tiempos de Entrega Departamentales"
                  value={docTitleInput}
                  onChange={(e) => setDocTitleInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Categoría:
                </label>
                <select
                  value={docCategoryInput}
                  onChange={(e) => setDocCategoryInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0a101f', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Eventos">Eventos, Ferias y Convenciones</option>
                  <option value="Políticas">Políticas y Garantías</option>
                  <option value="Logística">Logística y Envíos</option>
                  <option value="Instalación">Instalación y Montaje</option>
                  <option value="Producción">Producción y Materiales</option>
                  <option value="Promociones">Promociones y Descuentos</option>
                  <option value="Franquicias">Historias y Franquicias</option>
                  <option value="General">General / FAQs</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Contenido Detallado:
                </label>
                <textarea
                  rows={6}
                  placeholder="Escribe la información detallada, preguntas frecuentes, reglas o instrucciones..."
                  value={docContentInput}
                  onChange={(e) => setDocContentInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowDocModal(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveDoc} className="btn-cyan" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                <Save size={15} />
                <span>Guardar Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
