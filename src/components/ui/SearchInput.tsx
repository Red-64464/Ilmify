'use client';

import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Search...', className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const handleClear = useCallback(() => {
      onChange('');
      onClear?.();
    }, [onChange, onClear]);

    return (
      <div
        className={`relative flex items-center rounded-2xl transition-all duration-300 ${className}`}
        style={{
          background: 'var(--bg-card)',
          border: focused
            ? '1px solid rgba(26, 122, 107, 0.3)'
            : '1px solid var(--border-subtle)',
          boxShadow: focused
            ? '0 0 0 3px rgba(26, 122, 107, 0.08), var(--shadow-card)'
            : 'var(--shadow-card)',
        }}
      >
        <Search
          size={18}
          className="absolute left-4 pointer-events-none transition-colors duration-200"
          style={{ color: focused ? 'var(--accent)' : 'var(--text-muted)' }}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3.5 pl-11 pr-10 text-sm outline-none placeholder:text-[var(--text-muted)]"
          style={{ color: 'var(--text-primary)' }}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full transition-colors duration-200 cursor-pointer"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
