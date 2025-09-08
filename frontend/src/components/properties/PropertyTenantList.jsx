// frontend/src/components/properties/PropertyTenantList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  User,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  Home,
  Calendar,
  Eye,
  CreditCard,
  MapPin,
  Badge,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Card from "../ui/Card";
import TenantFormModal from "../tenants/TenantFormModal";
import PaymentFormModal from "../tenants/PaymentFormModal";
import tenantService from "../../services/tenantService";
import paymentService from "../../services/paymentService";

const PropertyTenantList = ({ propertyId, propertyName, onDataChange }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    if (propertyId) {
      loadTenants();
    }
  }, [propertyId]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenantsByProperty(propertyId);
      setTenants(data);
    } catch (err) {
      console.error("Error loading tenants:", err);
      setError("Failed to load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleRecordPayment = (tenant) => {
    setSelectedTenant(tenant);
    setShowPaymentModal(true);
  };

  const handleSubmitTenant = async () => {
    await loadTenants();
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      await paymentService.createPayment(paymentData);
      
      // Small delay to ensure database updates are committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await loadTenants(); // Refresh tenants to show updated balances
      setShowPaymentModal(false);
      
      // Notify parent component that data has changed
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      // You might want to show an error message to the user here
    }
  };

  // Filter tenants based on search
  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone?.includes(searchTerm)
    );
  });

  // Get status badge component
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <Badge className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-light-primary-900 dark:text-white">
            Property Tenants
          </h3>
          <p className="text-light-primary-600 dark:text-dark-primary-300 mt-1">
            Managing tenants for {propertyName}
          </p>
        </div>
        <button
          onClick={handleAddTenant}
          className="inline-flex items-center px-6 py-3 bg-light-accent-600 dark:bg-dark-accent-600 text-white hover:bg-light-accent-700 dark:hover:bg-dark-accent-700 transition-all duration-200 font-medium shadow-sm rounded-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Tenant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="flex-1">{error}</span>
          <button 
            onClick={loadTenants} 
            className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {tenants.length === 0 ? (
        <Card className="text-center py-16 rounded-xl">
          <div className="max-w-sm mx-auto">
            <Users className="mx-auto h-16 w-16 text-light-primary-400 dark:text-dark-primary-400 mb-4" />
            <h3 className="text-xl font-semibold text-light-primary-900 dark:text-white mb-2">
              No tenants yet
            </h3>
            <p className="text-light-primary-600 dark:text-dark-primary-300 mb-6">
              Get started by adding your first tenant to this property
            </p>
            <button
              onClick={handleAddTenant}
              className="inline-flex items-center px-6 py-3 bg-light-accent-600 dark:bg-dark-accent-600 text-white hover:bg-light-accent-700 dark:hover:bg-dark-accent-700 transition-colors duration-200 font-medium rounded-lg shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Tenant
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Enhanced Search Bar */}
          <Card className="p-4 rounded-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-primary-400 dark:text-dark-primary-400" />
              <input
                type="text"
                placeholder="Search tenants by name, email, or phone number..."
                className="w-full pl-10 pr-4 py-3 border border-light-primary-200 dark:border-dark-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-accent-500 dark:focus:ring-dark-accent-500 focus:border-transparent bg-white dark:bg-dark-primary-900 text-light-primary-900 dark:text-white placeholder-light-primary-400 dark:placeholder-dark-primary-400 transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          {/* Tenant Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 rounded-xl">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-light-primary-500 dark:text-dark-primary-400">Total Tenants</p>
                  <p className="text-2xl font-bold text-light-primary-900 dark:text-white">{tenants.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-light-primary-500 dark:text-dark-primary-400">Active</p>
                  <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                    {tenants.filter(t => t.status === 'active').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-3">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-light-primary-500 dark:text-dark-primary-400">Pending</p>
                  <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                    {tenants.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                  <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-light-primary-500 dark:text-dark-primary-400">Occupied Units</p>
                  <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                    {tenants.filter(t => t.unitId).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Tenant Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <Card key={tenant._id} className="overflow-hidden rounded-xl hover:shadow-lg transition-all duration-200 border-0 ring-1 ring-light-primary-200 dark:ring-dark-primary-700 hover:ring-light-accent-300 dark:hover:ring-dark-accent-500">
                <div className="p-6">
                  {/* Tenant Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-light-accent-400 to-light-accent-600 dark:from-dark-accent-400 dark:to-dark-accent-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {tenant.firstName?.charAt(0)}{tenant.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-light-primary-900 dark:text-white">
                          {tenant.firstName} {tenant.lastName}
                        </h3>
                        <div className="flex items-center mt-1">
                          {getStatusBadge(tenant.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-light-primary-400 dark:text-dark-primary-400" />
                      <span className="text-light-primary-600 dark:text-dark-primary-300 truncate">{tenant.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-light-primary-400 dark:text-dark-primary-400" />
                      <span className="text-light-primary-600 dark:text-dark-primary-300">{tenant.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-3 text-light-primary-400 dark:text-dark-primary-400" />
                      <span className="text-light-primary-600 dark:text-dark-primary-300">
                        {tenant.unitId?.unitNumber ? `Unit ${tenant.unitId.unitNumber}` : "No unit assigned"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-light-primary-50 dark:bg-dark-primary-800 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide font-medium">
                          Monthly Rent
                        </p>
                        <p className="text-lg font-bold text-light-primary-900 dark:text-white">
                          KES {tenant.leaseDetails?.rentAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide font-medium">
                          Current Balance
                        </p>
                        <p className={`text-lg font-bold ${
                          (tenant.currentBalance || 0) > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          KES {Math.abs(tenant.currentBalance || 0).toLocaleString()}
                          {(tenant.currentBalance || 0) < 0 && ' (Credit)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-light-primary-50 dark:bg-dark-primary-800 px-6 py-4 flex justify-between items-center border-t border-light-primary-100 dark:border-dark-primary-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRecordPayment(tenant)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-light-accent-600 dark:text-dark-accent-400 hover:text-light-accent-700 dark:hover:text-dark-accent-300 hover:bg-light-accent-50 dark:hover:bg-dark-accent-900/20 rounded-lg transition-colors duration-200"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </button>
                    <button
                      onClick={() => handleEditTenant(tenant)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  </div>
                  <Link
                    to={`/tenants/${tenant._id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-light-primary-600 dark:text-dark-primary-300 hover:text-light-primary-700 dark:hover:text-dark-primary-200 hover:bg-light-primary-100 dark:hover:bg-dark-primary-700 rounded-lg transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {filteredTenants.length === 0 && searchTerm && (
            <Card className="text-center py-12 rounded-xl">
              <Users className="mx-auto h-12 w-12 text-light-primary-400 dark:text-dark-primary-400 mb-4" />
              <h3 className="text-lg font-medium text-light-primary-900 dark:text-white mb-2">
                No tenants found
              </h3>
              <p className="text-light-primary-600 dark:text-dark-primary-300">
                Try adjusting your search terms or add a new tenant
              </p>
            </Card>
          )}
        </>
      )}

      {isModalOpen && (
        <TenantFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitTenant}
          propertyId={propertyId}
          properties={[{ _id: propertyId, name: propertyName }]}
          initialData={selectedTenant}
        />
      )}

      {showPaymentModal && selectedTenant && (
        <PaymentFormModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
          tenant={selectedTenant}
        />
      )}
    </div>
  );
};

export default PropertyTenantList;
