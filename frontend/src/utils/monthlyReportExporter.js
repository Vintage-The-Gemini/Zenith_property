// frontend/src/utils/monthlyReportExporter.js
import Papa from 'papaparse';

export const exportMonthlyFinancialReportToCSV = async (reportData, startDate, endDate) => {
  try {
    if (!reportData) {
      throw new Error('No report data available to export');
    }
    
    const dateRange = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString()}_to_${new Date(endDate).toLocaleDateString()}`
      : new Date().toLocaleDateString();
    
    // Prepare monthly data
    const monthlyData = reportData.revenueByMonth.map(month => ({
      Month: month.month,
      Revenue: month.revenue,
      Expenses: month.expenses,
      Profit: month.revenue - month.expenses,
      Margin_Percentage: month.revenue > 0 
        ? Math.round(((month.revenue - month.expenses) / month.revenue) * 100) 
        : 0
    }));
    
    // Prepare property data
    const propertyData = reportData.revenueByProperty.map(property => ({
      Property: property.name,
      Revenue: property.revenue,
      Expenses: property.expenses,
      Profit: property.profit,
      Margin_Percentage: property.revenue > 0 
        ? Math.round((property.profit / property.revenue) * 100) 
        : 0
    }));
    
    // Prepare payment details if available
    const paymentDetails = (reportData.payments || []).map(payment => ({
      Date: new Date(payment.paymentDate).toLocaleDateString(),
      Property: payment.property?.name || 'Unknown',
      Unit: payment.unit?.unitNumber || 'Unknown',
      Tenant: payment.tenant 
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}` 
        : 'Unknown',
      Amount: payment.amount,
      Type: payment.type,
      Status: payment.status,
      Payment_Method: payment.paymentMethod,
      Previous_Balance: payment.previousBalance || 0,
      New_Balance: payment.newBalance || 0,
      Reference: payment.reference || 'N/A'
    }));
    
    // Generate CSV data with sections
    const csvData = [
      { Section: 'FINANCIAL SUMMARY' },
      { 
        Section: 'Total Revenue',
        Value: reportData.summary.totalRevenue 
      },
      { 
        Section: 'Total Expenses',
        Value: reportData.summary.totalExpenses 
      },
      { 
        Section: 'Net Profit',
        Value: reportData.summary.netProfit 
      },
      { 
        Section: 'Pending Revenue',
        Value: reportData.summary.pendingRevenue || 0
      },
      {},
      { Section: 'MONTHLY BREAKDOWN' },
      ...monthlyData,
      {},
      { Section: 'PROPERTY BREAKDOWN' },
      ...propertyData
    ];
    
    // Add payment details section if available
    if (paymentDetails.length > 0) {
      csvData.push({});
      csvData.push({ Section: 'PAYMENT DETAILS' });
      csvData.push(...paymentDetails);
    }
    
    // Convert to CSV
    const csv = Papa.unparse(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${dateRange}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error exporting monthly financial report:', error);
    throw error;
  }
};