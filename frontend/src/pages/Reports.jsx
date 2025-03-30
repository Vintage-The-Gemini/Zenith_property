// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import { 
  BarChart2, 
  FileText, 
  Download, 
  AlertTriangle, 
  Loader2,
  Filter,
  TrendingUp,
  Calendar,
  Users,
  Building2
} from "lucide-react";
import Card from "../components/ui/Card";
import FinancialReport from "../components/reports/FinancialReport";
import OccupancyReport from "../components/reports/OccupancyReport";
import TenantReport from "../components/reports/TenantReport";
import LeaseExpirationReport from "../components/reports/LeaseExpirationReport";
import RevenueExpensesReport from "../components/reports/RevenueExpensesReport";
import propertyService from "../services/propertyService";
import reportService from "../services/reportService";
import { 
  exportToCSV, 
  exportToPDF, 
  exportFinancialReportToPDF, 
  exportOccupancyReportToPDF 
} from "../utils/reportExport";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("financial");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    propertyId: "",
    period: "monthly",
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    // When active report changes, load the appropriate report data
    if (activeReport) {
      loadReportData();
    }
  }, [activeReport, dateRange, filters]);

  const loadProperties = async () => {
    try {
      const data = await propertyService.getAllProperties();
      setProperties(data);
    } catch (err) {
      console.error("Error loading properties:", err);
      setError("Failed to load properties for filtering");
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      let data;
      
      switch (activeReport) {
        case "financial":
          data = await reportService.getFinancialSummary({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            propertyId: filters.propertyId,
          });
          break;
        case "occupancy":
          data = await reportService.getOccupancyReport({
            propertyId: filters.propertyId,
          });
          break;
        case "tenants":
          data = await reportService.getTenantPaymentReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            propertyId: filters.propertyId,
          });
          break;
        case "revenue-expenses":
          data = await reportService.getRevenueVsExpenses({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            propertyId: filters.propertyId,
            period: filters.period,
          });
          break;
        case "lease-expiration":
          data = await reportService.getLeaseExpirationReport({
            propertyId: filters.propertyId,
          });
          break;
        default:
          data = null;
      }
      
      setReportData(data);
    } catch (err) {
      console.error(`Error loading ${activeReport} report:`, err);
      setError(`Failed to load ${activeReport} report. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const handleExport = async (format) => {
    if (!reportData) return;
    
    try {
      setExportLoading(true);
      
      if (format === 'csv') {
        // CSV export logic differs per report type
        switch (activeReport) {
          case "financial":
            // Export revenue by month data
            if (reportData.revenueByMonth) {
              exportToCSV(reportData.revenueByMonth, 'financial_report_monthly');
            }
            break;
          case "occupancy":
            // Export occupancy by property data
            if (reportData.occupancyByProperty) {
              exportToCSV(reportData.occupancyByProperty, 'occupancy_report');
            }
            break;
          case "tenants":
            // Export tenant payments data
            if (reportData.tenantPayments) {
              exportToCSV(reportData.tenantPayments, 'tenant_payment_report');
            }
            break;
          case "revenue-expenses":
            // Export revenue vs expenses data
            if (reportData.data) {
              exportToCSV(reportData.data, 'revenue_expenses_report');
            }
            break;
          case "lease-expiration":
            // Export lease expiration data
            if (reportData.leases) {
              exportToCSV(reportData.leases, 'lease_expiration_report');
            }
            break;
        }
      } else if (format === 'pdf') {
        // PDF export logic
        switch (activeReport) {
          case "financial":
            exportFinancialReportToPDF(reportData);
            break;
          case "occupancy":
            exportOccupancyReportToPDF(reportData);
            break;
          case "tenants":
            // Define columns for tenant payments table
            const tenantColumns = [
              { header: 'Tenant', key: 'name' },
              { header: 'Unit', key: 'unit' },
              { header: 'Total Paid', key: 'totalPaid', formatter: val => `KES ${val.toLocaleString()}` },
              { header: 'Balance', key: 'balance', formatter: val => `KES ${Math.abs(val).toLocaleString()}` },
              { header: 'Last Payment', key: 'lastPaymentDate', formatter: val => val ? new Date(val).toLocaleDateString() : 'Never' }
            ];
            exportToPDF(reportData.tenantPayments, 'tenant_payment_report', 'Tenant Payment Report', tenantColumns);
            break;
          case "revenue-expenses":
            // Define columns for revenue vs expenses table
            const revenueColumns = [
              { header: 'Period', key: 'period' },
              { header: 'Revenue', key: 'revenue', formatter: val => `KES ${val.toLocaleString()}` },
              { header: 'Expenses', key: 'expenses', formatter: val => `KES ${val.toLocaleString()}` },
              { header: 'Profit', key: 'profit', formatter: val => `KES ${val.toLocaleString()}` }
            ];
            exportToPDF(reportData.data, 'revenue_expenses_report', 'Revenue vs Expenses Report', revenueColumns);
            break;
          case "lease-expiration":
            // Define columns for lease expiration table
            const leaseColumns = [
              { header: 'Tenant', key: 'name' },
              { header: 'Unit', key: 'unitNumber' },
              { header: 'End Date', key: 'leaseEndDate', formatter: val => new Date(val).toLocaleDateString() },
              { header: 'Days Remaining', key: 'daysRemaining' }
            ];
            exportToPDF(reportData.leases, 'lease_expiration_report', 'Lease Expiration Report', leaseColumns);
            break;
        }
      }
    } catch (err) {
      console.error(`Error exporting ${activeReport} report:`, err);
      setError(`Failed to export report. Please try again.`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and analyze property performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
          <div className="relative inline-block">
            <button
              onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={exportLoading || !reportData}
            >
              {exportLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Export
            </button>
            <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleExport('csv');
                    document.getElementById('export-dropdown').classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExport('pdf');
                    document.getElementById('export-dropdown').classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
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

      {/* Report types */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveReport("financial")}
            className={`py-4 px-1 mr-8 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "financial"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart2 className="mr-2 h-5 w-5" />
            Financial Summary
          </button>
          <button
            onClick={() => setActiveReport("occupancy")}
            className={`py-4 px-1 mr-8 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "occupancy"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Occupancy Report
          </button>
          <button
            onClick={() => setActiveReport("tenants")}
            className={`py-4 px-1 mr-8 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "tenants"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="mr-2 h-5 w-5" />
            Tenant Payments
          </button>
          <button
            onClick={() => setActiveReport("revenue-expenses")}
            className={`py-4 px-1 mr-8 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "revenue-expenses"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Revenue vs Expenses
          </button>
          <button
            onClick={() => setActiveReport("lease-expiration")}
            className={`py-4 px-1 mr-8 inline-flex items-center border-b-2 font-medium text-sm ${
              activeReport === "lease-expiration"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Lease Expirations
          </button>
        </nav>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                name="propertyId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
            
            {["financial", "tenants", "revenue-expenses"].includes(activeReport) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
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
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </div>
              </>
            )}
            
            {activeReport === "revenue-expenses" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Period
                </label>
                <select
                  name="period"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
          </div>
        </Card>
      )}

      {/* Display the active report */}
      <div className="py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {activeReport === "financial" && (
              <FinancialReport 
                dateRange={dateRange} 
                filters={filters} 
                onError={setError} 
              />
            )}
            
            {activeReport === "occupancy" && (
              <OccupancyReport 
                filters={filters} 
                onError={setError} 
              />
            )}
            
            {activeReport === "tenants" && (
              <TenantReport 
                dateRange={dateRange} 
                filters={filters} 
                onError={setError} 
              />
            )}
            
            {activeReport === "revenue-expenses" && (
              <RevenueExpensesReport 
                dateRange={dateRange} 
                filters={filters} 
                onError={setError} 
              />
            )}
            
            {activeReport === "lease-expiration" && (
              <LeaseExpirationReport 
                filters={filters} 
                onError={setError} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;