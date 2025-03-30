// frontend/src/utils/csvExporter.js
import Papa from "papaparse";

/**
 * Export revenue by property data to CSV
 * @param {Array} propertyData - Array of property revenue data
 */
export const exportPropertyRevenueToCSV = (propertyData) => {
  if (!propertyData || !propertyData.length) {
    console.error("No property data to export");
    return;
  }

  // Prepare data for CSV format
  const csvData = propertyData.map((property) => ({
    PROPERTY: property.name,
    REVENUE: `KES ${property.revenue.toLocaleString()}`,
    EXPENSES: `KES ${property.expenses.toLocaleString()}`,
    PROFIT: `KES ${property.profit.toLocaleString()}`,
    "PROFIT MARGIN": `${Math.round(
      (property.profit / property.revenue) * 100
    )}%`,
  }));

  // Convert to CSV string
  const csv = Papa.unparse(csvData);

  // Create download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "property_revenue_report.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export any tabular data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the CSV file
 */
export const exportToCSV = (data, filename = "export.csv") => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  // Convert to CSV
  const csv = Papa.unparse(data);

  // Create download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default {
  exportPropertyRevenueToCSV,
  exportToCSV,
};
