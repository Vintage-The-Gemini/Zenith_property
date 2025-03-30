// frontend/src/components/reports/LeaseExpirationReport.jsx
import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import Card from "../ui/Card";
import reportService from "../../services/reportService";

const LeaseExpirationReport = ({ filters, onError }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaseExpirationReport();
  }, [filters]);

  const fetchLeaseExpirationReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getLeaseExpirationReport(filters);
      setReportData(data);
    } catch (err) {
      console.error("Error fetching lease expiration report:", err);
      if (onError)
        onError("Failed to load lease expiration report. Please try again.");
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
        <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No lease expiration data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Lease Expiration Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Leases
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {reportData.summary.totalLeases}
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400">
              Expired
            </h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {reportData.summary.expired}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-500 dark:text-yellow-400">
              Critical (&lt; 30 days)
            </h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {reportData.summary.critical}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-orange-500 dark:text-orange-400">
              Warning (&lt; 90 days)
            </h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {reportData.summary.warning}
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-500 dark:text-green-400">
              Good
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {reportData.summary.good}
            </p>
          </div>
        </div>
      </Card>

      {/* Lease Expirations Table */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Upcoming Lease Expirations</h3>

        {reportData.leases && reportData.leases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Tenant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Property
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Unit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Lease Start
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Lease End
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Days Remaining
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.leases.map((lease, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {lease.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {lease.propertyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {lease.unitNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(lease.leaseStartDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(lease.leaseEndDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lease.daysRemaining <= 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : lease.daysRemaining <= 30
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : lease.daysRemaining <= 90
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        }`}
                      >
                        {lease.daysRemaining <= 0
                          ? "Expired"
                          : `${lease.daysRemaining} days`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No lease expiration data available
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LeaseExpirationReport;
