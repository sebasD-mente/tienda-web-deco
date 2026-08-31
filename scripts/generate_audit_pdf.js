import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de Arquitectura Staff & Auditoría de Ciberseguridad - Deco Vintage Guate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 1.4cm 1.2cm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.55;
      font-size: 9.5pt;
    }

    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
      color: #ffffff;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 22px;
      box-shadow: 0 4px 15px rgba(15, 23, 42, 0.15);
      border-left: 6px solid #6366f1;
    }

    .header-tag {
      display: inline-block;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(165, 180, 252, 0.4);
      color: #c7d2fe;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
    }

    .header-title {
      font-size: 19pt;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      color: #ffffff;
    }

    .header-subtitle {
      font-size: 11pt;
      color: #cbd5e1;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 12px;
    }

    .meta-item {
      font-size: 8pt;
    }

    .meta-label {
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      font-size: 6.8pt;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .meta-value {
      color: #f8fafc;
      font-weight: 600;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      break-after: avoid;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 14px;
      margin-bottom: 6px;
      break-after: avoid;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
    }

    /* Summary Card */
    .executive-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 18px;
      border-left: 4px solid #3b82f6;
    }

    .executive-card p {
      margin-bottom: 6px;
      font-size: 9pt;
    }
    .executive-card p:last-child {
      margin-bottom: 0;
    }

    /* Strengths List */
    .strength-item {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 9px;
      break-inside: avoid;
    }

    .strength-title {
      font-weight: 700;
      color: #15803d;
      font-size: 9pt;
      margin-bottom: 3px;
    }

    .strength-desc {
      font-size: 8.5pt;
      color: #166534;
    }

    /* Red Critical Vulns */
    .vuln-card {
      background: #fff;
      border: 1px solid #fecaca;
      border-left: 5px solid #dc2626;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 14px;
      break-inside: avoid;
      box-shadow: 0 2px 5px rgba(220, 38, 38, 0.04);
    }

    .vuln-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      border-bottom: 1px solid #fee2e2;
      padding-bottom: 5px;
    }

    .vuln-title {
      font-weight: 800;
      color: #991b1b;
      font-size: 9.5pt;
    }

    .vuln-badge {
      background: #fee2e2;
      color: #991b1b;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .vuln-meta {
      font-size: 7.8pt;
      color: #64748b;
      margin-bottom: 8px;
    }

    .vuln-meta span {
      font-family: 'JetBrains Mono', monospace;
      color: #0f172a;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 6px 0;
      overflow-x: hidden;
      line-height: 1.45;
      border: 1px solid #334155;
    }

    .code-red {
      color: #f87171;
    }
    .code-green {
      color: #4ade80;
    }
    .code-comment {
      color: #94a3b8;
    }

    .vuln-impact {
      font-size: 8.5pt;
      color: #7f1d1d;
      background: #fff5f5;
      padding: 6px 10px;
      border-radius: 4px;
      margin-top: 6px;
      margin-bottom: 6px;
    }

    .vuln-fix {
      font-size: 8.5pt;
      color: #14532d;
      background: #f0fdf4;
      padding: 6px 10px;
      border-radius: 4px;
      margin-top: 6px;
    }

    /* Tables */
    .table-container {
      margin: 12px 0 16px 0;
      break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 7px 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    th:first-child {
      border-top-left-radius: 6px;
    }
    th:last-child {
      border-top-right-radius: 6px;
    }

    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-prio-high {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 6.8pt;
    }

    .badge-prio-med {
      background: #fef3c7;
      color: #b45309;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 6.8pt;
    }

    .badge-prio-low {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 6.8pt;
    }

    /* Roadmap Step */
    .step-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      break-inside: avoid;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .step-1 { border-left: 5px solid #ef4444; }
    .step-2 { border-left: 5px solid #f59e0b; }
    .step-3 { border-left: 5px solid #10b981; }

    .step-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
    }

    .step-timeline {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 12px;
    }

    .step-1 .step-timeline { background: #fee2e2; color: #991b1b; }
    .step-2 .step-timeline { background: #fef3c7; color: #92400e; }
    .step-3 .step-timeline { background: #d1fae5; color: #065f46; }

    .step-desc {
      font-size: 8.5pt;
      color: #475569;
      margin-bottom: 6px;
    }

    .step-actions {
      font-size: 8pt;
      color: #334155;
      padding-left: 18px;
    }

    .step-actions li {
      margin-bottom: 4px;
    }

    /* Scorecard Table */
    .scorecard {
      margin-top: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .score-high { color: #16a34a; font-weight: 800; font-size: 9pt; }
    .score-med  { color: #d97706; font-weight: 800; font-size: 9pt; }
    .score-low  { color: #dc2626; font-weight: 800; font-size: 9pt; }

    .footer-note {
      margin-top: 24px;
      padding: 12px 16px;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 8pt;
      color: #475569;
      text-align: center;
      border: 1px solid #e2e8f0;
      break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
    }

    .diagram-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin: 10px 0 14px 0;
      text-align: center;
      break-inside: avoid;
    }

    .diagram-svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div class="header-tag">Auditoría Técnica Staff & Resiliencia Operativa</div>
    <div class="header-title">🏛️ INFORME DE ARQUITECTURA & CIBERSEGURIDAD</div>
    <div class="header-subtitle">Radiografía Estructural, Vulnerabilidades OWASP y Plan de Madurez Empresarial</div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Proyecto</div>
        <div class="meta-value">Deco Vintage Guate (Deko Labs)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Evaluador</div>
        <div class="meta-value">Staff Architect & AppSec Lead</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Entorno</div>
        <div class="meta-value">Producción (decovintage.online)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Fecha</div>
        <div class="meta-value">31 de Agosto, 2026</div>
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <h2>1. 📋 Resumen Ejecutivo (Executive Summary)</h2>
  <div class="executive-card">
    <p><strong>Estado Operativo:</strong> El proyecto ha alcanzado una etapa de <strong>estabilidad operativa básica</strong> tras superar el hito crítico de compatibilidad en librerías nativas C++ (<code>glibc 2.36</code> y <code>libvips42</code> en Docker), estructurar la persistencia relacional con PostgreSQL vía Prisma ORM y estabilizar el fallback de la Single Page Application (SPA).</p>
    <p><strong>Diagnóstico Arquitectónico:</strong> Sin embargo, el sistema opera actualmente bajo una <strong>Arquitectura de Transición con Cerebro Dividido (Split-Brain)</strong>. Coexisten fallbacks inseguros de credenciales maestras, comparaciones criptográficas vulnerables a <em>Side-Channel Timing Attacks</em>, operaciones de I/O síncronas bloqueantes en el Event Loop de Node.js, exposición DoS por límites desproporcionados de JSON (60MB) y almacenamiento de medios acoplado al disco local, lo que viola el Factor VI de <em>The 12-Factor App</em> e impide el escalado horizontal.</p>
  </div>

  <!-- DIAGRAM: TOPOLOGY & BOTTLENECK MAP -->
  <div class="diagram-box">
    <svg class="diagram-svg" viewBox="0 0 740 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
        <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      
      <!-- Box Client -->
      <rect x="10" y="60" width="110" height="55" rx="6" fill="url(#gradDark)" />
      <text x="65" y="85" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Cliente / Web</text>
      <text x="65" y="100" fill="#94a3b8" font-size="8" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">React + Vite</text>
      
      <!-- Arrow 1 -->
      <path d="M 120 87 L 160 87" stroke="#6366f1" stroke-width="2" />
      
      <!-- Box Server -->
      <rect x="165" y="25" width="200" height="130" rx="8" fill="#f8fafc" stroke="#6366f1" stroke-width="2" />
      <text x="265" y="45" fill="#0f172a" font-size="10" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Node.js Express Gateway</text>
      
      <rect x="175" y="55" width="180" height="22" rx="4" fill="#fee2e2" stroke="#f87171" stroke-width="1" />
      <text x="265" y="70" fill="#991b1b" font-size="7.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">🔴 CORS origin:true | 60MB Body DoS</text>
      
      <rect x="175" y="82" width="180" height="22" rx="4" fill="#fee2e2" stroke="#f87171" stroke-width="1" />
      <text x="265" y="97" fill="#991b1b" font-size="7.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">🔴 Auth: Timing Attack & Hardcoded Secret</text>

      <rect x="175" y="109" width="180" height="22" rx="4" fill="#fee2e2" stroke="#f87171" stroke-width="1" />
      <text x="265" y="124" fill="#991b1b" font-size="7.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">🔴 Event Loop Sync Block: saveCatalog()</text>

      <!-- Arrows from Server to Storage & AI -->
      <path d="M 365 55 L 430 40" stroke="#059669" stroke-width="1.5" />
      <path d="M 365 90 L 430 90" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3" />
      <path d="M 365 125 L 430 140" stroke="#d97706" stroke-width="1.5" />

      <!-- PostgreSQL Box -->
      <rect x="435" y="15" width="140" height="48" rx="6" fill="url(#gradGreen)" />
      <text x="505" y="36" fill="#fff" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">PostgreSQL (Prisma)</text>
      <text x="505" y="50" fill="#a7f3d0" font-size="7.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Estado Relacional Limpio</text>

      <!-- JSON Split Brain Box -->
      <rect x="435" y="68" width="140" height="48" rx="6" fill="url(#gradRed)" />
      <text x="505" y="89" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">catalogStore.json</text>
      <text x="505" y="103" fill="#fecaca" font-size="7.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Split-Brain & Sync IO ⚠️</text>

      <!-- J.A.R.V.I.S. Box -->
      <rect x="435" y="122" width="140" height="48" rx="6" fill="#4338ca" />
      <text x="505" y="142" fill="#fff" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">J.A.R.V.I.S. AI Engine</text>
      <text x="505" y="156" fill="#c7d2fe" font-size="7.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Full Catalog Bloat: 20k tokens</text>

      <!-- VPS Disk Box -->
      <rect x="600" y="45" width="130" height="90" rx="6" fill="#334155" />
      <text x="665" y="70" fill="#fff" font-size="8.5" font-weight="bold" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">VPS Hostinger Disk</text>
      <text x="665" y="85" fill="#94a3b8" font-size="7.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">/app/data (SSD)</text>
      <text x="665" y="98" fill="#94a3b8" font-size="7.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">/app/public/uploads</text>
      <text x="665" y="115" fill="#fca5a5" font-size="7" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">Violación 12-Factor VI</text>
    </svg>
  </div>

  <!-- STRENGTHS -->
  <h2>2. 🛡️ Fortalezas Arquitectónicas Identificadas</h2>
  
  <div class="strength-item">
    <div class="strength-title">1. Aislamiento Multi-Etapa en Docker con Paridad de Toolchains (glibc / OpenSSL)</div>
    <div class="strength-desc">El uso unificado de <code>node:20-bookworm-slim</code> en ambas etapas (<code>build</code> y <code>production</code>) garantiza que los binarios nativos C++ compilados por <code>sharp</code> y el motor de consultas de Prisma compartan exactamente <code>glibc 2.36</code> y <code>OpenSSL 3.0.x</code>, erradicando fallos fatales de <code>dlopen()</code> en el inicio del contenedor.</div>
  </div>

  <div class="strength-item">
    <div class="strength-title">2. Modelado Relacional Tipado e Integridad Referencial en Prisma</div>
    <div class="strength-desc">El esquema en <code>prisma/schema.prisma</code> implementa tipos <code>Decimal(10,2)</code> para evitar distorsiones de punto flotante de JS en moneda, eliminación en cascada (<code>onDelete: Cascade</code> en <code>PosterSize</code>) e índices compuestos (<code>@@unique([posterId, sizeId])</code>) que previenen registros huérfanos.</div>
  </div>

  <div class="strength-item">
    <div class="strength-title">3. Failover Resiliente en Cascada del Motor de IA (J.A.R.V.I.S.)</div>
    <div class="strength-desc">La arquitectura en <code>services/jarvisService.js</code> implementa una degradación ordenada: primero consulta el SDK moderno <code>@google/genai</code> con rotación de claves/modelos, conmuta a Google Cloud Vertex AI REST y finalmente cae a un motor heurístico local offline, garantizando disponibilidad continua del chat.</div>
  </div>

  <div class="strength-item">
    <div class="strength-title">4. Capa Anti-Corrupción / Patrón Adaptador en Dominio</div>
    <div class="strength-desc">La función <code>formatPosterForClient</code> en <code>catalogService.js</code> desacopla la normalización de la base de datos (con nombres canónicos en español) respecto a las propiedades consumidas por los componentes React (en inglés), permitiendo refactorizaciones sin alterar contratos del frontend.</div>
  </div>

  <div class="strength-item">
    <div class="strength-title">5. Estrategia de Entrega y Caché HTTP Diferenciada</div>
    <div class="strength-desc">En <code>server.js</code> se configuran cabeceras inmutables (<code>maxAge: 1y</code>) para assets estáticos con hash y desactivación estricta de caché (<code>no-cache, no-store</code>) para el archivo <code>index.html</code> de la SPA, evitando que los usuarios finales queden atrapados en versiones obsoletas tras un despliegue.</div>
  </div>

  <div class="page-break"></div>

  <!-- CRITICAL VULNERABILITIES -->
  <h2>3. 🚨 Deuda Técnica Crítica (Nivel Rojo — Riesgo de Intrusión o Quiebre)</h2>

  <!-- CRIT-01 -->
  <div class="vuln-card">
    <div class="vuln-header">
      <div class="vuln-title">🔴 CRIT-01: Credenciales y Claves Maestras Hardcodeadas con Fallback Inseguro</div>
      <div class="vuln-badge">CWE-798 / OWASP A07</div>
    </div>
    <div class="vuln-meta">Ubicación: <span>middleware/auth.js:10-12</span> | Severidad: <span>CRÍTICA (CVSS 9.1)</span></div>
    
    <div class="code-block">
      <span class="code-comment">// CÓDIGO VULNERABLE ACTUAL:</span><br>
      <span class="code-red">const ADMIN_USER  = process.env.ADMIN_USER     || 'SebasDmente';</span><br>
      <span class="code-red">const ADMIN_PASS  = process.env.ADMIN_PASSWORD || '4214294880101';</span><br>
      <span class="code-red">const AUTH_SECRET = process.env.ADMIN_SECRET   || 'deco_vintage_guate_secret_2026_master_key';</span>
    </div>

    <div class="vuln-impact">
      <strong>💥 Vector de Explotación & Impacto:</strong> Si un despliegue en Dokploy omite las variables de entorno o la configuración se corrompe en el VPS, el servidor adopta silenciosamente credenciales conocidas públicamente en el repositorio. Un atacante puede generar firmas HMAC válidas y tomar control administrativo completo de la plataforma.
    </div>

    <div class="vuln-fix">
      <strong>🛡️ Remediación Mandatoria (Fail-Fast):</strong> Abortar el proceso al arrancar (<code>process.exit(1)</code>) si las variables requeridas no están definidas en el entorno. Prohibir totalmente fallbacks por defecto en código fuente.
    </div>
  </div>

  <!-- CRIT-02 -->
  <div class="vuln-card">
    <div class="vuln-header">
      <div class="vuln-title">🔴 CRIT-02: Vulnerabilidad a Timing Attacks en Verificación HMAC</div>
      <div class="vuln-badge">CWE-208 / OWASP A02</div>
    </div>
    <div class="vuln-meta">Ubicación: <span>middleware/auth.js:44</span> | Severidad: <span>ALTA (CVSS 7.4)</span></div>
    
    <div class="code-block">
      <span class="code-comment">// CÓDIGO VULNERABLE:</span><br>
      <span class="code-red">if (sig !== expectedSig) return false;</span><br><br>
      <span class="code-comment">// REMEDIACIÓN CRIPTOGRÁFICA EN TIEMPO CONSTANTE:</span><br>
      <span class="code-green">const sigBuf = Buffer.from(sig, 'hex');</span><br>
      <span class="code-green">const expBuf = Buffer.from(expectedSig, 'hex');</span><br>
      <span class="code-green">if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;</span>
    </div>

    <div class="vuln-impact">
      <strong>💥 Vector de Explotación:</strong> La comparación estándar <code>!==</code> en el motor V8 se detiene en el primer byte diferente. Mediante análisis estadístico de microsegundos de respuesta HTTP (<em>Side-Channel Timing Attack</em>), un atacante puede deducir la firma HMAC carácter por carácter.
    </div>
  </div>

  <!-- CRIT-03 -->
  <div class="vuln-card">
    <div class="vuln-header">
      <div class="vuln-title">🔴 CRIT-03: Persistencia Dual ("Split-Brain") y Bloqueos Síncronos del Event Loop</div>
      <div class="vuln-badge">Arquitectura Antipatrón / DoS</div>
    </div>
    <div class="vuln-meta">Ubicación: <span>services/catalogService.js:454-478</span> | Severidad: <span>ALTA (Disponibilidad)</span></div>
    
    <div class="code-block">
      <span class="code-comment">// CÓDIGO BLOQUEANTE EN EL EVENT LOOP:</span><br>
      <span class="code-red">export function saveCatalog(dataObject) {</span><br>
      <span class="code-red">&nbsp;&nbsp;fs.writeFileSync(tmpFile, JSON.stringify(dataObject, null, 2), 'utf-8');</span><br>
      <span class="code-red">&nbsp;&nbsp;fs.renameSync(tmpFile, CATALOG_FILE);</span><br>
      <span class="code-red">}</span>
    </div>

    <div class="vuln-impact">
      <strong>💥 Impacto en Rendimiento:</strong> Coexisten dos fuentes de verdad (PostgreSQL y <code>catalogStore.json</code>). Las llamadas síncronas <code>fs.writeFileSync</code> y <code>fs.renameSync</code> congelan el Event Loop en el hilo principal de Node.js. Peticiones concurrentes de clientes (consultas de catálogo, chats con J.A.R.V.I.S., pagos) quedan encoladas provocando picos de latencia de varios segundos y errores <code>504 Gateway Timeout</code>.
    </div>
  </div>

  <!-- CRIT-04 -->
  <div class="vuln-card">
    <div class="vuln-header">
      <div class="vuln-title">🔴 CRIT-04: CORS Universal con Credentials y Límite Global de 60 MB (Riesgo DoS por OOM)</div>
      <div class="vuln-badge">OWASP A05:2021 / CWE-400</div>
    </div>
    <div class="vuln-meta">Ubicación: <span>server.js:51-55</span> | Severidad: <span>ALTA (CVSS 7.5)</span></div>
    
    <div class="code-block">
      <span class="code-red">app.use(cors({ origin: true, credentials: true }));</span><br>
      <span class="code-red">app.use(express.json({ limit: '60mb' }));</span><br>
      <span class="code-red">app.use(express.urlencoded({ extended: true, limit: '60mb' }));</span>
    </div>

    <div class="vuln-impact">
      <strong>💥 Impacto:</strong> <code>origin: true</code> refleja cualquier origen atacante con cabeceras de credenciales. Permitir <code>60mb</code> en el parser global de JSON permite a un atacante enviar payloads masivos a endpoints de consulta ligera, saturando la memoria Heap del proceso hasta provocar el cierre por <em>Out-Of-Memory (OOM Killer)</em> en el VPS.
    </div>
  </div>

  <!-- CRIT-05 -->
  <div class="vuln-card">
    <div class="vuln-header">
      <div class="vuln-title">🔴 CRIT-05: Inyección Directa de Prompts y Sobrecarga Masiva de Contexto en J.A.R.V.I.S.</div>
      <div class="vuln-badge">OWASP Top 10 for LLM (LLM01/LLM04)</div>
    </div>
    <div class="vuln-meta">Ubicación: <span>services/jarvisService.js:332-374</span> | Severidad: <span>MEDIA / ALTA (Costos & Latencia)</span></div>

    <div class="vuln-impact">
      <strong>💥 Impacto:</strong> El catálogo completo (44+ posters con todos sus metadatos) se inyecta en el <code>systemInstruction</code> en cada turno de chat. Con un catálogo creciente, cada mensaje consumirá más de 20,000 tokens de entrada, elevando la latencia a más de 4 segundos y multiplicando los costos de cuota de API. Además, el input del cliente no cuenta con delimitación semántica estricta contra inyecciones de instrucciones.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- AREAS OF IMPROVEMENT -->
  <h2>4. ⚠️ Áreas de Mejora (Nivel Amarillo — Hacia Grado Empresarial)</h2>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Dimensión</th>
          <th>Estado Actual</th>
          <th>Estado Objetivo (Grado Empresarial)</th>
          <th>Prioridad</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Almacenamiento de Medios</strong></td>
          <td>Archivos locales en <code>/app/public/posters/uploads</code></td>
          <td>Object Storage (S3 / Cloudflare R2) vía Presigned URLs</td>
          <td><span class="badge-prio-high">ALTA (12-Factor VI)</span></td>
        </tr>
        <tr>
          <td><strong>Cabeceras de Seguridad HTTP</strong></td>
          <td>Ausentes (solo compresión Gzip)</td>
          <td>Middleware <code>helmet</code> (CSP, HSTS, X-Frame-Options)</td>
          <td><span class="badge-prio-high">ALTA (OWASP A05)</span></td>
        </tr>
        <tr>
          <td><strong>Rate Limiting</strong></td>
          <td><code>Map</code> in-memory sin TTL ni desalojo</td>
          <td>Token Bucket en Redis o Gateway (Traefik / Nginx)</td>
          <td><span class="badge-prio-med">MEDIA (Mem Leak)</span></td>
        </tr>
        <tr>
          <td><strong>Paginación de API Pública</strong></td>
          <td><code>getAllPosters()</code> vuelca toda la base de datos</td>
          <td>Paginación basada en cursores (<code>cursor</code>, <code>take</code>)</td>
          <td><span class="badge-prio-med">MEDIA (LCP / INP)</span></td>
        </tr>
        <tr>
          <td><strong>Validación de Esquemas</strong></td>
          <td>Validaciones manuales en controladores</td>
          <td>Validación declarativa con Zod schemas</td>
          <td><span class="badge-prio-med">MEDIA (Data Quality)</span></td>
        </tr>
        <tr>
          <td><strong>Seguridad de Contenedores</strong></td>
          <td>Ejecución bajo usuario <code>root</code> en Docker</td>
          <td>Usuario no privilegiado <code>USER node</code> en Dockerfile</td>
          <td><span class="badge-prio-high">ALTA (Container Sec)</span></td>
        </tr>
        <tr>
          <td><strong>Observabilidad y Logs</strong></td>
          <td><code>console.log</code> sin estructurar</td>
          <td>Structured JSON Logging con <code>pino</code> + Request ID</td>
          <td><span class="badge-prio-low">BAJA (DevOps)</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p><strong>Detalle de Puntos Arquitectónicos Clave:</strong></p>
  <ul style="padding-left: 20px; font-size: 8.5pt; color: #334155; margin-bottom: 12px;">
    <li><strong>Violación del Factor VI (12-Factor App - Procesos sin Estado):</strong> Al almacenar las imágenes en el disco local del VPS, no es posible levantar 2 réplicas del backend en Dokploy para balancear carga, ya que la réplica B no tendrá acceso a los archivos subidos en la réplica A.</li>
    <li><strong>Fuga de Memoria en Rate Limiting:</strong> En <code>middleware/rateLimit.js</code>, el objeto <code>new Map()</code> acumula direcciones IP indefinidamente sin un mecanismo de recolección de basura o TTL, lo que genera un crecimiento lineal de memoria heap bajo tráfico masivo.</li>
  </ul>

  <!-- ROADMAP -->
  <h2>5. 🗺️ Roadmap Estratégico de Madurez (3 Fases Exactas)</h2>

  <!-- Step 1 -->
  <div class="step-card step-1">
    <div class="step-header">
      <div class="step-title">🎯 PASO 1 (Inmediato — Próximas 24 a 48h): Blindaje Zero-Trust</div>
      <div class="step-timeline">Sprint Inmediato</div>
    </div>
    <div class="step-desc">Cerrar vectores de ataque directo, vulnerabilidades OWASP y fugas de memoria sin alterar contratos de frontend.</div>
    <ul class="step-actions">
      <li><strong>Instalar y activar Helmet:</strong> Proteger cabeceras HTTP (<code>Content-Security-Policy</code>, <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code>).</li>
      <li><strong>Restringir CORS y Body Limits:</strong> Limitar orígenes estrictamente a <code>https://decovintage.online</code> y reducir el límite global de JSON a <code>2mb</code>.</li>
      <li><strong>Manejo Seguro de Secretos (Fail-Fast):</strong> Abortar el arranque si faltan <code>ADMIN_SECRET</code> o <code>ADMIN_PASSWORD</code>; aplicar <code>crypto.timingSafeEqual</code> en la verificación de tokens.</li>
      <li><strong>Contenedor Non-Root:</strong> Agregar la directiva <code>USER node</code> en el <code>Dockerfile</code>.</li>
    </ul>
  </div>

  <!-- Step 2 -->
  <div class="step-card step-2">
    <div class="step-header">
      <div class="step-title">🎯 PASO 2 (Medio Plazo — Sprint 2): Purga de Split-Brain y Paginación</div>
      <div class="step-timeline">Sprint de Consolidación</div>
    </div>
    <div class="step-desc">Consolidar una única fuente de verdad en PostgreSQL y liberar el Event Loop de operaciones síncronas.</div>
    <ul class="step-actions">
      <li><strong>Eliminación de <code>catalogStore.json</code>:</strong> Migrar entidades <code>Category</code> y <code>StoreSettings</code> a modelos formales en <code>schema.prisma</code> y eliminar todos los métodos <code>fs.*Sync</code>.</li>
      <li><strong>Paginación Cursor-Based en Prisma:</strong> Implementar parámetros <code>cursor</code> y <code>take</code> en <code>/api/catalog/posters</code> para optimizar la carga del catálogo y mejorar métricas Core Web Vitals (LCP/INP).</li>
      <li><strong>Validación con Zod:</strong> Centralizar la validación de payloads de entrada en controladores.</li>
    </ul>
  </div>

  <!-- Step 3 -->
  <div class="step-card step-3">
    <div class="step-header">
      <div class="step-title">🎯 PASO 3 (Escala & Eficiencia — Sprint 3): Desacoplamiento de Medios y RAG en IA</div>
      <div class="step-timeline">Sprint de Escala</div>
    </div>
    <div class="step-desc">Habilitar el escalado horizontal multi-instancia y reducir el consumo de tokens en un 85%.</div>
    <ul class="step-actions">
      <li><strong>Object Storage (Cloudflare R2 / S3):</strong> Subida de imágenes vía URLs prefirmadas (Presigned URLs) desacoplando el almacenamiento de medios del VPS.</li>
      <li><strong>Arquitectura RAG / Semantic Filtering en J.A.R.V.I.S.:</strong> Remover el volcado estático del catálogo del system prompt; utilizar la herramienta <code>explorar_catalogo</code> con búsqueda contextual inyectando únicamente las 3 a 5 obras relevantes por turno conversacional.</li>
      <li><strong>Rate Limiting Distribuido:</strong> Reemplazar el <code>Map</code> local por Redis para compartir contadores entre instancias del backend.</li>
    </ul>
  </div>

  <!-- SCORECARD -->
  <h2>6. 📊 Calificación de Arquitectura y Veredicto</h2>

  <div class="scorecard">
    <table>
      <thead>
        <tr>
          <th>Dimensión Evaluada</th>
          <th>Calificación</th>
          <th>Estado</th>
          <th>Dictamen Técnico</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Integridad de Datos y Persistencia</strong></td>
          <td><span class="score-high">8.5 / 10</span></td>
          <td>🟡 Sólido</td>
          <td>Prisma garantiza consistencia relacional; pendiente eliminar el archivo JSON legacy.</td>
        </tr>
        <tr>
          <td><strong>Seguridad de Aplicación (AppSec)</strong></td>
          <td><span class="score-low">4.0 / 10</span></td>
          <td>🔴 Crítico</td>
          <td>Fallbacks de claves en claro, timing attacks y CORS permisivo requieren parche inmediato.</td>
        </tr>
        <tr>
          <td><strong>Resiliencia del Event Loop & I/O</strong></td>
          <td><span class="score-med">5.5 / 10</span></td>
          <td>🟡 Regular</td>
          <td>I/O síncrono en disco y body limits masivos comprometen la concurrencia.</td>
        </tr>
        <tr>
          <td><strong>Eficiencia del Motor de IA (J.A.R.V.I.S.)</strong></td>
          <td><span class="score-med">6.0 / 10</span></td>
          <td>🟡 Funcional</td>
          <td>Excelente cascada de fallback, pero sufre de sobrecarga de tokens y costo evitable.</td>
        </tr>
        <tr>
          <td><strong>Alineación con The 12-Factor App</strong></td>
          <td><span class="score-med">5.0 / 10</span></td>
          <td>🟡 En Transición</td>
          <td>Almacenamiento de imágenes local en disco bloquea el escalado horizontal.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-note">
    <strong>Dictamen Staff:</strong> La arquitectura construida cuenta con cimientos modernos y viables. Ejecutando el <strong>Paso 1 (Seguridad Zero-Trust)</strong> y la <strong>Purga del Split-Brain (Paso 2)</strong>, el sistema alcanzará la madurez y resiliencia requeridas para operar a nivel corporativo de alta disponibilidad.
  </div>

</body>
</html>
`;

const htmlFilePath = path.resolve('scripts/reporte_auditoria.html');
const pdfFilePath = path.resolve('INFORME_ARQUITECTURA_Y_CIBERSEGURIDAD_DECO_VINTAGE.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
console.log('HTML generado con éxito en:', htmlFilePath);

// Convert to PDF using Headless Chrome / Edge
const edgePath = "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe";
const chromePath = "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe";
const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('Utilizando motor de renderizado:', browserBin);

try {
  const cmd = `"${browserBin}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "file://${htmlFilePath.replace(/\\\\/g, '/')}"`;
  console.log('Ejecutando comando de compilación PDF...');
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ PDF generado exitosamente en:', pdfFilePath);
} catch (err) {
  console.error('Error generando PDF:', err.message);
  process.exit(1);
}
