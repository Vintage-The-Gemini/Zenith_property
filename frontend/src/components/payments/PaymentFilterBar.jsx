// frontend/src/components/payments/PaymentFilterBar.jsx
import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import Card from '../ui/Card';

const PaymentFilterBar = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  handleFilterChange,
  resetFilters,
  handleExportCSV
}) => {
  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-primary-400 dark:text-dark-primary-400" />
            <input
              type="text"
              placeholder="Search payments by tenant, property, or reference..."
              className="w-full pl-10 pr-4 py-3 border border-light-primary-200 dark:border-dark-primary-700 focus:outline-none focus:border-light-accent-500 dark:focus:border-dark-accent-500 bg-white dark:bg-dark-primary-900 text-light-primary-900 dark:text-white transition-colors duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-3 border transition-colors duration-200 font-medium ${
                showFilters
                  ? 'border-light-accent-500 dark:border-dark-accent-500 bg-light-accent-50 dark:bg-dark-accent-900/20 text-light-accent-700 dark:text-dark-accent-400'
                  : 'border-light-primary-200 dark:border-dark-primary-700 text-light-primary-700 dark:text-dark-primary-300 bg-white dark:bg-dark-primary-900 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800'
              }`}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-3 border border-light-primary-200 dark:border-dark-primary-700 text-light-primary-700 dark:text-dark-primary-300 bg-white dark:bg-dark-primary-900 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800 transition-colors duration-200 font-medium"
            >
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </Card>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="startDate"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
                <input
                  type="date"
                  name="endDate"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Balance Filters
              </label>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    id="hasOverpayment"
                    name="hasOverpayment"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
                    checked={filters.hasOverpayment}
                    onChange={handleFilterChange}
                  />
                  <label htmlFor="hasOverpayment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Show Overpayments
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="hasUnderpayment"
                    name="hasUnderpayment"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
                    checked={filters.hasUnderpayment}
                    onChange={handleFilterChange}
                  />
                  <label htmlFor="hasUnderpayment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Show Underpayments
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </Card>
      )}
    </>
  );
};

export default PaymentFilterBar;