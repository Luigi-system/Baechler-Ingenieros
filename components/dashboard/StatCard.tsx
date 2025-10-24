import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center space-x-4 transform hover:-translate-y-1 transition-transform duration-300">
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-neutral">{title}</p>
        <p className="text-2xl font-bold text-base-content">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
