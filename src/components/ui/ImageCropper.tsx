'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move } from 'lucide-react';
import Modal from './Modal';

interface ImageCropperProps {
  imageDataUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height, undefined = free
}

export default function ImageCropper({ imageDataUrl, onCrop, onCancel, aspectRatio }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const cropSize = 300;
    const outputSize = Math.min(800, Math.max(imgSize.w, imgSize.h));
    canvas.width = aspectRatio ? outputSize : outputSize;
    canvas.height = aspectRatio ? outputSize / aspectRatio : outputSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate what part of the image to draw
    const displayW = imgSize.w * zoom;
    const displayH = imgSize.h * zoom;

    // Image display position: centered + offset
    const imgDisplayX = (cropSize - displayW) / 2 + offset.x;
    const imgDisplayY = (cropSize - displayH) / 2 + offset.y;

    // Source coordinates in image space
    const srcX = (0 - imgDisplayX) / zoom;
    const srcY = (0 - imgDisplayY) / zoom;
    const srcW = cropSize / zoom;
    const srcH = aspectRatio ? srcW / aspectRatio : srcW;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedDataUrl);
  }, [imgSize, zoom, offset, aspectRatio, onCrop]);

  return (
    <Modal isOpen onClose={onCancel} title="Recadrer l'image">
      <div className="space-y-4">
        {/* Crop area */}
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl cursor-move select-none"
            style={{
              width: 300,
              height: aspectRatio ? 300 / aspectRatio : 300,
              background: 'rgba(0,0,0,0.8)',
              border: '2px solid rgba(46,158,140,0.4)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {imgSize.w > 0 && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageDataUrl}
                alt="Crop preview"
                className="pointer-events-none absolute"
                style={{
                  width: imgSize.w * zoom,
                  height: imgSize.h * zoom,
                  left: `calc(50% - ${(imgSize.w * zoom) / 2 - offset.x}px)`,
                  top: `calc(50% - ${(imgSize.h * zoom) / 2 - offset.y}px)`,
                  maxWidth: 'none',
                }}
                draggable={false}
              />
            )}
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '33.33% 33.33%',
            }} />
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <Move size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Glisser pour déplacer</span>
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
            className="p-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={20}
            max={300}
            value={zoom * 100}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-40 accent-[#2e9e8c]"
            style={{ height: 4 }}
          />
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="p-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="p-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            title="Réinitialiser"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Zoom: {Math.round(zoom * 100)}%
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <X size={14} />
            Annuler
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{ background: 'rgba(46,158,140,0.15)', color: '#2e9e8c', border: '1px solid rgba(46,158,140,0.25)' }}
          >
            <Check size={14} />
            Valider
          </button>
        </div>

        {/* Hidden canvas for crop output */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Modal>
  );
}
