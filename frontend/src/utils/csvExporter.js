// frontend/src/utils/csvExporter.js
import Papa from "papaparse";

/**
 * Export data to CSV
 * @param {Array} data - The data to export
 * @param {string} filename - The filename to save as
 */
export const exportToCSV = (data, filename = "export.csv") => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  // Process data to format numbers and dates for CSV
  const processedData = data.map((item) => {
    const processed = { ...item };

    // Format currency values
    Object.keys(processed).forEach((key) => {
      // Handle numeric values that might be currency amounts
      if (
        typeof processed[key] === "number" &&
        (key.includes("amount") ||
          key.includes("revenue") ||
          key.includes("expense") ||
          key.includes("profit") ||
          key.includes("balance") ||
          key.includes("rent"))
      ) {
        processed[key] = Number(processed[key]).toFixed(2);
      }

      // Handle date values
      if (
        processed[key] instanceof Date ||
        (typeof processed[key] === "string" &&
          /^\d{4}-\d{2}-\d{2}/.test(processed[key]))
      ) {
        try {
          const date = new Date(processed[key]);
          if (!isNaN(date.getTime())) {
            processed[key] = date.toLocaleDateString();
          }
        } catch (e) {
          // Not a valid date, keep original value
        }
      }
    });

    return processed;
  });

  // Convert to CSV string
  const csv = Papa.unparse(processedData);

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

/**
 * Export revenue by property data to CSV
 * @param {Array} propertyData - Array of property revenue data
 */
export const exportPropertyRevenueToCSV = (propertyData) => {
  if (!propertyData || !propertyData.length) {
    console.error("No property data to export");
    return;
  }

  // Prepare data for CSV format - ensure proper formatting
  const csvData = propertyData.map((property) => ({
    Property_Name: property.name || "Unknown",
    Revenue: property.revenue ? Number(property.revenue).toFixed(2) : "0.00",
    Expenses: property.expenses ? Number(property.expenses).toFixed(2) : "0.00",
    Profit: property.profit ? Number(property.profit).toFixed(2) : "0.00",
    Profit_Margin_Percent:
      property.revenue > 0
        ? `${Math.round((property.profit / property.revenue) * 100)}%`
        : "0%",
    Property_ID: property.propertyId || "",
  }));

  // Use the main exportToCSV function
  exportToCSV(csvData, "property_revenue_report.csv");
};

/**
 * Export monthly revenue and expenses data to CSV
 * @param {Array} monthlyData - Array of monthly revenue/expense data
 */
export const exportMonthlyDataToCSV = (monthlyData) => {
  if (!monthlyData || !monthlyData.length) {
    console.error("No monthly data to export");
    return;
  }

  // Prepare data for CSV format
  const csvData = monthlyData.map((month) => ({
    Month: month.month || "",
    Revenue: month.revenue ? Number(month.revenue).toFixed(2) : "0.00",
    Expenses: month.expenses ? Number(month.expenses).toFixed(2) : "0.00",
    Profit: (month.revenue - month.expenses).toFixed(2),
    Profit_Margin_Percent:
      month.revenue > 0
        ? `${Math.round(
            ((month.revenue - month.expenses) / month.revenue) * 100
          )}%`
        : "0%",
  }));

  // Use the main exportToCSV function
  exportToCSV(csvData, "monthly_financial_report.csv");
};

export default {
  exportToCSV,
  exportPropertyRevenueToCSV,
  exportMonthlyDataToCSV,
};
