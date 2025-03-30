// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Download,
  Printer,
  BarChart2,
  Users,
  Home,
  FileDown,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import RevenueExpensesReport from "../components/reports/RevenueExpensesReport";
import propertyService from "../services/propertyService";
import { exportToCSV, exportToPDF } from "../utils/reportExport";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("financial");
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
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load properties for filter dropdown
    const loadProperties = async () => {
      try {
        const data = await propertyService.getAllProperties();
        setProperties(data);
      } catch (err) {
        console.error("Error loading properties:", err);
      }
    };

    loadProperties();
  }, []);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReportData = (data) => {
    setReportData(data);
  };

  const handleError = (message) => {
    setError(message);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const handleExport = (format) => {
    if (!reportData) {
      handleError("No report data available to export");
      return;
    }

    try {
      if (format === "csv") {
        if (activeReport === "financial") {
          // Export financial data
          const csvData = [
            // Summary row
            {
              Category: "Summary",
              Item: "Total Revenue",
              Amount: reportData.summary.totalRevenue,
            },
            {
              Category: "Summary",
              Item: "Total Expenses",
              Amount: reportData.summary.totalExpenses,
            },
            {
              Category: "Summary",
              Item: "Net Profit",
              Amount: reportData.summary.netProfit,
            },
            // Monthly data
            ...reportData.revenueByMonth.map((month) => ({
              Category: "Monthly",
              Item: month.month,
              Revenue: month.revenue,
              Expenses: month.expenses,
              Profit: month.revenue - month.expenses,
            })),
            // Property data
            ...reportData.revenueByProperty.map((property) => ({
              Category: "Property",
              Item: property.name,
              Revenue: property.revenue,
              Expenses: property.expenses,
              Profit: property.profit,
            })),
          ];

          exportToCSV(csvData, "financial_report");
        }
      } else if (format === "pdf") {
        alert("PDF export functionality is not fully implemented yet");
      }
    } catch (err) {
      handleError("Error exporting report: " + err.message);
    }
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case "financial":
        return (
          <FinancialReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        );
      case "occupancy":
        return <OccupancyReport filters={filters} onError={handleError} />;
      case "tenants":
        return (
          <TenantReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
          />
        );
      case "leases":
        return (
          <LeaseExpirationReport filters={filters} onError={handleError} />
        );
      case "revenueExpenses":
        return (
          <RevenueExpensesReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p>Select a report type from the menu above</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and export property management reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Property
              </label>
              <select
                name="propertyId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filters.propertyId}
                onChange={handleFilterChange}
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            {activeReport === "revenueExpenses" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Period
                </label>
                <select
                  name="period"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filters.period}
                  onChange={handleFilterChange}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Report Types */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-2 md:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveReport("financial")}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium whitespace-nowrap ${
              activeReport === "financial"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Financial Summary
          </button>
          <button
            onClick={() => setActiveReport("occupancy")}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium whitespace-nowrap ${
              activeReport === "occupancy"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Home className="h-5 w-5 mr-2" />
            Occupancy
          </button>
          <button
            onClick={() => setActiveReport("tenants")}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium whitespace-nowrap ${
              activeReport === "tenants"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Tenant Payments
          </button>
          <button
            onClick={() => setActiveReport("leases")}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium whitespace-nowrap ${
              activeReport === "leases"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Lease Expirations
          </button>
          <button
            onClick={() => setActiveReport("revenueExpenses")}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium whitespace-nowrap ${
              activeReport === "revenueExpenses"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Building2 className="h-5 w-5 mr-2" />
            Revenue vs Expenses
          </button>
        </nav>
      </div>

      {/* Active Report Display */}
      <div className="py-4">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
