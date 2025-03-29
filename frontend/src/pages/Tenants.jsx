// frontend/src/pages/Tenants.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  Home,
  Calendar,
  DollarSign,
  Edit,
  Trash,
} from "lucide-react";
import Card from "../components/ui/Card";
import TenantFormModal from "../components/tenants/TenantFormModal";
import { getAllTenants, deleteTenant } from "../services/tenantService";
import { getAllProperties } from "../services/propertyService";
import { getAvailableUnits } from "../services/unitService";

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [filters, setFilters] = useState({
    propertyId: "",
    status: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [tenantsData, propertiesData, unitsData] = await Promise.all([
        getAllTenants(),
        getAllProperties(),
        getAvailableUnits(),
      ]);

      setTenants(tenantsData);
      setProperties(propertiesData);
      setAvailableUnits(unitsData);
    } catch (err) {
      console.error("Error loading tenant data:", err);
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

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await deleteTenant(deleteConfirm.id);
      // Update local state
      setTenants(tenants.filter((tenant) => tenant._id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      setError("Failed to delete tenant. Please try again.");
    }
  };

  const handleSubmitTenant = async (tenantData) => {
    try {
      // Close the modal and refresh data
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving tenant:", error);
      throw new Error(error.message || "Failed to save tenant");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const resetFilters = () => {
    setFilters({
      propertyId: "",
      status: "",
    });
    setSearchTerm("");
  };

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter((tenant) => {
    // Apply search
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    const searchMatch =
      fullName.includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone?.includes(searchTerm);

    // Apply filters
    const propertyMatch = filters.propertyId
      ? tenant.propertyId === filters.propertyId ||
        (tenant.propertyId?._id && tenant.propertyId._id === filters.propertyId)
      : true;

    const statusMatch = filters.status
      ? tenant.status === filters.status
      : true;

    return searchMatch && propertyMatch && statusMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
            onClick={loadData}
            className="ml-2 text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            name="propertyId"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={filters.propertyId}
            onChange={handleFilterChange}
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
          <select
            name="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {/* Filter info and reset */}
      {(filters.propertyId || filters.status || searchTerm) && (
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing filtered results
            {filters.propertyId && " for specific property"}
            {filters.status && ` with status: ${filters.status}`}
            {searchTerm && ` matching: "${searchTerm}"`}
          </p>
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

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
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Reset Filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant._id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {tenant.firstName} {tenant.lastName}
                    </h3>

                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-1" />
                      {tenant.email}
                    </div>

                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-1" />
                      {tenant.phone}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full 
                      ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : tenant.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {tenant.status?.charAt(0).toUpperCase() +
                        tenant.status?.slice(1) || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-start mt-2">
                    <Home className="h-4 w-4 mr-1 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tenant.propertyId?.name ||
                          tenant.unitId?.propertyId?.name ||
                          "No property"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Unit {tenant.unitId?.unitNumber || "Not assigned"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start mt-2">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Lease: {formatDate(tenant.leaseDetails?.startDate)} to{" "}
                        {formatDate(tenant.leaseDetails?.endDate)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Rent: KES{" "}
                        {tenant.leaseDetails?.rentAmount?.toLocaleString() || 0}
                        /month
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 flex justify-end space-x-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleEditTenant(tenant)}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteClick(tenant._id)}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tenant Form Modal */}
      {isModalOpen && (
        <TenantFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitTenant}
          initialData={selectedTenant}
          properties={properties}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Tenant
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this tenant? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tenants;
