import https from 'https';

function testQuery(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt, history: [] });
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
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing "Recomiéndame los mejores cuadros de autos"...');
  const res1 = await testQuery('Recomiéndame los mejores cuadros de autos');
  console.log('Result 1:', JSON.stringify(res1, null, 2));

  console.log('\nTesting "¿Cómo es la calidad de los materiales y cómo se coloca con la cinta Tesa?"...');
  const res2 = await testQuery('¿Cómo es la calidad de los materiales y cómo se coloca con la cinta Tesa?');
  console.log('Result 2:', JSON.stringify(res2, null, 2));
}

run().catch(console.error);
