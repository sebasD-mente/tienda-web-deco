import https from 'https';

function testWithKey(prompt, key) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt, history: [] });
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (key) headers['x-gemini-key'] = key;

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

async function run() {
  console.log('--- Test 1: Without x-gemini-key (Uses server env) ---');
  const res1 = await testWithKey('Recomiendame cuadros de autos', '');
  console.log('Result 1 poweredBy:', res1.data?.poweredBy);
  console.log('Result 1 reply preview:', res1.data?.replyText?.slice(0, 100));

  console.log('\n--- Test 2: With invalid/leaked x-gemini-key (Simulates client localStorage dirty key) ---');
  const res2 = await testWithKey('Recomiendame cuadros de autos', 'AIzaSyD0nwFAKEKEYLEAKED');
  console.log('Result 2 poweredBy:', res2.data?.poweredBy);
  console.log('Result 2 reply preview:', res2.data?.replyText?.slice(0, 100));
}

run().catch(console.error);
