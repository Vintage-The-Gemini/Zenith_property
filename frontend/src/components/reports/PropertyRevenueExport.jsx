// frontend/src/components/reports/PropertyRevenueExport.jsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { exportPropertyRevenueToCSV } from '../../utils/csvExporter';

const PropertyRevenueExport = ({ reportData }) => {
  const [exporting, setExporting] = useState(false);

  // Sample data structure in case reportData is not provided
  const samplePropertyData = [
    { name: 'Alpha green courts', revenue: 41500, expenses: 6640, profit: 34860 },
    { name: 'North end towers', revenue: 120000, expenses: 4000, profit: 116000 },
    { name: 'Siaya park', revenue: 50000, expenses: 7700, profit: 42300 },
    { name: 'Kille Apps', revenue: 150000, expenses: 40000, profit: 110000 }
  ];

  const handleExport = () => {
    setExporting(true);
    try {
      // Use provided data or sample data if none provided
      const dataToExport = reportData?.revenueByProperty || samplePropertyData;
      exportPropertyRevenueToCSV(dataToExport);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <Download className="h-4 w-4 mr-2" />
        {exporting ? 'Exporting...' : 'Export to CSV'}
      </button>
    </div>
  );
};

export default PropertyRevenueExport;