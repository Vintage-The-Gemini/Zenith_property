// frontend/src/components/properties/PropertyExpensesList.jsx
import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Loader2, Download } from 'lucide-react';
import Card from "../ui/Card";
import ExpenseForm from "../payments/ExpenseForm";
import expenseService from "../../services/expenseService";
import { exportToCSV } from "../../utils/csvExporter";

const PropertyExpensesList = ({ 
  propertyId, 
  propertyName, 
  timeFilter = 'all',
  customStartDate = '',
  customEndDate = '',
  refreshTrigger 
}) => {
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]); // Store unfiltered expenses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
  });

  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    byCategory: {},
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
      loadExpenses();
    }
  }, [propertyId, refreshTrigger, timeFilter, customStartDate, customEndDate]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await expenseService.getExpensesByProperty(propertyId);
      const expensesArray = Array.isArray(data) ? data : [];

      // Store unfiltered data
      setAllExpenses(expensesArray);

      // Apply time filter to expenses if specified
      const { startDate, endDate } = getDateRange();
      
      let filteredExpenses = expensesArray;

      if (startDate && endDate) {
        // Filter expenses by date
        filteredExpenses = expensesArray.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }

      setExpenses(filteredExpenses);

      // Calculate summary with filtered data
      calculateSummary(filteredExpenses);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to load expense data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (expensesData) => {
    // Total expenses
    const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Expenses by status
    const pending = expensesData
      .filter(expense => expense.paymentStatus === 'pending')
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const paid = expensesData
      .filter(expense => expense.paymentStatus === 'paid')
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Expenses by category
    const byCategory = {};
    expensesData.forEach(expense => {
      const category = expense.category === 'custom' ? expense.customCategory : expense.category;
      if (!byCategory[category]) {
        byCategory[category] = 0;
      }
      byCategory[category] += expense.amount || 0;
    });

    setSummary({
      total,
      pending,
      paid,
      byCategory,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      status: "",
    });
    setSearchTerm("");
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
        await expenseService.createExpense(expenseData);
      }
      setShowForm(false);
      await loadExpenses();
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message || "Failed to save expense");
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = filteredExpenses.map(expense => ({
        Date: new Date(expense.date).toLocaleDateString(),
        Category: expense.category === 'custom' ? expense.customCategory : expense.category,
        Amount: expense.amount,
        Status: expense.paymentStatus,
        Description: expense.description,
        Vendor: expense.vendor?.name || 'N/A',
        Invoice: expense.vendor?.invoiceNumber || 'N/A',
        Unit: expense.unit ? `Unit ${expense.unit.unitNumber}` : 'N/A',
        Recurring: expense.recurring?.isRecurring ? 'Yes' : 'No',
        Frequency: expense.recurring?.isRecurring ? expense.recurring.frequency : 'N/A',
      }));

      const fileName = `${propertyName}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(exportData, fileName);
    } catch (err) {
      console.error("Error exporting expenses:", err);
      setError("Failed to export expense data");
    }
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    // Apply text search
    const searchLower = searchTerm.toLowerCase();
    const descriptionMatch = expense.description?.toLowerCase().includes(searchLower) || false;
    const categoryMatch = expense.category?.toLowerCase().includes(searchLower) || 
                         expense.customCategory?.toLowerCase().includes(searchLower) || false;
    const vendorMatch = expense.vendor?.name?.toLowerCase().includes(searchLower) || false;
    
    if (searchTerm && !descriptionMatch && !categoryMatch && !vendorMatch) {
      return false;
    }

    // Apply category filter
    if (filters.category && expense.category !== filters.category) {
      return false;
    }

    // Apply status filter
    if (filters.status && expense.paymentStatus !== filters.status) {
      return false;
    }


    return true;
  });

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  // Show expense form when requested
  if (showForm) {
    return (
      <ExpenseForm
        onSubmit={handleSubmitExpense}
        onCancel={() => setShowForm(false)}
        initialData={selectedExpense}
        defaultPropertyId={propertyId}
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
        <h2 className="text-xl font-semibold">Property Expenses</h2>
        <button
          onClick={handleAddExpense}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Expense Summary */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Expense Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.total)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(summary.pending)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.paid)}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(summary.byCategory).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">Expenses by Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(summary.byCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{category}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            name="category"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            value={filters.category}
            onChange={handleFilterChange}
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
          <select
            name="status"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Reset Filters Button */}
      {(filters.category || filters.status || searchTerm) && (
        <div className="flex justify-center">
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No expenses found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            You haven't recorded any expenses for this property yet
          </p>
          <button
            onClick={handleAddExpense}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Expense
          </button>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No matching expenses</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Try adjusting your filters to find what you're looking for
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reset Filters
          </button>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredExpenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {expense.category === 'custom' ? expense.customCategory : expense.category}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      expense.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : expense.paymentStatus === 'overdue'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {expense.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {expense.vendor?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
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