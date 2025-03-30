// frontend/src/utils/reportExport.js
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

/**
 * Export data to CSV
 * @param {Array} data - The data to export
 * @param {string} filename - The filename to save as
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  // Convert data to CSV format
  const csv = Papa.unparse(data);

  // Create a download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to PDF
 * @param {Array} data - The data to export
 * @param {string} filename - The filename to save as
 * @param {string} title - The title of the report
 * @param {Array} columns - Array of column definitions
 */
export const exportToPDF = (data, filename, title, columns) => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Add date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Format data for table
  const headers = columns.map((col) => col.header || col.title || col.name);
  const rows = data.map((item) => {
    return columns.map((col) => item[col.key] || "");
  });

  // Create table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Export financial report
 * @param {Object} reportData - Financial report data
 */
export const exportFinancialReport = (reportData, format = "pdf") => {
  if (!reportData) return;

  if (format === "csv") {
    // Format data for CSV
    const csvData = [
      ...reportData.revenueByMonth.map((item) => ({
        category: "Revenue by Month",
        name: item.month,
        revenue: item.revenue,
        expenses: item.expenses,
        profit: item.revenue - item.expenses,
      })),
      ...reportData.revenueByProperty.map((item) => ({
        category: "Revenue by Property",
        name: item.name,
        revenue: item.revenue,
        expenses: item.expenses,
        profit: item.profit,
      })),
    ];

    exportToCSV(csvData, "financial_report");
  } else {
    // Export to PDF
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Financial Report", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Summary section
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);

    doc.setFontSize(10);
    doc.text(
      `Total Revenue: KES ${reportData.summary.totalRevenue.toLocaleString()}`,
      14,
      55
    );
    doc.text(
      `Total Expenses: KES ${reportData.summary.totalExpenses.toLocaleString()}`,
      14,
      62
    );
    doc.text(
      `Net Profit: KES ${reportData.summary.netProfit.toLocaleString()}`,
      14,
      69
    );

    // Monthly data
    if (reportData.revenueByMonth && reportData.revenueByMonth.length > 0) {
      doc.autoTable({
        head: [["Month", "Revenue", "Expenses", "Profit"]],
        body: reportData.revenueByMonth.map((m) => [
          m.month,
          `KES ${m.revenue.toLocaleString()}`,
          `KES ${m.expenses.toLocaleString()}`,
          `KES ${(m.revenue - m.expenses).toLocaleString()}`,
        ]),
        startY: 80,
      });
    }

    // Property data on a new page
    if (
      reportData.revenueByProperty &&
      reportData.revenueByProperty.length > 0
    ) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Revenue by Property", 14, 20);

      doc.autoTable({
        head: [["Property", "Revenue", "Expenses", "Profit"]],
        body: reportData.revenueByProperty.map((p) => [
          p.name,
          `KES ${p.revenue.toLocaleString()}`,
          `KES ${p.expenses.toLocaleString()}`,
          `KES ${p.profit.toLocaleString()}`,
        ]),
        startY: 30,
      });
    }

    doc.save("financial_report.pdf");
  }
};

export default {
  exportToCSV,
  exportToPDF,
  exportFinancialReport,
};
