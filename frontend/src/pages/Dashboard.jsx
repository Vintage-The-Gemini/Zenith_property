// frontend/src/pages/Dashboard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Wrench,
  Plus,
} from "lucide-react";
import Card from "../components/ui/Card";

const Dashboard = () => {
  // In a real app, these would be fetched from the API
  const stats = {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/properties">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Properties
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProperties}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Occupancy Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.occupancyRate}%
              </p>
            </div>
          </div>
        </Card>

        <Link to="/tenants">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mr-4">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tenants
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTenants}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/payments">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  KES {stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/maintenance">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full mr-4">
                <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maintenance
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingMaintenance}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/properties">
            <button className="w-full py-3 px-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 mr-2" />
              <span>Add Property</span>
            </button>
          </Link>
          <Link to="/tenants">
            <button className="w-full py-3 px-4 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 mr-2" />
              <span>Add Tenant</span>
            </button>
          </Link>
          <Link to="/payments">
            <button className="w-full py-3 px-4 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 mr-2" />
              <span>Record Payment</span>
            </button>
          </Link>
          <Link to="/maintenance">
            <button className="w-full py-3 px-4 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 mr-2" />
              <span>Maintenance</span>
            </button>
          </Link>
        </div>
      </Card>

      {/* Get Started */}
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welcome to PropertyManager
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by adding your first property
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
