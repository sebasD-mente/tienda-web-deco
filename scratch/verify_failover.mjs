import https from 'https';

function testQuery(prompt, badKey = '') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt, history: [] });
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (badKey) headers['x-gemini-key'] = badKey;

    const req = https.request({
      hostname: 'decovintage.online',
      port: 443,
      path: '/api/jarvis/chat',
      method: 'POST',
      headers,
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

async function verifyAll() {
  console.log('=== VERIFYING LIVE VPS PROD DEPLOYMENT ===\n');

  console.log('1. Testing autos query WITH LEAKED/BAD HEADER to verify failover...');
  const r1 = await testQuery('Recomiéndame los mejores cuadros de autos', 'AIzaSyD0nwBADTESTKEY');
  console.log('Status:', r1.status);
  console.log('Powered By:', r1.data?.poweredBy);
  console.log('Reply preview:', r1.data?.replyText?.slice(0, 180));
  console.log('--------------------------------------------------\n');

  console.log('2. Testing materiales y cinta Tesa query...');
  const r2 = await testQuery('¿Cómo es la calidad de los materiales y cómo se coloca con la cinta Tesa?');
  console.log('Status:', r2.status);
  console.log('Powered By:', r2.data?.poweredBy);
  console.log('Reply preview:', r2.data?.replyText?.slice(0, 180));
  console.log('--------------------------------------------------\n');

  console.log('3. Testing precios y medidas oficiales query...');
  const r3 = await testQuery('¿Cuáles son los precios y medidas oficiales de los cuadros?');
  console.log('Status:', r3.status);
  console.log('Powered By:', r3.data?.poweredBy);
  console.log('Reply preview:', r3.data?.replyText?.slice(0, 180));
  console.log('--------------------------------------------------\n');
}

verifyAll().catch(console.error);
