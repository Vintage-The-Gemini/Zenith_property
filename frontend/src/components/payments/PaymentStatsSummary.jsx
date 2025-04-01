// frontend/src/components/properties/payments/PaymentStatsSummary.jsx
import React from "react";
import {
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import Card from "../ui/Card";

const PaymentStatsSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
            <p className="text-xl font-bold">
              KES {summary.monthlyTotal.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
        {summary.lastMonthRevenue > 0 && (
          <div className="mt-2 flex items-center text-xs">
            {summary.growthRate > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">
                  +{Math.round(summary.growthRate)}% vs last month
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-500">
                  {Math.round(summary.growthRate)}% vs last month
                </span>
              </>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Pending Payments</h4>
            <p className="text-xl font-bold">
              KES {summary.pendingTotal.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        {summary.overdueTotal > 0 && (
          <div className="mt-2 flex items-center text-xs text-red-500">
            <AlertTriangle className="w-4 h-4 mr-1" />
            KES {summary.overdueTotal.toLocaleString()} overdue
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Payment Variance</h4>
            <p className="text-xl font-bold">
              KES {summary.varianceTotal.toLocaleString()}
            </p>
          </div>
          <div
            className={`h-10 w-10 ${
              summary.varianceTotal >= 0 ? "bg-blue-100" : "bg-red-100"
            } rounded-full flex items-center justify-center`}
          >
            {summary.varianceTotal >= 0 ? (
              <TrendingUp className="h-6 w-6 text-blue-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {summary.varianceTotal >= 0
            ? "Overpayment balance (credit)"
            : "Underpayment balance (due)"}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Net Balance</h4>
            <p
              className={`text-xl font-bold ${
                summary.netBalanceTotal >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              KES {Math.abs(summary.netBalanceTotal).toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-gray-600" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {summary.netBalanceTotal > 0
            ? "Credit balance"
            : summary.netBalanceTotal < 0
            ? "Outstanding balance"
            : "Balanced"}
        </div>
      </Card>
    </div>
  );
};

export default PaymentStatsSummary;
