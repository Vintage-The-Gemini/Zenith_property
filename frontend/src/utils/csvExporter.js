// frontend/src/utils/csvExporter.js
import Papa from "papaparse";

/**
 * Export data to CSV with proper horizontal tabular format
 */
export const exportToCSV = (data, filename = "export.csv", propertyDetails = null, financialSummary = null) => {
  if (!data || !data.length) {
    console.error("No data to export");
    return;
  }

  let csvContent = [];
  
  // ===== HEADER SECTION =====
  csvContent.push(['PROPERTY MANAGEMENT SYSTEM - COMPREHENSIVE FINANCIAL REPORT']);
  csvContent.push([]);
  csvContent.push(['Generated Date:', new Date().toLocaleDateString(), 'Generated Time:', new Date().toLocaleTimeString()]);
  csvContent.push(['Currency:', 'KES']);
  csvContent.push([]);

  // ===== PROPERTY INFORMATION SECTION =====
  if (propertyDetails) {
    csvContent.push(['PROPERTY INFORMATION']);
    csvContent.push(['Property Name', 'Property Type', 'Address', 'Total Units', 'Occupied Units', 'Available Units', 'Maintenance Units', 'Occupancy Rate', 'Vacancy Rate']);
    csvContent.push([
      propertyDetails.name,
      propertyDetails.type,
      propertyDetails.address,
      propertyDetails.totalUnits,
      propertyDetails.occupiedUnits,
      propertyDetails.availableUnits,
      propertyDetails.maintenanceUnits || 0,
      `${propertyDetails.occupancyRate}%`,
      `${100 - propertyDetails.occupancyRate}%`
    ]);
    csvContent.push([]);
  }

  // ===== FINANCIAL SUMMARY SECTION =====
  if (financialSummary) {
    csvContent.push(['FINANCIAL SUMMARY']);
    csvContent.push([]);
    
    // Revenue Section
    csvContent.push(['REVENUE BREAKDOWN']);
    csvContent.push(['Expected Revenue', 'Collected Revenue', 'Pending Revenue', 'Overdue Revenue', 'Collection Rate']);
    csvContent.push([
      formatCurrency(financialSummary.expectedRevenue || 0),
      formatCurrency(financialSummary.totalRevenue || 0),
      formatCurrency(financialSummary.pendingRevenue || 0),
      formatCurrency(financialSummary.overdueRevenue || 0),
      `${financialSummary.collectionRate || 0}%`
    ]);
    csvContent.push([]);
    
    // Expense Section
    csvContent.push(['EXPENSE BREAKDOWN']);
    csvContent.push(['Total Expenses', 'Paid Expenses', 'Unpaid Expenses', 'Overdue Expenses']);
    csvContent.push([
      formatCurrency(financialSummary.totalExpenses || 0),
      formatCurrency(financialSummary.paidExpenses || 0),
      formatCurrency(financialSummary.unpaidExpenses || 0),
      formatCurrency(financialSummary.overdueExpenses || 0)
    ]);
    csvContent.push([]);
    
    // Balance Information
    csvContent.push(['BALANCE SUMMARY']);
    csvContent.push(['Total Outstanding', 'Total Credits', 'Security Deposits', 'Net Income', 'Profit Margin']);
    csvContent.push([
      formatCurrency(financialSummary.totalOutstanding || 0),
      formatCurrency(financialSummary.totalCredits || 0),
      formatCurrency(financialSummary.totalDeposits || 0),
      formatCurrency(financialSummary.netIncome || 0),
      `${financialSummary.profitMargin || 0}%`
    ]);
    csvContent.push([]);
    
    // Performance Metrics
    csvContent.push(['PERFORMANCE METRICS']);
    csvContent.push(['Payment Success Rate', 'Average Days to Pay', 'Default Rate']);
    csvContent.push([
      `${financialSummary.paymentSuccessRate || 0}%`,
      financialSummary.avgDaysToPay || 0,
      `${financialSummary.defaultRate || 0}%`
    ]);
    csvContent.push([]);
  }

  // ===== TENANT BALANCES TABLE =====
  if (financialSummary && financialSummary.tenantBalances && financialSummary.tenantBalances.length > 0) {
    csvContent.push(['TENANT BALANCES']);
    csvContent.push(['Tenant Name', 'Unit', 'Monthly Rent', 'Current Balance', 'Status', 'Total Paid', 'Last Payment Date']);
    
    financialSummary.tenantBalances.forEach(tenant => {
      csvContent.push([
        tenant.name,
        tenant.unit,
        formatCurrency(tenant.monthlyRent),
        formatCurrency(tenant.currentBalance),
        tenant.status,
        formatCurrency(tenant.totalPaid),
        tenant.lastPaymentDate || 'Never'
      ]);
    });
    csvContent.push([]);
  }

  // ===== MAIN DATA TABLE =====
  csvContent.push(['TRANSACTION DETAILS']);
  
  if (data && data.length > 0) {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    csvContent.push(headers);
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        let value = item[header];
        
        // Format currency fields
        if (typeof value === 'number' && isCurrencyField(header)) {
          return formatCurrency(value);
        }
        
        // Format date fields
        if (value && isDateField(header)) {
          return formatDate(value);
        }
        
        // Format boolean fields
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        
        return value ?? '';
      });
      csvContent.push(row);
    });
  }

  // Convert to CSV string using Papa Parse for proper formatting
  const csv = Papa.unparse(csvContent);

  // Create download
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

// Helper functions
const formatCurrency = (amount) => {
  return `KES ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const isCurrencyField = (fieldName) => {
  const currencyFields = ['amount', 'revenue', 'expense', 'balance', 'rent', 'payment', 'due', 'variance', 'credit', 'debit', 'deposit', 'outstanding'];
  return currencyFields.some(field => fieldName.toLowerCase().includes(field));
};

const isDateField = (fieldName) => {
  const dateFields = ['date', 'createdat', 'updatedat', 'duedate', 'paymentdate'];
  return dateFields.some(field => fieldName.toLowerCase().includes(field));
};

/**
 * Export property revenue data to CSV
 */
export const exportPropertyRevenueToCSV = (propertyData, propertyDetails = null, financialSummary = null) => {
  if (!propertyData || !propertyData.length) {
    console.error("No property data to export");
    return;
  }

  const csvData = propertyData.map((property) => ({
    'Property Name': property.name || "Unknown",
    'Revenue': property.revenue || 0,
    'Expenses': property.expenses || 0,
    'Profit': property.profit || (property.revenue - property.expenses) || 0,
    'Outstanding': property.outstanding || 0,
    'Credits': property.credits || 0,
    'Profit Margin %': property.revenue > 0 
      ? `${Math.round((property.profit / property.revenue) * 100)}%` 
      : "0%",
    'Property ID': property.propertyId || "",
  }));

  exportToCSV(csvData, "property_revenue_report.csv", propertyDetails, financialSummary);
};

/**
 * Export monthly revenue and expenses data to CSV
 */
export const exportMonthlyDataToCSV = (monthlyData, propertyDetails = null) => {
  if (!monthlyData || !monthlyData.length) {
    console.error("No monthly data to export");
    return;
  }

  const csvData = monthlyData.map((month) => ({
    'Month': month.month || "",
    'Revenue': month.revenue || 0,
    'Expenses': month.expenses || 0,
    'Profit': (month.revenue - month.expenses) || 0,
    'Outstanding': month.outstanding || 0,
    'Credits': month.credits || 0,
    'Collection Rate': month.collectionRate || "0%",
    'Profit Margin %': month.revenue > 0
      ? `${Math.round(((month.revenue - month.expenses) / month.revenue) * 100)}%`
      : "0%",
  }));

  exportToCSV(csvData, "monthly_financial_report.csv", propertyDetails);
};

export default {
  exportToCSV,
  exportPropertyRevenueToCSV,
  exportMonthlyDataToCSV,
};