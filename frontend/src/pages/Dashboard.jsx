// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Home,
  Wrench,
  ArrowRight,
} from "lucide-react";
import Card from "../components/ui/Card";
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

        // Fetch real data from API
        const statsData = await dashboardService.getDashboardStats();
        setStats(statsData);

        const activitiesData = await dashboardService.getRecentActivities(5);
        setActivities(activitiesData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
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
      link: "/properties",
    },
    {
      title: "Occupancy Rate",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/properties",
    },
    {
      title: "Units",
      value: `${stats.occupiedUnits}/${stats.totalUnits}`,
      icon: Home,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/properties",
    },
    {
      title: "Tenants",
      value: stats.totalTenants,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      link: "/tenants",
    },
    {
      title: "Monthly Revenue",
      value: `KES ${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      link: "/payments",
    },
    {
      title: "Maintenance",
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/maintenance",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case "lease":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "property":
        return <Building2 className="h-4 w-4 text-indigo-500" />;
      case "tenant":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
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

      {error && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-2 dark:bg-yellow-900/20 dark:text-yellow-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 text-yellow-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Link to={stat.link} key={index}>
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
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
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Link
              to="/reports"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(activity.date)}
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

      {/* Revenue Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Revenue Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This Month
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              KES {stats.monthlyRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Outstanding
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              KES {(stats.pendingRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue YTD
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              KES{" "}
              {(
                stats.yearToDateRevenue || stats.monthlyRevenue * 3
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
