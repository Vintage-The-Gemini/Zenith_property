// frontend/src/components/payments/PaymentBalanceSummary.jsx

import React from 'react';
import Card from '../ui/Card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const PaymentBalanceSummary = ({ payments = [], title = "Payment Summary" }) => {
  // Calculate totals and balances
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const totalDue = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const totalOverdue = payments
    .filter(p => p.status === 'pending' && new Date(p.dueDate) < new Date())
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const totalUnderpaid = payments
    .filter(p => p.paymentVariance < 0)
    .reduce((sum, p) => sum + Math.abs(p.paymentVariance || 0), 0);
    
  const totalOverpaid = payments
    .filter(p => p.paymentVariance > 0)
    .reduce((sum, p) => sum + (p.paymentVariance || 0), 0);
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Paid
          </h4>
          <div className="flex items-center mt-2">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              KES {totalPaid.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Due
          </h4>
          <div className="flex items-center mt-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              KES {totalDue.toLocaleString()}
            </p>
          </div>
          {totalOverdue > 0 && (
            <p className="mt-1 text-xs text-red-500">
              KES {totalOverdue.toLocaleString()} overdue
            </p>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Balance Status
          </h4>
          <div className="flex flex-col mt-2">
            {totalUnderpaid > 0 && (
              <div className="flex items-center mb-1">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">
                  KES {totalUnderpaid.toLocaleString()} underpaid
                </p>
              </div>
            )}
            {totalOverpaid > 0 && (
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-600">
                  KES {totalOverpaid.toLocaleString()} overpaid
                </p>
              </div>
            )}
            {totalUnderpaid === 0 && totalOverpaid === 0 && (
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                <p className="text-sm text-blue-600">Balanced</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Status Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-2">Payment Status Breakdown</h4>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${totalPaid / (totalPaid + totalDue) * 100}%` }}
            ></div>
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${(totalDue - totalOverdue) / (totalPaid + totalDue) * 100}%` }}
            ></div>
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${totalOverdue / (totalPaid + totalDue) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            <span>Paid</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentBalanceSummary;