// frontend/src/components/dashboard/RevenueExpensesChart.jsx
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import Card from "../ui/Card";

const RevenueExpensesChart = ({ payments = [], expenses = [] }) => {
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Process data for the last 6 months
    const processData = () => {
      const now = new Date();
      const data = [];

      // Create data for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleString("default", { month: "short" });
        const year = month.getFullYear();

        // Filter payments for this month
        const monthPayments = payments.filter((payment) => {
          const paymentDate = new Date(payment.paymentDate);
          return (
            paymentDate.getMonth() === month.getMonth() &&
            paymentDate.getFullYear() === month.getFullYear() &&
            payment.status === "completed"
          );
        });

        // Filter expenses for this month
        const monthExpenses = expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === month.getMonth() &&
            expenseDate.getFullYear() === month.getFullYear()
          );
        });

        // Calculate totals
        const revenue = monthPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        const expense = monthExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
        const profit = revenue - expense;

        data.push({
          month: `${monthName} ${year}`,
          revenue,
          expense,
          profit,
        });
      }

      setMonthlyData(data);
    };

    if (payments.length > 0 || expenses.length > 0) {
      processData();
    } else {
      // Set sample data for demonstration if no real data exists
      setMonthlyData([
        { month: "Oct 2024", revenue: 250000, expense: 120000, profit: 130000 },
        { month: "Nov 2024", revenue: 280000, expense: 130000, profit: 150000 },
        { month: "Dec 2024", revenue: 300000, expense: 140000, profit: 160000 },
        { month: "Jan 2025", revenue: 320000, expense: 150000, profit: 170000 },
        { month: "Feb 2025", revenue: 310000, expense: 145000, profit: 165000 },
        { month: "Mar 2025", revenue: 340000, expense: 155000, profit: 185000 },
      ]);
    }
  }, [payments, expenses]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
        Revenue vs Expenses
      </h3>

      {/* Simple chart representation */}
      <div className="mt-4 space-y-6">
        {monthlyData.map((data, index) => (
          <div key={index}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{data.month}</span>
              <span className="text-sm font-medium">
                Profit: KES {data.profit.toLocaleString()}
              </span>
            </div>
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 h-full bg-green-500"
                style={{
                  width: `${
                    (data.revenue /
                      (Math.max(...monthlyData.map((d) => d.revenue)) * 1.2)) *
                    100
                  }%`,
                }}
              ></div>
              <div
                className="absolute left-0 h-full bg-red-500"
                style={{
                  width: `${
                    (data.expense /
                      (Math.max(...monthlyData.map((d) => d.revenue)) * 1.2)) *
                    100
                  }%`,
                  opacity: 0.7,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Revenue: KES {data.revenue.toLocaleString()}</span>
              <span>Expenses: KES {data.expense.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex mt-4 justify-center text-xs">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1 opacity-70"></div>
          <span>Expenses</span>
        </div>
      </div>
    </Card>
  );
};

export default RevenueExpensesChart;
