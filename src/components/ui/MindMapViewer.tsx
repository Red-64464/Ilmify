'use client';

import { useMemo } from 'react';
import type { MindMapNode } from '@/lib/ai/groq';

interface MindMapViewerProps {
  data: MindMapNode;
}

const COLORS = ['#2e9e8c', '#d4ad4a', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

function getColor(depth: number, index: number): string {
  return COLORS[(depth + index) % COLORS.length];
}

interface NodePosition {
  node: MindMapNode;
  x: number;
  y: number;
  color: string;
  depth: number;
  parentX?: number;
  parentY?: number;
}

function layoutTree(root: MindMapNode, width: number, height: number): NodePosition[] {
  const positions: NodePosition[] = [];
  const cx = width / 2;
  const cy = height / 2;

  // Root
  positions.push({ node: root, x: cx, y: cy, color: '#d4ad4a', depth: 0 });

  const children = root.children || [];
  if (children.length === 0) return positions;

  const angleStep = (2 * Math.PI) / children.length;
  const radius1 = Math.min(width, height) * 0.28;

  children.forEach((child, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const childX = cx + radius1 * Math.cos(angle);
    const childY = cy + radius1 * Math.sin(angle);
    const childColor = getColor(1, i);

    positions.push({ node: child, x: childX, y: childY, color: childColor, depth: 1, parentX: cx, parentY: cy });

    const grandchildren = child.children || [];
    if (grandchildren.length > 0) {
      const subAngleSpread = (Math.PI * 0.4) / Math.max(grandchildren.length - 1, 1);
      const baseAngle = angle;
      const radius2 = radius1 * 0.65;

      grandchildren.forEach((gc, j) => {
        const gcAngle = baseAngle + (j - (grandchildren.length - 1) / 2) * subAngleSpread;
        const gcX = childX + radius2 * Math.cos(gcAngle);
        const gcY = childY + radius2 * Math.sin(gcAngle);

        positions.push({ node: gc, x: gcX, y: gcY, color: childColor, depth: 2, parentX: childX, parentY: childY });
      });
    }
  });

  return positions;
}

export default function MindMapViewer({ data }: MindMapViewerProps) {
  const width = 700;
  const height = 500;

  const positions = useMemo(() => layoutTree(data, width, height), [data]);

  return (
    <div className="w-full overflow-auto rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minHeight: '400px', maxHeight: '600px' }}
      >
        {/* Connections */}
        {positions.filter(p => p.parentX !== undefined).map((p, i) => (
          <line
            key={`line-${i}`}
            x1={p.parentX}
            y1={p.parentY}
            x2={p.x}
            y2={p.y}
            stroke={p.color}
            strokeWidth={p.depth === 1 ? 2 : 1.5}
            strokeOpacity={0.3}
          />
        ))}

        {/* Nodes */}
        {positions.map((p, i) => {
          const isRoot = p.depth === 0;
          const r = isRoot ? 45 : p.depth === 1 ? 35 : 28;
          const fontSize = isRoot ? 11 : p.depth === 1 ? 9 : 7.5;
          const label = p.node.label.length > 30 ? p.node.label.slice(0, 28) + '…' : p.node.label;

          // Word wrap for long labels
          const words = label.split(' ');
          const lines: string[] = [];
          let currentLine = '';
          const maxCharsPerLine = isRoot ? 16 : 14;

          for (const word of words) {
            if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = (currentLine + ' ' + word).trim();
            }
          }
          if (currentLine) lines.push(currentLine);

          return (
            <g key={`node-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={isRoot ? p.color : `${p.color}18`}
                stroke={p.color}
                strokeWidth={isRoot ? 2 : 1}
              />
              {lines.map((line, li) => (
                <text
                  key={`text-${i}-${li}`}
                  x={p.x}
                  y={p.y + (li - (lines.length - 1) / 2) * (fontSize + 2)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isRoot ? '#fff' : p.color}
                  fontSize={fontSize}
                  fontWeight={isRoot ? 700 : p.depth === 1 ? 600 : 400}
                  fontFamily="Inter, sans-serif"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
