// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  BarChart2,
  Download,
  FileText,
  Filter,
  Home,
  Loader2,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import { exportFinancialReport } from "../utils/reportExport";
import reportService from "../services/reportService";
import propertyService from "../services/propertyService";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("financial");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    propertyId: "",
    startDate: "",
    endDate: "",
    period: "monthly",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertyService.getAllProperties();
      setProperties(data);
    } catch (err) {
      console.error("Error loading properties:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);

      // If we don't have report data, fetch it
      if (!reportData) {
        let data;
        switch (activeTab) {
          case "financial":
            data = await reportService.getFinancialSummary(filters);
            break;
          case "occupancy":
            data = await reportService.getOccupancyReport(filters);
            break;
          case "tenants":
            data = await reportService.getTenantPaymentReport(filters);
            break;
          case "leases":
            data = await reportService.getLeaseExpirationReport(filters);
            break;
          default:
            throw new Error("Unknown report type");
        }
        setReportData(data);
      }

      // Export the data
      switch (activeTab) {
        case "financial":
          exportFinancialReport(reportData, format);
          break;
        // Add other export types as needed
        default:
          alert(
            `${activeTab} export in ${format} format is not yet implemented`
          );
      }
    } catch (err) {
      console.error(`Error exporting ${activeTab} report:`, err);
      setError(`Failed to export report. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReportData = (data) => {
    setReportData(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and export property management reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>

          <div className="relative">
            <button
              onClick={() => handleExport("pdf")}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              disabled={loading}
            >
              <Download className="h-5 w-5 mr-2" />
              Export PDF
            </button>
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin absolute right-2 top-1/2 transform -translate-y-1/2" />
            )}
          </div>

          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            disabled={loading}
          >
            <FileText className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filters.startDate}
                onChange={handleFilterChange}
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
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            {activeTab === "financial" && (
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

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("financial");
              setReportData(null);
            }}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "financial"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Financial
          </button>

          <button
            onClick={() => {
              setActiveTab("occupancy");
              setReportData(null);
            }}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "occupancy"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Home className="h-5 w-5 mr-2" />
            Occupancy
          </button>

          <button
            onClick={() => {
              setActiveTab("tenants");
              setReportData(null);
            }}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "tenants"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Tenants
          </button>

          <button
            onClick={() => {
              setActiveTab("leases");
              setReportData(null);
            }}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "leases"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <FileText className="h-5 w-5 mr-2" />
            Lease Expirations
          </button>
        </nav>
      </div>

      {/* Report Components */}
      <div className="py-4">
        {activeTab === "financial" && (
          <FinancialReport
            dateRange={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            filters={filters}
            onError={setError}
            onDataLoad={handleReportData}
          />
        )}

        {activeTab === "occupancy" && (
          <OccupancyReport
            filters={{
              propertyId: filters.propertyId,
            }}
            onError={setError}
            onDataLoad={handleReportData}
          />
        )}

        {activeTab === "tenants" && (
          <TenantReport
            dateRange={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            filters={{
              propertyId: filters.propertyId,
            }}
            onError={setError}
            onDataLoad={handleReportData}
          />
        )}

        {activeTab === "leases" && (
          <LeaseExpirationReport
            filters={{
              propertyId: filters.propertyId,
            }}
            onError={setError}
            onDataLoad={handleReportData}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
