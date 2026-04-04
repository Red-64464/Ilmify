'use client';

import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher...', className = '', onFocus, onBlur, autoFocus }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ilm-sage" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full pl-10 pr-10 py-2.5 bg-ilm-card/80 backdrop-blur-sm border border-ilm-accent/20 rounded-xl text-ilm-ivory text-sm placeholder:text-ilm-sage/60 focus:outline-none focus:border-ilm-teal/50 transition-colors"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ilm-sage hover:text-ilm-ivory">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
