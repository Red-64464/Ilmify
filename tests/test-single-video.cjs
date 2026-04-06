const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const OR_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

function sampleTranscript(text, maxLen) {
  if (text.length <= maxLen) return text;
  const third = Math.floor(maxLen / 3) - 30;
  const midPos = Math.floor(text.length / 2);
  return text.slice(0, third) + '\n[...milieu...]\n' + text.slice(midPos - Math.floor(third / 2), midPos + Math.ceil(third / 2)) + '\n[...fin...]\n' + text.slice(-third);
}

async function test() {
  // 1. Get transcript
  const tRes = await fetch('http://localhost:3000/api/youtube-transcript?videoId=hrYcASYhhKc');
  const tData = await tRes.json();
  const transcript = tData.transcript;
  console.log('Transcript:', transcript.length, 'chars');

  // 2. isLong = true, use OpenRouter
  const sampled = sampleTranscript(transcript, 40000);
  console.log('Sampled:', sampled.length, 'chars');

  const prompt = `Analyse cette vidéo:
Titre: Test

Transcription:
${sampled}

Réponds en JSON: {"summary":"...","synthesis":"...","keyPoints":["..."]}`;
  console.log('Prompt total:', prompt.length, 'chars');
  console.log('Sending to OpenRouter nemotron...');

  const start = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OR_KEY, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://ilmify.app', 'X-Title': 'Ilmify' },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'system', content: 'Réponds en JSON valide uniquement.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    })
  });

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('Status:', res.status, '— Time:', elapsed + 's');

  const data = await res.json();
  if (data.error) {
    console.log('ERROR:', JSON.stringify(data.error).slice(0, 500));
  } else {
    const content = data.choices[0].message.content;
    console.log('Response length:', content.length, 'chars');
    try {
      const parsed = JSON.parse(content);
      console.log('JSON parse: OK');
      console.log('summary:', (parsed.summary || '').slice(0, 150) + '...');
      console.log('synthesis length:', (parsed.synthesis || '').length, 'chars');
      console.log('keyPoints:', (parsed.keyPoints || []).length, 'points');
    } catch (e) {
      console.log('JSON PARSE ERROR:', e.message);
      console.log('Raw first 300:', content.slice(0, 300));
    }
  }
}
test().catch(e => console.error('FATAL:', e.message));
