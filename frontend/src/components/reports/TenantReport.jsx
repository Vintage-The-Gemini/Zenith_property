// src/components/reports/TenantReport.jsx
import { useState, useEffect } from "react";
import { Users, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";
import Card from "../ui/Card";
import reportService from "../../services/reportService";

const TenantReport = ({ dateRange, filters, onError }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantReport();
  }, [dateRange, filters]);

  const fetchTenantReport = async () => {
    try {
      setLoading(true);

      // Prepare filter parameters
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...filters,
      };

      const data = await reportService.getTenantPaymentReport(params);
      setReportData(data);
    } catch (err) {
      console.error("Error fetching tenant report:", err);
      if (onError) onError("Failed to load tenant report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No tenant data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Tenant Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Tenants
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {reportData.summary.totalTenants}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Tenants
            </h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {reportData.summary.activeTenants}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              On-Time Payment Rate
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {reportData.summary.onTimeRate}%
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Timeliness */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Payment Timeliness</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              On-Time Payments
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {reportData.summary.onTimePayments}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Late Payments
            </h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              {reportData.summary.latePayments}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-4 bg-green-500 dark:bg-green-600 rounded-full"
              style={{ width: `${reportData.summary.onTimeRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>On-Time: {reportData.summary.onTimePayments}</span>
            <span>
              Total:{" "}
              {reportData.summary.onTimePayments +
                reportData.summary.latePayments}
            </span>
          </div>
        </div>
      </Card>

      {/* Tenant Payment Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Tenant Payment Performance</h3>

        {reportData.tenantPayments && reportData.tenantPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.tenantPayments.map((tenant, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {tenant.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {tenant.property}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      KES {tenant.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {tenant.lastPaymentDate
                        ? new Date(tenant.lastPaymentDate).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.balance > 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : tenant.balance < 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                        }`}
                      >
                        KES {Math.abs(tenant.balance).toLocaleString()}
                        {tenant.balance > 0
                          ? " Owing"
                          : tenant.balance < 0
                          ? " Credit"
                          : " Balanced"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No tenant payment data available for the selected period
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TenantReport;
