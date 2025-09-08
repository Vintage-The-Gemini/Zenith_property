// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { 
  Building2, 
  Home, 
  Users, 
  Banknote,
  Loader2,
  AlertCircle
} from "lucide-react";
import Card from "../components/ui/Card";
import dashboardService from "../services/dashboardService";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalProperties: 0,
    totalUnits: 0,
    totalTenants: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    outstandingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={loadSummary}
            className="ml-2 text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Property management overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalProperties}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Units</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalUnits}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.occupiedUnits} occupied
              </p>
            </div>
            <Home className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tenants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalTenants}
              </p>
            </div>
            <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.monthlyRevenue)}
              </p>
            </div>
            <Banknote className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.netIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.outstandingPayments)}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy Rate</p>
            <p className="text-xl font-bold">{summary.occupancyRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Available Units</p>
            <p className="text-xl font-bold">{summary.availableUnits}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Occupied Units</p>
            <p className="text-xl font-bold">{summary.occupiedUnits}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;