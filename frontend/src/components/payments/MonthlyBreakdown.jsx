// frontend/src/components/properties/payments/MonthlyBreakdown.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import Card from "../ui/Card";

const MonthlyBreakdown = ({ monthlyData = [] }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <Card className="p-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <h3 className="text-lg font-medium">Monthly Payment Breakdown</h3>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            showBreakdown ? "rotate-180" : ""
          }`}
        />
      </div>

      {showBreakdown && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Month
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Completed
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pending
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Overdue
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.length > 0 ? (
                monthlyData.map((month, index) => (
                  <tr
                    key={month.monthKey}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      KES {month.completed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      KES {month.pending.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      KES {month.overdue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {month.totalPayments}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No monthly data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default MonthlyBreakdown;
