// frontend/src/components/common/CSVDownloadButton.jsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';

const CSVDownloadButton = ({ 
  data, 
  filename = 'export.csv', 
  buttonText = 'Export CSV',
  className = "inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }

    setExporting(true);
    try {
      exportToCSV(data, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !data || data.length === 0}
      className={className}
    >
      <Download className="h-4 w-4 mr-1.5" />
      {exporting ? "Exporting..." : buttonText}
    </button>
  );
};

export default CSVDownloadButton;