import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon, SearchIcon, XIcon } from './Icons';

interface Option {
    id: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string | number;
    onChange: (id: string | number, label: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Seleccione una opción...',
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync searchText with the currently selected value's label
    useEffect(() => {
        const valStr = (value !== undefined && value !== null) ? String(value).trim() : '';
        if (valStr !== '') {
            const selectedOption = options.find(opt => String(opt.id).trim() === valStr);
            if (selectedOption) {
                setSearchText(selectedOption.label);
            } else {
                // If not found in current options (loading?), use the value directly
                // but only if it's likely a label/string name
                setSearchText(valStr);
            }
        } else {
            setSearchText('');
        }
    }, [value, options]);

    const filteredOptions = useMemo(() => {
        const currentLabel = options.find(opt => String(opt.id) === String(value))?.label;
        if (!searchText || currentLabel === searchText) {
            return options;
        }
        return options.filter(opt => 
            (opt.label || '').toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, options, value]);

    const handleSelect = (option: Option) => {
        onChange(option.id, option.label);
        setSearchText(option.label);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('', '');
        setSearchText('');
        setIsOpen(true);
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // If it's closed and search text doesn't match selected label, revert search text
                const selectedOption = options.find(opt => opt.id === value);
                if (selectedOption) {
                    setSearchText(selectedOption.label);
                } else if (!value) {
                    setSearchText('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, options]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="relative">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!disabled) setIsOpen(true);
                    }}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium pr-10"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchText && !disabled && (
                        <button 
                            type="button" 
                            onClick={handleClear}
                            className="p-1 hover:bg-base-300 rounded-full text-neutral transition-colors"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    )}
                    <ChevronDownIcon 
                        className={`h-4 w-4 text-neutral transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-[100] w-full mt-2 bg-base-200 border border-base-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <ul className="max-h-60 overflow-y-auto custom-scrollbar pt-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.id}
                                    onClick={() => handleSelect(option)}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                                        ${String(value) === String(option.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-base-300 text-base-content'}
                                    `}
                                >
                                    {option.label}
                                    {value === option.id && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-8 text-center text-sm text-neutral italic">
                                No se encontraron resultados para "{searchText}"
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
