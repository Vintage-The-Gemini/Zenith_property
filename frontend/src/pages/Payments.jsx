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
import PaymentSummary from "../components/payments/PaymentSummary";
import ExpenseForm from "../components/payments/ExpenseForm";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import unitService from "../services/unitService";
import expenseService from "../services/expenseService";
import { formatCurrency } from "../utils/formatters";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("payments"); // payments, expenses
  const [showForm, setShowForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [filters, setFilters] = useState({
    tenantId: "",
    status: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    propertyId: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingRevenue: 0,
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    overduePayments: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all required data in parallel
      const [paymentsData, tenantsData, unitsData, expensesData] =
        await Promise.all([
          paymentService.getAllPayments(),
          tenantService.getAllTenants(),
          unitService.getUnits(),
          expenseService.getAllExpenses(),
        ]);

      setPayments(paymentsData);
      setTenants(tenantsData);
      setUnits(unitsData);
      setExpenses(expensesData);

      // Calculate financial summary
      calculateFinancialSummary(paymentsData, expensesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialSummary = (paymentsData, expensesData) => {
    // Current month and last month filters
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate totals
    const totalRevenue = paymentsData
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalExpenses = expensesData.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const pendingRevenue = paymentsData
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const currentMonthRevenue = paymentsData
      .filter(
        (payment) =>
          payment.status === "completed" &&
          new Date(payment.paymentDate) >= currentMonthStart
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const lastMonthRevenue = paymentsData
      .filter(
        (payment) =>
          payment.status === "completed" &&
          new Date(payment.paymentDate) >= lastMonthStart &&
          new Date(payment.paymentDate) <= lastMonthEnd
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const overduePayments = paymentsData
      .filter(
        (payment) =>
          payment.status === "pending" && new Date(payment.dueDate) < now
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    setFinancialSummary({
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      pendingRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      overduePayments,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    // API call with filters would go here
    // For now, we'll just use client-side filtering
    loadAllData();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      tenantId: "",
      status: "",
      type: "",
      dateFrom: "",
      dateTo: "",
      propertyId: "",
    });
    setSearchTerm("");
    loadAllData();
    setShowFilters(false);
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowExpenseForm(true);
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setShowExpenseForm(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    try {
      if (selectedPayment) {
        // Update existing payment
        await paymentService.updatePaymentStatus(selectedPayment._id, {
          status: paymentData.status,
          paymentMethod: paymentData.paymentMethod,
          amount: parseFloat(paymentData.amount),
        });
      } else {
        // Create new payment
        await paymentService.createPayment({
          ...paymentData,
          amount: parseFloat(paymentData.amount),
          dueAmount: parseFloat(paymentData.dueAmount || paymentData.amount),
        });
      }
      setShowForm(false);
      loadAllData();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.message || "Failed to save payment");
    }
  };

  const handleSubmitExpense = async (expenseData) => {
    try {
      if (selectedExpense) {
        // Update existing expense
        await expenseService.updateExpense(selectedExpense._id, expenseData);
      } else {
        // Create new expense
        await expenseService.createExpense(expenseData);
      }
      setShowExpenseForm(false);
      loadAllData();
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message || "Failed to save expense");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      loadAllData();
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const handleDownloadCSV = () => {
    alert("CSV download functionality will be implemented soon");
    // Code to generate and download CSV would go here
  };

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();

    // Apply text search
    const tenantName = payment.tenant
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
      : "";
    const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
    const reference = payment.reference?.toLowerCase() || "";
    const propertyName = payment.property?.name?.toLowerCase() || "";

    const searchMatch =
      tenantName.includes(searchLower) ||
      unitNumber.includes(searchLower) ||
      reference.includes(searchLower) ||
      propertyName.includes(searchLower);

    // Return false if it doesn't match search
    if (searchTerm && !searchMatch) return false;

    // Apply other filters
    if (filters.tenantId && payment.tenant?._id !== filters.tenantId)
      return false;
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.type && payment.type !== filters.type) return false;

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate > toDate) return false;
    }

    if (filters.propertyId && payment.property?._id !== filters.propertyId)
      return false;

    return true;
  });

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase();

    // Apply text search
    const description = expense.description?.toLowerCase() || "";
    const category = expense.category?.toLowerCase() || "";
    const propertyName = expense.property?.name?.toLowerCase() || "";

    const searchMatch =
      description.includes(searchLower) ||
      category.includes(searchLower) ||
      propertyName.includes(searchLower);

    // Return false if it doesn't match search
    if (searchTerm && !searchMatch) return false;

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const expenseDate = new Date(expense.date);
      if (expenseDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      const expenseDate = new Date(expense.date);
      if (expenseDate > toDate) return false;
    }

    if (filters.propertyId && expense.property?._id !== filters.propertyId)
      return false;

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

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Show payment or expense form when requested
  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PaymentForm
          onSubmit={handleSubmitPayment}
          onCancel={() => {
            setShowForm(false);
            setSelectedPayment(null);
          }}
          tenantOptions={tenants}
          unitOptions={units}
          initialData={selectedPayment}
        />
      </div>
    );
  }

  if (showExpenseForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ExpenseForm
          onSubmit={handleSubmitExpense}
          onCancel={() => {
            setShowExpenseForm(false);
            setSelectedExpense(null);
          }}
          initialData={selectedExpense}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments & Expenses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all financial transactions
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "payments" ? (
            <button
              onClick={handleAddPayment}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          ) : (
            <button
              onClick={handleAddExpense}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
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

      {/* Financial Summary */}
      <PaymentSummary summary={financialSummary} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "payments"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Payments
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "expenses"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Expenses
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === "payments"
                ? "Search payments..."
                : "Search expenses..."
            }
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
          onClick={handleDownloadCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-5 w-5 mr-2" />
          Export
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">
            {activeTab === "payments" ? "Filter Payments" : "Filter Expenses"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === "payments" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tenant
                  </label>
                  <select
                    name="tenantId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={filters.tenantId}
                    onChange={handleFilterChange}
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
                    Status
                  </label>
                  <select
                    name="status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={filters.status}
                    onChange={handleFilterChange}
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
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="rent">Rent</option>
                    <option value="deposit">Security Deposit</option>
                    <option value="fee">Late Fee</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="dateFrom"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="dateTo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                name="propertyId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.propertyId}
                onChange={handleFilterChange}
              >
                <option value="">All Properties</option>
                {/* Assuming you have a properties list */}
              </select>
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

      {/* Payments Table */}
      {activeTab === "payments" && (
        <>
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
                  onClick={handleAddPayment}
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
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
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
                        {payment.property?.name} - Unit{" "}
                        {payment.unit?.unitNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KES {payment.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KES {payment.dueAmount?.toLocaleString() || 0}
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
                        KES {(payment.paymentVariance || 0).toLocaleString()}
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
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          View
                        </button>
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
        </>
      )}

      {/* Expenses Table */}
      {activeTab === "expenses" && (
        <>
          {expenses.length === 0 ? (
            <Card className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No expenses found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by recording your first expense
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddExpense}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Expense
                </button>
              </div>
            </Card>
          ) : filteredExpenses.length === 0 ? (
            <Card className="text-center py-12">
              <h3 className="text-sm font-medium text-gray-900">
                No matching expenses
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
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
                      Property
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
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
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
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
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.property?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KES {expense.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.description?.slice(0, 30)}
                        {expense.description?.length > 30 ? "..." : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            expense.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : expense.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {expense.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Payments;
