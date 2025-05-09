// frontend/src/components/payments/PaymentSummaryCards.jsx
import React from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle 
} from 'lucide-react';
import Card from '../ui/Card';

const PaymentSummaryCards = ({ summary }) => {
  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Revenue</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.monthlyTotal)}
            </p>
          </div>
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="mt-2 text-xs">
          <p className="text-gray-500 dark:text-gray-400">Collection Rate: {Math.round(summary.collectionRate)}%</p>
          {summary.lastMonthRevenue > 0 && (
            <div className="flex items-center mt-1">
              {summary.growthRate > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400 mr-1" />
                  <span className="text-green-500 dark:text-green-400">
                    +{Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400 mr-1" />
                  <span className="text-red-500 dark:text-red-400">
                    {Math.round(summary.growthRate)}% vs last month
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending Payments</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.pendingTotal)}
            </p>
          </div>
          <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        {summary.overdueTotal > 0 && (
          <div className="mt-2 flex items-center text-xs text-red-500 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {formatCurrency(summary.overdueTotal)} overdue
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Balance</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.netBalance)}
            </p>
          </div>
          <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Total amount owed
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Critical Accounts</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.criticalAccounts}
            </p>
          </div>
          <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Balance &gt; KES 100,000
        </div>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;