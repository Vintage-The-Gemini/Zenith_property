// frontend/src/components/properties/PropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2, Download } from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";

// Import our components
import PaymentSummaryCards from "../payments/PaymentSummaryCards";
import PaymentFilterBar from "../payments/PaymentFilterBar";
import PaymentTable from "../payments/PaymentTable";
import TenantBalanceTable from "../payments/TenantBalanceTable";

const PropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
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

  useEffect(() => {
    if (propertyId) {
      loadData();
    }
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [paymentsData, propertyTenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(propertyTenantsData);

      // Calculate summary statistics
      calculateSummary(paymentsData, propertyTenantsData);
    } catch (err) {
      console.error("Error loading property payments:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData, tenantsData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month payments
    const currentMonthPayments = paymentsData.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    // Last month payments
    const lastMonthPayments = paymentsData.filter(payment => {
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

    const pendingTotal = paymentsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    const overdueTotal = paymentsData
      .filter(p => p.status === 'pending' && new Date(p.dueDate) < now)
      .reduce((sum, p) => sum + (p.amountDue || 0), 0);

    // Calculate growth rate
    const growthRate = lastMonthTotal > 0 
      ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Balance statistics
    const totalOverpayments = paymentsData
      .filter(p => p.isOverpayment)
      .reduce((sum, p) => sum + (p.overpayment || 0), 0);

    const totalUnderpayments = paymentsData
      .filter(p => p.isUnderpayment)
      .reduce((sum, p) => sum + (p.underpayment || 0), 0);

    // Critical accounts (tenants with high balances)
    const criticalAccounts = tenantsData.filter(t => (t.currentBalance || 0) > 100000).length;

    // Calculate collection rate
    const totalDue = currentMonthPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const collectionRate = totalDue > 0 ? (monthlyTotal / totalDue) * 100 : 0;

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
      await exportPropertyPaymentsToCSV(propertyId, payments, null, propertyName);
    } catch (err) {
      console.error("Error exporting payments:", err);
      setError("Failed to export payment data");
    }
  };

  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
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
      />
    </div>
  );
};

export default PropertyPaymentsList;