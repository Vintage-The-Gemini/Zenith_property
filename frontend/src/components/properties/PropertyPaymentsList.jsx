// frontend/src/components/properties/ImprovedPropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  RefreshCw,
  Download,
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import unitService from "../../services/unitService";
import PaymentBalanceSummary from "../payments/PaymentBalanceSummary";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";

const ImprovedPropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true); // Changed to true by default
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    tenantId: "",
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

  // Revenue calculations summary state
  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    variance: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
    overdueTotal: 0,
    netBalanceTotal: 0,
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

      // Load payments and tenants in parallel
      const [paymentsData, tenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);

      // Calculate summary statistics
      calculateSummaryData(paymentsData);
      
      // Group payments by month
      calculateMonthlyBreakdown(paymentsData);
    } catch (err) {
      console.error("Error loading payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryData = (paymentsData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month payments
    const monthlyPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    // Last month payments
    const lastMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === lastMonth &&
        paymentDate.getFullYear() === lastMonthYear
      );
    });

    // Pending payments
    const pendingPayments = paymentsData.filter(
      (payment) => payment.status === "pending"
    );

    // Overdue payments
    const now_date = new Date();
    const overduePayments = pendingPayments.filter(
      (payment) => payment.dueDate && new Date(payment.dueDate) < now_date
    );

    // Calculate totals
    const monthlyTotal = monthlyPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const lastMonthTotal = lastMonthPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const pendingTotal = pendingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    
    const overdueTotal = overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Calculate payment variance (total of all payment variances)
    const varianceTotal = paymentsData
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + (payment.paymentVariance || 0), 0);

    // Calculate growth rate
    const growthRate =
      lastMonthTotal > 0
        ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    // Calculate net balance (from carry-forward amounts)
    const netBalanceTotal = tenantsData.reduce(
      (sum, tenant) => sum + (tenant.currentBalance || 0),
      0
    );

    setSummary({
      monthlyTotal,
      pendingTotal,
      lastMonthRevenue: lastMonthTotal,
      varianceTotal,
      growthRate,
      overdueTotal,
      netBalanceTotal,
    });
  };

  const calculateMonthlyBreakdown = (paymentsData) => {
    // Group payments by month
    const groupedByMonth = {};
    
    paymentsData.forEach(payment => {
      if (!payment.paymentDate) return;
      
      const date = new Date(payment.paymentDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          completed: 0,
          pending: 0,
          overdue: 0,
          totalPayments: 0
        };
      }
      
      if (payment.status === 'completed') {
        groupedByMonth[monthYear].completed += payment.amount;
      } else if (payment.status === 'pending') {
        groupedByMonth[monthYear].pending += payment.amount;
        
        // Check if payment is overdue
        if (payment.dueDate && new Date(payment.dueDate) < new Date()) {
          groupedByMonth[monthYear].overdue += payment.amount;
        }
      }
      
      groupedByMonth[monthYear].totalPayments++;
    });
    
    // Convert to array and sort by date
    const monthlyData = Object.entries(groupedByMonth)
      .map(([key, value]) => ({ ...value, monthKey: key }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Sort newest first
    
    setMonthlyData(monthlyData);
  };

  const handleRecordPayment = () => {
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    try {
      // Add property ID to the payment data
      const paymentWithProperty = {
        ...paymentData,
        property: propertyId,
      };

      await paymentService.createPayment(paymentWithProperty);
      setShowForm(false);
      await loadData(); // Refresh data
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(err.message || "Failed to create payment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      await loadData(); // Refresh data
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await exportPropertyPaymentsToCSV(
        propertyId, 
        filters.startDate || null, 
        filters.endDate || null, 
        propertyName
      );
      setExporting(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setError("Failed to export payments data");
      setExporting(false);
    }
  };

  const applyFilters = () => {
    // This is a client-side filter function
    // In a real implementation, this would make an API call with filter parameters
    loadData();
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      startDate: "",
      endDate: "",
      tenantId: "",
    });
    setSearchTerm("");
    loadData();
  };

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in tenant name, unit number, or reference
    const tenantName = payment.tenant
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
      : "";
    const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
    const reference = payment.reference?.toLowerCase() || "";

    const matchesSearch =
      tenantName.includes(searchLower) ||
      unitNumber.includes(searchLower) ||
      reference.includes(searchLower);

    if (searchTerm && !matchesSearch) return false;

    // Apply status filter
    if (filters.status && payment.status !== filters.status) return false;

    // Apply type filter
    if (filters.type && payment.type !== filters.type) return false;

    // Apply tenant filter
    if (filters.tenantId && payment.tenant?._id !== filters.tenantId) return false;

    // Apply date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < startDate) return false;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate > endDate) return false;
    }

    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Status badge component
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "partial":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3 mr-1" />
            Partial
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

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

  return (
    <div className="space-y-4">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
              <p className="text-xl font-bold">
                KES {summary.monthlyTotal.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          {summary.lastMonthRevenue > 0 && (
            <div className="mt-2 flex items-center text-xs">
              {summary.growthRate > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    +{Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Pending Payments</h4>
              <p className="text-xl font-bold">
                KES {summary.pendingTotal.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          {summary.overdueTotal > 0 && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertTriangle className="w-4 h-4 mr-1" />
              KES {summary.overdueTotal.toLocaleString()} overdue
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Payment Variance</h4>
              <p className="text-xl font-bold">
                KES {summary.varianceTotal.toLocaleString()}
              </p>
            </div>
            <div
              className={`h-10 w-10 ${
                summary.varianceTotal >= 0 ? "bg-blue-100" : "bg-red-100"
              } rounded-full flex items-center justify-center`}
            >
              {summary.varianceTotal >= 0 ? (
                <TrendingUp className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.varianceTotal >= 0
              ? "Overpayment balance (credit)"
              : "Underpayment balance (due)"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Net Balance</h4>
              <p className={`text-xl font-bold ${summary.netBalanceTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {Math.abs(summary.netBalanceTotal).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.netBalanceTotal > 0 ? "Credit balance" : summary.netBalanceTotal < 0 ? "Outstanding balance" : "Balanced"}
          </div>
        </Card>
      </div>

      {/* Monthly Breakdown (collapsible) */}
      <Card className="p-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
        >
          <h3 className="text-lg font-medium">Monthly Payment Breakdown</h3>
          <ChevronDown className={`w-5 h-5 transition-transform ${showMonthlyBreakdown ? 'rotate-180' : ''}`} />
        </div>
        
        {showMonthlyBreakdown && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.length > 0 ? (
                  monthlyData.map((month, index) => (
                    <tr key={month.monthKey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        KES {month.completed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        KES {month.pending.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        KES {month.overdue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {month.totalPayments}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No monthly data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Transactions</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRecordPayment}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Payment
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter className="h-5 w-5 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button
          onClick={loadData}
          title="Refresh payments data"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="">All Types</option>
                <option value="rent">Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="fee">Late Fee</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tenant
              </label>
              <select
                name="tenantId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.tenantId}
                onChange={(e) =>
                  setFilters({ ...filters, tenantId: e.target.value })
                }
              >
                <option value="">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </Card>
      )}

      {/* Payment Balance Summary */}
      <PaymentBalanceSummary payments={filteredPayments} title="Payment Balance Summary" />

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by recording your first payment
          </p>
          <div className="mt-6">
            <button
              onClick={handleRecordPayment}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">
            No matching payments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tenant
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Unit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Due
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Variance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th// frontend/src/components/properties/ImprovedPropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import unitService from "../../services/unitService";
import PaymentBalanceSummary from "../payments/PaymentBalanceSummary";
import { CSVDownloadButton } from "../common/CSVDownloadButton";
import { formatCurrency } from "../../utils/formatters";

const ImprovedPropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true); // Changed to true by default
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    tenantId: "",
  });
  const [monthlyData, setMonthlyData] = useState({});
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

  // Revenue calculations summary state
  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    variance: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
    overdueTotal: 0,
    netBalanceTotal: 0,
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

      // Load payments and tenants in parallel
      const [paymentsData, tenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);

      // Calculate summary statistics
      calculateSummaryData(paymentsData);
      
      // Group payments by month
      calculateMonthlyBreakdown(paymentsData);
    } catch (err) {
      console.error("Error loading payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryData = (paymentsData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month payments
    const monthlyPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    // Last month payments
    const lastMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === lastMonth &&
        paymentDate.getFullYear() === lastMonthYear
      );
    });

    // Pending payments
    const pendingPayments = paymentsData.filter(
      (payment) => payment.status === "pending"
    );

    // Overdue payments
    const now_date = new Date();
    const overduePayments = pendingPayments.filter(
      (payment) => payment.dueDate && new Date(payment.dueDate) < now_date
    );

    // Calculate totals
    const monthlyTotal = monthlyPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const lastMonthTotal = lastMonthPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const pendingTotal = pendingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    
    const overdueTotal = overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Calculate payment variance (total of all payment variances)
    const varianceTotal = paymentsData
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + (payment.paymentVariance || 0), 0);

    // Calculate growth rate
    const growthRate =
      lastMonthTotal > 0
        ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    // Calculate net balance (from carry-forward amounts)
    const netBalanceTotal = tenantsData.reduce(
      (sum, tenant) => sum + (tenant.currentBalance || 0),
      0
    );

    setSummary({
      monthlyTotal,
      pendingTotal,
      lastMonthRevenue: lastMonthTotal,
      varianceTotal,
      growthRate,
      overdueTotal,
      netBalanceTotal,
    });
  };

  const calculateMonthlyBreakdown = (paymentsData) => {
    // Group payments by month
    const groupedByMonth = {};
    
    paymentsData.forEach(payment => {
      if (!payment.paymentDate) return;
      
      const date = new Date(payment.paymentDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          completed: 0,
          pending: 0,
          overdue: 0,
          totalPayments: 0
        };
      }
      
      if (payment.status === 'completed') {
        groupedByMonth[monthYear].completed += payment.amount;
      } else if (payment.status === 'pending') {
        groupedByMonth[monthYear].pending += payment.amount;
        
        // Check if payment is overdue
        if (payment.dueDate && new Date(payment.dueDate) < new Date()) {
          groupedByMonth[monthYear].overdue += payment.amount;
        }
      }
      
      groupedByMonth[monthYear].totalPayments++;
    });
    
    // Convert to array and sort by date
    const monthlyData = Object.entries(groupedByMonth)
      .map(([key, value]) => ({ ...value, monthKey: key }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Sort newest first
    
    setMonthlyData(monthlyData);
  };

  const handleRecordPayment = () => {
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    try {
      // Add property ID to the payment data
      const paymentWithProperty = {
        ...paymentData,
        property: propertyId,
      };

      await paymentService.createPayment(paymentWithProperty);
      setShowForm(false);
      await loadData(); // Refresh data
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(err.message || "Failed to create payment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      await loadData(); // Refresh data
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const applyFilters = () => {
    // This is a client-side filter function
    // In a real implementation, this would make an API call with filter parameters
    loadData();
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      startDate: "",
      endDate: "",
      tenantId: "",
    });
    setSearchTerm("");
    loadData();
  };

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in tenant name, unit number, or reference
    const tenantName = payment.tenant
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
      : "";
    const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
    const reference = payment.reference?.toLowerCase() || "";

    const matchesSearch =
      tenantName.includes(searchLower) ||
      unitNumber.includes(searchLower) ||
      reference.includes(searchLower);

    if (searchTerm && !matchesSearch) return false;

    // Apply status filter
    if (filters.status && payment.status !== filters.status) return false;

    // Apply type filter
    if (filters.type && payment.type !== filters.type) return false;

    // Apply tenant filter
    if (filters.tenantId && payment.tenant?._id !== filters.tenantId) return false;

    // Apply date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < startDate) return false;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate > endDate) return false;
    }

    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Status badge component
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "partial":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3 mr-1" />
            Partial
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Prepare data for CSV export
  const getCSVData = () => {
    return filteredPayments.map(payment => ({
      Date: formatDate(payment.paymentDate),
      Due_Date: formatDate(payment.dueDate),
      Tenant: payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : "Unknown",
      Unit: payment.unit ? `Unit ${payment.unit.unitNumber}` : "Unknown",
      Amount: payment.amount,
      Due_Amount: payment.dueAmount || payment.amount,
      Status: payment.status,
      Type: payment.type,
      Payment_Method: payment.paymentMethod,
      Reference: payment.reference || "N/A",
      Previous_Balance: payment.previousBalance || 0,
      New_Balance: payment.newBalance || 0,
      Variance: payment.paymentVariance || 0,
      Description: payment.description || ""
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

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

  return (
    <div className="space-y-4">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
              <p className="text-xl font-bold">
                KES {summary.monthlyTotal.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          {summary.lastMonthRevenue > 0 && (
            <div className="mt-2 flex items-center text-xs">
              {summary.growthRate > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    +{Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Pending Payments</h4>
              <p className="text-xl font-bold">
                KES {summary.pendingTotal.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          {summary.overdueTotal > 0 && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertTriangle className="w-4 h-4 mr-1" />
              KES {summary.overdueTotal.toLocaleString()} overdue
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Payment Variance</h4>
              <p className="text-xl font-bold">
                KES {summary.varianceTotal.toLocaleString()}
              </p>
            </div>
            <div
              className={`h-10 w-10 ${
                summary.varianceTotal >= 0 ? "bg-blue-100" : "bg-red-100"
              } rounded-full flex items-center justify-center`}
            >
              {summary.varianceTotal >= 0 ? (
                <TrendingUp className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.varianceTotal >= 0
              ? "Overpayment balance (credit)"
              : "Underpayment balance (due)"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Net Balance</h4>
              <p className={`text-xl font-bold ${summary.netBalanceTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {Math.abs(summary.netBalanceTotal).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.netBalanceTotal > 0 ? "Credit balance" : summary.netBalanceTotal < 0 ? "Outstanding balance" : "Balanced"}
          </div>
        </Card>
      </div>

      {/* Monthly Breakdown (collapsible) */}
      <Card className="p-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
        >
          <h3 className="text-lg font-medium">Monthly Payment Breakdown</h3>
          <ChevronDown className={`w-5 h-5 transition-transform ${showMonthlyBreakdown ? 'rotate-180' : ''}`} />
        </div>
        
        {showMonthlyBreakdown && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.length > 0 ? (
                  monthlyData.map((month, index) => (
                    <tr key={month.monthKey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        KES {month.completed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        KES {month.pending.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        KES {month.overdue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {month.totalPayments}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No monthly data available
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImprovedPropertyPaymentsList;
            </table>
          </div>
        )}
      </Card>

      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Transactions</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRecordPayment}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Payment
          </button>
          <CSVDownloadButton 
            data={getCSVData()} 
            filename={`${propertyName.replace(/\s+/g, '_')}_payments.csv`}
            buttonText="Export CSV"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter className="h-5 w-5 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button
          onClick={loadData}
          title="Refresh payments data"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="">All Types</option>
                <option value="rent">Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="fee">Late Fee</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tenant
              </label>
              <select
                name="tenantId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.tenantId}
                onChange={(e) =>
                  setFilters({ ...filters, tenantId: e.target.value })
                }
              >
                <option value="">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </Card>
      )}

      {/* Payment Balance Summary */}
      <PaymentBalanceSummary payments={filteredPayments} title="Payment Balance Summary" />

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by recording your first payment
          </p>
          <div className="mt-6">
            <button
              onClick={handleRecordPayment}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">
            No matching payments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tenant
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >