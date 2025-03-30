// frontend/src/utils/paymentReportExporter.js

import Papa from "papaparse";

/**
 * Export property payments to CSV
 * @param {string} propertyId - Property ID to filter payments
 * @param {Array} payments - Array of payments (if already fetched)
 * @param {Array} expenses - Array of expenses (if already fetched)
 * @param {string} propertyName - Property name for filename
 */
export const exportPropertyPaymentsToCSV = async (
  propertyId,
  payments = null,
  expenses = null,
  propertyName = "Property"
) => {
  try {
    // Fetch data if not provided
    if (!payments) {
      const response = await paymentService.getPaymentsByProperty(propertyId);
      payments = response;
    }

    if (!expenses) {
      const expenseResponse = await expenseService.getExpensesByProperty(
        propertyId
      );
      expenses = expenseResponse;
    }

    // Format payments for CSV
    const formattedPayments = payments.map((payment) => ({
      Date: new Date(payment.paymentDate).toLocaleDateString(),
      Type: payment.type,
      Tenant: payment.tenant
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
        : "Unknown",
      Unit: payment.unit ? `Unit ${payment.unit.unitNumber}` : "Unknown",
      Amount: payment.amount,
      Due_Amount: payment.dueAmount || payment.amount,
      Variance:
        payment.paymentVariance ||
        payment.amount - (payment.dueAmount || payment.amount),
      Previous_Balance: payment.previousBalance || 0,
      New_Balance: payment.newBalance || 0,
      Status: payment.status,
      Payment_Method: payment.paymentMethod,
      Reference: payment.reference || "N/A",
      Description: payment.description || "N/A",
    }));

    // Format expenses for CSV
    const formattedExpenses = expenses.map((expense) => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Type: "Expense",
      Category: expense.category,
      Unit: expense.unit ? `Unit ${expense.unit.unitNumber}` : "N/A",
      Amount: expense.amount,
      Status: expense.paymentStatus,
      Vendor: expense.vendor?.name || "N/A",
      Invoice: expense.vendor?.invoiceNumber || "N/A",
      Description: expense.description || "N/A",
    }));

    // Combine both datasets
    const combinedData = [...formattedPayments, ...formattedExpenses];

    // Sort by date
    combinedData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Calculate totals
    const totalRevenue = formattedPayments
      .filter((p) => p.Status === "completed")
      .reduce((sum, p) => sum + p.Amount, 0);

    const totalExpenses = formattedExpenses.reduce(
      (sum, e) => sum + e.Amount,
      0
    );

    const pendingRevenue = formattedPayments
      .filter((p) => p.Status === "pending")
      .reduce((sum, p) => sum + p.Amount, 0);

    // Add summary rows
    combinedData.push({});
    combinedData.push({
      Date: "SUMMARY",
      Amount: "",
      Description: "",
    });
    combinedData.push({
      Date: "Total Revenue",
      Amount: totalRevenue,
      Description: "",
    });
    combinedData.push({
      Date: "Total Expenses",
      Amount: totalExpenses,
      Description: "",
    });
    combinedData.push({
      Date: "Net Income",
      Amount: totalRevenue - totalExpenses,
      Description: "",
    });
    combinedData.push({
      Date: "Pending Revenue",
      Amount: pendingRevenue,
      Description: "",
    });

    // Convert to CSV
    const csv = Papa.unparse(combinedData);

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const sanitizedPropertyName = propertyName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute(
      "download",
      `${sanitizedPropertyName}_financial_report_${dateStr}.csv`
    );
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting property payments:", error);
    throw error;
  }
};
