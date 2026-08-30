import https from 'https';

function queryWithHistory(history, prompt) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ prompt, history });
    const req = https.request({
      hostname: 'decovintage.online',
      port: 443,
      path: '/api/jarvis/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      family: 4
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(data);
    req.end();
  });
}

async function debug() {
  const h1 = [
    { sender: 'user', text: 'eventos proximos' },
    { sender: 'jarvis', text: 'Estaremos en el Fan Fest el 6 de septiembre.' }
  ];
  console.log('Test A (Short text in history):');
  const resA = await queryWithHistory(h1, 'y el fan fest?');
  console.log('Result A poweredBy:', resA.data?.poweredBy);
  console.log('Result A reply:', resA.data?.replyText?.slice(0, 150));

  const h2 = [
    { id: 'init-1', sender: 'jarvis', text: '¡Hola! Soy Jarvis' },
    { id: 'u-1', sender: 'user', text: 'eventos proximos' },
    { id: 'j-1', sender: 'jarvis', text: '¡Hola! Qué excelente pregunta. Precisamente tenemos un evento sumamente especial a la vuelta de la esquina. Estaremos participando en el Fan Fest Guatemala este próximo 6 de septiembre en el Parque de la Industria.' }
  ];
  console.log('\nTest B (Realistic frontend history with id, sender):');
  const resB = await queryWithHistory(h2, 'y el fan fest?');
  console.log('Result B poweredBy:', resB.data?.poweredBy);
  console.log('Result B reply:', resB.data?.replyText?.slice(0, 150));
}

debug();
