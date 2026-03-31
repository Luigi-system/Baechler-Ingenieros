
import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon } from './Icons';

interface TimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
    disabled?: boolean;
    align?: 'left' | 'right';
}

const TimePicker: React.FC<TimePickerProps> = ({ value = '', onChange, id, className = '', disabled = false, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Default initial values
    const [hours, setHours] = useState('08');
    const [minutes, setMinutes] = useState('00');

    useEffect(() => {
        if (value && value.includes(':')) {
            const [h, m] = value.split(':');
            setHours(h);
            setMinutes(m);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hoursRange = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutesRange = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handleSelectTime = (newHours: string, newMinutes: string) => {
        setHours(newHours);
        setMinutes(newMinutes);
        onChange(`${newHours}:${newMinutes}`);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between px-3 py-2 cursor-pointer transition-all
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-base-300' : 'bg-base-100 hover:border-primary'}
                    border border-base-border rounded-md text-base-content
                `}
            >
                <span className="text-sm">{value || '--:--'}</span>
                <ClockIcon className="h-4 w-4 text-neutral" />
            </div>

            {isOpen && (
                <div className={`
                    absolute top-full mt-1 w-56 bg-base-200 border border-base-border rounded-lg shadow-2xl overflow-hidden z-[999] animate-fade-in-right
                    ${align === 'right' ? 'right-0' : 'left-0'}
                `}>
                    <div className="flex bg-base-300 border-b border-base-border">
                        <div className="w-1/2 text-[10px] font-black uppercase tracking-widest text-primary p-2 text-center">Hora</div>
                        <div className="w-1/2 text-[10px] font-black uppercase tracking-widest text-primary p-2 text-center">Minutos</div>
                    </div>
                    <div className="flex h-64">
                        {/* Hours Column */}
                        <div className="w-1/2 overflow-y-auto custom-scrollbar border-r border-base-border">
                            {hoursRange.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleSelectTime(h, minutes)}
                                    className={`
                                        w-full py-2.5 text-sm transition-colors
                                        ${hours === h ? 'bg-primary text-white font-bold' : 'hover:bg-primary/10 text-base-content'}
                                    `}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                        {/* Minutes Column */}
                        <div className="w-1/2 overflow-y-auto custom-scrollbar">
                            {minutesRange.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { handleSelectTime(hours, m); setIsOpen(false); }}
                                    className={`
                                        w-full py-2.5 text-sm transition-colors
                                        ${minutes === m ? 'bg-primary text-white font-bold' : 'hover:bg-primary/10 text-base-content'}
                                    `}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
