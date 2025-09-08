// frontend/src/pages/Payments.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Banknote,
} from "lucide-react";
import Card from "../components/ui/Card";
import PaymentForm from "../components/payments/PaymentForm";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import propertyService from "../services/propertyService";
import expenseService from "../services/expenseService";
import { exportToCSV } from "../utils/csvExporter";

// Import our components
import PaymentSummaryCards from "../components/payments/PaymentSummaryCards";
import PaymentFilterBar from "../components/payments/PaymentFilterBar";
import PaymentTable from "../components/payments/PaymentTable";
import TenantBalanceTable from "../components/payments/TenantBalanceTable";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("payments");
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tenantId: "",
    propertyId: "",
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
    totalExpenses: 0,
    netRevenue: 0,
    profitMargin: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all required data in parallel
      const [paymentsResponse, tenantsData, propertiesData, expensesData] = await Promise.all([
        paymentService.getAllPayments(),
        tenantService.getAllTenants(),
        propertyService.getAllProperties(),
        expenseService.getAllExpenses(),
      ]);

      // Handle payments response - check if it has pagination structure
      const paymentsData = paymentsResponse?.payments || paymentsResponse || [];
      
      // Ensure we have arrays to work with
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      const tenantsArray = Array.isArray(tenantsData) ? tenantsData : [];
      const propertiesArray = Array.isArray(propertiesData) ? propertiesData : [];
      const expensesArray = Array.isArray(expensesData) ? expensesData : [];
      
      setPayments(paymentsArray);
      setTenants(tenantsArray);
      setProperties(propertiesArray);
      setExpenses(expensesArray);

      // Calculate summary statistics
      calculateSummary(paymentsArray, tenantsArray, expensesArray);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData, tenantsData, expensesData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Ensure we have arrays to work with
    const payments = Array.isArray(paymentsData) ? paymentsData : [];
    const tenants = Array.isArray(tenantsData) ? tenantsData : [];
    const expenses = Array.isArray(expensesData) ? expensesData : [];

    // Current month payments
    const currentMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    // Last month payments
    const lastMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
    });

    // Calculate totals
    const monthlyTotal = currentMonthPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const lastMonthTotal = lastMonthPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const pendingTotal = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    const overdueTotal = payments
      .filter(p => p.status === 'pending' && new Date(p.dueDate) < now)
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    // Calculate growth rate
    const growthRate = lastMonthTotal > 0 
      ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Balance statistics
    const totalOverpayments = payments
      .filter(p => p.isOverpayment)
      .reduce((sum, p) => sum + (p.overpayment || 0), 0);

    const totalUnderpayments = payments
      .filter(p => p.isUnderpayment)
      .reduce((sum, p) => sum + (p.underpayment || 0), 0);

    // Critical accounts (tenants with high balances)
    const criticalAccounts = tenants.filter(t => (t.currentBalance || 0) > 100000).length;
    
    // Calculate collection rate
    const totalDue = currentMonthPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const collectionRate = totalDue > 0 ? (monthlyTotal / totalDue) * 100 : 0;

    // Calculate expense totals
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
    });

    const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate net revenue (Revenue - Expenses)
    const netRevenue = monthlyTotal - totalExpenses;
    const lastMonthNetRevenue = lastMonthTotal - lastMonthExpensesTotal;
    
    // Calculate profit margin
    const profitMargin = monthlyTotal > 0 ? (netRevenue / monthlyTotal) * 100 : 0;

    setSummary({
      monthlyTotal,
      pendingTotal,
      overdueTotal, 
      lastMonthRevenue: lastMonthTotal,
      growthRate,
      totalOverpayments,
      totalUnderpayments,
      netBalance: totalUnderpayments - totalOverpayments,
      criticalAccounts,
      collectionRate,
      totalExpenses,
      netRevenue,
      profitMargin,
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
      tenantId: "",
      propertyId: "",
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

  const handleExportCSV = () => {
    try {
      console.log("Attempting to export CSV with payments:", { 
        filteredPaymentsCount: filteredPayments.length,
        totalPayments: payments.length,
        samplePayment: filteredPayments[0]
      });

      if (!filteredPayments || filteredPayments.length === 0) {
        alert("No payment data available to export");
        return;
      }

      // Prepare data for export with more robust data handling
      const exportData = filteredPayments.map(payment => {
        const tenant = payment.tenant || {};
        const property = payment.property || {};
        const unit = payment.unit || {};

        return {
          'Payment ID': payment._id || 'N/A',
          'Date': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
          'Due Date': payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A',
          'Tenant': tenant.firstName && tenant.lastName ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
          'Tenant Email': tenant.email || 'N/A',
          'Property': property.name || 'Unknown',
          'Unit': unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unknown',
          'Amount Due': `KES ${(payment.amountDue || 0).toLocaleString()}`,
          'Amount Paid': `KES ${(payment.amountPaid || 0).toLocaleString()}`,
          'Balance': `KES ${((payment.amountDue || 0) - (payment.amountPaid || 0)).toLocaleString()}`,
          'Status': payment.status || 'Unknown',
          'Type': payment.type || 'Rent',
          'Payment Method': payment.paymentMethod || 'N/A',
          'Reference': payment.reference || 'N/A',
          'Late Fee': `KES ${(payment.lateFee || 0).toLocaleString()}`,
          'Notes': payment.notes || 'N/A'
        };
      });

      console.log("Prepared export data:", { dataCount: exportData.length, sampleRow: exportData[0] });

      exportToCSV(exportData, 'payments_report.csv');
    } catch (err) {
      console.error("Error exporting payments:", err);
      setError("Failed to export payment data: " + err.message);
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
    const propertyName = payment.property?.name?.toLowerCase() || "";
    
    const searchMatch = tenantName.includes(searchLower) || 
      unitNumber.includes(searchLower) || 
      reference.includes(searchLower) ||
      propertyName.includes(searchLower);

    // Return false if it doesn't match search
    if (searchTerm && !searchMatch) return false;

    // Apply other filters
    if (filters.tenantId && payment.tenant?._id !== filters.tenantId) return false;
    if (filters.propertyId && payment.property?._id !== filters.propertyId) return false;
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
      <div className="container mx-auto px-4 py-8">
        <PaymentForm
          onSubmit={handleSubmitPayment}
          onCancel={() => setShowForm(false)}
          tenantOptions={tenants}
          initialData={selectedPayment}
        />
      </div>
    );
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-light-primary-900 dark:text-white">
            Payment Management
          </h1>
          <p className="text-light-primary-600 dark:text-dark-primary-300 mt-1">
            Track revenue, expenses, and tenant payments
          </p>
        </div>
        <button
          onClick={handleAddPayment}
          className="inline-flex items-center px-6 py-3 bg-light-accent-600 dark:bg-dark-accent-600 text-white hover:bg-light-accent-700 dark:hover:bg-dark-accent-700 transition-colors duration-200 font-medium shadow-sm"
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
      />
    </div>
  );
};

export default Payments;