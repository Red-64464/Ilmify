'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id ?? '');
  const currentTab = activeTab ?? internalActive;

  const handleChange = (tabId: string) => {
    if (!activeTab) setInternalActive(tabId);
    onChange?.(tabId);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl p-1 ${className}`}
      style={{ background: 'var(--bg-secondary)' }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(tab.id)}
            className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-primary-600/20 border border-primary-500/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
