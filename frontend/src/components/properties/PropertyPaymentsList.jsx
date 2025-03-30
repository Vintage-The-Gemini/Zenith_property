// frontend/src/components/properties/PropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import { getPaymentsByProperty } from "../../services/paymentService";
import { getTenantsByProperty } from "../../services/tenantService";

const PropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);

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
        getPaymentsByProperty(propertyId),
        getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);

      // Calculate monthly total (completed payments for current month)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        return (
          payment.status === "completed" &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      });

      const pendingPayments = paymentsData.filter(
        (payment) => payment.status === "pending"
      );

      const monthlyTotalAmount = monthlyPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const pendingTotalAmount = pendingPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      setMonthlyTotal(monthlyTotalAmount);
      setPendingTotal(pendingTotalAmount);
    } catch (err) {
      console.error("Error loading payment data:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      // Add property ID to the payment
      const paymentWithProperty = {
        ...paymentData,
        propertyId,
      };

      await setShowForm(false);
      await loadData();
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Failed to create payment. Please try again.");
    }
  };

  // Get status badge for payment
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Filter payments based on search
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();
    const tenantName =
      payment.tenant?.firstName && payment.tenant?.lastName
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
        : "";

    const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
    const reference = payment.reference?.toLowerCase() || "";

    return (
      tenantName.includes(searchLower) ||
      unitNumber.includes(searchLower) ||
      reference.includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (showForm) {
    return (
      <PaymentForm
        onSubmit={handleCreatePayment}
        onCancel={() => setShowForm(false)}
        tenantOptions={tenants}
        initialData={null}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Payments for {propertyName}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Payment
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadData} className="ml-2 text-red-700 underline">
            Try Again
          </button>
        </div>
      )}

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-sm text-gray-500 mb-1">Monthly Revenue</h4>
          <p className="text-2xl font-bold">
            KES {monthlyTotal.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm text-gray-500 mb-1">Pending Payments</h4>
          <p className="text-2xl font-bold">
            KES {pendingTotal.toLocaleString()}
          </p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by recording your first payment
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tenant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.tenant
                        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Unit {payment.unit?.unitNumber || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KES {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {payment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyPaymentsList;
