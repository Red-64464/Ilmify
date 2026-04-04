'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.15 } },
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  maxWidth = '28rem',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full rounded-2xl p-6 ${className}`}
            style={{
              maxWidth,
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || true) && (
              <div className="mb-5 flex items-center justify-between">
                {title && (
                  <h2
                    className="text-lg font-semibold tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {title}
                  </h2>
                )}
                <button
                  onClick={onClose}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
