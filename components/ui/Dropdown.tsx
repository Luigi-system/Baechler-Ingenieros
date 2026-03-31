import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
}

interface DropdownProps {
  trigger?: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  label?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right', label = 'Acciones' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-base-content bg-base-300/50 hover:bg-base-300 border border-base-border rounded-lg transition-all active:scale-95 whitespace-nowrap"
          >
            {label}
            <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-2 w-48 rounded-xl bg-base-200 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none 
            border border-base-border animate-fade-in-up overflow-hidden
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.onClick)}
                className={`
                  flex w-full items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${item.variant === 'danger' ? 'text-error hover:bg-error/10' : 
                    item.variant === 'success' ? 'text-success hover:bg-success/10' : 
                    'text-base-content hover:bg-primary/10 hover:text-primary'}
                `}
              >
                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
