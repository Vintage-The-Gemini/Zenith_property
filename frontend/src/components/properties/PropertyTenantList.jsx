// frontend/src/components/properties/PropertyTenantList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";
import Card from "../ui/Card";
import TenantFormModal from "../tenants/TenantFormModal";
import { getTenantsByProperty } from "../../services/tenantService";
import PaymentFormModal from "../tenants/PaymentFormModal";

const PropertyTenantList = ({ propertyId, propertyName }) => {
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
      const data = await getTenantsByProperty(propertyId);
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

  const handleRecordPayment = (tenant) => {
    setSelectedTenant(tenant);
    setShowPaymentModal(true);
  };

  const handleSubmitTenant = async () => {
    await loadTenants();
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = async () => {
    await loadTenants();
    setShowPaymentModal(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Tenants for {propertyName}
        </h3>
        <button
          onClick={handleAddTenant}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Tenant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadTenants} className="ml-2 text-red-700 underline">
            Try Again
          </button>
        </div>
      )}

      {tenants.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first tenant
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddTenant}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Tenant
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTenants.map((tenant) => (
              <Card key={tenant._id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {tenant.firstName} {tenant.lastName}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-1" />
                        {tenant.phone}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full 
                        ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-800"
                            : tenant.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {tenant.status?.charAt(0).toUpperCase() +
                        tenant.status?.slice(1) || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit</span>
                        <span className="font-medium">
                          {tenant.unitId?.unitNumber || "Not assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Rent</span>
                        <span className="font-medium">
                          KES{" "}
                          {tenant.leaseDetails?.rentAmount?.toLocaleString() ||
                            0}
                          /month
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Balance</span>
                        <span className="font-medium">
                          KES {tenant.currentBalance?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 flex justify-between border-t border-gray-100">
                  <button
                    onClick={() => handleRecordPayment(tenant)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Record Payment
                  </button>
                  <button
                    onClick={() =>
                      (window.location.href = `/tenants/${tenant._id}`)
                    }
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <TenantFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitTenant}
          propertyId={propertyId}
          properties={[{ _id: propertyId, name: propertyName }]}
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
