'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
}

export function SearchInput({
  onSearch,
  placeholder = 'Search...',
  delay = 300,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, delay);

  useState(() => {
    if (debouncedValue !== undefined) {
      onSearch(debouncedValue);
    }
  });

  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <Input
        id="search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </div>
  );
}
