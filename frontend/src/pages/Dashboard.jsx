import React from "react";
import { Building2, Users, CreditCard, TrendingUp } from "lucide-react";

const Dashboard = () => {
  // Mock data
  const stats = {
    totalProperties: 15,
    totalUnits: 120,
    occupiedUnits: 102,
    occupancyRate: 85,
    totalTenants: 98,
    monthlyRevenue: 52500,
    pendingMaintenance: 8,
  };

  const statCards = [
    {
      title: "Properties",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      increase: "+2.3%",
    },
    {
      title: "Occupancy Rate",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      increase: "+1.5%",
    },
    {
      title: "Tenants",
      value: stats.totalTenants,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      increase: "+3.2%",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      increase: "+4.1%",
    },
  ];

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
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stat.increase} from last month
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
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Recent activity will be displayed here
          </p>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Properties Overview
          </h2>
          <div className="space-y-4">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Property overview will be displayed here
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Payment Summary
          </h2>
          <div className="space-y-4">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Payment summary will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
