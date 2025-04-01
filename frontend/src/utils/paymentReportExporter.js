// frontend/src/utils/paymentReportExporter.js

import Papa from "papaparse";
import paymentService from "../services/paymentService";
import expenseService from "../services/expenseService";

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

    // Fetch payments and expenses
    const [payments, expenses] = await Promise.all([
      paymentService.getPaymentsByProperty(propertyId),
      expenseService.getExpensesByProperty(propertyId),
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

        if (payment.status === "completed") {
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
    }));

    // Combine both datasets
    const allTransactions = [...formattedPayments, ...formattedExpenses];

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Calculate summary statistics for the CSV footer
    const totalRevenue = formattedPayments
      .filter((p) => p.Status === "completed")
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

    // Add summary section
    const summary = [
      {}, // Empty row
      { Date: "SUMMARY SECTION" },
      {
        Date: "Total Revenue",
        Amount: totalRevenue,
        Description: "Total completed payments",
      },
      {
        Date: "Total Expenses",
        Amount: -totalExpenses,
        Description: "Total expenses (negative)",
      },
      {
        Date: "Net Income",
        Amount: totalRevenue - totalExpenses,
        Description: "Revenue minus expenses",
      },
      {
        Date: "Pending Revenue",
        Amount: pendingRevenue,
        Description: "Pending payments",
      },
      {
        Date: "Net Carry Forward",
        Amount: totalCarryForward,
        Description:
          totalCarryForward >= 0 ? "Net credit balance" : "Net debit balance",
      },
    ];

    // Create final CSV data with transactions and summary
    const csvData = [...allTransactions, ...summary];

    // Convert to CSV with Papa Parse
    const csv = Papa.unparse(csvData);

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Create filename with property name and date range
    const today = new Date().toISOString().split("T")[0];
    const sanitizedPropertyName = propertyName
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

export default {
  exportPropertyPaymentsToCSV,
};
