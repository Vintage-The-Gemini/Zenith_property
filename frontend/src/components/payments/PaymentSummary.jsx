// frontend/src/components/payments/PaymentSummary.jsx
import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Card from "../ui/Card";

const PaymentSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <Card className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {summary.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm">
          {summary.currentMonthRevenue > summary.lastMonthRevenue ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">
                {summary.lastMonthRevenue > 0
                  ? `+${Math.round(
                      ((summary.currentMonthRevenue -
                        summary.lastMonthRevenue) /
                        summary.lastMonthRevenue) *
                        100
                    )}%`
                  : "+100%"}
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500">
                {summary.lastMonthRevenue > 0
                  ? `-${Math.round(
                      ((summary.lastMonthRevenue -
                        summary.currentMonthRevenue) /
                        summary.lastMonthRevenue) *
                        100
                    )}%`
                  : "0%"}
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </>
          )}
        </div>
      </Card>

      {/* Expenses */}
      <Card className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {summary.totalExpenses?.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          From all expense categories
        </div>
      </Card>

      {/* Net Income */}
      <Card className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Net Income</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {summary.netIncome?.toLocaleString() || 0}
            </p>
          </div>
          <div
            className={`h-12 w-12 rounded-full ${
              summary.netIncome >= 0 ? "bg-blue-100" : "bg-yellow-100"
            } flex items-center justify-center`}
          >
            {summary.netIncome >= 0 ? (
              <TrendingUp className="h-6 w-6 text-blue-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            )}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">Revenue minus expenses</div>
      </Card>

      {/* Pending Payments */}
      <Card className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending Payments</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {summary.pendingRevenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        {summary.overduePayments > 0 && (
          <div className="mt-2 flex items-center text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-500">
              KES {summary.overduePayments?.toLocaleString() || 0} overdue
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentSummary;
