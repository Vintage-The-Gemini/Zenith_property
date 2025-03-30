// frontend/src/components/reports/RevenueExpensesReport.jsx
import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import reportService from "../../services/reportService";

const RevenueExpensesReport = ({ dateRange, filters, onError }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchRevenueExpensesReport();
  }, [dateRange, filters, retryCount]);

  const fetchRevenueExpensesReport = async () => {
    try {
      setLoading(true);

      // Prepare filter parameters
      const params = {
        startDate: dateRange?.startDate || "",
        endDate: dateRange?.endDate || "",
        period: filters?.period || "monthly",
        propertyId: filters?.propertyId || "",
      };

      // Remove any undefined or null values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      const data = await reportService.getRevenueVsExpenses(params);
      setReportData(data);
    } catch (err) {
      console.error("Error fetching revenue vs expenses report:", err);
      if (onError) {
        onError("Failed to load revenue vs expenses report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
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
          No revenue and expenses data available
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Net Profit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {reportData.summary.netProfit.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {reportData.summary.totalRevenue > 0
                  ? `(${Math.round(
                      (reportData.summary.netProfit /
                        reportData.summary.totalRevenue) *
                        100
                    )}% margin)`
                  : ""}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Period Data Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            Revenue vs Expenses by{" "}
            {reportData.periodType?.charAt(0).toUpperCase() +
              reportData.periodType?.slice(1) || "Period"}
          </h3>
        </div>

        {reportData.data && reportData.data.length > 0 ? (
          <div className="space-y-4">
            {reportData.data.map((period, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{period.period}</span>
                  <span className="text-sm font-medium">
                    Profit: KES {period.profit.toLocaleString()}
                    {period.revenue > 0
                      ? ` (${Math.round(
                          (period.profit / period.revenue) * 100
                        )}%)`
                      : ""}
                  </span>
                </div>
                <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 h-full bg-green-500 dark:bg-green-600"
                    style={{
                      width: `${
                        (period.revenue /
                          Math.max(
                            1,
                            ...reportData.data.map((d) =>
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
                        (period.expenses /
                          Math.max(
                            1,
                            ...reportData.data.map((d) =>
                              Math.max(d.revenue, d.expenses)
                            )
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Revenue: KES {period.revenue.toLocaleString()}</span>
                  <span>Expenses: KES {period.expenses.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No revenue/expenses data available for the selected period
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

      {/* Profit Margin Trend */}
      {reportData.data && reportData.data.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Profit Margin Trend</h3>

          <div className="h-40 relative">
            <div
              className="absolute left-0 right-0 border-b border-gray-400 dark:border-gray-600"
              style={{ bottom: "50%" }}
            ></div>
            {reportData.data.map((period, index) => {
              const margin =
                period.revenue > 0 ? (period.profit / period.revenue) * 100 : 0;

              // Cap margin at 100% for visualization purposes
              const cappedMargin = Math.min(Math.max(margin, -100), 100);

              // Calculate height and position based on margin
              const heightPercentage = Math.abs(cappedMargin);
              const isNegative = cappedMargin < 0;

              return (
                <div
                  key={index}
                  className="absolute bottom-1/2 flex flex-col items-center"
                  style={{
                    left: `${
                      (index / (reportData.data.length - 1 || 1)) * 100
                    }%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="text-xs text-center mb-1">
                    {Math.round(margin)}%
                  </div>
                  <div
                    className={`w-8 ${
                      isNegative ? "bg-red-500 bottom-0" : "bg-green-500 top-0"
                    } absolute`}
                    style={{
                      height: `${heightPercentage / 2}%`,
                      maxHeight: "40%",
                      bottom: isNegative ? "0" : "50%",
                      transform: isNegative ? "none" : "translateY(-100%)",
                    }}
                  ></div>
                  <div
                    className="text-xs text-center mt-1 w-16 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      position: "absolute",
                      bottom: "-25px",
                    }}
                  >
                    {period.period}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RevenueExpensesReport;
