import https from 'https';

function testPrompt(prompt, history = []) {
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

async function run() {
  console.log('Testing "eventos proximos"...');
  const r1 = await testPrompt('eventos proximos', []);
  console.log('R1 poweredBy:', r1.data?.poweredBy);
  console.log('R1 text:', r1.data?.replyText);

  console.log('\nTesting "y el fan fest?" with history...');
  const r2 = await testPrompt('y el fan fest?', [
    { sender: 'user', text: 'eventos proximos' },
    { sender: 'jarvis', text: r1.data?.replyText || 'Stand en Centranorte' }
  ]);
  console.log('R2 poweredBy:', r2.data?.poweredBy);
  console.log('R2 text:', r2.data?.replyText);
}

run();
