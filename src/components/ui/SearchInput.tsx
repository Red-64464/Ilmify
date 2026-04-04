'use client';

import { Search, X } from 'lucide-react';
import { InputHTMLAttributes, forwardRef } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  showClear?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClear, className = '', ...props }, ref) => {
    return (
      <div className={`relative group ${className}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-500 group-focus-within:text-gold-400 transition-colors" />
        <input
          ref={ref}
          type="text"
          className="w-full pl-12 pr-10 py-3.5 bg-primary-800/70 border border-primary-600/40 rounded-2xl
            text-ivory-200 placeholder:text-ivory-500/60
            focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 focus:bg-primary-800
            transition-all duration-300"
          {...props}
        />
        {showClear && (
          <button
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory-500 hover:text-ivory-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
