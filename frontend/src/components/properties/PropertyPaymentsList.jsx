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
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
// import expenseService from "../../services/expenseService";

const PropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  // const [expenses, setExpenses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  // const [activeTab, setActiveTab] = useState("payments"); // payments, expenses
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    // expensesTotal: 0,
    // netIncome: 0,
    variance: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
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

      // Calculate monthly total (completed payments for current month)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Filter payments for the current month
      const monthlyPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        return (
          payment.status === "completed" &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      });

      // Filter payments for the last month
      const lastMonthPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        return (
          payment.status === "completed" &&
          paymentDate.getMonth() === lastMonth &&
          paymentDate.getFullYear() === lastMonthYear
        );
      });

      // Filter pending payments
      const pendingPayments = paymentsData.filter(
        (payment) => payment.status === "pending"
      );

      // Calculate totals
      const monthlyTotalAmount = monthlyPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const lastMonthTotalAmount = lastMonthPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const pendingTotalAmount = pendingPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      // Calculate variance (total of all payment variances)
      const varianceTotal = paymentsData
        .filter((payment) => payment.status === "completed")
        .reduce((sum, payment) => sum + (payment.paymentVariance || 0), 0);

      // Calculate growth rate
      const growthRate =
        lastMonthTotalAmount > 0
          ? ((monthlyTotalAmount - lastMonthTotalAmount) /
              lastMonthTotalAmount) *
            100
          : 0;

      setSummary({
        monthlyTotal: monthlyTotalAmount,
        pendingTotal: pendingTotalAmount,
        lastMonthRevenue: lastMonthTotalAmount,
        variance: varianceTotal,
        growthRate,
      });
    } catch (err) {
      console.error("Error fetching payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
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

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
              <p className="text-2xl font-bold">
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
              <p className="text-2xl font-bold">
                KES {summary.pendingTotal.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Payment Variance</h4>
              <p className="text-2xl font-bold">
                KES {summary.variance.toLocaleString()}
              </p>
            </div>
            <div
              className={`h-10 w-10 ${
                summary.variance >= 0 ? "bg-blue-100" : "bg-red-100"
              } rounded-full flex items-center justify-center`}
            >
              {summary.variance >= 0 ? (
                <TrendingUp className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.variance >= 0
              ? "Overpayment balance (credit)"
              : "Underpayment balance (due)"}
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
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onClick={() => {
                setFilters({
                  status: "",
                  type: "",
                  startDate: "",
                  endDate: "",
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
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.tenant
                      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                      : "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Unit {payment.unit?.unitNumber || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KES {payment.amount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    KES{" "}
                    {payment.dueAmount?.toLocaleString() ||
                      payment.amount?.toLocaleString() ||
                      0}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      (payment.paymentVariance || 0) > 0
                        ? "text-green-600"
                        : (payment.paymentVariance || 0) < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {(payment.paymentVariance || 0) > 0 ? "+" : ""}
                    KES {(payment.paymentVariance || 0)?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {payment.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/payments/${payment._id}`}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      View
                    </Link>
                    {payment.status === "pending" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(payment._id, "completed")
                        }
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
    </div>
  );
};

export default PropertyPaymentsList;
const handleCreatePayment = async (paymentData) => {
  try {
    // Add property ID to the payment data
    const paymentWithProperty = {
      ...paymentData,
      propertyId,
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
