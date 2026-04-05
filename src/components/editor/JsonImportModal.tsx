'use client';

import React, { useState, useMemo } from 'react';
import { Upload, AlertTriangle, CheckCircle, HelpCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ReadOnlyBlock } from '@/components/editor/BlockEditor';
import { parseAndValidateBlocks, extractTitleFromJson } from '@/lib/importJson';
import type { TopicBlock } from '@/types';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (title: string, blocks: TopicBlock[]) => void;
  importing?: boolean;
}

export default function JsonImportModal({ isOpen, onClose, onImport, importing }: JsonImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [title, setTitle] = useState('');
  const [showTuto, setShowTuto] = useState(false);

  const result = useMemo(() => {
    if (!jsonText.trim()) return null;
    return parseAndValidateBlocks(jsonText);
  }, [jsonText]);

  const extractedTitle = useMemo(() => {
    if (!jsonText.trim()) return null;
    return extractTitleFromJson(jsonText);
  }, [jsonText]);

  const effectiveTitle = title.trim() || extractedTitle || '';

  const handleImport = () => {
    if (!result || result.blocks.length === 0 || !effectiveTitle) return;
    onImport(effectiveTitle, result.blocks);
  };

  const handleClose = () => {
    setJsonText('');
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer du JSON" maxWidth="42rem">
      <div className="space-y-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Titre de la page
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={extractedTitle || 'Ex: Les piliers de l\'islam'}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>

        {/* Tutorial toggle */}
        <button
          onClick={() => setShowTuto(!showTuto)}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: 'rgba(99,102,241,0.08)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <HelpCircle size={15} />
          <span className="flex-1 text-left">Comment créer le JSON ?</span>
          {showTuto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showTuto && (
          <TutorialPanel onCopy={(text) => {
            navigator.clipboard.writeText(text);
          }} />
        )}

        {/* JSON input */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Collez votre JSON
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={'[\n  { "type": "heading1", "content": "Mon titre" },\n  { "type": "paragraph", "content": "Mon texte..." }\n]'}
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono placeholder:text-[var(--text-muted)]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Warnings */}
        {result && result.warnings.length > 0 && (
          <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(239,68,68,0.08)' }}>
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#ef4444' }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Success summary */}
        {result && result.blocks.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
            <CheckCircle size={14} />
            <span>{result.blocks.length} bloc{result.blocks.length > 1 ? 's' : ''} prêt{result.blocks.length > 1 ? 's' : ''} à importer</span>
          </div>
        )}

        {/* Preview */}
        {result && result.blocks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Aperçu
            </label>
            <div
              className="rounded-xl px-4 py-3 space-y-2"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {result.blocks.slice(0, 20).map((block) => (
                <ReadOnlyBlock key={block.id} block={block} />
              ))}
              {result.blocks.length > 20 && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                  … et {result.blocks.length - 20} bloc{result.blocks.length - 20 > 1 ? 's' : ''} de plus
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={handleClose} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={!result || result.blocks.length === 0 || !effectiveTitle || importing}
            className="flex-1"
          >
            {importing ? 'Import en cours...' : (
              <span className="flex items-center justify-center gap-2">
                <Upload size={16} />
                Importer
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const TUTO_PROMPT = `Génère un JSON pour Ilmify avec cette structure :
{
  "title": "Titre de la page",
  "blocks": [
    { "type": "...", "content": "...", "metadata": { ... } }
  ]
}

TYPES DE BLOCS DISPONIBLES :

Titres et texte :
- heading1 : Titre principal
- heading2 : Sous-titre
- heading3 : Sous-sous-titre
- paragraph : Paragraphe (supporte ==texte== pour surligner)

Listes :
- bullet-list : Liste à puces (séparer les items par \\n)
- numbered-list : Liste numérotée (séparer les items par \\n)
- checklist : Checklist (préfixer ✓ pour coché, séparer par \\n)

Mise en forme :
- quote : Citation
- callout : Point important / encadré
- warning : Avertissement
- reflection : Réflexion personnelle
- reminder : Rappel
- divider : Séparateur (content vide)

Contenu islamique :
- verse : Verset du Coran
  metadata: { arabic: "texte arabe", source: "Sourate X, Verset Y" }
- hadith : Hadith
  metadata: { source: "Sahih al-Bukhari 123", grade: "Sahih" }
- dua : Invocation
  metadata: { arabic: "texte arabe", source: "source" }

Structurel :
- definition : Définition (format: "Terme---Définition" dans content)
- qa : Question/Réponse (format: "Question---Réponse" dans content)
- source : Source ou référence
  metadata: { source: "nom de la source" }
- timeline : Chronologie (format: "Date — Événement" par ligne, séparer par \\n)
- poem : Poème (séparer les vers par \\n)
  metadata: { source: "auteur" }
- table : Tableau
  metadata: { tableData: "[[\\"col1\\",\\"col2\\"],[\\"val1\\",\\"val2\\"]]" }

Médias :
- image : Image (content = description)
- youtube : Vidéo YouTube (content = URL YouTube)
- link : Lien (content = URL)
- audio : Audio
- pdf : PDF

EXEMPLE COMPLET :
{
  "title": "Les piliers de l'islam",
  "blocks": [
    { "type": "heading1", "content": "Les 5 piliers de l'Islam" },
    { "type": "paragraph", "content": "L'Islam repose sur ==cinq piliers== fondamentaux." },
    { "type": "hadith", "content": "L'Islam est bâti sur cinq piliers...", "metadata": { "source": "Sahih al-Bukhari 8", "grade": "Sahih" } },
    { "type": "bullet-list", "content": "La Shahada\\nLa Salat\\nLa Zakat\\nLe Sawm\\nLe Hajj" },
    { "type": "verse", "content": "Accomplissez la prière et acquittez la Zakat.", "metadata": { "arabic": "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ", "source": "Sourate Al-Baqara, Verset 43" } },
    { "type": "callout", "content": "Ces 5 piliers sont la base de la pratique de tout musulman." },
    { "type": "definition", "content": "Shahada---Attestation de foi : il n'y a de divinité qu'Allah" },
    { "type": "qa", "content": "Quel est le premier pilier ?---La Shahada (attestation de foi)" },
    { "type": "dua", "content": "Ô Allah, aide-nous à accomplir ces piliers.", "metadata": { "arabic": "اللَّهُمَّ أَعِنَّا عَلَى أَدَاءِ هَذِهِ الأَرْكَانِ" } }
  ]
}`;

function TutorialPanel({ onCopy }: { onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(TUTO_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          📋 Prompt à copier pour l&apos;IA
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
          style={{
            background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)',
            color: copied ? '#22c55e' : '#818cf8',
          }}
        >
          <Copy size={12} />
          {copied ? 'Copié !' : 'Copier le prompt'}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Copiez ce prompt et donnez-le à une IA (ChatGPT, Claude, Gemini…) avec votre sujet. Elle générera le JSON à coller ici.
        </p>

        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Structure</h4>
          <pre className="text-[11px] leading-relaxed rounded-lg px-3 py-2 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
{`{
  "title": "Titre",
  "blocks": [
    { "type": "...", "content": "..." },
    { "type": "...", "content": "...",
      "metadata": { "key": "value" } }
  ]
}`}
          </pre>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Types de blocs</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              ['heading1', 'Titre H1'],
              ['heading2', 'Titre H2'],
              ['paragraph', 'Paragraphe'],
              ['quote', 'Citation'],
              ['bullet-list', 'Liste à puces'],
              ['numbered-list', 'Liste numérotée'],
              ['checklist', 'Checklist'],
              ['callout', 'Important'],
              ['warning', 'Avertissement'],
              ['reflection', 'Réflexion'],
              ['reminder', 'Rappel'],
              ['definition', 'Définition'],
              ['verse', 'Verset ✨'],
              ['hadith', 'Hadith ✨'],
              ['dua', 'Invocation ✨'],
              ['source', 'Source'],
              ['qa', 'Question/Réponse'],
              ['timeline', 'Chronologie'],
              ['poem', 'Poème'],
              ['table', 'Tableau'],
              ['divider', 'Séparateur'],
              ['youtube', 'YouTube'],
              ['link', 'Lien'],
              ['image', 'Image'],
            ].map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <code className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#818cf8' }}>{type}</code>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Métadonnées (✨ blocs enrichis)</h4>
          <div className="space-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <p><code style={{ color: '#818cf8' }}>verse</code> → <code>arabic</code>, <code>source</code> (&quot;Sourate X, Verset Y&quot;)</p>
            <p><code style={{ color: '#818cf8' }}>hadith</code> → <code>source</code>, <code>grade</code> (Sahih, Hasan…)</p>
            <p><code style={{ color: '#818cf8' }}>dua</code> → <code>arabic</code>, <code>source</code></p>
            <p><code style={{ color: '#818cf8' }}>definition</code> → content: &quot;Terme---Définition&quot;</p>
            <p><code style={{ color: '#818cf8' }}>qa</code> → content: &quot;Question---Réponse&quot;</p>
            <p><code style={{ color: '#818cf8' }}>bullet-list</code> → séparer items par \n</p>
            <p><code style={{ color: '#818cf8' }}>table</code> → metadata.tableData: JSON 2D array</p>
          </div>
        </div>
      </div>
    </div>
  );
}
