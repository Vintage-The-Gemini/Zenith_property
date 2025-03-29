// frontend/src/pages/Tenants.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Plus, Search, Loader2, AlertTriangle, 
  Edit, Trash, Eye, CheckCircle, XCircle, Clock 
} from "lucide-react";
import Card from "../components/ui/Card";
import TenantFormModal from "../components/tenants/TenantFormModal";
import tenantService from "../services/tenantService";
import unitService from "../services/unitService";

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
    loadAvailableUnits();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch (err) {
      console.error("Error loading tenants:", err);
      setError("Failed to load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUnits = async () => {
    try {
      const units = await unitService.getAvailableUnits();
      setAvailableUnits(units);
    } catch (err) {
      console.error("Error loading available units:", err);
    }
  };

  const handleAddTenant = () => {
    setSelectedTenant(null);
    setIsFormModalOpen(true);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await tenantService.endTenancy(deleteConfirm.id);
      
      setTenants(tenants.filter(tenant => tenant._id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
      
      // Refresh available units as one might have been freed up
      loadAvailableUnits();
    } catch (error) {
      console.error("Error ending tenancy:", error);
      setError("Failed to remove tenant. Please try again.");
    }
  };

  const handleSubmitTenant = async (tenantData) => {
    try {
      if (selectedTenant) {
        // Update existing tenant
        const updatedTenant = await tenantService.updateTenant(
          selectedTenant._id,
          tenantData
        );
        
        setTenants(
          tenants.map((t) =>
            t._id === selectedTenant._id ? updatedTenant : t
          )
        );
      } else {
        // Create new tenant
        const newTenant = await tenantService.createTenant(tenantData);
        setTenants([...tenants, newTenant]);
      }
      
      // Refresh available units as one might have been occupied
      loadAvailableUnits();
      
      return true;
    } catch (error) {
      console.error("Error saving tenant:", error);
      throw new Error(error.message || "Failed to save tenant");
    }
  };

  // Filter tenants based on search term
  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    const unitNumber = tenant.unitId?.unitNumber?.toLowerCase() || "";
    const email = tenant.email?.toLowerCase() || "";
    const phone = tenant.phone || "";

    return (
      fullName.includes(searchLower) ||
      unitNumber.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "past":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <XCircle className="w-3 h-3 mr-1" />
            Past
          </span>
        );
      default:
        return null;
    }
  };

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
            Tenants
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your property tenants
          </p>
        </div>
        <button
          onClick={handleAddTenant}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          disabled={availableUnits.length === 0}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Tenant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadTenants}
            className="ml-2 text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {availableUnits.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>No available units found. Add units or mark existing ones as available before adding tenants.</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tenants by name, unit, email, or phone..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {tenants.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No tenants
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first tenant
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddTenant}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              disabled={availableUnits.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Tenant
            </button>
          </div>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No matching tenants
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lease Period
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                    // frontend/src/pages/Tenants.jsx (continued)
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-300 font-medium">
                        {tenant.firstName?.charAt(0)}{tenant.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenant.firstName} {tenant.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Joined: {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {tenant.unitId?.propertyId?.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Unit {tenant.unitId?.unitNumber || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {tenant.email}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tenant.leaseDetails?.startDate ? (
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(tenant.leaseDetails.startDate).toLocaleDateString()} - 
                          {tenant.leaseDetails.endDate 
                            ? new Date(tenant.leaseDetails.endDate).toLocaleDateString() 
                            : "Present"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          KES {tenant.leaseDetails.rentAmount?.toLocaleString() || 0}/month
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No lease details</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tenant.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditTenant(tenant)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {tenant.status !== 'past' && (
                      <button
                        onClick={() => handleDeleteClick(tenant._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenant Form Modal */}
      {isFormModalOpen && (
        <TenantFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleSubmitTenant}
          initialData={selectedTenant}
          units={availableUnits}
          propertyId={null} // This would be passed if we are in a property-specific view
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              End Tenancy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to end this tenancy? This will mark the tenant as past and free up the unit for new tenants.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                End Tenancy
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tenants;