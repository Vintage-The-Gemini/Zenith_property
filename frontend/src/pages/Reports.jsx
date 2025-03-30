// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import {
  BarChart2,
  Filter,
  Download,
  Calendar,
  Building2,
  Users,
  Home,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Card from "../components/ui/Card";
import propertyService from "../services/propertyService";
import tenantService from "../services/tenantService";
import unitService from "../services/unitService";
import paymentService from "../services/paymentService";

const Reports = () => {
  // State variables
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("financial");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    propertyId: "",
    period: "monthly",
  });

  // Load all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch filtered data when filters change
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchFilteredData();
    }
  }, [dateRange, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch data in parallel
      const [propertiesData, unitsData, tenantsData, paymentsData] =
        await Promise.all([
          propertyService.getAllProperties(),
          unitService.getUnits(),
          tenantService.getAllTenants(),
          paymentService.getAllPayments(),
        ]);

      setProperties(propertiesData);
      setUnits(unitsData);
      setTenants(tenantsData);
      setPayments(paymentsData);

      // Set expenses to empty array for now
      setExpenses([]);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
      setLoading(false);
    }
  };

  const fetchFilteredData = async () => {
    try {
      setLoading(true);

      // Create filter params
      const paymentFilters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      if (filters.propertyId) {
        paymentFilters.propertyId = filters.propertyId;
      }

      // Fetch filtered payments
      const filteredPayments = await paymentService.getAllPayments(
        paymentFilters
      );
      setPayments(filteredPayments);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setError("Failed to apply filters. Please try again.");
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      propertyId: "",
      period: "monthly",
    });
    setDateRange({
      startDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      )
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
  };

  // Calculate report metrics
  const calculateMetrics = () => {
    // Filter payments by date range
    const filteredPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        paymentDate >= new Date(dateRange.startDate) &&
        paymentDate <= new Date(dateRange.endDate)
      );
    });

    // Calculate total revenue (completed payments)
    const totalRevenue = filteredPayments
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Calculate pending revenue
    const pendingRevenue = filteredPayments
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Calculate total expenses
    const totalExpenses = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate >= new Date(dateRange.startDate) &&
          expenseDate <= new Date(dateRange.endDate)
        );
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate total profit
    const totalProfit = totalRevenue - totalExpenses;

    // Calculate occupancy rate
    const occupiedUnits = units.filter(
      (unit) => unit.status === "occupied"
    ).length;
    const occupancyRate =
      units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

    return {
      totalRevenue,
      pendingRevenue,
      totalExpenses,
      totalProfit,
      occupancyRate,
      activeLeases: tenants.filter((tenant) => tenant.status === "active")
        .length,
    };
  };

  // Group payments by month for revenue chart
  const getMonthlyRevenue = () => {
    const monthlyData = {};

    payments.forEach((payment) => {
      if (payment.status !== "completed") return;

      const paymentDate = new Date(payment.paymentDate);
      const monthYear = `${paymentDate.getFullYear()}-${
        paymentDate.getMonth() + 1
      }`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth(),
            1
          ).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: 0,
          expenses: 0,
        };
      }

      monthlyData[monthYear].revenue += payment.amount || 0;
    });

    // Add expenses data (if available)
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthYear = `${expenseDate.getFullYear()}-${
        expenseDate.getMonth() + 1
      }`;

      if (monthlyData[monthYear]) {
        monthlyData[monthYear].expenses += expense.amount || 0;
      }
    });

    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA - dateB;
    });
  };

  // Get unit occupancy distribution
  const getOccupancyByProperty = () => {
    const propertyOccupancy = {};

    properties.forEach((property) => {
      propertyOccupancy[property._id] = {
        name: property.name,
        total: 0,
        occupied: 0,
        available: 0,
        maintenance: 0,
      };
    });

    units.forEach((unit) => {
      if (!propertyOccupancy[unit.propertyId?._id || unit.propertyId]) return;

      propertyOccupancy[unit.propertyId?._id || unit.propertyId].total += 1;

      if (unit.status === "occupied") {
        propertyOccupancy[
          unit.propertyId?._id || unit.propertyId
        ].occupied += 1;
      } else if (unit.status === "available") {
        propertyOccupancy[
          unit.propertyId?._id || unit.propertyId
        ].available += 1;
      } else if (unit.status === "maintenance") {
        propertyOccupancy[
          unit.propertyId?._id || unit.propertyId
        ].maintenance += 1;
      }
    });

    return Object.values(propertyOccupancy).filter((p) => p.total > 0);
  };

  // Group payments by property
  const getRevenueByProperty = () => {
    const propertyRevenue = {};

    properties.forEach((property) => {
      propertyRevenue[property._id] = {
        name: property.name,
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
    });

    payments.forEach((payment) => {
      if (payment.status !== "completed") return;
      if (!propertyRevenue[payment.property?._id || payment.property]) return;

      propertyRevenue[payment.property?._id || payment.property].revenue +=
        payment.amount || 0;
    });

    // Add expenses and calculate profit
    expenses.forEach((expense) => {
      if (!propertyRevenue[expense.property?._id || expense.property]) return;

      propertyRevenue[expense.property?._id || expense.property].expenses +=
        expense.amount || 0;
    });

    // Calculate profit
    Object.keys(propertyRevenue).forEach((propId) => {
      propertyRevenue[propId].profit =
        propertyRevenue[propId].revenue - propertyRevenue[propId].expenses;
    });

    return Object.values(propertyRevenue).filter(
      (p) => p.revenue > 0 || p.expenses > 0
    );
  };

  // Get tenant payment history
  const getTenantPaymentData = () => {
    const tenantPayments = {};

    tenants.forEach((tenant) => {
      tenantPayments[tenant._id] = {
        name: `${tenant.firstName} ${tenant.lastName}`,
        unit: tenant.unitId?.unitNumber || "Unknown",
        property: tenant.propertyId?.name || "Unknown",
        totalPaid: 0,
        lastPayment: null,
        balance: tenant.currentBalance || 0,
      };
    });

    payments.forEach((payment) => {
      if (payment.status !== "completed") return;
      if (!tenantPayments[payment.tenant?._id || payment.tenant]) return;

      tenantPayments[payment.tenant?._id || payment.tenant].totalPaid +=
        payment.amount || 0;

      // Track last payment date
      const paymentDate = new Date(payment.paymentDate);
      if (
        !tenantPayments[payment.tenant?._id || payment.tenant].lastPayment ||
        paymentDate >
          new Date(
            tenantPayments[payment.tenant?._id || payment.tenant].lastPayment
          )
      ) {
        tenantPayments[payment.tenant?._id || payment.tenant].lastPayment =
          payment.paymentDate;
      }
    });

    return Object.values(tenantPayments).filter((t) => t.totalPaid > 0);
  };

  // Calculate metrics
  const metrics = calculateMetrics();
  const monthlyRevenueData = getMonthlyRevenue();
  const occupancyData = getOccupancyByProperty();
  const propertyRevenueData = getRevenueByProperty();
  const tenantPaymentData = getTenantPaymentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and analyze property performance metrics
          </p>
        </div>
        <button
          onClick={() =>
            alert("CSV export functionality will be implemented soon")
          }
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-5 w-5 mr-2" />
          Export
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-2 text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <span className="text-gray-500">to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property
            </label>
            <select
              name="propertyId"
              value={filters.propertyId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period
            </label>
            <select
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("financial")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "financial"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab("occupancy")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "occupancy"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <Home className="h-5 w-5 mr-2" />
            Occupancy Reports
          </button>
          <button
            onClick={() => setActiveTab("tenant")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "tenant"
                ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-400"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Tenant Reports
          </button>
        </nav>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {metrics.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {metrics.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Net Profit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {metrics.totalProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          {/* Revenue vs Expenses Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Revenue vs Expenses</h3>

            {monthlyRevenueData.length > 0 ? (
              <div className="space-y-4">
                {monthlyRevenueData.map((data, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{data.month}</span>
                      <span className="text-sm font-medium">
                        Profit: KES{" "}
                        {(data.revenue - data.expenses).toLocaleString()}
                      </span>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 h-full bg-green-500 dark:bg-green-600"
                        style={{
                          width: `${
                            (data.revenue /
                              Math.max(
                                ...monthlyRevenueData.map((d) => d.revenue)
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="absolute left-0 h-full bg-red-500 dark:bg-red-600 opacity-70"
                        style={{
                          width: `${
                            (data.expenses /
                              Math.max(
                                ...monthlyRevenueData.map((d) => d.revenue)
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Revenue: KES {data.revenue.toLocaleString()}</span>
                      <span>
                        Expenses: KES {data.expenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No financial data available for the selected period
                </p>
              </div>
            )}

            <div className="flex mt-4 justify-center text-xs">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-full mr-1"></div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded-full mr-1 opacity-70"></div>
                <span>Expenses</span>
              </div>
            </div>
          </Card>

          {/* Revenue by Property */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Revenue by Property</h3>

            {propertyRevenueData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
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
                        Revenue
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Expenses
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Profit
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Profit Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {propertyRevenueData.map((property, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {property.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          KES {property.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          KES {property.expenses.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          KES {property.profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {property.revenue > 0
                            ? `${Math.round(
                                (property.profit / property.revenue) * 100
                              )}%`
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No property revenue data available for the selected period
                </p>
              </div>
            )}
          </Card>

          {/* Payment Status Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment Status Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Collected
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  KES {metrics.totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending
                </h4>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  KES {metrics.pendingRevenue.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Collection Rate
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {metrics.totalRevenue + metrics.pendingRevenue > 0
                    ? `${Math.round(
                        (metrics.totalRevenue /
                          (metrics.totalRevenue + metrics.pendingRevenue)) *
                          100
                      )}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-4 bg-green-500 dark:bg-green-600 rounded-full"
                  style={{
                    width: `${
                      metrics.totalRevenue + metrics.pendingRevenue > 0
                        ? (metrics.totalRevenue /
                            (metrics.totalRevenue + metrics.pendingRevenue)) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>
                  Collected: KES {metrics.totalRevenue.toLocaleString()}
                </span>
                <span>
                  Total Expected: KES{" "}
                  {(
                    metrics.totalRevenue + metrics.pendingRevenue
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "occupancy" && (
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
                  {units.length}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Occupied Units
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {units.filter((unit) => unit.status === "occupied").length}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Occupancy Rate
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {metrics.occupancyRate}%
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-4 bg-blue-500 dark:bg-blue-600 rounded-full"
                  style={{ width: `${metrics.occupancyRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>
                  Occupied:{" "}
                  {units.filter((unit) => unit.status === "occupied").length}
                </span>
                <span>Total: {units.length}</span>
              </div>
            </div>
          </Card>

          {/* Occupancy by Property */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Occupancy by Property</h3>

            {occupancyData.length > 0 ? (
              <div className="space-y-4">
                {occupancyData.map((property, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {property.name}
                      </span>
                      <span className="text-sm font-medium">
                        {property.total > 0
                          ? `${Math.round(
                              (property.occupied / property.total) * 100
                            )}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div
                          className="bg-blue-500 dark:bg-blue-600 h-full"
                          style={{
                            width: `${
                              (property.occupied / property.total) * 100
                            }%`,
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

            {tenants.filter(
              (tenant) =>
                tenant.status === "active" && tenant.leaseDetails?.endDate
            ).length > 0 ? (
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
                    {tenants
                      .filter(
                        (tenant) =>
                          tenant.status === "active" &&
                          tenant.leaseDetails?.endDate
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.leaseDetails.endDate) -
                          new Date(b.leaseDetails.endDate)
                      )
                      .map((tenant, index) => {
                        const endDate = new Date(tenant.leaseDetails.endDate);
                        const today = new Date();
                        const daysRemaining = Math.ceil(
                          (endDate - today) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {tenant.firstName} {tenant.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {tenant.propertyId?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {tenant.unitId?.unitNumber || "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {new Date(
                                tenant.leaseDetails.startDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {new Date(
                                tenant.leaseDetails.endDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  daysRemaining <= 30
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : daysRemaining <= 90
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                }`}
                              >
                                {daysRemaining <= 0
                                  ? "Expired"
                                  : `${daysRemaining} days`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
      )}

      {activeTab === "tenant" && (
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
                  {tenants.length}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Tenants
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {
                    tenants.filter((tenant) => tenant.status === "active")
                      .length
                  }
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Leases
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {metrics.activeLeases}
                </p>
              </div>
            </div>
          </Card>

          {/* Tenant Payment Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Tenant Payment Performance
            </h3>

            {tenantPaymentData.length > 0 ? (
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
                        Unit
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
                        Total Paid
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Last Payment
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Current Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {tenantPaymentData.map((tenant, index) => (
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
                          {tenant.lastPayment
                            ? new Date(tenant.lastPayment).toLocaleDateString()
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
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tenant payment data available for the selected period
                </p>
              </div>
            )}
          </Card>

          {/* Payment Timeliness */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment Timeliness</h3>

            {payments.filter((payment) => payment.status === "completed")
              .length > 0 ? (
              <div className="space-y-4">
                {/* Calculate payment timeliness */}
                {(() => {
                  const onTimeCount = payments.filter((payment) => {
                    if (payment.status !== "completed" || !payment.dueDate)
                      return false;
                    const dueDate = new Date(payment.dueDate);
                    const paymentDate = new Date(payment.paymentDate);
                    return paymentDate <= dueDate;
                  }).length;

                  const lateCount = payments.filter((payment) => {
                    if (payment.status !== "completed" || !payment.dueDate)
                      return false;
                    const dueDate = new Date(payment.dueDate);
                    const paymentDate = new Date(payment.paymentDate);
                    return paymentDate > dueDate;
                  }).length;

                  const totalCompletedPayments = onTimeCount + lateCount;
                  const onTimePercentage =
                    totalCompletedPayments > 0
                      ? Math.round((onTimeCount / totalCompletedPayments) * 100)
                      : 0;

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            On-Time Payments
                          </h4>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                            {onTimeCount} ({onTimePercentage}%)
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Late Payments
                          </h4>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                            {lateCount} ({100 - onTimePercentage}%)
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-4 bg-green-500 dark:bg-green-600 rounded-full"
                            style={{ width: `${onTimePercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>On-Time: {onTimeCount}</span>
                          <span>Total: {totalCompletedPayments}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No payment timeliness data available for the selected period
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
