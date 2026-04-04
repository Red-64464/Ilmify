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
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#3b82f6;text-decoration:underline">$1</a>');
}

function blockToHtml(block: TopicBlock): string {
  const content = block.content || '';

  switch (block.type) {
    case 'heading1':
      return `<h1 style="font-size:1.75rem;font-weight:800;margin:2rem 0 0.75rem;font-family:'Playfair Display',serif;color:#e8e0d0">${renderInlineFormatting(content)}</h1>`;
    case 'heading2':
      return `<h2 style="font-size:1.35rem;font-weight:700;margin:1.75rem 0 0.5rem;font-family:'Playfair Display',serif;color:#e8e0d0">${renderInlineFormatting(content)}</h2>`;
    case 'heading3':
      return `<h3 style="font-size:1.1rem;font-weight:600;margin:1.25rem 0 0.4rem;color:#e8e0d0">${renderInlineFormatting(content)}</h3>`;
    case 'paragraph':
      return content ? `<p style="font-size:0.875rem;line-height:1.9;margin-bottom:0.75rem;color:#c0b8a8">${renderInlineFormatting(content)}</p>` : '';
    case 'quote':
      return `<blockquote style="border-left:3px solid #d4ad4a;padding:0.75rem 1rem;margin:1rem 0;background:rgba(196,154,61,0.04);border-radius:0 0.5rem 0.5rem 0"><p style="font-style:italic;color:#d4ad4a;font-size:0.875rem;line-height:1.9;margin:0">${renderInlineFormatting(content)}</p></blockquote>`;
    case 'bullet-list':
      return `<ul style="margin:0.75rem 0;padding-left:1.5rem">${content.split('\n').filter(Boolean).map(item => `<li style="font-size:0.875rem;line-height:1.8;color:#c0b8a8;margin-bottom:0.25rem">${renderInlineFormatting(item)}</li>`).join('')}</ul>`;
    case 'numbered-list':
      return `<ol style="margin:0.75rem 0;padding-left:1.5rem">${content.split('\n').filter(Boolean).map(item => `<li style="font-size:0.875rem;line-height:1.8;color:#c0b8a8;margin-bottom:0.25rem">${renderInlineFormatting(item)}</li>`).join('')}</ol>`;
    case 'checklist':
      return `<div style="margin:0.75rem 0">${content.split('\n').filter(Boolean).map(item => {
        const checked = item.startsWith('✓ ') || item.startsWith('✔ ');
        const text = checked ? item.slice(2) : item;
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;${checked ? 'background:#22c55e;text-align:center;line-height:14px;font-size:10px;color:white' : 'border:1.5px solid #666'}">${checked ? '✓' : ''}</span><span style="font-size:0.875rem;color:${checked ? '#888' : '#c0b8a8'};${checked ? 'text-decoration:line-through' : ''}">${renderInlineFormatting(text)}</span></div>`;
      }).join('')}</div>`;
    case 'callout':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(196,154,61,0.06);border:1px solid rgba(196,154,61,0.12)"><p style="font-size:0.875rem;line-height:1.8;color:#e8e0d0;margin:0"><strong style="color:#d4ad4a">ℹ️ Important :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'warning':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)"><p style="font-size:0.875rem;line-height:1.8;color:#e8e0d0;margin:0"><strong style="color:#ef4444">⚠️ Avertissement :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'reflection':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(18,163,147,0.06);border:1px solid rgba(18,163,147,0.12)"><p style="font-size:0.875rem;line-height:1.8;color:#e8e0d0;margin:0"><strong style="color:#56e2cc">💡 Réflexion :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'reminder':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.12)"><p style="font-size:0.875rem;line-height:1.8;color:#e8e0d0;margin:0"><strong style="color:#f59e0b">🔔 Rappel :</strong> ${renderInlineFormatting(content)}</p></div>`;
    case 'hadith':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(46,158,140,0.06);border-left:3px solid #2e9e8c"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#2e9e8c;margin:0 0 0.5rem">📖 Hadith</p><p style="font-size:0.875rem;line-height:1.9;color:#e8e0d0;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#888;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'verse':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(196,154,61,0.06);border-left:3px solid #d4ad4a"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d4ad4a;margin:0 0 0.5rem">📖 Verset</p>${block.metadata?.arabic ? `<p style="font-size:1.1rem;text-align:right;line-height:2;color:#d4ad4a;font-family:'Amiri',serif;margin:0 0 0.75rem" dir="rtl">${escapeHtml(block.metadata.arabic)}</p>` : ''}<p style="font-size:0.875rem;line-height:1.9;color:#e8e0d0;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#888;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'dua':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(52,211,153,0.06);border-left:3px solid #34d399"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#34d399;margin:0 0 0.5rem">🤲 Dua / Invocation</p>${block.metadata?.arabic ? `<p style="font-size:1.1rem;text-align:right;line-height:2;color:#34d399;font-family:'Amiri',serif;margin:0 0 0.75rem" dir="rtl">${escapeHtml(block.metadata.arabic)}</p>` : ''}<p style="font-size:0.875rem;line-height:1.9;color:#e8e0d0;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.source ? `<p style="font-size:0.75rem;color:#888;margin:0.5rem 0 0">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'definition': {
      const parts = content.split('---');
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.12)"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#a78bfa;margin:0 0 0.25rem">📝 Définition</p><p style="font-size:0.875rem;font-weight:600;color:#e8e0d0;margin:0 0 0.25rem">${escapeHtml(parts[0]?.trim() || '')}</p>${parts[1] ? `<p style="font-size:0.875rem;line-height:1.8;color:#c0b8a8;margin:0">${renderInlineFormatting(parts[1].trim())}</p>` : ''}</div>`;
    }
    case 'source':
      return `<div style="margin:1rem 0;padding:0.75rem 1rem;border-radius:0.75rem;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);display:flex;gap:0.75rem"><span style="color:#6366f1">📚</span><div><p style="font-size:0.875rem;color:#e8e0d0;margin:0">${renderInlineFormatting(content)}</p>${block.metadata?.reference ? `<p style="font-size:0.75rem;color:#888;margin:0.25rem 0 0">${renderInlineFormatting(block.metadata.reference)}</p>` : ''}</div></div>`;
    case 'poem':
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(232,121,249,0.06);border-left:3px solid #e879f9"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#e879f9;margin:0 0 0.5rem">✍️ Poème</p>${content.split('\n').filter(Boolean).map(line => `<p style="font-size:0.875rem;font-style:italic;text-align:center;line-height:1.9;color:#e8e0d0;margin:0.125rem 0">${escapeHtml(line)}</p>`).join('')}${block.metadata?.source ? `<p style="font-size:0.75rem;color:#888;margin:0.75rem 0 0;text-align:center">— ${escapeHtml(block.metadata.source)}</p>` : ''}</div>`;
    case 'timeline':
      return `<div style="margin:1rem 0;padding-left:1.5rem;border-left:2px solid rgba(6,182,212,0.3)">${content.split('\n').filter(Boolean).map(line => {
        const sep = line.indexOf('—');
        const date = sep > -1 ? line.slice(0, sep).trim() : '';
        const event = sep > -1 ? line.slice(sep + 1).trim() : line;
        return `<div style="position:relative;margin-bottom:1rem;padding-left:0.75rem"><div style="position:absolute;left:-1.35rem;top:0.35rem;width:0.6rem;height:0.6rem;border-radius:50%;background:#06b6d4"></div>${date ? `<span style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#06b6d4">${escapeHtml(date)}</span>` : ''}<p style="font-size:0.875rem;line-height:1.7;color:#e8e0d0;margin:0">${renderInlineFormatting(event)}</p></div>`;
      }).join('')}</div>`;
    case 'qa': {
      const parts = content.split('---');
      return `<div style="margin:1rem 0;padding:1rem;border-radius:0.75rem;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.12)"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#8b5cf6;margin:0 0 0.25rem">Question</p><p style="font-size:0.875rem;font-weight:500;color:#e8e0d0;margin:0">${escapeHtml(parts[0]?.trim() || '')}</p>${parts[1] ? `<div style="border-top:1px solid rgba(139,92,246,0.12);margin-top:0.75rem;padding-top:0.75rem"><p style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#8b5cf6;margin:0 0 0.25rem">Réponse</p><p style="font-size:0.875rem;line-height:1.8;color:#c0b8a8;margin:0">${renderInlineFormatting(parts[1].trim())}</p></div>` : ''}</div>`;
    }
    case 'link':
      return `<a href="${escapeHtml(content)}" style="display:block;margin:0.75rem 0;padding:0.75rem 1rem;border-radius:0.5rem;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);color:#60a5fa;font-size:0.875rem;text-decoration:underline">${escapeHtml(block.metadata?.title || content)}</a>`;
    case 'image':
      return block.metadata?.dataUrl ? `<div style="margin:1rem 0;max-width:${block.metadata?.width || '100%'}"><img src="${block.metadata.dataUrl}" alt="${escapeHtml(content)}" style="width:100%;border-radius:0.75rem" /></div>` : '';
    case 'table': {
      let tableData: string[][] = [['']];
      try { if (block.metadata?.tableData) tableData = JSON.parse(block.metadata.tableData); } catch { /* ignore */ }
      return `<table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.875rem"><tbody>${tableData.map((row, ri) => `<tr>${row.map(cell => `<td style="padding:0.5rem 0.75rem;border:1px solid rgba(255,255,255,0.08);${ri === 0 ? 'font-weight:600;background:rgba(20,184,166,0.06)' : ''};color:#e8e0d0">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    case 'divider':
      return `<div style="text-align:center;margin:1.5rem 0;color:#666">✦</div>`;
    case 'audio':
      return block.metadata?.fileName ? `<div style="margin:0.75rem 0;padding:0.75rem 1rem;border-radius:0.75rem;background:rgba(244,114,182,0.06);border:1px solid rgba(244,114,182,0.12);color:#f472b6;font-size:0.875rem">🎵 ${escapeHtml(block.metadata.fileName)} <em style="font-size:0.75rem;opacity:0.7">(audio non exportable)</em></div>` : '';
    default:
      return content ? `<p style="font-size:0.875rem;line-height:1.8;color:#c0b8a8;margin-bottom:0.5rem">${renderInlineFormatting(content)}</p>` : '';
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
      background: #0d1117;
      color: #c0b8a8;
      padding: 3rem 2.5rem;
      max-width: 800px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3 { font-family: 'Playfair Display', serif; }
    a { color: #3b82f6; }
    mark { background: rgba(212,173,74,0.18) !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    @media print {
      body { padding: 1.5rem; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div style="margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(255,255,255,0.08)">
    <h1 style="font-size:2rem;font-weight:800;color:#e8e0d0;font-family:'Playfair Display',serif;margin-bottom:0.5rem">${escapeHtml(title)}</h1>
    ${subtitle ? `<p style="font-size:0.875rem;color:#888">${escapeHtml(subtitle)}</p>` : ''}
    <p style="font-size:0.75rem;color:#555;margin-top:0.5rem">Exporté depuis Ilmify — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  ${html}
  <div style="margin-top:3rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08);text-align:center">
    <p style="font-size:0.7rem;color:#555">Généré par Ilmify — votre compagnon de savoir islamique</p>
  </div>
</body>
</html>`);

  printWindow.document.close();
  // Give fonts time to load
  setTimeout(() => {
    printWindow.print();
  }, 800);
}
