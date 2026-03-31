import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subValue, className }) => {
  return (
    <div className={`bg-base-200 p-4 md:p-6 rounded-xl shadow-lg flex items-center space-x-3 md:space-x-4 transform hover:-translate-y-1 transition-all duration-300 border border-base-border ${className || ''}`}>
      <div className={`p-2.5 md:p-4 rounded-xl md:rounded-full shrink-0 ${color} shadow-lg shadow-black/10`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-sm text-neutral font-bold uppercase tracking-widest opacity-70 truncate">{title}</p>
        <p className="text-lg md:text-2xl font-black text-base-content truncate leading-tight mt-0.5" title={value}>{value}</p>
        {subValue && <p className="text-[10px] md:text-xs text-neutral font-medium truncate mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
};

export default StatCard;
