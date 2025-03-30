// frontend/src/components/properties/PropertyExpensesList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  Filter,
  DollarSign,
} from "lucide-react";
import Card from "../ui/Card";
import ExpenseForm from "../payments/ExpenseForm";
import expenseService from "../../services/expenseService";
import { formatCurrency } from "../../utils/formatters";

const PropertyExpensesList = ({ propertyId, propertyName }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
  });

  const [summary, setSummary] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    recurringExpenses: 0,
  });

  useEffect(() => {
    if (propertyId) {
      loadExpenses();
    }
  }, [propertyId]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const expensesData = await expenseService.getExpensesByProperty(
        propertyId
      );
      setExpenses(expensesData);

      // Calculate summary data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate monthly expenses
      const monthlyExpenses = expensesData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });

      // Calculate recurring expenses
      const recurring = expensesData.filter(
        (expense) => expense.recurring && expense.recurring.isRecurring
      );

      setSummary({
        totalExpenses: expensesData.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
        monthlyExpenses: monthlyExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
        recurringExpenses: recurring.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
      });
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
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
      // Ensure property ID is included
      const expenseWithProperty = {
        ...expenseData,
        property: propertyId,
      };

      if (selectedExpense) {
        await expenseService.updateExpense(
          selectedExpense._id,
          expenseWithProperty
        );
      } else {
        await expenseService.createExpense(expenseWithProperty);
      }

      setShowForm(false);
      await loadExpenses();
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message || "Failed to save expense");
    }
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in description, category, vendor name
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
    return new Date(dateString).toLocaleDateString();
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Expenses for {propertyName}
        </h3>
        <button
          onClick={handleAddExpense}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadExpenses}
            className="ml-2 text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Total Expenses</h4>
              <p className="text-2xl font-bold text-gray-900">
                KES {summary.totalExpenses.toLocaleString()}
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
              <h4 className="text-sm text-gray-500 mb-1">Monthly Expenses</h4>
              <p className="text-2xl font-bold text-gray-900">
                KES {summary.monthlyExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm text-gray-500 mb-1">Recurring Expenses</h4>
              <p className="text-2xl font-bold text-gray-900">
                KES {summary.recurringExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
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
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  category: "",
                  startDate: "",
                  endDate: "",
                });
                setSearchTerm("");
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset Filters
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
            Try adjusting your search or filter criteria
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
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Vendor
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {expense.category === "custom"
                      ? expense.customCategory
                      : expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.description?.slice(0, 30)}
                    {expense.description?.length > 30 ? "..." : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KES {expense.amount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.vendor?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full 
                      ${
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
