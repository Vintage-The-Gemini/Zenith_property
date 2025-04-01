// frontend/src/components/properties/PropertyExpensesList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import Card from "../ui/Card";
import ExpenseForm from "../payments/ExpenseForm";
import expenseService from "../../services/expenseService";
import propertyService from "../../services/propertyService";
import { CSVDownloadButton } from "../common/CSVDownloadButton";

const PropertyExpensesList = ({ propertyId, propertyName }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(true); // Show filters by default
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    unitId: "",
  });
  const [units, setUnits] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    pendingExpenses: 0,
    categoryBreakdown: {},
    monthlyBreakdown: {},
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

      // Get expenses for this property
      const expensesData = await expenseService.getExpensesByProperty(
        propertyId
      );
      setExpenses(expensesData);

      // Get units for this property for filtering
      const propertyDetails = await propertyService.getPropertyById(propertyId);
      if (propertyDetails && propertyDetails.units) {
        setUnits(propertyDetails.units);
      }

      // Calculate summary data
      calculateSummaryData(expensesData);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryData = (expensesData) => {
    // Get current month's start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate total expenses
    const totalExpenses = expensesData.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate current month expenses
    const monthlyExpenses = expensesData
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate pending expenses
    const pendingExpenses = expensesData
      .filter((expense) => expense.paymentStatus === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate category breakdown
    const categoryBreakdown = {};
    expensesData.forEach((expense) => {
      const category = expense.category || "other";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          total: 0,
          count: 0,
        };
      }
      categoryBreakdown[category].total += expense.amount;
      categoryBreakdown[category].count += 1;
    });

    // Calculate monthly breakdown
    const monthlyBreakdown = {};
    expensesData.forEach((expense) => {
      if (!expense.date) return;

      const date = new Date(expense.date);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyBreakdown[monthYear]) {
        monthlyBreakdown[monthYear] = {
          month: new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          ).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          total: 0,
          count: 0,
        };
      }

      monthlyBreakdown[monthYear].total += expense.amount;
      monthlyBreakdown[monthYear].count += 1;
    });

    // Convert to array and sort by date
    const sortedMonthlyBreakdown = Object.entries(monthlyBreakdown)
      .map(([key, value]) => ({ ...value, monthKey: key }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Sort newest first

    setExpenseSummary({
      totalExpenses,
      monthlyExpenses,
      pendingExpenses,
      categoryBreakdown,
      monthlyBreakdown: sortedMonthlyBreakdown,
    });
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setShowForm(true);
  };

  const handleSubmitExpense = async (expenseData) => {
    try {
      if (selectedExpense) {
        await expenseService.updateExpense(selectedExpense._id, expenseData);
      } else {
        // Make sure propertyId is included
        const expenseWithProperty = {
          ...expenseData,
          property: propertyId,
        };
        await expenseService.createExpense(expenseWithProperty);
      }
      setShowForm(false);
      loadData(); // Refresh the data
    } catch (error) {
      console.error("Error saving expense:", error);
      setError(error.message || "Failed to save expense");
    }
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      paymentStatus: "",
      startDate: "",
      endDate: "",
      unitId: "",
    });
    setSearchTerm("");
    loadData();
  };

  const applyFilters = () => {
    // In a real implementation, this would be an API call with filters
    // For now we'll just refresh the data
    loadData();
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in description, category, or vendor name
    const description = expense.description?.toLowerCase() || "";
    const category = expense.category?.toLowerCase() || "";
    const vendorName = expense.vendor?.name?.toLowerCase() || "";

    const matchesSearch =
      description.includes(searchLower) ||
      category.includes(searchLower) ||
      vendorName.includes(searchLower);

    if (searchTerm && !matchesSearch) return false;

    // Apply category filter
    if (filters.category && expense.category !== filters.category) return false;

    // Apply payment status filter
    if (
      filters.paymentStatus &&
      expense.paymentStatus !== filters.paymentStatus
    )
      return false;

    // Apply unit filter
    if (filters.unitId && expense.unit?._id !== filters.unitId) return false;

    // Apply date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const expenseDate = new Date(expense.date);
      if (expenseDate < startDate) return false;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const expenseDate = new Date(expense.date);
      if (expenseDate > endDate) return false;
    }

    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Prepare data for CSV export
  const getCSVData = () => {
    return filteredExpenses.map((expense) => ({
      Date: formatDate(expense.date),
      Category:
        expense.category?.charAt(0).toUpperCase() +
          expense.category?.slice(1) || "Other",
      Vendor: expense.vendor?.name || "N/A",
      Amount: expense.amount,
      Status: expense.paymentStatus || "pending",
      Unit: expense.unit ? `Unit ${expense.unit.unitNumber}` : "N/A",
      Description: expense.description || "",
      Invoice: expense.vendor?.invoiceNumber || "N/A",
      Recurring: expense.recurring?.isRecurring ? "Yes" : "No",
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
      <ExpenseForm
        onSubmit={handleSubmitExpense}
        onCancel={() => setShowForm(false)}
        initialData={selectedExpense}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Expense Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Total Expenses</h4>
              <p className="text-xl font-bold">
                KES {expenseSummary.totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Current Month</h4>
              <p className="text-xl font-bold">
                KES {expenseSummary.monthlyExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Pending Expenses</h4>
              <p className="text-xl font-bold">
                KES {expenseSummary.pendingExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown (collapsible) */}
      <Card className="p-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
        >
          <h3 className="text-lg font-medium">Expense Categories</h3>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              showCategoryBreakdown ? "rotate-180" : ""
            }`}
          />
        </div>

        {showCategoryBreakdown && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(expenseSummary.categoryBreakdown).map(
              ([category, data]) => (
                <div key={category} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {data.count} expenses
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    KES {data.total.toLocaleString()}
                  </p>
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${
                          (data.total / expenseSummary.totalExpenses) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Expense Transactions</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddExpense}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Expense
          </button>
          <CSVDownloadButton
            data={getCSVData()}
            filename={`${propertyName.replace(/\s+/g, "_")}_expenses.csv`}
            buttonText="Export CSV"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
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
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        <button
          onClick={loadData}
          title="Refresh expenses data"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All Categories</option>
                <option value="maintenance">Maintenance</option>
                <option value="utilities">Utilities</option>
                <option value="taxes">Taxes</option>
                <option value="insurance">Insurance</option>
                <option value="mortgage">Mortgage</option>
                <option value="payroll">Payroll</option>
                <option value="marketing">Marketing</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="paymentStatus"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.paymentStatus}
                onChange={(e) =>
                  setFilters({ ...filters, paymentStatus: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            {units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <select
                  name="unitId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={filters.unitId}
                  onChange={(e) =>
                    setFilters({ ...filters, unitId: e.target.value })
                  }
                >
                  <option value="">All Units</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      Unit {unit.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <Card className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No expenses found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first expense
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
                  Date
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
                  Description
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {expense.category || "other"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {expense.description || "No description"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KES {expense.amount?.toLocaleString() || 0}
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
                      className="text-primary-600 hover:text-primary-900"
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
    </div>
  );
};

export default PropertyExpensesList;
