import { chatWithJarvis, getJarvisApiKey, getJarvisMemory } from '../services/jarvisService.js';
import { getFullCatalog } from '../services/catalogService.js';

async function test() {
  const key = getJarvisApiKey();
  const memory = await getJarvisMemory();
  const catalog = await getFullCatalog();
  
  console.log('Testing "tenes algo del patron?"...');
  const start = Date.now();
  const res = await chatWithJarvis('tenes algo del patron?', [], [key], catalog, memory);
  console.log('Finished in', Date.now() - start, 'ms');
  console.log('PoweredBy:', res.poweredBy);
  console.log('Reply:', res.replyText);
  console.log('Actions count:', res.actions ? res.actions.length : 0);
  if (res.actions && res.actions[0]) {
    console.log('Action type:', res.actions[0].type);
    console.log('Matched posters:', res.actions[0].posters?.map(p => p.title + ' - ' + p.subtitle));
  }
}
test();
