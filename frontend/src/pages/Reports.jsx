// frontend/src/pages/Reports.jsx
import { useState } from "react";
import {
  BarChart2,
  Calendar,
  Users,
  Filter,
  Download,
  AlertTriangle,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import RevenueExpensesReport from "../components/reports/RevenueExpensesReport";
import { exportToCSV } from "../utils/csvExporter";
import CSVDownloadButton from "../components/common/CSVDownloadButton";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("financial");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    propertyId: "",
    period: "monthly",
  });
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleReportChange = (reportType) => {
    setActiveReport(reportType);
    setError(null);
  };

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

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleReportData = (data) => {
    setReportData(data);
  };

  const handleExportCSV = () => {
    if (!reportData) {
      setError("No data available to export");
      return;
    }

    try {
      let dataToExport = [];
      let filename = "report.csv";

      switch (activeReport) {
        case "financial":
          if (
            reportData.revenueByProperty &&
            reportData.revenueByProperty.length > 0
          ) {
            dataToExport = reportData.revenueByProperty.map((property) => ({
              Property: property.name,
              Revenue: `KES ${property.revenue.toLocaleString()}`,
              Expenses: `KES ${property.expenses.toLocaleString()}`,
              Profit: `KES ${property.profit.toLocaleString()}`,
              "Profit Margin": `${Math.round(
                (property.profit / property.revenue) * 100
              )}%`,
            }));
            filename = "financial_report.csv";
          }
          break;
        case "tenants":
          if (
            reportData.tenantPayments &&
            reportData.tenantPayments.length > 0
          ) {
            dataToExport = reportData.tenantPayments.map((tenant) => ({
              Tenant: tenant.name,
              Unit: tenant.unit,
              Property: tenant.property,
              "Total Paid": `KES ${tenant.totalPaid.toLocaleString()}`,
              Balance: `KES ${tenant.balance.toLocaleString()}`,
              "Last Payment": tenant.lastPaymentDate
                ? new Date(tenant.lastPaymentDate).toLocaleDateString()
                : "Never",
            }));
            filename = "tenant_payment_report.csv";
          }
          break;
        case "occupancy":
          if (
            reportData.occupancyByProperty &&
            reportData.occupancyByProperty.length > 0
          ) {
            dataToExport = reportData.occupancyByProperty.map((property) => ({
              Property: property.name,
              "Total Units": property.total,
              Occupied: property.occupied,
              Available: property.available,
              Maintenance: property.maintenance,
              "Occupancy Rate": `${property.rate}%`,
            }));
            filename = "occupancy_report.csv";
          }
          break;
        default:
          setError("Export not configured for this report type");
          return;
      }

      if (dataToExport.length === 0) {
        setError("No data available to export");
        return;
      }

      exportToCSV(dataToExport, filename);
    } catch (error) {
      console.error("Error exporting data:", error);
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
            View and analyze property management data
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Report Type Selection */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleReportChange("financial")}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              activeReport === "financial"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <BarChart2 className="h-4 w-4 mr-1.5" />
            Financial
          </button>
          <button
            onClick={() => handleReportChange("tenants")}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              activeReport === "tenants"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Users className="h-4 w-4 mr-1.5" />
            Tenant Payments
          </button>
          <button
            onClick={() => handleReportChange("occupancy")}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              activeReport === "occupancy"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Home className="h-4 w-4 mr-1.5" />
            Occupancy
          </button>
          <button
            onClick={() => handleReportChange("leases")}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              activeReport === "leases"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Lease Expirations
          </button>
          <button
            onClick={() => handleReportChange("revenue-expenses")}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              activeReport === "revenue-expenses"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Revenue vs Expenses
          </button>
        </div>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Report</h3>
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
            {(activeReport === "financial" ||
              activeReport === "revenue-expenses") && (
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
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
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
                {/* Property options would be dynamically loaded here */}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Report Content */}
      <div className="mt-6">
        {activeReport === "financial" && (
          <FinancialReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        )}
        {activeReport === "tenants" && (
          <TenantReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        )}
        {activeReport === "occupancy" && (
          <OccupancyReport
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        )}
        {activeReport === "leases" && (
          <LeaseExpirationReport
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        )}
        {activeReport === "revenue-expenses" && (
          <RevenueExpensesReport
            dateRange={dateRange}
            filters={filters}
            onError={handleError}
            onDataLoad={handleReportData}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
