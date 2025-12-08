import React from 'react';

const KPICard = ({ title, value, unit, status, description }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return '✓';
      case 'warning':
        return '⚠';
      case 'critical':
        return '🔴';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold mt-2">{value} {unit}</p>
      <p className="text-xs mt-2 flex items-center gap-1">
        <span>{getStatusIcon(status)}</span>
        {description}
      </p>
    </div>
  );
};

export const KPICardsSection = ({ cards }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <KPICard key={idx} {...card} />
      ))}
    </div>
  );
};

export default KPICard;
