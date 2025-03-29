// frontend/src/pages/Payments.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Card from "../components/ui/Card";
import PaymentForm from "../components/payments/PaymentForm";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import unitService from "../services/unitService";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    tenantId: "",
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payments, tenants and units in parallel
      const [paymentsData, tenantsData, unitsData] = await Promise.all([
        paymentService.getAllPayments(),
        tenantService.getAllTenants(),
        unitService.getUnits(),
      ]);

      setPayments(paymentsData);
      setTenants(tenantsData);
      setUnits(unitsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filteredPayments = await paymentService.getAllPayments(filters);
      setPayments(filteredPayments);
    } catch (err) {
      setError("Failed to apply filters. Please try again.");
    } finally {
      setLoading(false);
      setShowFilters(false);
    }
  };

  const resetFilters = async () => {
    setFilters({
      tenantId: "",
      status: "",
      type: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
    fetchData();
    setShowFilters(false);
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      await paymentService.createPayment(paymentData);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to create payment");
    }
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await paymentService.updatePaymentStatus(id, { status });
      fetchData();
    } catch (err) {
      setError("Failed to update payment status");
    }
  };

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

  // Filter payments based on search term
  const filteredPayments = payments.filter((payment) => {
    const searchTermLower = searchTerm.toLowerCase();

    const tenantName = `${payment.tenant?.firstName || ""} ${
      payment.tenant?.lastName || ""
    }`.toLowerCase();
    const reference = payment.reference?.toLowerCase() || "";
    const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
    const propertyName = payment.property?.name?.toLowerCase() || "";

    return (
      tenantName.includes(searchTermLower) ||
      reference.includes(searchTermLower) ||
      unitNumber.includes(searchTermLower) ||
      propertyName.includes(searchTermLower)
    );
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PaymentForm
          onSubmit={handleCreatePayment}
          onCancel={() => {
            setShowForm(false);
            setSelectedPayment(null);
          }}
          tenantOptions={tenants}
          unitOptions={units}
          initialData={selectedPayment}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage payments for all properties and tenants
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPayment(null);
            setShowForm(true);
          }}
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
        </div>
      )}

      {/* Search and Filters */}
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
          Filters
        </button>
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          onClick={() =>
            alert("CSV export functionality will be implemented soon")
          }
        >
          <Download className="h-5 w-5 mr-2" />
          Export
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Filter Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tenant
              </label>
              <select
                name="tenantId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.tenantId}
                onChange={handleFilterChange}
              >
                <option value="">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="rent">Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="fee">Late Fee</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </Card>
      )}

      {payments.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by recording your first payment
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setSelectedPayment(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">
            No matching payments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria
          </p>
        </Card>
      ) : (
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
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
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
                    {payment.property?.name} - Unit {payment.unit?.unitNumber}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    {payment.status === "pending" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(payment._id, "completed")
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
