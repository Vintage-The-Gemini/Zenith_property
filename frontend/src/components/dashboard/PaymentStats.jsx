// frontend/src/components/dashboard/PaymentStats.jsx
import { useState, useEffect } from "react";
import { CreditCard, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import Card from "../ui/Card";
import paymentService from "../../services/paymentService";

const PaymentStats = () => {
  const [stats, setStats] = useState({
    collected: 0,
    pending: 0,
    overdue: 0,
    ytdTotal: 0,
    currentMonth: { name: "", year: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getPaymentSummary();
        setStats(data);
      } catch (err) {
        console.error("Error fetching payment stats:", err);
        setError("Failed to load payment statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
        Payment Summary - {stats.currentMonth.name} {stats.currentMonth.year}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-xl font-semibold flex items-center text-green-600">
            KES {stats.collected.toLocaleString()}
            <ArrowUp className="h-4 w-4 ml-1" />
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-semibold flex items-center text-yellow-600">
            KES {stats.pending.toLocaleString()}
            <Clock className="h-4 w-4 ml-1" />
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-xl font-semibold flex items-center text-red-600">
            KES {stats.overdue.toLocaleString()}
            <ArrowDown className="h-4 w-4 ml-1" />
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Year to Date</p>
          <p className="text-xl font-semibold flex items-center text-blue-600">
            KES {stats.ytdTotal.toLocaleString()}
            <TrendingUp className="h-4 w-4 ml-1" />
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PaymentStats;
