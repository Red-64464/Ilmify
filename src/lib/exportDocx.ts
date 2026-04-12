import type { TopicBlock } from '@/types';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function blockToDocxParagraphs(block: TopicBlock): string {
  const content = escapeXml(block.content || '');
  const lines = content.split('\n').filter(Boolean);

  switch (block.type) {
    case 'heading1':
      return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${content}</w:t></w:r></w:p>`;
    case 'heading2':
      return `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${content}</w:t></w:r></w:p>`;
    case 'heading3':
      return `<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>${content}</w:t></w:r></w:p>`;
    case 'paragraph':
      return content ? `<w:p><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>` : '<w:p/>';
    case 'quote':
      return `<w:p><w:pPr><w:ind w:left="720"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">« ${content} »</w:t></w:r></w:p>`;
    case 'bullet-list':
      return lines.map(line => `<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t xml:space="preserve">• ${escapeXml(line)}</w:t></w:r></w:p>`).join('');
    case 'numbered-list':
      return lines.map((line, i) => `<w:p><w:pPr><w:pStyle w:val="ListNumber"/></w:pPr><w:r><w:t xml:space="preserve">${i + 1}. ${escapeXml(line)}</w:t></w:r></w:p>`).join('');
    case 'callout':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="FEF9E7"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">ℹ️ </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>`;
    case 'warning':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="FEF2F2"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">⚠️ </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>`;
    case 'reflection':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="ECFDF5"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">💡 </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>`;
    case 'reminder':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="FFFBEB"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">🔔 </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>`;
    case 'hadith':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="F0FDFA"/><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="0D9488"/></w:rPr><w:t xml:space="preserve">📖 Hadith : </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>${block.metadata?.source ? `<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">— ${escapeXml(block.metadata.source)}</w:t></w:r></w:p>` : ''}`;
    case 'verse':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="FDF6E3"/><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="92702E"/></w:rPr><w:t xml:space="preserve">📖 Verset : </w:t></w:r>${block.metadata?.arabic ? `<w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">${escapeXml(block.metadata.arabic)} </w:t></w:r>` : ''}<w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>${block.metadata?.source ? `<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">— ${escapeXml(block.metadata.source)}</w:t></w:r></w:p>` : ''}`;
    case 'dua':
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="ECFDF5"/><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="059669"/></w:rPr><w:t xml:space="preserve">🤲 Dua : </w:t></w:r><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>`;
    case 'definition': {
      const parts = content.split('---');
      return `<w:p><w:pPr><w:shd w:val="clear" w:fill="F5F3FF"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="5B21B6"/></w:rPr><w:t xml:space="preserve">📝 ${escapeXml(parts[0]?.trim() || '')} : </w:t></w:r>${parts[1] ? `<w:r><w:t xml:space="preserve">${escapeXml(parts[1].trim())}</w:t></w:r>` : ''}</w:p>`;
    }
    case 'divider':
      return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>✦ ✦ ✦</w:t></w:r></w:p>`;
    default:
      return content ? `<w:p><w:r><w:t xml:space="preserve">${content}</w:t></w:r></w:p>` : '';
  }
}

/**
 * Generates a .docx file from topic blocks and triggers download.
 * Uses a minimal Office Open XML structure (no external library needed).
 */
export function exportToDocx(title: string, blocks: TopicBlock[], subtitle?: string) {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const bodyContent = blocks.map(blockToDocxParagraphs).join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${escapeXml(title)}</w:t></w:r></w:p>
    ${subtitle ? `<w:p><w:r><w:rPr><w:i/><w:color w:val="666666"/></w:rPr><w:t>${escapeXml(subtitle)}</w:t></w:r></w:p>` : ''}
    <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="999999"/></w:rPr><w:t>Exporté depuis Ilmify — ${date}</w:t></w:r></w:p>
    <w:p/>
    ${bodyContent}
    <w:p/>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="999999"/></w:rPr><w:t>Généré par Ilmify — votre compagnon de savoir islamique</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  // Build a minimal ZIP using the Blob API (no external deps)
  // We use the uncompressed "store" method for simplicity
  const files: { path: string; data: Uint8Array }[] = [
    { path: '[Content_Types].xml', data: new TextEncoder().encode(contentTypesXml) },
    { path: '_rels/.rels', data: new TextEncoder().encode(relsXml) },
    { path: 'word/_rels/document.xml.rels', data: new TextEncoder().encode(wordRelsXml) },
    { path: 'word/document.xml', data: new TextEncoder().encode(documentXml) },
  ];

  const zipData = buildMinimalZip(files);
  const blob = new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '_')}_Ilmify.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Minimal ZIP builder using stored (uncompressed) entries */
function buildMinimalZip(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const entries: { path: Uint8Array; data: Uint8Array; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const pathBytes = new TextEncoder().encode(file.path);
    const data = file.data;

    // Local file header
    const header = new Uint8Array(30 + pathBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x04034b50, true); // signature
    hv.setUint16(4, 20, true); // version needed
    hv.setUint16(6, 0, true); // flags
    hv.setUint16(8, 0, true); // compression (stored)
    hv.setUint16(10, 0, true); // mod time
    hv.setUint16(12, 0, true); // mod date
    hv.setUint32(14, crc32(data), true); // crc32
    hv.setUint32(18, data.length, true); // compressed size
    hv.setUint32(22, data.length, true); // uncompressed size
    hv.setUint16(26, pathBytes.length, true); // filename length
    hv.setUint16(28, 0, true); // extra field length
    header.set(pathBytes, 30);

    entries.push({ path: pathBytes, data, offset });
    parts.push(header, data);
    offset += header.length + data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.path.length);
    const dv = new DataView(cd.buffer);
    dv.setUint32(0, 0x02014b50, true); // signature
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed
    dv.setUint16(8, 0, true); // flags
    dv.setUint16(10, 0, true); // compression
    dv.setUint16(12, 0, true); // mod time
    dv.setUint16(14, 0, true); // mod date
    dv.setUint32(16, crc32(entry.data), true); // crc32
    dv.setUint32(20, entry.data.length, true); // compressed size
    dv.setUint32(24, entry.data.length, true); // uncompressed size
    dv.setUint16(28, entry.path.length, true); // filename length
    dv.setUint16(30, 0, true); // extra field length
    dv.setUint16(32, 0, true); // comment length
    dv.setUint16(34, 0, true); // disk start
    dv.setUint16(36, 0, true); // internal attributes
    dv.setUint32(38, 0, true); // external attributes
    dv.setUint32(42, entry.offset, true); // local header offset
    cd.set(entry.path, 46);
    parts.push(cd);
    offset += cd.length;
  }

  // End of central directory
  const cdSize = offset - cdStart;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // cd disk number
  ev.setUint16(8, entries.length, true); // entries on this disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, cdSize, true); // cd size
  ev.setUint32(16, cdStart, true); // cd offset
  ev.setUint16(20, 0, true); // comment length
  parts.push(eocd);

  // Combine all parts
  const total = parts.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}

/** Simple CRC32 implementation */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
