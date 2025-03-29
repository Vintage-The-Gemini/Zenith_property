// frontend/src/components/dashboard/PaymentTrends.jsx
import { useState, useEffect } from "react";
import { TrendingUp, Filter } from "lucide-react";
import Card from "../ui/Card";
import paymentService from "../../services/paymentService";

const PaymentTrends = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const payments = await paymentService.getAllPayments();

        // Process payments to create monthly trends
        const groupedPayments = groupPaymentsByMonth(payments);
        setMonthlyData(groupedPayments);
      } catch (err) {
        console.error("Error loading payment trends:", err);
        setError("Failed to load payment trends");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group payments by month
  const groupPaymentsByMonth = (payments) => {
    // Empty array if no payments
    if (!payments || payments.length === 0) return [];

    // Group by month
    const grouped = {};

    payments.forEach((payment) => {
      const date = new Date(payment.paymentDate || payment.createdAt);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!grouped[key]) {
        grouped[key] = {
          month: key,
          completed: 0,
          pending: 0,
          overdue: 0,
        };
      }

      // Add to appropriate status group
      if (payment.status === "completed") {
        grouped[key].completed += payment.amount;
      } else if (payment.status === "pending") {
        // Check if overdue
        const now = new Date();
        const dueDate = new Date(payment.dueDate);

        if (dueDate < now) {
          grouped[key].overdue += payment.amount;
        } else {
          grouped[key].pending += payment.amount;
        }
      }
    });

    // Convert to array and sort by date
    return Object.values(grouped)
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA - dateB;
      })
      .slice(-6); // Last 6 months
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
        Payment Trends
      </h3>

      {monthlyData.length === 0 ? (
        <p className="text-center text-gray-500">No payment data available</p>
      ) : (
        <div className="space-y-6">
          {monthlyData.map((data, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{data.month}</span>
                <span className="text-sm font-medium">
                  Total: KES{" "}
                  {(
                    data.completed +
                    data.pending +
                    data.overdue
                  ).toLocaleString()}
                </span>
              </div>
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${
                        (data.completed /
                          (data.completed + data.pending + data.overdue)) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500 h-full"
                    style={{
                      width: `${
                        (data.pending /
                          (data.completed + data.pending + data.overdue)) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{
                      width: `${
                        (data.overdue /
                          (data.completed + data.pending + data.overdue)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Collected: KES {data.completed.toLocaleString()}</span>
                <span>Pending: KES {data.pending.toLocaleString()}</span>
                <span>Overdue: KES {data.overdue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center text-xs">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Collected</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span>Overdue</span>
        </div>
      </div>
    </Card>
  );
};

export default PaymentTrends;
