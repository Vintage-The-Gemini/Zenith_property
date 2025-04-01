// frontend/src/components/properties/PropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  CreditCard,
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";
import PaymentStatsSummary from "../payments/PaymentStatsSummary";
import PaymentFilters from "../payments/PaymentFilters";
import MonthlyBreakdown from "../payments/MonthlyBreakdown";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import PaymentBalanceSummary from "../payments/PaymentBalanceSummary";
import PaymentTable from "../payments/PaymentTable";
import {
  calculatePaymentSummary,
  calculateMonthlyBreakdown,
  filterPayments,
} from "../payments/PaymentCalculator";

const PropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    tenantId: "",
  });

  // Summary state
  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    varianceTotal: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
    overdueTotal: 0,
    netBalanceTotal: 0,
  });

  // Monthly data state
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    if (propertyId) {
      loadData();
    }
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load payments and tenants in parallel
      const [paymentsData, tenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);

      // Calculate summary statistics
      const summaryData = calculatePaymentSummary(paymentsData, tenantsData);
      setSummary(summaryData);

      // Calculate monthly breakdown
      const monthlyBreakdownData = calculateMonthlyBreakdown(paymentsData);
      setMonthlyData(monthlyBreakdownData);
    } catch (err) {
      console.error("Error loading payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = () => {
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    try {
      // Add property ID to the payment data
      const paymentWithProperty = {
        ...paymentData,
        property: propertyId,
      };

      await paymentService.createPayment(paymentWithProperty);
      setShowForm(false);
      await loadData(); // Refresh data
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(err.message || "Failed to create payment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      await loadData(); // Refresh data
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await exportPropertyPaymentsToCSV(
        propertyId,
        filters.startDate || null,
        filters.endDate || null,
        propertyName
      );
      setExporting(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setError("Failed to export payments data");
      setExporting(false);
    }
  };

  const applyFilters = () => {
    // This is a client-side filter function
    // In a real implementation, this would make an API call with filter parameters
    loadData();
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      startDate: "",
      endDate: "",
      tenantId: "",
    });
    setSearchTerm("");
    loadData();
  };

  // Filter payments based on search and filters
  const filteredPayments = filterPayments(payments, searchTerm, filters);

  if (loading) {
    return <LoadingSpinner message="Loading payment data..." />;
  }

  if (showForm) {
    return (
      <PaymentForm
        onSubmit={handleSubmitPayment}
        onCancel={() => setShowForm(false)}
        tenantOptions={tenants}
        initialData={selectedPayment}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Stats Summary */}
      <PaymentStatsSummary summary={summary} />

      {/* Monthly Breakdown */}
      <MonthlyBreakdown monthlyData={monthlyData} />

      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Transactions</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRecordPayment}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Payment
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter className="h-5 w-5 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        <button
          onClick={loadData}
          title="Refresh payments data"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <PaymentFilters
          filters={filters}
          setFilters={setFilters}
          tenants={tenants}
          resetFilters={resetFilters}
          applyFilters={applyFilters}
        />
      )}

      {/* Payment Balance Summary */}
      <PaymentBalanceSummary
        payments={filteredPayments}
        title="Payment Balance Summary"
      />

      {/* Payments Table or Empty State */}
      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12 text-gray-400" />}
          title="No payments found"
          description="Get started by recording your first payment"
          action={
            <button
              onClick={handleRecordPayment}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          }
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No matching payments"
          description="Try adjusting your search criteria"
          action={
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <PaymentTable
          payments={filteredPayments}
          handleUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default PropertyPaymentsList;
