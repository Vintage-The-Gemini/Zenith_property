// frontend/src/components/properties/PropertyPaymentsList.jsx
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
  Calculator,
  Download,
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";

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

      const [paymentsData, propertyTenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(propertyTenantsData);

      calculatePaymentSummary(paymentsData, propertyTenantsData);
    } catch (err) {
      console.error("Error fetching payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentSummary = (paymentsData, tenantsData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month completed payments
    const monthlyPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    // Last month completed payments
    const lastMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === lastMonth &&
        paymentDate.getFullYear() === lastMonthYear
      );
    });

    // Pending and overdue payments
    const pendingPayments = paymentsData.filter(
      (payment) => payment.status === "pending"
    );
    
    const overduePayments = pendingPayments.filter(
      (payment) => new Date(payment.dueDate) < now
    );

    // Calculate totals
    const monthlyTotalAmount = monthlyPayments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );

    const lastMonthTotalAmount = lastMonthPayments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );

    const pendingTotalAmount = pendingPayments.reduce(
      (sum, payment) => sum + payment.amountDue,
      0
    );

    const overdueTotal = overduePayments.reduce(
      (sum, payment) => sum + payment.amountDue,
      0
    );

    // Calculate balance statistics
    const totalOverpayments = paymentsData
      .filter(p => p.isOverpayment)
      .reduce((sum, p) => sum + (p.overpayment || 0), 0);

    const totalUnderpayments = paymentsData
      .filter(p => p.isUnderpayment)
      .reduce((sum, p) => sum + (p.underpayment || 0), 0);

    const netBalance = totalUnderpayments - totalOverpayments;

    // Count critical accounts
    const criticalAccounts = tenantsData.filter(
      tenant => tenant.currentBalance > 100000
    ).length;

    // Calculate growth rate
    const growthRate =
      lastMonthTotalAmount > 0
        ? ((monthlyTotalAmount - lastMonthTotalAmount) / lastMonthTotalAmount) * 100
        : 0;

    // Calculate collection rate
    const totalExpected = tenantsData.reduce(
      (sum, tenant) => sum + (tenant.leaseDetails?.rentAmount || 0),
      0
    );
    
    const collectionRate = totalExpected > 0 
      ? (monthlyTotalAmount / totalExpected) * 100 
      : 0;

    setSummary({
      monthlyTotal: monthlyTotalAmount,
      pendingTotal: pendingTotalAmount,
      overdueTotal,
      lastMonthRevenue: lastMonthTotalAmount,
      growthRate,
      totalOverpayments,
      totalUnderpayments,
      netBalance,
      criticalAccounts,
      collectionRate,
    });
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      const paymentWithProperty = {
        ...paymentData,
        property: propertyId,
      };

      await paymentService.createPayment(paymentWithProperty);
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(err.message || "Failed to create payment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      await loadData();
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportPropertyPaymentsToCSV(propertyId, payments, null, propertyName);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data");
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();

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

    if (filters.status && payment.status !== filters.status) return false;
    if (filters.type && payment.type !== filters.type) return false;
    if (filters.hasOverpayment && !payment.isOverpayment) return false;
    if (filters.hasUnderpayment && !payment.isUnderpayment) return false;

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

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

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

  const getBalanceIndicator = (balance) => {
    if (balance < 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" title="Credit balance" />;
    } else if (balance > 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" title="Outstanding balance" />;
    }
    return <CheckCircle className="w-4 h-4 text-gray-400" title="Balanced" />;
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
        onSubmit={handleCreatePayment}
        onCancel={() => setShowForm(false)}
        tenantOptions={tenants}
        initialData={selectedPayment}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Payments for {propertyName}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Payment
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadData} className="ml-2 text-red-700 underline">
            Try Again
          </button>
        </div>
      )}

      {/* Enhanced Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.monthlyTotal)}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs">
            <p className="text-gray-500">Collection Rate: {Math.round(summary.collectionRate)}%</p>
            {summary.lastMonthRevenue > 0 && (
              <div className="flex items-center mt-1">
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
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Pending Payments</h4>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.pendingTotal)}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          {summary.overdueTotal > 0 && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {formatCurrency(summary.overdueTotal)} overdue
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Net Balance</h4>
              <p className={`text-2xl font-bold ${
                summary.netBalance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(Math.abs(summary.netBalance))}
              </p>
            </div>
            <div className={`h-10 w-10 ${
              summary.netBalance > 0 ? 'bg-red-100' : 'bg-green-100'
            } rounded-full flex items-center justify-center`}>
              {summary.netBalance > 0 ? (
                <TrendingDown className="h-6 w-6 text-red-600" />
              ) : (
                <TrendingUp className="h-6 w-6 text-green-600" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.netBalance > 0 ? 'Total amount owed' : 'Total credit balance'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Critical Accounts</h4>
              <p className="text-2xl font-bold text-orange-600">
                {summary.criticalAccounts}
              </p>
            </div>
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Balance &gt; KES 100,000
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
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
          Filters
        </button>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilters({
                  status: "",
                  type: "",
                  startDate: "",
                  endDate: "",
                  hasOverpayment: false,
                  hasUnderpayment: false,
                });
                setSearchTerm("");
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </Card>
      )}

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
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Previous Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount Due
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  New Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {payment.tenant
                      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                      : "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(payment.previousBalance)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amountPaid)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${
                    payment.paymentVariance > 0
                      ? "text-green-600"
                      : payment.paymentVariance < 0
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}>
                    {payment.paymentVariance > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(payment.paymentVariance || 0))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        payment.newBalance < 0
                          ? "text-green-600"
                          : payment.newBalance > 0
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}>
                        {formatCurrency(Math.abs(payment.newBalance || 0))}
                      </span>
                      {getBalanceIndicator(payment.newBalance)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                   <Link
                     to={`/payments/${payment._id}`}
                     className="text-primary-600 hover:text-primary-900 mr-3"
                   >
                     View
                   </Link>
                   {payment.status === "pending" && (
                     <button
                       onClick={() => handleUpdateStatus(payment._id, "completed")}
                       className="text-green-600 hover:text-green-900"
                     >
                       Mark Paid
                     </button>
                   )}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}

     {/* Tenant Balance Summary */}
     <Card className="p-6">
       <h3 className="text-lg font-medium mb-4">Tenant Current Balances</h3>
       <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Tenant Name
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Unit
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Current Balance
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Status
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Monthly Rent
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {tenants
               .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
               .map((tenant) => (
                 <tr key={tenant._id} className="hover:bg-gray-50">
                   <td className="px-4 py-3 text-sm font-medium text-gray-900">
                     {tenant.firstName} {tenant.lastName}
                   </td>
                   <td className="px-4 py-3 text-sm text-gray-500">
                     Unit {tenant.unitId?.unitNumber || 'Unknown'}
                   </td>
                   <td className="px-4 py-3">
                     <div className="flex items-center gap-1">
                       <span className={`text-sm font-medium ${
                         tenant.currentBalance < 0
                           ? "text-green-600"
                           : tenant.currentBalance > 0
                           ? "text-red-600"
                           : "text-gray-500"
                       }`}>
                         {formatCurrency(Math.abs(tenant.currentBalance || 0))}
                       </span>
                       {getBalanceIndicator(tenant.currentBalance)}
                     </div>
                   </td>
                   <td className="px-4 py-3">
                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                       tenant.currentBalance > 100000
                         ? "bg-red-100 text-red-800"
                         : tenant.currentBalance > 0
                         ? "bg-yellow-100 text-yellow-800"
                         : tenant.currentBalance < 0
                         ? "bg-green-100 text-green-800"
                         : "bg-gray-100 text-gray-800"
                     }`}>
                       {tenant.currentBalance > 100000
                         ? "Critical"
                         : tenant.currentBalance > 0
                         ? "Outstanding"
                         : tenant.currentBalance < 0
                         ? "Credit"
                         : "Balanced"}
                     </span>
                   </td>
                   <td className="px-4 py-3 text-sm text-gray-500">
                     {formatCurrency(tenant.leaseDetails?.rentAmount || 0)}
                   </td>
                 </tr>
               ))}
           </tbody>
         </table>
       </div>
     </Card>
   </div>
 );
};

export default PropertyPaymentsList;