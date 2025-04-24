import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ title, value, className }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    <h4 className="text-sm font-medium text-gray-500">{title}</h4>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  className: PropTypes.string,
};

const ScrewdriverOverview = ({ totalCount, activeCount, inactiveCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard 
        title="Gesamtanzahl Schraubendreher" 
        value={totalCount}
        className="border-l-4 border-blue-500"
      />
      <StatCard 
        title="Aktive Schraubendreher" 
        value={activeCount}
        className="border-l-4 border-green-500"
      />
      <StatCard 
        title="Inaktive Schraubendreher" 
        value={inactiveCount}
        className="border-l-4 border-red-500"
      />
    </div>
  );
};

ScrewdriverOverview.propTypes = {
  totalCount: PropTypes.number.isRequired,
  activeCount: PropTypes.number.isRequired,
  inactiveCount: PropTypes.number.isRequired,
};

export default ScrewdriverOverview; 