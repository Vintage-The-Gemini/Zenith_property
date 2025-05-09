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
  DollarSign,
} from "lucide-react";
import Card from "../components/ui/Card";
import PaymentForm from "../components/payments/PaymentForm";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import propertyService from "../services/propertyService";
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
      const [paymentsData, tenantsData, propertiesData] = await Promise.all([
        paymentService.getAllPayments(),
        tenantService.getAllTenants(),
        propertyService.getAllProperties(),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);
      setProperties(propertiesData);

      // Calculate summary statistics
      calculateSummary(paymentsData, tenantsData);
    } catch (err) {
      console.error("Error loading data:", err);
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
      // Prepare data for export
      const exportData = filteredPayments.map(payment => ({
        Date: new Date(payment.paymentDate).toLocaleDateString(),
        Tenant: payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown',
        Property: payment.property?.name || 'Unknown',
        Unit: payment.unit ? `Unit ${payment.unit.unitNumber}` : 'Unknown',
        Amount_Paid: payment.amountPaid || 0,
        Amount_Due: payment.amountDue || 0,
        Variance: payment.paymentVariance || 0,
        Status: payment.status,
        Type: payment.type,
        Payment_Method: payment.paymentMethod,
        Reference: payment.reference || 'N/A',
      }));

      exportToCSV(exportData, 'payments_report.csv');
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
    <div className="container mx-auto px-4 py-8 space-y-6">
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payments
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage tenant payments and balances
          </p>
        </div>
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

export default Payments;