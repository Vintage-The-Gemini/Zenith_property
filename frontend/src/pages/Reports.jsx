// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  BarChart2,
  Users,
  Filter,
  Download,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import reportService from "../services/reportService";
import propertyService from "../services/propertyService";
import { exportMonthlyFinancialReportToCSV } from "../utils/monthlyReportExporter";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("financial");
  const [properties, setProperties] = useState([]);
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
  const [error, setError] = useState(null);
  const [financialReportData, setFinancialReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // Added this state variable

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertyService.getAllProperties();
      setProperties(data);
    } catch (err) {
      console.error("Error loading properties:", err);
      setError("Failed to load properties");
    }
  };

  const handleReportDataLoad = (data) => {
    if (activeReport === "financial") {
      setFinancialReportData(data);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleExportReport = async (reportType) => {
    try {
      setExporting(true);

      if (reportType === "financial") {
        await exportMonthlyFinancialReportToCSV(
          financialReportData,
          dateRange.startDate,
          dateRange.endDate
        );
      } else if (reportType === "occupancy") {
        // Add occupancy report export if needed
      }

      setExporting(false);
    } catch (error) {
      console.error(`Error exporting ${reportType} report:`, error);
      setError(`Failed to export ${reportType} report`);
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      propertyId: "",
      period: "monthly",
    });

    // Reset date range to last month to today
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate and view reports for your properties
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Report Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
            {activeReport === "financial" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Period Grouping
                </label>
                <select
                  name="period"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Apply Filters
            </button>
          </div>
        </Card>
      )}

      {/* Report Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveReport("financial")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "financial"
                ? "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Financial
          </button>
          <button
            onClick={() => setActiveReport("occupancy")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "occupancy"
                ? "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Occupancy
          </button>
          <button
            onClick={() => setActiveReport("tenant-payment")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "tenant-payment"
                ? "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Tenant Payment
          </button>
          <button
            onClick={() => setActiveReport("lease-expiration")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "lease-expiration"
                ? "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <FileText className="h-5 w-5 mr-2" />
            Lease Expiration
          </button>
        </nav>
      </div>

      {/* Reports Content */}
      <div className="py-4">
        {activeReport === "financial" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Financial Report</h2>
              <button
                onClick={() => handleExportReport("financial")}
                disabled={exporting || !financialReportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export Full Report"}
              </button>
            </div>
            <FinancialReport
              dateRange={dateRange}
              filters={filters}
              onError={handleError}
              onDataLoad={handleReportDataLoad}
            />
          </div>
        )}

        {activeReport === "occupancy" && (
          <OccupancyReport
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}

        {activeReport === "tenant-payment" && (
          <TenantReport
            dateRange={dateRange}
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}

        {activeReport === "lease-expiration" && (
          <LeaseExpirationReport
            filters={{ propertyId: filters.propertyId }}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
