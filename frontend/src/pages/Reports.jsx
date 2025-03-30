// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  Download,
  Filter,
  BarChart2,
  Calendar,
  Users,
  DollarSign,
  Building2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import RevenueExpensesReport from "../components/reports/RevenueExpensesReport";
import { exportToCSV } from "../utils/csvExporter";
import { exportFinancialReport } from "../utils/reportExport";
import propertyService from "../services/propertyService";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("financial");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    propertyId: "",
    period: "monthly",
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Load properties for filter dropdown
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getAllProperties();
        setProperties(data);
      } catch (err) {
        console.error("Error loading properties:", err);
      }
    };

    fetchProperties();
  }, []);

  const handleDateRangeChange = (e) => {
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

  const handleReportSelect = (reportType) => {
    setActiveReport(reportType);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleReportDataLoad = (data) => {
    setReportData(data);
  };

  const handleExportCSV = () => {
    if (!reportData) {
      setError("No data available to export");
      return;
    }

    try {
      if (activeReport === "financial") {
        exportFinancialReport(reportData, "csv");
      } else if (activeReport === "tenants" && reportData.tenantPayments) {
        exportToCSV(reportData.tenantPayments, "tenant_report.csv");
      } else if (activeReport === "leases" && reportData.leases) {
        exportToCSV(reportData.leases, "lease_expiration_report.csv");
      } else if (
        activeReport === "occupancy" &&
        reportData.occupancyByProperty
      ) {
        exportToCSV(reportData.occupancyByProperty, "occupancy_report.csv");
      } else if (activeReport === "revenue-expenses" && reportData.data) {
        exportToCSV(reportData.data, "revenue_expenses_report.csv");
      } else {
        setError("No exportable data available for this report type");
      }
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data. Please try again.");
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
            Access and export property management insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Property
              </label>
              <select
                name="propertyId"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
          </div>

          {activeReport === "revenue-expenses" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Period Grouping
              </label>
              <select
                name="period"
                className="mt-1 block w-full md:w-1/3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={filters.period}
                onChange={handleFilterChange}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setDateRange({
                  startDate: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 2,
                    1
                  )
                    .toISOString()
                    .split("T")[0],
                  endDate: new Date().toISOString().split("T")[0],
                });
                setFilters({
                  propertyId: "",
                  period: "monthly",
                });
              }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </Card>
      )}

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => handleReportSelect("financial")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "financial"
                ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <BarChart2 className="mr-2 h-5 w-5" />
            Financial
          </button>
          <button
            onClick={() => handleReportSelect("occupancy")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "occupancy"
                ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Occupancy
          </button>
          <button
            onClick={() => handleReportSelect("tenants")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "tenants"
                ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Users className="mr-2 h-5 w-5" />
            Tenant Performance
          </button>
          <button
            onClick={() => handleReportSelect("leases")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "leases"
                ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Lease Expirations
          </button>
          <button
            onClick={() => handleReportSelect("revenue-expenses")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "revenue-expenses"
                ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Revenue vs Expenses
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
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

      {/* Reports Content */}
      <div className="py-4">
        {activeReport === "financial" && (
          <FinancialReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportDataLoad}
          />
        )}

        {activeReport === "occupancy" && (
          <OccupancyReport
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}

        {activeReport === "tenants" && (
          <TenantReport
            dateRange={dateRange}
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}

        {activeReport === "leases" && (
          <LeaseExpirationReport
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}

        {activeReport === "revenue-expenses" && (
          <RevenueExpensesReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
