// frontend/src/components/dashboard/PaymentStats.jsx
import { useState, useEffect } from "react";
import {
  CreditCard,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
} from "lucide-react";
import Card from "../ui/Card";
import paymentService from "../../services/paymentService";

const PaymentStats = () => {
  const [stats, setStats] = useState({
    collected: 0,
    pending: 0,
    overdue: 0,
    totalCount: 0,
    overdueCount: 0,
    ytdTotal: 0,
    currentMonth: { name: "", year: 0 },
    paymentMethods: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState("month"); // "month", "quarter", "year"

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getPaymentSummary();
        setStats({
          collected: data.collected || 0,
          pending: data.pending || 0,
          overdue: data.overdue || 0,
          totalCount: data.totalCount || 0,
          overdueCount: data.overdueCount || 0,
          ytdTotal: data.ytdTotal || 0,
          currentMonth: data.currentMonth || { name: "", year: 0 },
          paymentMethods: data.paymentMethods || {},
        });
      } catch (err) {
        console.error("Error fetching payment stats:", err);
        setError("Failed to load payment statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTimeFrameChange = (newTimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  // Calculate percentage of pending payments
  const pendingPercentage =
    stats.totalCount > 0
      ? Math.round(
          (stats.pending / (stats.collected + stats.pending + stats.overdue)) *
            100
        )
      : 0;

  // Calculate percentage of overdue payments
  const overduePercentage =
    stats.totalCount > 0
      ? Math.round(
          (stats.overdue / (stats.collected + stats.pending + stats.overdue)) *
            100
        )
      : 0;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <h3 className="font-medium">Error Loading Payment Data</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Process payment methods into array for display
  const paymentMethodsArray = Object.entries(stats.paymentMethods || {}).map(
    ([method, amount]) => ({
      method,
      amount: amount || 0,
      percentage:
        stats.collected > 0 ? Math.round((amount / stats.collected) * 100) : 0,
    })
  );

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Payment Summary - {stats.currentMonth?.name || ""}{" "}
          {stats.currentMonth?.year || ""}
        </h3>

        <div className="flex space-x-1 text-xs">
          <button
            onClick={() => handleTimeFrameChange("month")}
            className={`px-3 py-1 rounded-md ${
              timeFrame === "month"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handleTimeFrameChange("quarter")}
            className={`px-3 py-1 rounded-md ${
              timeFrame === "quarter"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Quarter
          </button>
          <button
            onClick={() => handleTimeFrameChange("year")}
            className={`px-3 py-1 rounded-md ${
              timeFrame === "year"
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
          <p className="text-xl font-semibold flex items-center text-green-600 dark:text-green-400">
            KES {(stats.collected || 0).toLocaleString()}
            <ArrowUp className="h-4 w-4 ml-1" />
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalCount > 0 && (
              <>
                {Math.round(
                  ((stats.collected || 0) /
                    ((stats.collected || 0) +
                      (stats.pending || 0) +
                      (stats.overdue || 0))) *
                    100
                )}
                % of total revenue
              </>
            )}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-xl font-semibold flex items-center text-yellow-600 dark:text-yellow-400">
            KES {(stats.pending || 0).toLocaleString()}
            <Clock className="h-4 w-4 ml-1" />
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {pendingPercentage > 0 && (
              <>
                {pendingPercentage}% of total (
                {(stats.totalCount || 0) -
                  (stats.overdueCount || 0) -
                  (stats.collected || 0)}{" "}
                payments)
              </>
            )}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-xl font-semibold flex items-center text-red-600 dark:text-red-400">
            KES {(stats.overdue || 0).toLocaleString()}
            <ArrowDown className="h-4 w-4 ml-1" />
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {overduePercentage > 0 && (
              <>
                {overduePercentage}% of total ({stats.overdueCount || 0}{" "}
                payments)
              </>
            )}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Year to Date
          </p>
          <p className="text-xl font-semibold flex items-center text-blue-600 dark:text-blue-400">
            KES {(stats.ytdTotal || 0).toLocaleString()}
            <TrendingUp className="h-4 w-4 ml-1" />
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total collected this year
          </p>
        </div>
      </div>

      {/* Payment methods breakdown */}
      {paymentMethodsArray.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Methods
          </h4>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {paymentMethodsArray.map((item, index) => (
              <div
                key={item.method}
                style={{
                  width: `${item.percentage}%`,
                  marginLeft: index === 0 ? "0" : "",
                }}
                className={`h-full inline-block ${
                  index % 4 === 0
                    ? "bg-green-500 dark:bg-green-600"
                    : index % 4 === 1
                    ? "bg-blue-500 dark:bg-blue-600"
                    : index % 4 === 2
                    ? "bg-purple-500 dark:bg-purple-600"
                    : "bg-yellow-500 dark:bg-yellow-600"
                }`}
              ></div>
            ))}
          </div>
          <div className="flex flex-wrap mt-2 text-xs">
            {paymentMethodsArray.map((item, index) => (
              <div key={item.method} className="mr-4 mb-1 flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${
                    index % 4 === 0
                      ? "bg-green-500"
                      : index % 4 === 1
                      ? "bg-blue-500"
                      : index % 4 === 2
                      ? "bg-purple-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                <span className="capitalize">
                  {item.method.replace("_", " ")}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="mt-6 flex justify-end space-x-2">
        <button
          onClick={() => alert("This feature is coming soon")}
          className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Export Report
        </button>
        <button
          onClick={() => (window.location.href = "/payments")}
          className="px-3 py-1.5 text-xs bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
        >
          View All Payments
        </button>
      </div>
    </Card>
  );
};

export default PaymentStats;
