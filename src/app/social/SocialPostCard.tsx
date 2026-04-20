'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Eye, MessageSquare, Play } from 'lucide-react';
import { platformLabel, platformColor } from '@/lib/social/platforms';
import type { SocialPost } from '@/types';

interface Props {
  post: SocialPost;
  onToggleFavorite?: (post: SocialPost) => void;
}

function formatCount(n?: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(s?: number): string | null {
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function SocialPostCard({ post, onToggleFavorite }: Props) {
  const color = platformColor(post.platform);
  const dur = formatDuration(post.durationSec);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <Link href={`/social/${post.id}`} className="block">
        {/* Thumbnail 9:16 for Reels/TikTok feel */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: post.platform === 'youtube' ? '16/9' : '9/16', background: 'var(--bg-secondary)' }}
        >
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title || 'Post'}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={48} style={{ color: 'var(--text-secondary)' }} />
            </div>
          )}

          {/* Platform ribbon */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: color, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}
          >
            {platformLabel(post.platform)}
          </div>

          {/* Duration */}
          {dur && (
            <div
              className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono"
              style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
            >
              {dur}
            </div>
          )}

          {/* Play hover overlay */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <div className="rounded-full w-14 h-14 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.95)', color: color }}>
              <Play size={24} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Caption + stats */}
        <div className="p-3 flex flex-col gap-2">
          {post.author && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>@{post.author}</span>
            </div>
          )}
          <p
            className="text-sm line-clamp-2"
            style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}
          >
            {post.title || post.caption || '(sans titre)'}
          </p>

          {(post.stats.likes || post.stats.views || post.stats.comments) && (
            <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {post.stats.views != null && (
                <span className="flex items-center gap-1"><Eye size={11} />{formatCount(post.stats.views)}</span>
              )}
              {post.stats.likes != null && (
                <span className="flex items-center gap-1"><Heart size={11} />{formatCount(post.stats.likes)}</span>
              )}
              {post.stats.comments != null && (
                <span className="flex items-center gap-1"><MessageSquare size={11} />{formatCount(post.stats.comments)}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Favorite toggle — outside Link to avoid navigation */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(post); }}
          className="absolute top-2 right-2 p-1.5 rounded-full cursor-pointer transition-transform hover:scale-110"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          aria-label="Favori"
        >
          <Heart
            size={14}
            fill={post.isFavorite ? '#ff4b7d' : 'none'}
            style={{ color: post.isFavorite ? '#ff4b7d' : 'white' }}
          />
        </button>
      )}
    </motion.div>
  );
}
