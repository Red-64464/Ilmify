/**
 * Test script for the YouTube transcript pipeline
 * Tests all 3 methods: npm lib, HTML scraping, and Groq Whisper
 * 
 * Usage: node tests/test-transcript-pipeline.mjs
 */

import 'dotenv/config';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const BASE_URL = 'http://localhost:3000';

// ── Test videos ──
// Videos with captions (should work with Method 1 or 2)
const VIDEOS_WITH_CAPTIONS = [
  { id: 'dQw4w9WgXcQ', name: 'Rick Astley - Never Gonna Give You Up (EN captions)' },
  { id: 'tVlcKp3bWH8', name: 'Mufti Menk lecture (EN captions)' },
];

// Videos that are likely to NOT have captions (test Whisper fallback)
// Short videos for faster testing
const VIDEOS_FOR_WHISPER = [
  { id: '9bZkp7q19f0', name: 'PSY - Gangnam Style (may/may not have captions)' },
];

let passed = 0;
let failed = 0;
let skipped = 0;

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }
function pass(msg) { passed++; log('✅', msg); }
function fail(msg) { failed++; log('❌', msg); }
function skip(msg) { skipped++; log('⏭️', msg); }
function section(title) { console.log(`\n━━━ ${title} ━━━`); }

// ── TEST 1: Full pipeline via API endpoint ──
async function testFullPipeline(videoId, name) {
  try {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/youtube-transcript?videoId=${videoId}`);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await res.json();

    if (res.ok && data.transcript) {
      pass(`[${videoId}] "${name}" — ${data.characterCount} chars, method: ${data.method || 'unknown'}, ${elapsed}s`);
      return data;
    } else {
      fail(`[${videoId}] "${name}" — HTTP ${res.status}: ${data.error || 'no transcript'}`);
      return null;
    }
  } catch (err) {
    fail(`[${videoId}] "${name}" — Error: ${err.message}`);
    return null;
  }
}

// ── TEST 2: Direct Groq Whisper test (bypass caption methods) ──
async function testWhisperDirect(videoId, name) {
  if (!GROQ_API_KEY) {
    skip(`[whisper] No GROQ_API_KEY, cannot test Whisper`);
    return null;
  }

  try {
    console.log(`  🔄 Step 1: Getting audio URL for ${videoId}...`);

    // Step 1: Get audio URL via innertube API
    let audioUrl = null;
    let mimeType = 'audio/mp4';
    let ext = 'mp4';

    const clients = [
      { name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0' },
      { name: 'WEB', version: '2.20240101.00.00' },
    ];

    for (const client of clients) {
      try {
        const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            context: { client: { clientName: client.name, clientVersion: client.version, hl: 'fr', gl: 'FR' } },
            contentCheckOk: true,
            racyCheckOk: true,
          }),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const formats = data.streamingData?.adaptiveFormats || [];
        const audioFmts = formats.filter(f => f.mimeType?.startsWith('audio/') && f.url);

        if (audioFmts.length > 0) {
          audioFmts.sort((a, b) => parseInt(a.contentLength || '999999999') - parseInt(b.contentLength || '999999999'));
          const chosen = audioFmts[0];
          audioUrl = chosen.url;
          mimeType = chosen.mimeType.split(';')[0].trim();
          ext = mimeType === 'audio/webm' ? 'webm' : 'mp4';
          log('🎵', `Got audio from innertube (${client.name}), size: ${(parseInt(chosen.contentLength || '0') / 1024 / 1024).toFixed(1)}MB`);
          break;
        }
      } catch {
        continue;
      }
    }

    // Also try extracting from YouTube page HTML
    if (!audioUrl) {
      try {
        const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
        const html = await ytRes.text();
        // Quick extract of streamingData
        const match = html.match(/"adaptiveFormats":\s*(\[.*?\])/s);
        if (match) {
          try {
            const formats = JSON.parse(match[1]);
            const audioFmts = formats.filter(f => f.mimeType?.startsWith('audio/') && f.url);
            if (audioFmts.length > 0) {
              audioFmts.sort((a, b) => parseInt(a.contentLength || '999999999') - parseInt(b.contentLength || '999999999'));
              audioUrl = audioFmts[0].url;
              mimeType = audioFmts[0].mimeType.split(';')[0].trim();
              ext = mimeType === 'audio/webm' ? 'webm' : 'mp4';
              log('🎵', `Got audio from page HTML, size: ${(parseInt(audioFmts[0].contentLength || '0') / 1024 / 1024).toFixed(1)}MB`);
            }
          } catch { /* ignore parse errors */ }
        }
      } catch { /* ignore */ }
    }

    if (!audioUrl) {
      fail(`[whisper] Could not get audio URL for ${videoId} from any source`);
      return null;
    }

    // Step 2: Download audio (first 10MB for fast test)
    console.log(`  🔄 Step 2: Downloading audio (max 10MB)...`);
    const MAX_TEST_AUDIO = 10 * 1024 * 1024;
    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Range': `bytes=0-${MAX_TEST_AUDIO - 1}`,
      },
    });

    if (!audioRes.ok && audioRes.status !== 206) {
      fail(`[whisper] Audio download failed: HTTP ${audioRes.status}`);
      return null;
    }

    const audioBuffer = await audioRes.arrayBuffer();
    log('📦', `Downloaded ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB of audio`);

    if (audioBuffer.byteLength < 1000) {
      fail(`[whisper] Audio too small (${audioBuffer.byteLength} bytes)`);
      return null;
    }

    // Step 3: Transcribe via Groq Whisper
    console.log(`  🔄 Step 3: Sending to Groq Whisper...`);
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');

    const start = Date.now();
    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });
    const whisperElapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      fail(`[whisper] Groq error ${whisperRes.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const result = await whisperRes.json();
    const transcript = result.text?.trim();

    if (transcript && transcript.length > 50) {
      pass(`[whisper] "${name}" — ${transcript.length} chars, lang: ${result.language || '?'}, whisper took ${whisperElapsed}s`);
      log('📝', `Preview: "${transcript.slice(0, 150)}..."`);
      return result;
    } else {
      fail(`[whisper] Transcript too short: ${transcript?.length || 0} chars`);
      return null;
    }
  } catch (err) {
    fail(`[whisper] Error: ${err.message}`);
    return null;
  }
}

// ── TEST 3: Validate innertube API returns audio formats ──
async function testInnertubeAudioExtraction(videoId, name) {
  const clients = [
    { name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0' },
    { name: 'WEB', version: '2.20240101.00.00' },
  ];

  for (const client of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: { client: { clientName: client.name, clientVersion: client.version } },
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!res.ok) {
        log('⚠️', `innertube ${client.name} returned HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const formats = data.streamingData?.adaptiveFormats || [];
      const audioFmts = formats.filter(f => f.mimeType?.startsWith('audio/'));
      const directFmts = audioFmts.filter(f => f.url);
      const cipherFmts = audioFmts.filter(f => f.signatureCipher);

      if (directFmts.length > 0) {
        pass(`[innertube/${client.name}] ${videoId}: ${directFmts.length} direct audio URLs, ${cipherFmts.length} cipher-protected`);
        return true;
      } else if (audioFmts.length > 0) {
        log('⚠️', `[innertube/${client.name}] ${videoId}: ${audioFmts.length} audio formats but all cipher-protected`);
      } else {
        log('⚠️', `[innertube/${client.name}] ${videoId}: no audio formats found`);
      }
    } catch (err) {
      log('⚠️', `[innertube/${client.name}] error: ${err.message}`);
    }
  }

  fail(`[innertube] ${videoId}: no direct audio URL from any client`);
  return false;
}

// ── TEST 4: Validate error handling ──
async function testErrorHandling() {
  // Invalid video ID
  try {
    const res = await fetch(`${BASE_URL}/api/youtube-transcript?videoId=INVALID`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      pass(`Invalid ID returns 400: "${data.error}"`);
    } else {
      fail(`Invalid ID should return 400, got ${res.status}`);
    }
  } catch (err) {
    fail(`Error handler test failed: ${err.message}`);
  }

  // Missing video ID
  try {
    const res = await fetch(`${BASE_URL}/api/youtube-transcript`);
    const data = await res.json();
    if (res.status === 400) {
      pass(`Missing ID returns 400`);
    } else {
      fail(`Missing ID should return 400, got ${res.status}`);
    }
  } catch (err) {
    fail(`Missing ID test failed: ${err.message}`);
  }
}

// ── TEST 5: YouTube page data extraction (captions + streaming) ──
async function testPageDataExtraction(videoId, name) {
  try {
    const start = Date.now();
    const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    const html = await ytRes.text();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Check for player response
    const hasPlayerResponse = html.includes('ytInitialPlayerResponse');
    if (!hasPlayerResponse) {
      fail(`[page] ${videoId}: No ytInitialPlayerResponse found`);
      return;
    }

    // Check for captions
    const hasCaptions = html.includes('captionTracks');
    // Check for streaming data
    const hasStreaming = html.includes('adaptiveFormats');

    log('📊', `[page] ${videoId} "${name}": captions=${hasCaptions}, streaming=${hasStreaming}, fetch=${elapsed}s`);

    if (hasCaptions) {
      pass(`[page] ${videoId}: Has caption tracks available`);
    } else {
      log('⚠️', `[page] ${videoId}: No caption tracks (Whisper fallback needed)`);
    }

    if (hasStreaming) {
      pass(`[page] ${videoId}: Has streaming/adaptive formats`);
    } else {
      fail(`[page] ${videoId}: No streaming data found`);
    }
  } catch (err) {
    fail(`[page] ${videoId}: Error: ${err.message}`);
  }
}

// ── Run all tests ──
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🧪 YouTube Transcript Pipeline — Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Groq API Key: ${GROQ_API_KEY ? '✅ configured' : '❌ missing'}`);
  console.log(`  Server: ${BASE_URL}`);

  // Check if dev server is running
  section('Pre-check: Dev server');
  try {
    await fetch(`${BASE_URL}`, { signal: AbortSignal.timeout(5000) });
    pass('Dev server is running');
  } catch {
    fail('Dev server is NOT running! Start it with: npm run dev');
    console.log('\n⚠️  Cannot run API endpoint tests without dev server.\n    Running direct tests only...\n');
  }

  // Test A: YouTube page data extraction
  section('Test A: YouTube Page Data Extraction');
  for (const video of [...VIDEOS_WITH_CAPTIONS, ...VIDEOS_FOR_WHISPER]) {
    await testPageDataExtraction(video.id, video.name);
  }

  // Test B: Innertube API audio extraction
  section('Test B: Innertube API Audio Extraction');
  for (const video of [...VIDEOS_WITH_CAPTIONS.slice(0, 1), ...VIDEOS_FOR_WHISPER]) {
    await testInnertubeAudioExtraction(video.id, video.name);
  }

  // Test C: Direct Whisper transcription (most important test)
  section('Test C: Direct Groq Whisper Transcription');
  for (const video of VIDEOS_WITH_CAPTIONS.slice(0, 1)) {
    await testWhisperDirect(video.id, video.name);
  }

  // Test D: Full pipeline via API (requires dev server)
  section('Test D: Full Pipeline via API Endpoint');
  let serverUp = false;
  try {
    await fetch(`${BASE_URL}`, { signal: AbortSignal.timeout(3000) });
    serverUp = true;
  } catch { /* server not running */ }

  if (serverUp) {
    for (const video of VIDEOS_WITH_CAPTIONS) {
      await testFullPipeline(video.id, video.name);
    }
    // Test Whisper via pipeline (this video might not have captions)
    for (const video of VIDEOS_FOR_WHISPER) {
      await testFullPipeline(video.id, video.name);
    }
  } else {
    skip('Skipping API tests (dev server not running)');
  }

  // Test E: Error handling
  section('Test E: Error Handling');
  if (serverUp) {
    await testErrorHandling();
  } else {
    skip('Skipping error handling tests (dev server not running)');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
