/**
 * Final comprehensive test of the YouTube transcript pipeline
 * Tests all 3 methods end-to-end via the API endpoint
 */
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const youtubedl = require('youtube-dl-exec');

const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const BASE = 'http://localhost:3000';

let passed = 0, failed = 0, skipped = 0;
function pass(m) { passed++; console.log('  ✅', m); }
function fail(m) { failed++; console.log('  ❌', m); }
function skip(m) { skipped++; console.log('  ⏭️', m); }

// ═══════ TEST 1: API endpoint — videos with captions ═══════
async function testCaptionedVideo(videoId, name) {
  try {
    const t = Date.now();
    const res = await fetch(`${BASE}/api/youtube-transcript?videoId=${videoId}`);
    const data = await res.json();
    const ms = Date.now() - t;
    if (res.ok && data.transcript && data.transcript.length > 50) {
      pass(`${name}: ${data.method} method, ${data.characterCount} chars, ${(ms/1000).toFixed(1)}s`);
      return true;
    } else {
      fail(`${name}: HTTP ${res.status} — ${data.error || 'empty transcript'}`);
      return false;
    }
  } catch (e) {
    fail(`${name}: ${e.message}`);
    return false;
  }
}

// ═══════ TEST 2: Direct yt-dlp audio extraction ═══════
async function testYtdlp(videoId, name) {
  try {
    const t = Date.now();
    const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true, noCheckCertificates: true, noWarnings: true, preferFreeFormats: true
    });
    const audio = info.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url);
    if (audio.length > 0) {
      // Test download
      const r = await fetch(audio[0].url, { headers: { Range: 'bytes=0-10000', 'User-Agent': 'Mozilla/5.0' } });
      if (r.ok || r.status === 206) {
        pass(`yt-dlp ${name}: ${audio.length} formats, download OK, ${((Date.now()-t)/1000).toFixed(1)}s`);
        return true;
      }
    }
    fail(`yt-dlp ${name}: no downloadable audio`);
    return false;
  } catch (e) {
    fail(`yt-dlp ${name}: ${e.message}`);
    return false;
  }
}

// ═══════ TEST 3: Direct Whisper transcription ═══════
async function testWhisper(videoId, name) {
  if (!GROQ_KEY) { skip('No GROQ_API_KEY'); return false; }
  try {
    const t = Date.now();
    const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true, noCheckCertificates: true, noWarnings: true, preferFreeFormats: true
    });
    const audio = info.formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
      .sort((a,b) => (a.filesize||Infinity) - (b.filesize||Infinity));
    if (!audio.length) { fail(`Whisper ${name}: no audio formats`); return false; }

    const chosen = audio[0];
    const ext = chosen.ext || 'mp4';
    const mime = ext === 'webm' ? 'audio/webm' : 'audio/mp4';

    // Download first 10MB
    const ar = await fetch(chosen.url, { headers: { Range: 'bytes=0-10485760', 'User-Agent': 'Mozilla/5.0' } });
    if (!ar.ok && ar.status !== 206) { fail(`Whisper ${name}: audio download failed`); return false; }
    const buf = await ar.arrayBuffer();

    // Transcribe
    const fd = new FormData();
    fd.append('file', new Blob([buf], { type: mime }), `audio.${ext}`);
    fd.append('model', 'whisper-large-v3-turbo');
    fd.append('response_format', 'verbose_json');
    const wr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${GROQ_KEY}` }, body: fd
    });
    if (!wr.ok) { fail(`Whisper ${name}: Groq error ${wr.status}`); return false; }
    const d = await wr.json();
    if (d.text && d.text.length > 50) {
      pass(`Whisper ${name}: ${d.text.length} chars, lang=${d.language}, ${((Date.now()-t)/1000).toFixed(1)}s`);
      console.log(`     Preview: "${d.text.slice(0, 120)}..."`);
      return true;
    }
    fail(`Whisper ${name}: transcript too short (${(d.text||'').length})`);
    return false;
  } catch (e) {
    fail(`Whisper ${name}: ${e.message}`);
    return false;
  }
}

// ═══════ TEST 4: Error handling ═══════
async function testErrors() {
  // Invalid ID
  const r1 = await fetch(`${BASE}/api/youtube-transcript?videoId=BAD`);
  if (r1.status === 400) pass('Invalid ID → 400'); else fail(`Invalid ID → ${r1.status}`);

  // Missing ID
  const r2 = await fetch(`${BASE}/api/youtube-transcript`);
  if (r2.status === 400) pass('Missing ID → 400'); else fail(`Missing ID → ${r2.status}`);

  // Nonexistent video
  const r3 = await fetch(`${BASE}/api/youtube-transcript?videoId=zzzzzzzzzzz`);
  if (r3.status === 404 || r3.status === 500) pass(`Fake video → ${r3.status}`); else fail(`Fake video → ${r3.status}`);
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🧪 YouTube Transcript Pipeline — Final Test Suite   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`  Groq: ${GROQ_KEY ? '✅' : '❌'}  Server: ${BASE}`);

  // Check server
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.log('\n❌ Dev server not running! Start with: npm run dev\n');
    process.exit(1);
  }

  console.log('\n━━━ 1. Captioned Videos via API ━━━');
  await testCaptionedVideo('dQw4w9WgXcQ', 'Rick Astley (EN)');
  await testCaptionedVideo('tVlcKp3bWH8', 'Mufti Menk');
  await testCaptionedVideo('9bZkp7q19f0', 'Gangnam Style');

  console.log('\n━━━ 2. yt-dlp Audio Extraction ━━━');
  await testYtdlp('dQw4w9WgXcQ', 'Rick Astley');
  await testYtdlp('tVlcKp3bWH8', 'Mufti Menk');

  console.log('\n━━━ 3. Groq Whisper Transcription ━━━');
  await testWhisper('dQw4w9WgXcQ', 'Rick Astley (EN)');
  await testWhisper('tVlcKp3bWH8', 'Mufti Menk (FR)');

  console.log('\n━━━ 4. Error Handling ━━━');
  await testErrors();

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║  📊 RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped          ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
