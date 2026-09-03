import { GoogleGenAI } from '@google/genai';
import { getJarvisApiKey, JARVIS_TOOL_DECLARATIONS } from '../services/jarvisService.js';

async function main() {
  const key = process.env.GEMINI_API_KEY || getJarvisApiKey();
  console.log('Testing key prefix:', key ? key.substring(0, 10) : 'NO KEY');
  const ai = new GoogleGenAI({ apiKey: key });

  const testModels = [
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash'
  ];

  for (const m of testModels) {
    const start = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: [{ role: 'user', parts: [{ text: 'los del bicho los tenes bro?' }] }],
        config: {
          tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
        }
      });
      const duration = Date.now() - start;
      const fn = res.functionCalls?.[0];
      const text = res.text || '';
      console.log(`[${m}] SUCCESS in ${duration}ms | Tool: ${fn ? fn.name : 'none'} | Args: ${JSON.stringify(fn ? fn.args : {})} | Text: ${text.slice(0, 40)}`);
    } catch (err) {
      console.log(`[${m}] FAILED in ${Date.now() - start}ms | Error: ${err.message?.slice(0, 120)}`);
    }
  }
}

main();
