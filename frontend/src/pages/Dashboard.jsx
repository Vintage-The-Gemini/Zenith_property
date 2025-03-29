// frontend/src/pages/Dashboard.jsx (enhanced)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Wrench,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Card from "../components/ui/Card";
import PaymentStats from "../components/dashboard/PaymentStats";
import OccupancyChart from "../components/dashboard/OccupancyChart";
import RevenueExpensesChart from "../components/dashboard/RevenueExpensesChart";
import dashboardService from "../services/dashboardService";
import propertyService from "../services/propertyService";
import unitService from "../services/unitService";
import paymentService from "../services/paymentService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
    yearToDateRevenue: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data for charts
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data in parallel for better performance
        const [
          statsData,
          activitiesData,
          propertiesData,
          unitsData,
          paymentsData,
        ] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getRecentActivities(),
          propertyService.getAllProperties(),
          unitService.getUnits(),
          paymentService.getAllPayments(),
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setProperties(propertiesData);
        setUnits(unitsData);
        setPayments(paymentsData);

        // For now, we'll just use sample expenses data
        setExpenses([]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      {/* Data Visualization Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentStats />
        <OccupancyChart properties={properties} units={units} />
      </div>

      <RevenueExpensesChart payments={payments} expenses={expenses} />

      {/* Recent Activities */}
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Activities
        </h2>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div
                  className={`p-2 rounded-full mr-3 ${
                    activity.type === "payment"
                      ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {activity.type === "payment" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <Wrench className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString()} at{" "}
                    {new Date(activity.date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No recent activities found.</p>
          </div>
        )}
      </Card>

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
    </div>
  );
};

export default Dashboard;
