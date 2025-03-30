// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  Filter,
  Download,
  Calendar,
  Building2,
  Home,
  Users,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import RevenueExpensesReport from "../components/reports/RevenueExpensesReport";
import propertyService from "../services/propertyService";

const Reports = () => {
  // State variables
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("financial");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    propertyId: "",
    period: "monthly",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load properties for filters
      const propertiesData = await propertyService.getAllProperties();
      setProperties(propertiesData);

      setLoading(false);
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load initial data. Please try again.");
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      propertyId: "",
      period: "monthly",
    });
    setDateRange({
      startDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      )
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    setShowFilters(false);
  };

  // Handle errors from report components
  const handleReportError = (errorMessage) => {
    setError(errorMessage);
  };

  // Export report to CSV
  const handleExport = async () => {
    try {
      alert("CSV export functionality will be implemented soon");
      // A more complete implementation would call exportReport from the reportService
      // e.g., const blob = await reportService.exportReport(activeTab, 'csv', { ...filters, ...dateRange });
      // And then use the blob to create a download link
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report. Please try again.");
    }
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and analyze property performance metrics
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        >
          <Download className="h-5 w-5 mr-2" />
          Export
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto px-3 py-1 text-xs bg-red-100 dark:bg-red-900/40 rounded-md text-red-700 dark:text-red-300 hover:bg-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <div className="flex space-x-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <span className="text-gray-500 self-center">to</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property
              </label>
              <select
                name="propertyId"
                value={filters.propertyId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period
              </label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-wrap space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab("financial")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "financial"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Financial
          </button>
          <button
            onClick={() => setActiveTab("occupancy")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "occupancy"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <Home className="h-5 w-5 mr-2" />
            Occupancy
          </button>
          <button
            onClick={() => setActiveTab("tenant")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "tenant"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Tenant
          </button>
          <button
            onClick={() => setActiveTab("revenue-expenses")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "revenue-expenses"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <Building2 className="h-5 w-5 mr-2" />
            Revenue vs Expenses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "financial" && (
          <FinancialReport
            dateRange={dateRange}
            filters={filters}
            onError={handleReportError}
          />
        )}

        {activeTab === "occupancy" && (
          <OccupancyReport
            filters={{ propertyId: filters.propertyId }}
            onError={handleReportError}
          />
        )}

        {activeTab === "tenant" && (
          <TenantReport
            dateRange={dateRange}
            filters={{ propertyId: filters.propertyId }}
            onError={handleReportError}
          />
        )}

        {activeTab === "revenue-expenses" && (
          <RevenueExpensesReport
            dateRange={dateRange}
            filters={filters}
            onError={handleReportError}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
