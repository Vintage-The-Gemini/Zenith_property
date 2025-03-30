// frontend/src/utils/reportExport.js
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import {
  exportToCSV,
  exportPropertyRevenueToCSV,
  exportMonthlyDataToCSV,
} from "./csvExporter";

/**
 * Export financial report
 * @param {Object} reportData - Financial report data
 * @param {string} format - The export format (pdf or csv)
 */
export const exportFinancialReport = (reportData, format = "pdf") => {
  if (!reportData) {
    console.error("No report data to export");
    return;
  }

  if (format === "csv") {
    // First export the property revenue data
    if (
      reportData.revenueByProperty &&
      reportData.revenueByProperty.length > 0
    ) {
      exportPropertyRevenueToCSV(reportData.revenueByProperty);
    }

    // Then export the monthly data
    if (reportData.revenueByMonth && reportData.revenueByMonth.length > 0) {
      exportMonthlyDataToCSV(reportData.revenueByMonth);
    }

    // If neither property nor monthly data available, export summary
    if (
      (!reportData.revenueByProperty ||
        reportData.revenueByProperty.length === 0) &&
      (!reportData.revenueByMonth || reportData.revenueByMonth.length === 0)
    ) {
      const summaryData = [
        {
          Total_Revenue: reportData.summary.totalRevenue,
          Total_Expenses: reportData.summary.totalExpenses,
          Net_Profit: reportData.summary.netProfit,
          Pending_Revenue: reportData.summary.pendingRevenue || 0,
        },
      ];

      exportToCSV(summaryData, "financial_summary.csv");
    }
  } else {
    // Export to PDF
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Financial Report", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
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
    if (reportData.summary.pendingRevenue) {
      doc.text(
        `Pending Revenue: KES ${reportData.summary.pendingRevenue.toLocaleString()}`,
        14,
        76
      );
    }

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
        startY: 85,
      });
    }

    // Property data on a new page
    if (
      reportData.revenueByProperty &&
      reportData.revenueByProperty.length > 0
    ) {
      // If monthly data takes too much space, add a new page
      if (reportData.revenueByMonth && reportData.revenueByMonth.length > 5) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Revenue by Property", 14, 20);
        startY = 30;
      } else {
        // Continue on the same page
        const startY = doc.autoTable.previous.finalY + 20;
        doc.setFontSize(14);
        doc.text("Revenue by Property", 14, startY - 10);
      }

      doc.autoTable({
        head: [["Property", "Revenue", "Expenses", "Profit", "Margin"]],
        body: reportData.revenueByProperty.map((p) => [
          p.name,
          `KES ${p.revenue.toLocaleString()}`,
          `KES ${p.expenses.toLocaleString()}`,
          `KES ${p.profit.toLocaleString()}`,
          p.revenue > 0
            ? `${Math.round((p.profit / p.revenue) * 100)}%`
            : "N/A",
        ]),
        startY:
          typeof startY !== "undefined"
            ? startY
            : doc.autoTable.previous.finalY + 20,
      });
    }

    doc.save("financial_report.pdf");
  }
};

/**
 * Export occupancy report
 * @param {Object} reportData - Occupancy report data
 * @param {string} format - The export format (pdf or csv)
 */
export const exportOccupancyReport = (reportData, format = "pdf") => {
  if (!reportData) {
    console.error("No report data to export");
    return;
  }

  if (format === "csv") {
    // Export property occupancy data
    if (
      reportData.occupancyByProperty &&
      reportData.occupancyByProperty.length > 0
    ) {
      const occupancyData = reportData.occupancyByProperty.map((property) => ({
        Property_Name: property.name,
        Total_Units: property.total,
        Occupied_Units: property.occupied,
        Available_Units: property.available,
        Maintenance_Units: property.maintenance,
        Occupancy_Rate_Percent: `${property.rate}%`,
      }));

      exportToCSV(occupancyData, "occupancy_report.csv");
    }

    // Export lease expiration data if available
    if (reportData.leaseExpirations && reportData.leaseExpirations.length > 0) {
      exportToCSV(reportData.leaseExpirations, "lease_expirations.csv");
    }
  } else {
    // PDF export implementation
    const doc = new jsPDF();
    // Similar to financial report PDF implementation
    // Add occupancy summary and tables
    doc.save("occupancy_report.pdf");
  }
};

export default {
  exportFinancialReport,
  exportOccupancyReport,
  exportToCSV,
};
