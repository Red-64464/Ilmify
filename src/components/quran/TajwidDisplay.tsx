'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';

// ── Tajwid rule definitions ──────────────────────────────────────────────

interface TajwidRule {
  id: string;
  nameAr: string;
  nameFr: string;
  color: string;
  explanation: string;
  example: string;
}

const TAJWID_RULES: TajwidRule[] = [
  {
    id: 'ghunna',
    nameAr: 'غنّة',
    nameFr: 'Nasalisation',
    color: '#1fa86a',
    explanation: 'Son nasal prolongé sur le noun ou meem doublé (avec shaddah).',
    example: 'إنَّ / ثُمَّ',
  },
  {
    id: 'idghaam',
    nameAr: 'إدغام',
    nameFr: 'Assimilation',
    color: '#2196f3',
    explanation: 'Le noun sakinah ou tanween est assimilé dans la lettre suivante (ي ر م ل و ن).',
    example: 'مَن يَعْمَلْ',
  },
  {
    id: 'ikhfa',
    nameAr: 'إخفاء',
    nameFr: 'Dissimulation',
    color: '#ff9800',
    explanation: 'Le noun sakinah ou tanween est prononcé de manière cachée avant certaines lettres.',
    example: 'مِن قَبْلِ',
  },
  {
    id: 'iqlab',
    nameAr: 'إقلاب',
    nameFr: 'Conversion',
    color: '#9c27b0',
    explanation: 'Le noon sakinah ou tanween se transforme en meem devant la lettre ba.',
    example: 'مِن بَعْدِ',
  },
  {
    id: 'qalqalah',
    nameAr: 'قلقلة',
    nameFr: 'Écho',
    color: '#e91e63',
    explanation: 'Rebondissement sonore sur les lettres ق ط ب ج د quand elles portent un sukoon.',
    example: 'يَخْلُقْ',
  },
  {
    id: 'madd',
    nameAr: 'مدّ',
    nameFr: 'Prolongation',
    color: '#f44336',
    explanation: 'Allongement de la voyelle : alif après fatha, waw après damma, ya après kasra.',
    example: 'قَالَ / يَقُولُ',
  },
  {
    id: 'idghaam_shafawi',
    nameAr: 'إدغام شفوي',
    nameFr: 'Assimilation labiale',
    color: '#00bcd4',
    explanation: 'Le meem sakinah est assimilé quand il est suivi d\'un autre meem.',
    example: 'لَهُم مَا',
  },
];

const RULE_MAP = Object.fromEntries(
  TAJWID_RULES.map((r) => [r.id, r]),
) as Record<string, TajwidRule>;

// ── Unicode constants ────────────────────────────────────────────────────

const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';
const SUKOON = '\u0652';
const SHADDAH = '\u0651';
const TANWEEN_FATH = '\u064B';
const TANWEEN_DAMM = '\u064C';
const TANWEEN_KASR = '\u064D';

const NOON = '\u0646';
const MEEM = '\u0645';
const ALIF = '\u0627';
const WAW = '\u0648';
const YA = '\u064A';

const IDGHAAM_LETTERS = 'يرملون';
const IKHFA_LETTERS = 'تثجدذزسشصضطظفقك';
const IQLAB_LETTER = '\u0628'; // ba
const QALQALAH_LETTERS = 'قطبجد';

// Diacritics character class (zero-width marks that follow a base letter)
const DIACRITICS = `${FATHA}${DAMMA}${KASRA}${SUKOON}${SHADDAH}${TANWEEN_FATH}${TANWEEN_DAMM}${TANWEEN_KASR}\u0670\u0671`;
const DIACRITICS_CLASS = `[${DIACRITICS}]`;

// ── Tajwid segment detection ─────────────────────────────────────────────

interface TajwidSegment {
  text: string;
  rule: string | null; // null = no highlighting
}

function detectTajwid(text: string): TajwidSegment[] {
  // Build an array mapping each character index to a rule (or null).
  const ruleMap: (string | null)[] = new Array(text.length).fill(null);

  // Helper: mark a range with a rule (won't overwrite existing marks)
  const mark = (start: number, length: number, rule: string) => {
    for (let i = start; i < start + length && i < text.length; i++) {
      if (ruleMap[i] === null) {
        ruleMap[i] = rule;
      }
    }
  };

  // Helper: count consecutive diacritics starting at position
  const diacriticsAfter = (pos: number): number => {
    let count = 0;
    const re = new RegExp(DIACRITICS_CLASS);
    while (pos + 1 + count < text.length && re.test(text[pos + 1 + count])) {
      count++;
    }
    return count;
  };

  // Helper: find next base letter (skipping diacritics and spaces) after pos
  const nextBaseLetter = (pos: number): { char: string; index: number } | null => {
    let i = pos + 1;
    const diacRe = new RegExp(DIACRITICS_CLASS);
    while (i < text.length) {
      if (!diacRe.test(text[i]) && text[i] !== ' ') {
        return { char: text[i], index: i };
      }
      i++;
    }
    return null;
  };

  // Scan each character
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const diacCount = diacriticsAfter(i);
    const diacSlice = text.slice(i + 1, i + 1 + diacCount);

    // 1. Ghunna: noon or meem with shaddah
    if ((ch === NOON || ch === MEEM) && diacSlice.includes(SHADDAH)) {
      mark(i, 1 + diacCount, 'ghunna');
      continue;
    }

    // 2. Qalqalah: specific letters with sukoon
    if (QALQALAH_LETTERS.includes(ch) && diacSlice.includes(SUKOON)) {
      mark(i, 1 + diacCount, 'qalqalah');
      continue;
    }

    // 3. Madd: long vowels
    //    - Alif after fatha on preceding letter
    //    - Waw (with sukoon or no vowel) after damma on preceding letter
    //    - Ya (with sukoon or no vowel) after kasra on preceding letter
    if (ch === ALIF && i > 0) {
      // Check if the previous base letter had fatha
      const prevSlice = text.slice(Math.max(0, i - 4), i);
      if (prevSlice.includes(FATHA)) {
        mark(i, 1 + diacCount, 'madd');
        continue;
      }
    }
    if (ch === WAW && (diacSlice.includes(SUKOON) || diacCount === 0)) {
      const prevSlice = text.slice(Math.max(0, i - 4), i);
      if (prevSlice.includes(DAMMA)) {
        mark(i, 1 + diacCount, 'madd');
        continue;
      }
    }
    if (ch === YA && (diacSlice.includes(SUKOON) || diacCount === 0)) {
      const prevSlice = text.slice(Math.max(0, i - 4), i);
      if (prevSlice.includes(KASRA)) {
        mark(i, 1 + diacCount, 'madd');
        continue;
      }
    }

    // 4. Noon sakinah / tanween rules
    const isNoonSakin = ch === NOON && (diacSlice.includes(SUKOON) || diacCount === 0);
    const isTanween =
      ch === TANWEEN_FATH || ch === TANWEEN_DAMM || ch === TANWEEN_KASR;

    if (isNoonSakin || isTanween) {
      const next = nextBaseLetter(i + diacCount);
      if (next) {
        // Iqlab: before ba
        if (next.char === IQLAB_LETTER) {
          const spanLen = isTanween ? 1 : 1 + diacCount;
          mark(i, spanLen, 'iqlab');
          continue;
        }
        // Idghaam: before ي ر م ل و ن
        if (IDGHAAM_LETTERS.includes(next.char)) {
          const spanLen = isTanween ? 1 : 1 + diacCount;
          mark(i, spanLen, 'idghaam');
          continue;
        }
        // Ikhfa: before specific letters
        if (IKHFA_LETTERS.includes(next.char)) {
          const spanLen = isTanween ? 1 : 1 + diacCount;
          mark(i, spanLen, 'ikhfa');
          continue;
        }
      }
    }

    // 5. Idghaam Shafawi: meem sakinah before meem
    if (ch === MEEM && (diacSlice.includes(SUKOON) || diacCount === 0)) {
      const next = nextBaseLetter(i + diacCount);
      if (next && next.char === MEEM) {
        mark(i, 1 + diacCount, 'idghaam_shafawi');
        continue;
      }
    }
  }

  // Collapse consecutive chars with the same rule into segments
  const segments: TajwidSegment[] = [];
  let currentRule: string | null = ruleMap[0];
  let currentText = text[0] ?? '';

  for (let i = 1; i < text.length; i++) {
    if (ruleMap[i] === currentRule) {
      currentText += text[i];
    } else {
      if (currentText) {
        segments.push({ text: currentText, rule: currentRule });
      }
      currentRule = ruleMap[i];
      currentText = text[i];
    }
  }
  if (currentText) {
    segments.push({ text: currentText, rule: currentRule });
  }

  return segments;
}

// ── Component ────────────────────────────────────────────────────────────

interface TajwidDisplayProps {
  text: string;
  fontSize?: number; // rem
  enabled?: boolean; // if false, render plain text
}

export default function TajwidDisplay({
  text,
  fontSize = 1.75,
  enabled = true,
}: TajwidDisplayProps) {
  const [showInfo, setShowInfo] = useState(false);

  const segments = useMemo(
    () => (enabled ? detectTajwid(text) : [{ text, rule: null }]),
    [text, enabled],
  );

  return (
    <div>
      {/* Arabic text with tajwid coloring */}
      <p
        dir="rtl"
        lang="ar"
        style={{
          fontFamily: 'var(--font-arabic)',
          fontSize: `${fontSize}rem`,
          lineHeight: 2.2,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {segments.map((seg, idx) =>
          seg.rule ? (
            <span
              key={idx}
              style={{
                color: RULE_MAP[seg.rule]?.color,
                textShadow: `0 0 8px ${RULE_MAP[seg.rule]?.color}33`,
              }}
              title={RULE_MAP[seg.rule]?.nameFr}
            >
              {seg.text}
            </span>
          ) : (
            <span key={idx}>{seg.text}</span>
          ),
        )}
      </p>

      {/* Toggle button for info panel */}
      {enabled && (
        <button
          onClick={() => setShowInfo((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginTop: 'var(--space-md)',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <BookOpen size={14} />
          Règles de Tajwid
          <motion.span
            animate={{ rotate: showInfo ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'inline-flex' }}
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
      )}

      {/* Collapsible info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h4
                style={{
                  margin: '0 0 var(--space-md) 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Guide des règles de Tajwid
              </h4>

              <div
                style={{
                  display: 'grid',
                  gap: 'var(--space-sm)',
                }}
              >
                {TAJWID_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Color swatch */}
                    <span
                      style={{
                        flexShrink: 0,
                        width: '0.625rem',
                        height: '0.625rem',
                        borderRadius: 'var(--radius-full)',
                        background: rule.color,
                        boxShadow: `0 0 6px ${rule.color}66`,
                      }}
                    />

                    {/* Rule details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 'var(--space-sm)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-arabic)',
                            fontSize: '0.9375rem',
                            color: rule.color,
                            fontWeight: 600,
                          }}
                        >
                          {rule.nameAr}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                          }}
                        >
                          {rule.nameFr}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '0.125rem 0 0 0',
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                        }}
                      >
                        {rule.explanation}
                      </p>
                    </div>

                    {/* Example */}
                    <span
                      dir="rtl"
                      lang="ar"
                      style={{
                        flexShrink: 0,
                        fontFamily: 'var(--font-arabic)',
                        fontSize: '0.875rem',
                        color: rule.color,
                        opacity: 0.8,
                      }}
                    >
                      {rule.example}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
