// frontend/src/components/payments/PaymentTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Plus, CheckCircle, Clock, XCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';

const PaymentTable = ({ 
  payments, 
  filteredPayments, 
  formatDate, 
  formatCurrency, 
  handleUpdateStatus,
  handleAddPayment 
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "partial":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <DollarSign className="w-3 h-3 mr-1" />
            Partial
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getBalanceIndicator = (balance) => {
    if (balance < 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" title="Credit balance" />;
    } else if (balance > 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" title="Outstanding balance" />;
    }
    return <CheckCircle className="w-4 h-4 text-gray-400" title="Balanced" />;
  };
  
  if (payments.length === 0) {
    return (
      <Card className="text-center py-12">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No payments found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by recording your first payment
        </p>
        <div className="mt-6">
          <button
            onClick={handleAddPayment}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Payment
          </button>
        </div>
      </Card>
    );
  }
  
  if (filteredPayments.length === 0) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          No matching payments
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search or filter criteria
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tenant
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Previous Balance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount Due
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount Paid
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Variance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              New Balance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPayments.map((payment) => (
            <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                {formatDate(payment.paymentDate)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                {payment.tenant
                  ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                  : "Unknown"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatCurrency(payment.previousBalance)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {formatCurrency(payment.amountDue)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {formatCurrency(payment.amountPaid)}
              </td>
              <td className={`px-4 py-3 text-sm font-medium ${
                payment.paymentVariance > 0
                  ? "text-green-600 dark:text-green-400"
                  : payment.paymentVariance < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {payment.paymentVariance > 0 ? "+" : ""}
                {formatCurrency(Math.abs(payment.paymentVariance || 0))}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${
                    payment.newBalance < 0
                      ? "text-green-600 dark:text-green-400"
                      : payment.newBalance > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {formatCurrency(Math.abs(payment.newBalance || 0))}
                  </span>
                  {getBalanceIndicator(payment.newBalance)}
                </div>
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(payment.status)}
              </td>
              <td className="px-4 py-3 text-sm">
                <Link
                  to={`/payments/${payment._id}`}
                  className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                >
                  View
                </Link>
                {payment.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus(payment._id, "completed")}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Mark Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;