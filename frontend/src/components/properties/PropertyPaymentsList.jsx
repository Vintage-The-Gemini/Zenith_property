// frontend/src/components/properties/PropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2, Download } from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";
import { exportPaymentsToEnhancedCSV, generatePaymentReportFileName } from "../../utils/enhancedPaymentExporter";
import { exportToCSV } from "../../utils/csvExporter";

// Import our components
import PaymentSummaryCards from "../payments/PaymentSummaryCards";
import PaymentFilterBar from "../payments/PaymentFilterBar";
import PaymentTable from "../payments/PaymentTable";
import TenantBalanceTable from "../payments/TenantBalanceTable";
import TenantStatementModal from "../tenants/TenantStatementModal";
import { getExpensesByProperty } from "../../services/expenseService";

const PropertyPaymentsList = ({ 
  propertyId, 
  propertyName, 
  refreshTrigger, 
  timeFilter = 'all',
  customStartDate = '',
  customEndDate = ''
}) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allPayments, setAllPayments] = useState([]); // Store unfiltered payments
  const [allExpenses, setAllExpenses] = useState([]); // Store unfiltered expenses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    hasOverpayment: false,
    hasUnderpayment: false,
  });

  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    overdueTotal: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
    totalOverpayments: 0,
    totalUnderpayments: 0,
    netBalance: 0,
    criticalAccounts: 0,
    collectionRate: 0,
  });

  // Calculate date range based on time filter
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // End of day
        } else {
          startDate = null;
          endDate = null;
        }
        break;
      default: // 'all'
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  useEffect(() => {
    if (propertyId) {
      loadData();
    }
  }, [propertyId, refreshTrigger, timeFilter, customStartDate, customEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [paymentsData, propertyTenantsData, expensesData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
        getExpensesByProperty(propertyId),
      ]);

      // Ensure we have arrays to work with
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      const tenantsArray = Array.isArray(propertyTenantsData) ? propertyTenantsData : [];
      const expensesArray = Array.isArray(expensesData) ? expensesData : [];

      // Store unfiltered data
      setAllPayments(paymentsArray);
      setAllExpenses(expensesArray);
      setTenants(tenantsArray);

      // Apply time filter to payments and expenses if specified
      const { startDate, endDate } = getDateRange();
      
      let filteredPayments = paymentsArray;
      let filteredExpenses = expensesArray;

      if (startDate && endDate) {
        // Filter payments by payment date
        filteredPayments = paymentsArray.filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= startDate && paymentDate <= endDate;
        });

        // Filter expenses by date
        filteredExpenses = expensesArray.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }

      setPayments(filteredPayments);
      setExpenses(filteredExpenses);

      // Calculate summary statistics with filtered data and access to full data
      calculateSummary(filteredPayments, tenantsArray, filteredExpenses, paymentsArray, expensesArray);
    } catch (err) {
      console.error("Error loading property payments:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData, tenantsData, expensesData, allPaymentsData = paymentsData, allExpensesData = expensesData) => {
    const now = new Date();
    
    // Ensure we have arrays to work with
    const payments = Array.isArray(paymentsData) ? paymentsData : []; // filtered payments
    const tenants = Array.isArray(tenantsData) ? tenantsData : [];
    const expenses = Array.isArray(expensesData) ? expensesData : []; // filtered expenses
    const allPayments = Array.isArray(allPaymentsData) ? allPaymentsData : []; // full payments dataset
    const allExpensesArray = Array.isArray(allExpensesData) ? allExpensesData : []; // full expenses dataset

    // For filtered data (when time filter is applied), use the filtered payments/expenses
    // For 'all' time filter, calculate monthly comparisons
    const { startDate, endDate } = getDateRange();
    const isTimeFiltered = startDate && endDate && timeFilter !== 'all';

    let currentPeriodPayments, previousPeriodPayments, currentPeriodExpenses, previousPeriodExpenses;

    if (isTimeFiltered) {
      // Use the filtered payments and expenses as current period
      currentPeriodPayments = payments;
      currentPeriodExpenses = expenses;

      // For comparison, we'll use empty arrays (or could implement previous period logic)
      previousPeriodPayments = [];
      previousPeriodExpenses = [];
    } else {
      // Original monthly logic for 'all' filter
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      currentPeriodPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      });

      previousPeriodPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
      });

      currentPeriodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });

      previousPeriodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
      });
    }

    // Calculate totals for current period
    const periodTotal = currentPeriodPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const previousPeriodTotal = previousPeriodPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // Pending and overdue always from full dataset (current tenant status)
    const pendingTotal = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    const overdueTotal = allPayments
      .filter(p => p.status === 'pending' && new Date(p.dueDate) < now)
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    // Calculate growth rate
    const growthRate = previousPeriodTotal > 0 
      ? ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100 
      : 0;

    // Balance statistics (from full dataset)
    const totalOverpayments = allPayments
      .filter(p => p.isOverpayment)
      .reduce((sum, p) => sum + (p.overpayment || 0), 0);

    const totalUnderpayments = allPayments
      .filter(p => p.isUnderpayment)
      .reduce((sum, p) => sum + (p.underpayment || 0), 0);

    // Critical accounts (tenants with high balances)
    const criticalAccounts = tenants.filter(t => (t.currentBalance || 0) > 100000).length;

    // Calculate collection rate for current period
    const totalDue = currentPeriodPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const collectionRate = totalDue > 0 ? (periodTotal / totalDue) * 100 : 0;

    // Expense calculations
    const periodExpenses = currentPeriodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const previousPeriodExpensesTotal = previousPeriodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Net revenue calculations
    const netRevenue = periodTotal - periodExpenses;
    const previousNetRevenue = previousPeriodTotal - previousPeriodExpensesTotal;
    const netGrowthRate = previousNetRevenue > 0 
      ? ((netRevenue - previousNetRevenue) / previousNetRevenue) * 100 
      : 0;

    setSummary({
      monthlyTotal: periodTotal,
      pendingTotal,
      overdueTotal,
      lastMonthRevenue: previousPeriodTotal,
      growthRate,
      totalOverpayments,
      totalUnderpayments,
      netBalance: totalUnderpayments - totalOverpayments,
      criticalAccounts,
      collectionRate,
      // Expense-related fields
      monthlyExpenses: periodExpenses,
      netRevenue,
      netGrowthRate,
      totalExpenses: allExpensesArray.reduce((sum, e) => sum + (e.amount || 0), 0),
    });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      startDate: "",
      endDate: "",
      hasOverpayment: false,
      hasUnderpayment: false,
    });
    setSearchTerm("");
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handleRecordPayment = (tenant) => {
    const paymentData = { 
      tenant: tenant._id,
      unit: tenant.unitId?._id || tenant.unitId,
      property: propertyId
    };
    setSelectedPayment(paymentData);
    setShowForm(true);
  };

  const handleGenerateStatement = (tenant) => {
    setSelectedTenant(tenant);
    setShowStatementModal(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    try {
      await paymentService.createPayment(paymentData);
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.message || "Failed to save payment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      loadData();
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const handleExportCSV = async () => {
    try {
      // Get property details for the export
      const property = { 
        name: propertyName,
        // Add more property details if available
        _id: propertyId
      };

      // Prepare filter information for the export
      const exportFilters = {
        timeFilter: timeFilter || 'all',
        customStartDate,
        customEndDate,
        searchTerm,
        ...filters
      };

      // Generate enhanced CSV data
      const csvData = exportPaymentsToEnhancedCSV(
        allPayments, // Use unfiltered payments for comprehensive report
        allExpenses, // Use unfiltered expenses
        tenants,
        property,
        exportFilters
      );

      // Generate filename
      const fileName = generatePaymentReportFileName(property, exportFilters);

      // Export the data
      exportToCSV(csvData, fileName);
    } catch (err) {
      console.error("Error exporting payments:", err);
      setError("Failed to export payment data");
    }
  };

  // Filter payments based on search and filters
  const filteredPayments = (Array.isArray(payments) ? payments : []).filter(payment => {
    // Apply text search
    const searchLower = searchTerm.toLowerCase();
    const tenantName = payment.tenant
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
      : "";
    const unitNumber = payment.unit?.unitNumber?.toString().toLowerCase() || "";
    const reference = payment.reference?.toLowerCase() || "";
    
    const searchMatch = tenantName.includes(searchLower) || 
      unitNumber.includes(searchLower) || 
      reference.includes(searchLower);

    // Return false if it doesn't match search
    if (searchTerm && !searchMatch) return false;

    // Apply other filters
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.type && payment.type !== filters.type) return false;

    // Date filters
    if (filters.startDate) {
      const fromDate = new Date(filters.startDate);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < fromDate) return false;
    }

    if (filters.endDate) {
      const toDate = new Date(filters.endDate);
      toDate.setHours(23, 59, 59);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate > toDate) return false;
    }

    // Balance filters
    if (filters.hasOverpayment && !payment.isOverpayment) return false;
    if (filters.hasUnderpayment && !payment.isUnderpayment) return false;

    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  // Show payment form when requested
  if (showForm) {
    return (
      <PaymentForm
        onSubmit={handleSubmitPayment}
        onCancel={() => setShowForm(false)}
        tenantOptions={tenants}
        initialData={selectedPayment}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Property Payments</h2>
        <button
          onClick={handleAddPayment}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Financial Summary Cards */}
      <PaymentSummaryCards summary={summary} />

      {/* Search and Filter */}
      <PaymentFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        handleFilterChange={handleFilterChange}
        resetFilters={resetFilters}
        handleExportCSV={handleExportCSV}
      />

      {/* Payments Table */}
      <PaymentTable
        payments={payments}
        filteredPayments={filteredPayments}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        handleUpdateStatus={handleUpdateStatus}
        handleAddPayment={handleAddPayment}
      />

      {/* Tenant Balance Table */}
      <TenantBalanceTable
        tenants={tenants}
        formatCurrency={formatCurrency}
        onRecordPayment={handleRecordPayment}
        onGenerateStatement={handleGenerateStatement}
      />

      {/* Tenant Statement Modal */}
      {showStatementModal && (
        <TenantStatementModal
          tenant={selectedTenant}
          isOpen={showStatementModal}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedTenant(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertyPaymentsList;