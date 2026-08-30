import https from 'https';

function postChat(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request('https://decovintage.online/api/jarvis/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
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
  console.log("=== Turn 1: User introduces himself and asks about Fan Fest ===");
  const t1 = await postChat({
    prompt: "Hola, me llamo Carlos y quiero saber sobre el Fan Fest Guatemala",
    history: [
      { sender: 'bot', text: '¡Hola! 👋 Soy J.A.R.V.I.S., tu asesor de arte y decoración en Deco Vintage Guate.' }
    ]
  });
  console.log("T1 Status:", t1.status);
  console.log("T1 PoweredBy:", t1.data?.poweredBy || 'LOCAL FALLBACK');
  console.log("T1 Reply:", t1.data?.replyText?.substring(0, 150));

  console.log("\n=== Turn 2: User asks who is the special guest (Testing memory & document context) ===");
  const t2 = await postChat({
    prompt: "¿Quién es el invitado especial que mencionaste y a qué personaje le da voz?",
    history: [
      { sender: 'bot', text: '¡Hola! 👋 Soy J.A.R.V.I.S.' },
      { sender: 'user', text: "Hola, me llamo Carlos y quiero saber sobre el Fan Fest Guatemala" },
      { sender: 'bot', text: t1.data?.replyText || "El evento será el 6 de septiembre..." }
    ]
  });
  console.log("T2 Status:", t2.status);
  console.log("T2 PoweredBy:", t2.data?.poweredBy || 'LOCAL FALLBACK');
  console.log("T2 Reply:", t2.data?.replyText?.substring(0, 150));

  console.log("\n=== Turn 3: User asks for posters of anime or autos ===");
  const t3 = await postChat({
    prompt: "Muéstrame qué opciones tienes de anime para llevar a que me lo firmen",
    history: [
      { sender: 'bot', text: '¡Hola! 👋 Soy J.A.R.V.I.S.' },
      { sender: 'user', text: "Hola, me llamo Carlos y quiero saber sobre el Fan Fest Guatemala" },
      { sender: 'bot', text: t1.data?.replyText || "El evento será el 6 de septiembre..." },
      { sender: 'user', text: "¿Quién es el invitado especial que mencionaste?" },
      { sender: 'bot', text: t2.data?.replyText || "Rodo Balderas..." }
    ]
  });
  console.log("T3 Status:", t3.status);
  console.log("T3 PoweredBy:", t3.data?.poweredBy || 'LOCAL FALLBACK');
  console.log("T3 Reply:", t3.data?.replyText?.substring(0, 150));
  console.log("T3 Actions:", JSON.stringify(t3.data?.actions));
}

run().catch(console.error);
