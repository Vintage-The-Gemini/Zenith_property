import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash,
  Building2,
  Users,
  Home,
  DollarSign,
  Loader2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../services/propertyService";
import PropertyFormModal from "../components/properties/PropertyFormModal";
import Card from "../components/ui/Card";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPropertyById(id);
      setProperty(data);
    } catch (err) {
      console.error("Error loading property:", err);
      setError("Failed to load property details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (updatedData) => {
    try {
      const updated = await updateProperty(id, updatedData);
      setProperty(updated);
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Error updating property:", error);
      throw new Error("Failed to update property");
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await deleteProperty(id);
      navigate("/properties");
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Failed to delete property. Please try again.");
    }
  };

  // Calculate property statistics
  const calculateStats = () => {
    if (!property || !property.floors) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        occupancyRate: 0,
        totalRent: 0,
      };
    }

    const totalUnits = property.floors.reduce(
      (acc, floor) => acc + (floor.units?.length || 0),
      0
    );

    const occupiedUnits = property.floors.reduce(
      (acc, floor) =>
        acc + (floor.units?.filter((unit) => unit.isOccupied)?.length || 0),
      0
    );

    const vacantUnits = totalUnits - occupiedUnits;

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const totalRent = property.floors.reduce(
      (acc, floor) =>
        acc +
        (floor.units?.reduce(
          (sum, unit) =>
            unit.isOccupied ? sum + (unit.monthlyRent || 0) : sum,
          0
        ) || 0),
      0
    );

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      totalRent,
    };
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadProperty}
            className="ml-2 text-red-700 underline"
          >
            Try Again
          </button>
        </div>
        <button
          onClick={() => navigate("/properties")}
          className="mt-4 flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Property Not Found
          </h3>
          <p className="mt-2 text-gray-500">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/properties")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/properties")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {property.name}
            </h1>
            <p className="text-gray-500">{property.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center px-3.5 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-xl font-semibold">{stats.totalUnits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupancy</p>
              <p className="text-xl font-semibold">
                {stats.occupiedUnits}/{stats.totalUnits} ({stats.occupancyRate}
                %)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Vacant Units</p>
              <p className="text-xl font-semibold">{stats.vacantUnits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-xl font-semibold">
                ${stats.totalRent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "units"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Units
          </button>
          <button
            onClick={() => setActiveTab("tenants")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "tenants"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "payments"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "maintenance"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Maintenance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "overview" && (
          <PropertyOverview property={property} stats={stats} />
        )}

        {activeTab === "units" && (
          <PropertyUnits property={property} onPropertyUpdate={loadProperty} />
        )}

        {activeTab === "tenants" && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tenant management will be implemented in the next phase.
            </p>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Payment tracking will be implemented in the next phase.
            </p>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Maintenance requests will be implemented in the next phase.
            </p>
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      <PropertyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleUpdateProperty}
        initialData={property}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Property
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">{property.name}</span>? This action
              cannot be undone and will remove all associated data including
              units, tenants, and payment records.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProperty}
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

// PropertyOverview Component
const PropertyOverview = ({ property, stats }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Property Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Property Type</h4>
            <p className="mt-1">
              {property.type?.charAt(0).toUpperCase() +
                property.type?.slice(1) || "Residential"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1">{property.address}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Units</h4>
            <p className="mt-1">{stats.totalUnits}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Occupied Units
            </h4>
            <p className="mt-1">
              {stats.occupiedUnits} ({stats.occupancyRate}% Occupancy)
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Monthly Revenue
            </h4>
            <p className="mt-1">${stats.totalRent.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date Added</h4>
            <p className="mt-1">
              {new Date(property.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {property.description && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="mt-1 text-gray-700">{property.description}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <p>Recent activity will appear here</p>
        </div>
      </Card>
    </div>
  );
};

// PropertyUnits Component (Placeholder - will be implemented in a separate file)
const PropertyUnits = ({ property, onPropertyUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Units</h3>
        <button className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Unit
        </button>
      </div>

      {property.floors?.length > 0 ? (
        property.floors.map((floor, floorIndex) => (
          <Card key={floorIndex} className="p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Floor {floor.floorNumber}
            </h4>
            {floor.units?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {floor.units.map((unit, unitIndex) => (
                  <div
                    key={unitIndex}
                    className={`p-4 border rounded-lg ${
                      unit.isOccupied
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between">
                      <h5 className="font-medium">Unit {unit.unitNumber}</h5>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          unit.isOccupied
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {unit.isOccupied ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Rent: ${unit.monthlyRent.toLocaleString()}/month
                    </p>
                    {unit.isOccupied && unit.tenant && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm">Tenant: {unit.tenant.name}</p>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      {!unit.isOccupied && (
                        <button className="text-xs text-green-600 hover:text-green-800">
                          Add Tenant
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No units found on this floor.
              </p>
            )}
          </Card>
        ))
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No floors or units added yet.</p>
          <button className="mt-4 inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Floor & Units
          </button>
        </Card>
      )}
    </div>
  );
};

export default PropertyDetail;
