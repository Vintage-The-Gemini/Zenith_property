// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import dashboardService from "../services/dashboardService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use mock data in development mode
        const mockData = {
          totalProperties: 15,
          totalUnits: 120,
          occupiedUnits: 102,
          occupancyRate: 85,
          totalTenants: 98,
          monthlyRevenue: 52500,
          pendingMaintenance: 8,
        };

        setStats(mockData);

        // Get mock activities
        const mockActivities = [
          {
            id: 1,
            type: "payment",
            title: "Rent Payment Received",
            description: "John Doe paid $1,200 for Unit 101",
            date: new Date(),
          },
          {
            id: 2,
            type: "maintenance",
            title: "Maintenance Request",
            description: "Plumbing issue reported in Unit 204",
            date: new Date(Date.now() - 86400000),
          },
          {
            id: 3,
            type: "lease",
            title: "Lease Signed",
            description: "New tenant for Unit 305",
            date: new Date(Date.now() - 172800000),
          },
        ];

        setActivities(mockActivities);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Using fallback data.");

        // Set fallback data
        setStats({
          totalProperties: 0,
          totalUnits: 0,
          occupiedUnits: 0,
          occupancyRate: 0,
          totalTenants: 0,
          monthlyRevenue: 0,
          pendingMaintenance: 0,
        });

        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Properties",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Occupancy Rate",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Tenants",
      value: stats.totalTenants,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Property management overview
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-2 dark:bg-yellow-900/20 dark:text-yellow-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div
                className={`p-3 ${stat.bgColor} dark:bg-opacity-20 rounded-full mr-4`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent activity
            </p>
          )}
        </div>
      </div>

      {/* Properties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Properties Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Properties
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalProperties}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Units
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalUnits}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Occupied Units
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.occupiedUnits}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Payment Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monthly Revenue
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Outstanding Payments
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  $0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
