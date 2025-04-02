// frontend/src/utils/paymentReportExporter.js

import Papa from "papaparse";
import paymentService from "../services/paymentService";
import expenseService from "../services/expenseService";
import propertyService from "../services/propertyService";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Export property payments to CSV with improved formatting for carry-forward balances
 * @param {string} propertyId - Property ID to filter payments
 * @param {Date} startDate - Optional start date for filtering
 * @param {Date} endDate - Optional end date for filtering
 * @param {string} propertyName - Property name for filename
 */
export const exportPropertyPaymentsToCSV = async (
  propertyId,
  startDate = null,
  endDate = null,
  propertyName = "Property"
) => {
  try {
    // Build filter parameters
    const filters = {};
    if (startDate) filters.startDate = new Date(startDate).toISOString();
    if (endDate) filters.endDate = new Date(endDate).toISOString();

    // Fetch payments, expenses and property details in parallel
    const [payments, expenses, propertyDetails] = await Promise.all([
      paymentService.getPaymentsByProperty(propertyId),
      expenseService.getExpensesByProperty(propertyId),
      propertyService.getPropertyById(propertyId)
    ]);

    // Apply date filtering if required (manual filtering as fallback)
    const filteredPayments =
      startDate || endDate
        ? payments.filter((payment) => {
            const paymentDate = new Date(payment.paymentDate);
            return (
              (!startDate || paymentDate >= new Date(startDate)) &&
              (!endDate || paymentDate <= new Date(endDate))
            );
          })
        : payments;

    const filteredExpenses =
      startDate || endDate
        ? expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return (
              (!startDate || expenseDate >= new Date(startDate)) &&
              (!endDate || expenseDate <= new Date(endDate))
            );
          })
        : expenses;

    // Group payments by tenant for calculating running balances
    const tenantPayments = {};
    filteredPayments.forEach((payment) => {
      const tenantId = payment.tenant?._id || payment.tenant || "unknown";
      if (!tenantPayments[tenantId]) {
        tenantPayments[tenantId] = [];
      }
      tenantPayments[tenantId].push(payment);
    });

    // Sort each tenant's payments by date and calculate running balances
    Object.values(tenantPayments).forEach((payments) => {
      payments.sort(
        (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)
      );

      let runningBalance = 0;
      payments.forEach((payment) => {
        // For each payment, include previous balance and calculate new running balance
        payment.runningBalanceBefore = runningBalance;

        if (payment.status === "completed" || payment.status === "partial") {
          // Update running balance based on payment variance
          runningBalance += payment.paymentVariance || 0;
        }

        payment.runningBalanceAfter = runningBalance;
      });
    });

    // Format payments for CSV, now including running balance information
    const formattedPayments = filteredPayments.map((payment) => ({
      Date: new Date(payment.paymentDate).toLocaleDateString(),
      Transaction_Type: "Payment",
      Category:
        payment.type?.charAt(0).toUpperCase() + payment.type?.slice(1) ||
        "Rent",
      Tenant: payment.tenant
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
        : "Unknown",
      Unit: payment.unit ? `Unit ${payment.unit.unitNumber}` : "Unknown",
      Amount: payment.amount,
      Due_Amount: payment.dueAmount || payment.amount,
      Variance: payment.paymentVariance || 0,
      Previous_Balance:
        payment.previousBalance || payment.runningBalanceBefore || 0,
      New_Balance: payment.newBalance || payment.runningBalanceAfter || 0,
      Status: payment.status,
      Payment_Method: payment.paymentMethod || "N/A",
      Reference: payment.reference || "N/A",
      Description: payment.description || "",
      // Include if this payment has carry forward
      Has_Carry_Forward: payment.carryForward ? "Yes" : "No",
      Carry_Forward_Amount: payment.carryForwardAmount || 0,
      Carry_Forward_Type:
        payment.carryForwardAmount > 0
          ? "Credit"
          : payment.carryForwardAmount < 0
          ? "Debit"
          : "None",
      Agency_Fee: payment.agencyFee?.amount || 0,
      Tax_Deduction: payment.taxDeduction?.amount || 0,
      Landlord_Amount: payment.landlordAmount || payment.amount
    }));

    // Format expenses for CSV
    const formattedExpenses = filteredExpenses.map((expense) => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Transaction_Type: "Expense",
      Category:
        expense.category?.charAt(0).toUpperCase() +
          expense.category?.slice(1) || "Other",
      Tenant: "N/A",
      Unit: expense.unit ? `Unit ${expense.unit.unitNumber}` : "N/A",
      Amount: -expense.amount, // Negative as it's an outflow
      Due_Amount: -expense.amount,
      Variance: 0,
      Previous_Balance: 0,
      New_Balance: 0,
      Status: expense.paymentStatus || "completed",
      Payment_Method: "N/A",
      Reference: expense.vendor?.invoiceNumber || "N/A",
      Description: expense.description || "",
      Has_Carry_Forward: "No",
      Carry_Forward_Amount: 0,
      Carry_Forward_Type: "None",
      Agency_Fee: 0,
      Tax_Deduction: 0,
      Landlord_Amount: 0
    }));

    // Combine both datasets
    const allTransactions = [...formattedPayments, ...formattedExpenses];

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Calculate summary statistics for the CSV footer
    const totalRevenue = formattedPayments
      .filter((p) => p.Status === "completed" || p.Status === "partial")
      .reduce((sum, p) => sum + p.Amount, 0);

    const totalExpenses = formattedExpenses.reduce(
      (sum, e) => sum + Math.abs(e.Amount),
      0
    );

    const pendingRevenue = formattedPayments
    .filter((p) => p.Status === "pending")
    .reduce((sum, p) => sum + p.Amount, 0);

  const totalCarryForward = formattedPayments
    .filter((p) => p.Has_Carry_Forward === "Yes")
    .reduce((sum, p) => sum + p.Carry_Forward_Amount, 0);
    
  const totalAgencyFees = formattedPayments
    .reduce((sum, p) => sum + p.Agency_Fee, 0);
    
  const totalTaxDeductions = formattedPayments
    .reduce((sum, p) => sum + p.Tax_Deduction, 0);
    
  const totalLandlordAmount = formattedPayments
    .reduce((sum, p) => sum + p.Landlord_Amount, 0);

  // Create property header information
  const propertyHeader = [
    { Property_Name: propertyDetails.name || propertyName },
    { Address: `${propertyDetails.address?.street || ""}, ${propertyDetails.address?.city || ""}` },
    { Property_Type: propertyDetails.propertyType || "Residential" },
    { Report_Date: new Date().toLocaleDateString() },
    { Report_Period: startDate && endDate 
        ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` 
        : "All time" },
    {}  // Empty row
  ];

  // Add summary section
  const summary = [
    { Property_Name: "SUMMARY SECTION" },
    {
      Property_Name: "Total Revenue",
      Amount: totalRevenue,
      Description: "Total completed payments",
    },
    {
      Property_Name: "Total Expenses",
      Amount: -totalExpenses,
      Description: "Total expenses (negative)",
    },
    {
      Property_Name: "Net Income",
      Amount: totalRevenue - totalExpenses,
      Description: "Revenue minus expenses",
    },
    {
      Property_Name: "Pending Revenue",
      Amount: pendingRevenue,
      Description: "Pending payments",
    },
    {
      Property_Name: "Net Carry Forward",
      Amount: totalCarryForward,
      Description:
        totalCarryForward >= 0 ? "Net credit balance" : "Net debit balance",
    },
    {
      Property_Name: "Total Agency Fees",
      Amount: totalAgencyFees,
      Description: "Total fees collected by agency",
    },
    {
      Property_Name: "Total Tax Deductions",
      Amount: totalTaxDeductions,
      Description: "Total taxes deducted",
    },
    {
      Property_Name: "Total Landlord Amount",
      Amount: totalLandlordAmount,
      Description: "Total amount payable to landlord",
    },
    {} // Empty row
  ];

  // Create final CSV data with property header, transactions and summary
  const csvData = [...propertyHeader, ...allTransactions, ...summary];

  // Convert to CSV with Papa Parse
  const csv = Papa.unparse(csvData);

  // Create and trigger download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);

  // Create filename with property name and date range
  const today = new Date().toISOString().split("T")[0];
  const sanitizedPropertyName = (propertyDetails.name || propertyName)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const dateRange =
    startDate && endDate
      ? `_${new Date(startDate).toISOString().split("T")[0]}_to_${
          new Date(endDate).toISOString().split("T")[0]
        }`
      : `_as_of_${today}`;

  link.setAttribute(
    "download",
    `${sanitizedPropertyName}_payments${dateRange}.csv`
  );
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);

  return true;
} catch (error) {
  console.error("Error exporting payments:", error);
  throw error;
}
};

/**
* Export property payments to PDF
* @param {string} propertyId - Property ID
* @param {Date} startDate - Optional start date
* @param {Date} endDate - Optional end date 
* @param {string} propertyName - Property name
*/
export const exportPropertyPaymentsToPDF = async (
propertyId,
startDate = null,
endDate = null,
propertyName = "Property"
) => {
try {
  // Build filter parameters
  const filters = {};
  if (startDate) filters.startDate = new Date(startDate).toISOString();
  if (endDate) filters.endDate = new Date(endDate).toISOString();

  // Fetch data
  const [payments, expenses, propertyDetails] = await Promise.all([
    paymentService.getPaymentsByProperty(propertyId),
    expenseService.getExpensesByProperty(propertyId),
    propertyService.getPropertyById(propertyId)
  ]);
  
  // Filter by date if needed
  const filteredPayments = startDate || endDate
    ? payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return (!startDate || paymentDate >= new Date(startDate)) && 
               (!endDate || paymentDate <= new Date(endDate));
      })
    : payments;
    
  const filteredExpenses = startDate || endDate
    ? expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (!startDate || expenseDate >= new Date(startDate)) && 
               (!endDate || expenseDate <= new Date(endDate));
      })
    : expenses;
  
  // Calculate totals
  const totalRevenue = filteredPayments
    .filter(p => p.status === "completed" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalExpenses = filteredExpenses
    .reduce((sum, e) => sum + e.amount, 0);
    
  const netIncome = totalRevenue - totalExpenses;
  
  // Create PDF document
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text(`${propertyDetails.name || propertyName} - Payment Report`, 15, 15);
  
  // Add property details
  doc.setFontSize(12);
  doc.text(`Address: ${propertyDetails.address?.street || ""}, ${propertyDetails.address?.city || ""}`, 15, 25);
  doc.text(`Property Type: ${propertyDetails.propertyType || "Residential"}`, 15, 32);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 39);
  
  if (startDate && endDate) {
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 15, 46);
  }
  
  // Add summary
  doc.setFontSize(14);
  doc.text("Financial Summary", 15, 56);
  
  doc.autoTable({
    startY: 60,
    head: [["Description", "Amount (KES)"]],
    body: [
      ["Total Revenue", totalRevenue.toLocaleString()],
      ["Total Expenses", totalExpenses.toLocaleString()],
      ["Net Income", netIncome.toLocaleString()],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { halign: "left" },
    columnStyles: { 1: { halign: "right" } },
  });
  
  // Add payments section
  const lastY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text("Payment Transactions", 15, lastY);
  
  // Format payment data for table
  const paymentData = filteredPayments.map(payment => [
    new Date(payment.paymentDate).toLocaleDateString(),
    payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : "Unknown",
    payment.unit ? `Unit ${payment.unit.unitNumber}` : "",
    payment.amount.toLocaleString(),
    payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    payment.paymentVariance ? payment.paymentVariance.toLocaleString() : "0"
  ]);
  
  doc.autoTable({
    startY: lastY + 5,
    head: [["Date", "Tenant", "Unit", "Amount (KES)", "Status", "Variance"]],
    body: paymentData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });
  
  // Add expenses section if there are any
  if (filteredExpenses.length > 0) {
    const expenseY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Expense Transactions", 15, expenseY);
    
    // Format expense data for table
    const expenseData = filteredExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.category?.charAt(0).toUpperCase() + expense.category?.slice(1) || "Other",
      expense.unit ? `Unit ${expense.unit.unitNumber}` : "N/A",
      expense.amount.toLocaleString(),
      expense.description || ""
    ]);
    
    doc.autoTable({
      startY: expenseY + 5,
      head: [["Date", "Category", "Unit", "Amount (KES)", "Description"]],
      body: expenseData,
      theme: "grid",
      headStyles: { fillColor: [192, 57, 43], textColor: 255 },
    });
  }
  
  // Save the PDF
  const today = new Date().toISOString().split("T")[0];
  const sanitizedPropertyName = (propertyDetails.name || propertyName)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const dateRange = startDate && endDate
    ? `_${new Date(startDate).toISOString().split("T")[0]}_to_${new Date(endDate).toISOString().split("T")[0]}`
    : `_as_of_${today}`;
    
  doc.save(`${sanitizedPropertyName}_report${dateRange}.pdf`);
  
  return true;
} catch (error) {
  console.error("Error exporting PDF:", error);
  throw error;
}
};

export default {
exportPropertyPaymentsToCSV,
exportPropertyPaymentsToPDF
};