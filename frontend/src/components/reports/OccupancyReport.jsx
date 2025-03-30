// src/components/reports/OccupancyReport.jsx
import { useState, useEffect } from "react";
import { Building2, Calendar, Clock } from "lucide-react";
import Card from "../ui/Card";
import reportService from "../../services/reportService";

const OccupancyReport = ({ filters, onError }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOccupancyReport();
  }, [filters]);

  const fetchOccupancyReport = async () => {
    try {
      setLoading(true);

      // Filter parameters (propertyId)
      const params = { ...filters };

      const data = await reportService.getOccupancyReport(params);
      setReportData(data);
    } catch (err) {
      console.error("Error fetching occupancy report:", err);
      if (onError)
        onError("Failed to load occupancy report. Please try again.");
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
        <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No occupancy data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Occupancy Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Occupancy Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Units
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {reportData.summary.totalUnits}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Occupied Units
            </h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {reportData.summary.occupiedUnits}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Occupancy Rate
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {reportData.summary.occupancyRate}%
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-4 bg-blue-500 dark:bg-blue-600 rounded-full"
              style={{ width: `${reportData.summary.occupancyRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Occupied: {reportData.summary.occupiedUnits}</span>
            <span>Total: {reportData.summary.totalUnits}</span>
          </div>
        </div>
      </Card>

      {/* Occupancy by Property */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Occupancy by Property</h3>

        {reportData.occupancyByProperty &&
        reportData.occupancyByProperty.length > 0 ? (
          <div className="space-y-4">
            {reportData.occupancyByProperty.map((property, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{property.name}</span>
                  <span className="text-sm font-medium">{property.rate}%</span>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-blue-500 dark:bg-blue-600 h-full"
                      style={{
                        width: `${(property.occupied / property.total) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="bg-yellow-500 dark:bg-yellow-600 h-full"
                      style={{
                        width: `${
                          (property.maintenance / property.total) * 100
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-green-500 dark:bg-green-600 h-full"
                      style={{
                        width: `${
                          (property.available / property.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Occupied: {property.occupied}</span>
                  <span>Maintenance: {property.maintenance}</span>
                  <span>Available: {property.available}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No occupancy data available for the selected period
            </p>
          </div>
        )}

        <div className="flex mt-4 justify-center text-xs">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600 rounded-full mr-1"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full mr-1"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-full mr-1"></div>
            <span>Available</span>
          </div>
        </div>
      </Card>

      {/* Lease Expiration */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Lease Expiration</h3>

        {reportData.leaseExpirations &&
        reportData.leaseExpirations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lease Start
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lease End
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Days Remaining
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.leaseExpirations.map((lease, index) => (
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
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No lease data available
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OccupancyReport;
