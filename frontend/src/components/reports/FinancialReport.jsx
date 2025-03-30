// frontend/src/components/reports/FinancialReport.jsx
import { useState, useEffect } from "react";
import { BarChart2, DollarSign, Download } from "lucide-react";
import Card from "../ui/Card";
import reportService from "../../services/reportService";
import { exportPropertyRevenueToCSV } from "../../utils/csvExporter";

const FinancialReport = ({ dateRange, filters, onError, onDataLoad }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange, filters, retryCount]);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);

      // Prepare filter parameters
      const params = {
        startDate: dateRange?.startDate || "",
        endDate: dateRange?.endDate || "",
        ...(filters || {}),
      };

      // Remove any undefined or null values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      const data = await reportService.getFinancialSummary(params);
      setReportData(data);

      // Pass data to parent component for export functionality
      if (onDataLoad) {
        onDataLoad(data);
      }
    } catch (err) {
      console.error("Error fetching financial report:", err);
      if (onError) {
        onError("Failed to load financial report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      if (reportData && reportData.revenueByProperty) {
        exportPropertyRevenueToCSV(reportData.revenueByProperty);
      } else {
        throw new Error("No property revenue data available to export");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      if (onError) {
        onError("Failed to export data to CSV. Please try again.");
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No financial data available
        </p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {reportData.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {reportData.summary.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Net Profit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {reportData.summary.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pending Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {(reportData.summary.pendingRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by Month Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">
          Revenue vs Expenses by Month
        </h3>

        {reportData.revenueByMonth && reportData.revenueByMonth.length > 0 ? (
          <div className="space-y-4">
            {reportData.revenueByMonth.map((data, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{data.month}</span>
                  <span className="text-sm font-medium">
                    Profit: KES{" "}
                    {(data.revenue - data.expenses).toLocaleString()}
                  </span>
                </div>
                <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 h-full bg-green-500 dark:bg-green-600"
                    style={{
                      width: `${
                        (data.revenue /
                          Math.max(
                            1,
                            ...reportData.revenueByMonth.map((d) =>
                              Math.max(d.revenue, d.expenses)
                            )
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="absolute left-0 h-full bg-red-500 dark:bg-red-600 opacity-70"
                    style={{
                      width: `${
                        (data.expenses /
                          Math.max(
                            1,
                            ...reportData.revenueByMonth.map((d) =>
                              Math.max(d.revenue, d.expenses)
                            )
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Revenue: KES {data.revenue.toLocaleString()}</span>
                  <span>Expenses: KES {data.expenses.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No monthly revenue data available for the selected period
            </p>
          </div>
        )}

        <div className="flex mt-4 justify-center text-xs">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-full mr-1"></div>
            <span>Revenue</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded-full mr-1 opacity-70"></div>
            <span>Expenses</span>
          </div>
        </div>
      </Card>

      {/* Revenue by Property */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Revenue by Property</h3>
          {reportData.revenueByProperty &&
            reportData.revenueByProperty.length > 0 && (
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <Download className="h-4 w-4 mr-1.5" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            )}
        </div>

        {reportData.revenueByProperty &&
        reportData.revenueByProperty.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.revenueByProperty.map((property, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {property.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      KES {property.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      KES {property.expenses.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      KES {property.profit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {property.revenue > 0
                        ? `${Math.round(
                            (property.profit / property.revenue) * 100
                          )}%`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No property revenue data available for the selected period
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FinancialReport;
