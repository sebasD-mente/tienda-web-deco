import https from 'https';

function testWithBadKey() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ prompt: 'Recomiéndame cuadros de autos', history: [] });
    const req = https.request({
      hostname: 'decovintage.online',
      port: 443,
      path: '/api/jarvis/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-gemini-key': 'AIzaSyD0nwBADKEYFORTEST'
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

async function loop() {
  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}...`);
    const r = await testWithBadKey();
    console.log('poweredBy:', r.data?.poweredBy);
    console.log('reply snippet:', r.data?.replyText?.slice(0, 120));
    if (r.data?.poweredBy && r.data.poweredBy.includes('Google Gemini')) {
      console.log('🎉 SUCCESS! Commit 0b4e147 is LIVE with auto-failover working!');
      break;
    }
    await new Promise(res => setTimeout(res, 5000));
  }
}

loop();
