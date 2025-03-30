// frontend/src/utils/reportExport.js
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import { formatCurrency, formatDate } from "./formatters";

/**
 * Export report data to CSV
 * @param {Array} data - The data to export
 * @param {string} filename - The filename to save as
 * @param {Array} headers - Optional array of header names
 */
export const exportToCSV = (data, filename, headers = null) => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  // Convert data to CSV format
  let csvContent = Papa.unparse({
    fields: headers || Object.keys(data[0]),
    data: data,
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
 * Export report data to PDF
 * @param {Array} data - The data to export
 * @param {string} filename - The filename to save as
 * @param {string} title - The title of the report
 * @param {Array} columns - Array of column definitions for the table
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
  const tableRows = data.map((item) => {
    return columns.map((column) => {
      if (column.formatter) {
        return column.formatter(item[column.key], item);
      }
      return item[column.key];
    });
  });

  // Create table
  doc.autoTable({
    head: [columns.map((column) => column.header)],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Save document
  doc.save(`${filename}.pdf`);
};

/**
 * Export financial report to PDF
 * @param {Object} reportData - Financial report data
 */
export const exportFinancialReportToPDF = (reportData) => {
  if (!reportData) return;

  const doc = new jsPDF();

  // Add title and date
  doc.setFontSize(18);
  doc.text("Financial Report", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Summary", 14, 45);

  doc.setFontSize(10);
  doc.text(
    `Total Revenue: ${formatCurrency(reportData.summary.totalRevenue)}`,
    14,
    55
  );
  doc.text(
    `Total Expenses: ${formatCurrency(reportData.summary.totalExpenses)}`,
    14,
    62
  );
  doc.text(
    `Net Profit: ${formatCurrency(reportData.summary.netProfit)}`,
    14,
    69
  );
  doc.text(
    `Pending Revenue: ${formatCurrency(reportData.summary.pendingRevenue)}`,
    14,
    76
  );

  // Monthly data
  if (reportData.revenueByMonth && reportData.revenueByMonth.length > 0) {
    doc.setFontSize(14);
    doc.text("Monthly Revenue & Expenses", 14, 90);

    const monthlyData = reportData.revenueByMonth.map((month) => ({
      month: month.month,
      revenue: formatCurrency(month.revenue),
      expenses: formatCurrency(month.expenses),
      profit: formatCurrency(month.revenue - month.expenses),
    }));

    doc.autoTable({
      head: [["Month", "Revenue", "Expenses", "Profit"]],
      body: monthlyData.map((d) => [d.month, d.revenue, d.expenses, d.profit]),
      startY: 100,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // Property data
  if (reportData.revenueByProperty && reportData.revenueByProperty.length > 0) {
    let yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 130;

    doc.setFontSize(14);
    doc.text("Revenue by Property", 14, yPos);

    const propertyData = reportData.revenueByProperty.map((property) => ({
      name: property.name,
      revenue: formatCurrency(property.revenue),
      expenses: formatCurrency(property.expenses),
      profit: formatCurrency(property.profit),
    }));

    doc.autoTable({
      head: [["Property", "Revenue", "Expenses", "Profit"]],
      body: propertyData.map((d) => [d.name, d.revenue, d.expenses, d.profit]),
      startY: yPos + 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  doc.save("financial_report.pdf");
};

/**
 * Export occupancy report to PDF
 * @param {Object} reportData - Occupancy report data
 */
export const exportOccupancyReportToPDF = (reportData) => {
  if (!reportData) return;

  const doc = new jsPDF();

  // Add title and date
  doc.setFontSize(18);
  doc.text("Occupancy Report", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Summary", 14, 45);

  doc.setFontSize(10);
  doc.text(`Total Units: ${reportData.summary.totalUnits}`, 14, 55);
  doc.text(`Occupied Units: ${reportData.summary.occupiedUnits}`, 14, 62);
  doc.text(`Occupancy Rate: ${reportData.summary.occupancyRate}%`, 14, 69);

  // Property occupancy
  if (
    reportData.occupancyByProperty &&
    reportData.occupancyByProperty.length > 0
  ) {
    doc.setFontSize(14);
    doc.text("Occupancy by Property", 14, 85);

    const propertyData = reportData.occupancyByProperty.map((property) => ({
      name: property.name,
      total: property.total,
      occupied: property.occupied,
      rate: `${property.rate}%`,
    }));

    doc.autoTable({
      head: [["Property", "Total Units", "Occupied Units", "Occupancy Rate"]],
      body: propertyData.map((d) => [d.name, d.total, d.occupied, d.rate]),
      startY: 95,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // Lease expirations
  if (reportData.leaseExpirations && reportData.leaseExpirations.length > 0) {
    let yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 130;

    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Upcoming Lease Expirations", 14, yPos);

    const leaseData = reportData.leaseExpirations.map((lease) => ({
      name: lease.name,
      property: lease.propertyName,
      unit: lease.unitNumber,
      endDate: formatDate(lease.leaseEndDate),
      daysRemaining: lease.daysRemaining,
    }));

    doc.autoTable({
      head: [["Tenant", "Property", "Unit", "End Date", "Days Remaining"]],
      body: leaseData.map((d) => [
        d.name,
        d.property,
        d.unit,
        d.endDate,
        d.daysRemaining,
      ]),
      startY: yPos + 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  doc.save("occupancy_report.pdf");
};

export default {
  exportToCSV,
  exportToPDF,
  exportFinancialReportToPDF,
  exportOccupancyReportToPDF,
};
