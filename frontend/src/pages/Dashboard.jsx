// frontend/src/pages/Dashboard.jsx
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
  Clock,
  DollarSign,
  ChevronRight,
  ArrowRight,
  Home,
  AlertTriangle,
} from "lucide-react";
import Card from "../components/ui/Card";
import PaymentStats from "../components/dashboard/PaymentStats";
import OccupancyChart from "../components/dashboard/OccupancyChart";
import RevenueExpensesChart from "../components/dashboard/RevenueExpensesChart";
import PaymentTrends from "../components/dashboard/PaymentTrends";
import dashboardService from "../services/dashboardService";
import propertyService from "../services/propertyService";
import unitService from "../services/unitService";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import expenseService from "../services/expenseService";

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
  const [dataLoaded, setDataLoaded] = useState(false);

  // Data for charts
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tenants, setTenants] = useState([]);

  // Loading states for individual data types
  const [statsLoading, setStatsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Check if all data is loaded
    if (
      !statsLoading &&
      !activitiesLoading &&
      !propertiesLoading &&
      !unitsLoading &&
      !paymentsLoading &&
      !expensesLoading &&
      !tenantsLoading
    ) {
      setLoading(false);
      setDataLoaded(true);
    }
  }, [
    statsLoading,
    activitiesLoading,
    propertiesLoading,
    unitsLoading,
    paymentsLoading,
    expensesLoading,
    tenantsLoading,
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      fetchStats();

      // Fetch recent activities
      fetchActivities();

      // Fetch properties
      fetchProperties();

      // Fetch units
      fetchUnits();

      // Fetch payments
      fetchPayments();

      // Fetch expenses
      fetchExpenses();

      // Fetch tenants
      fetchTenants();
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await dashboardService.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const activitiesData = await dashboardService.getRecentActivities();
      setActivities(activitiesData);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      const propertiesData = await propertyService.getAllProperties();
      setProperties(propertiesData);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      setUnitsLoading(true);
      const unitsData = await unitService.getUnits();
      setUnits(unitsData);
    } catch (err) {
      console.error("Error fetching units:", err);
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const paymentsData = await paymentService.getAllPayments();
      setPayments(paymentsData);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      const expensesData = await expenseService.getAllExpenses();
      setExpenses(expensesData);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setExpensesLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      const tenantsData = await tenantService.getAllTenants();
      setTenants(tenantsData);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    } finally {
      setTenantsLoading(false);
    }
  };

  // Function to format date in relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
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
          <button
            onClick={fetchDashboardData}
            className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/40 rounded-md text-red-700 dark:text-red-300 text-sm hover:bg-red-200 dark:hover:bg-red-900/60"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/properties" className="group">
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
                  {statsLoading ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                  ) : (
                    stats.totalProperties
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
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
                {statsLoading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                ) : (
                  `${stats.occupancyRate}%`
                )}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-2 bg-green-500 dark:bg-green-600 rounded-full"
                style={{ width: `${stats.occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Link to="/tenants" className="group">
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
                  {statsLoading ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                  ) : (
                    stats.totalTenants
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/payments" className="group">
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
                  {statsLoading ? (
                    <span className="inline-block w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                  ) : (
                    `KES ${stats.monthlyRevenue.toLocaleString()}`
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
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

      {/* Payment Trends Component */}
      <PaymentTrends />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activities
            </h2>
            <Link
              to="/reports"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse flex items-start p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      activity.type === "payment"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : activity.type === "maintenance"
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : activity.type === "tenancy"
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        : "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {activity.type === "payment" ? (
                      <DollarSign className="h-4 w-4" />
                    ) : activity.type === "maintenance" ? (
                      <Wrench className="h-4 w-4" />
                    ) : activity.type === "tenancy" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatRelativeTime(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent activities found
              </p>
            </div>
          )}
        </Card>

        {/* Maintenance/Issues Card */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Pending Maintenance
            </h2>
            <Link
              to="/maintenance"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse flex items-start p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats.pendingMaintenance > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mr-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      {stats.pendingMaintenance}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      pending issues
                    </p>
                  </div>
                </div>
                <Link
                  to="/maintenance"
                  className="px-3 py-1.5 text-xs bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                >
                  View All Issues
                </Link>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maintenance issues require attention within 24-48 hours.
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Wrench className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No pending maintenance issues
              </p>
              <Link
                to="/maintenance"
                className="mt-3 inline-flex items-center px-4 py-2 text-sm bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Request
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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

      {/* Recently Added Units */}
      {!unitsLoading && units.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recently Added Units
            </h2>
            <Link
              to="/properties"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {units
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3)
              .map((unit) => (
                <div
                  key={unit._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Unit {unit.unitNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unit.propertyId?.name || "Property"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        unit.status === "available"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : unit.status === "occupied"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          : unit.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {unit.status?.charAt(0).toUpperCase() +
                        unit.status?.slice(1) || "Available"}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Rent:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        KES {(unit.monthlyRent || 0).toLocaleString()}
                      </span>
                    </div>
                    {!unit.propertyId?.propertyType?.includes("commercial") && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500 dark:text-gray-400">
                          Type:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {unit.bedrooms || 0} bed, {unit.bathrooms || 0} bath
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
