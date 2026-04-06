import type { TopicBlock } from '@/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInlineFormatting(text: string): string {
  // Render ==highlights== and URLs
  return escapeHtml(text)
    .replace(/==(.*?)==/g, '<mark style="background:rgba(212,173,74,0.18);padding:1px 4px;border-radius:3px">$1</mark>')
    .replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      const safeUrl = url.replace(/"/g, '&quot;');
      return `<a href="${safeUrl}" style="color:#3b82f6;text-decoration:underline">${url}</a>`;
    });
}

function blockToHtml(block: TopicBlock): string {
  const content = block.content || '';

  switch (block.type) {
    case 'heading1':
      return `<h1 style="font-size:1.75rem;font-weight:800;margin:2rem 0 0.75rem;font-family:'Playfair Display',serif;color:#000">${renderInlineFormatting(content)}</h1>`;
    case 'heading2':
      return `<h2 style="font-size:1.35rem;font-weight:700;margin:1.75rem 0 0.5rem;font-family:'Playfair Display',serif;color:#000">${renderInlineFormatting(content)}</h2>`;
    case 'heading3':
      return `<h3 style="font-size:1.1rem;font-weight:600;margin:1.25rem 0 0.4rem;color:#000">${renderInlineFormatting(content)}</h3>`;
    case 'paragraph':
      return content ? `<p style="font-size:0.875rem;line-height:1.9;margin-bottom:0.75rem;color:#111">${renderInlineFormatting(content)}</p>` : '';
    case 'quote':
      return `<blockquote style="border-left:4px solid #92702e;padding:0.75rem 1rem;margin:1rem 0;background:#fdf6e3;border-radius:0 0.5rem 0.5rem 0"><p style="font-style:italic;color:#5c4813;font-size:0.875rem;line-height:1.9;margin:0">${renderInlineFormatting(content)}</p></blockquote>`;
    case 'bullet-list':
      return `<ul style="margin:0.75rem 0;padding-left:1.5rem">${content.split('\n').filter(Boolean).map(item => `<li style="font-size:0.875rem;line-height:1.8;color:#111;margin-bottom:0.25rem">${renderInlineFormatting(item)}</li>`).join('')}</ul>`;
    case 'numbered-list':
      return `<ol style="margin:0.75rem 0;padding-left:1.5rem">${content.split('\n').filter(Boolean).map(item => `<li style="font-size:0.875rem;line-height:1.8;color:#111;margin-bottom:0.25rem">${renderInlineFormatting(item)}</li>`).join('')}</ol>`;
    case 'checklist':
      return `<div style="margin:0.75rem 0">${content.split('\n').filter(Boolean).map(item => {
        const checked = item.startsWith('✓ ') || item.startsWith('✔ ');
        const text = checked ? item.slice(2) : item;
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;${checked ? 'background:#16a34a;text-align:center;line-height:14px;font-size:10px;color:white' : 'border:2px solid #666'}">${checked ? '✓' : ''}</span><span style="font-size:0.875rem;color:${checked ? '#666' : '#111'};${checked ? 'text-decoration:line-through' : ''}">${renderInlineFormatting(text)}</span></div>`;
      }).join('')}</div>`;
    case 'callout':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#fef9e7;border:1px solid #d4ad4a"><p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0"><strong style="color:#7a5d0f">ℹ️ Important :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'warning':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#fef2f2;border:1px solid #ef4444"><p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0"><strong style="color:#991b1b">⚠️ Avertissement :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'reflection':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#ecfdf5;border:1px solid #10b981"><p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0"><strong style="color:#065f46">💡 Réflexion :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'reminder':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#fffbeb;border:1px solid #f59e0b"><p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0"><strong style="color:#92400e">🔔 Rappel :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'hadith':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#f0fdfa;border-left:4px solid #0d9488"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0d9488;margin:0 0 0.5rem">📖 Hadith</p><p style="font-size:0.875rem;line-height:1.9;color:#000;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#444;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'verse':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#fdf6e3;border-left:4px solid #92702e"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#92702e;margin:0 0 0.5rem">📖 Verset</p>${block.metadata?.arabic ? `<p style="font-size:1.1rem;text-align:right;line-height:2;color:#5c4813;font-family:'Amiri',serif;margin:0 0 0.75rem" dir="rtl">${escapeHtml(block.metadata.arabic)}</p>` : ''}<p style="font-size:0.875rem;line-height:1.9;color:#000;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#444;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'dua':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#ecfdf5;border-left:4px solid #059669"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#059669;margin:0 0 0.5rem">🤲 Dua / Invocation</p>${block.metadata?.arabic ? `<p style="font-size:1.1rem;text-align:right;line-height:2;color:#065f46;font-family:'Amiri',serif;margin:0 0 0.75rem" dir="rtl">${escapeHtml(block.metadata.arabic)}</p>` : ''}<p style="font-size:0.875rem;line-height:1.9;color:#000;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#444;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'definition': {
      const parts = content.split('---');
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#f5f3ff;border:1px solid #8b5cf6"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#5b21b6;margin:0 0 0.25rem">📝 Définition</p><p style="font-size:0.875rem;font-weight:600;color:#000;margin:0 0 0.25rem">${escapeHtml(parts[0]?.trim() || '')}</p>${parts[1] ? `<p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0">${renderInlineFormatting(parts[1].trim())}</p>` : ''}</div>`;
    }
    case 'source':
      return `<div style="margin:1rem 0;padding:0.75rem 1rem;border-radius:0.75rem;background:#eef2ff;border:1px solid #6366f1;display:flex;gap:0.75rem"><span style="color:#4338ca">📚</span><div><p style="font-size:0.875rem;color:#000;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.reference ? `<p style="font-size:0.75rem;color:#444;margin:0.25rem 0 0">${renderInlineFormatting(block.metadata.reference)}</p>` : ''}</div></div>`;
    case 'poem':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#fdf4ff;border-left:4px solid #a21caf"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#86198f;margin:0 0 0.5rem">✍️ Poème</p>${content.split('\n').filter(Boolean).map(line => `<p style="font-size:0.875rem;font-style:italic;text-align:center;line-height:1.9;color:#000;margin:0.125rem 0">${escapeHtml(line)}</p>`).join('')}${block.metadata?.source ? `<p style="font-size:0.75rem;color:#444;margin:0.75rem 0 0;text-align:center">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'timeline':
      return `<div style="margin:1rem 0;padding-left:1.5rem;border-left:2px solid rgba(6,182,212,0.3)">${content.split('\n').filter(Boolean).map(line => {
        const sep = line.indexOf('—');
        const date = sep > -1 ? line.slice(0, sep).trim() : '';
        const event = sep > -1 ? line.slice(sep + 1).trim() : line;
        return `<div style="position:relative;margin-bottom:1rem;padding-left:0.75rem"><div style="position:absolute;left:-1.35rem;top:0.35rem;width:0.6rem;height:0.6rem;border-radius:50%;background:#0e7490"></div>${date ? `<span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0e7490">${escapeHtml(date)}</span>` : ''}<p style="font-size:0.875rem;line-height:1.7;color:#000;margin:0">${renderInlineFormatting(event)}</p></div>`;
      }).join('')}</div>`;
    case 'qa': {
      const parts = content.split('---');
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:#f5f3ff;border:1px solid #8b5cf6"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#5b21b6;margin:0 0 0.25rem">Question</p><p style="font-size:0.875rem;font-weight:500;color:#000;margin:0">${escapeHtml(parts[0]?.trim() || '')}</p>${parts[1] ? `<div style="border-top:1px solid #8b5cf6;margin-top:0.75rem;padding-top:0.75rem"><p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#5b21b6;margin:0 0 0.25rem">Réponse</p><p style="font-size:0.875rem;line-height:1.8;color:#111;margin:0">${renderInlineFormatting(parts[1].trim())}</p></div>` : ''}</div>`;
    }
    case 'link':
      return `<a href="${escapeHtml(content)}" style="display:block;margin:0.75rem 0;padding:0.75rem 1rem;border-radius:0.5rem;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);color:#60a5fa;font-size:0.875rem;text-decoration:underline">${escapeHtml(block.metadata?.title || content)}</a>`;
    case 'image':
      return block.metadata?.dataUrl ? `<div style="margin:1rem 0;max-width:${block.metadata?.width || '100%'}"><img src="${block.metadata.dataUrl}" alt="${escapeHtml(content)}" style="width:100%;border-radius:0.75rem" /></div>` : '';
    case 'table': {
      let tableData: string[][] = [['']];
      try { if (block.metadata?.tableData) tableData = JSON.parse(block.metadata.tableData); } catch { /* ignore */ }
      return `<table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.875rem"><tbody>${tableData.map((row, ri) => `<tr>${row.map(cell => `<td style="padding:0.5rem 0.75rem;border:1px solid #ccc;${ri === 0 ? 'font-weight:700;background:#f0fdfa' : ''};color:#000">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    case 'divider':
      return `<div style="text-align:center;margin:1.5rem 0;color:#999">✦</div>`;
    case 'audio':
      return block.metadata?.fileName ? `<div style="margin:0.75rem 0;padding:0.75rem 1rem;border-radius:0.75rem;background:rgba(244,114,182,0.06);border:1px solid rgba(244,114,182,0.12);color:#f472b6;font-size:0.875rem">🎵 ${escapeHtml(block.metadata.fileName)} <em style="font-size:0.75rem;opacity:0.7">(audio non exportable)</em></div>` : '';
    default:
      return content ? `<p style="font-size:0.875rem;line-height:1.8;color:#111;margin-bottom:0.5rem">${renderInlineFormatting(content)}</p>` : '';
  }
}

export function exportToPdf(title: string, blocks: TopicBlock[], subtitle?: string) {
  const html = blocks.map(blockToHtml).join('\n');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} – Ilmify</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #111;
      padding: 3rem 2.5rem;
      max-width: 800px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3 { font-family: 'Playfair Display', serif; color: #000; }
    a { color: #1d4ed8; }
    mark { background: rgba(212,173,74,0.18) !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    @media print {
      body { padding: 1.5rem; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div style="margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid #e5e7eb">
    <h1 style="font-size:2rem;font-weight:800;color:#000;font-family:'Playfair Display',serif;margin-bottom:0.5rem">${escapeHtml(title)}</h1>
    ${subtitle ? `<p style="font-size:0.875rem;color:#444">${escapeHtml(subtitle)}</p>` : ''}
    <p style="font-size:0.75rem;color:#666;margin-top:0.5rem">Exporté depuis Ilmify — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  ${html}
  <div style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb;text-align:center">
    <p style="font-size:0.7rem;color:#666">Généré par Ilmify — votre compagnon de savoir islamique</p>
  </div>
</body>
</html>`);

  printWindow.document.close();
  // Give fonts time to load
  setTimeout(() => {
    printWindow.print();
  }, 800);
}

export function exportPassagesToPdf(
  bookTitle: string,
  author: string,
  passages: { title: string; content: string; pageNumber?: number; personalReflection?: string; isImportant?: boolean; imageUrl?: string }[],
) {
  const passagesHtml = passages
    .map(
      (p) => `
    <div style="margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid #eee">
      <h2 style="font-size:1.1rem;font-weight:700;color:#000;margin-bottom:0.25rem;font-family:'Playfair Display',serif">${escapeHtml(p.title)}</h2>
      ${p.pageNumber ? `<p style="font-size:0.7rem;color:#666;margin-bottom:0.5rem">Page ${p.pageNumber}</p>` : ''}
      ${p.isImportant ? '<span style="display:inline-block;font-size:0.65rem;padding:2px 8px;border-radius:4px;background:#fef9c3;color:#854d0e;margin-bottom:0.5rem">★ Important</span>' : ''}
      ${p.imageUrl ? `<div style="margin:0.75rem 0"><img src="${p.imageUrl}" alt="" style="max-width:100%;border-radius:0.75rem" /></div>` : ''}
      <p style="font-size:0.875rem;line-height:1.9;color:#111;white-space:pre-wrap">${escapeHtml(p.content)}</p>
      ${p.personalReflection ? `<div style="margin-top:0.75rem;padding:0.75rem 1rem;border-left:3px solid #2e9e8c;background:rgba(46,158,140,0.04);border-radius:0 0.5rem 0.5rem 0"><p style="font-size:0.7rem;font-weight:600;color:#2e9e8c;margin:0 0 0.25rem">Réflexion personnelle</p><p style="font-size:0.8rem;line-height:1.8;color:#444;margin:0">${escapeHtml(p.personalReflection)}</p></div>` : ''}
    </div>`,
    )
    .join('\n');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(bookTitle)} – Passages – Ilmify</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111; padding: 3rem 2.5rem; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { padding: 1.5rem; } @page { margin: 1.5cm; size: A4; } }
  </style>
</head>
<body>
  <div style="margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:2px solid #d4ad4a">
    <h1 style="font-size:2rem;font-weight:800;color:#000;font-family:'Playfair Display',serif;margin-bottom:0.25rem">${escapeHtml(bookTitle)}</h1>
    <p style="font-size:0.9rem;color:#444">${escapeHtml(author)}</p>
    <p style="font-size:0.75rem;color:#666;margin-top:0.5rem">${passages.length} passage${passages.length > 1 ? 's' : ''} — Exporté le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  ${passagesHtml}
  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;text-align:center">
    <p style="font-size:0.7rem;color:#666">Généré par Ilmify</p>
  </div>
</body>
</html>`);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 800);
}
