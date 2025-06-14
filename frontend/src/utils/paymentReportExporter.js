// frontend/src/utils/paymentReportExporter.js
import Papa from "papaparse";
import paymentService from "../services/paymentService"; 
import expenseService from "../services/expenseService"; 
import propertyService from "../services/propertyService";
import tenantService from "../services/tenantService";
import { exportToCSV } from "./csvExporter";

/**
 * Export comprehensive property payments with new CSV design
 */
export const exportPropertyPaymentsToCSV = async (
  propertyId,
  payments = null,
  expenses = null,
  propertyName = "Property"
) => {
  try {
    // Fetch all required data
    const [property, fetchedPayments, fetchedExpenses, tenants] = await Promise.all([
      propertyService.getPropertyById(propertyId),
      payments || paymentService.getPaymentsByProperty(propertyId),
      expenses || expenseService.getExpensesByProperty(propertyId),
      tenantService.getTenantsByProperty(propertyId),
    ]);

    payments = fetchedPayments;
    expenses = fetchedExpenses;

    // Prepare property details
    const propertyDetails = {
      name: property.name,
      type: property.type,
      address: property.address,
      totalUnits: property.units?.length || 0,
      occupiedUnits: property.units?.filter(u => u.status === 'occupied').length || 0,
      availableUnits: property.units?.filter(u => u.status === 'available').length || 0,
      maintenanceUnits: property.units?.filter(u => u.status === 'maintenance').length || 0,
      occupancyRate: calculateOccupancyRate(property)
    };

    // Calculate comprehensive financial summary
    const financialSummary = calculateComprehensiveFinancialSummary(payments, expenses, tenants);

    // Prepare transaction data with all details
    const transactionData = [];

    // Add payment records
    payments.forEach(payment => {
      transactionData.push({
        'Transaction Date': formatDate(payment.paymentDate),
        'Type': 'PAYMENT',
        'Category': payment.type,
        'Tenant/Vendor': payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown',
        'Unit': payment.unit?.unitNumber || 'N/A',
        'Reference': payment.reference || payment._id,
        'Description': payment.description || `${payment.type} payment`,
        'Previous Balance': payment.previousBalance || 0,
        'Amount Due': payment.amountDue || 0,
        'Amount Paid': payment.amountPaid || 0,
        'Applied to Previous': payment.appliedToPreviousBalance || 0,
        'Applied to Current': payment.appliedToCurrentRent || 0,
        'Payment Variance': payment.paymentVariance || 0,
        'New Balance': payment.newBalance || 0,
        'Overpayment': payment.overpayment || 0,
        'Underpayment': payment.underpayment || 0,
        'Status': payment.status,
        'Payment Method': payment.paymentMethod,
        'Is Overpayment': payment.isOverpayment ? 'Yes' : 'No',
        'Is Underpayment': payment.isUnderpayment ? 'Yes' : 'No',
        'In Same Period': payment.inSamePeriod ? 'Yes' : 'No'
      });
    });

    // Add expense records
    expenses.forEach(expense => {
      transactionData.push({
        'Transaction Date': formatDate(expense.date),
        'Type': 'EXPENSE',
        'Category': expense.category,
        'Tenant/Vendor': expense.vendor?.name || 'Unknown Vendor',
        'Unit': expense.unit?.unitNumber || 'Property-wide',
        'Reference': expense.vendor?.invoiceNumber || expense._id,
        'Description': expense.description,
        'Previous Balance': 0,
        'Amount Due': expense.amount,
        'Amount Paid': expense.paymentStatus === 'paid' ? expense.amount : 0,
        'Applied to Previous': 0,
        'Applied to Current': expense.paymentStatus === 'paid' ? expense.amount : 0,
        'Payment Variance': 0,
        'New Balance': expense.paymentStatus === 'paid' ? 0 : expense.amount,
        'Overpayment': 0,
        'Underpayment': expense.paymentStatus === 'paid' ? 0 : expense.amount,
        'Status': expense.paymentStatus,
        'Payment Method': 'N/A',
        'Is Overpayment': 'No',
        'Is Underpayment': expense.paymentStatus === 'paid' ? 'No' : 'Yes',
        'In Same Period': 'N/A'
      });
    });

    // Sort by date
    transactionData.sort((a, b) => new Date(b['Transaction Date']) - new Date(a['Transaction Date']));

    // Generate filename
    const sanitizedPropertyName = propertyName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${sanitizedPropertyName}_financial_report_${dateStr}.csv`;

    // Export using the new design
    exportToCSV(transactionData, filename, propertyDetails, financialSummary);
  } catch (error) {
    console.error("Error exporting comprehensive property report:", error);
    throw error;
  }
};

// Helper functions
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-KE');
};

const calculateOccupancyRate = (property) => {
  const totalUnits = property.units?.length || 0;
  const occupiedUnits = property.units?.filter(u => u.status === 'occupied').length || 0;
  return totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
};

const calculateComprehensiveFinancialSummary = (payments, expenses, tenants) => {
  // Revenue calculations
  const monthlyRentRoll = tenants.reduce((sum, t) => sum + (t.leaseDetails?.rentAmount || 0), 0);
  const expectedRevenue = monthlyRentRoll * 12; // Annual expected
  
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  
  const overduePayments = payments.filter(p => 
    p.status === 'pending' && new Date(p.dueDate) < new Date()
  );
  const overdueRevenue = overduePayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);

  // Expense calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidExpenses = expenses
    .filter(e => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const unpaidExpenses = totalExpenses - paidExpenses;
  const overdueExpenses = expenses
    .filter(e => e.paymentStatus === 'overdue')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Balance calculations
  const totalOutstanding = tenants.reduce((sum, t) => sum + Math.max(0, t.currentBalance || 0), 0);
  const totalCredits = tenants.reduce((sum, t) => sum + Math.abs(Math.min(0, t.currentBalance || 0)), 0);
  const totalDeposits = tenants.reduce((sum, t) => sum + (t.leaseDetails?.securityDeposit || 0), 0);

  // Performance metrics
  const collectionRate = expectedRevenue > 0 
    ? Math.round((totalRevenue / expectedRevenue) * 100) 
    : 0;
  
  const paymentSuccessRate = payments.length > 0
    ? Math.round((completedPayments.length / payments.length) * 100)
    : 0;

  const avgDaysToPay = calculateAverageDaysToPay(completedPayments);
  const defaultRate = calculateDefaultRate(payments);
  
  const netIncome = totalRevenue - paidExpenses;
  const profitMargin = totalRevenue > 0 
    ? Math.round((netIncome / totalRevenue) * 100)
    : 0;

  return {
    expectedRevenue,
    totalRevenue,
    pendingRevenue,
    overdueRevenue,
    totalExpenses,
    paidExpenses,
    unpaidExpenses,
    overdueExpenses,
    totalOutstanding,
    totalCredits,
    totalDeposits,
    netIncome,
    collectionRate,
    paymentSuccessRate,
    avgDaysToPay,
    defaultRate,
    profitMargin
  };
};

const calculateAverageDaysToPay = (completedPayments) => {
  if (completedPayments.length === 0) return 0;
  
  const daysToPayArray = completedPayments.map(payment => {
    const dueDate = new Date(payment.dueDate);
    const paymentDate = new Date(payment.paymentDate);
    return Math.max(0, Math.floor((paymentDate - dueDate) / (1000 * 60 * 60 * 24)));
  });
  
  return Math.round(daysToPayArray.reduce((sum, days) => sum + days, 0) / daysToPayArray.length);
};

const calculateDefaultRate = (payments) => {
  const totalDue = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const defaultedAmount = payments
    .filter(p => p.status === 'pending' && new Date(p.dueDate) < thirtyDaysAgo)
    .reduce((sum, p) => sum + (p.amountDue || 0), 0);
  
  return totalDue > 0 ? Math.round((defaultedAmount / totalDue) * 100) : 0;
};

export default {
  exportPropertyPaymentsToCSV
};