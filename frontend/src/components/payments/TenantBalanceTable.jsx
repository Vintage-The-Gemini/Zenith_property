// frontend/src/components/payments/TenantBalanceTable.jsx
import React from 'react';
import { CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';

const TenantBalanceTable = ({ tenants, formatCurrency }) => {
  const getBalanceIndicator = (balance) => {
    if (balance < 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" title="Credit balance" />;
    } else if (balance > 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" title="Outstanding balance" />;
    }
    return <CheckCircle className="w-4 h-4 text-gray-400" title="Balanced" />;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Tenant Current Balances</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tenant Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Current Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Monthly Rent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants
              .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
              .map((tenant) => (
                <tr key={tenant._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {tenant.firstName} {tenant.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Unit {tenant.unitId?.unitNumber || 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        tenant.currentBalance < 0
                          ? "text-green-600 dark:text-green-400"
                          : tenant.currentBalance > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {formatCurrency(Math.abs(tenant.currentBalance || 0))}
                      </span>
                      {getBalanceIndicator(tenant.currentBalance)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tenant.currentBalance > 100000
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        : tenant.currentBalance > 0
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : tenant.currentBalance < 0
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                    }`}>
                      {tenant.currentBalance > 100000
                        ? "Critical"
                        : tenant.currentBalance > 0
                        ? "Outstanding"
                        : tenant.currentBalance < 0
                        ? "Credit"
                        : "Balanced"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(tenant.leaseDetails?.rentAmount || 0)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TenantBalanceTable;