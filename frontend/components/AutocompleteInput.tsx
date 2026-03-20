"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AutocompleteInputProps {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function AutocompleteInput({
  suggestions,
  value,
  onChange,
  onSelect,
  placeholder = "Type to search...",
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filterTerms = value.toLowerCase().split(' ').filter(t => t.length > 0);
  const filtered = suggestions.filter((s) => {
    const sLow = s.toLowerCase();
    return filterTerms.length === 0 || filterTerms.every(term => sLow.includes(term));
  });

  const showDropdown = isOpen && value.trim().length > 0 && filtered.length > 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        onSelect(filtered[activeIndex]);
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [showDropdown, activeIndex, filtered, onSelect]
  );

  // Highlight matched text
  const renderHighlighted = (text: string) => {
    if (!value.trim()) return text;
    
    // Create a regex to match any of the filter terms, case-insensitive
    const terms = value.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return text;
    
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="ac-highlight">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="ac-wrapper" ref={wrapperRef}>
      <input
        className="dash-config-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="ac-dropdown" ref={listRef}>
          {filtered.slice(0, 12).map((item, i) => (
            <li
              key={item}
              className={`ac-item ${i === activeIndex ? "ac-active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setIsOpen(false);
                setActiveIndex(-1);
              }}
            >
              {renderHighlighted(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
